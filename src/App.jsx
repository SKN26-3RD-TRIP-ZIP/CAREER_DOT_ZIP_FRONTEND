import { Routes, Route } from 'react-router-dom'
import SaaSPrototype from './pages/prototype/SaaSPrototype.jsx'
import VoiceInterviewPage from './pages/interview/VoiceInterviewPage.jsx'
import JdInputPage from './pages/input/JdInputPage.jsx'
import Login from './pages/admin/Login.jsx'
import Dashboard from './pages/admin/Dashboard.jsx'
import Members from './pages/admin/Members.jsx'
import Prompts from './pages/admin/Prompts.jsx'
import PrivateRoute from './components/admin/layout/PrivateRoute.jsx'
import EvaluationRoutes from './routes/evaluationRoutes.jsx'

const prototypeRoutes = [
  '/',
  '/login',
  '/signup',
  '/onboarding',
  '/dashboard',
  '/data',
  '/data/jd',
  '/data/resume',
  '/data/cover-letter',
  '/data/projects',
  '/data/complete',
  '/analysis',
  '/analysis/source',
  '/analysis/result',
  '/analysis/questions',
  '/interview/setup',
  '/interview/mic-check',
  '/interview/start',
  '/interview/question',
  '/interview/answering',
  '/interview/last',
  '/interview/generating',
  '/interview/text',
  '/interview/voice',
  '/interview/result',
  '/report',
  '/report/growth',
  '/report/score',
  '/report/feedback',
  '/report/roadmap',
  '/mypage',
  '/mypage/profile',
  '/mypage/analysis',
  '/mypage/projects',
  '/mypage/interviews',
  '/mypage/reports',
  '/mypage/settings',
  '/admin',
  '/admin/member-detail',
  '/admin/template-create',
  '/admin/versions',
  '/admin/version-test',
  '/admin/audit-logs',
  '/prototype',
]

function App() {
  return (
    <Routes>
      {/* Figma 기반 MVP 통합 데모 라우트 */}
      {prototypeRoutes.map((path) => (
        <Route key={path} path={path} element={<SaaSPrototype />} />
      ))}

      {/* 실제 구현된 리포트(평가) 페이지 — 세션별 */}
      <Route path="/report/*" element={<EvaluationRoutes />} />

      {/* develop 기존 JD 입력 라우트 보존 */}
      <Route path="/jd" element={<JdInputPage />} />

      {/* develop 기존 면접 페이지 라우트 보존 */}
      <Route path="/interview" element={<VoiceInterviewPage />} />

      {/* develop 기존 어드민 라우트 보존 */}
      <Route path="/admin/login" element={<Login />} />
      <Route element={<PrivateRoute />}>
        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="/admin/members" element={<Members />} />
        <Route path="/admin/prompts" element={<Prompts />} />
      </Route>

      {/* fallback */}
      <Route path="*" element={<SaaSPrototype />} />
    </Routes>
  )
}

export default App