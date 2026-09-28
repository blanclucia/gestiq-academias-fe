import { expect, it } from 'vitest'
import { loginSchema, passwordSchema } from './loginValidation'
it('normalizes DNI without losing leading zeroes', () => {
    expect(loginSchema.parse({ dni: '09.000.001', password: '09000001' }).dni).toBe('09000001')
    expect(loginSchema.safeParse({ dni: 'owner@example.com', password: 'something' }).success).toBe(false)
})
it('requires a matching confirmation and enforces bcrypt byte limits', () => {
    expect(passwordSchema.safeParse({ newPassword: '90000001', confirmation: '90000001' }).success).toBe(false)
    expect(passwordSchema.safeParse({ newPassword: 'a-strong-password', confirmation: 'different' }).success).toBe(false)
    expect(passwordSchema.safeParse({ newPassword: 'é'.repeat(37), confirmation: 'é'.repeat(37) }).success).toBe(false)
    expect(passwordSchema.safeParse({ newPassword: 'a-strong-password', confirmation: 'a-strong-password' }).success).toBe(true)
})
