import { Navigate, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage.jsx'
import SaaSPrototype from './pages/prototype/SaaSPrototype.jsx'
import VoiceInterviewPage from './pages/interview/VoiceInterviewPage.jsx'
import InterviewQuestionCheckPage from './pages/interview/InterviewQuestionCheckPage.jsx'
import JdInputPage from './pages/input/JdInputPage.jsx'
import DocumentsInputPage from './pages/input/DocumentsInputPage.jsx'
import CoverLetterProjectPage from './pages/input/CoverLetterProjectPage.jsx'
import SessionSetupPage from './pages/input/SessionSetupPage.jsx'
import ProfilePage from './pages/profile/ProfilePage.jsx'
import AuthLoginPage from './pages/auth/LoginPage.jsx'
import SignupPage from './pages/auth/SignupPage.jsx'
import SignupCompletePage from './pages/auth/SignupCompletePage.jsx'
import VerifyEmailPage from './pages/auth/VerifyEmailPage.jsx'
import MyPage from './pages/mypage/MyPage.jsx'
import Login from './pages/admin/Login.jsx'
import Dashboard from './pages/admin/Dashboard.jsx'
import Members from './pages/admin/Members.jsx'
import MemberDetail from './pages/admin/MemberDetail.jsx'
import Prompts from './pages/admin/Prompts.jsx'
import AuditLogs from './pages/admin/AuditLogs.jsx'
import PrivateRoute from './components/admin/layout/PrivateRoute.jsx'
import EvaluationRoutes from './routes/evaluationRoutes.jsx'
import SourceSelectionPage from './pages/analysis/SourceSelectionPage.jsx'
import ResultPage from './pages/analysis/ResultPage.jsx'
import AppLayout from './components/layout/AppLayout.jsx'

const prototypeRoutes = [
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
  '/interview/mic-check',
  '/interview/start',
  '/interview/answering',
  '/interview/last',
  '/interview/generating',
  '/interview/text',
  '/interview/voice',
  '/interview/result',
  '/mypage/profile',
  '/mypage/analysis',
  '/mypage/projects',
  '/mypage/interviews',
  '/mypage/reports',
  '/mypage/settings',
  '/admin',
  '/admin/login',
  '/admin/dashboard',
  '/admin/members',
  '/admin/member-detail',
  '/admin/prompts',
  '/admin/template-create',
  '/admin/versions',
  '/admin/version-test',
  '/admin/audit-logs',
  '/prototype',
]

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />

      <Route element={<AppLayout />}>
        <Route path="/analysis" element={<SourceSelectionPage />} />
        <Route path="/analysis/source" element={<SourceSelectionPage />} />
        <Route path="/analysis/result" element={<ResultPage />} />
        <Route path="/analysis/questions" element={<ResultPage expanded />} />
      </Route>
      {/* Figma 기반 MVP 통합 데모 라우트 */}
      {prototypeRoutes.map((path) => (
        <Route key={path} path={path} element={<SaaSPrototype />} />
      ))}

      {/* 실제 구현된 리포트(평가) 페이지 — 세션별 */}
      <Route path="/report/*" element={<EvaluationRoutes />} />

      {/* develop 기존 JD 입력 라우트 보존 */}
      <Route path="/jd" element={<JdInputPage />} />
      <Route path="/JD" element={<JdInputPage />} />
      <Route path="/input/jd" element={<JdInputPage />} />
      <Route path="/input/documents" element={<DocumentsInputPage />} />
      <Route path="/input/cover-letter-project" element={<CoverLetterProjectPage />} />
      <Route path="/input/session-setup" element={<SessionSetupPage />} />

      {/* 면접 설정 → 세션/질문 생성 진입 (QA P0: JD 저장 후 면접 설정 화면) */}
      <Route path="/session-setup" element={<SessionSetupPage />} />

      {/* develop 기존 면접 페이지 라우트 보존 */}
      <Route path="/interview" element={<VoiceInterviewPage />} />
      <Route path="/interview/setup" element={<SessionSetupPage />} />
      <Route path="/interview/question" element={<InterviewQuestionCheckPage />} />
      <Route path="/interview/setup-check" element={<Navigate to="/interview/setup" replace />} />
      <Route path="/interview/question-check" element={<Navigate to="/interview/question" replace />} />

      {/* 마이페이지 실제 면접 기록/리포트 조회 (prototype /mypage/* 와 분리) */}
      <Route path="/mypage" element={<MyPage />} />
      <Route path="/profile" element={<ProfilePage />} />

      {/* 실제 인증 연동 라우트 (프로토타입 /login,/signup 과 분리) */}
      <Route path="/auth/login" element={<AuthLoginPage />} />
      <Route path="/auth/signup" element={<SignupPage />} />
      <Route path="/auth/signup/complete" element={<SignupCompletePage />} />
      <Route path="/login" element={<Navigate to="/auth/login" replace />} />
      <Route path="/signup" element={<Navigate to="/auth/signup" replace />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />

      {/* develop 기존 어드민 라우트 보존 */}
      <Route path="/admin/live/login" element={<Login />} />
      <Route element={<PrivateRoute />}>
        <Route path="/admin/live/dashboard" element={<Dashboard />} />
        <Route path="/admin/live/members" element={<Members />} />
        <Route path="/admin/live/members/:userId" element={<MemberDetail />} />
        <Route path="/admin/live/prompts" element={<Prompts />} />
        <Route path="/admin/live/audit-logs" element={<AuditLogs />} />
      </Route>

      {/* fallback */}
      <Route path="*" element={<SaaSPrototype />} />
    </Routes>
  )
}

export default App
