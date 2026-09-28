import { describe, expect, it } from 'vitest'
import { openingStatusFromApi, openingStatusToApi } from './enrollmentsMapping'

describe('enrollment opening status mapping', () => {
    it('maps every status both ways', () => {
        const pairs: Array<['Abierta' | 'Programada' | 'Cerrada', 'open' | 'scheduled' | 'closed']> = [
            ['Abierta', 'open'], ['Programada', 'scheduled'], ['Cerrada', 'closed'],
        ]
        for (const [es, en] of pairs) {
            expect(openingStatusToApi(es)).toBe(en)
            expect(openingStatusFromApi(en)).toBe(es)
        }
    })
})
