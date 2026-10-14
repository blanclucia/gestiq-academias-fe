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
                <div>
                    <SectionHeading icon={<BookOpenCheck size={20} />} title="Información general" description="Datos generales de esta oferta académica." />
                    <p className="offer-overview-description">{course.description || 'Esta oferta todavía no tiene una descripción. Completala para darle más contexto al equipo.'}</p>
                    <div className="offer-overview-meta"><StatusBadge label={course.status} tone={statusTone} /></div>
                </div>
                <div className="offer-overview-actions"><button type="button" className="secondary-button compact-button" onClick={onEdit}><PencilLine size={15} /> Editar oferta</button></div>
            </section>
        </Card>
    )
}
