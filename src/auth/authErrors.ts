import { ApiError } from '@/services/http/client'
export function authErrorMessage(error: unknown) {
    if (error instanceof ApiError) {
        if (error.status === 401) return 'DNI o contraseña incorrectos, o el acceso venció. Volvé a ingresar.'
        if (error.status === 403) return 'Tu cuenta no tiene acceso a esta academia.'
        if (error.status === 429) return `Demasiados intentos. Esperá ${error.retryAfter || '60'} segundos antes de volver a intentar.`
        if (error.status === 422) return 'Revisá el DNI y los datos ingresados.'
    }
    return 'No pudimos conectar con la academia. Intentá nuevamente en unos momentos.'
}
