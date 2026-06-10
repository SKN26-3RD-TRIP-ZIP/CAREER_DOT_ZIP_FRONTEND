import { Routes, Route, Navigate } from 'react-router-dom'
import VoiceInterviewPage from './pages/interview/VoiceInterviewPage.jsx'
import JdInputPage from './pages/input/JdInputPage.jsx'
import SessionSetupPage from './pages/input/SessionSetupPage.jsx'
import Login from './pages/admin/Login.jsx'
import Dashboard from './pages/admin/Dashboard.jsx'
import Members from './pages/admin/Members.jsx'
import Prompts from './pages/admin/Prompts.jsx'
import PrivateRoute from './components/admin/layout/PrivateRoute.jsx'
import EvaluationRoutes from './routes/evaluationRoutes.jsx'

function App() {
  return (
    <Routes>
      {/* JD 입력 */}
      <Route path="/jd" element={<JdInputPage />} />

      {/* 면접 설정 (세션 생성) */}
      <Route path="/session-setup" element={<SessionSetupPage />} />

      {/* 면접 페이지 */}
      <Route path="/interview" element={<VoiceInterviewPage />} />

      {/* 리포트 페이지 */}
      <Route path="/report/*" element={<EvaluationRoutes />} />

      {/* 기존 경로 호환 */}
      <Route path="/" element={<Navigate to="/jd" replace />} />

      {/* 어드민 */}
      <Route path="/admin/login" element={<Login />} />
      <Route element={<PrivateRoute />}>
        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="/admin/members" element={<Members />} />
        <Route path="/admin/prompts" element={<Prompts />} />
      </Route>

      <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
    </Routes>
  )
}

export default App
