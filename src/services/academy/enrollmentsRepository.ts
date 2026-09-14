import { getLocalDateString } from '@/domain/shared/dateRules'
import { initialEnrollmentOpenings, readAcademyState, updateAcademyState } from './academyState'
import type { EnrollmentOpening, PaymentChannel, PublicRegistration } from './academyTypes'
import { listCourses } from './coursesRepository'
import { listStudentsInCommission } from './studentsRepository'
import { getEligibleCommissions } from '@/domain/commissions/commissionRules'
import { resolveEnrollmentAvailability } from '@/domain/enrollments/enrollmentRules'

export type PublicEnrollmentOffer = {
    slug: string
    openingId: string
    courseId: string
    courseName: string
    amount: number
    commissions: Array<{ id: string; name: string; schedule: string; amount: number; capacity: number; startDate: string; endDate: string }>
}

function slugify(value: string) {
    return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export function createPublicRegistration(data: Omit<PublicRegistration, 'id' | 'paid' | 'createdAt' | 'paidAt'>) {
    const registration: PublicRegistration = { ...data, id: `REG-${Date.now()}`, createdAt: getLocalDateString(), paid: false, confirmed: data.confirmed ?? false }
    updateAcademyState((current) => ({ ...current, registrations: [...current.registrations, registration] }))
    return registration
}

export function listPublicRegistrations(openingId?: string) {
    return readAcademyState().registrations.filter((registration) => !openingId || registration.openingId === openingId || getPublicEnrollmentOffer(registration.offerSlug)?.openingId === openingId)
}

export function updatePublicRegistration(id: string, changes: Partial<Omit<PublicRegistration, 'id'>>) {
    updateAcademyState((current) => ({ ...current, registrations: current.registrations.map((registration) => registration.id === id ? { ...registration, ...changes } : registration) }))
}

export function getPaymentRemovalBlocker(id: string) {
    if (!id.startsWith('PAY-REG-')) return null
    return readAcademyState().registrations.some((registration) => registration.id === id.slice(4))
        ? 'Este pago pertenece a una autoinscripción. Cancelá la reserva desde la inscripción antes de eliminarlo.' : null
}

export function confirmPayment(id: string, paymentMethod: PaymentChannel) {
    let confirmed: PublicRegistration | null = null
    updateAcademyState((current) => ({ ...current, registrations: current.registrations.map((registration) => {
        if (registration.id !== id) return registration
        confirmed = { ...registration, paid: true, confirmed: true, paidAt: getLocalDateString(), paymentMethod }
        return confirmed
    }) }))
    return confirmed
}

export function setRegistrationPaymentMethod(id: string, paymentMethod: PaymentChannel) {
    updateAcademyState((current) => ({ ...current, registrations: current.registrations.map((registration) => registration.id === id ? { ...registration, paymentMethod } : registration) }))
}

export function reportRegistrationTransfer(id: string) {
    updateAcademyState((current) => ({ ...current, registrations: current.registrations.map((registration) => registration.id === id ? { ...registration, paymentMethod: 'Transferencia', transferReported: true } : registration) }))
}

export function createEnrollmentOpening(opening: Omit<EnrollmentOpening, 'id' | 'slug'>) {
    const id = `OPEN-${Date.now()}`
    const course = listCourses().find((item) => item.id === opening.courseId)
    const next = { ...opening, id, slug: `${slugify(course?.name ?? 'curso')}-${id.toLowerCase()}` }
    updateAcademyState((current) => ({ ...current, openings: [...current.openings, next] }))
    return next
}

export function updateEnrollmentOpening(id: string, changes: Partial<Omit<EnrollmentOpening, 'id' | 'slug'>>) {
    const existing = listEnrollmentOpenings().find((opening) => opening.id === id)
    if (!existing) return
    updateAcademyState((current) => {
        const next = { ...existing, ...changes }
        return { ...current, openings: current.openings.some((opening) => opening.id === id) ? current.openings.map((opening) => opening.id === id ? next : opening) : [...current.openings, next] }
    })
}

export function removeEnrollmentOpening(id: string) {
    updateAcademyState((current) => ({ ...current, openings: current.openings.filter((opening) => opening.id !== id), deletedOpeningIds: current.deletedOpeningIds.includes(id) ? current.deletedOpeningIds : [...current.deletedOpeningIds, id] }))
}

function resolveOpeningCourseId(opening: EnrollmentOpening) {
    return opening.courseId || listCourses().find((course) => course.commissions.some((commission) => commission.id === opening.commissionId))?.id || ''
}

export function listEnrollmentOpenings(courseId?: string) {
    const state = readAcademyState()
    const storedIds = new Set(state.openings.map((opening) => opening.id))
    return [...initialEnrollmentOpenings.filter((opening) => !storedIds.has(opening.id) && !state.deletedOpeningIds.includes(opening.id)), ...state.openings]
        .map((opening) => ({ ...opening, courseId: resolveOpeningCourseId(opening) }))
        .filter((opening) => !courseId || opening.courseId === courseId)
}

export function getPublicEnrollmentOffer(slug: string) {
    const opening = listEnrollmentOpenings().find((item) => item.slug === slug)
    if (!opening) return null
    const course = listCourses().find((item) => item.id === opening.courseId) ?? listCourses().find((item) => item.commissions.some((commission) => commission.id === opening.commissionId))
    if (!course) return null
    const commissions = getEligibleCommissions(course.commissions, opening.startDate, opening.endDate, opening.commissionIds)
    return { slug: opening.slug, openingId: opening.id, courseId: course.id, courseName: course.name, amount: opening.amount, commissions: commissions.map((commission) => ({ id: commission.id, name: commission.name, schedule: commission.schedule, amount: commission.amount, capacity: commission.capacity, startDate: commission.startDate, endDate: commission.endDate })) } satisfies PublicEnrollmentOffer
}

export function getPublicEnrollmentAvailability(slug: string, commissionId?: string, date = getLocalDateString()) {
    const offer = getPublicEnrollmentOffer(slug)
    const opening = offer ? listEnrollmentOpenings().find((item) => item.id === offer.openingId) : null
    const candidates = offer ? (commissionId ? offer.commissions.filter((commission) => commission.id === commissionId) : offer.commissions) : []
    const hasCapacity = offer ? candidates.some((commission) => {
        const assigned = listStudentsInCommission(offer.courseName, commission.name, commission.id).length
        const pending = readAcademyState().registrations.filter((registration) => registration.openingId === offer.openingId && registration.commissionId === commission.id && !registration.paid).length
        return assigned + pending < commission.capacity
    }) : false
    return resolveEnrollmentAvailability({
        exists: Boolean(offer && opening),
        status: opening?.status,
        date,
        startDate: opening?.startDate,
        endDate: opening?.endDate,
        commissionCount: offer?.commissions.length ?? 0,
        commissionSelected: Boolean(commissionId),
        selectedCommissionExists: candidates.length > 0,
        hasCapacity,
    })
}
