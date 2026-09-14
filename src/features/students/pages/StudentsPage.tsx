import { Download, FileUp, Mail, MessageCircle, Send } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CrudListPage } from '@/components/crud/CrudListPage'
import { DeleteConfirmationModal, EntityFormModal, FormGrid, FormSection } from '@/components/crud/EntityFormModal'
import { StudentForm, type StudentFormValue } from '../components/StudentForm'
import { CommissionAssignmentModal } from '@/features/commissions'
import { assignStudentsToCommission, createStudent, getActiveAcademicCycleId, listCourses, listStudents, removeStudent, updateStudent, useAcademyRepositoryVersion } from '@/services/academyRepository'
import { useCrudList } from '@/hooks/useCrudList'
import type { Student } from '@/types/domain'
import { useSelectedBranchId } from '@/services/branchRepository'
import { listCommunicationTemplates } from '@/services/communicationTemplateRepository'
import { csvHeaders, importFieldLabels, parseStudentCsv, requiredImportFields, suggestStudentImportMapping as suggestMapping, type ImportFieldKey, type ImportStudentRow } from '../model/studentImport'
import { validateStudent } from '../model/studentValidation'
import { validateConditions } from '@/components/forms/formValidation'
import { StudentsTable } from '../components/StudentsTable'
import { useWorkspace } from '@/workspace/useWorkspace'

type StudentFilters = {
    course: string
    commission: string
    status: string
}

const emptyStudentForm: StudentFormValue = { firstName: '', lastName: '', document: '', email: '', phone: '', birthDate: '', status: 'Activo', notes: '' }

type StatusChangeRequest = {
    studentId: string
    studentName: string
    nextStatus: Student['status']
}

export function StudentsPage() {
    useAcademyRepositoryVersion()
    const navigate = useNavigate()
    const { path } = useWorkspace()
    const selectedBranchId = useSelectedBranchId()
    const [openMenuId, setOpenMenuId] = useState<string | null>(null)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isImportModalOpen, setIsImportModalOpen] = useState(false)
    const [editingStudent, setEditingStudent] = useState<Student | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<Student | null>(null)
    const studentList = listStudents()
    const academicCourses = listCourses().filter((course) => course.cycleId === getActiveAcademicCycleId())
    const [studentForm, setStudentForm] = useState<StudentFormValue>(emptyStudentForm)
    const [statusChangeRequest, setStatusChangeRequest] = useState<StatusChangeRequest | null>(null)
    const [isBulkDeactivateOpen, setIsBulkDeactivateOpen] = useState(false)
    const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false)
    const [isBulkCommunicationOpen, setIsBulkCommunicationOpen] = useState(false)
    const [communicationSent, setCommunicationSent] = useState(false)
    const [communicationForm, setCommunicationForm] = useState({ channel: 'Email' as 'Email' | 'WhatsApp', subject: '', message: '' })
    const [communicationTemplateId, setCommunicationTemplateId] = useState('custom')
    const [assignmentStudentIds, setAssignmentStudentIds] = useState<string[]>([])
    const [importHeaders, setImportHeaders] = useState<string[]>([])
    const [importRawRows, setImportRawRows] = useState<string[][]>([])
    const [importMapping, setImportMapping] = useState<Record<ImportFieldKey, string>>({
        firstName: '',
        lastName: '',
        document: '',
        email: '',
        phone: '',
        birthDate: '',
    })
    const [importFileName, setImportFileName] = useState('')
    const [importFileError, setImportFileError] = useState('')
    const [rowCourseAssignments, setRowCourseAssignments] = useState<Record<number, string>>({})
    const [globalCourseAssignment, setGlobalCourseAssignment] = useState('')
    const [appliedFilters, setAppliedFilters] = useState<StudentFilters>({
        course: '',
        commission: '',
        status: '',
    })

    const importCourseOptions = useMemo(() => {
        const options = academicCourses.flatMap((course) =>
            course.commissions.map((commission) => ({
                key: `${course.name}|${commission.name}`,
                label: `${course.name} · ${commission.name}`,
                value: {
                    name: course.name,
                    group: commission.name,
                    modality: 'Grupo' as const,
                },
            })),
        )

        return Array.from(new Map(options.map((option) => [option.key, option])).values())
    }, [academicCourses])

    const importCourseOptionMap = useMemo(
        () => new Map(importCourseOptions.map((option) => [option.key, option.value])),
        [importCourseOptions],
    )

    const courseToCommissions = useMemo(() => {
        const map = new Map<string, string[]>()

        studentList.forEach((student) => {
            student.courses.forEach((course) => {
                const current = map.get(course.name) ?? []

                if (!current.includes(course.group)) {
                    map.set(course.name, [...current, course.group])
                }
            })
        })

        return map
    }, [studentList])

    const courseFilterOptions = useMemo(
        () => Array.from(new Set(studentList.flatMap((student) => student.courses.map((course) => course.name)))),
        [studentList],
    )

    const statusFilterOptions = useMemo(
        () => Array.from(new Set(studentList.map((student) => student.status))),
        [studentList],
    )

    const assignmentCommissions = useMemo(
        () => academicCourses.flatMap((course) =>
            course.commissions.map((commission) => ({
                id: commission.id,
                courseName: course.name,
                commissionName: commission.name,
                studentsCount: commission.studentsCount,
                capacity: commission.capacity,
                amount: commission.amount,
                schedule: commission.schedule,
                status: commission.status,
            })),
        ),
        [academicCourses],
    )

    const filteredStudentList = useMemo(
        () =>
            studentList.filter((student) => {
                if (appliedFilters.status && student.status !== appliedFilters.status) {
                    return false
                }

                if (appliedFilters.course && !student.courses.some((course) => course.name === appliedFilters.course)) {
                    return false
                }

                if (appliedFilters.commission && !student.courses.some((course) => course.group === appliedFilters.commission)) {
                    return false
                }

                return true
            }),
        [studentList, appliedFilters],
    )

    const {
        search,
        setSearch,
        selectedIds,
        selectedCount,
        currentPage,
        setCurrentPage,
        totalPages,
        paginatedItems: paginatedStudents,
        toggleSelection,
        toggleSelectAll,
        resetSelection,
    } = useCrudList<Student>({
        items: filteredStudentList,
        pageSize: 10,
        searchFields: [
            (student) => `${student.fullName} ${student.email}`,
            (student) => student.courses.map((course) => `${course.name} ${course.group}`),
        ],
    })

    const isSelectAllChecked =
        paginatedStudents.length > 0 && paginatedStudents.every((student) => selectedIds.includes(student.id))

    const missingRequiredMappings = requiredImportFields.filter((field) => !importMapping[field])

    const importRows = useMemo(() => {
        if (importRawRows.length === 0 || missingRequiredMappings.length > 0) {
            return [] as ImportStudentRow[]
        }

        const headerIndex = new Map(importHeaders.map((header, index) => [header, index]))

        return importRawRows.map((cols, lineIndex) => {
            const pick = (field: ImportFieldKey) => {
                const header = importMapping[field]
                if (!header) {
                    return ''
                }

                const index = headerIndex.get(header)
                return index === undefined ? '' : (cols[index] ?? '').trim()
            }

            const row: ImportStudentRow = {
                rowNumber: lineIndex + 2,
                firstName: pick('firstName'),
                lastName: pick('lastName'),
                document: pick('document'),
                email: pick('email'),
                phone: pick('phone'),
                birthDate: pick('birthDate') || undefined,
                errors: [],
            }

            if (!row.firstName) {
                row.errors.push('Falta nombre')
            }

            if (!row.lastName) {
                row.errors.push('Falta apellido')
            }

            if (!row.document) {
                row.errors.push('Falta documento')
            }

            if (row.email && !row.email.includes('@')) {
                row.errors.push('Email invalido')
            }

            return row
        })
    }, [importHeaders, importMapping, importRawRows, missingRequiredMappings.length])

    const validImportRows = importRows.filter((row) => row.errors.length === 0)
    const invalidImportRows = importRows.filter((row) => row.errors.length > 0)
    const selectedActiveStudents = studentList.filter((student) => selectedIds.includes(student.id) && student.status !== 'Inactivo')
    const selectedStudents = studentList.filter((student) => selectedIds.includes(student.id))
    const communicationRecipients = selectedStudents.filter((student) => communicationForm.channel === 'Email' ? Boolean(student.email.trim()) : Boolean(student.phone.trim()))
    const communicationTemplates = listCommunicationTemplates(selectedBranchId).filter((template) => template.enabled && template.channels.includes(communicationForm.channel))
    const selectedCommunicationTemplateId = communicationTemplates.some((template) => template.id === communicationTemplateId) ? communicationTemplateId : 'custom'

    const downloadTemplate = () => {
        const sample = [
            csvHeaders.join(','),
            'Lucía,Gómez,32108901,lucia.gomez@academia.com,+54 11 4321-9900,1999-04-18',
        ].join('\n')

        const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'plantilla_alumnos.csv'
        link.click()
        URL.revokeObjectURL(url)
    }

    const handleImportFile = async (file: File) => {
        const content = await file.text()
        const parsed = parseStudentCsv(content)

        setImportFileName(file.name)
        setImportFileError(parsed.fileError)
        setImportHeaders(parsed.headers)
        setImportRawRows(parsed.rows)
        setImportMapping(suggestMapping(parsed.headers))
        setRowCourseAssignments({})
        setGlobalCourseAssignment('')
    }

    const applyImport = () => {
        if (validImportRows.length === 0) {
            return
        }

        const newStudents = validImportRows.map((row) => ({
            firstName: row.firstName,
            lastName: row.lastName,
            fullName: `${row.firstName} ${row.lastName}`,
            document: row.document,
            email: row.email || '',
            phone: row.phone || '',
            birthDate: row.birthDate,
            status: 'Pendiente' as const,
            notes: undefined,
            courses: (function () {
                const selectedCourseKey = Object.prototype.hasOwnProperty.call(rowCourseAssignments, row.rowNumber)
                    ? rowCourseAssignments[row.rowNumber]
                    : ''
                const selectedCourse = selectedCourseKey ? importCourseOptionMap.get(selectedCourseKey) : undefined

                return selectedCourse ? [selectedCourse] : []
            })(),
        }))

        newStudents.forEach((student) => createStudent(student))
        setIsImportModalOpen(false)
        setImportHeaders([])
        setImportRawRows([])
        setImportFileName('')
        setImportFileError('')
        setRowCourseAssignments({})
        setGlobalCourseAssignment('')
    }

    return (
        <>
            <CommissionAssignmentModal
                open={isAssignmentModalOpen}
                students={studentList}
                selectedStudentIds={assignmentStudentIds}
                commissions={assignmentCommissions}
                onClose={() => {
                    setIsAssignmentModalOpen(false)
                    setAssignmentStudentIds([])
                }}
                onConfirm={({ commission, studentIds }) => {
                    assignStudentsToCommission(studentIds, commission.courseName, commission.commissionName, commission.amount, commission.id, 'Activo')
                    setIsAssignmentModalOpen(false)
                    setAssignmentStudentIds([])
                }}
            />

            <EntityFormModal
                open={isImportModalOpen}
                title="Importador masivo de alumnos"
                subtitle="Carga un CSV, mapea columnas, valida los datos y confirma antes de importar."
                submitLabel={`Importar ${validImportRows.length} alumno${validImportRows.length === 1 ? '' : 's'}`}
                onClose={() => {
                    setIsImportModalOpen(false)
                    setImportHeaders([])
                    setImportRawRows([])
                    setImportFileName('')
                    setImportFileError('')
                    setRowCourseAssignments({})
                    setGlobalCourseAssignment('')
                }}
                onSubmit={applyImport}
            >
                <div className="form-stack import-stack">
                    <div className="import-toolbar">
                        <button type="button" className="secondary-button compact-button" onClick={downloadTemplate}>
                            <Download size={14} />
                            Descargar plantilla
                        </button>

                        <label className="primary-button compact-button" style={{ cursor: 'pointer' }}>
                            <FileUp size={14} />
                            Cargar CSV
                            <input
                                type="file"
                                accept=".csv,text/csv"
                                style={{ display: 'none' }}
                                onChange={(event) => {
                                    const file = event.target.files?.[0]
                                    if (file) {
                                        void handleImportFile(file)
                                    }
                                    event.target.value = ''
                                }}
                            />
                        </label>
                    </div>

                    <div className="import-divider" />

                    {importFileName && (
                        <div className="import-meta">
                            Archivo: <strong>{importFileName}</strong>
                        </div>
                    )}

                    {importFileError && <div className="import-error">{importFileError}</div>}

                    {!importFileError && importHeaders.length > 0 && (
                        <div className="form-section" style={{ margin: 0 }}>
                            <div className="form-section-header">
                                <h4>Mapeo de columnas</h4>
                                <p>Selecciona a que columna del archivo corresponde cada campo.</p>
                            </div>

                            <div className="form-grid">
                                {(Object.keys(importFieldLabels) as ImportFieldKey[]).map((field) => (
                                    <label key={field} className="form-field">
                                        <span className="form-field-label">{importFieldLabels[field]}</span>
                                        <select
                                            className="form-input"
                                            value={importMapping[field]}
                                            onChange={(event) =>
                                                setImportMapping((current) => ({
                                                    ...current,
                                                    [field]: event.target.value,
                                                }))
                                            }
                                        >
                                            <option value="">No mapear</option>
                                            {importHeaders.map((header) => (
                                                <option key={`${field}-${header}`} value={header}>
                                                    {header}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {!importFileError && importHeaders.length > 0 && missingRequiredMappings.length > 0 && (
                        <div className="import-error">
                            Mapea los campos obligatorios para continuar: {missingRequiredMappings.map((field) => importFieldLabels[field].replace(' *', '')).join(', ')}.
                        </div>
                    )}

                    {!importFileError && importRows.length > 0 && (
                        <>
                            <div className="import-course-picker" style={{ marginBottom: 8 }}>
                                <span>Asignar mismo curso a todos</span>
                                <select
                                    className="form-input"
                                    value={globalCourseAssignment}
                                    onChange={(event) => {
                                        const value = event.target.value
                                        setGlobalCourseAssignment(value)

                                        if (!value) {
                                            setRowCourseAssignments({})
                                            return
                                        }

                                        const assignmentEntries = importRows.map((row) => [row.rowNumber, value] as const)
                                        setRowCourseAssignments(Object.fromEntries(assignmentEntries))
                                    }}
                                >
                                    <option value="">Sin asignar</option>
                                    {importCourseOptions.map((option) => (
                                        <option key={`global-${option.key}`} value={option.key}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="import-stats">
                                <span>{validImportRows.length} validos</span>
                                <span>{invalidImportRows.length} con errores</span>
                                <span>{importRows.length} total</span>
                            </div>

                            <div className="import-assignment-table-wrap">
                                <table className="import-assignment-table">
                                    <thead><tr><th>Fila</th><th>Alumno</th><th>Curso / comisión</th><th>Estado</th></tr></thead>
                                    <tbody>{importRows.slice(0, 12).map((row) => (
                                        <tr key={`${row.rowNumber}-${row.document}`}>
                                            <td>{row.rowNumber}</td>
                                            <td><strong>{[row.firstName, row.lastName].filter(Boolean).join(' ') || 'Sin nombre'}</strong><small>{row.email || 'Sin email'}</small></td>
                                            <td><select className="form-input" value={rowCourseAssignments[row.rowNumber] ?? ''} onChange={(event) => setRowCourseAssignments((current) => ({ ...current, [row.rowNumber]: event.target.value }))}>
                                                <option value="">Sin asignar</option>
                                                {importCourseOptions.map((option) => <option key={`${row.rowNumber}-${option.key}`} value={option.key}>{option.label}</option>)}
                                            </select></td>
                                            <td>{row.errors.length > 0 ? <span className="import-row-errors">{row.errors.join(' | ')}</span> : <span className="import-row-ok">Listo</span>}</td>
                                        </tr>
                                    ))}</tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            </EntityFormModal>

            <EntityFormModal
                open={isCreateModalOpen}
                title="Nuevo alumno"
                subtitle="Completa los datos principales del estudiante."
                validate={() => validateStudent(studentForm)}
                onClose={() => { setIsCreateModalOpen(false); setStudentForm(emptyStudentForm) }}
                onSubmit={() => {
                    createStudent({ ...studentForm, fullName: `${studentForm.firstName.trim()} ${studentForm.lastName.trim()}`, notes: studentForm.notes || undefined, courses: [] })
                    setIsCreateModalOpen(false)
                    setStudentForm(emptyStudentForm)
                }}
            >
                <StudentForm value={studentForm} onChange={setStudentForm} />
            </EntityFormModal>

            <EntityFormModal
                open={isEditModalOpen}
                title="Editar alumno"
                subtitle="Actualiza los datos del estudiante."
                validate={() => validateStudent(studentForm)}
                onClose={() => {
                    setIsEditModalOpen(false)
                    setEditingStudent(null)
                }}
                onSubmit={() => {
                    if (editingStudent) {
                        updateStudent(editingStudent.id, { ...studentForm, fullName: `${studentForm.firstName.trim()} ${studentForm.lastName.trim()}`, notes: studentForm.notes || undefined })
                    }
                    setIsEditModalOpen(false)
                    setEditingStudent(null)
                }}
            >
                <StudentForm
                    value={studentForm}
                    onChange={setStudentForm}
                    initialValues={
                        editingStudent ? {
                            fullName: editingStudent.fullName,
                            firstName: editingStudent.firstName,
                            lastName: editingStudent.lastName,
                            document: editingStudent.document,
                            email: editingStudent.email,
                            phone: editingStudent.phone,
                            birthDate: editingStudent.birthDate,
                            status: editingStudent.status,
                            notes: editingStudent.notes,
                        } : undefined
                    }
                />
            </EntityFormModal>

            <DeleteConfirmationModal
                open={Boolean(deleteTarget)}
                title="Eliminar alumno"
                description={`¿Estás seguro que querés eliminar a "${deleteTarget?.fullName}"? Esta acción no se puede deshacer.`}
                onClose={() => setDeleteTarget(null)}
                onConfirm={() => {
                    if (deleteTarget) {
                        removeStudent(deleteTarget.id)
                    }
                    setDeleteTarget(null)
                }}
            />

            <DeleteConfirmationModal
                open={Boolean(statusChangeRequest)}
                title={statusChangeRequest?.nextStatus === 'Inactivo' ? 'Pausar alumno' : 'Reactivar alumno'}
                description={
                    statusChangeRequest?.nextStatus === 'Inactivo'
                        ? `¿Confirmás pausar a "${statusChangeRequest?.studentName}"? Pasará a estado Inactivo.`
                        : `¿Confirmás reactivar a "${statusChangeRequest?.studentName}"? Pasará a estado Activo.`
                }
                confirmLabel={statusChangeRequest?.nextStatus === 'Inactivo' ? 'Pausar' : 'Reactivar'}
                onClose={() => setStatusChangeRequest(null)}
                onConfirm={() => {
                    if (statusChangeRequest) {
                        updateStudent(statusChangeRequest.studentId, { status: statusChangeRequest.nextStatus })
                    }
                    setStatusChangeRequest(null)
                }}
            />

            <DeleteConfirmationModal
                open={isBulkDeactivateOpen}
                title="Dar de baja selección"
                description={`¿Querés pasar a Inactivo a ${selectedActiveStudents.length} alumno${selectedActiveStudents.length === 1 ? '' : 's'} seleccionado${selectedActiveStudents.length === 1 ? '' : 's'}?`}
                confirmLabel="Confirmar baja"
                onClose={() => setIsBulkDeactivateOpen(false)}
                onConfirm={() => {
                    const selectedSet = new Set(selectedActiveStudents.map((student) => student.id))

                    selectedSet.forEach((studentId) => updateStudent(studentId, { status: 'Inactivo' }))
                    resetSelection()
                    setIsBulkDeactivateOpen(false)
                }}
            />

            <EntityFormModal
                open={isBulkCommunicationOpen}
                title={communicationSent ? 'Comunicación enviada' : 'Comunicar a alumnos'}
                subtitle={communicationSent ? `El mensaje fue preparado para ${communicationRecipients.length} alumno${communicationRecipients.length === 1 ? '' : 's'}.` : `${selectedStudents.length} alumno${selectedStudents.length === 1 ? '' : 's'} seleccionado${selectedStudents.length === 1 ? '' : 's'}.`}
                submitLabel={communicationSent ? 'Cerrar' : `Enviar a ${communicationRecipients.length}`}
                validate={() => validateConditions({ communicationRecipients: !communicationSent && communicationRecipients.length === 0 && 'No hay destinatarios disponibles.', communicationSubject: !communicationSent && communicationForm.channel === 'Email' && !communicationForm.subject.trim() && 'Ingresá el asunto.', communicationMessage: !communicationSent && !communicationForm.message.trim() && 'Ingresá el mensaje.' }, 'Revisá la comunicación.')}
                cancelLabel={communicationSent ? 'Volver a alumnos' : 'Cancelar'}
                onClose={() => { setIsBulkCommunicationOpen(false); setCommunicationSent(false) }}
                onSubmit={() => {
                    if (communicationSent) {
                        setIsBulkCommunicationOpen(false)
                        setCommunicationSent(false)
                        resetSelection()
                        return
                    }
                    setCommunicationSent(true)
                }}
            >
                {communicationSent && <div className="bulk-communication-success"><Send size={28} /><strong>Mensaje listo</strong><p>En esta versión de demostración no se contactará realmente a los alumnos.</p></div>}
                {!communicationSent && <FormSection title="Contenido"><label className="form-field"><span className="form-field-label">Usar una comunicación configurada</span><select className="form-input" value={selectedCommunicationTemplateId} onChange={(event) => { const templateId = event.target.value; setCommunicationTemplateId(templateId); if (templateId === 'custom') { setCommunicationForm((current) => ({ ...current, subject: '', message: '' })); return } const template = communicationTemplates.find((item) => item.id === templateId); if (template) setCommunicationForm((current) => ({ ...current, subject: template.subject, message: template.message })) }}><option value="custom">Escribir un mensaje en el momento</option>{communicationTemplates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}</select></label>{communicationTemplates.length === 0 && <p className="bulk-template-note">No hay comunicaciones activas para {communicationForm.channel} en esta sede.</p>}</FormSection>}
                {communicationSent ? <div /> : communicationSent ? <div className="bulk-communication-success"><Send size={28} /><strong>Mensaje listo</strong><p>En esta versión de demostración no se contactará realmente a los alumnos.</p></div> : <div className="form-stack"><FormSection title="Canal y destinatarios"><div className="bulk-channel-options"><button type="button" className={communicationForm.channel === 'Email' ? 'selected' : ''} onClick={() => setCommunicationForm((current) => ({ ...current, channel: 'Email' }))}><Mail size={18} /> Email</button><button type="button" className={communicationForm.channel === 'WhatsApp' ? 'selected' : ''} onClick={() => setCommunicationForm((current) => ({ ...current, channel: 'WhatsApp' }))}><MessageCircle size={18} /> WhatsApp</button></div><div className="bulk-recipient-summary"><strong>{communicationRecipients.length} destinatarios disponibles</strong>{communicationRecipients.length < selectedStudents.length && <span>{selectedStudents.length - communicationRecipients.length} sin {communicationForm.channel === 'Email' ? 'email' : 'teléfono'} quedarán excluidos.</span>}</div></FormSection><FormSection title="Mensaje"><FormGrid>{communicationForm.channel === 'Email' && <label className="form-field"><span className="form-field-label">Asunto</span><input className="form-input" value={communicationForm.subject} onChange={(event) => setCommunicationForm((current) => ({ ...current, subject: event.target.value }))} placeholder="Asunto de la comunicación" /></label>}<label className="form-field academy-field-full"><span className="form-field-label">Mensaje</span><textarea className="form-input" rows={6} value={communicationForm.message} onChange={(event) => setCommunicationForm((current) => ({ ...current, message: event.target.value }))} placeholder="Escribí el mensaje para los alumnos seleccionados" /></label></FormGrid></FormSection></div>}
            </EntityFormModal>

            <CrudListPage
                contentInset
                title="Alumnos"
                description="Seguimiento de estudiantes, cupos, pagos y próximas clases."
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder="Buscar alumno, email o curso"
                filterFields={[
                    { key: 'course', label: 'Curso', options: courseFilterOptions },
                    {
                        key: 'commission',
                        label: 'Comisión',
                        options: (filters) => {
                            if (!filters.course) {
                                return Array.from(new Set(studentList.flatMap((student) => student.courses.map((course) => course.group))))
                            }

                            return courseToCommissions.get(filters.course) ?? []
                        },
                    },
                    { key: 'status', label: 'Estado', options: statusFilterOptions },
                ]}
                onApplyFilters={(filters) => {
                    const course = filters.course ?? ''
                    const commission = filters.commission ?? ''
                    const validCommissions = course ? courseToCommissions.get(course) ?? [] : undefined

                    setAppliedFilters({
                        course,
                        commission: validCommissions && commission && !validCommissions.includes(commission) ? '' : commission,
                        status: filters.status ?? '',
                    })
                }}
                toolbar={{
                    filters: { label: 'Filtros', variant: 'secondary' },
                    import: { label: 'Importar', onClick: () => setIsImportModalOpen(true), variant: 'secondary' },
                    create: { label: 'Nuevo', onClick: () => setIsCreateModalOpen(true), variant: 'primary' },
                }}
                selectedCount={selectedCount}
                bulkActionItems={[
                    {
                        label: 'Comunicar',
                        icon: <MessageCircle size={15} />,
                        onClick: () => {
                            setCommunicationForm({ channel: 'Email', subject: '', message: '' })
                            setCommunicationTemplateId('custom')
                            setCommunicationSent(false)
                            setIsBulkCommunicationOpen(true)
                        },
                    },
                    {
                        label: 'Asignar a comisión',
                        onClick: () => {
                            setAssignmentStudentIds(selectedIds)
                            setIsAssignmentModalOpen(true)
                        },
                    },
                    {
                        label: 'Dar de baja', onClick: () => {
                            if (selectedActiveStudents.length > 0) {
                                setIsBulkDeactivateOpen(true)
                            }
                        }
                    },
                ]}
            >
                <StudentsTable
                    rows={paginatedStudents}
                    selectedIds={selectedIds}
                    selectAllChecked={isSelectAllChecked}
                    openMenuId={openMenuId}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    onToggleSelection={toggleSelection}
                    onToggleSelectAll={toggleSelectAll}
                    onToggleMenu={(id) => setOpenMenuId((current) => current === id ? null : id)}
                    onView={(student) => navigate(path(`alumnos/${student.id}`))}
                    onAssign={(student) => { setAssignmentStudentIds([student.id]); setIsAssignmentModalOpen(true) }}
                    onPrivateLesson={(student) => navigate(path(`oferta?tab=private&student=${student.id}`))}
                    onEdit={(student) => { setEditingStudent(student); setStudentForm({ firstName: student.firstName, lastName: student.lastName, document: student.document, email: student.email, phone: student.phone, birthDate: student.birthDate ?? '', status: student.status, notes: student.notes ?? '' }); setIsEditModalOpen(true) }}
                    onStatus={(student) => setStatusChangeRequest({ studentId: student.id, studentName: student.fullName, nextStatus: student.status === 'Inactivo' ? 'Activo' : 'Inactivo' })}
                    onDelete={setDeleteTarget}
                />
            </CrudListPage>
        </>
    )
}
