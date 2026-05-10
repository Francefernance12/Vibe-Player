import { renderHook, act, waitFor } from '@testing-library/react'
import { useChat, ChatAction } from '../hooks/useChat'

function mockReply(reply: string) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ reply }),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

test('parses an add_to_favorites action and calls onAction', async () => {
  mockReply('Adding it.\n<action>{"type":"add_to_favorites","trackId":"abc"}</action>')
  const onAction = vi.fn().mockReturnValue('Added.')

  const { result } = renderHook(() => useChat({ onAction }))
  await act(async () => { await result.current.sendMessage('favorite this') })

  await waitFor(() => expect(onAction).toHaveBeenCalled())
  const action = onAction.mock.calls[0][0] as ChatAction
  expect(action.type).toBe('add_to_favorites')
  expect(action.trackId).toBe('abc')
})

test('parses a pause action with no parameters', async () => {
  mockReply('Pausing.\n<action>{"type":"pause"}</action>')
  const onAction = vi.fn().mockReturnValue('Paused.')

  const { result } = renderHook(() => useChat({ onAction }))
  await act(async () => { await result.current.sendMessage('pause') })

  await waitFor(() => expect(onAction).toHaveBeenCalled())
  expect((onAction.mock.calls[0][0] as ChatAction).type).toBe('pause')
})

test('appends a system note to messages from the onAction return value', async () => {
  mockReply('On it.\n<action>{"type":"resume"}</action>')
  const onAction = vi.fn().mockReturnValue('Resumed.')

  const { result } = renderHook(() => useChat({ onAction }))
  await act(async () => { await result.current.sendMessage('resume') })

  await waitFor(() => {
    const note = result.current.messages.find(m => m.kind === 'action')
    expect(note).toBeDefined()
    expect(note?.content).toBe('Resumed.')
  })
})

test('does not append a system note when onAction returns void', async () => {
  mockReply('Hmm.\n<action>{"type":"search","query":""}</action>')
  const onAction = vi.fn().mockReturnValue(undefined)

  const { result } = renderHook(() => useChat({ onAction }))
  await act(async () => { await result.current.sendMessage('search nothing') })

  await waitFor(() => expect(onAction).toHaveBeenCalled())
  const note = result.current.messages.find(m => m.kind === 'action')
  expect(note).toBeUndefined()
})

test('passes currentTrack and isPlaying in the request body', async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ reply: 'ok' }),
  })
  global.fetch = fetchMock

  const { result } = renderHook(() =>
    useChat({ currentTrack: { id: 'x', name: 'Song' }, isPlaying: true })
  )
  await act(async () => { await result.current.sendMessage('hi') })

  await waitFor(() => expect(fetchMock).toHaveBeenCalled())
  const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string)
  expect(body.currentTrack).toEqual({ id: 'x', name: 'Song' })
  expect(body.isPlaying).toBe(true)
})

test('falls back to a parser-failure-safe message when JSON is malformed', async () => {
  mockReply('Trying.\n<action>{this is not valid json}</action>')
  const onAction = vi.fn()

  const { result } = renderHook(() => useChat({ onAction }))
  await act(async () => { await result.current.sendMessage('foo') })

  await waitFor(() => expect(result.current.messages.length).toBeGreaterThan(0))
  expect(onAction).not.toHaveBeenCalled()
  const assistant = result.current.messages.find(m => m.role === 'assistant' && !m.kind)
  expect(assistant?.content).toContain('Trying.')
})
