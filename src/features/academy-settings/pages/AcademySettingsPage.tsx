import { Building2, CalendarDays, Check, CreditCard, FileCheck2, GraduationCap, Palette, RotateCcw, Save, Users } from 'lucide-react'
import { useRef, useState, type ChangeEvent } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAcademyBrand } from '@/theme/AcademyBrandContext'
import { useAppBrand } from '@/theme/AppBrandContext'
import { defaultAcademyBrand } from '@/theme/brandTheme'
import { getAcademySettings, saveAcademySettings, type AcademySettings } from '@/services/academySettingsRepository'
import { listBranches, setSelectedBranchId, useBranchRepositoryVersion } from '@/services/branchRepository'
import { listExpenses, useFinanceRepositoryVersion } from '@/services/financeRepository'
import { listCourses, listPayments, useAcademyRepositoryVersion } from '@/services/academyRepository'
import { DataTable } from '@/components/ui/DataTable'
import { useNavigate } from 'react-router-dom'
import { formatCurrencyARS } from '@/domain/shared/formattingRules'
import { SettingsField as Field, SettingsToggleOption as ToggleOption } from '@/components/forms/SettingsControls'
import { useWorkspace } from '@/workspace/useWorkspace'

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

function withPrimaryColor(settings: AcademySettings, primary: string): AcademySettings {
    const rgb = hexToRgb(primary)
    const strong = rgb ? `#${[rgb.r, rgb.g, rgb.b].map((value) => Math.round(value * 0.72).toString(16).padStart(2, '0')).join('')}` : settings.brand.primaryStrong
    return { ...settings, brand: { ...settings.brand, primary, primaryStrong: strong, primarySoft: rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.14)` : settings.brand.primarySoft } }
}

export function AcademySettingsPage() {
    useBranchRepositoryVersion()
    useFinanceRepositoryVersion()
    useAcademyRepositoryVersion()
    const navigate = useNavigate()
    const { path } = useWorkspace()
    const [activeTab, setActiveTab] = useState<(typeof tabs)[number]['id']>('resumen')
    const [settings, setSettings] = useState(getAcademySettings)
    const [feedback, setFeedback] = useState('')
    const [error, setError] = useState('')
    const logoInputRef = useRef<HTMLInputElement>(null)
    const { setBrand } = useAcademyBrand()
    const { config, setConfig } = useAppBrand()
    const branches = listBranches()
    const expenses = listExpenses()
    const monthKey = new Date().toISOString().slice(0, 7)
    const payments = listPayments()
    const courses = listCourses().filter((course) => course.status === 'Activo')
    const activeCommissions = courses.flatMap((course) => course.commissions).filter((commission) => commission.status === 'Activa')
    const totalIncome = payments.filter((payment) => payment.status === 'Pagado' && payment.date.startsWith(monthKey)).reduce((total, payment) => total + payment.amount, 0)
    const currency = { format: formatCurrencyARS }
    const branchIncome = (branchId: string) => branchId === 'BR-1001' ? totalIncome : 0
    const branchExpenses = (branchId: string) => expenses.filter((expense) => expense.branchId === branchId && expense.status === 'Pagado' && expense.paidDate?.startsWith(monthKey)).reduce((total, expense) => total + expense.amount, 0)

    const update = <K extends keyof AcademySettings>(section: K, values: Partial<AcademySettings[K]>) => {
        setSettings((current) => ({ ...current, [section]: { ...current[section], ...values } }))
        setFeedback(''); setError('')
    }

    const save = () => {
        if (!settings.general.commercialName.trim()) { setActiveTab('general'); setError('El nombre comercial es obligatorio.'); return }
        if (!settings.general.email.includes('@')) { setActiveTab('general'); setError('Ingresá un email institucional válido.'); return }
        const normalized: AcademySettings = { ...settings, general: { ...settings.general, commercialName: settings.general.commercialName.trim(), email: settings.general.email.trim() }, brand: { ...settings.brand, name: settings.general.commercialName.trim() } }
        saveAcademySettings(normalized); setSettings(normalized); setBrand(normalized.brand)
        setConfig({ ...config, visibleName: normalized.general.commercialName, shortName: normalized.brand.shortName, logoText: normalized.brand.shortName })
        setFeedback('Cambios guardados correctamente.'); setError('')
    }

    const toggleListValue = (section: 'payments' | 'enrollments', value: string, checked: boolean) => {
        setSettings((current) => {
            const values = section === 'payments' ? current.payments.enabledMethods : current.enrollments.requiredFields
            const next = checked ? [...values, value] : values.filter((item) => item !== value)
            return section === 'payments' ? { ...current, payments: { ...current.payments, enabledMethods: next } } : { ...current, enrollments: { ...current.enrollments, requiredFields: next } }
        }); setFeedback('')
    }

    const previewBrand = (brand: AcademySettings['brand']) => { update('brand', brand); setBrand(brand) }
    const resetBrand = () => previewBrand({ ...defaultAcademyBrand, name: settings.general.commercialName, logoDataUrl: settings.brand.logoDataUrl })

    const uploadLogo = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        event.target.value = ''
        if (!file) return
        if (!['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'].includes(file.type)) {
            setError('El logo debe ser PNG, JPG, WebP o SVG.')
            return
        }
        if (file.size > 1024 * 1024) {
            setError('El logo no puede superar 1 MB.')
            return
        }
        const reader = new FileReader()
        reader.onload = () => {
            if (typeof reader.result !== 'string') return
            previewBrand({ ...settings.brand, logoDataUrl: reader.result })
            setError('')
        }
        reader.onerror = () => setError('No se pudo leer el archivo seleccionado.')
        reader.readAsDataURL(file)
    }

    return <div className="dashboard-page academy-settings-page">
        <div className="page-header academy-settings-header">
            <div><div className="academy-title-row"><h1>{settings.general.commercialName || 'Mi academia'}</h1><span className={`academy-status ${settings.general.status === 'Activa' ? 'active' : ''}`}>{settings.general.status}</span></div><p>Administrá los datos y reglas generales de tu academia.</p></div>
        </div>
        {(feedback || error) && <div className={`academy-feedback ${error ? 'error' : 'success'}`}>{error || feedback}</div>}
        <div className="academy-tabs-wrap">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as (typeof tabs)[number]['id'])}><TabsList variant="line" aria-label="Configuración de la academia">{tabs.map((tab) => <TabsTrigger key={tab.id} value={tab.id}>{tab.label}</TabsTrigger>)}</TabsList></Tabs>
            <div className="academy-tab-panel">
                {activeTab === 'resumen' && <div className="academy-overview-content"><div className="academy-overview-grid"><section className="academy-overview-card"><span className="academy-overview-icon"><Building2 size={20} /></span><small>Sedes activas</small><strong>{branches.filter((branch) => branch.status === 'Activa').length}</strong><p>de {branches.length} sedes registradas</p></section><section className="academy-overview-card"><span className="academy-overview-icon"><GraduationCap size={20} /></span><small>Alumnos</small><strong>{branches.reduce((total, branch) => total + branch.studentsCount, 0)}</strong><p>en toda la academia</p></section><section className="academy-overview-card"><span className="academy-overview-icon"><Users size={20} /></span><small>Profesores</small><strong>{new Set(branches.flatMap((branch) => branch.staffIds)).size}</strong><p>asignados a sedes</p></section><section className="academy-overview-card"><span className="academy-overview-icon"><CalendarDays size={20} /></span><small>Comisiones vigentes</small><strong>{activeCommissions.length}</strong><p>{courses.length} ofertas activas</p></section></div>
                    <div className="academy-overview-layout"><div className="data-table-card academy-branches-overview"><DataTable title="Estado de las sedes" subtitle="Resumen académico y financiero del mes por sede." rows={branches} getRowKey={(branch) => branch.id} onRowClick={(branch) => { setSelectedBranchId(branch.id); navigate(path(`sedes/${branch.id}`)) }} columns={[
                        { key: 'branch', header: 'Sede', accessor: (branch) => <strong>{branch.name}</strong> },
                        { key: 'students', header: 'Alumnos', accessor: (branch) => branch.studentsCount, align: 'center' },
                        { key: 'teachers', header: 'Profesores', accessor: (branch) => branch.staffIds.length, align: 'center' },
                        { key: 'commissions', header: 'Comisiones', accessor: (branch) => branch.id === 'BR-1001' ? activeCommissions.length : 0, align: 'center' },
                        { key: 'income', header: 'Ingresos', accessor: (branch) => <strong>{currency.format(branchIncome(branch.id))}</strong>, align: 'right' },
                        { key: 'expenses', header: 'Egresos', accessor: (branch) => currency.format(branchExpenses(branch.id)), align: 'right' },
                        { key: 'balance', header: 'Balance', accessor: (branch) => <strong className={branchIncome(branch.id) - branchExpenses(branch.id) < 0 ? 'academy-balance-negative' : 'academy-balance-positive'}>{currency.format(branchIncome(branch.id) - branchExpenses(branch.id))}</strong>, align: 'right' },
                        { key: 'action', header: '', accessor: () => <span className="academy-finance-link">Ver sede →</span>, align: 'right' },
                    ]} /></div></div>
                </div>}
                {activeTab === 'general' && <section className="academy-settings-card">
                    <div className="academy-section-heading"><FileCheck2 size={20} /><div><h2>Información general</h2><p>Datos institucionales visibles en la plataforma y documentos.</p></div></div>
                    <div className="form-grid academy-settings-grid">
                        <Field label="Nombre comercial"><input className="form-input" value={settings.general.commercialName} onChange={(event) => update('general', { commercialName: event.target.value })} /></Field>
                        <Field label="Razón social"><input className="form-input" value={settings.general.legalName} onChange={(event) => update('general', { legalName: event.target.value })} /></Field>
                        <Field label="CUIT"><input className="form-input" value={settings.general.taxId} onChange={(event) => update('general', { taxId: event.target.value })} /></Field>
                        <Field label="Estado"><select className="form-input" value={settings.general.status} onChange={(event) => update('general', { status: event.target.value as 'Activa' | 'Inactiva' })}><option>Activa</option><option>Inactiva</option></select></Field>
                        <Field label="Email institucional"><input className="form-input" type="email" value={settings.general.email} onChange={(event) => update('general', { email: event.target.value })} /></Field>
                        <Field label="Teléfono"><input className="form-input" type="tel" value={settings.general.phone} onChange={(event) => update('general', { phone: event.target.value })} /></Field>
                        <Field label="Sitio web"><input className="form-input" type="url" value={settings.general.website} onChange={(event) => update('general', { website: event.target.value })} /></Field>
                        <Field label="Dirección principal"><input className="form-input" value={settings.general.address} onChange={(event) => update('general', { address: event.target.value })} /></Field>
                        <Field label="Zona horaria"><select className="form-input" value={settings.general.timezone} onChange={(event) => update('general', { timezone: event.target.value })}><option value="America/Argentina/Cordoba">Argentina · Córdoba</option><option value="America/Argentina/Buenos_Aires">Argentina · Buenos Aires</option><option value="America/Montevideo">Uruguay · Montevideo</option></select></Field>
                        <Field label="Moneda"><select className="form-input" value={settings.general.currency} onChange={(event) => update('general', { currency: event.target.value })}><option value="ARS">Peso argentino (ARS)</option><option value="USD">Dólar estadounidense (USD)</option><option value="UYU">Peso uruguayo (UYU)</option></select></Field>
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
                            <Field label="Color principal"><div className="academy-color-field"><input type="color" value={settings.brand.primary} onChange={(event) => { const next = withPrimaryColor(settings, event.target.value); setSettings(next); setBrand(next.brand); setFeedback('') }} /><input className="form-input" value={settings.brand.primary} onChange={(event) => { const next = withPrimaryColor(settings, event.target.value); setSettings(next); if (hexToRgb(event.target.value)) setBrand(next.brand) }} /></div></Field>
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
                        <Field label="Prefijo de comprobantes"><input className="form-input" maxLength={8} value={settings.payments.receiptPrefix} onChange={(event) => update('payments', { receiptPrefix: event.target.value.toUpperCase() })} /></Field>
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
                        <Field label="Confirmación"><select className="form-input" value={settings.enrollments.confirmationMode} onChange={(event) => update('enrollments', { confirmationMode: event.target.value as 'Automática' | 'Manual' })}><option>Manual</option><option>Automática</option></select></Field>
                        <Field label="Duración de la reserva (horas)"><input className="form-input" type="number" min={1} value={settings.enrollments.reservationHours} onChange={(event) => update('enrollments', { reservationHours: Number(event.target.value) })} /></Field>
                        <Field label="Cupo predeterminado"><input className="form-input" type="number" min={1} value={settings.enrollments.defaultCapacity} onChange={(event) => update('enrollments', { defaultCapacity: Number(event.target.value) })} /></Field>
                    </div>
                    <div className="academy-options-section"><ToggleOption label="Requerir pago para confirmar" description="La vacante quedará pendiente hasta registrar el pago." checked={settings.enrollments.requirePayment} onChange={(checked) => update('enrollments', { requirePayment: checked })} /></div>
                    <div className="academy-options-section"><h3>Campos obligatorios</h3><div className="academy-options-grid">{enrollmentFields.map((field) => <ToggleOption key={field} label={field} checked={settings.enrollments.requiredFields.includes(field)} onChange={(checked) => toggleListValue('enrollments', field, checked)} />)}</div></div>
                    <div className="academy-options-section"><Field label="Términos y condiciones"><textarea className="form-textarea" value={settings.enrollments.terms} onChange={(event) => update('enrollments', { terms: event.target.value })} /></Field></div>
                </section>}
                {activeTab !== 'resumen' && <div className="academy-form-actions">
                    <span>Los cambios se aplicarán a toda la academia.</span>
                    <button type="button" className="primary-button academy-save-button" onClick={save}><Save size={16} />Guardar cambios</button>
                </div>}
            </div>
        </div>
    </div>
}
