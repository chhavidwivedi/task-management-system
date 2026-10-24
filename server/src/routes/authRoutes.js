
import { Router } from 'express'
import { register, login } from '../controllers/authController.js'
import { authenticateToken } from '../middleware/authMiddleware.js'
import pool from '../db.js'

const router = Router()

router.post('/register', register)
router.post('/login', login)

router.get('/me', authenticateToken, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, email, role, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    )

    if (!rows[0]) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json({ user: rows[0] })
  } catch (error) {
    next(error)
  }
})

export default router
