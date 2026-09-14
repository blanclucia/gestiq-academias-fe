import { BookOpenCheck, CalendarDays, CheckCircle2, Clock3, Gauge, PencilLine, Users } from 'lucide-react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { AcademicCourse } from '@/services/academyRepository'

type OfferSummaryCardProps = {
    course: AcademicCourse
    assignedStudents: number
    totalCapacity: number
    occupancyPercentage: number
    activeCommissions: number
    openEnrollments: number
    onEdit: () => void
}

export function OfferSummaryCard({ course, assignedStudents, totalCapacity, occupancyPercentage, activeCommissions, openEnrollments, onEdit }: OfferSummaryCardProps) {
    const statusTone = course.status === 'Activo' ? 'success' : course.status === 'Borrador' ? 'warning' : 'neutral'

    return (
        <section className="data-table-card offer-summary-card" style={{ padding: 20 }}>
            <div className="offer-overview">
                <section className="offer-overview-hero">
                    <div>
                        <div className="offer-overview-eyebrow"><BookOpenCheck size={15} /> Información general</div>
                        <p className="offer-overview-description">{course.description || 'Esta oferta todavía no tiene una descripción. Completala para darle más contexto al equipo.'}</p>
                        <div className="offer-overview-meta"><span><Clock3 size={15} /> {course.duration || 'Duración sin definir'}</span><StatusBadge label={course.status} tone={statusTone} /></div>
                    </div>
                    <div className="offer-overview-actions"><button type="button" className="secondary-button compact-button" onClick={onEdit}><PencilLine size={15} /> Editar oferta</button></div>
                </section>
                <div className="offer-kpi-grid">
                    <div className="offer-kpi"><Users size={17} /><span>Alumnos</span><strong>{assignedStudents}</strong><small>asignados al curso</small></div>
                    <div className="offer-kpi"><Gauge size={17} /><span>Ocupación</span><strong>{occupancyPercentage}%</strong><small>{assignedStudents} de {totalCapacity} cupos</small></div>
                    <div className="offer-kpi"><CalendarDays size={17} /><span>Comisiones</span><strong>{course.commissions.length}</strong><small>{activeCommissions} activas</small></div>
                    <div className="offer-kpi"><CheckCircle2 size={17} /><span>Inscripciones</span><strong>{openEnrollments}</strong><small>abiertas ahora</small></div>
                </div>
            </div>
        </section>
    )
}
