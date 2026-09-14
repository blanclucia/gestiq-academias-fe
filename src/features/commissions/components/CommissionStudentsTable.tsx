import { Award, MessageCircle, SlidersHorizontal, UserPlus, Users } from 'lucide-react'
import { DataTable } from '@/components/ui/DataTable'
import { RowActionMenu } from '@/components/ui/RowActionMenu'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { CommissionStudentStatus } from '@/services/academyRepository'
import type { StudentStatus } from '@/types/domain'

export type CommissionStudentRow = { id: string; name: string; email: string; phone: string; status: CommissionStudentStatus; globalStatus: StudentStatus }

type Props = { rows: CommissionStudentRow[]; selectedIds: string[]; openMenuId: string | null; onSelectionChange: (ids: string[]) => void; onToggleMenu: (id: string) => void; onAssign: () => void; onView: (student: CommissionStudentRow) => void; onCommunicate: (ids: string[]) => void; onCertificate: (ids: string[]) => void; onStatus: (ids: string[]) => void }

export function CommissionStudentsTable(props: Props) {
    const toggleStudent = (id: string) => props.onSelectionChange(props.selectedIds.includes(id) ? props.selectedIds.filter((item) => item !== id) : [...props.selectedIds, id])
    return <div style={{ marginTop: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 12, gap: 12, flexWrap: 'wrap' }}><div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><span style={{ color: 'var(--muted)' }}>{props.rows.length} alumnos asignados</span><button type="button" className="primary-button compact-button" onClick={props.onAssign} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><UserPlus size={14} /> Asignar alumnos</button></div></div>
        {props.selectedIds.length > 0 && <div className="bulk-action-bar commission-student-bulk-actions"><span>{props.selectedIds.length} seleccionado{props.selectedIds.length === 1 ? '' : 's'}</span><div className="bulk-action-group"><button type="button" className="secondary-button compact-button" onClick={() => props.onCommunicate(props.selectedIds)}><MessageCircle size={15} />Comunicar</button><button type="button" className="secondary-button compact-button" onClick={() => props.onCertificate(props.selectedIds)}><Award size={15} />Generar certificados</button><button type="button" className="secondary-button compact-button" onClick={() => props.onStatus(props.selectedIds)}><SlidersHorizontal size={15} />Cambiar estado</button></div></div>}
        <DataTable rows={props.rows} getRowKey={(student) => student.id} onRowClick={props.onView} emptyLabel="Todavía no hay alumnos asignados a esta comisión." columns={[
            { key: 'select', header: <input type="checkbox" aria-label="Seleccionar todos los alumnos" checked={props.rows.length > 0 && props.selectedIds.length === props.rows.length} onChange={() => props.onSelectionChange(props.selectedIds.length === props.rows.length ? [] : props.rows.map((student) => student.id))} />, accessor: (student) => <input type="checkbox" aria-label={`Seleccionar ${student.name}`} checked={props.selectedIds.includes(student.id)} onChange={() => toggleStudent(student.id)} />, align: 'center' },
            { key: 'student', header: 'Alumno', accessor: (student) => <div><strong>{student.name}</strong><div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 3 }}>{student.email} · {student.phone}</div></div> },
            { key: 'status', header: 'Estado en comisión', accessor: (student) => <StatusBadge label={student.status} tone={student.status === 'Activo' ? 'success' : student.status === 'Pausado' ? 'warning' : 'neutral'} />, align: 'center' },
        ]} renderActions={(student) => <RowActionMenu ariaLabel={`Acciones para ${student.name}`} active={props.openMenuId === student.id} onToggle={() => props.onToggleMenu(student.id)} actions={[
            { label: 'Ver ficha', icon: <Users size={15} />, onClick: () => props.onView(student) }, { label: 'Enviar comunicación', icon: <MessageCircle size={15} />, onClick: () => props.onCommunicate([student.id]) }, { label: 'Generar certificado', icon: <Award size={15} />, onClick: () => props.onCertificate([student.id]) }, { label: 'Cambiar estado', icon: <SlidersHorizontal size={15} />, onClick: () => props.onStatus([student.id]) },
        ]} />} />
    </div>
}
