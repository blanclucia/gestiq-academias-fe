// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { applyCachedBrandColors, cacheBrandColors, defaultAcademyBrand, readCachedBrandColors } from './brandTheme'

const teal = { ...defaultAcademyBrand, primary: '#0f766e', primaryStrong: '#0b5550', primarySoft: '#0f766e24', accent: '#f59e0b', logoDataUrl: 'data:image/png;base64,AAAA' }

afterEach(() => {
    window.localStorage.clear()
    document.documentElement.removeAttribute('style')
})

describe('brand colors cache', () => {
    it('returns the cached colors for the same organization, without the logo', () => {
        cacheBrandColors('org-1', teal)
        expect(readCachedBrandColors('org-1')).toEqual({ primary: '#0f766e', primaryStrong: '#0b5550', primarySoft: '#0f766e24', primaryContrast: '#ffffff', accent: '#f59e0b' })
    })

    it("never applies another organization's colors", () => {
        cacheBrandColors('org-1', teal)
        expect(readCachedBrandColors('org-2')).toEqual({})
    })

    it('uses the last organization while the session is still unknown', () => {
        cacheBrandColors('org-1', teal)
        expect(readCachedBrandColors().primary).toBe('#0f766e')
    })

    it('applies the cached colors to the root before the app renders', () => {
        cacheBrandColors('org-1', teal)
        applyCachedBrandColors()
        expect(document.documentElement.style.getPropertyValue('--primary')).toBe('#0f766e')
    })

    it('ignores a corrupt cache', () => {
        window.localStorage.setItem('gestiq-academy-brand-colors', '{not json')
        expect(readCachedBrandColors()).toEqual({})
        applyCachedBrandColors()
        expect(document.documentElement.style.getPropertyValue('--primary')).toBe('')
    })
})
