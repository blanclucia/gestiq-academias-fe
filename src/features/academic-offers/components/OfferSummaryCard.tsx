import { BookOpenCheck, PencilLine } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { AcademicCourse } from '@/services/academyRepository'

type OfferSummaryCardProps = {
    course: AcademicCourse
    onEdit: () => void
}

export function OfferSummaryCard({ course, onEdit }: OfferSummaryCardProps) {
    const statusTone = course.status === 'Activo' ? 'success' : course.status === 'Borrador' ? 'warning' : 'neutral'

    return (
        <Card className="offer-summary-card">
            <section className="offer-overview-hero">
                <SectionHeading icon={<BookOpenCheck size={20} />} title="Información general" description="Datos generales de esta oferta académica." />
                <div className="offer-overview-actions"><button type="button" className="secondary-button compact-button" onClick={onEdit}><PencilLine size={15} /> Editar oferta</button></div>
            </section>
            <dl className="offer-detail-list offer-summary-list">
                <div><dt>Estado</dt><dd><StatusBadge label={course.status} tone={statusTone} /></dd></div>
                <div><dt>Descripción</dt><dd className={course.description ? 'offer-detail-text' : 'offer-detail-text offer-detail-empty'}>{course.description || 'Sin descripción. Completala para darle más contexto al equipo.'}</dd></div>
            </dl>
        </Card>
    )
}
