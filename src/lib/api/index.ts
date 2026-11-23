const messages = {
  'sign-in-required': 'Hãy đăng nhập để thực hiện thao tác này.',
  forbidden: 'Bạn không có quyền thực hiện thao tác này.',
  'rate-limited': 'Bạn thao tác quá nhanh. Hãy thử lại sau.',
  unavailable: 'Máy chủ Mạch Mở hiện chưa khả dụng. Hãy thử lại sau.',
  'not-found': 'Không tìm thấy mục được yêu cầu.',
  rejected: 'Máy chủ chưa xử lý được yêu cầu.',
} as const

export class ApiError extends Error {
  readonly code: keyof typeof messages
  readonly status: number | null

  constructor(code: keyof typeof messages, status: number | null = null) {
    super(messages[code])
    this.name = 'ApiError'
    this.code = code
    this.status = status
  }
}

export async function apiRequest(path: string, options: RequestInit = {}, acceptedStatuses: readonly number[] = []): Promise<Response> {
  if (!path.startsWith('/api/') || path.includes('\\')
    || !new URL(path, 'https://same-origin.invalid').pathname.startsWith('/api/')) {
    throw new TypeError('Expected a same-origin /api/ path')
  }
  let response: Response
  try {
    response = await fetch(path, { cache: 'no-store', ...options, redirect: 'error', credentials: 'include' })
  } catch {
    if (options.signal?.aborted && options.signal.reason?.name === 'AbortError') throw options.signal.reason
    throw new ApiError('unavailable')
  }
  const { status } = response
  if (response.ok || acceptedStatuses.includes(status)) return response
  if (status === 401) throw new ApiError('sign-in-required', status)
  if (status === 403) throw new ApiError('forbidden', status)
  if (status === 429) throw new ApiError('rate-limited', status)
  if (status === 404) throw new ApiError('not-found', status)
  throw new ApiError(status >= 500 ? 'unavailable' : 'rejected', status)
}

export async function readApiJson<T>(response: Response): Promise<T> {
  if (!response.headers.get('content-type')?.includes('application/json')) throw new ApiError('unavailable', response.status)
  try {
    return await response.json() as T
  } catch {
    throw new ApiError('unavailable', response.status)
  }
}
