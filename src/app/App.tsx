import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { BookOpen, CalendarDays, ClipboardCheck, CreditCard, GraduationCap } from 'lucide-react'
import { AcademicOfferDetailPage, AcademicOffersPage } from '@/features/academic-offers'
import { CommissionDetailPage } from '@/features/commissions'
import { EnrollmentDetailPage, PublicEnrollmentPage } from '@/features/enrollments'
import { RoleDashboardPage } from '@/features/dashboard'
import { RoleModulePage } from '@/components/layout/RoleModulePage'
import { AcademySettingsPage } from '@/features/academy-settings'
import { useAcademySettings } from '@/services/academySettingsRepository'
import { useStudents } from '@/services/academy/studentsRepository'
import { useAcademicCycles, useCourses } from '@/services/academy/coursesRepository'
import { useStaff } from '@/services/academy/staffRepository'
import { useCharges } from '@/services/billing/paymentsRepository'
import { useExpenses } from '@/services/financeRepository'
import { usePrivateLessons } from '@/services/academy/privateLessonsRepository'
import { useEnrollmentOpenings } from '@/services/academy/enrollmentsRepository'
import { useAcademyBrand } from '@/theme/AcademyBrandContext'
import { ProfilePage } from '@/features/profile'
import { BranchesSettingsPage } from '@/features/branches'
import { BillingPage, PublicPaymentPage } from '@/features/billing'
import { FinancePage } from '@/features/finances'
import { AgendaPage } from '@/features/agenda'
import { StudentDetailPage, StudentsPage } from '@/features/students'
import { AcademyBrandProvider } from '@/theme/AcademyBrandProvider'
import { AppBrandProvider } from '@/theme/AppBrandProvider'
import { defaultAcademyBrand, defaultAppBrandConfig } from '@/theme/brandTheme'
import { LoginPage } from '@/auth/LoginPage'
import { useAuth } from '@/auth/AuthContext'
import { RequireSession } from '@/auth/RequireSession'
import { canOpenModule } from '@/auth/permissions'
import { sessionRole } from '@/workspace/organizationResolver'
import { workspacePath } from '@/workspace/workspaceRoutes'
import { RequireRole } from '@/workspace/RequireRole'
import { useActiveRole } from '@/auth/RoleContext'
import { LegacyRedirect } from '@/workspace/LegacyRedirect'

// Hydrates the theme with the organization's saved brand once settings load — otherwise the
// UI shows the hardcoded default until someone opens "Mi academia" in that session.
function BrandSync() {
  const { session } = useAuth()
  const canReadSettings = session?.permissions.includes('academy.update') ?? false
  const { settings } = useAcademySettings({ enabled: canReadSettings })
  const { setBrand } = useAcademyBrand()
  useEffect(() => { if (settings) setBrand(settings.brand) }, [settings, setBrand])
  return null
}

// Keeps the local mirror of real students warm for the ~10 modules that still read
// listStudents() synchronously (billing, agenda, dashboard, commissions...) without
// each of them needing to mount useStudents() themselves.
function StudentsSync() {
  const { session } = useAuth()
  const canReadStudents = session?.permissions.includes('students.read') ?? false
  useStudents({ enabled: canReadStudents })
  return null
}

// Same idea as StudentsSync, for listCourses()/listAcademicCycles()/getActiveAcademicCycleId().
function AcademicOffersSync() {
  const { session } = useAuth()
  const canReadOffers = session?.permissions.includes('offers.read') ?? false
  useCourses({ enabled: canReadOffers })
  useAcademicCycles({ enabled: canReadOffers })
  return null
}

// Same idea as StudentsSync, for listStaff().
function StaffSync() {
  const { session } = useAuth()
  const canReadStaff = session?.permissions.includes('staff.read') ?? false
  useStaff({ enabled: canReadStaff })
  return null
}

// Same idea as StudentsSync, for listPayments()'s real charges (cuotas de comisión + cargos manuales).
function ChargesSync() {
  const { session } = useAuth()
  const canReadPayments = session?.permissions.includes('payments.read') ?? false
  useCharges({ enabled: canReadPayments })
  return null
}

// Same idea as StudentsSync, for listExpenses().
function ExpensesSync() {
  const { session } = useAuth()
  const canReadExpenses = session?.permissions.includes('expenses.read') ?? false
  useExpenses({ enabled: canReadExpenses })
  return null
}

// Same idea as StudentsSync, for listPrivateLessons().
function PrivateLessonsSync() {
  const { session } = useAuth()
  const canReadPrivateLessons = session?.permissions.includes('private_lessons.read') ?? false
  usePrivateLessons({ enabled: canReadPrivateLessons })
  return null
}

// Same idea as StudentsSync, for listEnrollmentOpenings().
function EnrollmentOpeningsSync() {
  const { session } = useAuth()
  const canReadEnrollments = session?.permissions.includes('enrollments.read') ?? false
  useEnrollmentOpenings({ enabled: canReadEnrollments })
  return null
}

function WorkspaceAgendaPage() {
  const { activeRole } = useActiveRole()
  const { session } = useAuth()
  if (!canOpenModule(activeRole, 'schedule', session?.permissions ?? [])) return <Navigate to=".." replace />
  if (activeRole === 'admin') return <AgendaPage />
  if (activeRole === 'teacher') return <RoleModulePage title="Agenda" description="Tu cronograma de clases y actividades." icon={CalendarDays} />
  return <Navigate to=".." replace />
}

function App() {
  const { session, phase, loading, error, retrySession, logout } = useAuth()
  const authenticated = phase === 'signed-in'
  const home = session ? workspacePath(session.organization.slug, sessionRole(session)) : '/login'
  const name = session?.organization.name || 'GestIQ Academias'
  const login = loading ? <div className="workspace-loading" role="status">Cargando tu sesión…</div>
    : authenticated && error ? <div className="workspace-error" role="alert"><p>No pudimos cargar tu sesión.</p><button onClick={retrySession}>Reintentar</button><button onClick={() => { void logout() }}>Volver al ingreso</button></div>
    : session ? <Navigate to={home} replace /> : <LoginPage />

  return (
    <AppBrandProvider key={session?.organization.id || 'public'}
      initialConfig={{
        ...defaultAppBrandConfig,
        visibleName: name,
        shortName: name.slice(0, 2).toUpperCase(),
        logoText: name.slice(0, 2).toUpperCase(),
      }}
    >
      <AcademyBrandProvider initialBrand={{ ...defaultAcademyBrand, name, shortName: name.slice(0, 2).toUpperCase() }}>
        <BrandSync />
        <StudentsSync />
        <AcademicOffersSync />
        <StaffSync />
        <ChargesSync />
        <ExpensesSync />
        <PrivateLessonsSync />
        <EnrollmentOpeningsSync />
        <Routes>
          <Route path="/:organizationSlug/enrollments/:slug" element={<PublicEnrollmentPage />} />
          <Route path="/:organizationSlug/payments/:paymentId" element={<PublicPaymentPage />} />
          <Route path="/:organizationSlug/inscripciones/:slug" element={<LegacyRedirect />} />
          <Route path="/:organizationSlug/pagos/:paymentId" element={<LegacyRedirect />} />
          <Route path="/login" element={login} />
          <Route path="/" element={<Navigate to={home} replace />} />
          <Route path="/:organizationSlug/:mode" element={<RequireSession />}>
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
          <Route path="*" element={<LegacyRedirect />} />
        </Routes>
      </AcademyBrandProvider>
    </AppBrandProvider>
  )
}

export default App
