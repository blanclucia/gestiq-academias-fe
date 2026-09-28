import { z } from 'zod'
export const loginSchema = z.object({
    dni: z.string().transform((value) => value.replace(/[. ]/g, '').trim()).pipe(z.string().regex(/^\d{7,8}$/, 'Ingresá un DNI de 7 u 8 dígitos.')),
    password: z.string().min(1, 'Ingresá tu contraseña.').refine((value) => new TextEncoder().encode(value).length <= 72, 'La contraseña es demasiado larga. Usá una más corta.'),
})
export const passwordSchema = z.object({
    newPassword: z.string().superRefine((value, context) => {
        const length = new TextEncoder().encode(value).length
        const message = !value.trim()
            ? 'Ingresá una contraseña; no puede contener solo espacios.'
            : length < 12
                ? 'Elegí una contraseña más larga. Probá con una frase de 12 caracteres o más.'
                : length > 72
                    ? 'La contraseña es demasiado larga. Usá una frase más corta.'
                    : undefined
        if (message) context.addIssue({ code: 'custom', message })
    }),
    confirmation: z.string(),
}).refine((value) => value.newPassword === value.confirmation, { message: 'Las contraseñas no coinciden.', path: ['confirmation'] })
