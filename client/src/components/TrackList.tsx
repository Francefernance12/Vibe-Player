import { memo, useState, useCallback, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Track } from '../types'
import { usePlaylist } from '../contexts/PlaylistContext'
import { Tooltip, TrackInfoCard } from './Tooltip'

interface Props {
  tracks: Track[]
  currentTrack: Track | null
  onSelect: (track: Track) => void
  onDelete: (track: Track) => void
}

function formatSize(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
      <path d="M13.5 3.5L6 11 2.5 7.5l-1 1L6 13l8.5-8.5-1-1z" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
      <path d="M8.5 3.5v4h4v1h-4v4h-1v-4h-4v-1h4v-4h1z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
      <path d="M6 2a1 1 0 0 0-1 1v.5H2.5v1H4v8a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-8h1.5v-1H11V3a1 1 0 0 0-1-1H6zm0 1h4v.5H6V3zm-1 2h6v7.5H5V5zm2 1.5v4h1v-4H7zm2 0v4h1v-4H9z" />
    </svg>
  )
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
      <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 3a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm-1 3h2v4H7V7z" />
    </svg>
  )
}

function DotsIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
      <circle cx="8" cy="3" r="1.3" />
      <circle cx="8" cy="8" r="1.3" />
      <circle cx="8" cy="13" r="1.3" />
    </svg>
  )
}

interface MobileMenuPos { x: number; y: number }

function MobileMenu({
  pos,
  inAny,
  onInfo,
  onAdd,
  onDelete,
  onClose,
}: {
  pos: MobileMenuPos
  inAny: boolean
  onInfo: () => void
  onAdd: () => void
  onDelete: () => void
  onClose: () => void
}) {
  const menuRef = useRef<HTMLDivElement>(null)

  // Close on outside tap
  useEffect(() => {
    function handler(e: TouchEvent | MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('touchstart', handler)
    document.addEventListener('mousedown', handler)
    return () => {
      document.removeEventListener('touchstart', handler)
      document.removeEventListener('mousedown', handler)
    }
  }, [onClose])

  // Position: right-aligned to button, above or below based on space
  const MENU_HEIGHT = 120
  const MENU_WIDTH = 160
  const spaceBelow = window.innerHeight - pos.y
  const showAbove = spaceBelow < MENU_HEIGHT + 8

  const style: React.CSSProperties = {
    position: 'fixed',
    right: window.innerWidth - pos.x,
    top: showAbove ? pos.y - MENU_HEIGHT - 4 : pos.y + 4,
    width: MENU_WIDTH,
    zIndex: 9999,
  }

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9998]" onClick={onClose} />
      <div
        ref={menuRef}
        style={style}
        className="z-[9999] bg-[#111113] border border-[#2a2a2f] rounded-xl shadow-2xl shadow-black/80 overflow-hidden animate-fade-in"
      >
        <button
          onClick={() => { onInfo(); onClose() }}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-zinc-300 hover:text-zinc-100 hover:bg-white/[0.05] transition-colors"
        >
          <span className="text-zinc-500"><InfoIcon /></span>
          Info
        </button>
        <div className="h-px bg-[#1e1e21]" />
        <button
          onClick={() => { onAdd(); onClose() }}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs transition-colors ${
            inAny
              ? 'text-orange-400 hover:text-orange-300 hover:bg-orange-500/5'
              : 'text-zinc-300 hover:text-zinc-100 hover:bg-white/[0.05]'
          }`}
        >
          <span className={inAny ? 'text-orange-400' : 'text-zinc-500'}>
            {inAny ? <CheckIcon /> : <PlusIcon />}
          </span>
          Add to playlist
        </button>
        <div className="h-px bg-[#1e1e21]" />
        <button
          onClick={() => { onDelete(); onClose() }}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-zinc-300 hover:text-red-400 hover:bg-red-400/5 transition-colors"
        >
          <span className="text-zinc-500"><TrashIcon /></span>
          Delete
        </button>
      </div>
    </>,
    document.body
  )
}

function InfoBottomSheet({ track, onClose }: { track: Track; onClose: () => void }) {
  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative w-full max-w-md mb-0 animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-[#111113] border-t border-x border-[#2a2a2f] rounded-t-2xl px-5 pt-4 pb-8">
          <div className="w-8 h-0.5 rounded-full bg-zinc-700 mx-auto mb-4" />
          <p className="text-[8px] font-mono uppercase tracking-[0.18em] text-orange-500/50 mb-3">Track Info</p>
          <TrackInfoCard track={track} />
        </div>
      </div>
    </div>,
    document.body
  )
}

export const TrackList = memo(function TrackList({ tracks, currentTrack, onSelect, onDelete }: Props) {
  const { playlists, addLocal, isInPlaylist } = usePlaylist()
  const [openPickerId, setOpenPickerId] = useState<string | null>(null)
  const [mobileMenuState, setMobileMenuState] = useState<{ trackId: string; pos: MobileMenuPos } | null>(null)
  const [infoTrack, setInfoTrack] = useState<Track | null>(null)

  const inAnyPlaylist = useCallback(
    (trackId: string) => playlists.some(p => isInPlaylist(trackId, p.id)),
    [playlists, isInPlaylist]
  )

  const openMobileMenu = useCallback((e: React.MouseEvent, trackId: string) => {
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect()
    setMobileMenuState({ trackId, pos: { x: rect.right, y: rect.bottom } })
  }, [])

  const closeMobileMenu = useCallback(() => setMobileMenuState(null), [])

  if (tracks.length === 0) {
    return <p className="text-zinc-600 text-sm py-6 text-center">No tracks yet. Upload an audio file to get started.</p>
  }

  return (
    <>
      <ul className="divide-y divide-[#1e1e21]">
        {tracks.map(track => {
          const active = track.filename === currentTrack?.filename
          const pickerOpen = openPickerId === track.id
          const inAny = inAnyPlaylist(track.id)

          return (
            <li key={track.filename} className={`${active ? 'bg-white/[0.03]' : ''}`}>
              <div className="flex items-center gap-3 px-4 py-3">
                <Tooltip
                  content={<TrackInfoCard track={track} />}
                  className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                >
                  <div onClick={() => onSelect(track)} className="flex items-center gap-3 w-full min-w-0">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors ${active ? 'bg-orange-500' : 'bg-zinc-700'}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate transition-colors ${active ? 'text-orange-300' : 'text-zinc-200'}`}>
                        {track.originalName.replace(/\.[^.]+$/, '')}
                      </p>
                      <p className="text-xs text-zinc-600 font-mono">{formatSize(track.size)} · {track.source}</p>
                    </div>
                  </div>
                </Tooltip>

                {/* Desktop: + and trash buttons */}
                <button
                  onClick={() => setOpenPickerId(pickerOpen ? null : track.id)}
                  className={`hidden sm:flex w-6 h-6 rounded-full items-center justify-center flex-shrink-0 transition-colors ${
                    inAny
                      ? 'text-orange-400 hover:text-orange-300 hover:bg-orange-500/10'
                      : 'text-zinc-600 hover:text-orange-400 hover:bg-orange-500/10'
                  }`}
                  aria-label="Add to playlist"
                >
                  {inAny ? <CheckIcon /> : <PlusIcon />}
                </button>
                <button
                  onClick={() => onDelete(track)}
                  className="hidden sm:flex w-6 h-6 rounded-full items-center justify-center flex-shrink-0 text-zinc-700 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                  aria-label="Delete track"
                >
                  <TrashIcon />
                </button>

                {/* Mobile: ⋮ button */}
                <button
                  onClick={e => openMobileMenu(e, track.id)}
                  className="flex sm:hidden w-7 h-7 rounded-full items-center justify-center flex-shrink-0 text-zinc-600 hover:text-zinc-300 active:bg-white/[0.05] transition-colors"
                  aria-label="Track options"
                >
                  <DotsIcon />
                </button>
              </div>

              {/* Inline playlist picker (desktop + triggered from mobile Add) */}
              <div className={`grid transition-[grid-template-rows] duration-150 ease-in-out ${pickerOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                <div className="overflow-hidden">
                  <ul className="px-4 pb-2 flex flex-col gap-1">
                    {playlists.map(playlist => {
                      const already = isInPlaylist(track.id, playlist.id)
                      return (
                        <li key={playlist.id}>
                          <button
                            onClick={() => { if (!already) addLocal(track, playlist.id) }}
                            disabled={already}
                            className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                              already
                                ? 'text-orange-400 bg-orange-500/5 cursor-default'
                                : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]'
                            }`}
                          >
                            <span className={`w-3.5 h-3.5 flex-shrink-0 ${already ? 'text-orange-400' : 'text-transparent'}`}>
                              <CheckIcon />
                            </span>
                            <span className="font-mono truncate">{playlist.name}</span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </div>
            </li>
          )
        })}
      </ul>

      {/* Mobile context menu */}
      {mobileMenuState && (() => {
        const track = tracks.find(t => t.id === mobileMenuState.trackId)
        if (!track) return null
        return (
          <MobileMenu
            pos={mobileMenuState.pos}
            inAny={inAnyPlaylist(track.id)}
            onInfo={() => setInfoTrack(track)}
            onAdd={() => setOpenPickerId(mobileMenuState.trackId)}
            onDelete={() => onDelete(track)}
            onClose={closeMobileMenu}
          />
        )
      })()}

      {/* Mobile info bottom sheet */}
      {infoTrack && (
        <InfoBottomSheet track={infoTrack} onClose={() => setInfoTrack(null)} />
      )}
    </>
  )
})
