const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'

export async function apiBlobRequest(path: string, signal?: AbortSignal): Promise<Blob> {
  const token = localStorage.getItem('helpdesk_token')
  const response = await fetch(`${API_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    signal,
  })
  if (!response.ok) {
    const data = await response.json().catch(() => ({})) as { message?: string }
    throw new Error(data.message ?? 'Không thể tải ảnh xem trước.')
  }
  return response.blob()
}

export class ApiError extends Error {
  readonly status: number
  readonly details?: unknown

  constructor(status: number, message: string, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem('helpdesk_token')
  const headers = new Headers(options.headers)

  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${API_URL}${path}`, { ...options, headers })
  const data = (await response.json().catch(() => ({}))) as {
    message?: string
    details?: unknown
  }

  if (!response.ok) {
    throw new ApiError(
      response.status,
      data.message ?? 'Không thể xử lý yêu cầu',
      data.details,
    )
  }

  return data as T
}
