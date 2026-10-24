
import { Router } from 'express'
import { authenticateToken } from '../middleware/authMiddleware.js'
import {
  listTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  taskStats,
  listUsers
} from '../controllers/taskController.js'

const router = Router()

router.use(authenticateToken)

router.get('/stats', taskStats)
router.get('/users', listUsers)
router.get('/', listTasks)
router.get('/:id', getTask)
router.post('/', createTask)
router.put('/:id', updateTask)
router.delete('/:id', deleteTask)

export default router
