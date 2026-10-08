import { Ban, Building2, CalendarDays, Check, CheckCircle2, CreditCard, FileCheck2, GraduationCap, Palette, RotateCcw, Save, Settings2, Users } from 'lucide-react'
import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EntityFormModal, FormField, FormGrid, FormSection } from '@/components/crud/EntityFormModal'
import { useAcademyBrand } from '@/theme/AcademyBrandContext'
import { useAppBrand } from '@/theme/AppBrandContext'
import { defaultAcademyBrand } from '@/theme/brandTheme'
import { useAcademySettings, useSaveAcademySettings, type AcademySettings } from '@/services/academySettingsRepository'
import { setSelectedBranchId, useBranchRoster, useBranches, useCreateBranch, useUpdateBranch } from '@/services/branchRepository'
import { copyBranchConfiguration } from '@/services/branchConfigurationRepository'
import { listExpenses, useFinanceRepositoryVersion } from '@/services/financeRepository'
import { getActiveAcademicCycleId, listCourses, listStaff, listStudents, useAcademyRepositoryVersion } from '@/services/academyRepository'
import { DataTable } from '@/components/ui/DataTable'
import { RowActionMenu } from '@/components/ui/RowActionMenu'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useNavigate } from 'react-router-dom'
import { formatCurrencyARS } from '@/domain/shared/formattingRules'
import { validateConditions } from '@/components/forms/formValidation'
import { SettingsField as Field, SettingsToggleOption as ToggleOption } from '@/components/forms/SettingsControls'
import { WeekDaysCheckboxGroup } from '@/components/forms/WeekDaysCheckboxGroup'
import { useToast } from '@/components/ui/ToastContext'
import { useWorkspace } from '@/workspace/useWorkspace'

const newBranchWeekDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']

const tabs = [
    { id: 'resumen', label: 'Resumen' },
    { id: 'general', label: 'General' },
    { id: 'cobros', label: 'Cobros' },
    { id: 'inscripciones', label: 'Inscripciones' },
] as const
const paymentMethods = ['Transferencia', 'Efectivo', 'Mercado Pago', 'Tarjeta']
const enrollmentFields = ['Documento', 'Email', 'Teléfono', 'Fecha de nacimiento', 'Dirección']

function hexToRgb(hex: string) {
    const clean = hex.replace('#', '')
    if (!/^[0-9a-f]{6}$/i.test(clean)) return null
    return { r: Number.parseInt(clean.slice(0, 2), 16), g: Number.parseInt(clean.slice(2, 4), 16), b: Number.parseInt(clean.slice(4, 6), 16) }
}

// The backend validates brand colors as hex (#RRGGBB or #RRGGBBAA), so the "soft" tint is
// encoded as an 8-digit hex instead of an rgba() string — CSS accepts both equally.
function withPrimaryColor(settings: AcademySettings, primary: string): AcademySettings {
    const rgb = hexToRgb(primary)
    const strong = rgb ? `#${[rgb.r, rgb.g, rgb.b].map((value) => Math.round(value * 0.72).toString(16).padStart(2, '0')).join('')}` : settings.brand.primaryStrong
    const soft = rgb ? `${primary}${Math.round(0.14 * 255).toString(16).padStart(2, '0')}` : settings.brand.primarySoft
    return { ...settings, brand: { ...settings.brand, primary, primaryStrong: strong, primarySoft: soft } }
}

function BranchTeachersCount({ branchId }: { branchId: string }) {
    const { roster } = useBranchRoster(branchId)
    const count = listStaff().filter((member) => member.userId && roster.teacherIds.includes(member.userId)).length
    return <>{count}</>
}

export function AcademySettingsPage() {
    useFinanceRepositoryVersion()
    useAcademyRepositoryVersion()
    const navigate = useNavigate()
    const { path } = useWorkspace()
    const [activeTab, setActiveTab] = useState<(typeof tabs)[number]['id']>('resumen')
    const { settings: remoteSettings, isLoading: isSettingsLoading } = useAcademySettings()
    const saveSettings = useSaveAcademySettings()
    const [settings, setSettings] = useState<AcademySettings | null>(null)
    /* The draft only hydrates once, when the real settings first arrive; later refetches must not clobber unsaved edits. */
    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => { if (remoteSettings) setSettings((current) => current ?? remoteSettings) }, [remoteSettings])
    /* eslint-enable react-hooks/set-state-in-effect */
    const { showToast } = useToast()
    const logoInputRef = useRef<HTMLInputElement>(null)
    const { setBrand } = useAcademyBrand()
    const { config, setConfig } = useAppBrand()
    const { branches } = useBranches()
    const createBranch = useCreateBranch()
    const updateBranch = useUpdateBranch()
    const [isCreateBranchOpen, setIsCreateBranchOpen] = useState(false)
    const emptyBranchForm = { name: '', address: '', email: '', phone: '', weekDays: newBranchWeekDays, openingTime: '08:00', closingTime: '21:00', timezone: 'America/Argentina/Buenos_Aires', copyFromBranchId: '' }
    const [branchForm, setBranchForm] = useState(emptyBranchForm)
    const [openBranchMenuId, setOpenBranchMenuId] = useState<string | null>(null)

    if (!settings) return <div className="dashboard-page academy-settings-page"><p>{isSettingsLoading ? 'Cargando configuración…' : 'No se pudo cargar la configuración.'}</p></div>

    const toggleBranchStatus = (branch: (typeof branches)[number]) => {
        const nextStatus = branch.status === 'Activa' ? 'Inactiva' : 'Activa'
        updateBranch.mutate({ id: branch.id, changes: { status: nextStatus } }, {
            onSuccess: () => showToast('success', nextStatus === 'Activa' ? 'Sede activada.' : 'Sede desactivada.'),
            onError: () => showToast('error', 'No se pudo actualizar el estado de la sede.'),
        })
    }

    const createNewBranch = () => {
        createBranch.mutate({ name: branchForm.name.trim(), address: branchForm.address.trim(), email: branchForm.email.trim(), phone: branchForm.phone.trim(), weekDays: branchForm.weekDays, openingTime: branchForm.openingTime, closingTime: branchForm.closingTime, timezone: branchForm.timezone, status: 'Activa' }, {
            onSuccess: (branch) => {
                if (branchForm.copyFromBranchId) copyBranchConfiguration(branchForm.copyFromBranchId, branch.id)
                setIsCreateBranchOpen(false)
                setBranchForm(emptyBranchForm)
                setSelectedBranchId(branch.id)
                navigate(path(`sedes/${branch.id}`))
            },
            onError: () => showToast('error', 'No se pudo crear la sede. Intentá nuevamente.'),
        })
    }

    const expenses = listExpenses()
    const monthKey = new Date().toISOString().slice(0, 7)
    // Same scoping as Ofertas académicas/Dashboard: only the active ciclo lectivo counts here too,
    // otherwise a course from a past cycle nobody closed keeps inflating this KPI forever.
    const courses = listCourses().filter((course) => course.status === 'Activo' && course.cycleId === getActiveAcademicCycleId())
    const activeCommissions = courses.flatMap((course) => course.commissions).filter((commission) => commission.status === 'Activa')
    const students = listStudents()
    const activeTeachers = listStaff().filter((member) => member.role === 'Docente' && member.status === 'Activo')
    const branchCommissionsCount = (branchId: string) => courses.filter((course) => course.branchId === branchId).flatMap((course) => course.commissions).filter((commission) => commission.status === 'Activa').length
    const currency = { format: formatCurrencyARS }
    // Payments and commissions aren't attributed to a branch in the data model yet, so per-branch
    // income/commissions can't be computed — show 0 uniformly instead of faking data for one branch.
    const branchIncome = () => 0
    const branchExpenses = (branchId: string) => expenses.filter((expense) => expense.branchId === branchId && expense.status === 'Pagado' && expense.paidDate?.startsWith(monthKey)).reduce((total, expense) => total + expense.amount, 0)

    const update = <K extends keyof AcademySettings>(section: K, values: Partial<AcademySettings[K]>) => {
        setSettings((current) => ({ ...current!, [section]: { ...current![section], ...values } }))
    }

    const save = () => {
        if (!settings.general.commercialName.trim()) { setActiveTab('general'); showToast('error', 'El nombre comercial es obligatorio.'); return }
        if (!settings.general.email.includes('@')) { setActiveTab('general'); showToast('error', 'Ingresá un email institucional válido.'); return }
        const normalized: AcademySettings = { ...settings, general: { ...settings.general, commercialName: settings.general.commercialName.trim(), email: settings.general.email.trim() }, brand: { ...settings.brand, name: settings.general.commercialName.trim() } }
        saveSettings.mutate(normalized, {
            onSuccess: (saved) => {
                setSettings(saved); setBrand(saved.brand)
                setConfig({ ...config, visibleName: saved.general.commercialName, shortName: saved.brand.shortName, logoText: saved.brand.shortName })
                showToast('success', 'Cambios guardados correctamente.')
            },
            onError: () => showToast('error', 'No se pudieron guardar los cambios. Intentá nuevamente.'),
        })
    }

    const toggleListValue = (section: 'payments' | 'enrollments', value: string, checked: boolean) => {
        setSettings((current) => {
            const values = section === 'payments' ? current!.payments.enabledMethods : current!.enrollments.requiredFields
            const next = checked ? [...values, value] : values.filter((item) => item !== value)
            return section === 'payments' ? { ...current!, payments: { ...current!.payments, enabledMethods: next } } : { ...current!, enrollments: { ...current!.enrollments, requiredFields: next } }
        })
    }

    const previewBrand = (brand: AcademySettings['brand']) => { update('brand', brand); setBrand(brand) }
    const resetBrand = () => previewBrand({ ...defaultAcademyBrand, name: settings.general.commercialName, logoDataUrl: settings.brand.logoDataUrl })

    const uploadLogo = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        event.target.value = ''
        if (!file) return
        if (!['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'].includes(file.type)) {
            showToast('error', 'El logo debe ser PNG, JPG, WebP o SVG.')
            return
        }
        if (file.size > 1024 * 1024) {
            showToast('error', 'El logo no puede superar 1 MB.')
            return
        }
        const reader = new FileReader()
        reader.onload = () => {
            if (typeof reader.result !== 'string') return
            previewBrand({ ...settings.brand, logoDataUrl: reader.result })
        }
        reader.onerror = () => showToast('error', 'No se pudo leer el archivo seleccionado.')
        reader.readAsDataURL(file)
    }

    return <div className="dashboard-page academy-settings-page">
        <EntityFormModal open={isCreateBranchOpen} title="Nueva sede" subtitle="Ingresá sus datos básicos. Después podrás configurar el staff y sus roles." submitLabel="Crear sede" validate={() => validateConditions({ branchName: !branchForm.name.trim() && 'Ingresá el nombre.', branchAddress: !branchForm.address.trim() && 'Ingresá la dirección.', branchEmail: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(branchForm.email) && 'Ingresá un email válido.', branchWeekDays: branchForm.weekDays.length === 0 && 'Elegí al menos un día de atención.', branchHours: branchForm.openingTime >= branchForm.closingTime && 'La hora de apertura debe ser anterior a la de cierre.' }, 'Revisá los datos de la sede.')} onClose={() => setIsCreateBranchOpen(false)} onSubmit={createNewBranch}>
            <div className="form-stack"><FormSection title="Datos de la sede"><FormGrid><FormField label="Nombre"><input name="branchName" className="form-input" value={branchForm.name} onChange={(event) => setBranchForm((current) => ({ ...current, name: event.target.value }))} placeholder="Ej. Sede Centro" /></FormField><FormField label="Dirección"><input name="branchAddress" className="form-input" value={branchForm.address} onChange={(event) => setBranchForm((current) => ({ ...current, address: event.target.value }))} /></FormField><FormField label="Email"><input name="branchEmail" className="form-input" type="email" value={branchForm.email} onChange={(event) => setBranchForm((current) => ({ ...current, email: event.target.value }))} /></FormField><FormField label="Teléfono"><input className="form-input" value={branchForm.phone} onChange={(event) => setBranchForm((current) => ({ ...current, phone: event.target.value }))} /></FormField></FormGrid></FormSection><FormSection title="Horario de atención"><FormField label="Días de atención"><WeekDaysCheckboxGroup value={branchForm.weekDays} onChange={(weekDays) => setBranchForm((current) => ({ ...current, weekDays }))} /></FormField><FormGrid><FormField label="Hora de apertura"><input name="branchHours" className="form-input" type="time" value={branchForm.openingTime} onChange={(event) => setBranchForm((current) => ({ ...current, openingTime: event.target.value }))} /></FormField><FormField label="Hora de cierre"><input className="form-input" type="time" value={branchForm.closingTime} onChange={(event) => setBranchForm((current) => ({ ...current, closingTime: event.target.value }))} /></FormField><FormField label="Zona horaria"><SearchableSelect value={branchForm.timezone} onChange={(timezone) => setBranchForm((current) => ({ ...current, timezone }))} options={[{ value: 'America/Argentina/Buenos_Aires', label: 'Argentina' }, { value: 'America/Montevideo', label: 'Uruguay' }]} /></FormField></FormGrid></FormSection><FormSection title="Configuración inicial"><FormField label="Copiar comunicaciones y automatizaciones"><SearchableSelect value={branchForm.copyFromBranchId} onChange={(copyFromBranchId) => setBranchForm((current) => ({ ...current, copyFromBranchId }))} placeholder="Comenzar desde cero" options={branches.map((branch) => ({ value: branch.id, label: `Copiar desde ${branch.name}` }))} /></FormField></FormSection></div>
        </EntityFormModal>

        <div className="page-header academy-settings-header">
            <div><div className="academy-title-row"><h1>{settings.general.commercialName || 'Mi academia'}</h1><span className={`academy-status ${settings.general.status === 'Activa' ? 'active' : ''}`}>{settings.general.status}</span></div><p>Administrá los datos y reglas generales de tu academia.</p></div>
        </div>
        <div className="academy-tabs-wrap">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as (typeof tabs)[number]['id'])}><TabsList variant="line" aria-label="Configuración de la academia">{tabs.map((tab) => <TabsTrigger key={tab.id} value={tab.id}>{tab.label}</TabsTrigger>)}</TabsList></Tabs>
            <div className="academy-tab-panel">
                {activeTab === 'resumen' && <div className="academy-overview-content"><div className="academy-overview-grid"><section className="academy-overview-card"><span className="academy-overview-icon"><Building2 size={20} /></span><small>Sedes activas</small><strong>{branches.filter((branch) => branch.status === 'Activa').length}</strong><p>de {branches.length} sedes registradas</p></section><section className="academy-overview-card"><span className="academy-overview-icon"><GraduationCap size={20} /></span><small>Alumnos</small><strong>{students.length}</strong><p>en toda la academia</p></section><section className="academy-overview-card"><span className="academy-overview-icon"><Users size={20} /></span><small>Docentes</small><strong>{activeTeachers.length}</strong><p>activos en la academia</p></section><section className="academy-overview-card"><span className="academy-overview-icon"><CalendarDays size={20} /></span><small>Comisiones vigentes</small><strong>{activeCommissions.length}</strong><p>{courses.length} ofertas activas</p></section></div>
                    <div className="academy-overview-layout"><div className="data-table-card academy-branches-overview"><DataTable title="Estado de las sedes" subtitle="Resumen académico y financiero del mes por sede." onAdd={() => setIsCreateBranchOpen(true)} addLabel="Nueva sede" addButtonVariant="primary" rows={branches} getRowKey={(branch) => branch.id} onRowClick={(branch) => { setSelectedBranchId(branch.id); navigate(path(`sedes/${branch.id}`)) }} columns={[
                        { key: 'branch', header: 'Sede', accessor: (branch) => <strong>{branch.name}</strong> },
                        { key: 'status', header: 'Estado', accessor: (branch) => <StatusBadge label={branch.status} tone={branch.status === 'Activa' ? 'success' : 'neutral'} />, align: 'center' },
                        { key: 'students', header: 'Alumnos', accessor: (branch) => students.filter((student) => student.branchId === branch.id).length, align: 'center' },
                        { key: 'teachers', header: 'Profesores', accessor: (branch) => <BranchTeachersCount branchId={branch.id} />, align: 'center' },
                        { key: 'commissions', header: 'Comisiones', accessor: (branch) => branchCommissionsCount(branch.id), align: 'center' },
                        { key: 'income', header: 'Ingresos', accessor: () => <strong>{currency.format(branchIncome())}</strong>, align: 'right' },
                        { key: 'expenses', header: 'Egresos', accessor: (branch) => currency.format(branchExpenses(branch.id)), align: 'right' },
                        { key: 'balance', header: 'Balance', accessor: (branch) => <strong className={branchIncome() - branchExpenses(branch.id) < 0 ? 'academy-balance-negative' : 'academy-balance-positive'}>{currency.format(branchIncome() - branchExpenses(branch.id))}</strong>, align: 'right' },
                    ]} renderActions={(branch) => <RowActionMenu ariaLabel={`Acciones para ${branch.name}`} open={openBranchMenuId === branch.id} onToggle={() => setOpenBranchMenuId((current) => current === branch.id ? null : branch.id)} actions={[
                        { label: 'Configurar sede', icon: <Settings2 size={15} />, onClick: () => { setSelectedBranchId(branch.id); navigate(path(`sedes/${branch.id}`)) } },
                        branch.status === 'Activa'
                            ? { label: 'Desactivar sede', icon: <Ban size={15} />, variant: 'danger', onClick: () => toggleBranchStatus(branch) }
                            : { label: 'Activar sede', icon: <CheckCircle2 size={15} />, onClick: () => toggleBranchStatus(branch) },
                    ]} />} /></div></div>
                </div>}
                {activeTab === 'general' && <section className="academy-settings-card">
                    <div className="academy-section-heading"><FileCheck2 size={20} /><div><h2>Información general</h2><p>Datos institucionales visibles en la plataforma y documentos.</p></div></div>
                    <div className="form-grid academy-settings-grid">
                        <Field label="Nombre comercial" required><input className="form-input" value={settings.general.commercialName} onChange={(event) => update('general', { commercialName: event.target.value })} /></Field>
                        <Field label="Estado"><SearchableSelect value={settings.general.status} onChange={(status) => update('general', { status: status as 'Activa' | 'Inactiva' })} options={[{ value: 'Activa', label: 'Activa' }, { value: 'Inactiva', label: 'Inactiva' }]} /></Field>
                        <Field label="Email institucional" required><input className="form-input" type="email" value={settings.general.email} onChange={(event) => update('general', { email: event.target.value })} /></Field>
                        <Field label="Teléfono"><input className="form-input" type="tel" value={settings.general.phone} onChange={(event) => update('general', { phone: event.target.value })} /></Field>
                        <Field label="Dirección principal"><input className="form-input" value={settings.general.address} onChange={(event) => update('general', { address: event.target.value })} /></Field>
                    </div>
                </section>}
                {activeTab === 'general' && <div className="academy-brand-layout">
                    <section className="academy-settings-card"><div className="academy-section-heading"><Palette size={20} /><div><h2>Identidad visual</h2><p>Personalizá la experiencia sin perder legibilidad.</p></div></div>
                        <div className="academy-logo-field">
                            <div className={`academy-logo-preview ${settings.brand.logoDataUrl ? 'has-image' : ''}`}>{settings.brand.logoDataUrl ? <img src={settings.brand.logoDataUrl} alt="Vista previa del logo" /> : <span>{settings.brand.shortName || 'A'}</span>}</div>
                            <div className="academy-logo-copy"><strong>Logo de la academia</strong><small>PNG, JPG, WebP o SVG. Máximo 1 MB.</small><div><input ref={logoInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={uploadLogo} hidden /><button type="button" className="secondary-button" onClick={() => logoInputRef.current?.click()}>{settings.brand.logoDataUrl ? 'Cambiar logo' : 'Subir logo'}</button>{settings.brand.logoDataUrl && <button type="button" className="academy-remove-logo" onClick={() => previewBrand({ ...settings.brand, logoDataUrl: undefined })}>Quitar</button>}</div></div>
                        </div>
                        <div className="form-grid academy-settings-grid">
                            <Field label="Nombre corto" hint="Hasta 3 caracteres"><input className="form-input" maxLength={3} value={settings.brand.shortName ?? ''} onChange={(event) => previewBrand({ ...settings.brand, shortName: event.target.value.toUpperCase() })} /></Field>
                            <Field label="Color principal"><div className="academy-color-field"><input type="color" value={settings.brand.primary} onChange={(event) => { const next = withPrimaryColor(settings, event.target.value); setSettings(next); setBrand(next.brand) }} /><input className="form-input" value={settings.brand.primary} onChange={(event) => { const next = withPrimaryColor(settings, event.target.value); setSettings(next); if (hexToRgb(event.target.value)) setBrand(next.brand) }} /></div></Field>
                            <Field label="Color secundario"><div className="academy-color-field"><input type="color" value={settings.brand.accent ?? '#22c55e'} onChange={(event) => previewBrand({ ...settings.brand, accent: event.target.value })} /><input className="form-input" value={settings.brand.accent ?? ''} onChange={(event) => { update('brand', { accent: event.target.value }); if (hexToRgb(event.target.value)) setBrand({ ...settings.brand, accent: event.target.value }) }} /></div></Field>
                        </div><button type="button" className="secondary-button academy-reset-button" onClick={resetBrand}><RotateCcw size={15} />Restaurar colores predeterminados</button>
                    </section>
                    <aside className="academy-brand-preview"><span className="academy-preview-label">Vista previa</span><div className="academy-preview-brand"><span className={settings.brand.logoDataUrl ? 'has-image' : ''}>{settings.brand.logoDataUrl ? <img src={settings.brand.logoDataUrl} alt="Logo" /> : settings.brand.shortName || 'A'}</span><strong>{settings.general.commercialName}</strong></div><div className="academy-preview-nav"><span className="active">Elemento seleccionado</span><span>Elemento del menú</span></div><button type="button">Acción principal</button></aside>
                </div>}
                {activeTab === 'cobros' && <section className="academy-settings-card">
                    <div className="academy-section-heading"><CreditCard size={20} /><div><h2>Configuración de cobros</h2><p>Valores predeterminados para cuotas y nuevos cargos.</p></div></div>
                    <div className="form-grid academy-settings-grid">
                        <Field label="Día de vencimiento"><input className="form-input" type="number" min={1} max={28} value={settings.payments.defaultDueDay} onChange={(event) => update('payments', { defaultDueDay: Number(event.target.value) })} /></Field>
                        <Field label="Días de tolerancia"><input className="form-input" type="number" min={0} value={settings.payments.graceDays} onChange={(event) => update('payments', { graceDays: Number(event.target.value) })} /></Field>
                        <Field label="Recargo por mora (%)"><input className="form-input" type="number" min={0} step="0.5" value={settings.payments.lateFeePercent} onChange={(event) => update('payments', { lateFeePercent: Number(event.target.value) })} /></Field>
                        <Field label="Alias"><input className="form-input" value={settings.payments.transferAlias} onChange={(event) => update('payments', { transferAlias: event.target.value.toUpperCase() })} placeholder="Ej. ACADEMIA.PUENTES" /></Field>
                        <Field label="CBU / CVU"><input className="form-input" inputMode="numeric" value={settings.payments.transferCbu} onChange={(event) => update('payments', { transferCbu: event.target.value.replace(/\D/g, '').slice(0, 22) })} placeholder="22 dígitos" /></Field>
                        <Field label="Titular de la cuenta"><input className="form-input" value={settings.payments.accountHolder} onChange={(event) => update('payments', { accountHolder: event.target.value })} /></Field>
                        <Field label="Link de pago Mercado Pago"><input className="form-input" type="url" value={settings.payments.paymentLink} onChange={(event) => update('payments', { paymentLink: event.target.value })} placeholder="https://mpago.la/..." /></Field>
                        <Field label="CUIT / CUIL del titular"><input className="form-input" value={settings.payments.accountTaxId} onChange={(event) => update('payments', { accountTaxId: event.target.value })} /></Field>
                        <Field label="Mensaje para enlaces de pago" full><textarea className="form-textarea academy-textarea-compact" value={settings.payments.paymentMessage} onChange={(event) => update('payments', { paymentMessage: event.target.value })} /></Field>
                    </div><div className="academy-options-section"><h3>Medios de pago habilitados</h3><div className="academy-options-grid">{paymentMethods.map((method) => <ToggleOption key={method} label={method} checked={settings.payments.enabledMethods.includes(method)} onChange={(checked) => toggleListValue('payments', method, checked)} />)}</div></div>
                </section>}
                {activeTab === 'inscripciones' && <section className="academy-settings-card">
                    <div className="academy-section-heading"><Check size={20} /><div><h2>Configuración de inscripciones</h2><p>Reglas aplicadas al crear nuevas aperturas de inscripción.</p></div></div>
                    <div className="form-grid academy-settings-grid">
                        <Field label="Confirmación"><SearchableSelect value={settings.enrollments.confirmationMode} onChange={(confirmationMode) => update('enrollments', { confirmationMode: confirmationMode as 'Automática' | 'Manual' })} options={[{ value: 'Manual', label: 'Manual' }, { value: 'Automática', label: 'Automática' }]} /></Field>
                        <Field label="Cupo predeterminado" hint="Se usa al crear una comisión nueva"><input className="form-input" type="number" min={1} value={settings.enrollments.defaultCapacity} onChange={(event) => update('enrollments', { defaultCapacity: Number(event.target.value) })} /></Field>
                    </div>
                    <div className="academy-options-section"><ToggleOption label="Requerir pago para confirmar" description="El formulario público de inscripción incluye el paso de pago; si está desactivado, se lo salteamos." checked={settings.enrollments.requirePayment} onChange={(checked) => update('enrollments', { requirePayment: checked })} /></div>
                    <div className="academy-options-section"><h3>Campos obligatorios</h3><div className="academy-options-grid">{enrollmentFields.map((field) => <ToggleOption key={field} label={field} checked={settings.enrollments.requiredFields.includes(field)} onChange={(checked) => toggleListValue('enrollments', field, checked)} />)}</div></div>
                </section>}
                {activeTab !== 'resumen' && <div className="academy-form-actions">
                    <span>Los cambios se aplicarán a toda la academia.</span>
                    <button type="button" className="primary-button academy-save-button" onClick={save}><Save size={16} />Guardar cambios</button>
                </div>}
            </div>
        </div>
    </div>
}
