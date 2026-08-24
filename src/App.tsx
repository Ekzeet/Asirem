import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth/AuthContext'
import { useI18n } from './i18n/I18nContext'
import LoginPage from './auth/LoginPage'
import MfaChallenge from './auth/MfaChallenge'
import Layout from './components/Layout'
import { supabaseConfigured } from './lib/supabase'

// A code-split chunk can fail to load when a new build replaces the old hashed
// files (typical after a redeploy). Instead of hanging on the Suspense fallback,
// reload once to fetch a fresh index.html + chunks. Throttled to avoid reload loops.
function lazyWithReload(factory: () => Promise<{ default: React.ComponentType<any> }>) {
  return lazy(() => factory().catch((err) => {
    const last = Number(sessionStorage.getItem('chunkReloadTs') || 0)
    if (Date.now() - last > 10000) {
      sessionStorage.setItem('chunkReloadTs', String(Date.now()))
      window.location.reload()
      return new Promise<{ default: React.ComponentType<any> }>(() => {})
    }
    throw err
  }))
}

// Route pages are code-split so each loads on demand (smaller initial bundle).
const AdminDashboard = lazyWithReload(() => import('./pages/admin/Dashboard'))
const AdminCourses = lazyWithReload(() => import('./pages/admin/Courses'))
const CourseBuilder = lazyWithReload(() => import('./pages/admin/CourseBuilder'))
const AdminStudents = lazyWithReload(() => import('./pages/admin/Students'))
const AdminTeachers = lazyWithReload(() => import('./pages/admin/Teachers'))
const AdminSales = lazyWithReload(() => import('./pages/admin/Sales'))
const AdminEbooks = lazyWithReload(() => import('./pages/admin/Ebooks'))
const AdminRequests = lazyWithReload(() => import('./pages/admin/Requests'))
const Security = lazyWithReload(() => import('./pages/Security'))
const Ebooks = lazyWithReload(() => import('./pages/public/Ebooks'))
const EbookSales = lazyWithReload(() => import('./pages/public/EbookSales'))
const EbookDownload = lazyWithReload(() => import('./pages/public/EbookDownload'))
const Library = lazyWithReload(() => import('./pages/student/Library'))
const AdminAudit = lazyWithReload(() => import('./pages/admin/Audit'))
const Review = lazyWithReload(() => import('./pages/shared/Review'))
const Community = lazyWithReload(() => import('./pages/community/Community'))
const MyCourses = lazyWithReload(() => import('./pages/student/MyCourses'))
const Catalog = lazyWithReload(() => import('./pages/student/Catalog'))
const Player = lazyWithReload(() => import('./pages/student/Player'))
const Certificates = lazyWithReload(() => import('./pages/student/Certificates'))
const TeacherDashboard = lazyWithReload(() => import('./pages/teacher/Dashboard'))
const Verify = lazyWithReload(() => import('./pages/public/Verify'))
const Search = lazyWithReload(() => import('./pages/Search'))
const Exams = lazyWithReload(() => import('./pages/Exams'))
const ExamBuilder = lazyWithReload(() => import('./pages/ExamBuilder'))
const ExamPlayer = lazyWithReload(() => import('./pages/ExamPlayer'))
const PublicLayoutC = lazyWithReload(() => import('./components/PublicLayout'))
const Home = lazyWithReload(() => import('./pages/public/Home'))
const PublicCatalog = lazyWithReload(() => import('./pages/public/PublicCatalog'))
const CourseSales = lazyWithReload(() => import('./pages/public/CourseSales'))
const InstructorProfile = lazyWithReload(() => import('./pages/public/InstructorProfile'))
const Legal = lazyWithReload(() => import('./pages/public/Legal'))
const CheckoutReturn = lazyWithReload(() => import('./pages/public/CheckoutReturn'))
const Checkout = lazyWithReload(() => import('./pages/public/Checkout'))
const AcceptInvite = lazyWithReload(() => import('./pages/public/AcceptInvite'))
const Unsubscribe = lazyWithReload(() => import('./pages/public/Unsubscribe'))
const Paths = lazyWithReload(() => import('./pages/public/Paths'))
const PathSales = lazyWithReload(() => import('./pages/public/PathSales'))
const Pricing = lazyWithReload(() => import('./pages/public/Pricing'))
const AdminAnalytics = lazyWithReload(() => import('./pages/admin/Analytics'))
const AdminBlog = lazyWithReload(() => import('./pages/admin/Blog'))
const MarketingPost = lazyWithReload(() => import('./pages/marketing/MarketingPost'))
const MarketingLayoutC = lazyWithReload(() => import('./pages/marketing/MarketingLayout'))
const MarketingHome = lazyWithReload(() => import('./pages/marketing/MarketingHome'))
const MarketingCourses = lazyWithReload(() => import('./pages/marketing/MarketingCourses'))
const MarketingBlog = lazyWithReload(() => import('./pages/marketing/MarketingBlog'))
const MarketingAbout = lazyWithReload(() => import('./pages/marketing/MarketingAbout'))
const MarketingContact = lazyWithReload(() => import('./pages/marketing/MarketingContact'))

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

function ConfigNotice() {
  return (
    <div className="center-fill" style={{ background: 'var(--bg)', padding: 24 }}>
      <div style={{ maxWidth: 460, background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: '28px 30px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 20, color: 'var(--navy-800)', marginBottom: 10 }}>Configuration missing</div>
        <div style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.6, marginBottom: 16 }}>
          The Supabase environment variables aren't set in this deployment. Add them to your hosting environment variables, then rebuild:
        </div>
        <pre style={{ textAlign: 'left', background: '#F7F9FC', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', fontSize: 12.5, color: '#33415A', overflowX: 'auto' }}>VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY</pre>
      </div>
    </div>
  )
}

function PendingNotice() {
  const { t } = useI18n()
  const { signOut } = useAuth()
  return (
    <div className="center-fill" style={{ background: 'var(--bg)', padding: 24 }}>
      <div style={{ maxWidth: 440, background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: '30px 32px', textAlign: 'center' }}>
        <div style={{ fontSize: 34, marginBottom: 8 }}>⏳</div>
        <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 20, color: 'var(--navy-800)', marginBottom: 10 }}>{t('pendingTitle')}</div>
        <div style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.6, marginBottom: 18 }}>{t('pendingBody')}</div>
        <button onClick={() => signOut()} style={{ height: 40, padding: '0 20px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: '#5B6B82', fontWeight: 700, cursor: 'pointer' }}>{t('signOut')}</button>
      </div>
    </div>
  )
}

export default function App() {
  const { session, me, loading, mfaRequired } = useAuth()

  if (!supabaseConfigured) return <ConfigNotice />
  if (loading) return <Loading />
  // Invited users must set a password before reaching any dashboard.
  if (session && (session.user?.user_metadata as { needs_password?: boolean } | undefined)?.needs_password === true) {
    return <Suspense fallback={<Loading />}><AcceptInvite /></Suspense>
  }
  // 2FA gate: enrolled users must pass the TOTP challenge before reaching the app.
  if (session && mfaRequired) return <Suspense fallback={<Loading />}><MfaChallenge /></Suspense>
  if (session && !me) return <PendingNotice />
  if (!session || !me) {
    return (
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/verify/:serial" element={<Verify />} />
          <Route path="/login" element={<MarketingLayoutC><LoginPage /></MarketingLayoutC>} />
          <Route path="/checkout/return" element={<PublicLayoutC><CheckoutReturn /></PublicLayoutC>} />
          <Route path="/checkout" element={<PublicLayoutC><Checkout /></PublicLayoutC>} />
          <Route path="/accept-invite" element={<PublicLayoutC><AcceptInvite /></PublicLayoutC>} />
          <Route path="/courses" element={<MarketingLayoutC><MarketingCourses /></MarketingLayoutC>} />
          <Route path="/courses/:slug" element={<PublicLayoutC><CourseSales /></PublicLayoutC>} />
          <Route path="/books" element={<MarketingLayoutC><Ebooks /></MarketingLayoutC>} />
          <Route path="/books/:slug" element={<PublicLayoutC><EbookSales /></PublicLayoutC>} />
          <Route path="/ebook-download" element={<PublicLayoutC><EbookDownload /></PublicLayoutC>} />
          <Route path="/instructors/:id" element={<PublicLayoutC><InstructorProfile /></PublicLayoutC>} />
          <Route path="/legal/:doc" element={<PublicLayoutC><Legal /></PublicLayoutC>} />
          <Route path="/unsubscribe/:token" element={<PublicLayoutC><Unsubscribe /></PublicLayoutC>} />
          <Route path="/paths" element={<PublicLayoutC><Paths /></PublicLayoutC>} />
          <Route path="/paths/:slug" element={<PublicLayoutC><PathSales /></PublicLayoutC>} />
          <Route path="/pricing" element={<PublicLayoutC><Pricing /></PublicLayoutC>} />
          <Route path="/blog" element={<MarketingLayoutC><MarketingBlog /></MarketingLayoutC>} />
          <Route path="/blog/:slug" element={<MarketingLayoutC><MarketingPost /></MarketingLayoutC>} />
          <Route path="/about" element={<MarketingLayoutC><MarketingAbout /></MarketingLayoutC>} />
          <Route path="/contact" element={<MarketingLayoutC><MarketingContact /></MarketingLayoutC>} />
          <Route path="/catalog" element={<PublicLayoutC><PublicCatalog seo /></PublicLayoutC>} />
          <Route path="/" element={<MarketingLayoutC><MarketingHome /></MarketingLayoutC>} />
          <Route path="*" element={<MarketingLayoutC><MarketingHome /></MarketingLayoutC>} />
        </Routes>
      </Suspense>
    )
  }

  const isStaff = me.role === 'institution_admin' || me.role === 'super_admin'
  const isTeacher = me.role === 'teacher'
  // A student with no purchased course is limited to browsing/buying — course content,
  // community and exams are gated behind buying at least one course.
  const studentLocked = me.role === 'student' && !me.hasCourses
  const lockTo = <Navigate to="/student/catalog" replace />

  return (
    <Suspense fallback={<Loading />}>
    <Routes>
      <Route path="/verify/:serial" element={<Verify />} />
      <Route path="/login" element={<Navigate to={roleHome(me.role)} replace />} />
      <Route path="/courses" element={<MarketingLayoutC><MarketingCourses /></MarketingLayoutC>} />
      <Route path="/courses/:slug" element={<PublicLayoutC><CourseSales /></PublicLayoutC>} />
      <Route path="/books" element={<MarketingLayoutC><Ebooks /></MarketingLayoutC>} />
      <Route path="/books/:slug" element={<PublicLayoutC><EbookSales /></PublicLayoutC>} />
      <Route path="/ebook-download" element={<PublicLayoutC><EbookDownload /></PublicLayoutC>} />
      <Route path="/instructors/:id" element={<PublicLayoutC><InstructorProfile /></PublicLayoutC>} />
      <Route path="/legal/:doc" element={<PublicLayoutC><Legal /></PublicLayoutC>} />
      <Route path="/checkout/return" element={<PublicLayoutC><CheckoutReturn /></PublicLayoutC>} />
      <Route path="/checkout" element={<PublicLayoutC><Checkout /></PublicLayoutC>} />
      <Route path="/unsubscribe/:token" element={<PublicLayoutC><Unsubscribe /></PublicLayoutC>} />
      <Route path="/paths" element={<PublicLayoutC><Paths /></PublicLayoutC>} />
      <Route path="/paths/:slug" element={<PublicLayoutC><PathSales /></PublicLayoutC>} />
      <Route path="/pricing" element={<PublicLayoutC><Pricing /></PublicLayoutC>} />
      <Route path="/blog" element={<MarketingLayoutC><MarketingBlog /></MarketingLayoutC>} />
      <Route path="/blog/:slug" element={<MarketingLayoutC><MarketingPost /></MarketingLayoutC>} />
      <Route path="/about" element={<MarketingLayoutC><MarketingAbout /></MarketingLayoutC>} />
      <Route path="/contact" element={<MarketingLayoutC><MarketingContact /></MarketingLayoutC>} />
      <Route element={<Layout />}>
        {/* Admin */}
        {isStaff && <Route path="/admin" element={<AdminDashboard />} />}
        {(isStaff || isTeacher) && <Route path="/admin/courses" element={<AdminCourses />} />}
        {(isStaff || isTeacher) && <Route path="/admin/courses/:courseId/edit" element={<CourseBuilder />} />}
        {(isStaff || isTeacher) && <Route path="/admin/students" element={<AdminStudents />} />}
        {isStaff && <Route path="/admin/teachers" element={<AdminTeachers />} />}
        {isStaff && <Route path="/admin/sales" element={<AdminSales />} />}
        {isStaff && <Route path="/admin/ebooks" element={<AdminEbooks />} />}
        {isStaff && <Route path="/admin/requests" element={<AdminRequests />} />}
        {isStaff && <Route path="/admin/audit" element={<AdminAudit />} />}
        {isStaff && <Route path="/admin/analytics" element={<AdminAnalytics />} />}
        {isStaff && <Route path="/admin/blog" element={<AdminBlog />} />}
        {/* Teacher */}
        {isTeacher && <Route path="/teacher" element={<TeacherDashboard />} />}
        {/* Staff assignment review */}
        {(isStaff || isTeacher) && <Route path="/review" element={<Review />} />}
        {/* Student */}
        <Route path="/student" element={<MyCourses />} />
        <Route path="/library" element={<Library />} />
        <Route path="/student/catalog" element={<Catalog />} />
        <Route path="/student/course/:courseId" element={studentLocked ? lockTo : <Player />} />
        <Route path="/student/certificates" element={studentLocked ? lockTo : <Certificates />} />
        {/* Shared */}
        <Route path="/community" element={studentLocked ? lockTo : <Community />} />
        <Route path="/search" element={<Search />} />
        <Route path="/security" element={<Security />} />
        <Route path="/exams" element={studentLocked ? lockTo : <Exams />} />
        {(isStaff || isTeacher) && <Route path="/exams/:examId/build" element={<ExamBuilder />} />}
        <Route path="/exams/:examId/take" element={studentLocked ? lockTo : <ExamPlayer />} />
      </Route>
      <Route path="*" element={<Navigate to={roleHome(me.role)} replace />} />
    </Routes>
    </Suspense>
  )
}
