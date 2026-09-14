// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { readStoredValue, writeStoredValue } from './storage'

describe('repository storage', () => {
    beforeEach(() => window.localStorage.clear())

    it('returns the fallback for missing or corrupt data', () => {
        expect(readStoredValue('missing', { value: 1 })).toEqual({ value: 1 })
        window.localStorage.setItem('corrupt', '{')
        expect(readStoredValue('corrupt', [])).toEqual([])
    })

    it('round-trips serializable state', () => {
        writeStoredValue('state', { active: true })
        expect(readStoredValue('state', null)).toEqual({ active: true })
    })
})
