import { initialPrivateLessons, readAcademyState, updateAcademyState } from './academyState'
import type { PrivateLesson } from './academyTypes'

export function createPrivateLesson(lesson: Omit<PrivateLesson, 'id' | 'status'>) {
    const next: PrivateLesson = { ...lesson, id: `PR-${Date.now()}`, status: 'Activa' }
    updateAcademyState((current) => ({ ...current, privateLessons: [...current.privateLessons, next] }))
    return next
}

export function updatePrivateLesson(id: string, changes: Partial<Omit<PrivateLesson, 'id'>>) {
    updateAcademyState((current) => {
        const existing = current.privateLessons.find((lesson) => lesson.id === id) ?? initialPrivateLessons.find((lesson) => lesson.id === id)
        if (!existing) return current
        const next = { ...existing, ...changes }
        return { ...current, privateLessons: current.privateLessons.some((lesson) => lesson.id === id) ? current.privateLessons.map((lesson) => lesson.id === id ? next : lesson) : [...current.privateLessons, next] }
    })
}

export function listPrivateLessons() {
    const stored = readAcademyState().privateLessons
    const storedIds = new Set(stored.map((lesson) => lesson.id))
    return [...initialPrivateLessons.filter((lesson) => !storedIds.has(lesson.id)), ...stored]
}
