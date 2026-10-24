
import { z } from 'zod'
import pool from '../db.js'

const taskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(5000).optional().default(''),
  priority: z.enum(['Low', 'Medium', 'High']).optional().default('Medium'),
  status: z.enum(['To Do', 'In Progress', 'Completed']).optional().default('To Do'),
  due_date: z.string().date().nullable().optional(),
  assigned_to: z.number().int().positive().nullable().optional(),
})

function validateTask(body) {
  return taskSchema.safeParse(body)
}

export async function listTasks(req, res, next) {
  try {
    const { status, priority, search, sort = 'asc' } = req.query

    if (status && !['To Do', 'In Progress', 'Completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status filter' })
    }

    if (priority && !['Low', 'Medium', 'High'].includes(priority)) {
      return res.status(400).json({ message: 'Invalid priority filter' })
    }

    if (!['asc', 'desc'].includes(sort)) {
      return res.status(400).json({ message: 'Invalid sort direction' })
    }

    const values = [req.user.id]
    let where = '(t.created_by = $1 OR t.assigned_to = $1)'

    if (status) {
      values.push(status)
      where += ` AND t.status = $${values.length}`
    }

    if (priority) {
      values.push(priority)
      where += ` AND t.priority = $${values.length}`
    }

    if (search) {
      values.push(`%${search}%`)
      where += ` AND t.title ILIKE $${values.length}`
    }

    const query = `
      SELECT t.*, u.name AS assignee_name
      FROM tasks t
      LEFT JOIN users u ON u.id = t.assigned_to
      WHERE ${where}
      ORDER BY t.due_date ${sort === 'desc' ? 'DESC' : 'ASC'} NULLS LAST,
               t.created_at DESC
    `

    const { rows } = await pool.query(query, values)
    res.json({ tasks: rows })
  } catch (error) {
    next(error)
  }
}

export async function getTask(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM tasks
       WHERE id = $1
       AND (created_by = $2 OR assigned_to = $2)`,
      [req.params.id, req.user.id]
    )

    if (!rows[0]) {
      return res.status(404).json({ message: 'Task not found' })
    }

    res.json({ task: rows[0] })
  } catch (error) {
    next(error)
  }
}

export async function createTask(req, res, next) {
  try {
    const parsed = validateTask(req.body)

    if (!parsed.success) {
      return res.status(400).json({
        message: 'Invalid task details',
        errors: parsed.error.issues.map(i => i.message),
      })
    }

    const task = parsed.data
    const assignee = task.assigned_to ?? req.user.id

    const { rows: users } = await pool.query(
      'SELECT id FROM users WHERE id = $1',
      [assignee]
    )

    if (!users[0]) {
      return res.status(400).json({ message: 'Assignee does not exist' })
    }

    const { rows } = await pool.query(
      `INSERT INTO tasks
       (title, description, priority, status, due_date, created_by, assigned_to)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        task.title,
        task.description,
        task.priority,
        task.status,
        task.due_date ?? null,
        req.user.id,
        assignee,
      ]
    )

    res.status(201).json({ message: 'Task created', task: rows[0] })
  } catch (error) {
    next(error)
  }
}

export async function updateTask(req, res, next) {
  try {
    const parsed = taskSchema.partial().strict().safeParse(req.body)

    if (!parsed.success || Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: 'Invalid task update' })
    }

    const task = parsed.data

    if (task.assigned_to !== undefined && task.assigned_to !== null) {
      const { rows: users } = await pool.query(
        'SELECT id FROM users WHERE id = $1',
        [task.assigned_to]
      )

      if (!users[0]) {
        return res.status(400).json({ message: 'Assignee does not exist' })
      }
    }

    const fields = {
      title: 'title',
      description: 'description',
      priority: 'priority',
      status: 'status',
      due_date: 'due_date',
      assigned_to: 'assigned_to',
    }

    const values = []
    const sets = []

    for (const [key, value] of Object.entries(task)) {
      values.push(value)
      sets.push(`${fields[key]} = $${values.length}`)
    }

    
    values.push(req.params.id, req.user.id, req.user.role)

    const { rows } = await pool.query(
       `UPDATE tasks SET ${sets.join(', ')}, updated_at = NOW()
        WHERE id = $${values.length - 2}
        AND (created_by = $${values.length - 1} OR $${values.length} = 'admin')
        RETURNING *`,
        values
    )


    if (!rows[0]) {
      return res.status(404).json({
        message: 'Task not found or you are not allowed to edit it',
      })
    }

    res.json({ message: 'Task updated', task: rows[0] })
  } catch (error) {
    next(error)
  }
}

export async function deleteTask(req, res, next) {
  try {
    const { rows } = await pool.query(
      
        `DELETE FROM tasks
        WHERE id = $1  
        AND (created_by = $2 OR $3 = 'admin')
        RETURNING id`,
        [req.params.id, req.user.id, req.user.role]

    )

    if (!rows[0]) {
      return res.status(404).json({
        message: 'Task not found or you are not allowed to delete it',
      })
    }

    res.json({ message: 'Task deleted successfully' })
  } catch (error) {
    next(error)
  }
}

export async function taskStats(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status != 'Completed')::int AS pending,
        COUNT(*) FILTER (WHERE status = 'Completed')::int AS completed,
        COUNT(*) FILTER (
          WHERE status != 'Completed' AND due_date < CURRENT_DATE
        )::int AS overdue
       FROM tasks
       WHERE created_by = $1 OR assigned_to = $1`,
      [req.user.id]
    )

    res.json({ stats: rows[0] })
  } catch (error) {
    next(error)
  }
}
export const listUsers = async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT id, name, role FROM users ORDER BY name'
    )

    res.json({ users: result.rows })
  } catch (error) {
    next(error)
  }
}