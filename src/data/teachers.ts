export type Teacher = {
    id: string
    firstName: string
    lastName: string
    fullName: string
    email: string
    phone: string
    birthDate?: string
    specialty: string
    role: 'Docente' | 'Administrativo'
    status: 'Activo' | 'Inactivo'
}

export const initialTeachers: Teacher[] = [
    {
        id: 'T-101',
        firstName: 'María',
        lastName: 'López',
        fullName: 'María López',
        email: 'maria.lopez@academia.com',
        phone: '+54 11 4321-9900',
        birthDate: '1988-09-12',
        specialty: 'Inglés',
        role: 'Docente',
        status: 'Activo',
    },
    {
        id: 'T-102',
        firstName: 'Tomás',
        lastName: 'Silva',
        fullName: 'Tomás Silva',
        email: 'tomas.silva@academia.com',
        phone: '+54 11 5342-1188',
        birthDate: '1991-11-04',
        specialty: 'Conversación',
        role: 'Docente',
        status: 'Activo',
    },
]

export const teacherSelectOptions = initialTeachers
    .filter((teacher) => teacher.role === 'Docente')
    .map((teacher) => ({ value: teacher.fullName, label: teacher.fullName }))
