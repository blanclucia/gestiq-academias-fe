import type { StatusHelpItem } from '@/components/ui/StatusHelp'

// Mirrors the backend guards: only an active course takes enrollments; a closed one takes no new
// commissions or students.
export const courseStatusHelp: StatusHelpItem[] = [
    { status: 'Borrador', description: 'la estás armando. Podés crear comisiones, pero todavía no admite inscripciones ni alumnos.' },
    { status: 'Activo', description: 'publicada. Admite inscripciones y asignar alumnos a sus comisiones.' },
    { status: 'Cerrado', description: 'finalizada. No admite comisiones ni alumnos nuevos; queda para consulta.' },
]
