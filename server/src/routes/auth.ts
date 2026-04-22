import { Router, Request, Response } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import rateLimit from 'express-rate-limit'
import { v4 as uuidv4 } from 'uuid'
import { getDb, createUser, getUserByEmail, getUserById, createPlaylist } from '../../db/index'
import { authMiddleware, getJwtSecret } from '../middleware/auth'

const router = Router()
const BCRYPT_ROUNDS = 12
const TOKEN_TTL = '7d'

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
})

function issueToken(userId: string, email: string): string {
  return jwt.sign({ userId, email }, getJwtSecret(), { expiresIn: TOKEN_TTL })
}

function setTokenCookie(res: Response, token: string): void {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  })
}

// POST /api/auth/register
router.post('/register', authRateLimit, async (req: Request, res: Response) => {
  const { email, password } = req.body ?? {}
  if (typeof email !== 'string' || typeof password !== 'string') {
    res.status(400).json({ error: 'email and password are required' })
    return
  }
  const normalised = email.toLowerCase().trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalised)) {
    res.status(400).json({ error: 'Invalid email format' })
    return
  }
  if (password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters' })
    return
  }
  const db = getDb()
  if (getUserByEmail(db, normalised)) {
    res.status(409).json({ error: 'Email already registered' })
    return
  }
  const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS)
  const user = createUser(db, { id: uuidv4(), email: normalised, password_hash })
  // Every new user gets a default Favorites playlist
  createPlaylist(db, { id: uuidv4(), user_id: user.id, name: 'Favorites' })
  const token = issueToken(user.id, user.email)
  setTokenCookie(res, token)
  res.status(201).json({ id: user.id, email: user.email })
})

// POST /api/auth/login
router.post('/login', authRateLimit, async (req: Request, res: Response) => {
  const { email, password } = req.body ?? {}
  if (typeof email !== 'string' || typeof password !== 'string') {
    res.status(400).json({ error: 'email and password are required' })
    return
  }
  const db = getDb()
  const user = getUserByEmail(db, email.toLowerCase().trim())
  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' })
    return
  }
  const match = await bcrypt.compare(password, user.password_hash)
  if (!match) {
    res.status(401).json({ error: 'Invalid credentials' })
    return
  }
  const token = issueToken(user.id, user.email)
  setTokenCookie(res, token)
  res.json({ id: user.id, email: user.email })
})

// POST /api/auth/logout
router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('token')
  res.json({ ok: true })
})

// GET /api/auth/me
router.get('/me', authMiddleware, (req: Request, res: Response) => {
  const db = getDb()
  const user = getUserById(db, req.user!.userId)
  if (!user) {
    res.status(404).json({ error: 'User not found' })
    return
  }
  res.json({ id: user.id, email: user.email })
})

export default router
