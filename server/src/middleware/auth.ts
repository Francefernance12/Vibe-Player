import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface AuthPayload {
  userId: string
  email: string
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload
    }
  }
}

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET env var is required')
  return secret
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.token
  if (!token) {
    res.status(401).json({ error: 'Not authenticated' })
    return
  }
  try {
    req.user = jwt.verify(token, getJwtSecret()) as AuthPayload
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}
