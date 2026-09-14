type ExamStudent = { id: string; status: string }

export function getActiveExamStudents<T extends ExamStudent>(students: T[]) {
    return students.filter((student) => student.status === 'Activo')
}

export function resolveExamStudentIds(students: ExamStudent[], audience: 'all' | 'selected', selectedIds: string[]) {
    const activeIds = getActiveExamStudents(students).map((student) => student.id)
    return audience === 'all' ? activeIds : selectedIds.filter((id) => activeIds.includes(id))
}
