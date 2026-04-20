import { useState, useRef, useCallback } from 'react'
import { Howl } from 'howler'
import { Track } from '../types'

export interface PlayerState {
  currentTrack: Track | null
  isPlaying: boolean
  volume: number
}

export interface PlayerControls {
  play: (track: Track) => void
  pause: () => void
  resume: () => void
  stop: () => void
  next: () => void
  prev: () => void
  seek: (ratio: number) => void
  setVolume: (v: number) => void
  getDuration: () => number
  getSeek: () => number
}

export function usePlayer(tracks: Track[]): PlayerState & PlayerControls {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolumeState] = useState(1)
  const howlRef = useRef<Howl | null>(null)

  const destroyHowl = () => {
    howlRef.current?.unload()
    howlRef.current = null
  }

  const play = useCallback((track: Track) => {
    destroyHowl()
    const howl = new Howl({
      src: [`/api/tracks/${encodeURIComponent(track.filename)}/stream`],
      html5: true,
      volume,
      onplay: () => setIsPlaying(true),
      onpause: () => setIsPlaying(false),
      onstop: () => setIsPlaying(false),
      onend: () => setIsPlaying(false),
    })
    howlRef.current = howl
    howl.play()
    setCurrentTrack(track)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [volume])

  const pause = useCallback(() => howlRef.current?.pause(), [])
  const resume = useCallback(() => howlRef.current?.play(), [])
  const stop = useCallback(() => { howlRef.current?.stop(); setIsPlaying(false) }, [])

  const next = useCallback(() => {
    if (!currentTrack || tracks.length === 0) return
    const idx = tracks.findIndex(t => t.filename === currentTrack.filename)
    const next = tracks[(idx + 1) % tracks.length]
    if (next) play(next)
  }, [currentTrack, tracks, play])

  const prev = useCallback(() => {
    if (!currentTrack || tracks.length === 0) return
    const idx = tracks.findIndex(t => t.filename === currentTrack.filename)
    const prev = tracks[(idx - 1 + tracks.length) % tracks.length]
    if (prev) play(prev)
  }, [currentTrack, tracks, play])

  const seek = useCallback((ratio: number) => {
    const howl = howlRef.current
    if (!howl) return
    const dur = howl.duration()
    if (dur > 0) howl.seek(ratio * dur)
  }, [])

  const setVolume = useCallback((v: number) => {
    setVolumeState(v)
    howlRef.current?.volume(v)
  }, [])

  const getDuration = useCallback(() => howlRef.current?.duration() ?? 0, [])
  const getSeek = useCallback(() => {
    const val = howlRef.current?.seek()
    return typeof val === 'number' ? val : 0
  }, [])

  return {
    currentTrack, isPlaying, volume,
    play, pause, resume, stop, next, prev,
    seek, setVolume, getDuration, getSeek,
  }
}
