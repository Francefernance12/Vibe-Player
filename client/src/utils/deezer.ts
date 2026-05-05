import { Track } from '../types'

/** Resolves a fresh Deezer preview URL for playback. Deezer's CDN URLs are signed
 *  and expire — never trust a stored externalUrl on a deezer-source track.
 *  Returns the original track unchanged if the call fails (best-effort fallback). */
export async function resolveDeezerUrl(track: Track): Promise<Track> {
  if (track.source !== 'deezer') return track
  try {
    const r = await fetch(`/api/deezer/track/${encodeURIComponent(track.id)}`)
    if (!r.ok) return track
    const { previewUrl } = await r.json() as { previewUrl?: string }
    if (!previewUrl) return track
    return { ...track, externalUrl: previewUrl, filename: previewUrl }
  } catch { return track }
}
