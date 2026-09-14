import { ArrowLeft, Building2, ChevronDown, Clock3, Mail, Plus, Save, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { StaffPage } from '@/features/staff'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EntityFormModal, FormField, FormGrid } from '@/components/crud/EntityFormModal'
import { listBranches, setSelectedBranchId, updateBranch, useBranchRepositoryVersion, useSelectedBranchId } from '@/services/branchRepository'
import { getBranchSettings, listBranchAutomations, saveBranchAutomations, saveBranchSettings, type BranchAutomation, type BranchSettings } from '@/services/branchConfigurationRepository'
import { defaultCommunicationTemplates as defaultTemplates, listCommunicationTemplates, saveCommunicationTemplates, type CommunicationTemplate } from '@/services/communicationTemplateRepository'
import { validateConditions } from '@/components/forms/formValidation'
import { SettingsField as Field, SettingsToggleOption as ToggleOption } from '@/components/forms/SettingsControls'
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
    useBranchRepositoryVersion()
    const { branchId } = useParams()
    const globallySelectedBranchId = useSelectedBranchId()
    const selectedBranchId = branchId ?? globallySelectedBranchId
    const [activeTab, setActiveTab] = useState<(typeof tabs)[number]['id']>('personalizacion')
    const branches = listBranches()
    const selectedBranch = branches.find((branch) => branch.id === selectedBranchId) ?? branches[0]
    const branchKey = selectedBranch?.id ?? 'default'
    const [settings, setSettings] = useState<BranchSettings>(() => getBranchSettings(branchKey, { name: selectedBranch?.name, address: selectedBranch?.address, email: selectedBranch?.email, phone: selectedBranch?.phone }))
    const [templates, setTemplates] = useState<CommunicationTemplate[]>(() => listCommunicationTemplates(branchKey))
    const [automations, setAutomations] = useState<BranchAutomation[]>(() => listBranchAutomations(branchKey))
    const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(defaultTemplates[0].id)
    const [newTemplateOpen, setNewTemplateOpen] = useState(false)
    const [newTemplate, setNewTemplate] = useState(emptyTemplate)
    const [feedback, setFeedback] = useState('')
    const [error, setError] = useState('')

    /* The route changes the complete editing context, so all branch-scoped drafts reset together. */
    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        setSettings(getBranchSettings(branchKey, { name: selectedBranch?.name, address: selectedBranch?.address, email: selectedBranch?.email, phone: selectedBranch?.phone }))
        setTemplates(listCommunicationTemplates(branchKey))
        setAutomations(listBranchAutomations(branchKey))
        setExpandedTemplateId(defaultTemplates[0]?.id ?? null)
        setFeedback('')
        setError('')
    }, [branchKey, selectedBranch?.address, selectedBranch?.email, selectedBranch?.name, selectedBranch?.phone])
    /* eslint-enable react-hooks/set-state-in-effect */

    const updateSettings = (values: Partial<BranchSettings>) => { setSettings((current) => ({ ...current, ...values })); setFeedback(''); setError('') }
    const updateTemplate = (id: string, values: Partial<CommunicationTemplate>) => setTemplates((current) => current.map((template) => template.id === id ? { ...template, ...values } : template))
    const updateAutomation = (id: string, enabled: boolean) => setAutomations((current) => current.map((automation) => automation.id === id ? { ...automation, enabled } : automation))
    const toggleChannel = (id: string, channel: string, checked: boolean) => setTemplates((current) => current.map((template) => template.id === id ? { ...template, channels: checked ? [...template.channels, channel] : template.channels.filter((item) => item !== channel) } : template))
    const createTemplate = () => {
        const template = { ...newTemplate, id: `template-${Date.now()}`, name: newTemplate.name.trim(), description: newTemplate.description.trim(), subject: newTemplate.subject.trim(), message: newTemplate.message.trim() }
        setTemplates((current) => [...current, template])
        setExpandedTemplateId(template.id)
        setNewTemplate(emptyTemplate)
        setNewTemplateOpen(false)
        setFeedback('Comunicación creada. Guardá los cambios para conservarla.')
        setError('')
    }

    const save = () => {
        if (!settings.name.trim() || !settings.address.trim()) { setError('Completá el nombre y la dirección de la sede.'); return }
        if (!settings.email.includes('@')) { setError('Ingresá un correo electrónico válido.'); return }
        const normalized = { ...settings, name: settings.name.trim(), email: settings.email.trim(), address: settings.address.trim(), phone: settings.phone.trim() }
        saveBranchSettings(branchKey, normalized)
        saveCommunicationTemplates(branchKey, templates)
        saveBranchAutomations(branchKey, automations)
        if (selectedBranch) updateBranch(selectedBranch.id, { name: normalized.name, address: normalized.address, email: normalized.email, phone: normalized.phone })
        setSettings(normalized); setFeedback('Cambios guardados correctamente.'); setError('')
    }

    return <div className="dashboard-page academy-settings-page branch-settings-page">
        <EntityFormModal open={newTemplateOpen} title="Nueva comunicación" subtitle="Creá una plantilla reutilizable para esta sede." submitLabel="Crear comunicación" validate={() => validateConditions({ templateName: !newTemplate.name.trim() && 'Ingresá el nombre.', templateSubject: !newTemplate.subject.trim() && 'Ingresá el asunto.', templateMessage: !newTemplate.message.trim() && 'Ingresá el mensaje.' }, 'Revisá la comunicación.')} onClose={() => { setNewTemplateOpen(false); setNewTemplate(emptyTemplate); setError('') }} onSubmit={createTemplate}>
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
        <div className="page-header academy-settings-header compact"><div>{branchId && <div className="detail-breadcrumb"><Link to={path('branches/list')}><ArrowLeft size={14} /> Mis sedes</Link><span>›</span><span>{selectedBranch?.name ?? 'Sede'}</span></div>}<div className="academy-title-row detail-title-row"><h1>{branchId ? selectedBranch?.name ?? 'Sede' : 'Mis sedes'}</h1><span className={`academy-status ${selectedBranch?.status === 'Activa' ? 'active' : ''}`}>{branchId ? selectedBranch?.status ?? 'Sin sede' : selectedBranch?.name ?? 'Sin sede activa'}</span></div><p>Definí los datos, accesos, equipo y comunicaciones de esta sede.</p></div><Link to={path('branches/list')} className="secondary-button compact-button"><Building2 size={16} /> Administrar sedes</Link></div>
        {(feedback || error) && <div className={`academy-feedback ${error ? 'error' : 'success'}`}>{error || feedback}</div>}
        <div className="academy-tabs-wrap">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as (typeof tabs)[number]['id'])}><TabsList variant="line" aria-label="Configuración de sedes">{tabs.map((tab) => <TabsTrigger key={tab.id} value={tab.id}>{tab.label}</TabsTrigger>)}</TabsList></Tabs>
            <div className="academy-tab-panel">
                {activeTab === 'personalizacion' && <section className="academy-settings-card">
                    <div className="academy-section-heading"><Building2 size={20} /><div><h2>Datos de la sede</h2><p>Esta información aparecerá en comunicaciones, comprobantes y enlaces públicos.</p></div></div>
                    <div className="form-grid academy-settings-grid">
                        <Field label="Nombre de la sede"><input className="form-input" value={settings.name} onChange={(event) => updateSettings({ name: event.target.value })} /></Field>
                        <Field label="Correo electrónico"><input className="form-input" type="email" value={settings.email} onChange={(event) => updateSettings({ email: event.target.value })} /></Field>
                        <Field label="Dirección"><input className="form-input" value={settings.address} onChange={(event) => updateSettings({ address: event.target.value })} /></Field>
                        <Field label="Teléfono"><input className="form-input" type="tel" value={settings.phone} onChange={(event) => updateSettings({ phone: event.target.value })} /></Field>
                        <Field label="Horario de atención"><input className="form-input" value={settings.schedule} onChange={(event) => updateSettings({ schedule: event.target.value })} /></Field>
                        <Field label="Zona horaria"><select className="form-input" value={settings.timezone} onChange={(event) => updateSettings({ timezone: event.target.value })}><option value="America/Argentina/Cordoba">Argentina · Córdoba</option><option value="America/Argentina/Buenos_Aires">Argentina · Buenos Aires</option><option value="America/Montevideo">Uruguay · Montevideo</option></select></Field>
                    </div>
                </section>}
                {activeTab === 'staff' && <StaffPage compact contentInset title="Staff de la sede" staffIds={selectedBranch?.staffIds ?? []} administratorIds={selectedBranch?.managerIds ?? []} onStaffCreated={(staffId) => { if (!selectedBranch) return; updateBranch(selectedBranch.id, { staffIds: Array.from(new Set([...selectedBranch.staffIds, staffId])) }) }} onToggleAdministrator={(staffId, enabled) => { if (!selectedBranch) return; const managerIds = enabled ? Array.from(new Set([...selectedBranch.managerIds, staffId])) : selectedBranch.managerIds.filter((id) => id !== staffId); updateBranch(selectedBranch.id, { managerIds, managerId: managerIds[0] ?? '', staffIds: Array.from(new Set([...selectedBranch.staffIds, staffId])) }); setSelectedBranchId(selectedBranch.id) }} />}
                {activeTab === 'comunicaciones' && <section className="academy-settings-card">
                    <div className="academy-section-heading branch-section-heading"><div className="branch-section-heading-copy"><Mail size={20} /><div><h2>Plantillas de comunicación</h2><p>Guardá mensajes predeterminados para comunicarte con alumnos y responsables.</p></div></div><button type="button" className="secondary-button branch-add-button" onClick={() => { setNewTemplateOpen(true); setError('') }}><Plus size={16} />Nueva comunicación</button></div>
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
                <div className="academy-form-actions"><span>Los cambios se guardan solo para esta sede.</span><button type="button" className="primary-button academy-save-button" onClick={save}><Save size={16} />Guardar cambios</button></div>
            </div>
        </div>
    </div>
}
