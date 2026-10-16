import type { StatusHelpItem } from '@/components/ui/StatusHelp'

// Mirrors the backend guard on public registration: the opening must be Abierta AND today must fall
// within its period; Programada and Cerrada never accept registrations.
export const enrollmentStatusHelp: StatusHelpItem[] = [
    { status: 'Programada', description: 'preparada, pero el link todavía no acepta inscripciones. Pasala a Abierta para habilitarlo.' },
    { status: 'Abierta', description: 'el link acepta inscripciones mientras la fecha de hoy esté dentro del período.' },
    { status: 'Cerrada', description: 'el link deja de aceptar inscripciones. Los inscriptos se conservan.' },
]
