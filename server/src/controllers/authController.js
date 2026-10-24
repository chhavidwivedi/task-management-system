
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import pool from '../db.js'

const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().transform(v => v.toLowerCase()),
  password: z.string().min(8).max(72),
})

const loginSchema = z.object({
  email: z.string().trim().email().transform(v => v.toLowerCase()),
  password: z.string().min(1).max(72),
})

function createToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  )
}

export async function register(req, res, next) {
  try {
    const result = registerSchema.safeParse(req.body)

    if (!result.success) {
      return res.status(400).json({
        message: 'Invalid registration details',
        errors: result.error.issues.map(issue => issue.message),
      })
    }

    const { name, email, password } = result.data
    const passwordHash = await bcrypt.hash(password, 12)

    const query = `
      INSERT INTO users (name, email, password_hash)
      VALUES ($1, $2, $3)
      RETURNING id, name, email, role, created_at
    `

    const { rows } = await pool.query(query, [
      name,
      email,
      passwordHash,
    ])

    const user = rows[0]

    return res.status(201).json({
      message: 'Registration successful',
      user,
      token: createToken(user),
    })
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        message: 'An account with this email already exists',
      })
    }

    next(error)
  }
}

export async function login(req, res, next) {
  try {
    const result = loginSchema.safeParse(req.body)

    if (!result.success) {
      return res.status(400).json({
        message: 'Please provide a valid email and password',
      })
    }

    const { email, password } = result.data

    const { rows } = await pool.query(
      `SELECT id, name, email, password_hash, role
       FROM users WHERE email = $1`,
      [email]
    )

    const user = rows[0]

if (!user) {
  console.log('Login failed: user not found')

  return res.status(401).json({
    message: 'Invalid email or password',
  })
}

const passwordMatches = await bcrypt.compare(
  password,
  user.password_hash
)

console.log('Password matches:', passwordMatches)

if (!passwordMatches) {
  return res.status(401).json({
    message: 'Invalid email or password',
  })
}

    const { password_hash, ...safeUser } = user

    return res.status(200).json({
      message: 'Login successful',
      user: safeUser,
      token: createToken(user),
    })
  } catch (error) {
    next(error)
  }
}
