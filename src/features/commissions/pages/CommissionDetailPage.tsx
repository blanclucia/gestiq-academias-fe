import { ArrowLeft, Award, Mail, MessageCircle, Send } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { assignStudentsToCommission, createCommissionExam, getCommissionStudentStatus, listCommissionExams, listCourses, listStudents, listStudentsInCommission, updateCommission, updateCommissionExam, updateCommissionStudentStatus, useAcademyRepositoryVersion, type CommissionStudentStatus } from '@/services/academyRepository'
import { CommissionAssignmentModal } from '../components/CommissionAssignmentModal'
import { DeleteConfirmationModal, EntityFormModal, FormField, FormGrid, FormSection } from '@/components/crud/EntityFormModal'
import { getSelectedBranchId } from '@/services/branchRepository'
import { listCommunicationTemplates } from '@/services/communicationTemplateRepository'
import { validateConditions } from '@/components/forms/formValidation'
import { CommissionSummary } from '../components/CommissionSummary'
import { CommissionStudentsTable } from '../components/CommissionStudentsTable'
import { CommissionExamsTab } from '../components/CommissionExamsTab'
import { CommissionExamModal, type CommissionExamAudience, type CommissionExamFormValue } from '../components/CommissionExamModal'
import { getActiveExamStudents, resolveExamStudentIds } from '@/domain/examinations/examinationRules'
import { useWorkspace } from '@/workspace/useWorkspace'

export function CommissionDetailPage() {
    useAcademyRepositoryVersion()
    const { courseId, commissionId } = useParams()
    const navigate = useNavigate()
    const { path } = useWorkspace()
    const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'exams'>('overview')
    const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false)
    const [isCloseCommissionOpen, setIsCloseCommissionOpen] = useState(false)
    const [manualStudentIds, setManualStudentIds] = useState<string[]>([])
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])
    const [openMenuId, setOpenMenuId] = useState<string | null>(null)
    const [isCommunicationOpen, setIsCommunicationOpen] = useState(false)
    const [isCertificateOpen, setIsCertificateOpen] = useState(false)
    const [communicationSent, setCommunicationSent] = useState(false)
    const [certificateGenerated, setCertificateGenerated] = useState(false)
    const [communicationForm, setCommunicationForm] = useState({ channel: 'Email' as 'Email' | 'WhatsApp', subject: '', message: '' })
    const [certificateType, setCertificateType] = useState('Certificado de aprobación')
    const [statusTarget, setStatusTarget] = useState<{ ids: string[]; label: string } | null>(null)
    const [statusDraft, setStatusDraft] = useState<CommissionStudentStatus>('Activo')
    const [isExamOpen, setIsExamOpen] = useState(false)
    const [editingExamId, setEditingExamId] = useState<string | null>(null)
    const [examForm, setExamForm] = useState<CommissionExamFormValue>({ title: 'Examen final', examDate: '', firstPaymentDueDate: '', feeAmount: '', installmentCount: '1' })
    const [examStudentIds, setExamStudentIds] = useState<string[]>([])
    const [examAudience, setExamAudience] = useState<CommissionExamAudience>('all')
    const [examSearch, setExamSearch] = useState('')

    const courses = listCourses()
    const course = courses.find((item) => item.id === courseId) ?? courses[0]
    const commission = course.commissions.find((item) => item.id === commissionId) ?? course.commissions[0]

    if (!course || !commission) {
        return (
            <div className="dashboard-page">
                <div className="page-header">
                    <div>
                        <h1>Comisión no encontrada</h1>
                    </div>
                </div>
                <div className="data-table-card">
                    <p>La comisión solicitada no existe o fue eliminada.</p>
                    <Link to={path(`oferta/${course.id}`)} className="primary-button" style={{ display: 'inline-flex', marginTop: 12 }}>
                        Volver a oferta académica
                    </Link>
                </div>
            </div>
        )
    }

    const allStudents = listStudents()
    const commissionStudents = listStudentsInCommission(course.name, commission.name, commission.id)
        .filter((student) => manualStudentIds.includes(student.id) || student.courses.some((item) => item.name === course.name && item.group === commission.name))
        .map((student) => ({
            id: student.id,
            name: student.fullName,
            email: student.email,
            phone: student.phone,
            status: getCommissionStudentStatus(student.id, commission.id, course.name, commission.name),
            globalStatus: student.status,
        }))
    const assignmentStudents = allStudents.map((student) =>
        manualStudentIds.includes(student.id) && !student.courses.some((item) => item.name === course.name && item.group === commission.name)
            ? { ...student, courses: [...student.courses, { name: course.name, group: commission.name, modality: 'Grupo' as const }] }
            : student,
    )
    const assignmentCommission = {
        id: commission.id,
        courseName: course.name,
        commissionName: commission.name,
        studentsCount: commissionStudents.length,
        capacity: commission.capacity,
        amount: commission.amount,
        schedule: commission.schedule,
        status: commission.status,
    }
    const selectedStudents = commissionStudents.filter((student) => selectedStudentIds.includes(student.id))
    const communicationTemplates = listCommunicationTemplates(getSelectedBranchId()).filter((template) => template.enabled && template.channels.includes(communicationForm.channel))
    const communicationRecipients = selectedStudents.filter((student) => communicationForm.channel === 'Email' ? Boolean(student.email.trim()) : Boolean(student.phone.trim()))
    const commissionExams = listCommissionExams(commission.id)

    const openCommunication = (studentIds: string[]) => {
        const firstTemplate = listCommunicationTemplates(getSelectedBranchId()).find((template) => template.enabled && template.channels.includes('Email'))
        setSelectedStudentIds(studentIds)
        setCommunicationForm({ channel: 'Email', subject: firstTemplate?.subject ?? '', message: firstTemplate?.message ?? '' })
        setCommunicationSent(false)
        setIsCommunicationOpen(true)
    }

    const openCertificate = (studentIds: string[]) => {
        setSelectedStudentIds(studentIds)
        setCertificateGenerated(false)
        setIsCertificateOpen(true)
    }

    const openStatus = (studentIds: string[]) => {
        const names = commissionStudents.filter((student) => studentIds.includes(student.id)).map((student) => student.name)
        setStatusTarget({ ids: studentIds, label: names.length === 1 ? names[0] : `${names.length} alumnos seleccionados` })
        setStatusDraft('Activo')
    }

    const saveStudentStatus = () => {
        if (!statusTarget) return
        statusTarget.ids.forEach((studentId) => updateCommissionStudentStatus(studentId, commission.id, course.name, commission.name, statusDraft))
        setStatusTarget(null)
        setSelectedStudentIds([])
    }

    const openExam = () => {
        setEditingExamId(null)
        setExamForm({ title: 'Examen final', examDate: '', firstPaymentDueDate: '', feeAmount: '', installmentCount: '1' })
        setExamStudentIds(getActiveExamStudents(commissionStudents).map((student) => student.id))
        setExamAudience('all')
        setExamSearch('')
        setIsExamOpen(true)
    }

    const openEditExam = (exam: typeof commissionExams[number]) => {
        setEditingExamId(exam.id)
        setExamForm({ title: exam.title, examDate: exam.examDate ?? '', firstPaymentDueDate: exam.firstPaymentDueDate, feeAmount: String(exam.feeAmount), installmentCount: String(exam.installmentCount) })
        setIsExamOpen(true)
    }

    const saveExam = () => {
        const feeAmount = Number(examForm.feeAmount)
        const installmentCount = Number(examForm.installmentCount)
        if (editingExamId) {
            updateCommissionExam(editingExamId, { title: examForm.title.trim(), examDate: examForm.examDate, firstPaymentDueDate: examForm.firstPaymentDueDate, feeAmount })
            setIsExamOpen(false)
            setEditingExamId(null)
            return
        }
        const selectedExamStudentIds = resolveExamStudentIds(commissionStudents, examAudience, examStudentIds)
        createCommissionExam({ title: examForm.title.trim(), commissionId: commission.id, examDate: examForm.examDate || undefined, firstPaymentDueDate: examForm.firstPaymentDueDate, feeAmount, installmentCount }, selectedExamStudentIds)
        setIsExamOpen(false)
    }

    return (
        <div className="dashboard-page">
            <EntityFormModal
                open={Boolean(statusTarget)}
                title="Estado en comisión"
                subtitle={statusTarget?.label}
                submitLabel="Guardar estado"
                onClose={() => setStatusTarget(null)}
                onSubmit={saveStudentStatus}
            >
                <FormField label="Estado">
                    <select className="form-input" value={statusDraft} onChange={(event) => setStatusDraft(event.target.value as CommissionStudentStatus)}>
                        <option value="Activo">Activo</option>
                        <option value="Pausado">Pausado</option>
                        <option value="Finalizado">Finalizado</option>
                        <option value="Baja">Baja</option>
                    </select>
                </FormField>
            </EntityFormModal>

            <CommissionExamModal
                open={isExamOpen}
                editing={Boolean(editingExamId)}
                value={examForm}
                students={commissionStudents}
                selectedStudentIds={examStudentIds}
                audience={examAudience}
                search={examSearch}
                onChange={setExamForm}
                onAudienceChange={setExamAudience}
                onSearchChange={setExamSearch}
                onSelectedStudentsChange={setExamStudentIds}
                onClose={() => {
                    setIsExamOpen(false)
                    setEditingExamId(null)
                }}
                onSubmit={saveExam}
            />

            <EntityFormModal
                open={isCommunicationOpen}
                title={communicationSent ? 'Comunicación preparada' : 'Comunicar a alumnos'}
                subtitle={communicationSent ? `Mensaje preparado para ${communicationRecipients.length} alumno${communicationRecipients.length === 1 ? '' : 's'}.` : `${selectedStudents.length} alumno${selectedStudents.length === 1 ? '' : 's'} seleccionado${selectedStudents.length === 1 ? '' : 's'}.`}
                submitLabel={communicationSent ? 'Cerrar' : `Enviar a ${communicationRecipients.length}`}
                validate={() => validateConditions({ communicationRecipients: !communicationSent && communicationRecipients.length === 0 && 'No hay destinatarios disponibles.', communicationSubject: !communicationSent && communicationForm.channel === 'Email' && !communicationForm.subject.trim() && 'Ingresá el asunto.', communicationMessage: !communicationSent && !communicationForm.message.trim() && 'Ingresá el mensaje.' }, 'Revisá la comunicación.')}
                onClose={() => { setIsCommunicationOpen(false); setCommunicationSent(false); setSelectedStudentIds([]) }}
                onSubmit={() => {
                    if (communicationSent) {
                        setIsCommunicationOpen(false)
                        setCommunicationSent(false)
                        setSelectedStudentIds([])
                    } else {
                        setCommunicationSent(true)
                    }
                }}
            >
                {communicationSent ? <div className="bulk-communication-success"><Send size={28} /><strong>Mensaje listo</strong><p>En esta versión de demostración no se contactará realmente a los alumnos.</p></div> : <div className="form-stack">
                    <FormSection title="Canal y plantilla">
                        <div className="bulk-channel-options"><button type="button" className={communicationForm.channel === 'Email' ? 'selected' : ''} onClick={() => setCommunicationForm((current) => ({ ...current, channel: 'Email' }))}><Mail size={18} />Email</button><button type="button" className={communicationForm.channel === 'WhatsApp' ? 'selected' : ''} onClick={() => setCommunicationForm((current) => ({ ...current, channel: 'WhatsApp' }))}><MessageCircle size={18} />WhatsApp</button></div>
                        <FormField label="Usar comunicación configurada">
                            <select className="form-input" value="custom" onChange={(event) => { const template = communicationTemplates.find((item) => item.id === event.target.value); if (template) setCommunicationForm((current) => ({ ...current, subject: template.subject, message: template.message })) }}>
                                <option value="custom">Escribir un mensaje</option>
                                {communicationTemplates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}
                            </select>
                        </FormField>
                    </FormSection>
                    <FormSection title="Mensaje">
                        <FormGrid>{communicationForm.channel === 'Email' && <FormField label="Asunto"><input className="form-input" value={communicationForm.subject} onChange={(event) => setCommunicationForm((current) => ({ ...current, subject: event.target.value }))} /></FormField>}<FormField label="Mensaje" full><textarea className="form-textarea" rows={6} value={communicationForm.message} onChange={(event) => setCommunicationForm((current) => ({ ...current, message: event.target.value }))} placeholder="Escribí el mensaje para los alumnos seleccionados" /></FormField></FormGrid>
                    </FormSection>
                    <p className="bulk-template-note">{communicationRecipients.length} destinatarios tienen datos disponibles para este canal.</p>
                </div>}
            </EntityFormModal>

            <EntityFormModal
                open={isCertificateOpen}
                title={certificateGenerated ? 'Certificados preparados' : 'Generar certificados'}
                subtitle={`${selectedStudents.length} alumno${selectedStudents.length === 1 ? '' : 's'} seleccionado${selectedStudents.length === 1 ? '' : 's'}.`}
                submitLabel={certificateGenerated ? 'Cerrar' : 'Preparar certificados'}
                onClose={() => { setIsCertificateOpen(false); setCertificateGenerated(false); setSelectedStudentIds([]) }}
                onSubmit={() => certificateGenerated ? setIsCertificateOpen(false) : setCertificateGenerated(true)}
            >
                {certificateGenerated ? <div className="bulk-communication-success"><Award size={28} /><strong>Certificados listos</strong><p>En esta versión de demostración se preparó la generación de certificados de {certificateType.toLowerCase()}.</p></div> : <FormSection title="Tipo de certificado"><FormField label="Certificado"><select className="form-input" value={certificateType} onChange={(event) => setCertificateType(event.target.value)}><option>Certificado de aprobación</option><option>Certificado de asistencia</option><option>Constancia de alumno regular</option></select></FormField></FormSection>}
            </EntityFormModal>

            <CommissionAssignmentModal
                open={isAssignmentModalOpen}
                students={assignmentStudents}
                selectedStudentIds={[]}
                commissions={[assignmentCommission]}
                initialCommissionId={commission.id}
                allowStudentSelection
                onClose={() => setIsAssignmentModalOpen(false)}
                onConfirm={({ studentIds }) => {
                    assignStudentsToCommission(studentIds, course.name, commission.name, commission.amount, commission.id, 'Activo')
                    setManualStudentIds((current) => Array.from(new Set([...current, ...studentIds])))
                    setIsAssignmentModalOpen(false)
                }}
            />

            <DeleteConfirmationModal
                open={isCloseCommissionOpen}
                title="Cerrar comisión"
                description={`La comisión ${commission.name} dejará de estar activa. Las inscripciones ya creadas se conservarán para consulta.`}
                confirmLabel="Cerrar comisión"
                onClose={() => setIsCloseCommissionOpen(false)}
                onConfirm={() => {
                    updateCommission(course.id, commission.id, { status: 'Cerrada' })
                    setIsCloseCommissionOpen(false)
                }}
            />

            <div className="page-header compact" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, width: '100%' }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', color: 'var(--muted)', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        <Link to={path(`oferta/${course.id}`)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--muted)', textDecoration: 'none' }}>
                            <ArrowLeft size={14} />
                            {course.name}
                        </Link>
                        <span>›</span>
                        <span>Comisión</span>
                        <span>›</span>
                        <span>{commission.name}</span>
                    </div>
                    <h1 style={{ marginTop: 16 }}>{commission.name}</h1>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end', flexShrink: 0 }}>
                    <Link to={path(`oferta/${course.id}?editCommission=${commission.id}`)} className="secondary-button compact-button">Editar comisión</Link>
                    {commission.status !== 'Cerrada' && <button type="button" className="secondary-button compact-button" onClick={() => setIsCloseCommissionOpen(true)}>Cerrar comisión</button>}
                </div>
            </div>

            <div className="data-table-card" style={{ padding: 20 }}>
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'overview' | 'students' | 'exams')}>
                    <TabsList variant="line" aria-label="Detalle de comisión">
                        <TabsTrigger value="overview">Resumen</TabsTrigger>
                        <TabsTrigger value="students">Alumnos</TabsTrigger>
                        <TabsTrigger value="exams">Exámenes</TabsTrigger>
                    </TabsList>
                </Tabs>

                {activeTab === 'overview' && (
                    <CommissionSummary courseName={course.name} commission={commission} studentCount={commissionStudents.length} />
                )}

                {activeTab === 'students' && (
                    <CommissionStudentsTable
                        rows={commissionStudents}
                        selectedIds={selectedStudentIds}
                        openMenuId={openMenuId}
                        onSelectionChange={setSelectedStudentIds}
                        onToggleMenu={(id) => setOpenMenuId((current) => current === id ? null : id)}
                        onAssign={() => setIsAssignmentModalOpen(true)}
                        onView={(student) => navigate(path(`alumnos/${student.id}`))}
                        onCommunicate={openCommunication}
                        onCertificate={openCertificate}
                        onStatus={openStatus}
                    />
                )}

                {activeTab === 'exams' && (
                    <CommissionExamsTab exams={commissionExams} openMenuId={openMenuId} onToggleMenu={(id) => setOpenMenuId((current) => current === id ? null : id)} onCreate={openExam} onEdit={openEditExam} />
                )}

            </div>
        </div>
    )
}
