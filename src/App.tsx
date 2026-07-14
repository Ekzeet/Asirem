import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth/AuthContext'
import { useI18n } from './i18n/I18nContext'
import LoginPage from './auth/LoginPage'
import Layout from './components/Layout'

// Route pages are code-split so each loads on demand (smaller initial bundle).
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'))
const AdminCourses = lazy(() => import('./pages/admin/Courses'))
const CourseBuilder = lazy(() => import('./pages/admin/CourseBuilder'))
const AdminStudents = lazy(() => import('./pages/admin/Students'))
const AdminTeachers = lazy(() => import('./pages/admin/Teachers'))
const AdminSales = lazy(() => import('./pages/admin/Sales'))
const Review = lazy(() => import('./pages/shared/Review'))
const Community = lazy(() => import('./pages/community/Community'))
const MyCourses = lazy(() => import('./pages/student/MyCourses'))
const Catalog = lazy(() => import('./pages/student/Catalog'))
const Player = lazy(() => import('./pages/student/Player'))
const Certificates = lazy(() => import('./pages/student/Certificates'))
const TeacherDashboard = lazy(() => import('./pages/teacher/Dashboard'))

function Loading() {
  const { t } = useI18n()
  return (
    <div className="center-fill" style={{ background: 'var(--bg)' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spin" style={{ margin: '0 auto 12px' }} />
        <div style={{ color: 'var(--muted)', fontSize: 13, fontWeight: 600 }}>{t('loading')}</div>
      </div>
    </div>
  )
}

export function roleHome(role: string): string {
  if (role === 'student') return '/student'
  if (role === 'teacher') return '/teacher'
  return '/admin'
}

export default function App() {
  const { session, me, loading } = useAuth()

  if (loading) return <Loading />
  if (!session || !me) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  const isStaff = me.role === 'institution_admin' || me.role === 'super_admin'
  const isTeacher = me.role === 'teacher'

  return (
    <Suspense fallback={<Loading />}>
    <Routes>
      <Route path="/login" element={<Navigate to={roleHome(me.role)} replace />} />
      <Route element={<Layout />}>
        {/* Admin */}
        {isStaff && <Route path="/admin" element={<AdminDashboard />} />}
        {(isStaff || isTeacher) && <Route path="/admin/courses" element={<AdminCourses />} />}
        {(isStaff || isTeacher) && <Route path="/admin/courses/:courseId/edit" element={<CourseBuilder />} />}
        {(isStaff || isTeacher) && <Route path="/admin/students" element={<AdminStudents />} />}
        {isStaff && <Route path="/admin/teachers" element={<AdminTeachers />} />}
        {isStaff && <Route path="/admin/sales" element={<AdminSales />} />}
        {/* Teacher */}
        {isTeacher && <Route path="/teacher" element={<TeacherDashboard />} />}
        {/* Staff assignment review */}
        {(isStaff || isTeacher) && <Route path="/review" element={<Review />} />}
        {/* Student */}
        <Route path="/student" element={<MyCourses />} />
        <Route path="/student/catalog" element={<Catalog />} />
        <Route path="/student/course/:courseId" element={<Player />} />
        <Route path="/student/certificates" element={<Certificates />} />
        {/* Shared */}
        <Route path="/community" element={<Community />} />
      </Route>
      <Route path="*" element={<Navigate to={roleHome(me.role)} replace />} />
    </Routes>
    </Suspense>
  )
}
