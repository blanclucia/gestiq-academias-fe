type EnrollmentAvailabilityInput = {
    exists: boolean
    status?: string
    date: string
    startDate?: string
    endDate?: string
    commissionCount: number
    commissionSelected: boolean
    selectedCommissionExists: boolean
    hasCapacity: boolean
}

export function resolveEnrollmentAvailability(input: EnrollmentAvailabilityInput) {
    if (!input.exists) return { available: false, reason: 'Este link no existe o ya no está vigente.' }
    if (input.status !== 'Abierta') return { available: false, reason: 'Las inscripciones no se encuentran abiertas en este momento.' }
    if (!input.startDate || !input.endDate || input.date < input.startDate || input.date > input.endDate) return { available: false, reason: 'El período de inscripción no está vigente.' }
    if (input.commissionCount === 0) return { available: false, reason: 'No hay comisiones vigentes durante este período de inscripción.' }
    if (input.commissionSelected && !input.selectedCommissionExists) return { available: false, reason: 'La comisión seleccionada no está disponible.' }
    if (!input.hasCapacity) return { available: false, reason: input.commissionSelected ? 'No quedan cupos disponibles para esta comisión.' : 'No quedan cupos en las comisiones disponibles.' }
    return { available: true, reason: '' }
}
