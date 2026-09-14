import { ArrowLeft, CalendarDays, CreditCard, ExternalLink, StickyNote, Users } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { confirmPaymentRecord, getPublicEnrollmentOffer, listCourses, listEnrollmentOpenings, listPublicRegistrations, updateEnrollmentOpening, updatePublicRegistration, useAcademyRepositoryVersion, type PublicRegistration } from '@/services/academyRepository'
import { DeleteConfirmationModal, EntityFormModal, FormField, FormGrid, FormSection } from '@/components/crud/EntityFormModal'
import { EnrollmentForm, type EnrollmentFormValue } from '../components/EnrollmentForm'
import { EnrollmentSharePanel } from '../components/EnrollmentSharePanel'
import type { Payment } from '@/types/domain'
import { validateEnrollment } from '../model/enrollmentValidation'
import { validateConditions } from '@/components/forms/formValidation'
import { useWorkspace } from '@/workspace/useWorkspace'
import { getEligibleCommissions } from '@/domain/commissions/commissionRules'

function getTodayString() {
    const date = new Date()
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function EnrollmentDetailPage() {
    const { organization, path } = useWorkspace()
    useAcademyRepositoryVersion()
    const { courseId, enrollmentId } = useParams()
    const [activeTab, setActiveTab] = useState<'overview' | 'students'>('overview')
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isCloseOpen, setIsCloseOpen] = useState(false)
    const [formValue, setFormValue] = useState<EnrollmentFormValue | null>(null)
    const [collectTarget, setCollectTarget] = useState<PublicRegistration | null>(null)
    const [collectForm, setCollectForm] = useState<{ date: string; method: Payment['method'] }>({ date: getTodayString(), method: 'Transferencia' })
    const [noteTarget, setNoteTarget] = useState<PublicRegistration | null>(null)
    const [noteDraft, setNoteDraft] = useState('')

    const courses = listCourses()
    const course = courses.find((item) => item.id === courseId)
    const opening = enrollmentId ? listEnrollmentOpenings().find((item) => item.id === enrollmentId) : undefined

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

    const registrations = listPublicRegistrations(opening.id)
    const enrollment = {
        id: opening.id,
        commissions: getEligibleCommissions(course.commissions, opening.startDate, opening.endDate, opening.commissionIds),
        amount: opening.amount,
        startDate: opening.startDate,
        endDate: opening.endDate,
        status: opening.status,
        studentsCount: registrations.length,
    }
    const publicOffer = getPublicEnrollmentOffer(opening.slug)
    const publicEnrollmentLink = publicOffer
        ? `${typeof window === 'undefined' ? '' : window.location.origin}/${organization.slug}/enrollments/${publicOffer.slug}`
        : ''

    const statusTone = enrollment.status === 'Abierta' ? 'success' : enrollment.status === 'Programada' ? 'warning' : 'neutral'
    const sampleStudents = registrations.map((registration) => ({
        id: registration.id,
        name: registration.fullName,
        payment: registration.paid ? 'Pagado' : registration.transferReported ? 'En verificación' : 'Pendiente',
        paymentMethod: registration.paymentMethod ?? 'Sin definir',
        status: registration.paid ? 'Alumno activo' : 'Inscripción recibida',
        registration,
        commissionId: registration.commissionId || course.commissions[0]?.id || 'unassigned',
        notes: registration.adminNotes ?? '',
    }))
    const commissionGroups = course.commissions
        .map((commission) => ({
            ...commission,
            students: sampleStudents.filter((student) => student.commissionId === commission.id),
        }))
        .filter((commission) => enrollment.commissions.some((eligible) => eligible.id === commission.id) || commission.students.length > 0)
    const unassignedStudents = sampleStudents.filter((student) => !course.commissions.some((commission) => commission.id === student.commissionId))
    const paidCount = sampleStudents.filter((student) => student.payment === 'Pagado').length
    const pendingCount = sampleStudents.length - paidCount
    const saveRegistrationNote = () => {
        if (!noteTarget) return
        updatePublicRegistration(noteTarget.id, { adminNotes: noteDraft.trim() })
        setNoteTarget(null)
    }

    return (
        <div className="dashboard-page">
            <EntityFormModal
                open={Boolean(noteTarget)}
                title={noteTarget?.adminNotes ? 'Editar nota' : 'Agregar nota'}
                subtitle={noteTarget?.fullName}
                submitLabel="Guardar nota"
                onClose={() => setNoteTarget(null)}
                onSubmit={saveRegistrationNote}
            >
                <FormField label="Nota administrativa" hint="Información recibida por teléfono, WhatsApp u otro medio.">
                    <textarea className="form-textarea" rows={5} value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} placeholder="Escribí una nota para el seguimiento de esta inscripción." />
                </FormField>
            </EntityFormModal>

            <EntityFormModal
                open={isEditOpen}
                title="Editar inscripción"
                subtitle="Actualizá el período, costo o estado de esta inscripción."
                validate={() => formValue ? validateEnrollment(formValue, course.commissions) : { valid: false, message: 'No hay datos de inscripción para guardar.' }}
                onClose={() => setIsEditOpen(false)}
                onSubmit={() => {
                    if (formValue) updateEnrollmentOpening(enrollment.id, formValue)
                    setIsEditOpen(false)
                }}
            >
                {formValue && <EnrollmentForm
                    courseName={course.name}
                    commissions={course.commissions}
                    value={formValue}
                    onValueChange={setFormValue}
                    publicLink={publicEnrollmentLink}
                />}
            </EntityFormModal>

            <DeleteConfirmationModal
                open={isCloseOpen}
                title="Cerrar inscripción"
                description="El link público dejará de aceptar nuevas inscripciones. Los registros y pagos ya realizados se conservarán."
                confirmLabel="Cerrar inscripción"
                onClose={() => setIsCloseOpen(false)}
                onConfirm={() => {
                    updateEnrollmentOpening(enrollment.id, { status: 'Cerrada' })
                    setIsCloseOpen(false)
                }}
            />

            <EntityFormModal
                open={Boolean(collectTarget)}
                title="Registrar cobro"
                subtitle="Confirmá fecha y medio de pago. La persona será dada de alta como alumna de esta comisión."
                submitLabel="Confirmar pago y alta"
                validate={() => validateConditions({ collectionTarget: !collectTarget && 'No hay una inscripción seleccionada.', collectionDate: !collectForm.date && 'Ingresá la fecha del cobro.' }, 'Revisá los datos del cobro.')}
                onClose={() => setCollectTarget(null)}
                onSubmit={() => {
                    confirmPaymentRecord(`PAY-${collectTarget!.id}`, collectForm.method, collectForm.date)
                    setCollectTarget(null)
                }}
            >
                <div className="form-stack">
                    <FormSection title="Confirmación del cobro">
                        <FormGrid>
                            <FormField label="Alumno"><input className="form-input" value={collectTarget?.fullName ?? ''} readOnly /></FormField>
                            <FormField label="Importe"><input className="form-input" value={`$${enrollment.amount.toLocaleString('es-AR')}`} readOnly /></FormField>
                            <FormField label="Fecha de cobro"><input className="form-input" type="date" value={collectForm.date} onChange={(event) => setCollectForm((current) => ({ ...current, date: event.target.value }))} /></FormField>
                            <FormField label="Medio de pago"><select className="form-input" value={collectForm.method} onChange={(event) => setCollectForm((current) => ({ ...current, method: event.target.value as Payment['method'] }))}><option value="Transferencia">Transferencia</option><option value="Tarjeta">Tarjeta</option><option value="Efectivo">Efectivo</option></select></FormField>
                        </FormGrid>
                    </FormSection>
                </div>
            </EntityFormModal>

            <div className="page-header compact detail-page-header">
                <div className="detail-page-heading">
                    <div className="detail-breadcrumb">
                        <Link to={path(`oferta/${course.id}`)} className="detail-breadcrumb-link">
                            <ArrowLeft size={14} />
                            {course.name}
                        </Link>
                        <span>›</span>
                        <span>Inscripción</span>
                    </div>
                    <h1 className="detail-page-title">Inscripción · {course.name}</h1>
                </div>

                <div className="detail-header-actions">
                    <button type="button" className="secondary-button compact-button" onClick={() => {
                        setFormValue({ courseId: course.id, commissionIds: enrollment.commissions.map((commission) => commission.id), amount: enrollment.amount, startDate: enrollment.startDate, endDate: enrollment.endDate, status: enrollment.status })
                        setIsEditOpen(true)
                    }}>Editar inscripción</button>
                    {enrollment.status !== 'Cerrada' && <button type="button" className="secondary-button compact-button" onClick={() => setIsCloseOpen(true)}>Cerrar</button>}
                </div>
            </div>

            <div className="data-table-card detail-card">
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'overview' | 'students')}>
                    <TabsList variant="line" aria-label="Detalle de inscripción">
                        <TabsTrigger value="overview">Resumen</TabsTrigger>
                        <TabsTrigger value="students">Inscriptos</TabsTrigger>
                    </TabsList>
                </Tabs>

                {activeTab === 'overview' && (
                    <div className="detail-section">
                        <div className="detail-metric-grid">
                            <div className="detail-metric-card">
                                <div className="detail-metric-label">
                                    <Users size={14} />
                                    Inscriptos
                                </div>
                                <div className="detail-metric-value detail-metric-value-large">{enrollment.studentsCount}</div>
                            </div>

                            <div className="detail-metric-card">
                                <div className="detail-metric-label">
                                    <CreditCard size={14} />
                                    Costo
                                </div>
                                <div className="detail-metric-value detail-metric-value-large">${enrollment.amount.toLocaleString('es-AR')}</div>
                            </div>

                            <div className="detail-metric-card">
                                <div className="detail-metric-label">
                                    <CalendarDays size={14} />
                                    Periodo
                                </div>
                                <div className="detail-metric-value detail-metric-value-medium">{enrollment.startDate} → {enrollment.endDate}</div>
                            </div>

                            <div className="detail-metric-card">
                                <div className="detail-metric-label">
                                    Estado
                                </div>
                                <div className="detail-status">
                                    <StatusBadge label={enrollment.status} tone={statusTone} />
                                </div>
                            </div>
                        </div>

                        <div className="detail-info-grid">
                            <div className="detail-info-card">
                                <h3 className="detail-info-title">Datos de inscripción</h3>
                                <ul className="detail-info-list">
                                    <li>Oferta académica: {course.name}</li>
                                    <li>Comisiones disponibles: {enrollment.commissions.map((commission) => commission.name).join(', ') || 'Ninguna'}</li>
                                    <li>Inicio: {enrollment.startDate}</li>
                                    <li>Cierre: {enrollment.endDate}</li>
                                    <li>Estado: {enrollment.status}</li>
                                </ul>
                            </div>

                            <div className="detail-info-card">
                                <h3 className="detail-info-title">Cobranzas</h3>
                                <ul className="detail-info-list">
                                    <li>Monto base: ${enrollment.amount.toLocaleString('es-AR')}</li>
                                    <li>Pagos realizados: {paidCount}</li>
                                    <li>Pagos pendientes: {pendingCount}</li>
                                    <li>Ingresos estimados: ${(enrollment.amount * paidCount).toLocaleString('es-AR')}</li>
                                </ul>
                            </div>
                        </div>

                        <EnrollmentSharePanel publicLink={publicEnrollmentLink} fileName={`inscripcion-${course.name}`.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')} />
                    </div>
                )}

                {activeTab === 'students' && (
                    <div className="enrollment-students-view">
                        <div className="detail-list-heading">
                            <div><strong>Inscriptos</strong><span className="detail-list-meta">{sampleStudents.length} alumnos</span></div>
                            {publicEnrollmentLink && <a className="secondary-button compact-button" href={publicEnrollmentLink} target="_blank" rel="noreferrer"><ExternalLink size={15} />Abrir formulario público</a>}
                        </div>

                        <div className="enrollment-commission-groups">
                            {[...commissionGroups, ...(unassignedStudents.length > 0 ? [{ id: 'unassigned', name: 'Sin comisión asignada', schedule: 'Requiere revisión', capacity: unassignedStudents.length, students: unassignedStudents }] : [])].map((commission) => (
                                <section className="enrollment-commission-group" key={commission.id}>
                                    <header className="enrollment-commission-header">
                                        <div>
                                            <h3>{commission.name}</h3>
                                            <p>{commission.schedule}</p>
                                        </div>
                                        <span>{commission.students.length} de {commission.capacity} lugares</span>
                                    </header>

                                    <div className="enrollment-commission-students">
                                        {commission.students.map((student) => (
                                            <div className="enrollment-student-row" key={student.id}>
                                                <div>
                                                    <div className="detail-row-title">{student.name}</div>
                                                    <div className="detail-row-meta">{student.status} · Medio: {student.paymentMethod}</div>
                                                    {student.notes && <div className="enrollment-student-note-preview"><StickyNote size={13} />{student.notes}</div>}
                                                </div>
                                                <div className="detail-row-actions">
                                                    <StatusBadge label={student.payment} tone={student.payment === 'Pagado' ? 'success' : student.payment === 'En verificación' ? 'warning' : 'neutral'} />
                                                    <button type="button" className="secondary-button compact-button" onClick={() => { setNoteTarget(student.registration); setNoteDraft(student.notes) }}><StickyNote size={15} />{student.notes ? 'Editar nota' : 'Agregar nota'}</button>
                                                    {student.payment !== 'Pagado' && <button type="button" className="primary-button compact-button" onClick={() => {
                                                        const method: Payment['method'] = student.paymentMethod === 'Mercado Pago' ? 'Tarjeta' : student.paymentMethod === 'Efectivo' ? 'Efectivo' : 'Transferencia'
                                                        setCollectForm({ date: getTodayString(), method })
                                                        setCollectTarget(student.registration)
                                                    }}><CreditCard size={15} /> Registrar pago</button>}
                                                </div>
                                            </div>
                                        ))}
                                        {commission.students.length === 0 && <div className="enrollment-commission-empty">Todavía no hay inscriptos en esta comisión.</div>}
                                    </div>
                                </section>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </div>
    )
}
