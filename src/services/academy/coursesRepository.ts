import { defaultCycle, initialCourses, readAcademyState, updateAcademyState } from './academyState'
import type { AcademicCourse, AcademicCycle } from './academyTypes'

export function listCourses() {
    const state = readAcademyState()
    const storedIds = new Set(state.courses.map((course) => course.id))
    return [...initialCourses.filter((course) => !storedIds.has(course.id) && !state.deletedCourseIds.includes(course.id)), ...state.courses]
}

export function listAcademicCycles() {
    const stored = readAcademyState().cycles
    return stored.some((cycle) => cycle.id === defaultCycle.id) ? stored : [defaultCycle, ...stored]
}

export function getActiveAcademicCycleId() {
    const state = readAcademyState()
    return listAcademicCycles().some((cycle) => cycle.id === state.activeCycleId) ? state.activeCycleId : defaultCycle.id
}

export function setActiveAcademicCycle(id: string) {
    if (listAcademicCycles().some((cycle) => cycle.id === id)) updateAcademyState((current) => ({ ...current, activeCycleId: id }))
}

export function createAcademicCycle(cycle: Omit<AcademicCycle, 'id'>) {
    const next = { ...cycle, id: `CYCLE-${Date.now()}` }
    updateAcademyState((current) => ({ ...current, cycles: [...current.cycles, next], activeCycleId: next.id }))
    return next
}

export function replicateAcademicOffer(sourceCycleId: string, targetCycleId: string, includeCommissions = true) {
    const sourceCourses = listCourses().filter((course) => course.cycleId === sourceCycleId)
    const cycles = listAcademicCycles()
    const sourceYear = Number(cycles.find((cycle) => cycle.id === sourceCycleId)?.startDate.slice(0, 4))
    const targetYear = Number(cycles.find((cycle) => cycle.id === targetCycleId)?.startDate.slice(0, 4))
    const shiftDate = (date: string) => sourceYear && targetYear ? `${targetYear + (Number(date.slice(0, 4)) - sourceYear)}${date.slice(4)}` : date
    const targetNames = new Set(listCourses().filter((course) => course.cycleId === targetCycleId).map((course) => course.name.toLowerCase()))
    const timestamp = Date.now()
    const copies = sourceCourses.filter((course) => !targetNames.has(course.name.toLowerCase())).map((course, courseIndex) => ({
        ...course, id: `C-${timestamp}-${courseIndex}`, cycleId: targetCycleId, studentsCount: 0, status: 'Borrador' as const,
        commissions: includeCommissions ? course.commissions.map((commission, commissionIndex) => ({ ...commission, id: `COM-${timestamp}-${courseIndex}-${commissionIndex}`, startDate: shiftDate(commission.startDate), endDate: shiftDate(commission.endDate), studentsCount: 0, status: 'Programada' as const })) : [],
    }))
    updateAcademyState((current) => ({ ...current, courses: [...current.courses, ...copies] }))
    return copies
}

export function createCourse(course: Omit<AcademicCourse, 'id' | 'cycleId' | 'commissions' | 'studentsCount'> & { cycleId?: string }) {
    const next: AcademicCourse = { ...course, cycleId: course.cycleId ?? getActiveAcademicCycleId(), id: `C-${Date.now()}`, studentsCount: 0, commissions: [] }
    updateAcademyState((current) => ({ ...current, courses: [...current.courses, next] }))
    return next
}

export function updateCourse(id: string, changes: Partial<Omit<AcademicCourse, 'id' | 'commissions'>>) {
    const existing = listCourses().find((course) => course.id === id)
    if (!existing) return
    updateAcademyState((current) => {
        const next = { ...existing, ...changes }
        return { ...current, courses: current.courses.some((course) => course.id === id) ? current.courses.map((course) => course.id === id ? next : course) : [...current.courses, next] }
    })
}

export function removeCourse(id: string) {
    updateAcademyState((current) => ({ ...current, courses: current.courses.filter((course) => course.id !== id), deletedCourseIds: current.deletedCourseIds.includes(id) ? current.deletedCourseIds : [...current.deletedCourseIds, id] }))
}
