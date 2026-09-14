import { BarChart3, BookOpen, CalendarDays, ClipboardCheck, CreditCard, GraduationCap, Landmark, Users } from 'lucide-react'
import type { UserRole } from './roleTypes'

export type RoleNavItem = { label: string; shortLabel: string; path: string; icon: typeof BarChart3 }

const adminNavigation: RoleNavItem[] = [
    { label: 'Dashboard', shortLabel: 'Inicio', path: '', icon: BarChart3 },
    { label: 'Agenda académica', shortLabel: 'Agenda', path: 'schedule', icon: CalendarDays },
    { label: 'Oferta académica', shortLabel: 'Oferta', path: 'offers', icon: BookOpen },
    { label: 'Alumnos', shortLabel: 'Alumnos', path: 'students', icon: Users },
    { label: 'Cobranzas', shortLabel: 'Cobros', path: 'billing', icon: CreditCard },
    { label: 'Finanzas', shortLabel: 'Finanzas', path: 'finances', icon: Landmark },
]

export const navigationByRole: Record<UserRole, RoleNavItem[]> = {
    admin: adminNavigation,
    teacher: [
        { label: 'Inicio del profesor', shortLabel: 'Inicio', path: '', icon: BarChart3 },
        { label: 'Mis clases', shortLabel: 'Clases', path: 'classes', icon: BookOpen },
        { label: 'Asistencia', shortLabel: 'Asistencia', path: 'attendance', icon: ClipboardCheck },
        { label: 'Agenda', shortLabel: 'Agenda', path: 'schedule', icon: CalendarDays },
    ],
    student: [
        { label: 'Inicio del estudiante', shortLabel: 'Inicio', path: '', icon: BarChart3 },
        { label: 'Mis cursos', shortLabel: 'Cursos', path: 'courses', icon: GraduationCap },
        { label: 'Calendario', shortLabel: 'Calendario', path: 'calendar', icon: CalendarDays },
        { label: 'Mis pagos', shortLabel: 'Pagos', path: 'payments', icon: CreditCard },
    ],
}
