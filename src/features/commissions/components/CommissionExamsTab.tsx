import { ClipboardCheck, PencilLine, Plus } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { DataTable } from '@/components/ui/DataTable'
import { RowActionMenu } from '@/components/ui/RowActionMenu'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { listCommissionExams } from '@/services/academyRepository'

export type CommissionExamRow = ReturnType<typeof listCommissionExams>[number]

type Props = { exams: CommissionExamRow[]; openMenuId: string | null; onToggleMenu: (id: string) => void; onCreate: () => void; onEdit: (exam: CommissionExamRow) => void }

export function CommissionExamsTab({ exams, openMenuId, onToggleMenu, onCreate, onEdit }: Props) {
    return <Card className="commission-exams-card">
        <SectionHeading icon={<ClipboardCheck size={20} />} title="Exámenes" description={exams.length === 1 ? '1 examen configurado' : `${exams.length} exámenes configurados`} actions={<button type="button" className="primary-button compact-button" onClick={onCreate}><Plus size={16} /> Nuevo examen</button>} />
        {exams.length === 0 ? <div className="finance-empty">Todavía no hay exámenes configurados para esta comisión.</div> : <DataTable rows={exams} getRowKey={(exam) => exam.id} renderActions={(exam) => <RowActionMenu ariaLabel={`Acciones para ${exam.title}`} active={openMenuId === exam.id} onToggle={() => onToggleMenu(exam.id)} actions={[{ label: 'Editar', icon: <PencilLine size={15} />, onClick: () => onEdit(exam) }]} />} columns={[
            { key: 'title', header: 'Examen', accessor: (exam) => <div><strong>{exam.title}</strong><small style={{ display: 'block', color: 'var(--muted)', marginTop: 3 }}>{exam.examDate || 'Fecha a definir'}</small></div> },
            { key: 'students', header: 'Alumnos', accessor: (exam) => `${exam.enrollments.length}` },
            { key: 'fee', header: 'Arancel', accessor: (exam) => `$${exam.feeAmount.toLocaleString('es-AR')} · ${exam.installmentCount} cuota${exam.installmentCount === 1 ? '' : 's'}` },
            { key: 'status', header: 'Estado', accessor: (exam) => <StatusBadge label={exam.status} tone={exam.status === 'Abierto' ? 'success' : exam.status === 'Cerrado' ? 'neutral' : 'warning'} />, align: 'center' },
        ]} />}
    </Card>
}
