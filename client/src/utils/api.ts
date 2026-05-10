/**
 * Tiny fetch helpers that surface server-classified failures.
 *
 * The server returns 503 with `{ error, retryable: true, code: 'DB_UNAVAILABLE' }`
 * when the database is temporarily unavailable. We parse that here so call sites can
 * either let the error propagate to a top-level handler or notify the user directly.
 */

const DEFAULT_DB_DOWN_MESSAGE =
  'Our database is temporarily unavailable. This is a server-side issue, not your fault. Please try again in a moment.'

export class ApiError extends Error {
  readonly status: number
  readonly code?: string
  readonly retryable: boolean

  constructor(status: number, message: string, opts?: { code?: string; retryable?: boolean }) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = opts?.code
    this.retryable = opts?.retryable ?? false
  }
}

export function isDbUnavailable(err: unknown): err is ApiError {
  return err instanceof ApiError && err.code === 'DB_UNAVAILABLE'
}

interface ApiErrorBody {
  error?: string
  code?: string
  retryable?: boolean
}

/**
 * Wraps fetch with credentials: 'include' default. Returns the Response unchanged on
 * success and on most error statuses (callers keep their existing .ok/.status logic).
 * Throws ApiError ONLY when the server signals a known transient/structured failure
 * (currently: 503 with retryable:true), so call sites can choose to notify the user.
 */
export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const res = await fetch(input, { credentials: 'include', ...init })
  if (res.status === 503) {
    const body = await safeJson(res)
    if (body?.retryable) {
      throw new ApiError(res.status, body.error ?? DEFAULT_DB_DOWN_MESSAGE, {
        code: body.code,
        retryable: true,
      })
    }
  }
  return res
}

async function safeJson(res: Response): Promise<ApiErrorBody | null> {
  try {
    // Clone so callers that re-read the body still can.
    return (await res.clone().json()) as ApiErrorBody
  } catch {
    return null
  }
}

/**
 * Helper for `.catch(handleDbError(notify))`. Surfaces transient DB errors as a toast
 * and swallows them; re-throws everything else so real bugs aren't hidden.
 */
export function handleDbError(notify: (n: { type: 'error'; message: string }) => void) {
  return (err: unknown) => {
    if (isDbUnavailable(err)) {
      notify({ type: 'error', message: err.message })
      return
    }
    throw err
  }
}
