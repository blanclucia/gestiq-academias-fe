import { describe, expect, it } from 'vitest'
import { commissionStatusFromApi, commissionStatusToApi, courseStatusFromApi, courseStatusToApi, cycleStatusFromApi, cycleStatusToApi, enrollmentStatusFromApi, enrollmentStatusToApi } from './academicOffersMapping'

describe('academic offers status mapping', () => {
    it('maps cycle status both ways', () => {
        expect(cycleStatusToApi('Borrador')).toBe('draft')
        expect(cycleStatusToApi('Activo')).toBe('active')
        expect(cycleStatusToApi('Cerrado')).toBe('closed')
        expect(cycleStatusFromApi('draft')).toBe('Borrador')
        expect(cycleStatusFromApi('active')).toBe('Activo')
        expect(cycleStatusFromApi('closed')).toBe('Cerrado')
    })
    it('maps course status both ways', () => {
        expect(courseStatusToApi('Activo')).toBe('active')
        expect(courseStatusToApi('Borrador')).toBe('draft')
        expect(courseStatusToApi('Cerrado')).toBe('closed')
        expect(courseStatusFromApi('active')).toBe('Activo')
        expect(courseStatusFromApi('draft')).toBe('Borrador')
        expect(courseStatusFromApi('closed')).toBe('Cerrado')
    })
    it('maps commission status both ways', () => {
        expect(commissionStatusToApi('Activa')).toBe('active')
        expect(commissionStatusToApi('Programada')).toBe('scheduled')
        expect(commissionStatusToApi('Cerrada')).toBe('closed')
        expect(commissionStatusFromApi('active')).toBe('Activa')
        expect(commissionStatusFromApi('scheduled')).toBe('Programada')
        expect(commissionStatusFromApi('closed')).toBe('Cerrada')
    })
    it('maps enrollment (roster) status both ways', () => {
        expect(enrollmentStatusToApi('Activo')).toBe('active')
        expect(enrollmentStatusToApi('Pausado')).toBe('paused')
        expect(enrollmentStatusToApi('Finalizado')).toBe('finished')
        expect(enrollmentStatusToApi('Baja')).toBe('dropped')
        expect(enrollmentStatusFromApi('active')).toBe('Activo')
        expect(enrollmentStatusFromApi('paused')).toBe('Pausado')
        expect(enrollmentStatusFromApi('finished')).toBe('Finalizado')
        expect(enrollmentStatusFromApi('dropped')).toBe('Baja')
    })
})
