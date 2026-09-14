import { Building2, MapPin, Plus, Settings2, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EntityFormModal, FormField, FormGrid, FormSection } from '@/components/crud/EntityFormModal'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { DataTable } from '@/components/ui/DataTable'
import { RowActionMenu } from '@/components/ui/RowActionMenu'
import { createBranch, listBranches, setSelectedBranchId, useBranchRepositoryVersion } from '@/services/branchRepository'
import { listStaff } from '@/services/academyRepository'
import { copyBranchConfiguration } from '@/services/branchConfigurationRepository'
import { validateConditions } from '@/components/forms/formValidation'
import { useWorkspace } from '@/workspace/useWorkspace'

const weekDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']

export function BranchesPage() {
    useBranchRepositoryVersion()
    const navigate = useNavigate()
    const { path } = useWorkspace()
    const branches = listBranches()
    const administrators = listStaff().filter((member) => member.status === 'Activo')
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [openMenuId, setOpenMenuId] = useState<string | null>(null)
    const [form, setForm] = useState({ name: '', address: '', email: '', phone: '', copyFromBranchId: '' })

    const openBranch = (branchId: string) => {
        setSelectedBranchId(branchId)
        navigate(path(`sedes/${branchId}`))
    }

    return <div className="dashboard-page branches-page">
        <EntityFormModal open={isCreateOpen} title="Nueva sede" subtitle="Ingresá sus datos básicos. Después podrás configurar el staff y sus roles." submitLabel="Crear sede" validate={() => validateConditions({ branchName: !form.name.trim() && 'Ingresá el nombre.', branchAddress: !form.address.trim() && 'Ingresá la dirección.', branchEmail: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) && 'Ingresá un email válido.' }, 'Revisá los datos de la sede.')} onClose={() => setIsCreateOpen(false)} onSubmit={() => {
            const branch = createBranch({ name: form.name.trim(), address: form.address.trim(), email: form.email.trim(), phone: form.phone.trim(), managerId: '', managerIds: [], staffIds: [], studentIds: [], weekDays, openingTime: '08:00', closingTime: '21:00', status: 'Activa' })
            if (form.copyFromBranchId) copyBranchConfiguration(form.copyFromBranchId, branch.id)
            setIsCreateOpen(false)
            setForm({ name: '', address: '', email: '', phone: '', copyFromBranchId: '' })
            openBranch(branch.id)
        }}>
            <div className="form-stack"><FormSection title="Datos de la sede"><FormGrid><FormField label="Nombre"><input className="form-input" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Ej. Sede Centro" /></FormField><FormField label="Dirección"><input className="form-input" value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} /></FormField><FormField label="Email"><input className="form-input" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} /></FormField><FormField label="Teléfono"><input className="form-input" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} /></FormField></FormGrid></FormSection><FormSection title="Configuración inicial"><FormField label="Copiar comunicaciones y automatizaciones"><select className="form-input" value={form.copyFromBranchId} onChange={(event) => setForm((current) => ({ ...current, copyFromBranchId: event.target.value }))}><option value="">Comenzar desde cero</option>{branches.map((branch) => <option key={branch.id} value={branch.id}>Copiar desde {branch.name}</option>)}</select></FormField></FormSection></div>
        </EntityFormModal>

        <div className="page-header branches-header"><div><h1>Mis sedes</h1><p>Administrá la estructura, los accesos y la configuración de cada sede.</p></div><button type="button" className="primary-button compact-button context-primary-action" onClick={() => setIsCreateOpen(true)}><Plus size={16} /> Nueva sede</button></div>
        <div className="data-table-card branches-table-card"><DataTable
            title="Sedes de la academia"
            rows={branches}
            getRowKey={(branch) => branch.id}
            onRowClick={(branch) => openBranch(branch.id)}
            emptyLabel="Todavía no hay sedes registradas."
            columns={[
                { key: 'branch', header: 'Sede', accessor: (branch) => <div className="branch-table-name"><span className="branch-card-icon"><Building2 size={18} /></span><span><strong>{branch.name}</strong><small><MapPin size={12} />{branch.address}</small></span></div> },
                { key: 'students', header: 'Alumnos', accessor: (branch) => branch.studentsCount, align: 'center' },
                { key: 'staff', header: 'Staff', accessor: (branch) => branch.staffIds.length, align: 'center' },
                { key: 'admins', header: 'Administración', accessor: (branch) => <div className="branch-table-admin"><ShieldCheck size={14} /><span>{branch.managerIds.length > 0 ? administrators.filter((member) => branch.managerIds.includes(member.id)).map((member) => member.fullName).join(', ') || 'Administrador asignado' : 'Sin administrador asignado'}</span></div> },
                { key: 'status', header: 'Estado', accessor: (branch) => <StatusBadge label={branch.status} tone={branch.status === 'Activa' ? 'success' : 'neutral'} />, align: 'center' },
            ]}
            renderActions={(branch) => <RowActionMenu ariaLabel={`Acciones para ${branch.name}`} open={openMenuId === branch.id} onToggle={() => setOpenMenuId((current) => current === branch.id ? null : branch.id)} actions={[{ label: 'Configurar sede', icon: <Settings2 size={15} />, onClick: () => openBranch(branch.id) }]} />}
        /></div>
    </div>
}
