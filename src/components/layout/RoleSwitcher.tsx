import { Check, ChevronDown, GraduationCap, UserRound, UsersRound } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useActiveRole } from '@/auth/RoleContext'
import { roleLabels, type UserRole } from '@/auth/roleTypes'
import { useWorkspace } from '@/workspace/useWorkspace'
import { workspaceBase } from '@/workspace/workspaceRoutes'

const roleDescriptions: Record<UserRole, string> = {
    admin: 'Alumnos, oferta y cobros',
    teacher: 'Clases, asistencia y agenda',
    student: 'Cursos, calendario y pagos',
}

const roleIcons = { admin: UsersRound, teacher: GraduationCap, student: UserRound }

export function RoleSwitcher() {
    const { activeRole, availableRoles, setActiveRole } = useActiveRole()
    const [open, setOpen] = useState(false)
    const switcherRef = useRef<HTMLDivElement>(null)
    const navigate = useNavigate()
    const { organization } = useWorkspace()
    const ActiveIcon = roleIcons[activeRole]

    useEffect(() => {
        const closeOutside = (event: PointerEvent) => {
            if (!switcherRef.current?.contains(event.target as Node)) setOpen(false)
        }
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setOpen(false)
        }
        document.addEventListener('pointerdown', closeOutside)
        document.addEventListener('keydown', closeOnEscape)
        return () => {
            document.removeEventListener('pointerdown', closeOutside)
            document.removeEventListener('keydown', closeOnEscape)
        }
    }, [])

    return <div className="role-switcher-wrap context-picker-wrap" ref={switcherRef}>
        <button type="button" className="role-switcher context-picker" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
            <span className="context-picker-icon"><ActiveIcon size={15} /></span><strong className="context-picker-label">{roleLabels[activeRole]}</strong><ChevronDown size={14} />
        </button>
        {open && <div className="role-switcher-menu context-picker-menu" role="menu">
            <div className="role-switcher-heading">Cambiar modo de trabajo</div>
            {availableRoles.map((role) => {
                const Icon = roleIcons[role]
                return <button key={role} type="button" className={activeRole === role ? 'active' : ''} role="menuitem" onClick={() => { setActiveRole(role); setOpen(false); navigate(workspaceBase(organization.slug, role)) }}>
                    <span className="role-option-icon"><Icon size={17} /></span>
                    <span className="role-option-copy"><strong>{roleLabels[role]}</strong><small>{roleDescriptions[role]}</small></span>
                    {activeRole === role && <Check size={16} />}
                </button>
            })}
        </div>}
    </div>
}
