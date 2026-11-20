import { Component, lazy, Suspense, useEffect, useState, type ReactNode } from 'react'
import { Link, Route, Routes, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { SiteShell } from './components/SiteShell'
import { AdminGate } from './components/AdminGate'
import { isLocalAnalyticsAdmin, localAnalyticsEnabled, trackPageView } from './lib/analytics'
import { PRODUCT_ROUTES as R } from './data/productRoutes'
import './styles/app.css'
import './styles/one-screen.css'
import './styles/redesign.css'

const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage').then(module => ({ default: module.AdminDashboardPage })))
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage').then(module => ({ default: module.AdminLoginPage })))
const AppHomePage = lazy(() => import('./pages/AppHomePage').then(module => ({ default: module.AppHomePage })))
const ClassroomKitPage = lazy(() => import('./pages/ClassroomKitPage').then(module => ({ default: module.ClassroomKitPage })))
const ExplorePage = lazy(() => import('./pages/ExplorePage').then(module => ({ default: module.ExplorePage })))
const BeginnerLearningPage = lazy(() => import('./pages/BeginnerLearningPage').then(module => ({ default: module.BeginnerLearningPage })))
const LocalCapstonePage = lazy(() => import('./pages/LocalCapstonePage').then(module => ({ default: module.LocalCapstonePage })))
const LessonPreflightPage = lazy(() => import('./pages/LessonPreflightPage').then(module => ({ default: module.LessonPreflightPage })))
const LessonPage = lazy(() => import('./pages/LessonPage').then(module => ({ default: module.LessonPage })))
const RobotSimulationLessonPage = lazy(() => import('./pages/RobotSimulationLessonPage').then(module => ({ default: module.RobotSimulationLessonPage })))
const BoardCatalogPage = lazy(() => import('./pages/BoardCatalogPage').then(module => ({ default: module.BoardCatalogPage })))
const TopicsPage = lazy(() => import('./pages/TopicsPage').then(module => ({ default: module.TopicsPage })))
const ProjectsPage = lazy(() => import('./pages/ProjectsPage').then(module => ({ default: module.ProjectsPage })))
const ComponentsPage = lazy(() => import('./pages/ComponentsPage').then(module => ({ default: module.ComponentsPage })))
const CircuitBuilderEntry = lazy(() => import('./pages/CircuitBuilderEntry').then(module => ({ default: module.CircuitBuilderEntry })))
const FirmwareHexToolPage = lazy(() => import('./pages/FirmwareHexToolPage').then(module => ({ default: module.FirmwareHexToolPage })))
const ElectronicsCalculatorsPage = lazy(() => import('./pages/ElectronicsCalculatorsPage').then(module => ({ default: module.ElectronicsCalculatorsPage })))
const FreestyleLabPage = lazy(() => import('./pages/FreestyleLabPage').then(module => ({ default: module.FreestyleLabPage })))
const SketchRunnerPage = lazy(() => import('./pages/SketchRunnerPage').then(module => ({ default: module.SketchRunnerPage })))
const SpiceWorkbenchPage = lazy(() => import('./pages/SpiceWorkbenchPage').then(module => ({ default: module.SpiceWorkbenchPage })))
const FeedbackPage = lazy(() => import('./pages/FeedbackPage').then(module => ({ default: module.FeedbackPage })))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage').then(module => ({ default: module.PrivacyPage })))
const LoginPage = lazy(() => import('./pages/LoginPage').then(module => ({ default: module.LoginPage })))
const AuthCallbackPage = lazy(() => import('./pages/AuthCallbackPage').then(module => ({ default: module.AuthCallbackPage })))
const CommunityPage = lazy(() => import('./pages/CommunityPage').then(module => ({ default: module.CommunityPage })))
const CommunityPostPage = lazy(() => import('./pages/CommunityPostPage').then(module => ({ default: module.CommunityPostPage })))
const CommunityNewPostPage = lazy(() => import('./pages/CommunityNewPostPage').then(module => ({ default: module.CommunityNewPostPage })))

class BuilderErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean; resetError: string }> {
  state = { failed: false, resetError: '' }
  static getDerivedStateFromError() { return { failed: true } }
  resetWorkspace = async () => {
    try {
      const { getBrowserStorage, quarantineWorkspaceData } = await import('./lib/workspaceStorage')
      quarantineWorkspaceData(getBrowserStorage('localStorage'), getBrowserStorage('sessionStorage'))
      window.location.reload()
    } catch (error) {
      this.setState({ resetError: error instanceof Error ? error.message : 'Không đặt lại được phòng thử.' })
    }
  }
  render() {
    if (this.state.failed) return <div className="route-placeholder" role="alert"><h1>Không mở được phòng thử</h1><p>Workspace có thể chứa dữ liệu không hợp lệ. Đặt lại sẽ chuyển dữ liệu đang mở sang bản sao lưu; project đã lưu không bị ảnh hưởng và bản sao có thể tải ở trang Dự án.</p><div className="route-error-actions"><button type="button" onClick={this.resetWorkspace}>Sao lưu và đặt lại phòng thử</button><a href="/projects">Mở trang Dự án</a></div>{this.state.resetError&&<p>{this.state.resetError}</p>}</div>
    return this.props.children
  }
}

class RouteErrorBoundary extends Component<{ children: ReactNode; resetKey: string }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidUpdate(previous: { resetKey: string }) {
    if (this.state.failed && previous.resetKey !== this.props.resetKey) this.setState({ failed: false })
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="route-placeholder" role="alert">
          <p className="eyebrow">MẠCH MỞ · KHÔNG TẢI ĐƯỢC NỘI DUNG</p>
          <h1>Trang này gặp sự cố</h1>
          <p>Thử tải lại trang. Nếu lỗi còn tiếp diễn, quay về trang giới thiệu để chọn một khu vực khác.</p>
          <div className="route-error-actions">
            <button type="button" onClick={() => window.location.reload()}>Tải lại trang</button>
            <Link to="/">Về trang giới thiệu</Link>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

function CircuitBuilderRoute({ variant = 'public' }: { variant?: 'public' | 'app' }) {
  const [searchParams] = useSearchParams()
  const sessionKey = `${searchParams.get('guided') ?? ''}:${searchParams.get('lesson') ?? ''}:${searchParams.get('board') ?? ''}`
  return <BuilderErrorBoundary key={sessionKey}><SiteShell variant={variant}><CircuitBuilderEntry key={sessionKey} /></SiteShell></BuilderErrorBoundary>
}

function RoutePlaceholder({ title }: { title: string }) {
  return (
    <div className="route-placeholder">
      <h1>{title}</h1>
      <p>Đường dẫn này không tồn tại hoặc đã được thay đổi.</p>
      <Link to="/">Về trang khám phá</Link>
    </div>
  )
}

/** Khung xương khi tải chunk trang (2026-11-15); hiệu ứng shimmer tắt khi reduced-motion. */
function RouteSkeleton() {
  return (
    <div className="route-loading mm-skeleton-page" role="status">
      <span className="mm-skeleton-line is-title" aria-hidden="true" />
      <span className="mm-skeleton-line" aria-hidden="true" />
      <span className="mm-skeleton-line is-short" aria-hidden="true" />
      <div className="mm-skeleton-grid" aria-hidden="true"><span className="mm-skeleton-block" /><span className="mm-skeleton-block" /><span className="mm-skeleton-block" /></div>
      <span className="mm-skeleton-status">Đang tải trang…</span>
    </div>
  )
}

function readAppSurface() {
  try { return window.sessionStorage.getItem('mach-mo-surface') === 'app' }
  catch { return false }
}

export default function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const [appSurface, setAppSurface] = useState(readAppSurface)
  const inAppSurface = location.pathname !== R.publicHome && (appSurface || location.pathname.startsWith('/app'))

  useEffect(() => {
    if (!localAnalyticsEnabled) return
    trackPageView('page_view', 'router')
    const lessonId = /^(?:\/app)?\/learn\/([^/]+)\/?$/.exec(location.pathname)?.[1]
    if (!lessonId) return
    let cancelled = false
    void import('./data/builderLessons').then(({ builderLessons }) => {
      if (!cancelled && builderLessons.some(lesson => lesson.id === lessonId)) trackPageView('lesson_open')
    }).catch(() => undefined)
    return () => { cancelled = true }
  }, [location.pathname])

  useEffect(() => {
    if (location.pathname === R.publicHome) {
      try { window.sessionStorage.removeItem('mach-mo-surface') } catch { /* The path itself selects the public website shell. */ }
      setAppSurface(false)
      return
    }
    if (location.pathname.startsWith('/app')) {
      try { window.sessionStorage.setItem('mach-mo-surface', 'app') } catch { /* Keep the app shell for this route without session storage. */ }
      setAppSurface(true)
      return
    }
    if (new URLSearchParams(location.search).get('surface') === 'web') {
      try { window.sessionStorage.removeItem('mach-mo-surface') } catch { /* The explicit URL still switches to the public site. */ }
      setAppSurface(false)
      navigate('/', { replace: true })
    }
  }, [location.pathname, location.search, navigate])

  const shell = (children: ReactNode) => <SiteShell variant={inAppSurface ? 'app' : 'public'}>{children}</SiteShell>

  return (
    <Suspense fallback={<RouteSkeleton />}>
    <RouteErrorBoundary resetKey={location.pathname}>
    <Routes>
      <Route path={R.publicHome} element={shell(<ExplorePage />)} />
      <Route path={R.appHome} element={shell(<AppHomePage />)} />
      <Route path={R.appLearn} element={shell(<TopicsPage />)} />
      <Route path={R.appLesson} element={shell(<LessonPage />)} />
      <Route path="/app/robot-simulation" element={shell(<RobotSimulationLessonPage />)} />
      <Route path={R.appBasics} element={shell(<BeginnerLearningPage />)} />
      <Route path={R.appCapstone} element={shell(<LocalCapstonePage />)} />
      <Route path="/app/learn/:lessonId" element={shell(<LessonPreflightPage />)} />
      <Route path={R.appBoards} element={shell(<BoardCatalogPage />)} />
      <Route path={R.appComponents} element={shell(<ComponentsPage />)} />
      <Route path={R.appLab} element={<CircuitBuilderRoute variant="app" />} />
      <Route path={R.appProjects} element={shell(<ProjectsPage />)} />
      <Route path={R.appClassroomKit} element={shell(<ClassroomKitPage />)} />
      <Route path={R.appCalculators} element={shell(<ElectronicsCalculatorsPage />)} />
      <Route path={R.appSpice} element={shell(<SpiceWorkbenchPage />)} />
      <Route path={R.appSketch} element={shell(<SketchRunnerPage />)} />
      <Route path={R.appFirmware} element={shell(<FirmwareHexToolPage />)} />
      <Route path={R.publicBoards} element={shell(<BoardCatalogPage />)} />
      <Route path={R.publicComponents} element={shell(<ComponentsPage />)} />
      {/* 2026-11-14: bàn lắp mạch tự do toàn màn hình; URL mới, không đổi URL cũ. */}
      <Route path="/build/freestyle" element={shell(<FreestyleLabPage />)} />
      <Route path={`${R.appLab}/freestyle`} element={shell(<FreestyleLabPage />)} />
      <Route path={R.publicLab} element={<CircuitBuilderRoute variant={inAppSurface ? 'app' : 'public'} />} />
      <Route path={R.publicFirmware} element={shell(<FirmwareHexToolPage />)} />
      <Route path={R.publicCalculators} element={shell(<ElectronicsCalculatorsPage />)} />
      <Route path={R.publicSpice} element={shell(<SpiceWorkbenchPage />)} />
      <Route path={R.publicSketch} element={shell(<SketchRunnerPage />)} />
      <Route path={R.publicFeedback} element={shell(<FeedbackPage />)} />
      <Route path={R.appFeedback} element={shell(<FeedbackPage />)} />
      <Route path={R.privacy} element={shell(<PrivacyPage />)} />
      <Route path={R.publicLogin} element={shell(<LoginPage />)} />
      <Route path={R.appLogin} element={shell(<LoginPage />)} />
      <Route path={R.authCallback} element={shell(<AuthCallbackPage />)} />
      <Route path={R.publicCommunity} element={shell(<CommunityPage />)} />
      <Route path={`${R.publicCommunity}/new`} element={shell(<CommunityNewPostPage />)} />
      <Route path={`${R.publicCommunity}/:postId`} element={shell(<CommunityPostPage />)} />
      <Route path={R.appCommunity} element={shell(<CommunityPage />)} />
      <Route path={`${R.appCommunity}/new`} element={shell(<CommunityNewPostPage />)} />
      <Route path={`${R.appCommunity}/:postId`} element={shell(<CommunityPostPage />)} />
      <Route path={R.publicTopics} element={shell(<TopicsPage />)} />
      <Route path={R.publicProjects} element={shell(<ProjectsPage />)} />
      <Route path={R.publicLesson} element={shell(<LessonPage />)} />
      <Route path={R.publicBasics} element={shell(<BeginnerLearningPage />)} />
      <Route path={R.publicCapstone} element={shell(<LocalCapstonePage />)} />
      <Route path="/learn/:lessonId" element={shell(<LessonPreflightPage />)} />
      <Route path="/admin" element={isLocalAnalyticsAdmin() ? <AdminDashboardPage local /> : <AdminGate>{(access) => <AdminDashboardPage access={access} />}</AdminGate>} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="*" element={shell(<RoutePlaceholder title="Không tìm thấy trang" />)} />
    </Routes>
    </RouteErrorBoundary>
    </Suspense>
  )
}
