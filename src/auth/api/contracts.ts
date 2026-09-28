import { z } from 'zod'

export const roleSchema = z.enum(['admin', 'teacher', 'student'])
export const modeSchema = z.enum(['ADMINISTRATION', 'TEACHER', 'STUDENT'])
export const organizationSchema = z.object({ id: z.string(), slug: z.string(), name: z.string(), productType: z.enum(['academy', 'gym']) })
export const tokenPairSchema = z.object({
    accessToken: z.string().regex(/^a_[A-Za-z0-9_-]{43}$/),
    refreshToken: z.string().regex(/^r_[A-Za-z0-9_-]{43}$/),
    tokenType: z.literal('Bearer'), expiresIn: z.number().positive(), refreshExpiresIn: z.number().positive(),
})
export const loginResponseSchema = z.union([
    tokenPairSchema.extend({ mustChangePassword: z.literal(false) }),
    z.object({ mustChangePassword: z.literal(true), changePasswordToken: z.string().regex(/^p_[A-Za-z0-9_-]{43}$/), expiresIn: z.number().positive() }),
])
export const sessionSchema = z.object({
    user: z.object({ id: z.string(), name: z.string(), email: z.string() }),
    organization: organizationSchema, roles: z.array(roleSchema).min(1),
    administrativeLevel: z.enum(['owner', 'branch_admin']).nullable(),
    availableModes: z.array(modeSchema).min(1), activeMode: modeSchema,
    administrativeAccess: z.object({ level: z.enum(['OWNER', 'BRANCH_ADMIN']), scope: z.enum(['ACADEMY', 'BRANCHES']), branchIds: z.array(z.string()) }).nullable(),
    accessibleBranches: z.array(z.object({ id: z.string(), name: z.string() })), permissions: z.array(z.string()),
})
export type TokenPair = z.infer<typeof tokenPairSchema>
export type Session = z.infer<typeof sessionSchema>
export type LoginInput = { dni: string; password: string; organizationSlug: string }
