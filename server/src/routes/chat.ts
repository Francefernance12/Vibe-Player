import { Router, Request, Response, NextFunction } from 'express'
import rateLimit from 'express-rate-limit'
import Groq from 'groq-sdk'
import { authMiddleware } from '../middleware/auth'

const router = Router()

const chatRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  keyGenerator: (req: Request) => req.user?.userId ?? 'anonymous',
  validate: { xForwardedForHeader: false },
  handler: (_req, res) => {
    res.status(429).json({ error: 'Rate limit reached. Try again in a minute.' })
  },
})

let _groq: Groq | null = null

function getGroqClient(): Groq {
  if (_groq) return _groq
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('GROQ_API_KEY env var is required')
  _groq = new Groq({ apiKey })
  return _groq
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface LibraryTrack { id: string; name: string }
interface PlaylistSummary { id: string; name: string }

function buildSystemPrompt(trackName?: string, library?: LibraryTrack[], playlists?: PlaylistSummary[]): string {
  const librarySection = library?.length
    ? `\n\nUser's music library:\n${library.slice(0, 40).map(t => `- id:${t.id} | ${t.name}`).join('\n')}`
    : ''

  const playlistSection = playlists?.length
    ? `\n\nUser's playlists:\n${playlists.map(p => `- id:${p.id} | ${p.name}`).join('\n')}`
    : ''

  const actionInstructions = `\n\nWhen the user asks to play a track, add a track to a playlist, or search for music, append ONE action tag at the very end of your response:
Play a library track: <action>{"type":"play","trackId":"EXACT_ID_FROM_LIBRARY"}</action>
Add to playlist: <action>{"type":"add_to_playlist","trackId":"EXACT_ID_FROM_LIBRARY","playlistId":"EXACT_PLAYLIST_ID"}</action>
Search Deezer: <action>{"type":"search","query":"search terms"}</action>
Only include an action when explicitly asked. Never invent IDs — use only exact IDs listed above.`

  return `You are Vibe, a music assistant built into Vibe Player. Help users discover music, understand artists, explore genres, and get insights about songs. Be concise, warm, and enthusiastic. Currently playing: ${trackName ?? 'nothing'}.${librarySection}${playlistSection}${actionInstructions}`
}

/** POST /api/chat — auth-protected, rate-limited music assistant */
router.post('/', authMiddleware, chatRateLimit, async (req: Request, res: Response, next: NextFunction) => {
  const { messages, trackName, library, playlists } = req.body as {
    messages: ChatMessage[]
    trackName?: string
    library?: LibraryTrack[]
    playlists?: PlaylistSummary[]
  }

  if (!Array.isArray(messages)) {
    res.status(400).json({ error: 'messages must be an array' })
    return
  }

  try {
    const groq = getGroqClient()
    const systemPrompt = buildSystemPrompt(trackName, library, playlists)

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.slice(-20),
      ],
      max_tokens: 512,
    })

    const reply = completion.choices[0]?.message?.content ?? ''
    res.json({ reply })
  } catch (err) {
    next(err)
  }
})

export default router
