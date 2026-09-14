import { useSyncExternalStore } from 'react'
import { createRepositoryEvents } from '@/services/shared/repositoryEvents'
import { readStoredValue, writeStoredValue } from '@/services/shared/storage'
import type { AcademyState, AcademicCommission, AcademicCourse, AcademicCycle, CommissionAssignment, EnrollmentOpening, PrivateLesson } from './academyTypes'

const storageKey = 'gestiq-academy-repository-v1'
const repositoryEvents = createRepositoryEvents(storageKey)

export const defaultCycle: AcademicCycle = { id: 'CYCLE-2026', name: 'Ciclo lectivo 2026', startDate: '2026-01-01', endDate: '2026-12-31', status: 'Activo' }
export const emptyState: AcademyState = { cycles: [], activeCycleId: defaultCycle.id, courses: [], deletedCourseIds: [], staff: [], deletedStaffIds: [], students: [], deletedStudentIds: [], registrations: [], openings: [], deletedOpeningIds: [], assignments: [], privateLessons: [], paymentUpdates: {}, attendanceRecords: [], manualCharges: [], commissionExams: [], examEnrollments: [] }

export const initialCourses: AcademicCourse[] = [{
    id: 'C-220', cycleId: defaultCycle.id, name: 'Inglés General', studentsCount: 6, status: 'Activo', commissions: [
        { id: 'COM-101', name: 'Grupo A', teacher: 'María López', teachers: ['María López'], schedule: 'Lun / Mié / Vie · 18:30 - 20:00', studentsCount: 3, capacity: 18, amount: 48000, startDate: '2026-03-02', endDate: '2026-12-15', dueDay: 10, status: 'Activa' },
        { id: 'COM-102', name: 'Grupo B', teacher: 'Tomás Silva', teachers: ['Tomás Silva'], schedule: 'Mar / Jue / Vie · 19:00 - 20:30', studentsCount: 3, capacity: 20, amount: 52000, startDate: '2026-03-03', endDate: '2026-12-15', dueDay: 10, status: 'Programada' },
    ],
}]
export const initialPrivateLessons: PrivateLesson[] = [
    { id: 'PR-1001', studentId: 'ST-1001', teacher: 'María López', purpose: 'Apoyo escolar', plan: 'Pack 8 clases', startDate: '2026-03-02', endDate: '2026-04-30', costPerClass: 4800, days: ['Lunes'], fromTime: '18:00', toTime: '19:00', status: 'Activa' },
    { id: 'PR-1002', studentId: 'ST-1002', teacher: 'Tomás Silva', purpose: 'Conversación', plan: 'Plan mensual', startDate: '2026-03-03', endDate: '2026-12-15', costPerClass: 6200, days: ['Martes'], fromTime: '19:30', toTime: '20:30', status: 'Activa' },
    { id: 'PR-1003', studentId: 'ST-1003', teacher: 'María López', purpose: 'Preparación de examen', plan: 'Pack 4 clases', startDate: '2026-03-06', endDate: '2026-04-03', costPerClass: 7200, days: ['Viernes'], fromTime: '17:00', toTime: '18:00', status: 'Pausada' },
]
export const initialEnrollmentOpenings: EnrollmentOpening[] = [
    { id: 'OPEN-1001', slug: 'ingles-general-open-1001', courseId: 'C-220', startDate: '2026-08-26', endDate: '2026-09-30', status: 'Abierta', amount: 48000 },
    { id: 'OPEN-1002', slug: 'ingles-general-open-1002', courseId: 'C-220', startDate: '2026-08-28', endDate: '2026-09-02', status: 'Programada', amount: 48000 },
    { id: 'OPEN-1003', slug: 'ingles-general-open-1003', courseId: 'C-220', startDate: '2026-09-02', endDate: '2026-09-15', status: 'Cerrada', amount: 52000 },
]

function normalizeCommissionNames(commissions: AcademicCommission[]) {
    const used = new Set<string>()
    return commissions.map((commission) => {
        const baseName = commission.name.trim() || 'Comisión'
        let name = baseName
        let suffix = 2
        while (used.has(name.toLocaleLowerCase('es-AR'))) name = `${baseName} (${suffix++})`
        used.add(name.toLocaleLowerCase('es-AR'))
        return name === commission.name ? commission : { ...commission, name }
    })
}

export function readAcademyState(): AcademyState {
    const saved = readStoredValue<AcademyState | null>(storageKey, null)
    if (!saved) return emptyState
    return {
        ...emptyState,
        ...saved,
        assignments: (saved.assignments ?? []).map((assignment: Partial<CommissionAssignment>) => ({ ...assignment, status: assignment.status ?? 'Activo', enrolledAt: assignment.enrolledAt ?? '2026-03-01' }) as CommissionAssignment),
        privateLessons: (saved.privateLessons ?? []).map((lesson) => ({ ...lesson, purpose: lesson.purpose ?? 'Clases de apoyo', startDate: lesson.startDate ?? '2026-03-01', endDate: lesson.endDate ?? '2026-12-15' })),
        courses: (saved.courses ?? []).map((course) => ({ ...course, cycleId: course.cycleId ?? defaultCycle.id, commissions: normalizeCommissionNames((course.commissions ?? []).map((commission) => ({ ...commission, teachers: commission.teachers ?? (commission.teacher && commission.teacher !== 'Docente por asignar' ? [commission.teacher] : []), startDate: commission.startDate ?? '2026-03-01', endDate: commission.endDate ?? '2026-12-15', dueDay: commission.dueDay ?? 10 }))) })),
        openings: (saved.openings ?? []).map((opening) => ({ ...opening, slug: opening.slug ?? `inscripcion-${opening.id.toLowerCase()}` })),
    }
}

export function writeAcademyState(next: AcademyState) { writeStoredValue(storageKey, next); repositoryEvents.emit() }
export function updateAcademyState(recipe: (current: AcademyState) => AcademyState) { writeAcademyState(recipe(readAcademyState())) }
export const subscribeAcademyChanges = repositoryEvents.subscribe
export function useAcademyRepositoryVersion() { return useSyncExternalStore(repositoryEvents.subscribe, repositoryEvents.getRevision, () => 0) }
