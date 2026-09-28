export class ApiError extends Error {
    readonly status: number
    readonly code: string
    readonly retryAfter?: string
    constructor(status: number, code: string, retryAfter?: string) {
        super(code)
        this.status = status
        this.code = code
        this.retryAfter = retryAfter
    }
}

export function createHttpClient(baseUrl: string, fetcher: typeof fetch = (...args) => fetch(...args)) {
    return async function request(path: string, init: RequestInit = {}): Promise<unknown> {
        const headers = new Headers(init.headers)
        headers.set('Accept', 'application/json')
        if (init.body) headers.set('Content-Type', 'application/json')
        const timeout = AbortSignal.timeout(15000)
        const signal = init.signal ? AbortSignal.any([init.signal, timeout]) : timeout
        const response = await fetcher(`${baseUrl.replace(/\/$/, '')}${path}`, { ...init, headers, signal, credentials: 'omit', cache: 'no-store' })
        if (!response.ok) {
            const body = await response.json().catch(() => null)
            throw new ApiError(response.status, body?.error?.code ?? 'request_failed', response.headers.get('Retry-After') ?? undefined)
        }
        return response.status === 204 ? undefined : response.json()
    }
}

export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1'
export const defaultOrganizationSlug = import.meta.env.VITE_ORGANIZATION_SLUG || 'academy-demo'
export const publicRequest = createHttpClient(apiBaseUrl)
