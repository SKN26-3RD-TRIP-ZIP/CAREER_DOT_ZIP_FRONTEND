import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Loader2, Plus, X } from 'lucide-react'
import {
  createCoverLetter,
  createJd,
  createResume,
  getCoverLetterList,
  getJdList,
  getResumeList,
  startAnalysis,
} from '../../api/analysisApi'
import './Analysis.css'

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

function SourceSelectionPage() {
  const navigate = useNavigate()
  const [lists, setLists] = useState({ jd: [], resume: [], coverLetter: [] })
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState({ jd: null, resume: null, coverLetter: null })
  const [modalType, setModalType] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState('')

  const fetchLists = useCallback(async () => {
    setError('')
    try {
      const [jdRes, resumeRes, clRes] = await Promise.all([
        getJdList(),
        getResumeList(),
        getCoverLetterList(),
      ])
      const jds = jdRes.data.results || []
      const resumes = resumeRes.data.results || []
      const coverLetters = clRes.data.results || []
      setLists({ jd: jds, resume: resumes, coverLetter: coverLetters })
      setSelected((prev) => ({
        jd: prev.jd ?? (jds[0]?.jd_id ?? null),
        resume: prev.resume ?? (resumes[0]?.resume_id ?? null),
        coverLetter: prev.coverLetter ?? (coverLetters[0]?.cover_letter_id ?? null),
      }))
    } catch {
      setError('자료 목록을 불러오지 못했습니다. 로그인 상태를 확인해주세요.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchLists() }, [fetchLists])

  const handleStartAnalysis = async () => {
    if (!selected.jd || !selected.resume) {
      setError('JD와 이력서는 필수 선택 항목입니다.')
      return
    }
    setAnalyzing(true)
    setError('')
    try {
      console.log('[Analysis] 분석 시작:', new Date().toISOString())
      const res = await startAnalysis({
        jd_id: selected.jd,
        resume_id: selected.resume,
        cover_letter_id: selected.coverLetter || undefined,
        career_level: 'entry',
      })
      console.log('[Analysis] 세션 생성 완료 session_id:', res.data.session_id, new Date().toISOString())
      navigate('/analysis/result', { state: { sessionId: res.data.session_id } })
    } catch {
      setError('분석을 시작하지 못했습니다. 다시 시도해주세요.')
      setAnalyzing(false)
    }
  }

  const handleModalSaved = async (type, newId) => {
    setModalType('')
    setLoading(true)
    await fetchLists()
    setSelected((prev) => ({ ...prev, [type]: newId }))
  }

  const canAnalyze = selected.jd && selected.resume

  const summaryLabels = [
    {
      label: 'JD',
      value: lists.jd.find((i) => i.jd_id === selected.jd),
      display: (v) => `${v.company_name} ${v.position}`,
    },
    {
      label: '이력서',
      value: lists.resume.find((i) => i.resume_id === selected.resume),
      display: (v) => v.name,
    },
    {
      label: '자소서',
      value: lists.coverLetter.find((i) => i.cover_letter_id === selected.coverLetter),
      display: (v) => v.title,
    },
  ]

  if (loading) {
    return (
      <div className="analysis-loading">
        <Loader2 size={22} className="analysis-spin" />
        자료를 불러오는 중...
      </div>
    )
  }

  return (
    <>
      <div className="analysis-page-head">
        <div>
          <h1>AI 분석에 사용할 자료를 선택하세요.</h1>
          <p>기존에 입력한 자소서, 이력서, JD를 조합하거나 새 자료를 바로 추가할 수 있습니다.</p>
        </div>
        <span className={`analysis-status-chip ${canAnalyze ? '' : 'warning'}`}>
          {canAnalyze ? '분석 가능' : 'JD · 이력서 필요'}
        </span>
      </div>

      {error && <p className="analysis-error-msg">{error}</p>}

      <section className="analysis-source-grid" aria-label="분석 자료 선택">
        <SourceCard
          title="JD 선택"
          description="지원할 공고를 선택하거나 새 JD를 추가하세요."
          addLabel="신규 JD 추가"
          items={lists.jd}
          selectedId={selected.jd}
          getId={(i) => i.jd_id}
          getTitle={(i) => `${i.company_name} ${i.position}`}
          getMeta={(i) => `${formatDate(i.created_at)}`}
          onSelect={(id) => setSelected((prev) => ({ ...prev, jd: id }))}
          onAdd={() => setModalType('jd')}
        />
        <SourceCard
          title="이력서 선택"
          description="분석 기준이 될 이력서 버전을 고르세요."
          addLabel="신규 이력서 추가"
          items={lists.resume}
          selectedId={selected.resume}
          getId={(i) => i.resume_id}
          getTitle={(i) => i.name}
          getMeta={(i) => {
            const tags = []
            if (i.has_education) tags.push('학력')
            if (i.has_career) tags.push('경력')
            if (i.has_skills) tags.push('기술')
            if (i.has_certificates) tags.push('자격증')
            const detail = tags.length ? tags.join(' · ') : '기본 정보만 입력됨'
            return `${detail} | 수정 ${formatDate(i.updated_at)}`
          }}
          onSelect={(id) => setSelected((prev) => ({ ...prev, resume: id }))}
          onAdd={() => setModalType('resume')}
        />
        <SourceCard
          title="자소서 선택"
          description="기업/직무에 맞춘 자기소개서를 선택하세요."
          addLabel="신규 자소서 추가"
          items={lists.coverLetter}
          selectedId={selected.coverLetter}
          getId={(i) => i.cover_letter_id}
          getTitle={(i) => i.title}
          getMeta={(i) => i.company_name || `등록일 ${formatDate(i.created_at)}`}
          onSelect={(id) => setSelected((prev) => ({ ...prev, coverLetter: id }))}
          onAdd={() => setModalType('coverLetter')}
        />
      </section>

      <section className="analysis-card ready-summary" aria-label="분석 준비 요약">
        <div>
          <h2>분석 준비 요약</h2>
          <dl>
            {summaryLabels.map((item) => (
              <div key={item.label}>
                <dt>{item.label}</dt>
                <dd>{item.value ? item.display(item.value) : '선택되지 않음'}</dd>
              </div>
            ))}
          </dl>
        </div>
        <span className={`analysis-status-chip ${canAnalyze ? '' : 'warning'}`}>
          {canAnalyze ? '분석 가능' : '자료 부족'}
        </span>
        <button
          className="analysis-primary-button large"
          type="button"
          disabled={!canAnalyze || analyzing}
          onClick={handleStartAnalysis}
        >
          {analyzing ? (
            <><Loader2 size={15} className="analysis-spin" /> 분석 시작 중...</>
          ) : 'AI 분석 시작하기'}
        </button>
      </section>

      {modalType === 'jd' && (
        <JdModal
          onClose={() => setModalType('')}
          onSaved={handleModalSaved}
        />
      )}
      {modalType === 'resume' && (
        <ResumeModal
          onClose={() => setModalType('')}
          onSaved={handleModalSaved}
        />
      )}
      {modalType === 'coverLetter' && (
        <CoverLetterModal
          onClose={() => setModalType('')}
          onSaved={handleModalSaved}
        />
      )}
    </>
  )
}

function SourceCard({ title, description, addLabel, items, selectedId, getId, getTitle, getMeta, onSelect, onAdd }) {
  return (
    <article className="analysis-card source-card">
      <h2>{title}</h2>
      <p>{description}</p>
      <div className="source-options">
        {items.length === 0 && (
          <p className="source-empty-msg">등록된 자료가 없습니다.</p>
        )}
        {items.map((item) => {
          const id = getId(item)
          const isSelected = selectedId === id
          return (
            <button
              className={`source-option ${isSelected ? 'selected' : ''}`}
              key={id}
              type="button"
              onClick={() => onSelect(id)}
            >
              <span className="source-option-copy">
                <strong>{getTitle(item)}</strong>
                <small>{getMeta(item)}</small>
              </span>
              <span className="source-radio" aria-hidden="true" />
            </button>
          )
        })}
      </div>
      <button className="analysis-outline-button full" type="button" onClick={onAdd}>
        <Plus size={15} />
        {addLabel}
      </button>
    </article>
  )
}

const JD_STEPS = [
  {
    title: '기본 정보',
    description: '회사명, 직무명, 직무 카테고리와 경력 구분을 입력하세요.',
    fields: [
      { key: 'company_name', label: '회사명', placeholder: '예: 토스', half: true, required: true },
      { key: 'position', label: '직무명', placeholder: '예: Backend Engineer', half: true, required: true },
      { key: 'job_category', label: '직무 카테고리', placeholder: '예: 백엔드 개발자', half: true },
      { key: 'experience_level', label: '경력 구분', type: 'select', options: ['', '신입', '경력', '신입/경력', '무관'], half: true },
    ],
  },
  {
    title: '기술스택',
    description: '필요한 기술 스택을 쉼표로 구분하여 입력하세요.',
    fields: [
      { key: 'tech_input', label: '기술스택', placeholder: '예: Python, Django, PostgreSQL, Docker, Redis' },
    ],
  },
  {
    title: '업무 내용',
    description: '주요 업무와 자격 요건을 작성하세요.',
    fields: [
      { key: 'main_tasks', label: '주요업무', placeholder: '담당하게 될 주요 업무를 입력하세요.', textarea: true },
      { key: 'requirements', label: '자격요건', placeholder: '지원에 필요한 요건을 입력하세요.', textarea: true },
    ],
  },
  {
    title: '추가 정보',
    description: '우대사항과 추가 설명을 입력하세요.',
    fields: [
      { key: 'preferences', label: '우대사항', placeholder: '우대하는 역량이나 경험을 입력하세요.', textarea: true },
      { key: 'jd_text', label: '추가 설명', placeholder: '공고에서 추가로 전달하고 싶은 내용을 자유롭게 입력하세요.', textarea: true },
    ],
  },
]

function JdModal({ onClose, onSaved }) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const current = JD_STEPS[step]
  const isLast = step === JD_STEPS.length - 1
  const isFirst = step === 0

  const handleChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const validateStep = () => {
    const missing = current.fields.find((f) => f.required && !form[f.key]?.trim())
    if (missing) {
      setError(`${missing.label}을(를) 입력해주세요.`)
      return false
    }
    setError('')
    return true
  }

  const handleNext = () => {
    if (!validateStep()) return
    setStep((s) => s + 1)
  }

  const handlePrev = () => {
    setError('')
    setStep((s) => s - 1)
  }

  const handleSubmit = async () => {
    setError('')
    setSubmitting(true)
    try {
      const techStacks = (form.tech_input || '').split(',').map((s) => s.trim()).filter(Boolean)
      const res = await createJd({
        company_name: form.company_name,
        position: form.position,
        job_category: form.job_category || '',
        experience_level: form.experience_level || '',
        tech_stacks: techStacks,
        main_tasks: form.main_tasks || '',
        requirements: form.requirements || '',
        preferences: form.preferences || '',
        jd_text: form.jd_text || '',
        input_method: 'TEXT',
      })
      onSaved('jd', res.data.jd_id)
    } catch (e) {
      const msg = e.response?.data
      setError(typeof msg === 'string' ? msg : '저장 중 오류가 발생했습니다.')
      setSubmitting(false)
    }
  }

  return (
    <div className="analysis-modal-backdrop" role="presentation">
      <section className="analysis-modal" role="dialog" aria-modal="true" aria-labelledby="jd-modal-title">
        <header>
          <div>
            <div className="jd-steps-indicator" aria-label={`${step + 1}단계 / ${JD_STEPS.length}단계`}>
              {JD_STEPS.map((_, i) => (
                <span key={i} className={`jd-step-dot ${i === step ? 'active' : ''}`} />
              ))}
            </div>
            <h2 id="jd-modal-title">{current.title}</h2>
            <p>{current.description}</p>
          </div>
          <button className="modal-close-button" type="button" onClick={onClose} aria-label="닫기">
            <X size={18} />
          </button>
        </header>
        <form className="analysis-modal-form" onSubmit={(e) => e.preventDefault()}>
          {current.fields.map((field) => (
            <label className={field.half ? 'half' : ''} key={field.key}>
              <span>{field.label}{field.required && <em className="required-mark"> *</em>}</span>
              {field.type === 'select' ? (
                <select
                  value={form[field.key] || ''}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                >
                  {field.options.map((opt) => (
                    <option key={opt} value={opt}>{opt || '선택 안함'}</option>
                  ))}
                </select>
              ) : field.textarea ? (
                <textarea
                  placeholder={field.placeholder}
                  value={form[field.key] || ''}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                />
              ) : (
                <input
                  placeholder={field.placeholder}
                  value={form[field.key] || ''}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                />
              )}
            </label>
          ))}
          {error && <p className="analysis-error-msg">{error}</p>}
          <footer>
            {isFirst ? (
              <button className="analysis-secondary-button" type="button" onClick={onClose}>
                취소
              </button>
            ) : (
              <button className="analysis-secondary-button" type="button" onClick={handlePrev} disabled={submitting}>
                <ChevronLeft size={15} /> 이전
              </button>
            )}
            {isLast ? (
              <button className="analysis-primary-button" type="button" onClick={handleSubmit} disabled={submitting}>
                {submitting ? '저장 중...' : '저장하고 선택'}
              </button>
            ) : (
              <button className="analysis-primary-button" type="button" onClick={handleNext}>
                다음 <ChevronRight size={15} />
              </button>
            )}
          </footer>
        </form>
      </section>
    </div>
  )
}

// ── 이력서 다단계 모달 ──────────────────────────────────────────────────────

const RESUME_STEPS = [
  { title: '기본 정보', description: '이름과 연락처 등 기본 정보를 입력하세요.' },
  { title: '학력', description: '학력을 추가하세요. (선택 사항)' },
  { title: '경력', description: '경력을 추가하세요. (선택 사항)' },
  { title: '기술', description: '보유 기술을 입력하세요. (선택 사항)' },
  { title: '자격증', description: '자격증을 추가하세요. (선택 사항)' },
]

const DEGREE_OPTIONS = [
  { value: 'high_school', label: '고등학교' },
  { value: 'associate', label: '전문학사' },
  { value: 'bachelor', label: '학사' },
  { value: 'master', label: '석사' },
  { value: 'doctor', label: '박사' },
]

const EDU_STATUS_OPTIONS = [
  { value: 'graduated', label: '졸업' },
  { value: 'enrolled', label: '재학중' },
  { value: 'leave_of_absence', label: '휴학' },
  { value: 'dropped_out', label: '중퇴' },
]

const EMPTY_EDU = () => ({ school_name: '', major: '', degree: 'bachelor', start_date: '', end_date: '', status: 'graduated' })
const EMPTY_CAREER = () => ({ company_name: '', position: '', start_date: '', end_date: '', is_current: false, description: '' })
const EMPTY_CERT = () => ({ name: '', issued_by: '', issued_at: '' })

function ResumeModal({ onClose, onSaved }) {
  const [step, setStep] = useState(0)
  const [basic, setBasic] = useState({ name: '', phone: '', email: '', address: '', github_url: '' })
  const [educations, setEducations] = useState([])
  const [careers, setCareers] = useState([])
  const [skillInput, setSkillInput] = useState('')
  const [certificates, setCertificates] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const isFirst = step === 0
  const isLast = step === RESUME_STEPS.length - 1
  const current = RESUME_STEPS[step]

  const handleNext = () => {
    if (step === 0 && !basic.name.trim()) {
      setError('이력서 제목을 입력해주세요.')
      return
    }
    setError('')
    setStep((s) => s + 1)
  }

  const handlePrev = () => { setError(''); setStep((s) => s - 1) }

  const handleSubmit = async () => {
    setError('')
    setSubmitting(true)
    const skills = skillInput.split(',').map((s) => s.trim()).filter(Boolean)
    try {
      const res = await createResume({
        name: basic.name,
        phone: basic.phone || '',
        email: basic.email || '',
        address: basic.address || '',
        github_url: basic.github_url || '',
        original_text: '',
        education: educations.filter((e) => e.school_name.trim()),
        careers: careers.filter((c) => c.company_name.trim() && c.position.trim()),
        skills,
        certificates: certificates.filter((c) => c.name.trim()),
      })
      onSaved('resume', res.data.resume_id)
    } catch (e) {
      const msg = e.response?.data
      setError(typeof msg === 'string' ? msg : '저장 중 오류가 발생했습니다.')
      setSubmitting(false)
    }
  }

  return (
    <div className="analysis-modal-backdrop" role="presentation">
      <section className="analysis-modal" role="dialog" aria-modal="true" aria-labelledby="resume-modal-title">
        <header>
          <div>
            <div className="jd-steps-indicator" aria-label={`${step + 1}단계 / ${RESUME_STEPS.length}단계`}>
              {RESUME_STEPS.map((_, i) => (
                <span key={i} className={`jd-step-dot ${i === step ? 'active' : ''}`} />
              ))}
            </div>
            <h2 id="resume-modal-title">{current.title}</h2>
            <p>{current.description}</p>
          </div>
          <button className="modal-close-button" type="button" onClick={onClose} aria-label="닫기">
            <X size={18} />
          </button>
        </header>

        <form className="analysis-modal-form" onSubmit={(e) => e.preventDefault()}>
          {step === 0 && (
            <>
              <label>
                <span>이력서 제목<em className="required-mark"> *</em></span>
                <input placeholder="예: 백엔드 이력서 v1" value={basic.name} onChange={(e) => setBasic((p) => ({ ...p, name: e.target.value }))} />
              </label>
              <label className="half">
                <span>이메일</span>
                <input placeholder="example@email.com" value={basic.email} onChange={(e) => setBasic((p) => ({ ...p, email: e.target.value }))} />
              </label>
              <label className="half">
                <span>연락처</span>
                <input placeholder="010-0000-0000" value={basic.phone} onChange={(e) => setBasic((p) => ({ ...p, phone: e.target.value }))} />
              </label>
              <label>
                <span>주소</span>
                <input placeholder="예: 서울시 강남구" value={basic.address} onChange={(e) => setBasic((p) => ({ ...p, address: e.target.value }))} />
              </label>
              <label>
                <span>GitHub URL</span>
                <input placeholder="https://github.com/username" value={basic.github_url} onChange={(e) => setBasic((p) => ({ ...p, github_url: e.target.value }))} />
              </label>
            </>
          )}

          {step === 1 && (
            <div className="cl-items-section">
              {educations.map((edu, i) => (
                <div key={i} className="cl-item-block">
                  <div className="cl-item-header">
                    <span className="cl-item-label">학력 {i + 1}</span>
                    <button className="cl-item-remove" type="button" onClick={() => setEducations((p) => p.filter((_, idx) => idx !== i))} aria-label={`학력 ${i + 1} 삭제`}>
                      <X size={14} />
                    </button>
                  </div>
                  <label>
                    <span>학교명<em className="required-mark"> *</em></span>
                    <input placeholder="예: 한국대학교" value={edu.school_name} onChange={(e) => setEducations((p) => p.map((item, idx) => idx === i ? { ...item, school_name: e.target.value } : item))} />
                  </label>
                  <label className="half">
                    <span>전공</span>
                    <input placeholder="예: 컴퓨터공학" value={edu.major} onChange={(e) => setEducations((p) => p.map((item, idx) => idx === i ? { ...item, major: e.target.value } : item))} />
                  </label>
                  <label className="half">
                    <span>학위</span>
                    <select value={edu.degree} onChange={(e) => setEducations((p) => p.map((item, idx) => idx === i ? { ...item, degree: e.target.value } : item))}>
                      {DEGREE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </label>
                  <label className="half">
                    <span>입학년월</span>
                    <input placeholder="예: 2018-03" value={edu.start_date} onChange={(e) => setEducations((p) => p.map((item, idx) => idx === i ? { ...item, start_date: e.target.value } : item))} />
                  </label>
                  <label className="half">
                    <span>졸업년월</span>
                    <input placeholder="예: 2022-02" value={edu.end_date} onChange={(e) => setEducations((p) => p.map((item, idx) => idx === i ? { ...item, end_date: e.target.value } : item))} />
                  </label>
                  <label className="half">
                    <span>상태</span>
                    <select value={edu.status} onChange={(e) => setEducations((p) => p.map((item, idx) => idx === i ? { ...item, status: e.target.value } : item))}>
                      {EDU_STATUS_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </label>
                </div>
              ))}
              <button className="analysis-outline-button full" type="button" onClick={() => setEducations((p) => [...p, EMPTY_EDU()])}>
                <Plus size={15} /> 학력 추가
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="cl-items-section">
              {careers.map((career, i) => (
                <div key={i} className="cl-item-block">
                  <div className="cl-item-header">
                    <span className="cl-item-label">경력 {i + 1}</span>
                    <button className="cl-item-remove" type="button" onClick={() => setCareers((p) => p.filter((_, idx) => idx !== i))} aria-label={`경력 ${i + 1} 삭제`}>
                      <X size={14} />
                    </button>
                  </div>
                  <label className="half">
                    <span>회사명<em className="required-mark"> *</em></span>
                    <input placeholder="예: 카카오" value={career.company_name} onChange={(e) => setCareers((p) => p.map((item, idx) => idx === i ? { ...item, company_name: e.target.value } : item))} />
                  </label>
                  <label className="half">
                    <span>직무/직책<em className="required-mark"> *</em></span>
                    <input placeholder="예: 백엔드 개발자" value={career.position} onChange={(e) => setCareers((p) => p.map((item, idx) => idx === i ? { ...item, position: e.target.value } : item))} />
                  </label>
                  <label className="half">
                    <span>시작년월</span>
                    <input placeholder="예: 2022-01" value={career.start_date} onChange={(e) => setCareers((p) => p.map((item, idx) => idx === i ? { ...item, start_date: e.target.value } : item))} />
                  </label>
                  <label className="half">
                    <span>종료년월</span>
                    <input placeholder="예: 2024-06 또는 재직중" value={career.end_date} disabled={career.is_current} onChange={(e) => setCareers((p) => p.map((item, idx) => idx === i ? { ...item, end_date: e.target.value } : item))} />
                  </label>
                  <label style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
                    <input type="checkbox" checked={career.is_current} onChange={(e) => setCareers((p) => p.map((item, idx) => idx === i ? { ...item, is_current: e.target.checked, end_date: e.target.checked ? '' : item.end_date } : item))} />
                    <span>현재 재직중</span>
                  </label>
                  <label>
                    <span>업무 내용</span>
                    <textarea placeholder="담당한 주요 업무와 성과를 입력하세요." value={career.description} onChange={(e) => setCareers((p) => p.map((item, idx) => idx === i ? { ...item, description: e.target.value } : item))} />
                  </label>
                </div>
              ))}
              <button className="analysis-outline-button full" type="button" onClick={() => setCareers((p) => [...p, EMPTY_CAREER()])}>
                <Plus size={15} /> 경력 추가
              </button>
            </div>
          )}

          {step === 3 && (
            <label>
              <span>보유 기술 (쉼표로 구분)</span>
              <textarea
                placeholder="예: Python, Django, PostgreSQL, Docker, React, Git"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                rows={4}
              />
            </label>
          )}

          {step === 4 && (
            <div className="cl-items-section">
              {certificates.map((cert, i) => (
                <div key={i} className="cl-item-block">
                  <div className="cl-item-header">
                    <span className="cl-item-label">자격증 {i + 1}</span>
                    <button className="cl-item-remove" type="button" onClick={() => setCertificates((p) => p.filter((_, idx) => idx !== i))} aria-label={`자격증 ${i + 1} 삭제`}>
                      <X size={14} />
                    </button>
                  </div>
                  <label>
                    <span>자격증명<em className="required-mark"> *</em></span>
                    <input placeholder="예: 정보처리기사" value={cert.name} onChange={(e) => setCertificates((p) => p.map((item, idx) => idx === i ? { ...item, name: e.target.value } : item))} />
                  </label>
                  <label className="half">
                    <span>발급 기관</span>
                    <input placeholder="예: 한국산업인력공단" value={cert.issued_by} onChange={(e) => setCertificates((p) => p.map((item, idx) => idx === i ? { ...item, issued_by: e.target.value } : item))} />
                  </label>
                  <label className="half">
                    <span>취득년월</span>
                    <input placeholder="예: 2023-06" value={cert.issued_at} onChange={(e) => setCertificates((p) => p.map((item, idx) => idx === i ? { ...item, issued_at: e.target.value } : item))} />
                  </label>
                </div>
              ))}
              <button className="analysis-outline-button full" type="button" onClick={() => setCertificates((p) => [...p, EMPTY_CERT()])}>
                <Plus size={15} /> 자격증 추가
              </button>
            </div>
          )}

          {error && <p className="analysis-error-msg">{error}</p>}

          <footer>
            {isFirst ? (
              <button className="analysis-secondary-button" type="button" onClick={onClose}>취소</button>
            ) : (
              <button className="analysis-secondary-button" type="button" onClick={handlePrev} disabled={submitting}>
                <ChevronLeft size={15} /> 이전
              </button>
            )}
            {isLast ? (
              <button className="analysis-primary-button" type="button" onClick={handleSubmit} disabled={submitting}>
                {submitting ? '저장 중...' : '저장하고 선택'}
              </button>
            ) : (
              <button className="analysis-primary-button" type="button" onClick={handleNext}>
                다음 <ChevronRight size={15} />
              </button>
            )}
          </footer>
        </form>
      </section>
    </div>
  )
}

// ── 기타 모달 (레거시) ────────────────────────────────────────────────────────

const MODAL_CONFIGS = {
  resume: {
    title: '신규 이력서 추가',
    description: '새 이력서를 등록하고 JD 매칭 분석에 사용합니다.',
    fields: [
      { key: 'name', label: '이력서 제목', placeholder: '예: 백엔드 이력서 v4', required: true },
      { key: 'email', label: '이메일', placeholder: 'example@email.com', half: true },
      { key: 'phone', label: '연락처', placeholder: '010-0000-0000', half: true },
      { key: 'original_text', label: '이력서 내용', placeholder: '주요 경력, 프로젝트, 기술 스택을 입력하면 JD와의 매칭률을 계산합니다.', textarea: true },
    ],
  },
}

function ResourceModal({ type, onClose, onSaved }) {
  const config = MODAL_CONFIGS[type]
  const [form, setForm] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = async () => {
    setError('')
    const required = config.fields.filter((f) => f.required)
    const missing = required.find((f) => !form[f.key]?.trim())
    if (missing) {
      setError(`${missing.label}을(를) 입력해주세요.`)
      return
    }
    setSubmitting(true)
    try {
      let res
      if (type === 'resume') {
        res = await createResume({
          name: form.name,
          email: form.email || 'noreply@career.zip',
          phone: form.phone || '',
          original_text: form.original_text || '',
        })
        onSaved('resume', res.data.resume_id)
      }
    } catch (e) {
      const msg = e.response?.data
      setError(typeof msg === 'string' ? msg : '저장 중 오류가 발생했습니다.')
      setSubmitting(false)
    }
  }

  return (
    <div className="analysis-modal-backdrop" role="presentation">
      <section className="analysis-modal" role="dialog" aria-modal="true" aria-labelledby="analysis-modal-title">
        <header>
          <div>
            <h2 id="analysis-modal-title">{config.title}</h2>
            <p>{config.description}</p>
          </div>
          <button className="modal-close-button" type="button" onClick={onClose} aria-label="닫기">
            <X size={18} />
          </button>
        </header>
        <form className="analysis-modal-form" onSubmit={(e) => e.preventDefault()}>
          {config.fields.map((field) => (
            <label className={field.half ? 'half' : ''} key={field.key}>
              <span>{field.label}{field.required && <em className="required-mark"> *</em>}</span>
              {field.textarea ? (
                <textarea
                  placeholder={field.placeholder}
                  value={form[field.key] || ''}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                />
              ) : (
                <input
                  placeholder={field.placeholder}
                  value={form[field.key] || ''}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                />
              )}
            </label>
          ))}
          {error && <p className="analysis-error-msg">{error}</p>}
          <footer>
            <button className="analysis-secondary-button" type="button" onClick={onClose} disabled={submitting}>
              취소
            </button>
            <button className="analysis-primary-button" type="button" onClick={handleSubmit} disabled={submitting}>
              {submitting ? '저장 중...' : '저장하고 선택'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}

const EMPTY_ITEM = () => ({ question: '', answer_text: '', max_length: '' })

function CoverLetterModal({ onClose, onSaved }) {
  const [title, setTitle] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [items, setItems] = useState([EMPTY_ITEM()])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleItemChange = (index, field, value) => {
    setItems((prev) => prev.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  const addItem = () => setItems((prev) => [...prev, EMPTY_ITEM()])

  const removeItem = (index) => {
    if (items.length === 1) return
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    setError('')
    if (!title.trim()) {
      setError('자소서 제목을 입력해주세요.')
      return
    }
    const hasEmpty = items.some((it) => !it.question.trim() || !it.answer_text.trim())
    if (hasEmpty) {
      setError('모든 문항의 질문과 답변을 입력해주세요.')
      return
    }
    setSubmitting(true)
    try {
      const res = await createCoverLetter({
        title: title.trim(),
        company_name: companyName.trim(),
        items: items.map((it, i) => ({
          question: it.question.trim(),
          answer_text: it.answer_text.trim(),
          max_length: it.max_length ? Number(it.max_length) : null,
          order_index: i + 1,
        })),
      })
      onSaved('coverLetter', res.data.cover_letter_id)
    } catch (e) {
      const msg = e.response?.data
      setError(typeof msg === 'string' ? msg : '저장 중 오류가 발생했습니다.')
      setSubmitting(false)
    }
  }

  return (
    <div className="analysis-modal-backdrop" role="presentation">
      <section className="analysis-modal" role="dialog" aria-modal="true" aria-labelledby="cl-modal-title">
        <header>
          <div>
            <h2 id="cl-modal-title">신규 자소서 추가</h2>
            <p>자기소개서를 등록하고 JD/이력서와 함께 분석합니다.</p>
          </div>
          <button className="modal-close-button" type="button" onClick={onClose} aria-label="닫기">
            <X size={18} />
          </button>
        </header>
        <form className="analysis-modal-form" onSubmit={(e) => e.preventDefault()}>
          <label>
            <span>자소서 제목<em className="required-mark"> *</em></span>
            <input
              placeholder="예: 토스 서버 직무 자소서"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label>
            <span>대상 기업</span>
            <input
              placeholder="예: 토스"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </label>

          <div className="cl-items-section">
            {items.map((item, index) => (
              <div key={index} className="cl-item-block">
                <div className="cl-item-header">
                  <span className="cl-item-label">문항 {index + 1}</span>
                  {items.length > 1 && (
                    <button
                      className="cl-item-remove"
                      type="button"
                      onClick={() => removeItem(index)}
                      aria-label={`문항 ${index + 1} 삭제`}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <label>
                  <span>질문<em className="required-mark"> *</em></span>
                  <input
                    placeholder="예: 지원 동기를 작성해주세요."
                    value={item.question}
                    onChange={(e) => handleItemChange(index, 'question', e.target.value)}
                  />
                </label>
                <label>
                  <span>답변<em className="required-mark"> *</em></span>
                  <textarea
                    placeholder="문항 답변을 입력하면 AI가 JD 적합도와 보완 포인트를 분석합니다."
                    value={item.answer_text}
                    onChange={(e) => handleItemChange(index, 'answer_text', e.target.value)}
                  />
                </label>
                <label className="half">
                  <span>글자 수 제한 (선택)</span>
                  <input
                    type="number"
                    placeholder="예: 1000"
                    min="1"
                    value={item.max_length}
                    onChange={(e) => handleItemChange(index, 'max_length', e.target.value)}
                  />
                </label>
              </div>
            ))}
            <button
              className="analysis-outline-button full"
              type="button"
              onClick={addItem}
            >
              <Plus size={15} />
              문항 추가
            </button>
          </div>

          {error && <p className="analysis-error-msg">{error}</p>}
          <footer>
            <button className="analysis-secondary-button" type="button" onClick={onClose} disabled={submitting}>
              취소
            </button>
            <button className="analysis-primary-button" type="button" onClick={handleSubmit} disabled={submitting}>
              {submitting ? '저장 중...' : '저장하고 선택'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}

export default SourceSelectionPage
