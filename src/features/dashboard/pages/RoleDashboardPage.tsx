import { useActiveRole } from '@/auth/RoleContext'
import { AdminDashboardPage } from './AdminDashboardPage'
import { StudentDashboardPage } from './StudentDashboardPage'
import { TeacherDashboardPage } from './TeacherDashboardPage'

export function RoleDashboardPage() {
    const { activeRole } = useActiveRole()
    if (activeRole === 'teacher') return <TeacherDashboardPage />
    if (activeRole === 'student') return <StudentDashboardPage />
    return <AdminDashboardPage />
}
