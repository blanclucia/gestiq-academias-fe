import { AlertTriangle, ArrowDownRight, ArrowUpRight, CalendarClock, CheckCircle2, CreditCard, PencilLine, Plus, Search, Trash2, WalletCards } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { DeleteConfirmationModal, EntityFormModal, FormField, FormGrid, FormSection } from '@/components/crud/EntityFormModal'
import { FilterModal } from '@/components/crud/FilterModal'
import { FilterChips } from '@/components/crud/FilterChips'
import { splitFilterValue } from '@/components/crud/filterValues'
import { KpiCard } from '@/components/layout/KpiCard'
import { DataTable } from '@/components/ui/DataTable'
import { RowActionMenu } from '@/components/ui/RowActionMenu'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { listPayments, listStudents, useAcademyRepositoryVersion } from '@/services/academyRepository'
import { getExpenseDisplayStatus, listExpenses, useCreateExpense, useDeleteExpense, useFinanceRepositoryVersion, useUpdateExpense, type Expense, type ExpenseCategory, type ExpenseInput } from '@/services/financeRepository'
import type { PaymentMethod } from '@/types/domain'
import { useBranches, useSelectedBranchId } from '@/services/branchRepository'
import { validateConditions } from '@/components/forms/formValidation'
import { formatCurrencyARS, formatShortDate as formatDate } from '@/domain/shared/formattingRules'
import { DateRangeControl } from '@/components/ui/DateRangeControl'
import { calculateFinancialProjection } from '@/domain/finance/expenseRules'
import { useToast } from '@/components/ui/ToastContext'

type FinanceTab = 'summary' | 'expenses'
const currency = { format: formatCurrencyARS }
const categories: ExpenseCategory[] = ['Alquiler', 'Servicios', 'Sueldos', 'Impuestos', 'Insumos', 'Otro']

function localDate() {
    const date = new Date()
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function emptyExpense(branchId: string): ExpenseInput {
    return { concept: '', category: 'Alquiler', beneficiary: '', branchId, amount: 0, dueDate: '', status: 'Pendiente', paidDate: localDate(), method: 'Transferencia', recurrence: 'Único', repeatUntil: '', notes: '' }
}

export function FinancePage() {
    const [searchParams] = useSearchParams()
    useAcademyRepositoryVersion()
    useFinanceRepositoryVersion()
    const { showToast } = useToast()
    const createExpense = useCreateExpense()
    const updateExpense = useUpdateExpense()
    const deleteExpense = useDeleteExpense()
    const today = localDate()
    const selectedBranchId = useSelectedBranchId()
    const { branches } = useBranches()
    const selectedBranch = branches.find((branch) => branch.id === selectedBranchId) ?? branches[0]
    const [activeTab, setActiveTab] = useState<FinanceTab>(() => searchParams.get('tab') === 'expenses' ? 'expenses' : 'summary')
    const [expenseForm, setExpenseForm] = useState<ExpenseInput>(() => emptyExpense(selectedBranchId))
    const [isExpenseOpen, setIsExpenseOpen] = useState(false)
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
    const [editScope, setEditScope] = useState<'single' | 'future' | 'series'>('future')
    const [payTarget, setPayTarget] = useState<Expense | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null)
    const [paymentForm, setPaymentForm] = useState<{ paidDate: string; method: PaymentMethod }>({ paidDate: today, method: 'Transferencia' })
    const [search, setSearch] = useState('')
    const [dateRange, setDateRange] = useState(() => ({ from: `${today.slice(0, 7)}-01`, to: new Date(Number(today.slice(0, 4)), Number(today.slice(5, 7)), 0).toISOString().slice(0, 10) }))
    const [filters, setFilters] = useState<Record<string, string>>({ status: '', category: '', recurrence: '' })
    const [isFiltersOpen, setIsFiltersOpen] = useState(false)
    const expenseFilterFields = [
        { key: 'status', label: 'Estado', options: ['Pendiente', 'Vencido', 'Pagado'] },
        { key: 'category', label: 'Categoría', options: categories },
        { key: 'recurrence', label: 'Frecuencia', options: ['Único', 'Mensual'] },
    ]
    const [openMenuId, setOpenMenuId] = useState<string | null>(null)
    const expenses = listExpenses().filter((expense) => expense.branchId === selectedBranchId)
    // A payment has no branchId of its own — it's scoped to a sede through its student, same join
    // AdminDashboardPage already uses. (The old `selectedBranchId === 'BR-1001'` check was a stub
    // from before sede ids were real UUIDs; it never matched a real sede, so income always read $0.)
    const studentIdsInBranch = new Set(listStudents().filter((student) => student.branchId === selectedBranchId).map((student) => student.id))
    const payments = listPayments().filter((payment) => payment.studentId !== undefined && studentIdsInBranch.has(payment.studentId))

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
        const statuses = splitFilterValue(filters.status)
        const selectedCategories = splitFilterValue(filters.category)
        const recurrences = splitFilterValue(filters.recurrence)
        return (!expense.dueDate || !dateRange.from || expense.dueDate >= dateRange.from)
            && (!expense.dueDate || !dateRange.to || expense.dueDate <= dateRange.to)
            && (statuses.length === 0 || statuses.includes(status))
            && (selectedCategories.length === 0 || selectedCategories.includes(expense.category))
            && (recurrences.length === 0 || recurrences.includes(expense.recurrence))
            && `${expense.concept} ${expense.beneficiary}`.toLocaleLowerCase('es-AR').includes(search.toLocaleLowerCase('es-AR'))
    })

    const openCreate = () => { setEditingExpense(null); setExpenseForm(emptyExpense(selectedBranchId)); setIsExpenseOpen(true) }
    const openEdit = (expense: Expense) => { setEditingExpense(expense); setEditScope(expense.seriesId ? 'future' : 'single'); setExpenseForm({ ...expense, repeatUntil: '' }); setIsExpenseOpen(true) }

    return <div className="dashboard-page finance-page">
        <EntityFormModal open={isExpenseOpen} title={editingExpense ? 'Editar egreso' : 'Nuevo egreso'} subtitle={editingExpense ? 'Actualizá este vencimiento o los pendientes de la serie.' : 'Registrá un gasto único o calendarizá sus próximos vencimientos.'} submitLabel={editingExpense ? 'Guardar cambios' : 'Crear egreso'} validate={() => validateConditions({ expenseConcept: !expenseForm.concept.trim() && 'Ingresá el concepto.', expenseAmount: expenseForm.amount <= 0 && 'Ingresá un importe válido.', expenseDueDate: expenseForm.recurrence === 'Mensual' && !expenseForm.dueDate && 'Ingresá el primer vencimiento.', expensePaidDate: expenseForm.recurrence === 'Único' && expenseForm.status === 'Pagado' && !expenseForm.paidDate && 'Ingresá la fecha de pago.' }, 'Revisá los datos del egreso.')} onClose={() => setIsExpenseOpen(false)} onSubmit={() => {
            if (editingExpense) {
                updateExpense.mutate({ id: editingExpense.id, changes: expenseForm, scope: editScope }, {
                    onSuccess: () => showToast('success', 'Egreso actualizado correctamente.'),
                    onError: () => showToast('error', 'No se pudo actualizar el egreso. Intentá nuevamente.'),
                })
            } else {
                createExpense.mutate(expenseForm, {
                    onSuccess: () => showToast('success', 'Egreso creado correctamente.'),
                    onError: () => showToast('error', 'No se pudo crear el egreso. Intentá nuevamente.'),
                })
            }
            setActiveTab('expenses')
            setIsExpenseOpen(false)
        }}>
            <div className="form-stack"><FormSection title="Datos del egreso"><FormGrid>
                <FormField label="Concepto" required><input className="form-input" value={expenseForm.concept} onChange={(event) => setExpenseForm((current) => ({ ...current, concept: event.target.value }))} placeholder="Ej: Alquiler de la sede" /></FormField>
                <FormField label="Categoría" required><SearchableSelect value={expenseForm.category} onChange={(category) => setExpenseForm((current) => ({ ...current, category: category as ExpenseCategory }))} options={categories.map((item) => ({ value: item, label: item }))} /></FormField>
                <FormField label="Proveedor o beneficiario" required><input className="form-input" value={expenseForm.beneficiary} onChange={(event) => setExpenseForm((current) => ({ ...current, beneficiary: event.target.value }))} /></FormField>
                <FormField label="Importe" required><input className="form-input" type="number" min={0} value={expenseForm.amount || ''} onChange={(event) => setExpenseForm((current) => ({ ...current, amount: Number(event.target.value) }))} /></FormField>
                {expenseForm.status !== 'Pagado' && <FormField label={expenseForm.recurrence === 'Mensual' ? 'Primer vencimiento' : 'Vencimiento (opcional)'}><input className="form-input" type="date" value={expenseForm.dueDate} onChange={(event) => setExpenseForm((current) => ({ ...current, dueDate: event.target.value }))} /></FormField>}
            </FormGrid></FormSection>
            {editingExpense?.seriesId && <FormSection title="Alcance del cambio" description="Los vencimientos que ya fueron pagados nunca se modificarán."><FormGrid><FormField label="Aplicar cambios a"><SearchableSelect value={editScope} onChange={(scope) => setEditScope(scope as typeof editScope)} options={[{ value: 'future', label: 'Este y los siguientes' }, { value: 'single', label: 'Solo este vencimiento' }, { value: 'series', label: 'Toda la serie pendiente' }]} /></FormField></FormGrid></FormSection>}
            {!editingExpense && <FormSection title="Calendarización"><FormGrid>
                <FormField label="Frecuencia"><SearchableSelect value={expenseForm.recurrence} onChange={(recurrence) => setExpenseForm((current) => ({ ...current, recurrence: recurrence as ExpenseInput['recurrence'] }))} options={[{ value: 'Único', label: 'Pago único' }, { value: 'Mensual', label: 'Todos los meses' }]} /></FormField>
                {expenseForm.recurrence === 'Único' && <FormField label="Estado"><SearchableSelect value={expenseForm.status} onChange={(status) => setExpenseForm((current) => ({ ...current, status: status as ExpenseInput['status'], dueDate: status === 'Pagado' ? '' : current.dueDate, paidDate: status === 'Pagado' ? (current.paidDate || localDate()) : current.paidDate }))} options={[{ value: 'Pendiente', label: 'Pendiente' }, { value: 'Pagado', label: 'Pagado' }]} /></FormField>}
                {expenseForm.recurrence === 'Único' && expenseForm.status === 'Pagado' && <><FormField label="Fecha de pago"><input className="form-input" type="date" value={expenseForm.paidDate ?? ''} onChange={(event) => setExpenseForm((current) => ({ ...current, paidDate: event.target.value }))} /></FormField><FormField label="Medio de pago"><SearchableSelect value={expenseForm.method ?? 'Transferencia'} onChange={(method) => setExpenseForm((current) => ({ ...current, method: method as PaymentMethod }))} options={[{ value: 'Transferencia', label: 'Transferencia' }, { value: 'Tarjeta', label: 'Tarjeta' }, { value: 'Efectivo', label: 'Efectivo' }]} /></FormField></>}
                {expenseForm.recurrence === 'Mensual' && <FormField label="Generar vencimientos hasta"><div className="finance-date-with-help"><input className="form-input" type="date" min={expenseForm.dueDate} value={expenseForm.repeatUntil} onChange={(event) => setExpenseForm((current) => ({ ...current, repeatUntil: event.target.value }))} /><small>Opcional · por defecto 12 meses</small></div></FormField>}
            </FormGrid></FormSection>}</div>
        </EntityFormModal>

        <EntityFormModal open={Boolean(payTarget)} title="Registrar pago" subtitle={payTarget ? `${payTarget.concept} · ${currency.format(payTarget.amount)}` : ''} submitLabel="Confirmar pago" onClose={() => setPayTarget(null)} onSubmit={() => {
            if (payTarget) {
                updateExpense.mutate({ id: payTarget.id, changes: { status: 'Pagado', paidDate: paymentForm.paidDate, method: paymentForm.method } }, {
                    onError: () => showToast('error', 'No se pudo registrar el pago. Intentá nuevamente.'),
                })
            }
            setPayTarget(null)
        }}><FormGrid><FormField label="Fecha de pago"><input className="form-input" type="date" value={paymentForm.paidDate} onChange={(event) => setPaymentForm((current) => ({ ...current, paidDate: event.target.value }))} /></FormField><FormField label="Medio"><SearchableSelect value={paymentForm.method} onChange={(method) => setPaymentForm((current) => ({ ...current, method: method as PaymentMethod }))} options={[{ value: 'Transferencia', label: 'Transferencia' }, { value: 'Tarjeta', label: 'Tarjeta' }, { value: 'Efectivo', label: 'Efectivo' }]} /></FormField></FormGrid></EntityFormModal>
        <DeleteConfirmationModal open={Boolean(deleteTarget)} title="Eliminar egreso" description={`Se eliminará solamente el vencimiento de “${deleteTarget?.concept ?? ''}”.`} onClose={() => setDeleteTarget(null)} onConfirm={() => {
            if (deleteTarget) {
                deleteExpense.mutate(deleteTarget.id, { onError: () => showToast('error', 'No se pudo eliminar el egreso. Intentá nuevamente.') })
            }
            setDeleteTarget(null)
        }} />
        <FilterModal open={isFiltersOpen} title="Filtrar egresos" fields={expenseFilterFields} values={filters} onChange={setFilters} onClose={() => setIsFiltersOpen(false)} />

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
                        <button type="button" className="secondary-button compact-button" onClick={() => setIsFiltersOpen(true)}>Filtros</button>
                        <FilterChips fields={expenseFilterFields} values={filters} onChange={setFilters} />
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
                        { key: 'status', header: 'Estado', accessor: (expense) => { const status = getExpenseDisplayStatus(expense, today); return <StatusBadge label={status} tone={status === 'Pagado' ? 'success' : status === 'Vencido' ? 'warning' : status === 'Pendiente' ? 'warning' : 'neutral'} /> }, align: 'center' },
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
