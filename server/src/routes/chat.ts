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
    ? `\n\nUSER'S MUSIC LIBRARY (${library.length} tracks):\n${library.slice(0, 40).map(t => `  id:${t.id} | ${t.name}`).join('\n')}`
    : ''

  const playlistSection = playlists?.length
    ? `\n\nUSER'S PLAYLISTS:\n${playlists.map(p => `  id:${p.id} | ${p.name}`).join('\n')}`
    : ''

  const actionInstructions = `\n\nACTION RULES — read carefully and follow exactly:

When the user's intent is clear, you MUST emit exactly ONE action tag as the very last line of your response. Nothing comes after the action tag.

RULE 1 — User wants to PLAY a track from their library:
<action>{"type":"play","trackId":"PUT_THE_ACTUAL_ID_HERE"}</action>

RULE 2 — User wants to SEARCH for music (artists, songs, genres, moods):
<action>{"type":"search","query":"PUT_THE_ACTUAL_SEARCH_TERMS_HERE"}</action>

RULE 3 — User wants to ADD a track to a playlist:
<action>{"type":"add_to_playlist","trackId":"PUT_THE_ACTUAL_TRACK_ID_HERE","playlistId":"PUT_THE_ACTUAL_PLAYLIST_ID_HERE"}</action>

CRITICAL CONSTRAINTS:
- Replace the quoted placeholder text with real values from the library/playlist lists above.
- Do NOT wrap the action tag in backticks, markdown, or code blocks.
- Do NOT invent track IDs. If the track is not in the library list, say so in plain text and do NOT emit a play/add action.
- Do NOT emit an action for general questions or recommendations — only when the user explicitly asks to play, search, or add.`

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
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.slice(-20),
      ],
      max_tokens: 400,
    })

    const reply = completion.choices[0]?.message?.content ?? ''
    res.json({ reply })
  } catch (err) {
    next(err)
  }
})

export default router
