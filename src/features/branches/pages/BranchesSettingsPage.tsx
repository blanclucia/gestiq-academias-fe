import { ArrowLeft, Building2, ChevronDown, Clock3, Mail, Plus, Save, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { StaffPage } from '@/features/staff'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EntityFormModal, FormField, FormGrid } from '@/components/crud/EntityFormModal'
import { setSelectedBranchId, useBranches, useSelectedBranchId, useSetBranchAdministrator, useSetBranchStaffScope, useUpdateBranch } from '@/services/branchRepository'
import { listStaff } from '@/services/academyRepository'
import { getBranchSettings, listBranchAutomations, saveBranchAutomations, saveBranchSettings, type BranchAutomation, type BranchSettings } from '@/services/branchConfigurationRepository'
import { defaultCommunicationTemplates as defaultTemplates, listCommunicationTemplates, saveCommunicationTemplates, type CommunicationTemplate } from '@/services/communicationTemplateRepository'
import { validateConditions } from '@/components/forms/formValidation'
import { SettingsField as Field, SettingsToggleOption as ToggleOption } from '@/components/forms/SettingsControls'
import { useToast } from '@/components/ui/ToastContext'
import { useWorkspace } from '@/workspace/useWorkspace'

const tabs = [
    { id: 'personalizacion', label: 'Personalización' },
    { id: 'staff', label: 'Staff' },
    { id: 'comunicaciones', label: 'Comunicaciones' },
    { id: 'automatizaciones', label: 'Automatizaciones' },
] as const

const emptyTemplate: Omit<CommunicationTemplate, 'id'> = {
    name: '', description: '', subject: '', message: '', enabled: true, channels: ['Email'],
}

export function BranchesSettingsPage() {
    const { path } = useWorkspace()
    const { branchId } = useParams()
    const globallySelectedBranchId = useSelectedBranchId()
    const [activeTab, setActiveTab] = useState<(typeof tabs)[number]['id']>('personalizacion')
    const { branches } = useBranches()
    const updateBranch = useUpdateBranch()
    const setBranchAdministrator = useSetBranchAdministrator()
    const setBranchStaffScope = useSetBranchStaffScope()
    // With an explicit :branchId, show exactly that sede (active or not) — you navigated there on purpose.
    // Without one ("Mis sedes"), prefer an active sede so this agrees with the TopBar switcher, which only
    // ever offers active sedes: session.accessibleBranches always excludes inactive ones.
    const selectedBranch = branchId
        ? branches.find((branch) => branch.id === branchId) ?? branches[0]
        : branches.find((branch) => branch.id === globallySelectedBranchId && branch.status === 'Activa')
        ?? branches.find((branch) => branch.status === 'Activa')
        ?? branches[0]
    const branchKey = selectedBranch?.id ?? 'default'
    const [settings, setSettings] = useState<BranchSettings>(() => getBranchSettings(branchKey, { name: selectedBranch?.name, address: selectedBranch?.address, email: selectedBranch?.email, phone: selectedBranch?.phone, status: selectedBranch?.status }))
    const [templates, setTemplates] = useState<CommunicationTemplate[]>(() => listCommunicationTemplates(branchKey))
    const [automations, setAutomations] = useState<BranchAutomation[]>(() => listBranchAutomations(branchKey))
    const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(defaultTemplates[0].id)
    const [newTemplateOpen, setNewTemplateOpen] = useState(false)
    const [newTemplate, setNewTemplate] = useState(emptyTemplate)
    const { showToast } = useToast()

    /* The route changes the complete editing context, so all branch-scoped drafts reset together. */
    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        setSettings(getBranchSettings(branchKey, { name: selectedBranch?.name, address: selectedBranch?.address, email: selectedBranch?.email, phone: selectedBranch?.phone, status: selectedBranch?.status }))
        setTemplates(listCommunicationTemplates(branchKey))
        setAutomations(listBranchAutomations(branchKey))
        setExpandedTemplateId(defaultTemplates[0]?.id ?? null)
    }, [branchKey, selectedBranch?.address, selectedBranch?.email, selectedBranch?.name, selectedBranch?.phone, selectedBranch?.status])
    /* eslint-enable react-hooks/set-state-in-effect */

    const updateSettings = (values: Partial<BranchSettings>) => setSettings((current) => ({ ...current, ...values }))
    const updateTemplate = (id: string, values: Partial<CommunicationTemplate>) => setTemplates((current) => current.map((template) => template.id === id ? { ...template, ...values } : template))
    const updateAutomation = (id: string, enabled: boolean) => setAutomations((current) => current.map((automation) => automation.id === id ? { ...automation, enabled } : automation))
    const toggleChannel = (id: string, channel: string, checked: boolean) => setTemplates((current) => current.map((template) => template.id === id ? { ...template, channels: checked ? [...template.channels, channel] : template.channels.filter((item) => item !== channel) } : template))
    const createTemplate = () => {
        const template = { ...newTemplate, id: `template-${Date.now()}`, name: newTemplate.name.trim(), description: newTemplate.description.trim(), subject: newTemplate.subject.trim(), message: newTemplate.message.trim() }
        setTemplates((current) => [...current, template])
        setExpandedTemplateId(template.id)
        setNewTemplate(emptyTemplate)
        setNewTemplateOpen(false)
        showToast('success', 'Comunicación creada. Guardá los cambios para conservarla.')
    }

    const saveBranchCore = () => {
        if (!settings.name.trim() || !settings.address.trim()) { showToast('error', 'Completá el nombre y la dirección de la sede.'); return }
        if (!settings.email.includes('@')) { showToast('error', 'Ingresá un correo electrónico válido.'); return }
        const normalized = { ...settings, name: settings.name.trim(), email: settings.email.trim(), address: settings.address.trim(), phone: settings.phone.trim() }
        saveBranchSettings(branchKey, normalized)
        setSettings(normalized)
        if (!selectedBranch) { showToast('success', 'Cambios guardados correctamente.'); return }
        updateBranch.mutate({ id: selectedBranch.id, changes: { name: normalized.name, address: normalized.address, email: normalized.email, phone: normalized.phone, status: normalized.status } }, {
            onSuccess: () => showToast('success', 'Cambios guardados correctamente.'),
            onError: () => showToast('error', 'No se pudieron guardar los datos de la sede. Intentá nuevamente.'),
        })
    }

    const saveCommunications = () => {
        saveCommunicationTemplates(branchKey, templates)
        showToast('success', 'Cambios guardados correctamente.')
    }

    const saveAutomations = () => {
        saveBranchAutomations(branchKey, automations)
        showToast('success', 'Cambios guardados correctamente.')
    }

    const toggleAdministrator = (staffId: string, enabled: boolean) => {
        if (!selectedBranch) { showToast('error', 'No se pudo identificar la sede actual. Recargá la página e intentá de nuevo.'); return }
        const member = listStaff().find((teacher) => teacher.id === staffId)
        if (!member?.userId) { showToast('error', 'Completá el DNI de esta persona (editándola) antes de asignarla como administradora.'); return }
        setBranchAdministrator.mutate({ branchId: selectedBranch.id, userId: member.userId, enabled }, {
            onSuccess: () => {
                const managerIds = enabled ? Array.from(new Set([...selectedBranch.managerIds, staffId])) : selectedBranch.managerIds.filter((id) => id !== staffId)
                updateBranch.mutate({ id: selectedBranch.id, changes: { managerIds, managerId: managerIds[0] ?? '', staffIds: Array.from(new Set([...selectedBranch.staffIds, staffId])) } })
                setSelectedBranchId(selectedBranch.id)
                showToast('success', enabled ? 'Administrador asignado correctamente.' : 'Administrador revocado correctamente.')
            },
            onError: () => showToast('error', enabled ? 'No se pudo asignar como administradora a esta persona.' : 'No se pudo revocar la administración de esta persona.'),
        })
    }

    const onStaffCreated = (staffId: string) => {
        if (!selectedBranch) { showToast('error', 'No se pudo identificar la sede actual. Recargá la página e intentá de nuevo.'); return }
        updateBranch.mutate({ id: selectedBranch.id, changes: { staffIds: Array.from(new Set([...selectedBranch.staffIds, staffId])) } })
        const member = listStaff().find((teacher) => teacher.id === staffId)
        if (!member?.userId) { showToast('success', 'Persona agregada al staff. Completá su DNI para habilitar el acceso real a esta sede.'); return }
        setBranchStaffScope.mutate({ branchId: selectedBranch.id, userId: member.userId, enabled: true }, {
            onError: () => showToast('error', 'La persona quedó en el staff, pero no se pudo habilitar su acceso a esta sede. Reintentá desde la fila.'),
        })
    }

    return <div className="dashboard-page academy-settings-page branch-settings-page">
        <EntityFormModal open={newTemplateOpen} title="Nueva comunicación" subtitle="Creá una plantilla reutilizable para esta sede." submitLabel="Crear comunicación" validate={() => validateConditions({ templateName: !newTemplate.name.trim() && 'Ingresá el nombre.', templateSubject: !newTemplate.subject.trim() && 'Ingresá el asunto.', templateMessage: !newTemplate.message.trim() && 'Ingresá el mensaje.' }, 'Revisá la comunicación.')} onClose={() => { setNewTemplateOpen(false); setNewTemplate(emptyTemplate) }} onSubmit={createTemplate}>
            <div className="form-stack">
                <FormGrid>
                    <FormField label="Nombre"><input className="form-input" value={newTemplate.name} onChange={(event) => setNewTemplate((current) => ({ ...current, name: event.target.value }))} placeholder="Ej. Aviso de inscripción" /></FormField>
                    <FormField label="Descripción"><input className="form-input" value={newTemplate.description} onChange={(event) => setNewTemplate((current) => ({ ...current, description: event.target.value }))} placeholder="Para qué se usa esta comunicación" /></FormField>
                    <FormField label="Asunto"><input className="form-input" value={newTemplate.subject} onChange={(event) => setNewTemplate((current) => ({ ...current, subject: event.target.value }))} /></FormField>
                    <FormField label="Mensaje"><textarea className="form-textarea" value={newTemplate.message} onChange={(event) => setNewTemplate((current) => ({ ...current, message: event.target.value }))} /></FormField>
                </FormGrid>
                <div className="branch-channel-options"><span>Canales iniciales</span>{['Email', 'WhatsApp'].map((channel) => <label key={channel}><input type="checkbox" checked={newTemplate.channels.includes(channel)} onChange={(event) => setNewTemplate((current) => ({ ...current, channels: event.target.checked ? [...current.channels, channel] : current.channels.filter((item) => item !== channel) }))} />{channel}</label>)}</div>
            </div>
        </EntityFormModal>
        <div className="page-header academy-settings-header compact"><div>{branchId && <div className="detail-breadcrumb"><Link to={path('academy')}><ArrowLeft size={14} /> Mi academia</Link><span>›</span><span>{selectedBranch?.name ?? 'Sede'}</span></div>}<div className="academy-title-row detail-title-row"><h1>{branchId ? selectedBranch?.name ?? 'Sede' : 'Mis sedes'}</h1><span className={`academy-status ${selectedBranch?.status === 'Activa' ? 'active' : ''}`}>{branchId ? selectedBranch?.status ?? 'Sin sede' : selectedBranch?.name ?? 'Sin sede activa'}</span></div><p>Definí los datos, accesos, equipo y comunicaciones de esta sede.</p></div></div>
        <div className="academy-tabs-wrap">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as (typeof tabs)[number]['id'])}><TabsList variant="line" aria-label="Configuración de sedes">{tabs.map((tab) => <TabsTrigger key={tab.id} value={tab.id}>{tab.label}</TabsTrigger>)}</TabsList></Tabs>
            <div className="academy-tab-panel">
                {activeTab === 'personalizacion' && <section className="academy-settings-card">
                    <div className="academy-section-heading"><Building2 size={20} /><div><h2>Datos de la sede</h2><p>Esta información aparecerá en comunicaciones, comprobantes y enlaces públicos.</p></div></div>
                    <div className="form-grid academy-settings-grid">
                        <Field label="Nombre de la sede" required><input className="form-input" value={settings.name} onChange={(event) => updateSettings({ name: event.target.value })} /></Field>
                        <Field label="Correo electrónico" required><input className="form-input" type="email" value={settings.email} onChange={(event) => updateSettings({ email: event.target.value })} /></Field>
                        <Field label="Dirección" required><input className="form-input" value={settings.address} onChange={(event) => updateSettings({ address: event.target.value })} /></Field>
                        <Field label="Teléfono"><input className="form-input" type="tel" value={settings.phone} onChange={(event) => updateSettings({ phone: event.target.value })} /></Field>
                        <Field label="Horario de atención"><input className="form-input" value={settings.schedule} onChange={(event) => updateSettings({ schedule: event.target.value })} /></Field>
                        <Field label="Zona horaria"><select className="form-input" value={settings.timezone} onChange={(event) => updateSettings({ timezone: event.target.value })}><option value="America/Argentina/Cordoba">Argentina · Córdoba</option><option value="America/Argentina/Buenos_Aires">Argentina · Buenos Aires</option><option value="America/Montevideo">Uruguay · Montevideo</option></select></Field>
                        <Field label="Estado"><select className="form-input" value={settings.status} onChange={(event) => updateSettings({ status: event.target.value as 'Activa' | 'Inactiva' })}><option>Activa</option><option>Inactiva</option></select></Field>
                    </div>
                </section>}
                {activeTab === 'staff' && <StaffPage compact contentInset title="Staff de la sede" staffIds={selectedBranch?.staffIds ?? []} administratorIds={selectedBranch?.managerIds ?? []} onStaffCreated={onStaffCreated} onToggleAdministrator={toggleAdministrator} />}
                {activeTab === 'comunicaciones' && <section className="academy-settings-card">
                    <div className="academy-section-heading branch-section-heading"><div className="branch-section-heading-copy"><Mail size={20} /><div><h2>Plantillas de comunicación</h2><p>Guardá mensajes predeterminados para comunicarte con alumnos y responsables.</p></div></div><button type="button" className="secondary-button branch-add-button" onClick={() => setNewTemplateOpen(true)}><Plus size={16} />Nueva comunicación</button></div>
                    <div className="branch-template-list">{templates.map((template) => {
                        const expanded = expandedTemplateId === template.id
                        return <article className={`branch-template ${expanded ? 'expanded' : ''}`} key={template.id}>
                            <div className="branch-template-heading">
                                <button type="button" className="branch-template-toggle" aria-expanded={expanded} onClick={() => setExpandedTemplateId(expanded ? null : template.id)}><span className="branch-template-toggle-icon"><ChevronDown size={17} /></span><span><strong>{template.name}</strong><small>{template.description}</small></span></button>
                                <label className="branch-template-status"><input type="checkbox" checked={template.enabled} onChange={(event) => updateTemplate(template.id, { enabled: event.target.checked })} /><span>{template.enabled ? 'Activa' : 'Inactiva'}</span></label>
                            </div>
                            {expanded && <div className="branch-template-content"><div className="form-grid academy-settings-grid"><Field label="Asunto"><input className="form-input" value={template.subject} onChange={(event) => updateTemplate(template.id, { subject: event.target.value })} /></Field><Field label="Mensaje"><textarea className="form-textarea" value={template.message} onChange={(event) => updateTemplate(template.id, { message: event.target.value })} /></Field></div>
                                <div className="branch-channel-options"><span>Canales</span>{['Email', 'WhatsApp'].map((channel) => <label key={channel}><input type="checkbox" checked={template.channels.includes(channel)} onChange={(event) => toggleChannel(template.id, channel, event.target.checked)} />{channel}</label>)}</div>
                            </div>}
                        </article>
                    })}</div>
                    <p className="branch-template-hint">Variables disponibles: {'{nombre}'}, {'{periodo}'}, {'{fecha_vencimiento}'}, {'{enlace_pago}'}, {'{sede}'} y {'{email_sede}'}.</p>
                </section>}
                {activeTab === 'automatizaciones' && <section className="academy-settings-card">
                    <div className="academy-section-heading"><Sparkles size={20} /><div><h2>Automatizaciones de la sede</h2><p>Elegí qué comunicaciones se envían automáticamente y en qué momento.</p></div></div>
                    <div className="academy-options-grid">{automations.map((automation) => <ToggleOption key={automation.id} label={automation.label} description={automation.description} checked={automation.enabled} onChange={(enabled) => updateAutomation(automation.id, enabled)} />)}</div>
                    <div className="branch-automation-note"><Clock3 size={17} /><span>Las automatizaciones respetan los canales habilitados en cada plantilla y la zona horaria de la sede.</span></div>
                </section>}
                {activeTab === 'personalizacion' && <div className="academy-form-actions"><span>Los cambios se guardan solo para esta sede.</span><button type="button" className="primary-button academy-save-button" onClick={saveBranchCore}><Save size={16} />Guardar cambios</button></div>}
                {activeTab === 'comunicaciones' && <div className="academy-form-actions"><span>Los cambios se guardan solo para esta sede.</span><button type="button" className="primary-button academy-save-button" onClick={saveCommunications}><Save size={16} />Guardar cambios</button></div>}
                {activeTab === 'automatizaciones' && <div className="academy-form-actions"><span>Los cambios se guardan solo para esta sede.</span><button type="button" className="primary-button academy-save-button" onClick={saveAutomations}><Save size={16} />Guardar cambios</button></div>}
            </div>
        </div>
    </div>
}
