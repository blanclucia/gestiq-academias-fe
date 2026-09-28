import { describe, expect, it } from 'vitest'
import { privateLessonPlanFromApi, privateLessonPlanToApi, privateLessonStatusFromApi, privateLessonStatusToApi } from './privateLessonsMapping'

describe('private lesson plan and status mapping', () => {
    it('maps every plan both ways', () => {
        const pairs: Array<[string, 'single' | 'monthly' | 'pack4' | 'pack8' | 'pack12']> = [
            ['Clase individual', 'single'], ['Plan mensual', 'monthly'], ['Pack 4 clases', 'pack4'], ['Pack 8 clases', 'pack8'], ['Pack 12 clases', 'pack12'],
        ]
        for (const [es, en] of pairs) {
            expect(privateLessonPlanToApi(es)).toBe(en)
            expect(privateLessonPlanFromApi(en)).toBe(es)
        }
    })
    it('maps status both ways', () => {
        expect(privateLessonStatusToApi('Activa')).toBe('active')
        expect(privateLessonStatusToApi('Finalizada')).toBe('finished')
        expect(privateLessonStatusFromApi('active')).toBe('Activa')
        expect(privateLessonStatusFromApi('finished')).toBe('Finalizada')
    })
    it('falls back "Pausada" (unreachable from the backend) to active', () => {
        expect(privateLessonStatusToApi('Pausada')).toBe('active')
    })
})
