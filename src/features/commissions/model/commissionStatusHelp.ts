import type { StatusHelpItem } from '@/components/ui/StatusHelp'

// Mirrors the backend guards: only a closed commission rejects new students.
export const commissionStatusHelp: StatusHelpItem[] = [
    { status: 'Programada', description: 'todavía no empezó. Ya podés asignarle alumnos.' },
    { status: 'Activa', description: 'en curso. Admite alumnos mientras tenga cupo.' },
    { status: 'Cerrada', description: 'terminó. No admite alumnos nuevos; las inscripciones se conservan para consulta.' },
]
