import { listStaff, useAcademyRepositoryVersion } from '@/services/academyRepository'
import { SearchableSelect } from '@/components/ui/SearchableSelect'

type StaffSelectProps = {
    value?: string
    defaultValue?: string
    onChange?: (value: string) => void
}

export function StaffSelect({ value, defaultValue, onChange }: StaffSelectProps) {
    useAcademyRepositoryVersion()
    const teacherSelectOptions = listStaff().filter((teacher) => teacher.role === 'Docente' && teacher.status === 'Activo').map((teacher) => ({ value: teacher.fullName, label: teacher.fullName }))
    return (
        <SearchableSelect value={value ?? defaultValue ?? ''} options={[{ value: '', label: 'Sin docente asignado' }, ...teacherSelectOptions]} onChange={onChange ?? (() => undefined)} placeholder="Buscar docente" emptyLabel="No encontramos docentes." />
    )
}
