import { AlertTriangle, ArrowDownRight, ArrowUpRight, CalendarClock, CheckCircle2, CreditCard, PencilLine, Plus, Search, Trash2, WalletCards } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { DeleteConfirmationModal, EntityFormModal, FormField, FormGrid, FormSection } from '@/components/crud/EntityFormModal'
import { KpiCard } from '@/components/layout/KpiCard'
import { DataTable } from '@/components/ui/DataTable'
import { RowActionMenu } from '@/components/ui/RowActionMenu'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { listPayments, useAcademyRepositoryVersion } from '@/services/academyRepository'
import { createExpense, getExpenseDisplayStatus, listExpenses, payExpense, removeExpense, updateRecurringExpenses, useFinanceRepositoryVersion, type Expense, type ExpenseCategory, type ExpenseInput } from '@/services/financeRepository'
import type { PaymentMethod } from '@/types/domain'
import { listBranches, useSelectedBranchId } from '@/services/branchRepository'
import { validateConditions } from '@/components/forms/formValidation'
import { formatCurrencyARS, formatShortDate as formatDate } from '@/domain/shared/formattingRules'
import { DateRangeControl } from '@/components/ui/DateRangeControl'
import { calculateFinancialProjection } from '@/domain/finance/expenseRules'

type FinanceTab = 'summary' | 'expenses'
const currency = { format: formatCurrencyARS }
const categories: ExpenseCategory[] = ['Alquiler', 'Servicios', 'Sueldos', 'Impuestos', 'Insumos', 'Otro']

function localDate() {
    const date = new Date()
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function emptyExpense(branchId: string, branchName: string): ExpenseInput {
    return { concept: '', category: 'Alquiler', beneficiary: '', branchId, branch: branchName, amount: 0, dueDate: '', status: 'Pendiente', paidDate: localDate(), method: 'Transferencia', recurrence: 'Único', repeatUntil: '', notes: '' }
}

export function FinancePage() {
    const [searchParams] = useSearchParams()
    useAcademyRepositoryVersion()
    useFinanceRepositoryVersion()
    const today = localDate()
    const selectedBranchId = useSelectedBranchId()
    const branches = listBranches()
    const selectedBranch = branches.find((branch) => branch.id === selectedBranchId) ?? branches[0]
    const [activeTab, setActiveTab] = useState<FinanceTab>(() => searchParams.get('tab') === 'expenses' ? 'expenses' : 'summary')
    const [expenseForm, setExpenseForm] = useState<ExpenseInput>(() => emptyExpense(selectedBranchId, selectedBranch?.name ?? 'Sede actual'))
    const [isExpenseOpen, setIsExpenseOpen] = useState(false)
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
    const [editScope, setEditScope] = useState<'single' | 'future' | 'series'>('future')
    const [payTarget, setPayTarget] = useState<Expense | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null)
    const [paymentForm, setPaymentForm] = useState<{ paidDate: string; method: PaymentMethod }>({ paidDate: today, method: 'Transferencia' })
    const [search, setSearch] = useState('')
    const [dateRange, setDateRange] = useState(() => ({ from: `${today.slice(0, 7)}-01`, to: new Date(Number(today.slice(0, 4)), Number(today.slice(5, 7)), 0).toISOString().slice(0, 10) }))
    const [filters, setFilters] = useState({ status: '', category: '', recurrence: '' })
    const [filterDraft, setFilterDraft] = useState(filters)
    const [isFiltersOpen, setIsFiltersOpen] = useState(false)
    const [openMenuId, setOpenMenuId] = useState<string | null>(null)
    const expenses = listExpenses().filter((expense) => expense.branchId === selectedBranchId)
    const payments = selectedBranchId === 'BR-1001' ? listPayments() : []

    const isInDateRange = (date?: string) => Boolean(date)
        && (!dateRange.from || date! >= dateRange.from)
        && (!dateRange.to || date! <= dateRange.to)
    const periodExpenses = expenses.filter((expense) => isInDateRange(expense.status === 'Pagado' ? expense.paidDate : expense.dueDate))
    const periodPayments = payments.filter((payment) => isInDateRange(payment.status === 'Pagado' ? payment.date : payment.dueDate))
    const received = periodPayments.filter((payment) => payment.status === 'Pagado').reduce((total, payment) => total + payment.amount, 0)
    const paid = periodExpenses.filter((expense) => expense.status === 'Pagado').reduce((total, expense) => total + expense.amount, 0)
    const committed = periodExpenses.filter((expense) => expense.status !== 'Pagado').reduce((total, expense) => total + expense.amount, 0)
    const projection = calculateFinancialProjection(periodPayments, periodExpenses)
    const reminders = expenses.filter((expense) => expense.status !== 'Pagado' && expense.dueDate && expense.dueDate <= addDays(today, 14)).slice(0, 5)
    const filteredExpenses = expenses.filter((expense) => {
        const status = getExpenseDisplayStatus(expense, today)
        return (!expense.dueDate || !dateRange.from || expense.dueDate >= dateRange.from)
            && (!expense.dueDate || !dateRange.to || expense.dueDate <= dateRange.to)
            && (!filters.status || status === filters.status)
            && (!filters.category || expense.category === filters.category)
            && (!filters.recurrence || expense.recurrence === filters.recurrence)
            && `${expense.concept} ${expense.beneficiary}`.toLocaleLowerCase('es-AR').includes(search.toLocaleLowerCase('es-AR'))
    })
    const activeFilterCount = Object.values(filters).filter(Boolean).length

    const openCreate = () => { setEditingExpense(null); setExpenseForm(emptyExpense(selectedBranchId, selectedBranch?.name ?? 'Sede actual')); setIsExpenseOpen(true) }
    const openEdit = (expense: Expense) => { setEditingExpense(expense); setEditScope(expense.seriesId ? 'future' : 'single'); setExpenseForm({ ...expense, repeatUntil: '' }); setIsExpenseOpen(true) }

    return <div className="dashboard-page finance-page">
        <EntityFormModal open={isExpenseOpen} title={editingExpense ? 'Editar egreso' : 'Nuevo egreso'} subtitle={editingExpense ? 'Actualizá este vencimiento o los pendientes de la serie.' : 'Registrá un gasto único o calendarizá sus próximos vencimientos.'} submitLabel={editingExpense ? 'Guardar cambios' : 'Crear egreso'} validate={() => validateConditions({ expenseConcept: !expenseForm.concept.trim() && 'Ingresá el concepto.', expenseAmount: expenseForm.amount <= 0 && 'Ingresá un importe válido.', expenseDueDate: expenseForm.recurrence === 'Mensual' && !expenseForm.dueDate && 'Ingresá el primer vencimiento.', expensePaidDate: expenseForm.recurrence === 'Único' && expenseForm.status === 'Pagado' && !expenseForm.paidDate && 'Ingresá la fecha de pago.' }, 'Revisá los datos del egreso.')} onClose={() => setIsExpenseOpen(false)} onSubmit={() => {
            if (editingExpense) updateRecurringExpenses(editingExpense.id, expenseForm, editScope)
            else createExpense(expenseForm)
            setActiveTab('expenses')
            setIsExpenseOpen(false)
        }}>
            <div className="form-stack"><FormSection title="Datos del egreso"><FormGrid>
                <FormField label="Concepto" required><input className="form-input" value={expenseForm.concept} onChange={(event) => setExpenseForm((current) => ({ ...current, concept: event.target.value }))} placeholder="Ej: Alquiler de la sede" /></FormField>
                <FormField label="Categoría" required><select className="form-input" value={expenseForm.category} onChange={(event) => setExpenseForm((current) => ({ ...current, category: event.target.value as ExpenseCategory }))}>{categories.map((item) => <option key={item}>{item}</option>)}</select></FormField>
                <FormField label="Proveedor o beneficiario" required><input className="form-input" value={expenseForm.beneficiary} onChange={(event) => setExpenseForm((current) => ({ ...current, beneficiary: event.target.value }))} /></FormField>
                <FormField label="Importe" required><input className="form-input" type="number" min={0} value={expenseForm.amount || ''} onChange={(event) => setExpenseForm((current) => ({ ...current, amount: Number(event.target.value) }))} /></FormField>
                {expenseForm.status !== 'Pagado' && <FormField label={expenseForm.recurrence === 'Mensual' ? 'Primer vencimiento' : 'Vencimiento (opcional)'}><input className="form-input" type="date" value={expenseForm.dueDate} onChange={(event) => setExpenseForm((current) => ({ ...current, dueDate: event.target.value }))} /></FormField>}
            </FormGrid></FormSection>
            {editingExpense?.seriesId && <FormSection title="Alcance del cambio" description="Los vencimientos que ya fueron pagados nunca se modificarán."><FormGrid><FormField label="Aplicar cambios a"><select className="form-input" value={editScope} onChange={(event) => setEditScope(event.target.value as typeof editScope)}><option value="future">Este y los siguientes</option><option value="single">Solo este vencimiento</option><option value="series">Toda la serie pendiente</option></select></FormField></FormGrid></FormSection>}
            {!editingExpense && <FormSection title="Calendarización"><FormGrid>
                <FormField label="Frecuencia"><select className="form-input" value={expenseForm.recurrence} onChange={(event) => setExpenseForm((current) => ({ ...current, recurrence: event.target.value as ExpenseInput['recurrence'] }))}><option value="Único">Pago único</option><option value="Mensual">Todos los meses</option></select></FormField>
                {expenseForm.recurrence === 'Único' && <FormField label="Estado"><select className="form-input" value={expenseForm.status} onChange={(event) => setExpenseForm((current) => ({ ...current, status: event.target.value as ExpenseInput['status'], dueDate: event.target.value === 'Pagado' ? '' : current.dueDate, paidDate: event.target.value === 'Pagado' ? (current.paidDate || localDate()) : current.paidDate }))}><option value="Pendiente">Pendiente</option><option value="Pagado">Pagado</option></select></FormField>}
                {expenseForm.recurrence === 'Único' && expenseForm.status === 'Pagado' && <><FormField label="Fecha de pago"><input className="form-input" type="date" value={expenseForm.paidDate ?? ''} onChange={(event) => setExpenseForm((current) => ({ ...current, paidDate: event.target.value }))} /></FormField><FormField label="Medio de pago"><select className="form-input" value={expenseForm.method ?? 'Transferencia'} onChange={(event) => setExpenseForm((current) => ({ ...current, method: event.target.value as PaymentMethod }))}><option>Transferencia</option><option>Tarjeta</option><option>Efectivo</option></select></FormField></>}
                {expenseForm.recurrence === 'Mensual' && <FormField label="Generar vencimientos hasta"><div className="finance-date-with-help"><input className="form-input" type="date" min={expenseForm.dueDate} value={expenseForm.repeatUntil} onChange={(event) => setExpenseForm((current) => ({ ...current, repeatUntil: event.target.value }))} /><small>Opcional · por defecto 12 meses</small></div></FormField>}
            </FormGrid></FormSection>}</div>
        </EntityFormModal>

        <EntityFormModal open={Boolean(payTarget)} title="Registrar pago" subtitle={payTarget ? `${payTarget.concept} · ${currency.format(payTarget.amount)}` : ''} submitLabel="Confirmar pago" onClose={() => setPayTarget(null)} onSubmit={() => { if (payTarget) payExpense(payTarget.id, paymentForm.paidDate, paymentForm.method); setPayTarget(null) }}><FormGrid><FormField label="Fecha de pago"><input className="form-input" type="date" value={paymentForm.paidDate} onChange={(event) => setPaymentForm((current) => ({ ...current, paidDate: event.target.value }))} /></FormField><FormField label="Medio"><select className="form-input" value={paymentForm.method} onChange={(event) => setPaymentForm((current) => ({ ...current, method: event.target.value as PaymentMethod }))}><option>Transferencia</option><option>Tarjeta</option><option>Efectivo</option></select></FormField></FormGrid></EntityFormModal>
        <DeleteConfirmationModal open={Boolean(deleteTarget)} title="Eliminar egreso" description={`Se eliminará solamente el vencimiento de “${deleteTarget?.concept ?? ''}”.`} onClose={() => setDeleteTarget(null)} onConfirm={() => { if (deleteTarget) removeExpense(deleteTarget.id); setDeleteTarget(null) }} />
        <EntityFormModal open={isFiltersOpen} title="Filtrar egresos" subtitle="Combiná los criterios para acotar los vencimientos." submitLabel="Aplicar filtros" cancelLabel="Cancelar" onClose={() => setIsFiltersOpen(false)} onSubmit={() => { setFilters(filterDraft); setIsFiltersOpen(false) }}><FormGrid><FormField label="Estado"><select className="form-input" value={filterDraft.status} onChange={(event) => setFilterDraft((current) => ({ ...current, status: event.target.value }))}><option value="">Todos</option><option>Pendiente</option><option>Vencido</option><option>Pagado</option></select></FormField><FormField label="Categoría"><select className="form-input" value={filterDraft.category} onChange={(event) => setFilterDraft((current) => ({ ...current, category: event.target.value }))}><option value="">Todas</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></FormField><FormField label="Frecuencia"><select className="form-input" value={filterDraft.recurrence} onChange={(event) => setFilterDraft((current) => ({ ...current, recurrence: event.target.value }))}><option value="">Todas</option><option value="Único">Pago único</option><option value="Mensual">Mensual</option></select></FormField></FormGrid></EntityFormModal>

        <div className="page-header finance-header"><div><h1>Finanzas</h1><p>Ingresos, egresos y compromisos de {selectedBranch?.name ?? 'la sede'}.</p></div></div>
        <div className="finance-page-tabs"><Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as FinanceTab)}><TabsList variant="line" aria-label="Secciones de finanzas"><TabsTrigger value="summary">Resumen</TabsTrigger><TabsTrigger value="expenses">Egresos</TabsTrigger></TabsList></Tabs><button type="button" className="primary-button compact-button context-primary-action" onClick={openCreate}><Plus size={16} /> Nuevo egreso</button></div>
        <div className="data-table-card finance-main-card">
            {activeTab === 'summary' && <div className="finance-tab-content">
                <div className="finance-summary-date-range"><DateRangeControl value={dateRange} onChange={setDateRange} /></div>
                <div className="kpi-grid"><KpiCard title="Ingresos cobrados" value={currency.format(received)} change="En el período" /><KpiCard title="Ingresos proyectados" value={currency.format(projection.projectedIncome)} change="Cobrados y por cobrar" /><KpiCard title="Egresos planificados" value={currency.format(projection.plannedExpenses)} change={`${currency.format(paid)} pagados · ${currency.format(committed)} pendientes`} positive={false} /><KpiCard title="Resultado proyectado" value={currency.format(projection.projectedBalance)} change={`${projection.coverageRate.toFixed(1)}% de cobertura`} positive={projection.projectedBalance >= 0} /></div>
                <div className="finance-summary-grid"><section className="finance-panel"><div className="finance-panel-heading"><div><h3>Próximos vencimientos</h3><p>Obligaciones a atender en los próximos 14 días.</p></div><CalendarClock size={20} /></div><div className="finance-reminder-list">{reminders.map((expense) => <button type="button" key={expense.id} onClick={() => { setActiveTab('expenses'); setSearch(expense.concept) }}><span className={getExpenseDisplayStatus(expense, today) === 'Vencido' ? 'danger' : 'warning'}>{getExpenseDisplayStatus(expense, today) === 'Vencido' ? <AlertTriangle size={17} /> : <CalendarClock size={17} />}</span><span><strong>{expense.concept}</strong><small>{expense.category} · vence {formatDate(expense.dueDate)}</small></span><b>{currency.format(expense.amount)}</b></button>)}{reminders.length === 0 && <div className="finance-empty"><CheckCircle2 size={22} /> No hay vencimientos próximos.</div>}</div></section><section className="finance-panel"><div className="finance-panel-heading"><div><h3>Balance del mes</h3><p>Movimientos efectivamente realizados.</p></div><WalletCards size={20} /></div><div className="finance-balance"><div><span><ArrowUpRight size={17} /> Ingresos</span><strong>{currency.format(received)}</strong></div><div><span><ArrowDownRight size={17} /> Egresos</span><strong>{currency.format(paid)}</strong></div><div className="total"><span>Resultado</span><strong>{currency.format(received - paid)}</strong></div></div></section></div>
            </div>}

            {activeTab === 'expenses' && <div className="finance-tab-content">
                <div className="student-table-toolbar">
                    <div className="student-table-toolbar-left">
                        <label className="search-input-wrap" style={{ flex: '0 0 420px', width: 420, maxWidth: '46%', minWidth: 260 }}><Search aria-hidden="true" size={16} strokeWidth={2.2} className="search-input-icon" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar concepto o proveedor" /></label>
                        <button type="button" className="secondary-button compact-button" onClick={() => { setFilterDraft(filters); setIsFiltersOpen(true) }}>Filtros{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}</button>
                    </div>
                    <div className="student-table-toolbar-center"><DateRangeControl value={dateRange} onChange={setDateRange} ariaLabel="Rango de vencimientos" /></div>
                    <div className="student-table-toolbar-right" />
                </div>
                <DataTable
                    rows={filteredExpenses}
                    getRowKey={(expense) => expense.id}
                    columns={[
                        { key: 'concept', header: 'Concepto', accessor: (expense) => <div className="finance-expense-main"><span className={`finance-expense-icon ${getExpenseDisplayStatus(expense, today).toLowerCase()}`}>{getExpenseDisplayStatus(expense, today) === 'Pagado' ? <CheckCircle2 size={18} /> : getExpenseDisplayStatus(expense, today) === 'Vencido' ? <AlertTriangle size={18} /> : <CalendarClock size={18} />}</span><div><strong>{expense.concept}</strong><small>{expense.beneficiary || 'Sin beneficiario'}</small></div></div> },
                        { key: 'category', header: 'Categoría', accessor: (expense) => expense.category },
                        { key: 'dueDate', header: 'Vencimiento', accessor: (expense) => <strong>{formatDate(expense.dueDate)}</strong> },
                        { key: 'recurrence', header: 'Frecuencia', accessor: (expense) => expense.recurrence === 'Mensual' ? 'Mensual' : 'Pago único' },
                        { key: 'amount', header: 'Importe', accessor: (expense) => <strong>{currency.format(expense.amount)}</strong>, align: 'right' },
                        { key: 'status', header: 'Estado', accessor: (expense) => { const status = getExpenseDisplayStatus(expense, today); return <StatusBadge label={status} tone={status === 'Pagado' ? 'success' : status === 'Vencido' ? 'warning' : 'neutral'} /> }, align: 'center' },
                    ]}
                    renderActions={(expense) => {
                        const status = getExpenseDisplayStatus(expense, today)
                        return <RowActionMenu ariaLabel={`Acciones para ${expense.concept}`} active={openMenuId === expense.id} onToggle={() => setOpenMenuId((current) => current === expense.id ? null : expense.id)} actions={[
                            ...(status !== 'Pagado' ? [{ label: 'Registrar pago', icon: <CreditCard size={15} />, onClick: () => { setPaymentForm({ paidDate: today, method: 'Transferencia' }); setPayTarget(expense) } }] : []),
                            { label: 'Editar', icon: <PencilLine size={15} />, onClick: () => openEdit(expense) },
                            { label: 'Eliminar', icon: <Trash2 size={15} />, variant: 'danger' as const, onClick: () => setDeleteTarget(expense) },
                        ]} />
                    }}
                    emptyLabel="No se encontraron egresos con esos filtros."
                />
            </div>}

        </div>
    </div>
}

function addDays(dateText: string, days: number) {
    const date = new Date(`${dateText}T12:00:00`)
    date.setDate(date.getDate() + days)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
