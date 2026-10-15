import { BookOpenCheck, Copy, Trash2, Users } from 'lucide-react'
import { RowActionMenu } from '@/components/ui/RowActionMenu'
import type { AcademicCommission } from '@/services/academyRepository'

type Props = { commission: AcademicCommission; active: boolean; onToggle: () => void; onView: () => void; onViewStudents: () => void; onDuplicate: () => void; onDelete: () => void }

export function CommissionActions({ commission, active, onToggle, onView, onViewStudents, onDuplicate, onDelete }: Props) {
    return <RowActionMenu ariaLabel={`Acciones para ${commission.name}`} active={active} onToggle={onToggle} actions={[
        { label: 'Ver comisión', icon: <BookOpenCheck size={15} />, onClick: onView },
        { label: 'Alumnos', icon: <Users size={15} />, onClick: onViewStudents },
        { label: 'Duplicar', icon: <Copy size={15} />, onClick: onDuplicate },
        { label: 'Eliminar', icon: <Trash2 size={15} />, onClick: onDelete, variant: 'danger' },
    ]} />
}
