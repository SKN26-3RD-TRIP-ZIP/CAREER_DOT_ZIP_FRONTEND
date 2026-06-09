import { Route, Routes } from 'react-router-dom'
import SaaSPrototype from './pages/prototype/SaaSPrototype.jsx'

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
      {prototypeRoutes.map((path) => (
        <Route key={path} path={path} element={<SaaSPrototype />} />
      ))}
      <Route path="*" element={<SaaSPrototype />} />
    </Routes>
  )
}

export default App
