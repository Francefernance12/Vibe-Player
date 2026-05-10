import { Router, Request, Response, NextFunction } from 'express'
import rateLimit from 'express-rate-limit'
import Groq from 'groq-sdk'
import { authMiddleware } from '../middleware/auth'

const router = Router()

// Uses the default MemoryStore. On Vercel, each cold start creates a new process
// with a fresh counter, so this limit is per-process-instance and is NOT globally
// enforced across concurrent serverless invocations. Sufficient for abuse deterrence
// but not a hard global cap. Replace with a Redis/Upstash store if a global limit
// is required in the future.
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
interface CurrentTrack { id: string; name: string }

interface BuildPromptOpts {
  currentTrack?: CurrentTrack | null
  isPlaying?: boolean
  library?: LibraryTrack[]
  playlists?: PlaylistSummary[]
}

function buildSystemPrompt({ currentTrack, isPlaying, library, playlists }: BuildPromptOpts): string {
  const nowPlayingSection = currentTrack
    ? `\n\nCurrently playing: ${currentTrack.name} (id: ${currentTrack.id}). Playback state: ${isPlaying ? 'playing' : 'paused'}.
When the user refers to "this song", "the current song", "this one", "that one", "this track", or any pronoun about what is playing, you MUST use the id above as the trackId in your action. Do not name-match against the library; use the id.`
    : `\n\nCurrently playing: nothing.
If the user references "this song" or similar without a clear referent, ask them which track they mean in plain text. Do not guess.`

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

RULE 3 — User wants to ADD a track to a SPECIFIC playlist (by name):
<action>{"type":"add_to_playlist","trackId":"PUT_THE_ACTUAL_TRACK_ID_HERE","playlistId":"PUT_THE_ACTUAL_PLAYLIST_ID_HERE"}</action>

RULE 4 — User wants to FAVORITE a track (save / love / add to favorites):
<action>{"type":"add_to_favorites","trackId":"PUT_THE_ACTUAL_TRACK_ID_HERE"}</action>

RULE 5 — Playback control (no parameters):
<action>{"type":"pause"}</action>      pause playback
<action>{"type":"resume"}</action>     resume after pause
<action>{"type":"next"}</action>       skip to next track
<action>{"type":"prev"}</action>       go to previous track

CRITICAL CONSTRAINTS:
- Replace the quoted placeholder text with real values from the context above.
- Do NOT wrap the action tag in backticks, markdown, or code blocks.
- Do NOT invent track IDs. If the track is not in the library list, say so in plain text and do NOT emit a play/add/favorite action.
- Do NOT emit an action for general questions, recommendations, or chitchat — only when the user explicitly asks to perform one of the actions above.
- Use playback-state context: if the user says "play" while already playing, do not re-emit play; if they say "pause" while paused, reply that it's already paused.

ANTI-HALLUCINATION RULE:
- The actions listed above are the ONLY actions you can perform. If the user asks for anything else (create a playlist, rename a track, change the volume, set a rating, share, download, edit metadata, etc.), reply in plain text that the feature isn't available — do NOT invent or emit a fake action tag.`

  return `You are Vibe, a music assistant built into Vibe Player. Help users discover music, understand artists, explore genres, and get insights about songs. Be concise, warm, and enthusiastic.${nowPlayingSection}${librarySection}${playlistSection}${actionInstructions}`
}

/** POST /api/chat — auth-protected, rate-limited music assistant */
router.post('/', authMiddleware, chatRateLimit, async (req: Request, res: Response, next: NextFunction) => {
  const { messages, currentTrack, isPlaying, library, playlists } = req.body as {
    messages: ChatMessage[]
    currentTrack?: CurrentTrack | null
    isPlaying?: boolean
    library?: LibraryTrack[]
    playlists?: PlaylistSummary[]
  }

  if (!Array.isArray(messages)) {
    res.status(400).json({ error: 'messages must be an array' })
    return
  }

  try {
    const groq = getGroqClient()
    const systemPrompt = buildSystemPrompt({ currentTrack, isPlaying, library, playlists })

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
