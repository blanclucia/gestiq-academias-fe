import { endOfMonth, format, isWithinInterval, parseISO, startOfDay, startOfMonth } from 'date-fns'
import { useEffect, useMemo, useState } from 'react'
import { CrudListPage } from '@/components/crud/CrudListPage'
import { DeleteConfirmationModal } from '@/components/crud/EntityFormModal'
import { useCrudList } from '@/hooks/useCrudList'
import type { Payment } from '@/types/domain'
import { confirmPaymentRecord, getPaymentRemovalBlocker, listPayments, listStudents, updatePaymentRecord, useAcademyRepositoryVersion, useCreateCharge, useDeleteCharge, useUpdateCharge } from '@/services/academyRepository'
import { chargeMethodToApi, chargeStatusToApi } from '@/services/organization/chargesMapping'
import { getNextDueDateForDay } from '@/domain/billing/billingRules'
import { getPaymentReferenceDate as getReferenceDate, resolveChargeCollectionStatus } from '@/domain/billing/paymentRules'
import { useAcademySettings } from '@/services/academySettingsRepository'
import { useToast } from '@/components/ui/ToastContext'
import { ManualChargeModal } from '../components/ManualChargeModal'
import { BillingSummary } from '../components/BillingSummary'
import { BillingTable, type BillingPaymentRecord } from '../components/BillingTable'
import { BillingContextHeader, type BillingTab } from '../components/BillingToolbar'
import { DateRangeControl } from '@/components/ui/DateRangeControl'
import { PaymentAdjustmentModal, type PaymentAdjustmentValue } from '../components/PaymentAdjustmentModal'
import { PaymentCollectionModal } from '../components/PaymentCollectionModal'
import { PaymentEditModal } from '../components/PaymentEditModal'
import { PaymentLinkModal } from '../components/PaymentLinkModal'
import { splitFilterValue } from '@/components/crud/filterValues'
import { useWorkspace } from '@/workspace/useWorkspace'

const defaultAdjustmentForm: PaymentAdjustmentValue = {
    type: 'Bonificacion total',
    mode: 'percentage',
    value: '',
    reason: '',
}

const paymentMethods: Payment['method'][] = ['Transferencia', 'Tarjeta', 'Efectivo']

export function BillingPage() {
    const { organization } = useWorkspace()
    useAcademyRepositoryVersion()
    const { showToast } = useToast()
    const createCharge = useCreateCharge()
    const updateCharge = useUpdateCharge()
    const deleteCharge = useDeleteCharge()
    const { settings: academySettings } = useAcademySettings()
    const enabledPaymentMethods = paymentMethods.filter((method) => academySettings?.payments.enabledMethods.includes(method))
    // Never leave staff unable to register any payment at all if the org hasn't enabled any method yet.
    const availablePaymentMethods = enabledPaymentMethods.length > 0 ? enabledPaymentMethods : paymentMethods
    const [activeTab, setActiveTab] = useState<BillingTab>('resumen')
    const today = startOfDay(new Date())
    const suggestedDueDate = getNextDueDateForDay(academySettings?.payments.defaultDueDay ?? 10, format(today, 'yyyy-MM-dd'))
    const [dateRange, setDateRange] = useState({
        from: format(startOfMonth(today), 'yyyy-MM-dd'),
        to: format(endOfMonth(today), 'yyyy-MM-dd'),
    })
    const [openMenuId, setOpenMenuId] = useState<string | null>(null)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [editingPayment, setEditingPayment] = useState<BillingPaymentRecord | null>(null)
    const [editingPaymentForm, setEditingPaymentForm] = useState({ method: 'Transferencia' as Payment['method'], amount: 0, dueDate: '', status: 'Pendiente' as Payment['status'] })
    const [collectTarget, setCollectTarget] = useState<BillingPaymentRecord | null>(null)
    const [collectForm, setCollectForm] = useState<{ date: string; method: Payment['method'] }>({
        date: format(today, 'yyyy-MM-dd'),
        method: 'Transferencia',
    })
    const [deleteTarget, setDeleteTarget] = useState<BillingPaymentRecord | null>(null)
    const [adjustTarget, setAdjustTarget] = useState<BillingPaymentRecord | null>(null)
    const [adjustmentForm, setAdjustmentForm] = useState<PaymentAdjustmentValue>(defaultAdjustmentForm)
    const [paymentLinkTarget, setPaymentLinkTarget] = useState<BillingPaymentRecord | null>(null)
    const [copyFeedback, setCopyFeedback] = useState('')
    const [activeFilters, setActiveFilters] = useState({ student: '' })
    const [isManualChargeOpen, setIsManualChargeOpen] = useState(false)
    const [manualChargeForm, setManualChargeForm] = useState({ studentId: '', category: 'Examen', detail: '', amount: '', status: 'Pendiente' as 'Pendiente' | 'Pagado', method: 'Transferencia' as Payment['method'], dueDate: suggestedDueDate, date: format(today, 'yyyy-MM-dd'), notes: '' })
    const paymentList = listPayments()
    const studentOptions = listStudents()
    const paymentRemovalBlocker = deleteTarget ? getPaymentRemovalBlocker() : null

    const graceDays = academySettings?.payments.graceDays ?? 0
    const paymentRows = useMemo(
        () => paymentList.map((payment) => ({ ...payment, statusView: resolveChargeCollectionStatus(payment.chargeSnapshot, today, graceDays) })),
        [paymentList, today, graceDays],
    )

    const filteredByContext = useMemo(() => {
        const fromDate = dateRange.from ? parseISO(dateRange.from) : startOfMonth(today)
        const toDate = dateRange.to ? parseISO(dateRange.to) : endOfMonth(today)
        const rangeStart = startOfDay(fromDate <= toDate ? fromDate : toDate)
        const rangeEnd = startOfDay(fromDate <= toDate ? toDate : fromDate)

        return paymentRows.filter((payment) => {
            const matchesTab =
                activeTab === 'resumen'
                    ? true
                    : activeTab === 'recibidos'
                        ? payment.statusView === 'Pagado'
                        : activeTab === 'vencidos'
                            ? payment.statusView === 'Vencido'
                            : payment.statusView === 'Pendiente' || payment.statusView === 'En verificación' || payment.statusView === 'Rechazado'

            if (!matchesTab) {
                return false
            }

            const selectedStudents = splitFilterValue(activeFilters.student)
            const matchesStudent =
                selectedStudents.length === 0 || selectedStudents.includes(payment.student)

            if (!matchesStudent) {
                return false
            }

            const referenceDate = getReferenceDate(payment, payment.statusView)
            return isWithinInterval(parseISO(referenceDate), { start: rangeStart, end: rangeEnd })
        })
    }, [activeFilters.student, activeTab, dateRange.from, dateRange.to, paymentRows, today])

    const {
        search,
        setSearch,
        selectedIds,
        selectedCount,
        currentPage,
        setCurrentPage,
        totalPages,
        paginatedItems: paginatedPayments,
        toggleSelection,
        toggleSelectAll,
        resetSelection,
    } = useCrudList<BillingPaymentRecord>({
        items: filteredByContext,
        pageSize: 10,
        searchFields: [
            (payment) => `${payment.student} ${payment.concept}`,
            (payment) => payment.method,
            (payment) => payment.dueDate,
        ],
    })

    useEffect(() => {
        setCurrentPage(1)
        resetSelection()
    }, [activeTab, activeFilters, resetSelection, setCurrentPage])

    const exportPayments = () => {
        const quote = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`
        const csv = [
            ['Alumno', 'Concepto', 'Monto', 'Medio', 'Vencimiento', 'Fecha de pago', 'Estado'],
            ...filteredByContext.map((payment) => [payment.student, payment.concept, payment.amount, payment.method, payment.dueDate, payment.date, payment.statusView]),
        ].map((row) => row.map(quote).join(',')).join('\n')
        const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
        const link = document.createElement('a')
        link.href = url
        link.download = 'pagos.csv'
        link.click()
        URL.revokeObjectURL(url)
    }

    const summaryInterval = useMemo(() => {
        const fromDate = dateRange.from ? parseISO(dateRange.from) : startOfMonth(today)
        const toDate = dateRange.to ? parseISO(dateRange.to) : endOfMonth(today)
        const start = startOfDay(fromDate <= toDate ? fromDate : toDate)
        const end = startOfDay(fromDate <= toDate ? toDate : fromDate)

        return { start, end }
    }, [dateRange.from, dateRange.to, today])

    const monthMetrics = useMemo(() => {
        // Exam-fee installments (examinationsRepository.ts, still 100% mock) are rendered as table
        // rows like any other charge, but they have no backing row in the backend — they shouldn't
        // inflate the rolled-up KPI totals here the way a real charge does.
        const monthPayments = paymentRows.filter((payment) => {
            if (!payment.isReal) return false
            const referenceDate = parseISO(getReferenceDate(payment, payment.statusView))
            return isWithinInterval(referenceDate, { start: summaryInterval.start, end: summaryInterval.end })
        })

        return {
            totalReceived: monthPayments
                .filter((payment) => payment.statusView === 'Pagado')
                .reduce((acc, payment) => acc + payment.amount, 0),
            receivedCount: monthPayments.filter((payment) => payment.statusView === 'Pagado').length,
            totalPending: monthPayments
                .filter((payment) => payment.statusView === 'Pendiente' || payment.statusView === 'En verificación' || payment.statusView === 'Rechazado')
                .reduce((acc, payment) => acc + payment.amount, 0),
            pendingCount: monthPayments.filter((payment) => payment.statusView === 'Pendiente' || payment.statusView === 'Rechazado').length,
            totalOverdue: monthPayments
                .filter((payment) => payment.statusView === 'Vencido')
                .reduce((acc, payment) => acc + payment.amount, 0),
            overdueCount: monthPayments.filter((payment) => payment.statusView === 'Vencido').length,
            remindersSent: monthPayments.filter((payment) => Boolean(payment.lastReminderAt)).length,
            receivedByMethod: paymentMethods.map((method) => {
                const methodPayments = monthPayments.filter(
                    (payment) => payment.statusView === 'Pagado' && payment.method === method,
                )

                return {
                    method,
                    total: methodPayments.reduce((acc, payment) => acc + payment.amount, 0),
                    count: methodPayments.length,
                }
            }),
        }
    }, [paymentRows, summaryInterval.end, summaryInterval.start])

    const paymentById = useMemo(() => new Map(paymentRows.map((payment) => [payment.id, payment])), [paymentRows])

    const isSelectAllChecked =
        paginatedPayments.length > 0 && paginatedPayments.every((payment) => selectedIds.includes(payment.id))

    const totalPortfolio = monthMetrics.totalReceived + monthMetrics.totalPending + monthMetrics.totalOverdue
    const collectionRate = totalPortfolio > 0 ? (monthMetrics.totalReceived / totalPortfolio) * 100 : 0
    const riskRate = totalPortfolio > 0 ? (monthMetrics.totalOverdue / totalPortfolio) * 100 : 0

    const summaryPeriodLabel = `${format(summaryInterval.start, 'dd/MM/yyyy')} - ${format(summaryInterval.end, 'dd/MM/yyyy')}`

    const selectedPendingCount = filteredByContext.filter(
        (payment) => selectedIds.includes(payment.id) && (payment.statusView === 'Pendiente' || payment.statusView === 'En verificación' || payment.statusView === 'Vencido'),
    ).length

    const sendReminder = (target: BillingPaymentRecord) => {
        updatePaymentRecord(target.id, { lastReminderAt: format(today, 'yyyy-MM-dd') })
    }

    const openCollectModal = (target: BillingPaymentRecord) => {
        setCollectTarget(target)
        setCollectForm({
            date: format(today, 'yyyy-MM-dd'),
            method: target.method,
        })
    }

    const openAdjustModal = (target: BillingPaymentRecord) => {
        setAdjustTarget(target)
        setAdjustmentForm(
            target.adjustment
                ? {
                    type: target.adjustment.type,
                    mode: target.adjustment.mode ?? 'percentage',
                    value: target.adjustment.value ? String(target.adjustment.value) : '',
                    reason: target.adjustment.reason,
                }
                : defaultAdjustmentForm,
        )
    }

    const adjustedAmountPreview = useMemo(() => {
        if (!adjustTarget) {
            return 0
        }

        const originalAmount = adjustTarget.originalAmount

        if (adjustmentForm.type === 'Bonificacion total') {
            return 0
        }

        if (adjustmentForm.type === 'Importe manual') {
            return Math.max(0, Number(adjustmentForm.value || 0))
        }

        const numericValue = Number(adjustmentForm.value || 0)

        if (adjustmentForm.type === 'Recargo por mora') {
            return Math.max(0, Math.round(originalAmount * (1 + numericValue / 100)))
        }

        if (adjustmentForm.mode === 'percentage') {
            return Math.max(0, Math.round(originalAmount * (1 - numericValue / 100)))
        }

        return Math.max(0, originalAmount - numericValue)
    }, [adjustTarget, adjustmentForm.mode, adjustmentForm.type, adjustmentForm.value])

    const submitAdjustment = () => {
        if (!adjustTarget) {
            return
        }

        if (adjustTarget.isReal) {
            updateCharge.mutate({ id: adjustTarget.id, changes: { amount: adjustedAmountPreview, notes: adjustmentForm.reason.trim() } }, {
                onError: () => showToast('error', 'No se pudo ajustar el cargo. Intentá nuevamente.'),
            })
        } else {
            updatePaymentRecord(adjustTarget.id, { amount: adjustedAmountPreview })
        }

        setAdjustTarget(null)
        setAdjustmentForm(defaultAdjustmentForm)
    }

    const submitCollection = () => {
        if (!collectTarget || !collectForm.date) {
            return
        }

        if (collectTarget.isReal) {
            updateCharge.mutate({ id: collectTarget.id, changes: { status: 'paid', method: chargeMethodToApi(collectForm.method), paidAt: collectForm.date, paidAmount: collectTarget.amount } }, {
                onError: () => showToast('error', 'No se pudo registrar el cobro. Intentá nuevamente.'),
            })
        } else {
            confirmPaymentRecord(collectTarget.id, collectForm.method, collectForm.date)
        }

        setCollectTarget(null)
    }

    const resetManualChargeForm = () => {
        setManualChargeForm({ studentId: '', category: 'Examen', detail: '', amount: '', status: 'Pendiente', method: 'Transferencia', dueDate: suggestedDueDate, date: format(today, 'yyyy-MM-dd'), notes: '' })
    }

    const submitManualCharge = () => {
        const amount = Number(manualChargeForm.amount)
        const concept = `${manualChargeForm.category}${manualChargeForm.detail.trim() ? ` · ${manualChargeForm.detail.trim()}` : ''}`
        createCharge.mutate({
            studentId: manualChargeForm.studentId,
            concept,
            amount,
            dueDate: manualChargeForm.status === 'Pendiente' ? manualChargeForm.dueDate : manualChargeForm.date,
            status: chargeStatusToApi(manualChargeForm.status === 'Pagado' ? 'Pagado' : 'Pendiente'),
            method: manualChargeForm.status === 'Pagado' ? chargeMethodToApi(manualChargeForm.method) : undefined,
            paidAt: manualChargeForm.status === 'Pagado' ? manualChargeForm.date : undefined,
            paidAmount: manualChargeForm.status === 'Pagado' ? amount : undefined,
            notes: manualChargeForm.notes.trim(),
        }, {
            onSuccess: () => showToast('success', 'Cobro creado correctamente.'),
            onError: () => showToast('error', 'No se pudo crear el cobro. Intentá nuevamente.'),
        })
        resetManualChargeForm()
        setIsManualChargeOpen(false)
    }

    const dateRangeControl = <DateRangeControl value={dateRange} onChange={setDateRange} />

    const paymentLink = paymentLinkTarget && typeof window !== 'undefined'
        ? `${window.location.origin}/${organization.slug}/payments/${paymentLinkTarget.id}`
        : ''

    const copyPaymentLink = async () => {
        if (!paymentLink) return
        try {
            await navigator.clipboard.writeText(paymentLink)
            setCopyFeedback('Link copiado.')
        } catch {
            setCopyFeedback('Copiá el link desde el campo.')
        }
    }

    return (
        <>
            <ManualChargeModal
                open={isManualChargeOpen}
                value={manualChargeForm}
                students={studentOptions}
                paymentMethods={availablePaymentMethods}
                onChange={setManualChargeForm}
                onClose={() => {
                    setIsManualChargeOpen(false)
                    resetManualChargeForm()
                }}
                onSubmit={submitManualCharge}
            />

            <PaymentLinkModal
                target={paymentLinkTarget}
                link={paymentLink}
                feedback={copyFeedback}
                onClose={() => {
                    setPaymentLinkTarget(null)
                    setCopyFeedback('')
                }}
                onCopy={copyPaymentLink}
            />

            <PaymentCollectionModal target={collectTarget} value={collectForm} paymentMethods={availablePaymentMethods} onChange={setCollectForm} onClose={() => setCollectTarget(null)} onSubmit={submitCollection} />
            <PaymentEditModal
                open={isEditModalOpen}
                target={editingPayment}
                value={editingPaymentForm}
                onChange={setEditingPaymentForm}
                onClose={() => {
                    setIsEditModalOpen(false)
                    setEditingPayment(null)
                }}
                onSubmit={() => {
                    if (editingPayment) {
                        if (editingPayment.isReal) {
                            updateCharge.mutate({
                                id: editingPayment.id,
                                changes: {
                                    amount: editingPaymentForm.amount,
                                    dueDate: editingPaymentForm.dueDate,
                                    status: chargeStatusToApi(editingPaymentForm.status as 'Pendiente' | 'Pagado' | 'En verificación' | 'Rechazado'),
                                    method: chargeMethodToApi(editingPaymentForm.method),
                                    ...(editingPaymentForm.status === 'Pagado' && editingPayment.date === '-' ? { paidAt: format(today, 'yyyy-MM-dd'), paidAmount: editingPaymentForm.amount } : {}),
                                },
                            }, { onError: () => showToast('error', 'No se pudo actualizar el pago. Intentá nuevamente.') })
                        } else {
                            updatePaymentRecord(editingPayment.id, {
                                ...editingPaymentForm,
                                date: editingPaymentForm.status === 'Pagado' && editingPayment.date === '-' ? format(today, 'yyyy-MM-dd') : editingPayment.date,
                            })
                        }
                    }
                    setIsEditModalOpen(false)
                    setEditingPayment(null)
                }}
            />

            <PaymentAdjustmentModal
                target={adjustTarget}
                value={adjustmentForm}
                adjustedAmount={adjustedAmountPreview}
                lateFeePercent={academySettings?.payments.lateFeePercent ?? 0}
                onChange={setAdjustmentForm}
                onClose={() => {
                    setAdjustTarget(null)
                    setAdjustmentForm(defaultAdjustmentForm)
                }}
                onSubmit={submitAdjustment}
            />

            <DeleteConfirmationModal
                open={Boolean(deleteTarget)}
                title="Eliminar pago"
                description={paymentRemovalBlocker ?? `¿Estás seguro que querés eliminar el pago de "${deleteTarget?.student}"? Esta acción no se puede deshacer.`}
                confirmLabel={paymentRemovalBlocker ? 'Entendido' : undefined}
                onClose={() => setDeleteTarget(null)}
                onConfirm={() => {
                    if (deleteTarget && !paymentRemovalBlocker) {
                        if (deleteTarget.isReal) {
                            deleteCharge.mutate(deleteTarget.id, { onError: () => showToast('error', 'No se pudo eliminar el pago. Intentá nuevamente.') })
                        } else {
                            updatePaymentRecord(deleteTarget.id, { deleted: true })
                        }
                    }
                    setDeleteTarget(null)
                }}
            />

            <CrudListPage
                className="billing-page"
                title="Cobranzas"
                description="Seguimiento de cuotas, inscripciones y pagos de alumnos."
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder="Buscar alumno, concepto o vencimiento"
                filterFields={[
                    { key: 'student', label: 'Alumno', options: Array.from(new Set(paymentList.map((payment) => payment.student))) },
                ]}
                onApplyFilters={(filters) => {
                    setActiveFilters({ student: filters.student ?? '' })
                }}
                toolbar={{
                    filters: { label: 'Filtros', variant: 'secondary' },
                    import: { label: 'Exportar', onClick: exportPayments, variant: 'secondary' },
                }}
                hideToolbar={activeTab === 'resumen'}
                toolbarCenterContent={activeTab === 'resumen' ? undefined : dateRangeControl}
                preToolbarContent={activeTab === 'resumen' ? (
                    <BillingSummary
                        dateRangeControl={dateRangeControl}
                        metrics={monthMetrics}
                        periodLabel={summaryPeriodLabel}
                        totalPortfolio={totalPortfolio}
                        collectionRate={collectionRate}
                        riskRate={riskRate}
                    />
                ) : undefined}
                selectedCount={activeTab === 'resumen' ? 0 : selectedCount}
                bulkActionItems={[
                    {
                        label: 'Marcar pagado',
                        onClick: () => {
                            selectedIds.forEach((id) => {
                                const payment = paymentById.get(id)
                                if (payment?.isReal) {
                                    updateCharge.mutate({ id, changes: { status: 'paid', paidAt: format(today, 'yyyy-MM-dd'), paidAmount: payment.amount } })
                                } else {
                                    updatePaymentRecord(id, { status: 'Pagado', date: format(today, 'yyyy-MM-dd') })
                                }
                            })
                        },
                    },
                    {
                        label: selectedPendingCount > 0 ? `Recordar (${selectedPendingCount})` : 'Recordar',
                        onClick: () => {
                            selectedIds.forEach((id) => updatePaymentRecord(id, { lastReminderAt: format(today, 'yyyy-MM-dd') }))
                        },
                    },
                    { label: 'Exportar', onClick: exportPayments },
                ]}
                postHeaderContent={<BillingContextHeader activeTab={activeTab} onTabChange={setActiveTab} onNewCharge={() => setIsManualChargeOpen(true)} />}
            >
                {activeTab !== 'resumen' && (
                    <BillingTable
                        rows={paginatedPayments}
                        today={today}
                        graceDays={graceDays}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        selectedIds={selectedIds}
                        selectAllChecked={isSelectAllChecked}
                        openMenuId={openMenuId}
                        canAdjust={activeTab === 'pendientes'}
                        onPageChange={setCurrentPage}
                        onToggleSelection={toggleSelection}
                        onToggleSelectAll={toggleSelectAll}
                        onToggleMenu={(id) => setOpenMenuId((current) => current === id ? null : id)}
                        onEdit={(payment) => {
                            setEditingPayment(payment)
                            setEditingPaymentForm({ method: payment.method, amount: payment.amount, dueDate: payment.dueDate, status: payment.status })
                            setIsEditModalOpen(true)
                        }}
                        onPaymentLink={setPaymentLinkTarget}
                        onCollect={openCollectModal}
                        onAdjust={openAdjustModal}
                        onRemind={sendReminder}
                        onDelete={setDeleteTarget}
                    />
                )}
            </CrudListPage>
        </>
    )
}
