import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Bell,
  CheckCircle2,
  Download,
  Eye,
  EyeOff,
  FileText,
  Gauge,
  Lock,
  Mic,
  Pause,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  User,
  X,
} from 'lucide-react'
import './SaaSPrototype.css'

const STORAGE_KEY = 'careerzip.mvp.functional.demo.v1'

const hamzziUser = {
  name: '김햄찌',
  age: 28,
  email: 'hamzzi.kim@gmail.com',
  status: '취업 준비생',
  major: '영어영문학과',
  education: '6개월 국비 지원 백엔드 부트캠프 수료',
  careerType: '신입',
  background: '비전공',
  targetRole: '백엔드 개발자',
  experienceYears: 0,
  techStacks: ['Java', 'Spring Boot', 'MySQL', 'JPA', 'Redis', 'Docker'],
  targetCompany: '주니어 백엔드 개발자 채용 기업',
  interviewGoal: '첫 백엔드 기술 면접 대비',
  mainConcern: 'CS 기초와 데이터베이스 꼬리질문 대응',
  github: 'github.com/hamzzi',
  blog: 'blog.hamzzi.dev',
  notion: 'notion.so/hamzzi-portfolio',
  portfolio: 'hamzzi.dev',
  lastLogin: '2026.06.09 06:30',
  joinedAt: '2026.06.01',
  accountStatus: 'active',
  profileCompletion: 86,
}

const hamzziStats = {
  totalInterviews: 3,
  averageScore: 74,
  latestAnalysisScore: 82,
  jdCount: 2,
  resumeCount: 1,
  projectCount: 2,
  reportCount: 3,
}

const strengths = ['소통 능력', '서류 작성력', '프로젝트 경험 정리', '성장 가능성', '사용자 관점']
const weaknesses = ['CS 기초', '데이터베이스 깊이', '네트워크 개념', '아키텍처 설명', '기술 선택 이유']
const scoreTrend = [66, 74, 82]

const analysisResult = {
  jdFit: 78,
  techMatch: 72,
  csReadiness: 58,
  dbUnderstanding: 64,
  architectureExplanation: 55,
  transitionStory: 83,
  strengths: [
    '비전공 경험을 개발 직무와 연결하려는 스토리가 명확함',
    '부트캠프 프로젝트 경험을 구체적으로 정리함',
    '협업과 커뮤니케이션 강점이 있음',
    '학습 의지와 성장 가능성이 높음',
  ],
  weaknesses: [
    'CS 기본 개념 설명이 얕음',
    '데이터베이스 인덱스/트랜잭션 설명이 부족함',
    'Spring Security/JWT 선택 이유 설명이 약함',
    '기술 선택 시 대안 비교가 부족함',
  ],
}

const questionBank = [
  {
    id: 'q-001',
    source: '전향 스토리',
    sourceType: '이력서 기반',
    difficulty: '중',
    text: '비전공자인데 왜 백엔드 개발자가 되고 싶었나요?',
  },
  {
    id: 'q-002',
    source: 'CS Deep Dive',
    sourceType: 'CS Deep Dive',
    difficulty: '상',
    text: 'JVM 메모리 구조를 설명해보세요.',
  },
  {
    id: 'q-003',
    source: '데이터베이스',
    sourceType: 'CS Deep Dive',
    difficulty: '상',
    text: '인덱스는 왜 사용하고, 언제 오히려 성능에 안 좋을 수 있나요?',
  },
  {
    id: 'q-004',
    source: '데이터베이스',
    sourceType: 'CS Deep Dive',
    difficulty: '상',
    text: '트랜잭션 격리 수준을 설명해보세요.',
  },
  {
    id: 'q-005',
    source: 'Hamzzi Market API',
    sourceType: '프로젝트 기반',
    difficulty: '중',
    text: 'JWT를 사용한 이유와 단점은 무엇인가요?',
  },
  {
    id: 'q-006',
    source: 'Hamzzi Market API',
    sourceType: '프로젝트 기반',
    difficulty: '중',
    text: 'Redis를 어떤 문제 해결에 사용했나요?',
  },
  {
    id: 'q-007',
    source: '구현 경험',
    sourceType: '프로젝트 기반',
    difficulty: '중',
    text: '본인이 직접 구현한 API는 어디까지인가요?',
  },
  {
    id: 'q-008',
    source: 'JD 요구사항',
    sourceType: 'JD 기반',
    difficulty: '중',
    text: 'REST API 설계에서 가장 중요하게 보는 기준은 무엇인가요?',
  },
]

const defaultProjects = [
  {
    id: 1,
    name: 'Hamzzi Market API',
    description: '중고거래 상품 등록, 찜, 채팅, 거래 상태 관리를 제공하는 REST API 서버',
    techStacks: ['Java', 'Spring Boot', 'MySQL', 'JPA', 'Spring Security', 'Redis'],
    contribution: 80,
    role: '상품/거래 도메인 API 설계 및 구현',
    github: 'github.com/hamzzi/hamzzi-market-api',
    interviewUseCount: 2,
    updatedAt: '2026.06.08',
    savedAt: '2026.06.08',
    source: 'mock',
    questions: ['상품 거래 상태를 어떤 기준으로 나눴나요?', 'JPA 연관관계 설계에서 어려웠던 점은 무엇인가요?', 'Redis를 어디에 사용했고 왜 선택했나요?'],
  },
  {
    id: 2,
    name: 'Career Buddy Backend',
    description: '취업 준비 일정, 지원 기업, 면접 기록을 관리하는 백엔드 API 서비스',
    techStacks: ['Java', 'Spring Boot', 'MySQL', 'JPA', 'JWT', 'Docker'],
    contribution: 70,
    role: '회원 인증, JWT 로그인, 면접 기록 API 구현',
    github: 'github.com/hamzzi/career-buddy-backend',
    interviewUseCount: 1,
    updatedAt: '2026.06.05',
    savedAt: '2026.06.05',
    source: 'mock',
    questions: ['JWT 인증 흐름을 설명해보세요.', 'Access Token과 Refresh Token을 왜 분리했나요?', 'Docker로 배포 환경을 구성하면서 어려웠던 점은 무엇인가요?'],
  },
]

const interviews = [
  { date: '2026.06.08', type: '기술 면접', persona: '검증형', mode: '텍스트', score: 82, status: '완료' },
  { date: '2026.06.05', type: '종합 면접', persona: '실무형', mode: '텍스트', score: 74, status: '리포트 생성 완료' },
  { date: '2026.06.01', type: '인성 면접', persona: '코치형', mode: '음성 Beta', score: 66, status: '완료' },
]

const initialReports = [
  { id: 1, date: '2026.06.08', type: '기술 면접', score: 82, grade: 'B+', strength: '프로젝트 경험을 구체적으로 설명함', weakness: 'DB 인덱스와 트랜잭션 답변 보완 필요' },
  { id: 2, date: '2026.06.05', type: '종합 면접', score: 74, grade: 'B', strength: '비전공 전환 스토리가 자연스러움', weakness: '기술 선택 이유의 대안 비교 부족' },
  { id: 3, date: '2026.06.01', type: '인성 면접', score: 66, grade: 'C+', strength: '협업 경험을 차분히 전달함', weakness: '성과 수치와 본인 기여도 정리 필요' },
]

const apiNotes = {
  auth: ['POST /api/v1/auth/signup', 'POST /api/v1/auth/login', 'POST /api/v1/auth/refresh', 'POST /api/v1/auth/logout'],
  profile: ['GET /api/v1/users/me/profile', 'PATCH /api/v1/users/me/profile'],
  mypage: ['GET /api/v1/users/me', 'GET /api/v1/users/me/profile'],
  jd: ['POST /api/v1/jds', 'GET /api/v1/jds', 'GET /api/v1/jds/{jd_id}', 'DELETE /api/v1/jds/{jd_id}'],
  resume: ['POST /api/v1/resumes'],
  coverLetter: ['POST /api/v1/cover-letters'],
  project: ['POST /api/v1/projects'],
  analysis: ['POST /api/v1/jds/{jd_id}/analyze'],
  session: ['POST /api/v1/sessions'],
  questions: ['POST /api/v1/sessions/{session_id}/questions/generate'],
  answers: ['POST /api/v1/answers'],
  followup: ['POST /api/v1/answers/{answer_id}/followup'],
  report: ['GET /api/v1/sessions/{session_id}/report'],
  admin: ['GET /api/v1/admin/members', 'GET /api/v1/admin/audit-logs'],
  account: ['PATCH /api/v1/users/me/profile', 'DELETE /api/v1/auth/withdraw'],
}

const defaultDemoState = {
  auth: {
    loggedIn: false,
    email: '',
    accessToken: '',
    refreshToken: '',
    source: 'mock',
    lastLogin: '',
  },
  data: {
    jd: {
      id: 'jd-mock-001',
      company: '주니어 백엔드 개발자 채용 기업',
      role: '주니어 백엔드 개발자',
      tech: 'Java, Spring Boot, MySQL, JPA, REST API',
      raw: 'Spring Boot 기반 REST API 개발, MySQL/JPA 활용 경험, 협업 역량을 요구합니다.',
      saved: true,
      savedAt: '2026.06.09',
      source: 'mock',
    },
    resume: {
      summary: '비전공에서 백엔드 개발자로 전환하며 Java/Spring 프로젝트를 수행했습니다.',
      education: hamzziUser.education,
      stacks: hamzziUser.techStacks.join(', '),
      saved: true,
      savedAt: '2026.06.09',
      source: 'mock',
    },
    coverLetter: {
      question: '비전공자로서 백엔드 개발자가 되고 싶은 이유를 설명해주세요.',
      answer: '문제를 구조화하고 사용자에게 안정적인 서비스를 제공하는 과정에 매력을 느껴 백엔드를 선택했습니다.',
      saved: true,
      savedAt: '2026.06.09',
      source: 'mock',
    },
    projects: defaultProjects,
  },
  analysis: {
    selectedQuestionIds: questionBank.slice(0, 5).map((q) => q.id),
    status: 'ready',
    source: 'mock',
    lastAnalyzedAt: '2026.06.09',
  },
  interview: {
    sessionId: '',
    sessionSource: '',
    settings: {
      type: '기술 면접',
      persona: '검증형',
      mode: '음성 Beta',
      count: '5문항',
    },
    questions: [],
    currentIndex: 0,
    answers: [],
    followUps: [],
    voiceStats: {
      ttsPlays: 0,
      sttRuns: 0,
      voiceAnswers: 0,
      textAnswers: 0,
      mockFallbacks: 0,
    },
  },
  report: null,
  admin: {
    fallbackCount: 0,
    auditLogs: [
      ['2026.06.09 09:10', '김햄찌', '로그인', 'mock token 저장'],
      ['2026.06.09 09:16', '김햄찌', 'JD 저장', '주니어 백엔드 개발자'],
      ['2026.06.09 09:24', 'system', '질문 생성', 'CS Deep Dive 5문항'],
    ],
  },
}

function safeNow() {
  return new Date().toISOString().slice(0, 16).replace('T', ' ')
}

function createSessionId() {
  return `sess-${Date.now().toString(36)}`
}

function getQuestionCount(countLabel) {
  return Number.parseInt(countLabel, 10) || 5
}

function loadDemoState() {
  if (typeof window === 'undefined') return defaultDemoState
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultDemoState
    return mergeDemoState(defaultDemoState, JSON.parse(raw))
  } catch {
    return defaultDemoState
  }
}

function mergeDemoState(base, saved) {
  return {
    ...base,
    ...saved,
    auth: { ...base.auth, ...saved?.auth },
    data: {
      ...base.data,
      ...saved?.data,
      jd: { ...base.data.jd, ...saved?.data?.jd },
      resume: { ...base.data.resume, ...saved?.data?.resume },
      coverLetter: { ...base.data.coverLetter, ...saved?.data?.coverLetter },
      projects: saved?.data?.projects || base.data.projects,
    },
    analysis: { ...base.analysis, ...saved?.analysis },
    interview: {
      ...base.interview,
      ...saved?.interview,
      settings: { ...base.interview.settings, ...saved?.interview?.settings },
      voiceStats: { ...base.interview.voiceStats, ...saved?.interview?.voiceStats },
    },
    admin: {
      ...base.admin,
      ...saved?.admin,
      auditLogs: saved?.admin?.auditLogs || base.admin.auditLogs,
    },
  }
}

function persistDemoState(nextState) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState))
}

function useDemoState() {
  const [state, setState] = useState(loadDemoState)

  function updateState(updater) {
    setState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : mergeDemoState(prev, updater)
      persistDemoState(next)
      return next
    })
  }

  return [state, updateState]
}

async function requestWithMockFallback(endpoint, payload) {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload || {}),
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json().catch(() => ({}))
    return { ok: true, source: 'api', data }
  } catch (error) {
    return { ok: false, source: 'mock', error }
  }
}

function addAudit(prev, action, target) {
  return {
    ...prev,
    admin: {
      ...prev.admin,
      fallbackCount: prev.admin.fallbackCount + (target.includes('mock') || target.includes('fallback') ? 1 : 0),
      auditLogs: [[safeNow(), hamzziUser.name, action, target], ...prev.admin.auditLogs].slice(0, 12),
    },
  }
}

function generateQuestionsFromState(state) {
  const selected = state.analysis.selectedQuestionIds.length
    ? questionBank.filter((question) => state.analysis.selectedQuestionIds.includes(question.id))
    : questionBank
  return selected.slice(0, getQuestionCount(state.interview.settings.count))
}

function createReportFromState(state) {
  const answers = state.interview.answers
  const followUps = state.interview.followUps
  return {
    generatedAt: safeNow(),
    score: 82,
    grade: 'B+',
    answers,
    followUps,
    summary: `이번 면접에서는 음성 답변 ${state.interview.voiceStats.voiceAnswers}회, 텍스트 답변 ${state.interview.voiceStats.textAnswers}회가 저장되었습니다. 꼬리질문은 총 ${followUps.length}개 생성되었습니다.`,
    strengths: ['전향 동기가 명확함', '프로젝트 경험을 구체적으로 설명함', '협업 경험 전달이 안정적임'],
    weaknesses: ['CS 용어 정의 보완 필요', 'DB 인덱스와 트랜잭션 설명 깊이 보완', '기술 선택 이유의 대안 비교 필요'],
    roadmap: ['JVM 메모리 구조 1분 답변 정리', '인덱스와 트랜잭션 격리 수준 Deep Dive', 'JWT/Redis 선택 이유와 단점 비교 연습'],
  }
}

function useTimedToast() {
  const [toast, setToast] = useState('')
  function showToast(message) {
    setToast(message)
    window.setTimeout(() => setToast(''), 2400)
  }
  return [toast, showToast]
}

function Logo({ dark = false }) {
  return <Link to="/" className={`cz-logo ${dark ? 'dark' : ''}`}><span>CZ</span> Career.zip</Link>
}

function Shell({ children, toast, admin = false }) {
  const [state, updateState] = useDemoState()
  const navigate = useNavigate()
  const links = admin
    ? [['Admin', '/admin'], ['회원 관리', '/admin/members'], ['프롬프트', '/admin/prompts'], ['버전', '/admin/versions'], ['감사 로그', '/admin/audit-logs']]
    : [['Dashboard', '/dashboard'], ['Data Input', '/data'], ['Analysis', '/analysis/source'], ['Interview', '/interview/setup'], ['Report', '/report'], ['MyPage', '/mypage'], ['Admin', '/admin']]

  async function logout() {
    await requestWithMockFallback('/api/v1/auth/logout', { refreshToken: state.auth.refreshToken })
    updateState((prev) => addAudit({ ...prev, auth: { ...prev.auth, loggedIn: false, accessToken: '', refreshToken: '' } }, '로그아웃', 'API 우선 호출 / mock fallback'))
    navigate('/')
  }

  return (
    <div className={`cz-shell ${admin ? 'cz-admin-shell' : ''}`}>
      <header className="cz-topbar">
        <Logo dark={admin} />
        <nav>{links.map(([label, to]) => <NavLink key={to} to={to}>{label}</NavLink>)}</nav>
        <div className="cz-session-chip">
          <Badge>{state.auth.loggedIn ? '로그인 상태' : '비로그인 데모'}</Badge>
          {state.auth.loggedIn && <button onClick={logout}>로그아웃</button>}
        </div>
        <Link className="cz-profile-chip" to="/mypage/profile"><span className="cz-avatar">김</span>{hamzziUser.name}</Link>
      </header>
      {toast && <Toast>{toast}</Toast>}
      {children}
    </div>
  )
}

function Button({ children, to, variant = 'primary', type = 'button', onClick, disabled }) {
  const className = `cz-btn cz-btn-${variant}`
  if (to && !disabled) return <Link to={to} className={className} onClick={onClick}>{children}</Link>
  return <button type={type} className={className} onClick={onClick} disabled={disabled}>{children}</button>
}

function Badge({ children, tone = 'green' }) {
  return <span className={`cz-badge cz-badge-${tone}`}>{children}</span>
}

function Toast({ children }) {
  return <div className="cz-toast"><CheckCircle2 size={16} />{children}</div>
}

function ApiNote({ endpoints }) {
  return (
    <aside className="cz-api-card">
      <h3>API Note</h3>
      <p>연동 상태: API 우선 호출 / 실패 시 mock fallback</p>
      <div>{endpoints.map((endpoint) => <code key={endpoint}>{endpoint}</code>)}</div>
    </aside>
  )
}

function IntegrationStatus({ children = '백엔드 API 연동 가능 시 실제 요청, 실패 시 mock fallback' }) {
  return <div className="cz-status-strip"><Sparkles size={16} /><strong>현재 MVP 연동 상태</strong><span>{children}</span></div>
}

function SectionHead({ eyebrow, title, desc, action }) {
  return (
    <div className="cz-section-head">
      <div>{eyebrow && <span>{eyebrow}</span>}<h1>{title}</h1>{desc && <p>{desc}</p>}</div>
      {action}
    </div>
  )
}

function Info({ label, value }) {
  return <div className="cz-info"><span>{label}</span><strong>{value}</strong></div>
}

function Metric({ label, value, suffix = '점' }) {
  return <div className="cz-metric"><span>{label}</span><b>{value}{suffix}</b><i><em style={{ width: `${value}%` }} /></i></div>
}

function Filter({ items, active, setActive }) {
  return <div className="cz-filter">{items.map((item) => <button className={active === item ? 'active' : ''} key={item} onClick={() => setActive(item)}>{item}</button>)}</div>
}

function Stepper({ steps, current }) {
  return <div className="cz-stepper">{steps.map((step, index) => <span className={index <= current ? 'active' : ''} key={step}>{index + 1}. {step}</span>)}</div>
}

function ScoreTrend() {
  return <article className="cz-panel"><h2>성장 추이</h2><div className="cz-bars">{scoreTrend.map((score) => <div key={score}><i style={{ height: `${score}%` }} /><span>{score}점</span></div>)}</div></article>
}

function TagPanel({ title, items, tone }) {
  return <article className="cz-panel"><h2>{title}</h2><div className="cz-tags">{items.map((item) => <Badge key={item} tone={tone}>{item}</Badge>)}</div></article>
}

function EmptyState({ title, desc, action }) {
  return <article className="cz-empty"><FileText size={28} /><h3>{title}</h3><p>{desc}</p>{action}</article>
}

function Modal({ title, children, onClose }) {
  return <div className="cz-modal-backdrop"><div className="cz-modal"><button className="cz-modal-close" onClick={onClose} aria-label="닫기"><X size={20} /></button><h2>{title}</h2>{children}</div></div>
}

function TTSControls({ text, onPlayed }) {
  const utteranceRef = useRef(null)
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance !== 'undefined'
  const [status, setStatus] = useState(supported ? '질문 듣기를 누르면 AI 면접관이 질문을 읽습니다.' : 'TTS가 지원되지 않는 브라우저입니다.')

  useEffect(() => {
    return () => {
      if (supported) window.speechSynthesis.cancel()
    }
  }, [supported, text])

  function playQuestion() {
    if (!supported) {
      setStatus('TTS가 지원되지 않는 브라우저입니다.')
      return
    }
    window.speechSynthesis.cancel()
    const utterance = new window.SpeechSynthesisUtterance(text)
    utterance.lang = 'ko-KR'
    utterance.rate = 0.92
    utterance.onstart = () => setStatus('AI 면접관이 질문을 읽고 있습니다.')
    utterance.onend = () => setStatus('질문 읽기가 완료되었습니다.')
    utterance.onerror = () => setStatus('TTS 재생에 실패해 텍스트 질문으로 진행합니다.')
    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
    onPlayed?.()
  }

  function pauseQuestion() {
    if (supported) {
      window.speechSynthesis.pause()
      setStatus('질문 읽기가 일시정지되었습니다.')
    }
  }

  return (
    <div className="cz-voice-tools">
      <div><strong>TTS 질문 읽기</strong><p>{status}</p></div>
      <div className="cz-actions">
        <Button variant="secondary" onClick={playQuestion}><Play size={16} />질문 듣기</Button>
        <Button variant="ghost" onClick={pauseQuestion}><Pause size={16} />일시정지</Button>
        <Button variant="ghost" onClick={playQuestion}><RotateCcw size={16} />다시 듣기</Button>
      </div>
      <small>TTS/STT는 브라우저 Web Speech API 기반 MVP 기능입니다.</small>
    </div>
  )
}

function STTAnswerBox({ value, onChange, onSttResult }) {
  const recognitionRef = useRef(null)
  const SpeechRecognition = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null
  const supported = Boolean(SpeechRecognition)
  const [listening, setListening] = useState(false)
  const [status, setStatus] = useState(supported ? '음성 답변 시작 버튼으로 STT를 사용할 수 있습니다.' : '이 브라우저에서는 STT를 지원하지 않아 예시 입력으로 대체합니다.')

  function startRecognition() {
    if (!supported) {
      setStatus('이 브라우저에서는 STT를 지원하지 않아 예시 입력으로 대체합니다.')
      return
    }
    try {
      const recognition = new SpeechRecognition()
      recognition.lang = 'ko-KR'
      recognition.interimResults = true
      recognition.continuous = false
      recognition.onstart = () => {
        setListening(true)
        setStatus('음성을 인식하고 있습니다.')
      }
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results).map((result) => result[0].transcript).join(' ')
        onChange(transcript)
        setStatus('음성 인식 결과가 답변창에 반영되었습니다.')
        onSttResult?.('browser')
      }
      recognition.onerror = () => {
        setListening(false)
        setStatus('음성 인식에 실패했습니다. 텍스트 입력 또는 예시 입력으로 계속 진행할 수 있습니다.')
      }
      recognition.onend = () => setListening(false)
      recognitionRef.current = recognition
      recognition.start()
    } catch {
      setListening(false)
      setStatus('브라우저 권한 또는 STT 시작에 실패했습니다. 예시 입력으로 대체할 수 있습니다.')
    }
  }

  function stopRecognition() {
    recognitionRef.current?.stop()
    setListening(false)
    setStatus('녹음이 중지되었습니다.')
  }

  function fillMockStt() {
    const mockText = '비전공자로 시작했지만 부트캠프 프로젝트에서 REST API와 데이터베이스 설계를 직접 맡으며 백엔드 개발의 책임감과 재미를 느꼈습니다.'
    onChange(mockText)
    setStatus('STT 예시 답변이 답변창에 반영되었습니다.')
    onSttResult?.('mock')
  }

  return (
    <div className="cz-answer-box">
      <label>답변 입력<textarea value={value} onChange={(event) => onChange(event.target.value)} rows={7} /></label>
      <div className={`cz-mic-check ${listening ? 'active' : ''}`}>
        <Mic size={24} />
        <div><strong>{listening ? '음성 인식 중' : 'STT 답변 입력'}</strong><p>{status}</p></div>
        {listening && <div className="cz-wave"><span /><span /><span /><span /></div>}
      </div>
      <div className="cz-actions">
        <Button variant="secondary" onClick={startRecognition}>음성 답변 시작</Button>
        <Button variant="ghost" onClick={stopRecognition}>녹음 중지</Button>
        <Button variant="ghost" onClick={fillMockStt}>STT 예시 입력</Button>
      </div>
    </div>
  )
}

function Landing() {
  return (
    <div className="cz-landing">
      <header className="cz-landing-nav">
        <Logo dark />
        <nav>
          <a href="#service">서비스 소개</a><a href="#features">기능</a><a href="#pricing">요금제</a><Link to="/report">리포트</Link><Link to="/login">로그인</Link>
        </nav>
      </header>
      <main className="cz-landing-inner">
        <section className="cz-hero-copy">
          <Badge>비전공 신입도, 기술 면접 앞에서 흔들리지 않도록</Badge>
          <h1>AI와 함께, 실전 같은<br />면접 연습으로 <em>한 단계 성장</em></h1>
          <p>이력서·자소서·JD 기반 맞춤 질문부터<br />답변 피드백, 꼬리질문, 약점 보완까지 한 번에!</p>
          <strong>텍스트 면접과 음성 Beta 면접 모두 지원합니다.</strong>
          <div className="cz-actions"><Button to="/login">면접 시작하기</Button><Button to="/signup" variant="outline">서비스 둘러보기</Button></div>
        </section>
        <section className="cz-robot-stage" aria-label="AI 면접 코치">
          <div className="cz-orbit one" /><div className="cz-orbit two" />
          <div className="cz-robot"><span /><div className="face"><i /><i /><b /></div><div className="body"><em /><em /></div></div>
          <div className="cz-float-card left">AI 피드백<small>약점 키워드 분석</small></div>
          <div className="cz-float-card bottom">TTS/STT Beta<small>질문 읽기 · 음성 답변</small></div>
          <div className="cz-float-card right">약점 보완 추천<small>CS · DB · 아키텍처</small></div>
        </section>
      </main>
      <section id="features" className="cz-landing-features">
        {['실전 음성 면접', 'AI 피드백', '꼬리질문 연습', '약점 보완 추천'].map((item) => <article key={item}><span /><h2>{item}</h2><p>{item === '실전 음성 면접' ? 'Web Speech API 기반 TTS/STT Beta' : item === 'AI 피드백' ? '답변을 분석해 즉시 피드백' : item === '꼬리질문 연습' ? '답변 기반 심화 질문 대응' : 'CS·DB·아키텍처 보완 가이드'}</p></article>)}
      </section>
    </div>
  )
}

function AuthPage() {
  const navigate = useNavigate()
  const [state, updateState] = useDemoState()
  const [toast, showToast] = useTimedToast()
  const [email, setEmail] = useState(hamzziUser.email)
  const [password, setPassword] = useState('')
  const [keepLogin, setKeepLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [resetOpen, setResetOpen] = useState(false)

  async function login() {
    if (!email.trim() || !password.trim()) {
      setError('이메일 또는 비밀번호를 확인해주세요.')
      return
    }
    const result = await requestWithMockFallback('/api/v1/auth/login', { email, password, keepLogin })
    updateState((prev) => addAudit({
      ...prev,
      auth: {
        loggedIn: true,
        email,
        accessToken: result.data?.access_token || `mock-access-${Date.now()}`,
        refreshToken: result.data?.refresh_token || `mock-refresh-${Date.now()}`,
        source: result.source,
        lastLogin: safeNow(),
      },
    }, '로그인', result.source === 'api' ? 'API 로그인 성공' : '백엔드 연결 실패로 mock token 저장'))
    setError('')
    if (result.source === 'mock') showToast('백엔드 연결 실패로 mock 로그인되었습니다.')
    navigate('/dashboard')
  }

  return (
    <Shell toast={toast}>
      <main className="cz-auth-layout">
        <aside className="cz-auth-side">
          <Logo dark />
          <h1>AI 모의면접으로 합격에 한 걸음 더</h1>
          <p>JD·이력서·자소서·프로젝트를 분석해 맞춤 면접 질문과 리포트를 제공합니다.</p>
          <ol><li>자료 입력</li><li>AI 분석</li><li>모의면접</li><li>리포트</li></ol>
        </aside>
        <section className="cz-auth-card">
          {error && <p className="cz-error"><AlertCircle size={16} />{error}</p>}
          <h1>로그인</h1>
          <p>Career.zip 계정으로 로그인하세요.</p>
          <IntegrationStatus />
          <label>이메일<input value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <label>비밀번호<div className="cz-input-button"><input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="비밀번호 입력" /><button onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>
          <div className="cz-row plain"><label className="cz-inline-check"><input type="checkbox" checked={keepLogin} onChange={(event) => setKeepLogin(event.target.checked)} />로그인 상태 유지</label><button className="cz-link-button" onClick={() => setResetOpen(true)}>비밀번호 찾기</button></div>
          <Button onClick={login}>로그인</Button>
          <div className="cz-socials"><button onClick={() => showToast('카카오 로그인은 mock입니다.')}>카카오</button><button onClick={() => showToast('네이버 로그인은 mock입니다.')}>네이버</button><button onClick={() => showToast('Google 로그인은 mock입니다.')}>Google</button></div>
          <p className="cz-center-text">계정이 없으신가요? <Link to="/signup">회원가입</Link></p>
          <Info label="현재 로그인 상태" value={state.auth.loggedIn ? `${state.auth.email} · ${state.auth.source}` : '아직 로그인 전'} />
          <ApiNote endpoints={apiNotes.auth} />
        </section>
      </main>
      {resetOpen && <Modal title="비밀번호 찾기" onClose={() => setResetOpen(false)}><p>{email} 주소로 비밀번호 재설정 메일을 발송합니다.</p><Button onClick={() => { setResetOpen(false); showToast('비밀번호 재설정 메일을 발송했습니다.') }}>재설정 메일 보내기</Button></Modal>}
    </Shell>
  )
}

function SignupPage() {
  const [state, updateState] = useDemoState()
  const [toast, showToast] = useTimedToast()
  const [step, setStep] = useState(0)
  const [error, setError] = useState('')
  const [terms, setTerms] = useState({ required: false, privacy: false, marketing: false })
  const steps = ['계정 정보', '약관 동의', '이메일 인증', '가입 완료']

  async function nextSignupStep() {
    if (step === 1 && (!terms.required || !terms.privacy)) {
      setError('필수 약관에 동의해주세요.')
      return
    }
    if (step === 2) {
      const result = await requestWithMockFallback('/api/v1/auth/signup', { email: hamzziUser.email, name: hamzziUser.name })
      updateState((prev) => addAudit(prev, '회원가입', result.source === 'api' ? 'API 가입 완료' : 'mock 가입 완료'))
      if (result.source === 'mock') showToast('백엔드 연결 실패로 mock 가입 완료 처리되었습니다.')
    }
    setError('')
    setStep(Math.min(step + 1, steps.length - 1))
  }

  return (
    <Shell toast={toast}>
      <main className="cz-page narrow">
        <SectionHead eyebrow="Signup" title="회원가입" desc="회원가입 완료 후 온보딩으로 이동합니다." />
        <article className="cz-panel">
          <Stepper steps={steps} current={step} />
          {error && <p className="cz-error"><AlertCircle size={16} />{error}</p>}
          {step === 0 && <div className="cz-form-grid"><label>이름<input defaultValue={hamzziUser.name} /></label><label>이메일<input defaultValue={hamzziUser.email} /></label><label>비밀번호<input type="password" defaultValue="careerzip1" /></label><label>비밀번호 확인<input type="password" defaultValue="careerzip1" /></label></div>}
          {step === 1 && <div className="cz-check-list"><label><input type="checkbox" checked={terms.required && terms.privacy && terms.marketing} onChange={(event) => setTerms({ required: event.target.checked, privacy: event.target.checked, marketing: event.target.checked })} />전체 동의</label><label><input type="checkbox" checked={terms.required} onChange={(event) => setTerms({ ...terms, required: event.target.checked })} />필수 이용약관 동의</label><label><input type="checkbox" checked={terms.privacy} onChange={(event) => setTerms({ ...terms, privacy: event.target.checked })} />필수 개인정보 처리방침 동의</label><label><input type="checkbox" checked={terms.marketing} onChange={(event) => setTerms({ ...terms, marketing: event.target.checked })} />선택 마케팅 수신 동의</label></div>}
          {step === 2 && <div className="cz-form-grid"><label>인증 코드<input placeholder="123456" /></label><div className="cz-actions align-end"><Button variant="secondary" onClick={() => showToast('인증 코드가 재전송되었습니다.')}>재전송</Button></div></div>}
          {step === 3 && <EmptyState title="가입이 완료되었습니다" desc={`저장 상태: ${state.auth.source || 'mock'} · 온보딩에서 면접 목표와 기술스택을 설정해보세요.`} action={<Button to="/onboarding">온보딩 시작하기</Button>} />}
          {step < 3 && <div className="cz-actions"><Button onClick={nextSignupStep}>다음</Button><Button to="/login" variant="secondary">로그인으로 이동</Button></div>}
          <ApiNote endpoints={apiNotes.auth} />
        </article>
      </main>
    </Shell>
  )
}

function OnboardingPage() {
  const [, updateState] = useDemoState()
  const [toast, showToast] = useTimedToast()
  const [step, setStep] = useState(0)
  const steps = ['사용자 유형', '기본 프로필', '외부 링크', '면접 목표', '입력 요약']

  function completeOnboarding() {
    updateState((prev) => addAudit(prev, '온보딩 저장', '프로필 mock 저장 완료'))
    showToast('온보딩 저장이 완료되었습니다.')
  }

  return (
    <Shell toast={toast}>
      <main className="cz-page">
        <SectionHead eyebrow="Onboarding" title="김햄찌님의 면접 준비 프로필을 완성하세요" desc="비전공 신입 백엔드 개발자 기준으로 맞춤 질문을 생성합니다." />
        <article className="cz-panel">
          <Stepper steps={steps} current={step} />
          {step === 0 && <ChoiceGrid selected="비전공 신입" items={['비전공 신입', '전공 신입', '경력 전환', '현직자 이직']} />}
          {step === 1 && <div className="cz-form-grid"><label>희망 직무<input defaultValue={hamzziUser.targetRole} /></label><label>교육 이력<input defaultValue={hamzziUser.education} /></label><label className="wide">기술스택<input defaultValue={hamzziUser.techStacks.join(', ')} /></label></div>}
          {step === 2 && <div className="cz-form-grid"><label>GitHub<input defaultValue={hamzziUser.github} /></label><label>Blog<input defaultValue={hamzziUser.blog} /></label><label>Notion<input defaultValue={hamzziUser.notion} /></label><label>Portfolio<input defaultValue={hamzziUser.portfolio} /></label></div>}
          {step === 3 && <div className="cz-form-grid"><label>면접 목표<input defaultValue={hamzziUser.interviewGoal} /></label><label>가장 걱정되는 부분<input defaultValue={hamzziUser.mainConcern} /></label></div>}
          {step === 4 && <div className="cz-summary-grid"><Info label="유형" value="비전공 신입" /><Info label="직무" value={hamzziUser.targetRole} /><Info label="기술스택" value={hamzziUser.techStacks.join(', ')} /><Info label="목표" value={hamzziUser.interviewGoal} /></div>}
          <div className="cz-actions"><Button variant="secondary" disabled={step === 0} onClick={() => setStep(step - 1)}>이전</Button>{step < 4 ? <Button onClick={() => setStep(step + 1)}>다음</Button> : <Button to="/dashboard" onClick={completeOnboarding}>시작하기</Button>}<Button to="/dashboard" variant="ghost">나중에 입력하기</Button></div>
          <ApiNote endpoints={apiNotes.profile} />
        </article>
      </main>
    </Shell>
  )
}

function ChoiceGrid({ items, selected }) {
  const [active, setActive] = useState(selected)
  return <div className="cz-grid-4">{items.map((item) => <button className={`cz-choice ${active === item ? 'active' : ''}`} key={item} onClick={() => setActive(item)}>{item}</button>)}</div>
}

function DashboardPage() {
  const [state] = useDemoState()
  const kpis = [['누적 면접', `${hamzziStats.totalInterviews}회`], ['평균 점수', `${hamzziStats.averageScore}점`], ['최근 분석', `${hamzziStats.latestAnalysisScore}점`], ['TTS/STT Beta', `${state.interview.voiceStats.ttsPlays}/${state.interview.voiceStats.sttRuns}`]]
  return (
    <Shell>
      <main className="cz-page">
        <SectionHead eyebrow="Dashboard" title={`${hamzziUser.name}님, 오늘은 CS 기초를 보완할 차례예요`} desc="자료 입력부터 리포트까지 전체 준비 흐름을 한 번에 확인합니다." action={<Button to="/data">자료 입력 시작</Button>} />
        <IntegrationStatus />
        <div className="cz-grid-4">{kpis.map(([label, value]) => <article className="cz-stat" key={label}><Gauge size={20} /><span>{label}</span><strong>{value}</strong></article>)}</div>
        <div className="cz-grid-2">
          <article className="cz-panel"><h2>면접 준비 단계</h2><Stepper steps={['자료 입력', 'AI 분석', '면접 연습', '리포트 확인']} current={state.report ? 3 : state.interview.answers.length ? 2 : 1} /><Button to="/data" variant="secondary">다음 단계 진행</Button></article>
          <article className="cz-panel"><h2>최근 분석 결과</h2><Metric label="최근 분석 점수" value={82} /><Metric label="CS 준비도" value={58} /><Button to="/analysis/result" variant="secondary">분석 결과 보기</Button></article>
          <article className="cz-panel"><h2>최근 면접 기록</h2>{interviews.slice(0, 2).map((item) => <div className="cz-row" key={item.date}><span>{item.date}</span><strong>{item.type}</strong><Badge>{item.score}점</Badge></div>)}</article>
          <article className="cz-panel"><h2>저장된 MVP 상태</h2><div className="cz-summary-grid"><Info label="JD" value={state.data.jd.saved ? `${state.data.jd.role} 저장됨` : '미저장'} /><Info label="세션" value={state.interview.sessionId || '아직 없음'} /><Info label="질문" value={`${state.interview.questions.length}개`} /><Info label="답변" value={`${state.interview.answers.length}개`} /></div></article>
        </div>
        <ApiNote endpoints={apiNotes.mypage} />
      </main>
    </Shell>
  )
}

function DataInputPage({ kind = 'hub' }) {
  const [state, updateState] = useDemoState()
  const [toast, showToast] = useTimedToast()
  const pageMap = {
    hub: <DataHub state={state} />,
    jd: <DataForm kind="jd" title="JD 입력" next="/data/resume" api={apiNotes.jd} showToast={showToast} state={state} updateState={updateState} fields={[['company', '회사명', state.data.jd.company], ['role', '직무명', state.data.jd.role], ['tech', '주요 기술', state.data.jd.tech], ['raw', 'JD 원문', state.data.jd.raw]]} />,
    resume: <DataForm kind="resume" title="이력서 입력" next="/data/cover-letter" api={apiNotes.resume} showToast={showToast} state={state} updateState={updateState} fields={[['education', '교육 이력', state.data.resume.education], ['stacks', '기술스택', state.data.resume.stacks], ['summary', '이력서 요약', state.data.resume.summary]]} />,
    cover: <DataForm kind="coverLetter" title="자기소개서 입력" next="/data/projects" api={apiNotes.coverLetter} showToast={showToast} state={state} updateState={updateState} fields={[['question', '자소서 문항', state.data.coverLetter.question], ['answer', '답변 입력', state.data.coverLetter.answer]]} />,
    projects: <ProjectDataForm state={state} updateState={updateState} showToast={showToast} />,
    complete: <DataComplete state={state} />,
  }
  return <Shell toast={toast}><main className="cz-page">{pageMap[kind]}</main></Shell>
}

function DataHub({ state }) {
  const cards = [['JD', '/data/jd', state.data.jd.saved ? `${state.data.jd.role} 저장됨` : '채용 공고와 핵심 기술을 입력합니다.'], ['이력서', '/data/resume', state.data.resume.saved ? '이력서 저장됨' : '교육 이력과 기술스택을 정리합니다.'], ['자기소개서', '/data/cover-letter', state.data.coverLetter.saved ? '자소서 저장됨' : '전환 스토리와 지원 동기를 입력합니다.'], ['프로젝트', '/data/projects', `${state.data.projects.length}개 프로젝트 저장됨`]]
  return <><SectionHead eyebrow="Data Input" title="분석에 사용할 자료를 입력하세요" desc="저장한 자료는 AI 분석 자료 선택 화면에 그대로 연결됩니다." action={<Button to="/analysis/source">AI 분석으로 이동</Button>} /><IntegrationStatus /><div className="cz-grid-4">{cards.map(([title, to, desc]) => <Link className="cz-card" to={to} key={title}><FileText size={24} /><h2>{title}</h2><p>{desc}</p><Badge>저장 상태 반영</Badge></Link>)}</div><article className="cz-panel cz-ready-panel"><h2>AI 분석 준비 상태</h2><Metric label="자료 완성도" value={86} suffix="%" /><Button to="/analysis/source">AI 분석으로 이동</Button></article><ApiNote endpoints={[...apiNotes.jd, ...apiNotes.resume, ...apiNotes.coverLetter, ...apiNotes.project]} /></>
}

function DataForm({ kind, title, fields, next, api, showToast, state, updateState }) {
  const [form, setForm] = useState(() => Object.fromEntries(fields.map(([key, , value]) => [key, value])))

  async function saveData() {
    const endpointMap = { jd: '/api/v1/jds', resume: '/api/v1/resumes', coverLetter: '/api/v1/cover-letters' }
    const result = await requestWithMockFallback(endpointMap[kind], form)
    updateState((prev) => {
      const nextData = { ...prev.data }
      if (kind === 'jd') {
        nextData.jd = { ...nextData.jd, ...form, id: result.data?.jd_id || nextData.jd.id || 'jd-mock-001', saved: true, savedAt: safeNow(), source: result.source }
      } else {
        nextData[kind] = { ...nextData[kind], ...form, saved: true, savedAt: safeNow(), source: result.source }
      }
      return addAudit({ ...prev, data: nextData }, `${title} 저장`, result.source === 'api' ? 'API 저장 성공' : '백엔드 연결 실패로 mock 저장')
    })
    showToast(result.source === 'api' ? `${title}이 저장되었습니다.` : '백엔드 연결 실패로 mock 저장되었습니다.')
  }

  return <><SectionHead eyebrow="Data Input" title={title} desc="저장 후 다음 단계로 이동하면 저장 상태가 분석 화면에 반영됩니다." /><article className="cz-panel"><IntegrationStatus /><div className="cz-form-grid">{fields.map(([key, label]) => <label className={label.includes('원문') || label.includes('요약') || label.includes('답변') ? 'wide' : ''} key={key}>{label}<input value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} /></label>)}</div><div className="cz-actions"><Button onClick={saveData}>저장</Button><Button to={next} variant="secondary">다음</Button></div><Info label="현재 저장 상태" value={kind === 'jd' ? `${state.data.jd.savedAt} · ${state.data.jd.source}` : `${state.data[kind].savedAt} · ${state.data[kind].source}`} /><ApiNote endpoints={api} /></article></>
}

function ProjectDataForm({ state, updateState, showToast }) {
  async function saveProjects() {
    const result = await requestWithMockFallback('/api/v1/projects', { projects: state.data.projects })
    updateState((prev) => addAudit({
      ...prev,
      data: { ...prev.data, projects: prev.data.projects.map((project) => ({ ...project, savedAt: safeNow(), source: result.source })) },
    }, '프로젝트 저장', result.source === 'api' ? 'API 저장 성공' : '백엔드 연결 실패로 mock 저장'))
    showToast(result.source === 'api' ? '프로젝트가 저장되었습니다.' : '백엔드 연결 실패로 mock 저장되었습니다.')
  }
  return <><SectionHead eyebrow="Data Input" title="프로젝트 입력" desc="김햄찌님의 대표 프로젝트를 면접 질문 생성에 연결합니다." /><div className="cz-grid-2">{state.data.projects.map((project) => <article className="cz-panel" key={project.id}><h2>{project.name}</h2><p>{project.description}</p><div className="cz-tags">{project.techStacks.map((stack) => <Badge key={stack}>{stack}</Badge>)}</div><Metric label="기여도" value={project.contribution} suffix="%" /><Info label="GitHub" value={project.github} /><Info label="저장 상태" value={`${project.savedAt} · ${project.source}`} /></article>)}</div><div className="cz-actions page-actions"><Button onClick={saveProjects}>저장</Button><Button to="/data/complete" variant="secondary">다음</Button></div><ApiNote endpoints={apiNotes.project} /></>
}

function DataComplete({ state }) {
  const summary = [`JD: ${state.data.jd.role}`, `이력서: ${state.data.resume.savedAt} 저장`, `자기소개서: ${state.data.coverLetter.savedAt} 저장`, `프로젝트: ${state.data.projects.length}건`]
  return <><SectionHead eyebrow="Data Input Complete" title="자료 입력이 완료되었습니다" desc="저장한 자료가 AI 분석 자료 선택 화면에 연결됩니다." action={<Button to="/analysis/source">AI 분석 시작하기</Button>} /><div className="cz-grid-4">{summary.map((item) => <article className="cz-stat" key={item}><CheckCircle2 size={20} /><strong>{item}</strong><span>분석 준비 완료</span></article>)}</div><ApiNote endpoints={[...apiNotes.jd, ...apiNotes.resume, ...apiNotes.coverLetter, ...apiNotes.project]} /></>
}

function AnalysisPage({ kind = 'source' }) {
  const [toast, showToast] = useTimedToast()
  return <Shell toast={toast}><main className="cz-page">{kind === 'source' && <AnalysisSource showToast={showToast} />}{kind === 'result' && <AnalysisResult />}{kind === 'questions' && <AnalysisQuestions />}</main></Shell>
}

function AnalysisSource({ showToast }) {
  const [state, updateState] = useDemoState()
  const navigate = useNavigate()
  const [modal, setModal] = useState('')

  async function startAnalysis() {
    const result = await requestWithMockFallback(`/api/v1/jds/${state.data.jd.id}/analyze`, state.data)
    updateState((prev) => addAudit({ ...prev, analysis: { ...prev.analysis, status: 'completed', source: result.source, lastAnalyzedAt: safeNow() } }, 'AI 분석 시작', result.source === 'api' ? 'API 분석 요청 성공' : 'mock 분석 완료'))
    if (result.source === 'mock') showToast('백엔드 연결 실패로 mock 분석 결과를 표시합니다.')
    navigate('/analysis/result')
  }

  return <><SectionHead eyebrow="AI Analysis" title="분석 자료를 선택하세요" desc="저장된 JD, 이력서, 자소서, 프로젝트가 선택 자료로 표시됩니다." action={<Button onClick={startAnalysis}>AI 분석 시작</Button>} /><IntegrationStatus /><div className="cz-grid-2">{[`JD: ${state.data.jd.role}`, `이력서: ${state.data.resume.summary}`, `자소서: ${state.data.coverLetter.question}`, `프로젝트: ${state.data.projects.map((project) => project.name).join(', ')}`].map((item) => <article className="cz-panel selectable active" key={item}><CheckCircle2 size={20} /><h2>{item}</h2><p>선택됨 · 저장 상태 반영</p></article>)}</div><div className="cz-actions page-actions"><Button variant="secondary" onClick={() => setModal('JD')}>신규 JD 추가</Button><Button variant="secondary" onClick={() => setModal('이력서')}>이력서 추가</Button><Button variant="secondary" onClick={() => setModal('자소서')}>자소서 추가</Button></div><ApiNote endpoints={apiNotes.analysis} />{modal && <Modal title={`${modal} 추가`} onClose={() => setModal('')}><p>{modal} 추가 modal mock입니다.</p><Button onClick={() => { setModal(''); showToast(`${modal}가 추가되었습니다.`) }}>저장</Button></Modal>}</>
}

function AnalysisResult() {
  const [state] = useDemoState()
  const scores = [['JD 적합도', analysisResult.jdFit], ['기술스택 매칭률', analysisResult.techMatch], ['CS 기초 준비도', analysisResult.csReadiness], ['DB 이해도', analysisResult.dbUnderstanding], ['아키텍처 설명력', analysisResult.architectureExplanation], ['전향 스토리 완성도', analysisResult.transitionStory]]
  return <><SectionHead eyebrow="AI Analysis" title="김햄찌 분석 결과" desc={`분석 상태: ${state.analysis.status} · ${state.analysis.source} · ${state.analysis.lastAnalyzedAt}`} action={<Button to="/analysis/questions">질문 선택</Button>} /><div className="cz-grid-3">{scores.map(([label, value]) => <article className="cz-stat" key={label}><BarChart3 size={20} /><span>{label}</span><strong>{value}점</strong></article>)}</div><div className="cz-grid-2"><TagPanel title="강점" items={analysisResult.strengths} tone="strength" /><TagPanel title="약점" items={analysisResult.weaknesses} tone="weakness" /><article className="cz-panel wide-panel"><h2>예상 질문</h2><ol className="cz-list">{questionBank.map((question) => <li key={question.id}>{question.text}</li>)}</ol></article></div><ApiNote endpoints={[...apiNotes.analysis, ...apiNotes.questions]} /></>
}

function AnalysisQuestions() {
  const [state, updateState] = useDemoState()
  const selectedIds = state.analysis.selectedQuestionIds
  function toggle(questionId) {
    updateState((prev) => {
      const exists = prev.analysis.selectedQuestionIds.includes(questionId)
      return { ...prev, analysis: { ...prev.analysis, selectedQuestionIds: exists ? prev.analysis.selectedQuestionIds.filter((id) => id !== questionId) : [...prev.analysis.selectedQuestionIds, questionId] } }
    })
  }
  return <><SectionHead eyebrow="Question Select" title="면접에 사용할 질문을 선택하세요" desc="선택한 질문은 세션 생성 후 질문 목록으로 사용됩니다." action={<Button to="/interview/setup">면접 설정으로 이동</Button>} /><article className="cz-panel"><div className="cz-check-list">{questionBank.map((question) => <label key={question.id}><input type="checkbox" checked={selectedIds.includes(question.id)} onChange={() => toggle(question.id)} />{question.text}</label>)}</div></article><ApiNote endpoints={apiNotes.questions} /></>
}

function InterviewPage({ kind = 'setup' }) {
  const [toast, showToast] = useTimedToast()
  const pages = {
    setup: <InterviewSetup showToast={showToast} />,
    mic: <MicCheck showToast={showToast} />,
    start: <InterviewStart />,
    question: <InterviewQuestion showToast={showToast} />,
    answering: <InterviewAnswering showToast={showToast} />,
    last: <InterviewLast showToast={showToast} />,
    generating: <ReportGenerating showToast={showToast} />,
  }
  return <Shell toast={toast}><main className="cz-page">{pages[kind]}</main></Shell>
}

function InterviewSetup({ showToast }) {
  const [state, updateState] = useDemoState()
  const navigate = useNavigate()
  const [settings, setSettings] = useState(state.interview.settings)

  function setOption(key, value) {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  async function createSession() {
    const result = await requestWithMockFallback('/api/v1/sessions', { settings, data: state.data })
    const sessionId = result.data?.session_id || createSessionId()
    updateState((prev) => addAudit({ ...prev, interview: { ...prev.interview, sessionId, sessionSource: result.source, settings } }, '세션 생성', result.source === 'api' ? sessionId : `${sessionId} · mock fallback`))
    showToast(result.source === 'api' ? `세션이 생성되었습니다. ${sessionId}` : `백엔드 연결 실패로 mock 세션이 생성되었습니다. ${sessionId}`)
  }

  async function generateQuestions() {
    const result = await requestWithMockFallback(`/api/v1/sessions/${state.interview.sessionId || 'mock'}/questions/generate`, { settings, selectedQuestionIds: state.analysis.selectedQuestionIds })
    updateState((prev) => {
      const next = { ...prev, interview: { ...prev.interview, settings, questions: generateQuestionsFromState({ ...prev, interview: { ...prev.interview, settings } }), currentIndex: 0 } }
      return addAudit(next, '질문 생성', result.source === 'api' ? 'API 질문 생성 성공' : 'mock 질문 목록 생성')
    })
    showToast(result.source === 'api' ? '질문 목록이 생성되었습니다.' : '백엔드 연결 실패로 mock 질문 목록이 생성되었습니다.')
  }

  function startInterview() {
    updateState((prev) => ({ ...prev, interview: { ...prev.interview, settings, currentIndex: 0, questions: prev.interview.questions.length ? prev.interview.questions : generateQuestionsFromState({ ...prev, interview: { ...prev.interview, settings } }) } }))
    navigate('/interview/question')
  }

  return <><SectionHead eyebrow="Interview Setup" title="면접을 설정하세요" desc="세션 생성, 질문 생성, 면접 시작이 실제 상태로 이어집니다." /><IntegrationStatus>텍스트 면접과 음성 Beta 면접 모두 지원합니다.</IntegrationStatus><article className="cz-panel"><div className="cz-summary-grid"><Info label="사용할 JD" value={state.data.jd.role} /><Info label="사용할 이력서" value={state.data.resume.summary} /><Info label="사용할 자소서" value={state.data.coverLetter.question} /><Info label="사용할 프로젝트" value={state.data.projects.map((project) => project.name).join(', ')} /></div><OptionGroup title="면접 유형" options={['기술 면접', '인성 면접', '종합 면접']} value={settings.type} setValue={(value) => setOption('type', value)} /><OptionGroup title="면접관 페르소나" options={['코치형', '실무형', '검증형', '압박형']} value={settings.persona} setValue={(value) => setOption('persona', value)} /><OptionGroup title="면접 모드" options={['텍스트', '음성 Beta']} value={settings.mode} setValue={(value) => setOption('mode', value)} /><OptionGroup title="질문 수" options={['3문항', '5문항', '8문항']} value={settings.count} setValue={(value) => setOption('count', value)} /><div className="cz-actions"><Button onClick={createSession}>세션 생성</Button><Button variant="secondary" onClick={generateQuestions}>질문 생성</Button><Button variant="ghost" onClick={startInterview}>면접 시작</Button></div><div className="cz-summary-grid"><Info label="sessionId" value={state.interview.sessionId || '아직 생성 전'} /><Info label="질문 목록" value={`${state.interview.questions.length}개 생성됨`} /></div>{state.interview.questions.length > 0 && <ol className="cz-list">{state.interview.questions.map((question) => <li key={question.id}>{question.text}</li>)}</ol>}</article><ApiNote endpoints={[...apiNotes.session, ...apiNotes.questions]} /></>
}

function OptionGroup({ title, options, value, setValue }) {
  return <div className="cz-option-group"><h2>{title}</h2><div className="cz-filter">{options.map((option) => <button className={value === option ? 'active' : ''} key={option} onClick={() => setValue(option)}>{option}</button>)}</div></div>
}

function MicCheck({ showToast }) {
  const [active, setActive] = useState(false)
  return <><SectionHead eyebrow="Mic Check" title="마이크를 점검하세요" desc="권한 요청과 입력 레벨을 mock으로 확인합니다." /><article className="cz-panel"><div className={`cz-mic-check ${active ? 'active' : ''}`}><Mic size={28} /><div><strong>마이크 권한 요청 mock</strong><p>{active ? '입력 신호가 감지되었습니다.' : '테스트 시작 버튼을 눌러 파형을 확인하세요.'}</p></div>{active && <div className="cz-wave"><span /><span /><span /><span /></div>}</div><div className="cz-actions"><Button variant="secondary" onClick={() => { setActive(!active); showToast('마이크 테스트 상태가 변경되었습니다.') }}>테스트 시작</Button><Button to="/interview/start">면접 시작</Button></div></article><ApiNote endpoints={apiNotes.session} /></>
}

function InterviewStart() {
  const [state] = useDemoState()
  return <><SectionHead eyebrow="Interview Start" title="면접을 시작합니다" desc={`${state.interview.sessionId || 'mock-session'} 세션으로 질문을 진행합니다.`} action={<Button to="/interview/question">시작 버튼</Button>} /><article className="cz-panel"><Stepper steps={['설정', '마이크', '시작', '답변', '리포트']} current={2} /></article></>
}

function getCurrentQuestion(state) {
  const questions = state.interview.questions.length ? state.interview.questions : generateQuestionsFromState(state)
  return questions[Math.min(state.interview.currentIndex, questions.length - 1)] || questionBank[0]
}

function InterviewQuestion({ showToast }) {
  const [state, updateState] = useDemoState()
  const question = getCurrentQuestion(state)
  const total = state.interview.questions.length || getQuestionCount(state.interview.settings.count)
  function recordTts() {
    updateState((prev) => addAudit({ ...prev, interview: { ...prev.interview, voiceStats: { ...prev.interview.voiceStats, ttsPlays: prev.interview.voiceStats.ttsPlays + 1 } } }, 'TTS 재생', question.text))
  }
  return <><SectionHead eyebrow={`Question ${state.interview.currentIndex + 1}`} title={question.text} desc={`${state.interview.currentIndex + 1}/${total} · 출처: ${question.sourceType} · 난이도: ${question.difficulty}`} action={<Button to="/interview/answering">답변 시작</Button>} /><div className="cz-grid-2"><article className="cz-panel"><h2>질문 상세</h2><Info label="질문 출처" value={question.source} /><Info label="세션" value={state.interview.sessionId || 'mock-session'} /><Info label="면접 모드" value={state.interview.settings.mode} /></article><article className="cz-panel"><TTSControls text={question.text} onPlayed={() => { recordTts(); showToast('질문을 읽고 있습니다.') }} /></article></div><ApiNote endpoints={apiNotes.questions} /></>
}

function InterviewAnswering({ showToast }) {
  const [state, updateState] = useDemoState()
  const navigate = useNavigate()
  const [stopOpen, setStopOpen] = useState(false)
  const question = getCurrentQuestion(state)
  const existing = state.interview.answers.find((answer) => answer.questionId === question.id)
  const [answerText, setAnswerText] = useState(existing?.answer || '')
  const [usedStt, setUsedStt] = useState(existing?.method === '음성 Beta')
  const [saved, setSaved] = useState(Boolean(existing))

  function recordTts() {
    updateState((prev) => addAudit({ ...prev, interview: { ...prev.interview, voiceStats: { ...prev.interview.voiceStats, ttsPlays: prev.interview.voiceStats.ttsPlays + 1 } } }, 'TTS 재생', question.text))
  }

  function recordStt(source) {
    setUsedStt(true)
    updateState((prev) => addAudit({ ...prev, interview: { ...prev.interview, voiceStats: { ...prev.interview.voiceStats, sttRuns: prev.interview.voiceStats.sttRuns + 1, mockFallbacks: source === 'mock' ? prev.interview.voiceStats.mockFallbacks + 1 : prev.interview.voiceStats.mockFallbacks } } }, 'STT 인식', source === 'mock' ? 'mock STT fallback' : '브라우저 STT'))
  }

  async function saveAnswer() {
    const result = await requestWithMockFallback('/api/v1/answers', { questionId: question.id, answer: answerText })
    updateState((prev) => {
      const withoutCurrent = prev.interview.answers.filter((answer) => answer.questionId !== question.id)
      const method = usedStt ? '음성 Beta' : '텍스트'
      const voiceStats = {
        ...prev.interview.voiceStats,
        voiceAnswers: usedStt ? prev.interview.voiceStats.voiceAnswers + (existing?.method === '음성 Beta' ? 0 : 1) : prev.interview.voiceStats.voiceAnswers,
        textAnswers: !usedStt ? prev.interview.voiceStats.textAnswers + (existing?.method === '텍스트' ? 0 : 1) : prev.interview.voiceStats.textAnswers,
      }
      const next = { ...prev, interview: { ...prev.interview, voiceStats, answers: [...withoutCurrent, { questionId: question.id, question: question.text, answer: answerText, method, savedAt: safeNow(), source: result.source }] } }
      return addAudit(next, '답변 저장', result.source === 'api' ? 'API 답변 저장 성공' : 'mock 답변 저장')
    })
    setSaved(true)
    showToast(result.source === 'api' ? '답변이 저장되었습니다.' : '백엔드 연결 실패로 mock 답변이 저장되었습니다.')
  }

  async function generateFollowup() {
    const result = await requestWithMockFallback(`/api/v1/answers/${question.id}/followup`, { answer: answerText })
    const followup = `${question.sourceType} 관점에서 방금 답변을 실제 프로젝트 선택과 연결해 다시 설명해보세요.`
    updateState((prev) => addAudit({ ...prev, interview: { ...prev.interview, followUps: [...prev.interview.followUps, { questionId: question.id, parentQuestion: question.text, text: followup, source: result.source, createdAt: safeNow() }] } }, '꼬리질문 생성', result.source === 'api' ? 'API 꼬리질문 생성 성공' : 'mock 꼬리질문 생성'))
    showToast(result.source === 'api' ? '꼬리질문이 생성되었습니다.' : '백엔드 연결 실패로 mock 꼬리질문이 생성되었습니다.')
  }

  function goNext() {
    const nextIndex = state.interview.currentIndex + 1
    const questions = state.interview.questions.length ? state.interview.questions : generateQuestionsFromState(state)
    updateState((prev) => ({ ...prev, interview: { ...prev.interview, currentIndex: Math.min(nextIndex, questions.length - 1) } }))
    navigate(nextIndex >= questions.length - 1 ? '/interview/last' : '/interview/question')
  }

  return <><SectionHead eyebrow="Answering" title="답변을 입력하세요" desc="STT 결과가 답변창에 반영되고, 저장한 답변은 리포트에 표시됩니다." /><div className="cz-grid-2"><article className="cz-panel"><h2>현재 질문</h2><p>{question.text}</p><TTSControls text={question.text} onPlayed={() => { recordTts(); showToast('질문을 다시 읽고 있습니다.') }} /></article><article className="cz-panel"><STTAnswerBox value={answerText} onChange={setAnswerText} onSttResult={recordStt} />{saved && <p className="cz-success"><CheckCircle2 size={16} />답변이 저장되었습니다.</p>}<div className="cz-actions"><Button onClick={saveAnswer}>답변 저장</Button><Button variant="secondary" onClick={generateFollowup}>꼬리질문 생성</Button><Button variant="ghost" onClick={goNext}>다음 질문</Button><Button variant="danger" onClick={() => setStopOpen(true)}>면접 종료</Button></div></article></div>{state.interview.followUps.filter((item) => item.questionId === question.id).length > 0 && <article className="cz-panel"><h2>생성된 꼬리질문</h2><ul className="cz-list">{state.interview.followUps.filter((item) => item.questionId === question.id).map((item) => <li key={item.createdAt}>{item.text}</li>)}</ul></article>}<ApiNote endpoints={[...apiNotes.answers, ...apiNotes.followup]} />{stopOpen && <Modal title="면접을 종료하시겠어요?" onClose={() => setStopOpen(false)}><p>지금까지 저장한 답변으로 리포트를 생성할 수 있습니다.</p><div className="cz-actions"><Button variant="ghost" onClick={() => setStopOpen(false)}>계속하기</Button><Button to="/interview/generating" variant="danger">리포트 생성</Button></div></Modal>}</>
}

function InterviewLast({ showToast }) {
  const [state, updateState] = useDemoState()
  const navigate = useNavigate()
  const questions = state.interview.questions.length ? state.interview.questions : generateQuestionsFromState(state)
  const question = questions[questions.length - 1] || questionBank[0]
  const existing = state.interview.answers.find((answer) => answer.questionId === question.id)
  const [answerText, setAnswerText] = useState(existing?.answer || '')
  const [usedStt, setUsedStt] = useState(existing?.method === '음성 Beta')

  function recordStt(source) {
    setUsedStt(true)
    updateState((prev) => addAudit({ ...prev, interview: { ...prev.interview, voiceStats: { ...prev.interview.voiceStats, sttRuns: prev.interview.voiceStats.sttRuns + 1, mockFallbacks: source === 'mock' ? prev.interview.voiceStats.mockFallbacks + 1 : prev.interview.voiceStats.mockFallbacks } } }, 'STT 인식', source === 'mock' ? 'mock STT fallback' : '브라우저 STT'))
  }

  async function saveFinalAnswer() {
    const result = await requestWithMockFallback('/api/v1/answers', { questionId: question.id, answer: answerText })
    updateState((prev) => {
      const withoutCurrent = prev.interview.answers.filter((answer) => answer.questionId !== question.id)
      const method = usedStt ? '음성 Beta' : '텍스트'
      const voiceStats = {
        ...prev.interview.voiceStats,
        voiceAnswers: usedStt ? prev.interview.voiceStats.voiceAnswers + (existing?.method === '음성 Beta' ? 0 : 1) : prev.interview.voiceStats.voiceAnswers,
        textAnswers: !usedStt ? prev.interview.voiceStats.textAnswers + (existing?.method === '텍스트' ? 0 : 1) : prev.interview.voiceStats.textAnswers,
      }
      const next = { ...prev, interview: { ...prev.interview, voiceStats, answers: [...withoutCurrent, { questionId: question.id, question: question.text, answer: answerText, method, savedAt: safeNow(), source: result.source }] } }
      return addAudit(next, '최종 답변 저장', result.source === 'api' ? 'API 답변 저장 성공' : 'mock 답변 저장')
    })
    showToast('최종 답변이 저장되었습니다.')
  }

  function generateReport() {
    updateState((prev) => addAudit({ ...prev, report: createReportFromState(prev) }, '리포트 생성', 'mock report generated'))
    navigate('/interview/generating')
  }

  return <><SectionHead eyebrow="Last Question" title={question.text} desc="최종 답변을 저장한 뒤 리포트를 생성합니다." /><div className="cz-grid-2"><article className="cz-panel"><TTSControls text={question.text} onPlayed={() => updateState((prev) => addAudit({ ...prev, interview: { ...prev.interview, voiceStats: { ...prev.interview.voiceStats, ttsPlays: prev.interview.voiceStats.ttsPlays + 1 } } }, 'TTS 재생', question.text))} /></article><article className="cz-panel"><STTAnswerBox value={answerText} onChange={setAnswerText} onSttResult={recordStt} /><div className="cz-actions"><Button onClick={saveFinalAnswer}>최종 답변 저장</Button><Button onClick={generateReport} variant="secondary">리포트 생성</Button></div></article></div><ApiNote endpoints={[...apiNotes.answers, ...apiNotes.report]} /></>
}

function ReportGenerating({ showToast }) {
  const [state, updateState] = useDemoState()
  const navigate = useNavigate()
  const steps = ['답변 구조 분석', 'CS 키워드 분석', '꼬리질문 이력 정리', '강점/약점 도출', '리포트 생성']

  function completeReport() {
    updateState((prev) => {
      const report = prev.report || createReportFromState(prev)
      return addAudit({ ...prev, report }, '리포트 생성 완료', 'GET /api/v1/sessions/{session_id}/report mock fallback')
    })
    showToast('리포트 생성이 완료되었습니다.')
    navigate('/report')
  }

  return <><SectionHead eyebrow="Report Generating" title="리포트를 생성 중입니다" desc="답변과 꼬리질문 이력을 분석해 최종 리포트를 만듭니다." action={<Button onClick={completeReport}>완료 후 리포트 보기</Button>} /><article className="cz-panel"><Metric label="생성 진행률" value={92} suffix="%" /><div className="cz-grid-3">{steps.map((step, index) => <article className="cz-stat" key={step}><CheckCircle2 size={20} /><strong>{step}</strong><span>{index < 4 ? '완료' : '진행 중'}</span></article>)}</div><Info label="세션" value={state.interview.sessionId || 'mock-session'} /></article></>
}

function ReportPage({ section = 'main' }) {
  const [state, updateState] = useDemoState()
  const [toast, showToast] = useTimedToast()
  const report = state.report || createReportFromState(state)
  const titleMap = { main: '김햄찌 최종 리포트', growth: '성장 추이 상세', score: '종합 점수 상세', feedback: '면접관 피드백', roadmap: '다음 학습 로드맵' }
  function downloadPdf() {
    updateState((prev) => addAudit(prev, 'PDF 다운로드', 'mock pdf 준비'))
    showToast('PDF 다운로드를 준비 중입니다.')
  }
  return (
    <Shell toast={toast}>
      <main className="cz-page">
        <SectionHead eyebrow="Report" title={titleMap[section]} desc="저장된 답변, 꼬리질문, TTS/STT 사용 이력을 반영합니다." action={<Button to="/mypage">마이페이지 저장/보기</Button>} />
        <nav className="cz-subnav"><NavLink to="/report" end>메인</NavLink><NavLink to="/report/growth">성장 추이</NavLink><NavLink to="/report/score">종합 점수</NavLink><NavLink to="/report/feedback">피드백</NavLink><NavLink to="/report/roadmap">로드맵</NavLink></nav>
        <IntegrationStatus>TTS/STT는 브라우저 Web Speech API 기반 MVP 기능입니다.</IntegrationStatus>
        <div className="cz-grid-2">
          <article className="cz-panel report-hero"><Badge>{report.grade}</Badge><h2>{report.score}점</h2><p>{report.summary}</p><Button onClick={downloadPdf}><Download size={16} />PDF 다운로드</Button></article>
          <ScoreTrend />
          <TagPanel title="강점" items={report.strengths} tone="strength" />
          <TagPanel title="약점" items={report.weaknesses} tone="weakness" />
          <article className="cz-panel"><h2>사용한 질문과 답변 요약</h2>{report.answers.length ? <ul className="cz-list">{report.answers.map((answer) => <li key={answer.questionId}><strong>{answer.question}</strong><br />{answer.method} · {answer.answer.slice(0, 90)}...</li>)}</ul> : <p>아직 저장된 답변이 없어 기본 리포트 예시를 표시합니다.</p>}</article>
          <article className="cz-panel"><h2>꼬리질문 이력</h2>{report.followUps.length ? <ul className="cz-list">{report.followUps.map((item) => <li key={item.createdAt}>{item.text}</li>)}</ul> : <p>꼬리질문 생성 이력이 없습니다.</p>}<Info label="TTS/STT 사용" value={`TTS ${state.interview.voiceStats.ttsPlays}회 · STT ${state.interview.voiceStats.sttRuns}회 · fallback ${state.interview.voiceStats.mockFallbacks}회`} /></article>
          <article className="cz-panel wide-panel"><h2>다음 학습 로드맵</h2><ol className="cz-list">{report.roadmap.map((item) => <li key={item}>{item}</li>)}</ol></article>
        </div>
        <ApiNote endpoints={apiNotes.report} />
      </main>
    </Shell>
  )
}

function MyPage({ tab = 'home' }) {
  const [toast, showToast] = useTimedToast()
  const title = tab === 'home' ? '마이페이지' : { profile: '내 정보', analysis: '분석 결과', projects: '프로젝트', interviews: '면접 기록', reports: '리포트 보관함', settings: '계정 설정' }[tab]
  return (
    <Shell toast={toast}>
      <main className="cz-page">
        <SectionHead eyebrow="MyPage" title={title} desc="저장된 자료, 세션, 답변, 리포트 상태를 확인합니다." />
        <MyPageNav />
        {tab === 'home' && <MyPageHome />}
        {tab === 'profile' && <ProfilePage initialTab="basic" showToast={showToast} />}
        {tab === 'settings' && <ProfilePage initialTab="security" showToast={showToast} />}
        {tab === 'analysis' && <MyAnalysisPage showToast={showToast} />}
        {tab === 'projects' && <ProjectsPage showToast={showToast} />}
        {tab === 'interviews' && <InterviewsPage />}
        {tab === 'reports' && <ReportsPage showToast={showToast} />}
      </main>
    </Shell>
  )
}

function MyPageNav() {
  const links = [['허브', '/mypage'], ['내 정보', '/mypage/profile'], ['분석 결과', '/mypage/analysis'], ['프로젝트', '/mypage/projects'], ['면접 기록', '/mypage/interviews'], ['리포트 보관함', '/mypage/reports'], ['계정 설정', '/mypage/settings']]
  return <nav className="cz-subnav">{links.map(([label, to]) => <NavLink key={to} to={to} end={to === '/mypage'}>{label}</NavLink>)}</nav>
}

function MyPageHome() {
  const [state] = useDemoState()
  const categoryCards = [['내 정보', '기본 정보와 포트폴리오 링크를 수정합니다.', '/mypage/profile', User], ['분석 결과', '최근 JD/이력서 분석과 예상 질문을 확인합니다.', '/mypage/analysis', BarChart3], ['프로젝트', '프로젝트 기반 Deep Dive 질문을 관리합니다.', '/mypage/projects', FileText], ['면접 기록', '완료된 면접 점수와 상태를 확인합니다.', '/mypage/interviews', Gauge], ['리포트 보관함', '면접 리포트를 확인하고 PDF를 준비합니다.', '/mypage/reports', Download], ['계정 설정', '보안, 알림, 탈퇴 mock 동작을 확인합니다.', '/mypage/settings', Lock]]
  const kpis = [['누적 면접 수', `${hamzziStats.totalInterviews}회`], ['평균 점수', `${hamzziStats.averageScore}점`], ['최근 분석 점수', `${hamzziStats.latestAnalysisScore}점`], ['생성 질문', `${state.interview.questions.length}개`], ['저장 답변', `${state.interview.answers.length}개`], ['꼬리질문', `${state.interview.followUps.length}개`], ['보관 리포트', `${state.report ? 4 : 3}건`]]
  return <><article className="cz-profile-summary"><div className="cz-profile-main"><span className="cz-avatar large">김</span><div><h2>{hamzziUser.name}</h2><p>{hamzziUser.email}</p><div className="cz-tags"><Badge>비전공</Badge><Badge>신입</Badge><Badge>백엔드</Badge><Badge>{hamzziUser.accountStatus}</Badge></div></div></div><Info label="최근 로그인" value={hamzziUser.lastLogin} /><Info label="가입일" value={hamzziUser.joinedAt} /><Info label="희망 직무" value={hamzziUser.targetRole} /><div className="cz-progress-block"><span>프로필 완성도</span><strong>{hamzziUser.profileCompletion}%</strong><i><em style={{ width: `${hamzziUser.profileCompletion}%` }} /></i></div></article><IntegrationStatus /><div className="cz-grid-4">{kpis.map(([label, value]) => <article className="cz-stat" key={label}><Gauge size={20} /><span>{label}</span><strong>{value}</strong></article>)}</div><div className="cz-grid-3">{categoryCards.map(([title, desc, to, Icon]) => <Link className="cz-card" to={to} key={title}><Icon size={24} /><h2>{title}</h2><p>{desc}</p><b>바로가기 <ArrowRight size={16} /></b></Link>)}</div><div className="cz-grid-2"><article className="cz-panel"><h2>최근 세션 상태</h2><Info label="sessionId" value={state.interview.sessionId || '아직 없음'} /><Info label="질문/답변" value={`${state.interview.questions.length}개 / ${state.interview.answers.length}개`} /><Button to="/interview/setup" variant="secondary">면접 이어가기</Button></article><article className="cz-panel"><h2>최근 면접 기록</h2>{interviews.slice(0, 2).map((item) => <div className="cz-row" key={item.date}><span>{item.date}</span><strong>{item.type}</strong><Badge>{item.score}점</Badge></div>)}</article><ScoreTrend /><TagPanel title="강점 TOP5" items={strengths} tone="strength" /><TagPanel title="약점 TOP5" items={weaknesses} tone="weakness" /><article className="cz-panel"><h2>추천 다음 액션</h2><div className="cz-action-list">{['CS 기초 Deep Dive 면접 연습하기', 'DB/트랜잭션 꼬리질문 다시 연습하기', '프로젝트 기여도 답변 보완하기'].map((item) => <Button to="/interview/setup" variant="ghost" key={item}>{item}</Button>)}</div></article></div><ApiNote endpoints={apiNotes.mypage} /></>
}

const profileLabels = { name: '이름', email: '이메일', major: '전공', education: '교육 이력', careerType: '신입/경력', background: '전공/비전공', targetRole: '희망 직무', experienceYears: '경력 연차', techStacks: '관심 기술스택', github: 'GitHub', blog: 'Blog', notion: 'Notion', portfolio: 'Portfolio', mainConcern: '가장 걱정되는 부분' }

function ProfilePage({ initialTab, showToast }) {
  const [tab, setTab] = useState(initialTab)
  const [isEditing, setIsEditing] = useState(false)
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [withdrawConfirm, setWithdrawConfirm] = useState('')
  const [securityError, setSecurityError] = useState('')
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [notificationForm, setNotificationForm] = useState({ email: true, remind: true, report: true, marketing: false })
  const [profileForm, setProfileForm] = useState({ name: hamzziUser.name, email: hamzziUser.email, major: hamzziUser.major, education: hamzziUser.education, careerType: hamzziUser.careerType, background: hamzziUser.background, targetRole: hamzziUser.targetRole, experienceYears: `${hamzziUser.experienceYears}년`, techStacks: hamzziUser.techStacks.join(', '), github: hamzziUser.github, blog: hamzziUser.blog, notion: hamzziUser.notion, portfolio: hamzziUser.portfolio, mainConcern: hamzziUser.mainConcern })
  const tabs = [['basic', '기본 정보'], ['security', '보안 설정'], ['notice', '알림 설정'], ['account', '계정 관리']]
  function changeUserPassword() {
    if (passwordForm.newPassword.length < 8) return setSecurityError('새 비밀번호는 8자 이상이어야 합니다.')
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return setSecurityError('새 비밀번호가 일치하지 않습니다.')
    setSecurityError('')
    showToast('비밀번호가 변경되었습니다.')
  }
  return <section><div className="cz-tabs">{tabs.map(([id, label]) => <button className={tab === id ? 'active' : ''} key={id} onClick={() => setTab(id)}>{label}</button>)}</div>{tab === 'basic' && <article className="cz-panel"><h2>기본 정보</h2><div className="cz-form-grid">{Object.entries(profileForm).map(([key, value]) => <label className={key === 'mainConcern' || key === 'techStacks' ? 'wide' : ''} key={key}>{profileLabels[key]}<input disabled={!isEditing} value={value} onChange={(event) => setProfileForm({ ...profileForm, [key]: event.target.value })} /></label>)}</div><div className="cz-actions">{!isEditing ? <Button onClick={() => setIsEditing(true)}><Pencil size={16} />수정하기</Button> : <><Button onClick={() => { setIsEditing(false); showToast('프로필이 저장되었습니다.') }}>저장하기</Button><Button variant="ghost" onClick={() => setIsEditing(false)}>취소</Button></>}<Button to="/mypage" variant="secondary">마이페이지로 돌아가기</Button></div><ApiNote endpoints={apiNotes.profile} /></article>}{tab === 'security' && <article className="cz-panel"><h2>보안 설정</h2><div className="cz-form-grid"><label>현재 비밀번호<input type="password" value={passwordForm.currentPassword} onChange={(event) => setPasswordForm({ ...passwordForm, currentPassword: event.target.value })} /></label><label>새 비밀번호<input type="password" value={passwordForm.newPassword} onChange={(event) => setPasswordForm({ ...passwordForm, newPassword: event.target.value })} /></label><label>새 비밀번호 확인<input type="password" value={passwordForm.confirmPassword} onChange={(event) => setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })} /></label></div>{securityError && <p className="cz-error"><AlertCircle size={16} />{securityError}</p>}<Button onClick={changeUserPassword}><ShieldCheck size={16} />비밀번호 변경</Button></article>}{tab === 'notice' && <article className="cz-panel"><h2>알림 설정</h2>{[['email', '이메일 알림'], ['remind', '면접 리마인드'], ['report', '리포트 생성 알림'], ['marketing', '마케팅 수신 동의']].map(([key, label]) => <label className="cz-switch" key={key}><span>{label}</span><input type="checkbox" checked={notificationForm[key]} onChange={(event) => setNotificationForm({ ...notificationForm, [key]: event.target.checked })} /></label>)}<Button onClick={() => showToast('알림 설정이 저장되었습니다.')}><Bell size={16} />알림 설정 저장</Button></article>}{tab === 'account' && <article className="cz-panel danger-zone"><h2>계정 관리</h2><div className="cz-note-box"><strong>장기 미이용 계정 안내</strong><p>12개월 이상 접속하지 않으면 휴면 전환 안내가 발송됩니다.</p></div><div className="cz-note-box"><strong>계정 비활성화 안내</strong><p>비활성화 시 로그인과 새 면접 생성이 제한될 수 있습니다.</p></div><Button variant="danger" onClick={() => setWithdrawOpen(true)}><Trash2 size={16} />계정 탈퇴</Button><ApiNote endpoints={apiNotes.account} /></article>}{(tab === 'security' || tab === 'notice') && <ApiNote endpoints={apiNotes.account} />}{withdrawOpen && <Modal title="정말 계정을 탈퇴하시겠어요?" onClose={() => setWithdrawOpen(false)}><ul className="cz-list"><li>면접 기록과 리포트가 삭제될 수 있습니다.</li><li>삭제된 데이터는 복구하기 어렵습니다.</li></ul><label>확인 문구 입력<input value={withdrawConfirm} onChange={(event) => setWithdrawConfirm(event.target.value)} placeholder="탈퇴합니다" /></label><div className="cz-actions"><Button variant="ghost" onClick={() => setWithdrawOpen(false)}>취소</Button><Button variant="danger" disabled={withdrawConfirm !== '탈퇴합니다'} onClick={() => { setWithdrawOpen(false); setWithdrawConfirm(''); showToast('계정 탈퇴 요청이 접수되었습니다.') }}>탈퇴하기</Button></div></Modal>}</section>
}

function MyAnalysisPage({ showToast }) {
  const [filter, setFilter] = useState('전체')
  return <section><Filter items={['전체', '최근 1개월', '기술 면접', '종합 면접', '비전공자 Deep Dive']} active={filter} setActive={setFilter} /><AnalysisResult /><div className="cz-actions page-actions"><Button to="/interview/setup">이 분석으로 면접 시작하기</Button><Button variant="secondary" onClick={() => showToast('최근 분석 상세 카드를 확인합니다.')}>상세 보기</Button></div></section>
}

function ProjectsPage({ showToast }) {
  const [state, updateState] = useDemoState()
  const [editingId, setEditingId] = useState(null)
  const projects = state.data.projects
  return <section><div className="cz-actions page-actions"><Button onClick={() => showToast('프로젝트 추가 modal은 API 연동 전 mock 상태입니다.')}><Plus size={16} />프로젝트 추가</Button></div>{projects.length === 0 && <EmptyState title="등록된 프로젝트가 없습니다" desc="프로젝트를 등록하면 프로젝트 기반 Deep Dive 질문이 생성됩니다." action={<Button onClick={() => showToast('프로젝트 추가 modal은 mock입니다.')}>프로젝트 추가</Button>} />}<div className="cz-grid-2">{projects.map((project) => <article className="cz-panel" key={project.id}><h2>{project.name}</h2><p>{project.description}</p><div className="cz-tags">{project.techStacks.map((stack) => <Badge key={stack}>{stack}</Badge>)}</div><Metric label="기여도" value={project.contribution} suffix="%" /><div className="cz-summary-grid"><Info label="역할" value={project.role} /><Info label="GitHub" value={project.github} /><Info label="면접 활용 횟수" value={`${project.interviewUseCount}회`} /><Info label="저장 상태" value={`${project.savedAt} · ${project.source}`} /></div><h3>자주 나온 질문</h3><ul className="cz-list">{project.questions.map((question) => <li key={question}>{question}</li>)}</ul>{editingId === project.id && <div className="cz-edit-box">수정 mock 상태입니다. 실제 API 연동 시 PATCH /api/v1/projects/{'{project_id}'}로 저장합니다.</div>}<div className="cz-actions"><Button variant="secondary" onClick={() => { setEditingId(editingId === project.id ? null : project.id); showToast('프로젝트 수정 모드가 전환되었습니다.') }}>수정</Button><Button variant="danger" onClick={() => { updateState((prev) => addAudit({ ...prev, data: { ...prev.data, projects: prev.data.projects.filter((item) => item.id !== project.id) } }, '프로젝트 삭제', 'mock delete')); showToast('프로젝트가 삭제되었습니다.') }}>삭제</Button></div></article>)}</div><ApiNote endpoints={apiNotes.project} /></section>
}

function InterviewsPage() {
  const [state] = useDemoState()
  const [filter, setFilter] = useState('전체')
  const sessionRow = state.interview.sessionId ? [{ date: safeNow(), type: state.interview.settings.type, persona: state.interview.settings.persona, mode: state.interview.settings.mode, score: state.report?.score || 82, status: `${state.interview.answers.length}개 답변 저장` }, ...interviews] : interviews
  return <section><Filter items={['전체', '기술 면접', '인성 면접', '종합 면접', '완료']} active={filter} setActive={setFilter} /><article className="cz-panel table-panel"><table><thead><tr><th>날짜</th><th>면접 유형</th><th>페르소나</th><th>모드</th><th>점수</th><th>상태</th><th>동작</th></tr></thead><tbody>{sessionRow.map((item, index) => <tr key={`${item.date}-${index}`}><td>{item.date}</td><td>{item.type}</td><td>{item.persona}</td><td>{item.mode}</td><td>{item.score}점</td><td><Badge>{item.status}</Badge></td><td><div className="cz-actions"><Button to="/report" variant="ghost">리포트 보기</Button><Button to="/interview/setup" variant="secondary">다시 연습하기</Button></div></td></tr>)}</tbody></table></article><ApiNote endpoints={apiNotes.session} /></section>
}

function ReportsPage({ showToast }) {
  const [state, updateState] = useDemoState()
  const [reports, setReports] = useState(state.report ? [{ id: 'current', date: state.report.generatedAt, type: state.interview.settings.type, score: state.report.score, grade: state.report.grade, strength: state.report.strengths[0], weakness: state.report.weaknesses[0] }, ...initialReports] : initialReports)
  return <section>{reports.length === 0 && <EmptyState title="보관된 리포트가 없습니다" desc="면접을 완료하면 리포트가 자동 생성됩니다." action={<Button to="/interview/setup">면접 시작하기</Button>} />}<div className="cz-grid-3">{reports.map((report) => <article className="cz-panel report-card" key={report.id}><Badge>{report.grade}</Badge><h2>{report.score}점</h2><p>{report.type} · {report.date}</p><Info label="강점 요약" value={report.strength} /><Info label="약점 요약" value={report.weakness} /><div className="cz-actions"><Button variant="secondary" onClick={() => { updateState((prev) => addAudit(prev, 'PDF 다운로드', 'mock pdf 준비')); showToast('PDF 다운로드를 준비 중입니다.') }}><Download size={16} />PDF 다운로드</Button><Button to="/report" variant="ghost">상세 보기</Button><Button variant="ghost" onClick={() => showToast('리포트가 보관되었습니다.')}>보관</Button><Button variant="danger" onClick={() => { setReports(reports.filter((item) => item.id !== report.id)); showToast('리포트가 삭제되었습니다.') }}>삭제</Button></div></article>)}</div><ApiNote endpoints={apiNotes.report} /></section>
}

function AdminPage({ kind = 'dashboard' }) {
  const [toast, showToast] = useTimedToast()
  const pageMap = { dashboard: <AdminDashboard />, members: <AdminMembers />, detail: <AdminMemberDetail showToast={showToast} />, prompts: <AdminPrompts />, template: <AdminTemplateCreate showToast={showToast} />, versions: <AdminVersions />, test: <AdminVersionTest showToast={showToast} />, logs: <AdminAuditLogs /> }
  return <Shell toast={toast} admin><main className="cz-page">{pageMap[kind]}</main></Shell>
}

function AdminDashboard() {
  const [state] = useDemoState()
  return <><SectionHead eyebrow="Admin" title="관리자 대시보드" desc="현재 MVP 기능 상태와 fallback 흐름을 확인합니다." /><IntegrationStatus>Admin에서도 TTS/STT Beta 사용량과 fallback 수를 모니터링합니다.</IntegrationStatus><div className="cz-grid-4">{[['전체 회원 mock', '1,248명'], ['면접 세션 수', `${state.interview.sessionId ? 4 : 3}회`], ['리포트 수', `${state.report ? 4 : 3}건`], ['AI 사용량', '72%'], ['TTS/STT Beta', `${state.interview.voiceStats.ttsPlays}/${state.interview.voiceStats.sttRuns}`], ['실패 fallback 수', `${state.admin.fallbackCount + state.interview.voiceStats.mockFallbacks}회`]].map(([label, value]) => <article className="cz-stat" key={label}><span>{label}</span><strong>{value}</strong></article>)}</div><div className="cz-grid-3"><Link className="cz-card" to="/admin/members"><h2>회원 관리</h2><p>회원 목록과 상세 정보를 확인합니다.</p></Link><Link className="cz-card" to="/admin/prompts"><h2>프롬프트 관리</h2><p>질문·꼬리질문·리포트 프롬프트를 관리합니다.</p></Link><Link className="cz-card" to="/admin/audit-logs"><h2>감사 로그</h2><p>로그인, JD 저장, TTS/STT, 리포트 생성 기록을 확인합니다.</p></Link></div><ApiNote endpoints={apiNotes.admin} /></>
}

function AdminMembers() {
  return <><SectionHead eyebrow="Admin Members" title="회원 관리" desc="검색과 필터는 mock 상태입니다." /><article className="cz-panel"><div className="cz-input-button"><input placeholder="회원명 또는 이메일 검색" /><button><Search size={16} /></button></div><table><thead><tr><th>이름</th><th>이메일</th><th>상태</th><th>최근 로그인</th><th>동작</th></tr></thead><tbody><tr><td>김햄찌</td><td>{hamzziUser.email}</td><td><Badge>active</Badge></td><td>{hamzziUser.lastLogin}</td><td><Button to="/admin/member-detail" variant="secondary">회원 상세</Button></td></tr><tr><td>박소윤</td><td>soyun@example.com</td><td><Badge>active</Badge></td><td>2026.06.08</td><td><Button to="/admin/member-detail" variant="secondary">회원 상세</Button></td></tr></tbody></table></article><ApiNote endpoints={apiNotes.admin} /></>
}

function AdminMemberDetail({ showToast }) {
  const [state] = useDemoState()
  return <><SectionHead eyebrow="Member Detail" title="김햄찌 회원 상세" desc="회원 활동 기록과 계정 상태를 확인합니다." /><div className="cz-grid-2"><article className="cz-panel"><h2>회원 정보</h2><div className="cz-summary-grid"><Info label="이름" value={hamzziUser.name} /><Info label="이메일" value={hamzziUser.email} /><Info label="상태" value={hamzziUser.accountStatus} /><Info label="가입일" value={hamzziUser.joinedAt} /></div><Button variant="secondary" onClick={() => showToast('계정 상태가 변경되었습니다.')}>계정 상태 변경</Button></article><article className="cz-panel"><h2>활동 기록</h2><ul className="cz-list">{state.admin.auditLogs.slice(0, 6).map((row) => <li key={row.join('-')}>{row[0]} · {row[2]} · {row[3]}</li>)}</ul></article></div><ApiNote endpoints={apiNotes.admin} /></>
}

function AdminPrompts() {
  const prompts = ['질문 생성 프롬프트', '꼬리질문 프롬프트', '리포트 프롬프트', 'TTS/STT 음성 Beta 안내 문구']
  return <><SectionHead eyebrow="Prompt Management" title="프롬프트 관리" desc="현재 MVP 프롬프트와 음성 Beta 안내 문구를 확인합니다." action={<div className="cz-actions"><Button to="/admin/template-create">새 템플릿 생성</Button><Button to="/admin/versions" variant="secondary">버전 관리</Button></div>} /><div className="cz-grid-4">{prompts.map((item) => <article className="cz-panel" key={item}><Badge>active</Badge><h2>{item}</h2><p>v1.4 · API 우선 호출 / 실패 시 mock fallback</p></article>)}</div><ApiNote endpoints={apiNotes.admin} /></>
}

function AdminTemplateCreate({ showToast }) {
  return <><SectionHead eyebrow="Template Create" title="새 템플릿 생성" desc="프롬프트 내용을 저장하면 목록에 반영되는 mock입니다." /><article className="cz-panel"><div className="cz-form-grid"><label>템플릿명<input defaultValue="비전공자 Deep Dive 질문 생성" /></label><label>면접 유형<input defaultValue="기술 면접" /></label><label className="wide">프롬프트 내용<input defaultValue="지원자의 JD, 이력서, 프로젝트를 기반으로 CS/DB/아키텍처 꼬리질문을 생성하세요." /></label></div><Button onClick={() => showToast('관리자 템플릿이 저장되었습니다.')}>저장</Button></article><ApiNote endpoints={apiNotes.admin} /></>
}

function AdminVersions() {
  return <><SectionHead eyebrow="Version Management" title="버전 관리" desc="프롬프트 버전 테스트로 이동할 수 있습니다." /><div className="cz-grid-3">{['v1.4 운영중', 'v1.5 후보', 'v2.0 실험'].map((item) => <article className="cz-panel" key={item}><h2>{item}</h2><p>정확도, 일관성, 비용, TTS/STT 안내 품질을 비교합니다.</p><Button to="/admin/version-test" variant="secondary">버전 테스트</Button></article>)}</div><ApiNote endpoints={apiNotes.admin} /></>
}

function AdminVersionTest({ showToast }) {
  return <><SectionHead eyebrow="Version Test" title="버전 테스트" desc="테스트 질문과 답변을 입력해 결과 mock을 확인합니다." /><article className="cz-panel"><div className="cz-form-grid"><label>테스트 질문<input defaultValue="JVM 메모리 구조를 설명해보세요." /></label><label>테스트 답변<input defaultValue="힙과 스택 영역을 중심으로 설명합니다." /></label></div><Button onClick={() => showToast('테스트 결과가 생성되었습니다.')}>결과 생성</Button><div className="cz-edit-box">결과 mock: 답변 구조는 양호하나 Metaspace와 GC 설명 보완 필요</div></article><ApiNote endpoints={apiNotes.admin} /></>
}

function AdminAuditLogs() {
  const [state] = useDemoState()
  const defaultLogs = [['2026.06.09 09:10', 'admin@career.zip', '로그인', 'mock token 저장'], ['2026.06.09 09:16', '김햄찌', 'JD 저장', '주니어 백엔드 개발자'], ['2026.06.09 09:24', 'system', '질문 생성', 'CS Deep Dive 5문항'], ['2026.06.09 09:30', '김햄찌', 'TTS 재생', '질문 듣기'], ['2026.06.09 09:32', '김햄찌', 'STT 인식', '음성 답변'], ['2026.06.09 09:40', 'system', '리포트 생성', 'B+']]
  const rows = [...state.admin.auditLogs, ...defaultLogs].slice(0, 14)
  return <><SectionHead eyebrow="Audit Log" title="관리자 활동 로그" desc="로그인, JD 저장, 질문 생성, 답변 저장, STT/TTS, 리포트 생성 기록을 확인합니다." /><article className="cz-panel table-panel"><table><thead><tr><th>시간</th><th>사용자</th><th>활동</th><th>대상</th></tr></thead><tbody>{rows.map((row) => <tr key={row.join('-')}>{row.map((cell) => <td key={cell}>{cell}</td>)}</tr>)}</tbody></table></article><ApiNote endpoints={apiNotes.admin} /></>
}

export default function SaaSPrototype() {
  const { pathname } = useLocation()
  const page = useMemo(() => pathname.replace(/\/$/, '') || '/', [pathname])

  if (page === '/' || page === '/prototype') return <Landing />
  if (page === '/login') return <AuthPage />
  if (page === '/signup') return <SignupPage />
  if (page === '/onboarding') return <OnboardingPage />
  if (page === '/dashboard') return <DashboardPage />
  if (page === '/data') return <DataInputPage />
  if (page === '/data/jd') return <DataInputPage kind="jd" />
  if (page === '/data/resume') return <DataInputPage kind="resume" />
  if (page === '/data/cover-letter') return <DataInputPage kind="cover" />
  if (page === '/data/projects') return <DataInputPage kind="projects" />
  if (page === '/data/complete') return <DataInputPage kind="complete" />
  if (page === '/analysis' || page === '/analysis/source') return <AnalysisPage kind="source" />
  if (page === '/analysis/result') return <AnalysisPage kind="result" />
  if (page === '/analysis/questions') return <AnalysisPage kind="questions" />
  if (page === '/interview/setup') return <InterviewPage kind="setup" />
  if (page === '/interview/mic-check') return <InterviewPage kind="mic" />
  if (page === '/interview/start') return <InterviewPage kind="start" />
  if (page === '/interview/question') return <InterviewPage kind="question" />
  if (page === '/interview/answering') return <InterviewPage kind="answering" />
  if (page === '/interview/last') return <InterviewPage kind="last" />
  if (page === '/interview/generating') return <InterviewPage kind="generating" />
  if (page === '/interview/text' || page === '/interview/voice') return <InterviewPage kind="answering" />
  if (page === '/interview/result') return <ReportPage />
  if (page === '/report') return <ReportPage />
  if (page === '/report/growth') return <ReportPage section="growth" />
  if (page === '/report/score') return <ReportPage section="score" />
  if (page === '/report/feedback') return <ReportPage section="feedback" />
  if (page === '/report/roadmap') return <ReportPage section="roadmap" />
  if (page === '/mypage') return <MyPage />
  if (page === '/mypage/profile') return <MyPage tab="profile" />
  if (page === '/mypage/analysis') return <MyPage tab="analysis" />
  if (page === '/mypage/projects') return <MyPage tab="projects" />
  if (page === '/mypage/interviews') return <MyPage tab="interviews" />
  if (page === '/mypage/reports') return <MyPage tab="reports" />
  if (page === '/mypage/settings') return <MyPage tab="settings" />
  if (page === '/admin') return <AdminPage />
  if (page === '/admin/members') return <AdminPage kind="members" />
  if (page === '/admin/member-detail') return <AdminPage kind="detail" />
  if (page === '/admin/prompts') return <AdminPage kind="prompts" />
  if (page === '/admin/template-create') return <AdminPage kind="template" />
  if (page === '/admin/versions') return <AdminPage kind="versions" />
  if (page === '/admin/version-test') return <AdminPage kind="test" />
  if (page === '/admin/audit-logs') return <AdminPage kind="logs" />
  return <Landing />
}
