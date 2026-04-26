import { useState, useRef, useCallback } from 'react'
import { Howl } from 'howler'
import { Track } from '../types'

export function usePlayer(libraryTracks: Track[]) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolumeState] = useState(1)
  const [shuffle, setShuffle] = useState(false)
  const [loopMode, setLoopMode] = useState<'none' | 'track' | 'queue'>('none')

  const howlRef = useRef<Howl | null>(null)
  const shuffleRef = useRef(false)
  const loopModeRef = useRef<'none' | 'track' | 'queue'>('none')
  const queueRef = useRef<Track[]>([])
  const currentTrackRef = useRef<Track | null>(null)
  const volumeRef = useRef(1)
  // Ref to the internal play fn so onend closures can call it without stale deps
  const playInternalRef = useRef<((track: Track) => void) | null>(null)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const createAndPlay = useCallback((track: Track) => {
    howlRef.current?.unload()
    howlRef.current = null

    const src = track.externalUrl
      ? [track.externalUrl]
      : [`/api/tracks/${encodeURIComponent(track.filename)}/stream`]

    const howl = new Howl({
      src,
      html5: true,
      volume: volumeRef.current,
      onplay: () => setIsPlaying(true),
      onpause: () => setIsPlaying(false),
      onstop: () => setIsPlaying(false),
      onend: () => {
        const mode = loopModeRef.current
        const queue = queueRef.current
        const current = currentTrackRef.current

        if (mode === 'track') {
          howlRef.current?.seek(0)
          howlRef.current?.play()
          return
        }

        if (queue.length === 0) {
          setIsPlaying(false)
          return
        }

        const idx = current ? queue.findIndex(t => t.filename === current.filename) : -1
        let next: Track | undefined

        if (shuffleRef.current) {
          const pool = queue.filter((_, i) => i !== idx)
          next = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : queue[0]
        } else {
          const nextIdx = idx + 1
          if (nextIdx < queue.length) {
            next = queue[nextIdx]
          } else if (mode === 'queue') {
            next = queue[0]
          }
        }

        if (next) {
          playInternalRef.current?.(next)
        } else {
          setIsPlaying(false)
        }
      },
    })

    howlRef.current = howl
    howl.play()
    setCurrentTrack(track)
    currentTrackRef.current = track
  }, []) // all state deps are refs or stable setters

  // Keep the ref pointing to the latest createAndPlay (stable, so this is a no-op after first render)
  playInternalRef.current = createAndPlay

  const play = useCallback((track: Track, context?: Track[]) => {
    if (context !== undefined) {
      queueRef.current = context
    } else if (queueRef.current.length === 0) {
      queueRef.current = libraryTracks
    }
    createAndPlay(track)
  }, [createAndPlay, libraryTracks])

  const pause = useCallback(() => howlRef.current?.pause(), [])
  const resume = useCallback(() => howlRef.current?.play(), [])
  const stop = useCallback(() => { howlRef.current?.stop(); setIsPlaying(false) }, [])

  const next = useCallback(() => {
    const queue = queueRef.current
    const current = currentTrackRef.current
    if (queue.length === 0) return

    if (shuffleRef.current) {
      const idx = current ? queue.findIndex(t => t.filename === current.filename) : -1
      const pool = queue.filter((_, i) => i !== idx)
      const pick = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : queue[0]
      createAndPlay(pick)
    } else {
      const idx = current ? queue.findIndex(t => t.filename === current.filename) : -1
      const pick = queue[(idx + 1) % queue.length]
      if (pick) createAndPlay(pick)
    }
  }, [createAndPlay])

  const prev = useCallback(() => {
    const queue = queueRef.current
    const current = currentTrackRef.current
    if (queue.length === 0) return
    const idx = current ? queue.findIndex(t => t.filename === current.filename) : 0
    const pick = queue[(idx - 1 + queue.length) % queue.length]
    if (pick) createAndPlay(pick)
  }, [createAndPlay])

  const seek = useCallback((ratio: number) => {
    const howl = howlRef.current
    if (!howl) return
    const dur = howl.duration()
    if (dur > 0) howl.seek(ratio * dur)
  }, [])

  const setVolume = useCallback((v: number) => {
    volumeRef.current = v
    setVolumeState(v)
    howlRef.current?.volume(v)
  }, [])

  const getDuration = useCallback(() => howlRef.current?.duration() ?? 0, [])
  const getSeek = useCallback(() => {
    const val = howlRef.current?.seek()
    return typeof val === 'number' ? val : 0
  }, [])

  const toggleShuffle = useCallback(() => {
    const next = !shuffleRef.current
    shuffleRef.current = next
    setShuffle(next)
  }, [])

  const cycleLoop = useCallback(() => {
    const modes: Array<'none' | 'track' | 'queue'> = ['none', 'track', 'queue']
    const next = modes[(modes.indexOf(loopModeRef.current) + 1) % modes.length]
    loopModeRef.current = next
    setLoopMode(next)
  }, [])

  return {
    currentTrack, isPlaying, volume, shuffle, loopMode,
    play, pause, resume, stop, next, prev,
    seek, setVolume, getDuration, getSeek,
    toggleShuffle, cycleLoop,
  }
}
