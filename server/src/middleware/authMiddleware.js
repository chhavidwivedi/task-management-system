
import jwt from 'jsonwebtoken'

export function authenticateToken(req, res, next) {
  const authorization = req.headers.authorization

  if (!authorization?.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'Authentication token required',
    })
  }

  const token = authorization.slice(7)

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({
      message: 'Invalid or expired token',
    })
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      message: 'Administrator access required',
    })
  }

  next()
}
