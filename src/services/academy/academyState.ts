import { useSyncExternalStore } from 'react'
import { createRepositoryEvents } from '@/services/shared/repositoryEvents'
import { readStoredValue, writeStoredValue } from '@/services/shared/storage'
import type { AcademyState, AcademicCommission, AcademicCycle, CommissionAssignment } from './academyTypes'

const storageKey = 'gestiq-academy-repository-v1'
const repositoryEvents = createRepositoryEvents(storageKey)

export const defaultCycle: AcademicCycle = { id: 'CYCLE-2026', name: 'Ciclo lectivo 2026', startDate: '2026-01-01', endDate: '2026-12-31', status: 'Activo' }
export const emptyState: AcademyState = { cycles: [], activeCycleId: defaultCycle.id, courses: [], deletedCourseIds: [], staff: [], deletedStaffIds: [], students: [], deletedStudentIds: [], openings: [], deletedOpeningIds: [], assignments: [], privateLessons: [], paymentUpdates: {}, attendanceRecords: [], manualCharges: [], commissionExams: [], examEnrollments: [], charges: [] }

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
    }
}

export function writeAcademyState(next: AcademyState) { writeStoredValue(storageKey, next); repositoryEvents.emit() }
export function updateAcademyState(recipe: (current: AcademyState) => AcademyState) { writeAcademyState(recipe(readAcademyState())) }
export const subscribeAcademyChanges = repositoryEvents.subscribe
export function useAcademyRepositoryVersion() { return useSyncExternalStore(repositoryEvents.subscribe, repositoryEvents.getRevision, () => 0) }
