import { Routes, Route, Navigate } from 'react-router-dom'
import VoiceInterviewPage from './pages/interview/VoiceInterviewPage.jsx'
import Login from './pages/admin/Login.jsx'
import Dashboard from './pages/admin/Dashboard.jsx'
import Members from './pages/admin/Members.jsx'
import Prompts from './pages/admin/Prompts.jsx'
import PrivateRoute from './components/admin/layout/PrivateRoute.jsx'

function App() {
  return (
    <Routes>
      {/* 기존 면접 페이지 */}
      <Route path="/" element={<VoiceInterviewPage />} />

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
