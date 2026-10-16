import { Plus } from 'lucide-react'
import { useState } from 'react'
import { MultiSearchableSelect } from '@/components/ui/MultiSearchableSelect'
import { QuickCreateTeacherModal } from '@/features/staff'

// Same multi-select as the rest of the app, plus a shortcut to create a teacher without leaving the form.
export function TeacherMultiSelect({ options, value, onChange, branchId }: { options: Array<{ id: string; fullName: string }>; value: string[]; onChange: (value: string[]) => void; branchId?: string }) {
    const [isCreateTeacherOpen, setIsCreateTeacherOpen] = useState(false)

    return <>
        <MultiSearchableSelect
            name="commissionTeachers"
            values={value}
            onChange={onChange}
            options={options.map((teacher) => ({ value: teacher.fullName, label: teacher.fullName }))}
            placeholder="Seleccionar profesores"
            emptyLabel="No se encontraron profesores."
            footerAction={{ label: 'Crear profesor nuevo', icon: <Plus size={14} />, onClick: () => setIsCreateTeacherOpen(true) }}
        />
        <QuickCreateTeacherModal
            open={isCreateTeacherOpen}
            branchId={branchId}
            onClose={() => setIsCreateTeacherOpen(false)}
            onCreated={(fullName) => {
                onChange([...value, fullName])
                setIsCreateTeacherOpen(false)
            }}
        />
    </>
}
