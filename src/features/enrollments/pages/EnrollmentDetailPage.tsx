import { ArrowLeft, CalendarDays, CheckCircle2, CreditCard, ExternalLink, Lock, RotateCcw, StickyNote, Users, Wallet } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { MetricTile, MetricTileGrid } from '@/components/ui/MetricTile'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    listCourses, listEnrollmentOpenings, useAcademyRepositoryVersion, useConfirmRegistration, useEnrollmentRegistrations,
    useUpdateCharge, useUpdateEnrollmentOpening, useUpdateRegistrationNotes, type EnrollmentRegistrationRow,
} from '@/services/academyRepository'
import { chargeMethodToApi } from '@/services/organization/chargesMapping'
import { DeleteConfirmationModal, EntityFormModal, FormField, FormGrid, FormSection } from '@/components/crud/EntityFormModal'
import { EnrollmentSettingsCards } from '../components/EnrollmentSettingsCards'
import { EnrollmentSharePanel } from '../components/EnrollmentSharePanel'
import type { Payment } from '@/types/domain'
import { validateConditions } from '@/components/forms/formValidation'
import { useToast } from '@/components/ui/ToastContext'
import { useWorkspace } from '@/workspace/useWorkspace'
import { getEligibleCommissions } from '@/domain/commissions/commissionRules'
import { formatCurrencyARS, formatShortDate } from '@/domain/shared/formattingRules'
import { getRecordablePaymentMethods } from '@/domain/billing/paymentMethods'
import { useAcademySettings } from '@/services/academySettingsRepository'

function getTodayString() {
    const date = new Date()
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

type EnrollmentTab = 'overview' | 'students'

export function EnrollmentDetailPage() {
    const { organization, path } = useWorkspace()
    useAcademyRepositoryVersion()
    const { courseId, enrollmentId } = useParams()
    const { showToast } = useToast()
    const { settings: academySettings } = useAcademySettings()
    // The active tab lives in the URL (?tab=students), like the offer and commission details.
    const [searchParams, setSearchParams] = useSearchParams()
    const activeTab: EnrollmentTab = searchParams.get('tab') === 'students' ? 'students' : 'overview'
    const setActiveTab = (tab: EnrollmentTab) => setSearchParams(tab === 'overview' ? {} : { tab }, { replace: true })
    const [isCloseOpen, setIsCloseOpen] = useState(false)
    const [collectTarget, setCollectTarget] = useState<EnrollmentRegistrationRow | null>(null)
    const [collectForm, setCollectForm] = useState<{ date: string; method: Payment['method'] }>({ date: getTodayString(), method: 'Transferencia' })
    const [confirmTarget, setConfirmTarget] = useState<EnrollmentRegistrationRow | null>(null)
    const [noteTarget, setNoteTarget] = useState<EnrollmentRegistrationRow | null>(null)
    const [noteDraft, setNoteDraft] = useState('')
    const updateOpening = useUpdateEnrollmentOpening()
    const updateCharge = useUpdateCharge()
    const updateNotes = useUpdateRegistrationNotes()
    const confirmRegistration = useConfirmRegistration()

    const courses = listCourses()
    const course = courses.find((item) => item.id === courseId)
    const opening = enrollmentId ? listEnrollmentOpenings().find((item) => item.id === enrollmentId) : undefined
    const { registrations } = useEnrollmentRegistrations(opening?.id)

    if (!course || !opening || opening.courseId !== course.id) {
        return (
            <div className="dashboard-page">
                <div className="page-header"><div><h1>Inscripción no encontrada</h1></div></div>
                <div className="data-table-card">
                    <p>La inscripción solicitada no existe o ya no está disponible.</p>
                    <Link to={course ? path(`offers/${course.id}`) : path('offers')} className="primary-button detail-back-button">Volver a oferta académica</Link>
                </div>
            </div>
        )
    }

    const enrollment = {
        id: opening.id,
        commissions: getEligibleCommissions(course.commissions, opening.startDate, opening.commissionIds),
        amount: opening.amount,
        startDate: opening.startDate,
        endDate: opening.endDate,
        status: opening.status,
        studentsCount: registrations.length,
    }
    const publicEnrollmentLink = `${typeof window === 'undefined' ? '' : window.location.origin}/${organization.slug}/enrollments/${opening.slug}`

    const statusTone = enrollment.status === 'Abierta' ? 'success' : enrollment.status === 'Programada' ? 'warning' : 'neutral'
    const commissionGroups = course.commissions
        .map((commission) => ({
            ...commission,
            students: registrations.filter((registration) => registration.commissionId === commission.id),
        }))
        .filter((commission) => enrollment.commissions.some((eligible) => eligible.id === commission.id) || commission.students.length > 0)
    const unassignedStudents = registrations.filter((registration) => !course.commissions.some((commission) => commission.id === registration.commissionId))
    const paidRegistrations = registrations.filter((registration) => registration.payment === 'Pagado')
    const collectedAmount = paidRegistrations.reduce((total, registration) => total + registration.chargeAmount, 0)
    const periodLabel = `${formatShortDate(enrollment.startDate)} al ${formatShortDate(enrollment.endDate)}`
    const shortPeriodLabel = `${formatShortDate(enrollment.startDate).slice(0, 5)} al ${formatShortDate(enrollment.endDate).slice(0, 5)}`
    const saveRegistrationNote = () => {
        if (!noteTarget) return
        updateNotes.mutate({ id: noteTarget.id, notes: noteDraft.trim() }, {
            onSuccess: () => showToast('success', 'Nota guardada correctamente.'),
            onError: () => showToast('error', 'No se pudo guardar la nota. Intentá nuevamente.'),
        })
        setNoteTarget(null)
    }

    return (
        <div className="dashboard-page">
            <EntityFormModal
                open={Boolean(noteTarget)}
                title={noteTarget?.notes ? 'Editar nota' : 'Agregar nota'}
                subtitle={noteTarget?.name}
                submitLabel="Guardar nota"
                onClose={() => setNoteTarget(null)}
                onSubmit={saveRegistrationNote}
            >
                <FormField label="Nota administrativa" hint="Información recibida por teléfono, WhatsApp u otro medio.">
                    <textarea className="form-textarea" rows={5} value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} placeholder="Escribí una nota para el seguimiento de esta inscripción." />
                </FormField>
            </EntityFormModal>

            <DeleteConfirmationModal
                open={isCloseOpen}
                title="Cerrar inscripción"
                description="El link público dejará de aceptar inscripciones nuevas. Los inscriptos, sus notas y los pagos ya registrados se conservan. Podés reabrirla cuando quieras."
                confirmLabel="Cerrar inscripción"
                onClose={() => setIsCloseOpen(false)}
                onConfirm={() => {
                    updateOpening.mutate({ id: enrollment.id, changes: { status: 'Cerrada' } }, {
                        onSuccess: () => showToast('success', 'Inscripción cerrada correctamente.'),
                        onError: () => showToast('error', 'No se pudo cerrar la inscripción. Intentá nuevamente.'),
                    })
                    setIsCloseOpen(false)
                }}
            />

            {/* Paying the fee is what formalizes a registration; this is the exception for a scholarship
                or a fee paid later, so it asks first. */}
            <DeleteConfirmationModal
                open={Boolean(confirmTarget)}
                title="Confirmar sin pago"
                description={`${confirmTarget?.name ?? 'El alumno'} pasará a ser alumno activo de la comisión sin haber pagado la inscripción. El cobro queda pendiente y podés registrarlo más adelante.`}
                confirmLabel="Confirmar sin pago"
                onClose={() => setConfirmTarget(null)}
                onConfirm={() => {
                    if (confirmTarget) confirmRegistration.mutate(confirmTarget.id, {
                        onSuccess: () => showToast('success', 'Inscripción confirmada correctamente.'),
                        onError: () => showToast('error', 'No se pudo confirmar la inscripción. Intentá nuevamente.'),
                    })
                    setConfirmTarget(null)
                }}
            />

            <EntityFormModal
                open={Boolean(collectTarget)}
                title="Registrar cobro"
                subtitle="Al registrar el pago, el alumno queda confirmado en la comisión."
                submitLabel="Confirmar pago"
                validate={() => validateConditions({ collectionTarget: !collectTarget && 'No hay una inscripción seleccionada.', collectionDate: !collectForm.date && 'Ingresá la fecha del cobro.' }, 'Revisá los datos del cobro.')}
                onClose={() => setCollectTarget(null)}
                onSubmit={() => {
                    if (collectTarget) updateCharge.mutate({ id: collectTarget.chargeId, changes: { status: 'paid', method: chargeMethodToApi(collectForm.method), paidAt: collectForm.date, paidAmount: collectTarget.chargeAmount } }, {
                        onSuccess: () => showToast('success', 'Pago registrado: el alumno quedó confirmado en la comisión.'),
                        onError: () => showToast('error', 'No se pudo registrar el cobro. Intentá nuevamente.'),
                    })
                    setCollectTarget(null)
                }}
            >
                <div className="form-stack">
                    <FormSection title="Confirmación del cobro">
                        <FormGrid>
                            <FormField label="Alumno"><input className="form-input" value={collectTarget?.name ?? ''} readOnly /></FormField>
                            <FormField label="Importe"><input className="form-input" value={`$${(collectTarget?.chargeAmount ?? enrollment.amount).toLocaleString('es-AR')}`} readOnly /></FormField>
                            <FormField label="Fecha de cobro"><input name="collectionDate" className="form-input" type="date" value={collectForm.date} onChange={(event) => setCollectForm((current) => ({ ...current, date: event.target.value }))} /></FormField>
                            <FormField label="Medio de pago"><SearchableSelect value={collectForm.method} onChange={(method) => setCollectForm((current) => ({ ...current, method: method as Payment['method'] }))} options={getRecordablePaymentMethods(academySettings?.payments.enabledMethods).map((method) => ({ value: method, label: method }))} /></FormField>
                        </FormGrid>
                    </FormSection>
                </div>
            </EntityFormModal>

            <div className="page-header compact">
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', color: 'var(--muted)', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        <Link to={path(`oferta/${course.id}?tab=enrollments`)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--muted)', textDecoration: 'none' }}>
                            <ArrowLeft size={14} />
                            {course.name}
                        </Link>
                        <span>›</span>
                        <span>Inscripción</span>
                    </div>
                    {/* The period tells apart several enrollments of the same offer. */}
                    <h1 style={{ marginTop: 16 }}>Inscripción del {periodLabel}</h1>
                </div>
                <div className="page-header-actions">
                    {enrollment.status === 'Cerrada'
                        ? <button type="button" className="secondary-button compact-button" disabled={updateOpening.isPending} onClick={() => updateOpening.mutate({ id: enrollment.id, changes: { status: 'Abierta' } }, {
                            onSuccess: () => showToast('success', 'Inscripción reabierta: vuelve a estar Abierta.'),
                            onError: () => showToast('error', 'No se pudo reabrir la inscripción. Intentá nuevamente.'),
                        })}><RotateCcw size={15} />Reabrir inscripción</button>
                        : <button type="button" className="secondary-button compact-button" onClick={() => setIsCloseOpen(true)}><Lock size={15} />Cerrar inscripción</button>}
                </div>
            </div>

            <div className="academy-tabs-wrap">
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as EnrollmentTab)}>
                    <TabsList variant="line" aria-label="Detalle de inscripción">
                        <TabsTrigger value="overview">Resumen</TabsTrigger>
                        <TabsTrigger value="students">Inscriptos</TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="offer-detail-stack">
                {activeTab === 'overview' && (
                    <MetricTileGrid>
                        <MetricTile icon={<Users size={20} />} label="Inscriptos" value={enrollment.studentsCount} caption={`a ${formatCurrencyARS(enrollment.amount)} cada uno`} />
                        <MetricTile icon={<CheckCircle2 size={20} />} label="Pagos" value={`${paidRegistrations.length} de ${registrations.length}`} caption="inscripciones pagadas" />
                        <MetricTile icon={<Wallet size={20} />} label="Cobrado" value={formatCurrencyARS(collectedAmount)} caption={`${registrations.length - paidRegistrations.length} pago${registrations.length - paidRegistrations.length === 1 ? '' : 's'} pendiente${registrations.length - paidRegistrations.length === 1 ? '' : 's'}`} />
                        <MetricTile icon={<CalendarDays size={20} />} label="Período" value={shortPeriodLabel} caption={<StatusBadge label={enrollment.status} tone={statusTone} />} />
                    </MetricTileGrid>
                )}

                {activeTab === 'overview' && (
                    <EnrollmentSettingsCards
                        // Remount on every saved change (own save, closing/reopening) so the draft restarts from it.
                        key={`${opening.id}:${opening.status}:${opening.startDate}:${opening.endDate}:${opening.amount}:${opening.commissionIds.join(',')}`}
                        opening={opening}
                        commissions={course.commissions}
                        branchId={course.branchId}
                        afterData={<EnrollmentSharePanel publicLink={publicEnrollmentLink} fileName={`inscripcion-${course.name}`.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')} />}
                        saving={updateOpening.isPending}
                        onSave={async (changes) => {
                            try {
                                await updateOpening.mutateAsync({ id: enrollment.id, changes })
                                showToast('success', 'Inscripción actualizada correctamente.')
                                return true
                            } catch {
                                return false
                            }
                        }}
                    />
                )}


                {activeTab === 'students' && (
                    <Card className="enrollment-students-view">
                        <SectionHeading icon={<Users size={20} />} title="Inscriptos" description={`${registrations.length} alumno${registrations.length === 1 ? '' : 's'} inscripto${registrations.length === 1 ? '' : 's'}`} actions={publicEnrollmentLink ? <a className="secondary-button compact-button" href={publicEnrollmentLink} target="_blank" rel="noreferrer"><ExternalLink size={15} />Abrir formulario público</a> : undefined} />

                        <div className="enrollment-commission-groups">
                            {[...commissionGroups, ...(unassignedStudents.length > 0 ? [{ id: 'unassigned', name: 'Sin comisión asignada', schedule: 'Requiere revisión', capacity: unassignedStudents.length, students: unassignedStudents }] : [])].map((commission) => (
                                <section className="enrollment-commission-group" key={commission.id}>
                                    <header className="enrollment-commission-header">
                                        <div>
                                            <h3>{commission.name}</h3>
                                            <p>{commission.schedule}{'startDate' in commission && commission.startDate ? ` · Cursada del ${formatShortDate(commission.startDate)} al ${formatShortDate(commission.endDate)}` : ''}</p>
                                        </div>
                                        <span>{commission.students.length} de {commission.capacity} lugares</span>
                                    </header>

                                    <div className="enrollment-commission-students">
                                        {commission.students.map((student) => (
                                            <div className="enrollment-student-row" key={student.id}>
                                                <div>
                                                    <div className="detail-row-title">{student.name}</div>
                                                    <div className="detail-row-meta">{student.rosterConfirmed ? 'Alumno activo' : student.payment === 'Pagado' ? 'Pago registrado, sin confirmar' : 'Se confirma al registrar el pago'}</div>
                                                    {student.notes && <div className="enrollment-student-note-preview"><StickyNote size={13} />{student.notes}</div>}
                                                </div>
                                                <div className="detail-row-actions">
                                                    <StatusBadge label={student.payment} tone={student.payment === 'Pagado' ? 'success' : student.payment === 'En verificación' ? 'warning' : 'neutral'} />
                                                    <button type="button" className="secondary-button compact-button" onClick={() => { setNoteTarget(student); setNoteDraft(student.notes) }}><StickyNote size={15} />{student.notes ? 'Editar nota' : 'Agregar nota'}</button>
                                                    {!student.rosterConfirmed && <button type="button" className="secondary-button compact-button" onClick={() => setConfirmTarget(student)}><CheckCircle2 size={15} /> {student.payment === 'Pagado' ? 'Confirmar' : 'Confirmar sin pago'}</button>}
                                                    {student.payment !== 'Pagado' && <button type="button" className="primary-button compact-button" onClick={() => {
                                                        setCollectForm({ date: getTodayString(), method: 'Transferencia' })
                                                        setCollectTarget(student)
                                                    }}><CreditCard size={15} /> Registrar pago</button>}
                                                </div>
                                            </div>
                                        ))}
                                        {commission.students.length === 0 && <div className="enrollment-commission-empty">Todavía no hay inscriptos en esta comisión.</div>}
                                    </div>
                                </section>
                            ))}
                        </div>
                    </Card>
                )}
                </div>
            </div>
        </div>
    )
}
