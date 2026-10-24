import taskRoutes from './routes/taskRoutes.js'
import express from 'express'
import cors from 'cors'
import authRoutes from './routes/authRoutes.js'

const app = express()

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
}))

app.use(express.json())

// Health check route
app.get('/', (req, res) => {
  res.send('Task Management API is running!')
})

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Task Management API is running',
  })
})

// Authentication routes
app.use('/api/auth', authRoutes)

app.use('/api/tasks', taskRoutes)

// Error-handling middleware — keep this at the bottom
app.use((err, req, res, next) => {
  console.error(err.message)

  res.status(500).json({
    message: 'Internal server error',
  })
})

export default app
