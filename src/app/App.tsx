import { Navigate, Route, Routes } from 'react-router-dom'
import { useState } from 'react'
import { BookOpen, CalendarDays, ClipboardCheck, CreditCard, GraduationCap } from 'lucide-react'
import { AcademicOfferDetailPage, AcademicOffersPage } from '@/features/academic-offers'
import { CommissionDetailPage } from '@/features/commissions'
import { EnrollmentDetailPage, PublicEnrollmentPage } from '@/features/enrollments'
import { RoleDashboardPage } from '@/features/dashboard'
import { RoleModulePage } from '@/components/layout/RoleModulePage'
import { AcademySettingsPage } from '@/features/academy-settings'
import { ProfilePage } from '@/features/profile'
import { BranchesPage, BranchesSettingsPage } from '@/features/branches'
import { BillingPage, PublicPaymentPage } from '@/features/billing'
import { FinancePage } from '@/features/finances'
import { AgendaPage } from '@/features/agenda'
import { StudentDetailPage, StudentsPage } from '@/features/students'
import { AcademyBrandProvider } from '@/theme/AcademyBrandProvider'
import { AppBrandProvider } from '@/theme/AppBrandProvider'
import { defaultAcademyBrand, defaultAppBrandConfig } from '@/theme/brandTheme'
import { LoginPage } from '@/auth/LoginPage'
import { getAcademySettings } from '@/services/academySettingsRepository'
import { WorkspaceLayout } from '@/workspace/WorkspaceLayout'
import { RequireRole } from '@/workspace/RequireRole'
import { useActiveRole } from '@/auth/RoleContext'
import { LegacyRedirect } from '@/workspace/LegacyRedirect'

function WorkspaceAgendaPage() {
  const { activeRole } = useActiveRole()
  if (activeRole === 'admin') return <AgendaPage />
  if (activeRole === 'teacher') return <RoleModulePage title="Agenda" description="Tu cronograma de clases y actividades." icon={CalendarDays} />
  return <Navigate to=".." replace />
}

const authStorageKey = 'gestiq-demo-authenticated'

function App() {
  const initialAcademySettings = getAcademySettings()
  const [authenticated, setAuthenticated] = useState(() => typeof window !== 'undefined' && window.localStorage.getItem(authStorageKey) === 'true')

  const login = () => {
    window.localStorage.setItem(authStorageKey, 'true')
    setAuthenticated(true)
  }

  const logout = () => {
    window.localStorage.removeItem(authStorageKey)
    setAuthenticated(false)
  }

  return (
    <AppBrandProvider
      initialConfig={{
        ...defaultAppBrandConfig,
        visibleName: initialAcademySettings.general.commercialName,
        shortName: initialAcademySettings.brand.shortName,
        logoText: initialAcademySettings.brand.shortName,
      }}
    >
      <AcademyBrandProvider initialBrand={initialAcademySettings.brand ?? defaultAcademyBrand}>
        <Routes>
          <Route path="/:organizationSlug/enrollments/:slug" element={<PublicEnrollmentPage />} />
          <Route path="/:organizationSlug/payments/:paymentId" element={<PublicPaymentPage />} />
          <Route path="/:organizationSlug/inscripciones/:slug" element={<LegacyRedirect authenticated={authenticated} />} />
          <Route path="/:organizationSlug/pagos/:paymentId" element={<LegacyRedirect authenticated={authenticated} />} />
          <Route path="/login" element={authenticated ? <Navigate to="/puentes/admin" replace /> : <LoginPage onLogin={login} />} />
          <Route path="/" element={<Navigate to={authenticated ? '/puentes/admin' : '/login'} replace />} />
          <Route path="/:organizationSlug/:mode" element={authenticated ? <WorkspaceLayout onLogout={logout} /> : <Navigate to="/login" replace />}>
            <Route index element={<RoleDashboardPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="schedule" element={<WorkspaceAgendaPage />} />
            <Route element={<RequireRole role="admin" />}>
              <Route path="students" element={<StudentsPage />} />
              <Route path="students/:studentId" element={<StudentDetailPage />} />
              <Route path="offers" element={<AcademicOffersPage />} />
              <Route path="offers/:courseId" element={<AcademicOfferDetailPage />} />
              <Route path="offers/:courseId/commissions/:commissionId" element={<CommissionDetailPage />} />
              <Route path="offers/:courseId/commissions/:commissionId/enrollments/:enrollmentId" element={<EnrollmentDetailPage />} />
              <Route path="offers/:courseId/enrollments/:enrollmentId" element={<EnrollmentDetailPage />} />
              <Route path="billing" element={<BillingPage />} />
              <Route path="finances" element={<FinancePage />} />
              <Route path="academy" element={<AcademySettingsPage />} />
              <Route path="branches" element={<BranchesSettingsPage />} />
              <Route path="branches/list" element={<BranchesPage />} />
              <Route path="branches/:branchId" element={<BranchesSettingsPage />} />
            </Route>
            <Route element={<RequireRole role="teacher" />}>
              <Route path="classes" element={<RoleModulePage title="Mis clases" description="Clases y comisiones que tenés asignadas." icon={BookOpen} />} />
              <Route path="attendance" element={<RoleModulePage title="Asistencia" description="Registro y seguimiento de asistencia de tus alumnos." icon={ClipboardCheck} />} />
            </Route>
            <Route element={<RequireRole role="student" />}>
              <Route path="courses" element={<RoleModulePage title="Mis cursos" description="Cursos, contenidos y progreso académico." icon={GraduationCap} />} />
              <Route path="calendar" element={<RoleModulePage title="Calendario" description="Clases, evaluaciones y fechas importantes." icon={CalendarDays} />} />
              <Route path="payments" element={<RoleModulePage title="Mis pagos" description="Cuotas, vencimientos y comprobantes." icon={CreditCard} />} />
            </Route>
          </Route>
          <Route path="*" element={<LegacyRedirect authenticated={authenticated} />} />
        </Routes>
      </AcademyBrandProvider>
    </AppBrandProvider>
  )
}

export default App
