import { listPayments } from '@/services/billing/paymentsRepository'
import { listEnrollmentOpenings } from './enrollmentsRepository'
import { readAcademyState, updateAcademyState } from './academyState'
import type { AcademicCommission } from './academyTypes'
import { listCourses } from './coursesRepository'
import { listStudentsInCommission } from './studentsRepository'

export function getCourseRemovalBlockers(id: string) {
    const course = listCourses().find((item) => item.id === id)
    if (!course) return []
    const students = course.commissions.reduce((total, commission) => total + listStudentsInCommission(course.name, commission.name, commission.id).length, 0)
    const openings = listEnrollmentOpenings(course.id).length
    const payments = listPayments().filter((payment) => payment.concept.includes(course.name) && payment.status !== 'Pagado').length
    return [students ? `${students} alumno${students === 1 ? '' : 's'} asignado${students === 1 ? '' : 's'}` : '', openings ? `${openings} inscripción${openings === 1 ? '' : 'es'} registrada${openings === 1 ? '' : 's'}` : '', payments ? `${payments} pago${payments === 1 ? '' : 's'} pendiente${payments === 1 ? '' : 's'}` : ''].filter(Boolean)
}

export function getCommissionRemovalBlockers(courseId: string, commissionId: string) {
    const course = listCourses().find((item) => item.id === courseId)
    const commission = course?.commissions.find((item) => item.id === commissionId)
    if (!course || !commission) return []
    const students = listStudentsInCommission(course.name, commission.name, commission.id).length
    const openings = readAcademyState().registrations.filter((registration) => registration.commissionId === commissionId).length
    const payments = listPayments().filter((payment) => payment.concept.includes(commission.name) && payment.status !== 'Pagado').length
    return [students ? `${students} alumno${students === 1 ? '' : 's'} asignado${students === 1 ? '' : 's'}` : '', openings ? `${openings} inscripción${openings === 1 ? '' : 'es'} registrada${openings === 1 ? '' : 's'}` : '', payments ? `${payments} pago${payments === 1 ? '' : 's'} pendiente${payments === 1 ? '' : 's'}` : ''].filter(Boolean)
}

export function updateCommission(courseId: string, commissionId: string, changes: Partial<AcademicCommission>) {
    const course = listCourses().find((item) => item.id === courseId)
    const requestedName = changes.name?.trim().toLocaleLowerCase('es-AR')
    if (course && requestedName && course.commissions.some((commission) => commission.id !== commissionId && commission.name.trim().toLocaleLowerCase('es-AR') === requestedName)) return false
    const currentCommission = course?.commissions.find((commission) => commission.id === commissionId)
    const amountChanged = changes.amount !== undefined && currentCommission && changes.amount !== currentCommission.amount
    const registrationIds = new Set(readAcademyState().registrations.filter((registration) => registration.commissionId === commissionId).map((registration) => registration.id))
    const relatedPayments = amountChanged ? listPayments().filter((payment) => (payment.id.startsWith('PAY-TUITION-') && [...registrationIds].some((id) => payment.id.startsWith(`PAY-TUITION-${id}-`))) || (payment.id.startsWith('PAY-ASSIGN-') && payment.id.includes(`-${commissionId}-`))) : []
    updateAcademyState((current) => {
        if (!course) return current
        const nextCourse = { ...course, commissions: course.commissions.map((commission) => commission.id === commissionId ? { ...commission, ...changes } : commission) }
        const paymentUpdates = relatedPayments.reduce((updates, payment) => ({ ...updates, [payment.id]: { ...updates[payment.id], amount: payment.status === 'Pagado' ? payment.amount : changes.amount } }), current.paymentUpdates)
        return { ...current, paymentUpdates, courses: current.courses.some((item) => item.id === courseId) ? current.courses.map((item) => item.id === courseId ? nextCourse : item) : [...current.courses, nextCourse] }
    })
    return true
}

export function removeCommission(courseId: string, commissionId: string) {
    const course = listCourses().find((item) => item.id === courseId)
    if (!course) return
    updateAcademyState((current) => {
        const nextCourse = { ...course, commissions: course.commissions.filter((commission) => commission.id !== commissionId) }
        return { ...current, courses: current.courses.some((item) => item.id === courseId) ? current.courses.map((item) => item.id === courseId ? nextCourse : item) : [...current.courses, nextCourse] }
    })
}

export function createCommission(courseId: string, commission: Omit<AcademicCommission, 'id'>) {
    const course = listCourses().find((item) => item.id === courseId)
    if (!course) return null
    const name = commission.name.trim()
    if (course.commissions.some((item) => item.name.trim().toLocaleLowerCase('es-AR') === name.toLocaleLowerCase('es-AR'))) return null
    const next = { ...commission, name, id: `COM-${Date.now()}` }
    updateAcademyState((current) => {
        const nextCourse = { ...course, commissions: [...course.commissions, next] }
        return { ...current, courses: current.courses.some((item) => item.id === courseId) ? current.courses.map((item) => item.id === courseId ? nextCourse : item) : [...current.courses, nextCourse] }
    })
    return next
}
