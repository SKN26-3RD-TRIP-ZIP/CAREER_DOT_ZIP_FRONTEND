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
import {
  Alert,
  Button,
  Card,
  EmptyState,
  Field,
  LoadingState,
  StatusBadge,
  inputClass,
} from '../../components/ui/DemoLayout'

// ──────────────────────────────────────────────────────────────────────────────

// 입력 길이 제한 — 용도별 maxLength 값
const LIMIT = {
  name: 100,       // 회사명·직무명·제목·이름 등 짧은 한 줄 텍스트
  line: 300,       // 한 줄 문장 (자기소개서 질문 등)
  email: 254,
  phone: 20,
  url: 200,
  address: 200,
  tags: 500,       // 쉼표로 구분하는 목록 (기술스택/보유기술)
  text: 2000,      // 일반 서술형 textarea
  longText: 5000,  // 자기소개서 답변 등 긴 서술형
}

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

// 연락처 자동 하이픈 마스킹 (입력 중 숫자만 추출 후 '-' 삽입)
function formatPhone(raw) {
  const d = (raw || '').replace(/\D/g, '').slice(0, 11)
  if (d.startsWith('02')) {
    // 서울 지역번호(02): 02-XXX(X)-XXXX
    if (d.length <= 2) return d
    if (d.length <= 5) return `${d.slice(0, 2)}-${d.slice(2)}`
    if (d.length <= 9) return `${d.slice(0, 2)}-${d.slice(2, 5)}-${d.slice(5)}`
    return `${d.slice(0, 2)}-${d.slice(2, 6)}-${d.slice(6, 10)}`
  }
  // 휴대폰(010 등) 및 기타 3자리 국번: 0XX-XXX(X)-XXXX
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`
  if (d.length <= 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7, 11)}`
}

function SectionTitle({ kicker, title, description }) {
  return (
    <div>
      {kicker && <p className="text-xs font-black text-[#08CB00]">{kicker}</p>}
      <h2 className="mt-1 text-lg font-black text-[#000000]">{title}</h2>
      {description && <p className="mt-1 text-sm leading-6 text-[rgba(0,0,0,0.62)]">{description}</p>}
    </div>
  )
}

function SelectableItem({ selected, title, meta, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-lg border p-4 text-left transition ${
        selected
          ? 'border-[#253900] bg-[#08CB00] text-[#000000] shadow-[0_8px_18px_rgba(0,0,0,0.14)]'
          : 'border-[rgba(0,0,0,0.12)] bg-[#EEEEEE] text-[#000000] hover:border-[#253900]'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-sm font-black leading-5">{title}</p>
        {selected && <StatusBadge tone="success">선택됨</StatusBadge>}
      </div>
      {meta && <p className="mt-2 text-xs leading-5 text-[rgba(0,0,0,0.64)]">{meta}</p>}
    </button>
  )
}

function SourcePanel({ title, emptyTitle, emptyDescription, items, selectedId, getId, getTitle, getMeta, onSelect, onAdd }) {
  return (
    <section className="rounded-lg border border-[rgba(0,0,0,0.12)] p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm font-black text-[#253900]">{title}</p>
        <Button type="button" variant="ghost" onClick={onAdd} className="h-9 px-3 py-0 text-xs">
          <Plus size={14} /> 추가
        </Button>
      </div>
      {items.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
          {items.map((item) => {
            const id = getId(item)
            return (
              <SelectableItem
                key={id}
                selected={selectedId === id}
                title={getTitle(item)}
                meta={getMeta(item)}
                onClick={() => onSelect(id)}
              />
            )
          })}
        </div>
      )}
    </section>
  )
}

// ── 메인 페이지 ────────────────────────────────────────────────────────────────

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
      const res = await startAnalysis({
        jd_id: selected.jd,
        resume_id: selected.resume,
        cover_letter_id: selected.coverLetter || undefined,
        career_level: 'entry',
      })
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
  const selectedJd = lists.jd.find((i) => i.jd_id === selected.jd)
  const selectedResume = lists.resume.find((i) => i.resume_id === selected.resume)
  const selectedCoverLetter = lists.coverLetter.find((i) => i.cover_letter_id === selected.coverLetter)

  return (
    <>
      <header className="mb-6 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="mb-1 text-xs font-black uppercase tracking-wide text-[#08CB00]">AI 분석</p>
          <h1 className="text-2xl font-black tracking-tight text-[#253900] md:text-3xl">분석 자료 선택</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[rgba(0,0,0,0.65)]">
            기존에 입력한 자기소개서, 이력서, JD를 조합하거나 새 자료를 바로 추가할 수 있습니다.
          </p>
        </div>
        <Button type="button" variant="secondary" onClick={fetchLists} disabled={loading} className="shrink-0">
          목록 새로고침
        </Button>
      </header>

      {error && <Alert tone="danger" className="mb-6">{error}</Alert>}

      <Card className="overflow-hidden">
        <div className="border-b border-[rgba(0,0,0,0.10)] bg-[#253900] px-6 py-5 text-[#EEEEEE]">
          <p className="text-xs font-black text-[#08CB00]">Step 2</p>
          <h2 className="mt-1 text-2xl font-black">분석 자료 연결</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[rgba(238,238,238,0.78)]">
            JD와 이력서는 필수입니다. 자기소개서는 선택 사항으로 분석 정확도를 높여줍니다.
          </p>
        </div>

        {loading ? (
          <div className="p-6">
            <LoadingState title="자료 목록을 불러오는 중입니다" description="저장된 JD, 이력서, 자기소개서를 확인하고 있습니다." />
          </div>
        ) : (
          <div className="space-y-8 p-6">
            <section className="space-y-4">
              <SectionTitle
                kicker="Source"
                title="분석 자료 선택"
                description="면접 질문과 역량 분석의 기준이 될 자료를 선택합니다."
              />
              <div className="grid gap-4 lg:grid-cols-3">
                <SourcePanel
                  title="JD 선택"
                  emptyTitle="등록된 JD가 없습니다"
                  emptyDescription={"추가 버튼을 눌러\n 새 JD를 등록해주세요."}
                  items={lists.jd}
                  selectedId={selected.jd}
                  getId={(i) => i.jd_id}
                  getTitle={(i) => `${i.company_name} ${i.position}`}
                  getMeta={(i) => formatDate(i.created_at)}
                  onSelect={(id) => setSelected((prev) => ({ ...prev, jd: id }))}
                  onAdd={() => setModalType('jd')}
                />
                <SourcePanel
                  title="이력서 선택"
                  emptyTitle="등록된 이력서가 없습니다"
                  emptyDescription={"추가 버튼을 눌러\n새 이력서를 등록해주세요."}
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
                <SourcePanel
                  title="자기소개서 선택"
                  emptyTitle="등록된 자기소개서가 없습니다"
                  emptyDescription={"자기소개서는 선택 사항입니다.\n없어도 분석을 시작할 수 있습니다."}
                  items={lists.coverLetter}
                  selectedId={selected.coverLetter}
                  getId={(i) => i.cover_letter_id}
                  getTitle={(i) => i.title}
                  getMeta={(i) => i.company_name || `등록일 ${formatDate(i.created_at)}`}
                  onSelect={(id) => setSelected((prev) => ({ ...prev, coverLetter: id }))}
                  onAdd={() => setModalType('coverLetter')}
                />
              </div>
            </section>

            <section className="rounded-lg border border-[rgba(0,0,0,0.12)] bg-[#EEEEEE] p-4">
              <p className="text-sm font-black text-[#253900]">분석 준비 요약</p>
              <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-xs font-bold text-[#253900]">JD</dt>
                  <dd className="mt-1 font-semibold text-[#000000]">
                    {selectedJd ? `${selectedJd.company_name} · ${selectedJd.position}` : '선택되지 않음'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-bold text-[#253900]">이력서</dt>
                  <dd className="mt-1 font-semibold text-[#000000]">
                    {selectedResume ? selectedResume.name : '선택되지 않음'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-bold text-[#253900]">자기소개서</dt>
                  <dd className="mt-1 font-semibold text-[#000000]">
                    {selectedCoverLetter ? selectedCoverLetter.title : '선택 안 함'}
                  </dd>
                </div>
              </dl>
            </section>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[rgba(0,0,0,0.10)] pt-6">
              {!canAnalyze ? (
                <p className="text-xs text-[rgba(0,0,0,0.55)]">JD와 이력서를 선택해야 분석을 시작할 수 있습니다.</p>
              ) : (
                <span />
              )}
              <Button type="button" disabled={!canAnalyze || analyzing} onClick={handleStartAnalysis} className="min-w-36">
                {analyzing ? <><Loader2 size={15} className="animate-spin" /> 분석 시작 중...</> : 'AI 분석 시작하기'}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {modalType === 'jd' && <JdModal onClose={() => setModalType('')} onSaved={handleModalSaved} />}
      {modalType === 'resume' && <ResumeModal onClose={() => setModalType('')} onSaved={handleModalSaved} />}
      {modalType === 'coverLetter' && <CoverLetterModal onClose={() => setModalType('')} onSaved={handleModalSaved} />}
    </>
  )
}

// ── 공유 모달 컴포넌트 ─────────────────────────────────────────────────────────

function ModalBackdrop({ children }) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-6 bg-[rgba(0,0,0,0.45)] backdrop-blur-sm"
      role="presentation"
    >
      {children}
    </div>
  )
}

function ModalShell({ id, title, description, onClose, step, totalSteps, children }) {
  return (
    <section
      className="w-[min(600px,100%)] max-h-[calc(100vh-48px)] flex flex-col overflow-hidden rounded-2xl bg-[#EEEEEE] shadow-[0_24px_64px_rgba(0,0,0,0.22)]"
      role="dialog"
      aria-modal="true"
      aria-labelledby={id}
    >
      {/* 다크 헤더 */}
      <div className="shrink-0 bg-[#253900] px-6 py-5 text-[#EEEEEE] flex items-start justify-between gap-4">
        <div>
          {totalSteps != null && (
            <div className="flex items-center gap-1.5 mb-2">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-200 ${
                    i === step
                      ? 'w-[18px] rounded-[3px] bg-[#08CB00]'
                      : i < step
                        ? 'w-1.5 bg-[rgba(8,203,0,0.45)]'
                        : 'w-1.5 bg-[rgba(238,238,238,0.25)]'
                  }`}
                />
              ))}
            </div>
          )}
          <h2 id={id} className="text-xl font-black text-[#EEEEEE]">{title}</h2>
          <p className="mt-1 text-sm text-[rgba(238,238,238,0.72)]">{description}</p>
        </div>
        <button
          className="shrink-0 mt-0.5 inline-grid place-items-center w-8 h-8 rounded-full border border-[rgba(238,238,238,0.2)] text-[rgba(238,238,238,0.7)] hover:bg-[rgba(238,238,238,0.1)] transition"
          type="button"
          onClick={onClose}
          aria-label="닫기"
        >
          <X size={16} />
        </button>
      </div>
      {children}
    </section>
  )
}

function ModalFooter({ onClose, onPrev, onNext, onSubmit, isFirst, isLast, submitting }) {
  return (
    <div className="shrink-0 flex justify-between gap-3 px-6 py-4 border-t border-[rgba(0,0,0,0.08)]">
      {isFirst ? (
        <Button variant="secondary" type="button" onClick={onClose}>취소</Button>
      ) : (
        <Button variant="secondary" type="button" onClick={onPrev} disabled={submitting}>
          <ChevronLeft size={15} /> 이전
        </Button>
      )}
      {isLast ? (
        <Button type="button" onClick={onSubmit} disabled={submitting} className="min-w-32">
          {submitting ? '저장 중...' : '저장하고 선택'}
        </Button>
      ) : (
        <Button type="button" onClick={onNext}>
          다음 <ChevronRight size={15} />
        </Button>
      )}
    </div>
  )
}

// ── JD 다단계 모달 ─────────────────────────────────────────────────────────────

const JD_STEPS = [
  {
    title: '기본 정보',
    description: '회사명, 직무명, 직무 카테고리와 경력 구분을 입력하세요.',
    fields: [
      { key: 'company_name', label: '회사명', placeholder: '예: 토스', half: true, required: true, maxLength: LIMIT.name },
      { key: 'position', label: '직무명', placeholder: '예: Backend Engineer', half: true, required: true, maxLength: LIMIT.name },
      { key: 'job_category', label: '직무 카테고리', placeholder: '예: 백엔드 개발자', half: true, maxLength: LIMIT.name },
      { key: 'experience_level', label: '경력 구분', type: 'select', options: ['', '신입', '경력', '신입/경력', '무관'], half: true },
    ],
  },
  {
    title: '기술스택',
    description: '필요한 기술 스택을 쉼표로 구분하여 입력하세요.',
    fields: [{ key: 'tech_input', label: '기술스택', placeholder: '예: Python, Django, PostgreSQL, Docker, Redis', maxLength: LIMIT.tags }],
  },
  {
    title: '업무 내용',
    description: '주요 업무와 자격 요건을 작성하세요.',
    fields: [
      { key: 'main_tasks', label: '주요업무', placeholder: '담당하게 될 주요 업무를 입력하세요.', textarea: true, maxLength: LIMIT.text },
      { key: 'requirements', label: '자격요건', placeholder: '지원에 필요한 요건을 입력하세요.', textarea: true, maxLength: LIMIT.text },
    ],
  },
  {
    title: '추가 정보',
    description: '우대사항과 추가 설명을 입력하세요.',
    fields: [
      { key: 'preferences', label: '우대사항', placeholder: '우대하는 역량이나 경험을 입력하세요.', textarea: true, maxLength: LIMIT.text },
      { key: 'jd_text', label: '추가 설명', placeholder: '공고에서 추가로 전달하고 싶은 내용을 자유롭게 입력하세요.', textarea: true, maxLength: LIMIT.text },
    ],
  },
]

function renderStepFields(fields, form, handleChange) {
  const rows = []
  let i = 0
  while (i < fields.length) {
    const f = fields[i]
    if (f.half && fields[i + 1]?.half) {
      rows.push(
        <div key={`${f.key}-${fields[i + 1].key}`} className="grid grid-cols-2 gap-4">
          <StepField field={f} form={form} onChange={handleChange} />
          <StepField field={fields[i + 1]} form={form} onChange={handleChange} />
        </div>
      )
      i += 2
    } else {
      rows.push(<StepField key={f.key} field={f} form={form} onChange={handleChange} />)
      i += 1
    }
  }
  return rows
}

function StepField({ field, form, onChange }) {
  return (
    <Field label={field.label} required={field.required}>
      {field.type === 'select' ? (
        <select
          className={inputClass}
          value={form[field.key] || ''}
          onChange={(e) => onChange(field.key, e.target.value)}
        >
          {field.options.map((opt) => <option key={opt} value={opt}>{opt || '선택 안함'}</option>)}
        </select>
      ) : field.textarea ? (
        <textarea
          className={`${inputClass} min-h-[110px] resize-y py-3`}
          placeholder={field.placeholder}
          maxLength={field.maxLength}
          value={form[field.key] || ''}
          onChange={(e) => onChange(field.key, e.target.value)}
        />
      ) : (
        <input
          className={inputClass}
          placeholder={field.placeholder}
          maxLength={field.maxLength}
          value={form[field.key] || ''}
          onChange={(e) => onChange(field.key, e.target.value)}
        />
      )}
    </Field>
  )
}

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
    if (missing) { setError(`${missing.label}을(를) 입력해주세요.`); return false }
    setError(''); return true
  }

  const handleNext = () => { if (!validateStep()) return; setStep((s) => s + 1) }
  const handlePrev = () => { setError(''); setStep((s) => s - 1) }

  const handleSubmit = async () => {
    setError(''); setSubmitting(true)
    try {
      const techStacks = (form.tech_input || '').split(',').map((s) => s.trim()).filter(Boolean)
      const res = await createJd({
        company_name: form.company_name, position: form.position,
        job_category: form.job_category || '', experience_level: form.experience_level || '',
        tech_stacks: techStacks, main_tasks: form.main_tasks || '',
        requirements: form.requirements || '', preferences: form.preferences || '',
        jd_text: form.jd_text || '', input_method: 'TEXT',
      })
      onSaved('jd', res.data.jd_id)
    } catch (e) {
      const msg = e.response?.data
      setError(typeof msg === 'string' ? msg : '저장 중 오류가 발생했습니다.')
      setSubmitting(false)
    }
  }

  return (
    <ModalBackdrop>
      <ModalShell id="jd-modal-title" title={current.title} description={current.description} onClose={onClose} step={step} totalSteps={JD_STEPS.length}>
        <div className="overflow-y-auto flex-1">
          <div className="space-y-4 p-6">
            {renderStepFields(current.fields, form, handleChange)}
            {error && <Alert tone="danger">{error}</Alert>}
          </div>
        </div>
        <ModalFooter isFirst={isFirst} isLast={isLast} submitting={submitting} onClose={onClose} onPrev={handlePrev} onNext={handleNext} onSubmit={handleSubmit} />
      </ModalShell>
    </ModalBackdrop>
  )
}

// ── 이력서 다단계 모달 ──────────────────────────────────────────────────────────

const RESUME_STEPS = [
  { title: '기본 정보', description: '이름과 연락처 등 기본 정보를 입력하세요.' },
  { title: '학력', description: '학력을 추가하세요. (선택 사항)' },
  { title: '경력', description: '경력을 추가하세요. (선택 사항)' },
  { title: '기술', description: '보유 기술을 입력하세요. (선택 사항)' },
  { title: '자격증', description: '자격증을 추가하세요. (선택 사항)' },
]

const DEGREE_OPTIONS = [
  { value: 'high_school', label: '고등학교' }, { value: 'associate', label: '전문학사' },
  { value: 'bachelor', label: '학사' }, { value: 'master', label: '석사' }, { value: 'doctor', label: '박사' },
]
const EDU_STATUS_OPTIONS = [
  { value: 'graduated', label: '졸업' }, { value: 'enrolled', label: '재학중' },
  { value: 'leave_of_absence', label: '휴학' }, { value: 'dropped_out', label: '중퇴' },
]

const EMPTY_EDU = () => ({ school_name: '', major: '', degree: 'bachelor', start_date: '', end_date: '', status: 'graduated' })
const EMPTY_CAREER = () => ({ company_name: '', position: '', start_date: '', end_date: '', is_current: false, description: '' })
const EMPTY_CERT = () => ({ name: '', issued_by: '', issued_at: '' })

function SubBlock({ label, onRemove, removeLabel, children }) {
  return (
    <div className="rounded-lg border border-[rgba(0,0,0,0.10)] bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-black text-[#253900]">{label}</p>
        <button
          className="inline-grid place-items-center w-7 h-7 rounded-full border border-[rgba(0,0,0,0.12)] bg-[#EEEEEE] text-[rgba(0,0,0,0.55)] hover:bg-[rgba(0,0,0,0.06)] transition"
          type="button"
          onClick={onRemove}
          aria-label={removeLabel}
        >
          <X size={13} />
        </button>
      </div>
      {children}
    </div>
  )
}

// ── 연/월 선택기 (연도·월을 따로 이동) ──────────────────────────────────────────
const CURRENT_YEAR = new Date().getFullYear()
const YEAR_OPTIONS = Array.from({ length: 66 }, (_, i) => String(CURRENT_YEAR + 5 - i)) // 5년 후 ~ 60년 전
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'))

// value/onChange는 'YYYY-MM' 문자열 (둘 다 선택해야 값 확정, 미완성이면 '')
function MonthPicker({ value, onChange, disabled }) {
  const [year, setYear] = useState('')
  const [month, setMonth] = useState('')

  // 외부 value와 동기화 (초기 로드 / 외부에서 비워질 때). 부분 선택 중에는 value가
  // 그대로라 재동기화되지 않아 선택이 유지된다.
  useEffect(() => {
    const [vy = '', vm = ''] = (value || '').split('-')
    setYear(vy)
    setMonth(vm)
  }, [value])

  const handle = (ny, nm) => {
    setYear(ny)
    setMonth(nm)
    onChange(ny && nm ? `${ny}-${nm}` : '')
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      <select className={inputClass} value={year} disabled={disabled} onChange={(e) => handle(e.target.value, month)}>
        <option value="">연도</option>
        {YEAR_OPTIONS.map((y) => <option key={y} value={y}>{y}년</option>)}
      </select>
      <select className={inputClass} value={month} disabled={disabled} onChange={(e) => handle(year, e.target.value)}>
        <option value="">월</option>
        {MONTH_OPTIONS.map((m) => <option key={m} value={m}>{Number(m)}월</option>)}
      </select>
    </div>
  )
}

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
    if (step === 0 && !basic.name.trim()) { setError('이력서 제목을 입력해주세요.'); return }
    setError(''); setStep((s) => s + 1)
  }
  const handlePrev = () => { setError(''); setStep((s) => s - 1) }

  const handleSubmit = async () => {
    setError(''); setSubmitting(true)
    const skills = skillInput.split(',').map((s) => s.trim()).filter(Boolean)
    try {
      const res = await createResume({
        name: basic.name, phone: basic.phone || '', email: basic.email || '',
        address: basic.address || '', github_url: basic.github_url || '',
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

  const upd = (setter, i, patch) =>
    setter((p) => p.map((item, idx) => idx === i ? { ...item, ...patch } : item))

  return (
    <ModalBackdrop>
      <ModalShell id="resume-modal-title" title={current.title} description={current.description} onClose={onClose} step={step} totalSteps={RESUME_STEPS.length}>
        <div className="overflow-y-auto flex-1">
          <div className="space-y-4 p-6">

            {step === 0 && (
              <>
                <Field label="이력서 제목" required>
                  <input className={inputClass} maxLength={LIMIT.name} placeholder="예: 백엔드 이력서 v1" value={basic.name} onChange={(e) => setBasic((p) => ({ ...p, name: e.target.value }))} />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="이메일">
                    <input className={inputClass} maxLength={LIMIT.email} placeholder="example@email.com" value={basic.email} onChange={(e) => setBasic((p) => ({ ...p, email: e.target.value }))} />
                  </Field>
                  <Field label="연락처">
                    <input className={inputClass} type="tel" inputMode="numeric" maxLength={LIMIT.phone} placeholder="010-0000-0000" value={basic.phone} onChange={(e) => setBasic((p) => ({ ...p, phone: formatPhone(e.target.value) }))} />
                  </Field>
                </div>
                <Field label="주소">
                  <input className={inputClass} maxLength={LIMIT.address} placeholder="예: 서울시 강남구" value={basic.address} onChange={(e) => setBasic((p) => ({ ...p, address: e.target.value }))} />
                </Field>
                <Field label="GitHub URL">
                  <input className={inputClass} maxLength={LIMIT.url} placeholder="https://github.com/username" value={basic.github_url} onChange={(e) => setBasic((p) => ({ ...p, github_url: e.target.value }))} />
                </Field>
              </>
            )}

            {step === 1 && (
              <>
                {educations.map((edu, i) => (
                  <SubBlock key={i} label={`학력 ${i + 1}`} onRemove={() => setEducations((p) => p.filter((_, idx) => idx !== i))} removeLabel={`학력 ${i + 1} 삭제`}>
                    <Field label="학교명" required>
                      <input className={inputClass} maxLength={LIMIT.name} placeholder="예: 한국대학교" value={edu.school_name} onChange={(e) => upd(setEducations, i, { school_name: e.target.value })} />
                    </Field>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="전공">
                        <input className={inputClass} maxLength={LIMIT.name} placeholder="예: 컴퓨터공학" value={edu.major} onChange={(e) => upd(setEducations, i, { major: e.target.value })} />
                      </Field>
                      <Field label="학위">
                        <select className={inputClass} value={edu.degree} onChange={(e) => upd(setEducations, i, { degree: e.target.value })}>
                          {DEGREE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                      </Field>
                      <Field label="입학년월">
                        <MonthPicker value={edu.start_date} onChange={(v) => upd(setEducations, i, { start_date: v })} />
                      </Field>
                      <Field label="졸업년월">
                        <MonthPicker value={edu.end_date} onChange={(v) => upd(setEducations, i, { end_date: v })} />
                      </Field>
                    </div>
                    <Field label="상태">
                      <select className={inputClass} value={edu.status} onChange={(e) => upd(setEducations, i, { status: e.target.value })}>
                        {EDU_STATUS_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                    </Field>
                  </SubBlock>
                ))}
                <Button type="button" variant="secondary" className="w-full" onClick={() => setEducations((p) => [...p, EMPTY_EDU()])}>
                  <Plus size={15} /> 학력 추가
                </Button>
              </>
            )}

            {step === 2 && (
              <>
                {careers.map((career, i) => (
                  <SubBlock key={i} label={`경력 ${i + 1}`} onRemove={() => setCareers((p) => p.filter((_, idx) => idx !== i))} removeLabel={`경력 ${i + 1} 삭제`}>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="회사명" required>
                        <input className={inputClass} maxLength={LIMIT.name} placeholder="예: 카카오" value={career.company_name} onChange={(e) => upd(setCareers, i, { company_name: e.target.value })} />
                      </Field>
                      <Field label="직무/직책" required>
                        <input className={inputClass} maxLength={LIMIT.name} placeholder="예: 백엔드 개발자" value={career.position} onChange={(e) => upd(setCareers, i, { position: e.target.value })} />
                      </Field>
                      <Field label="시작년월">
                        <MonthPicker value={career.start_date} onChange={(v) => upd(setCareers, i, { start_date: v })} />
                      </Field>
                      <Field label="종료년월">
                        <MonthPicker value={career.end_date} disabled={career.is_current} onChange={(v) => upd(setCareers, i, { end_date: v })} />
                      </Field>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={career.is_current} onChange={(e) => upd(setCareers, i, { is_current: e.target.checked, end_date: e.target.checked ? '' : career.end_date })} />
                      <span className="text-sm font-bold text-[#253900]">현재 재직중</span>
                    </label>
                    <Field label="업무 내용">
                      <textarea className={`${inputClass} min-h-[80px] resize-y py-3`} maxLength={LIMIT.text} placeholder="담당한 주요 업무와 성과를 입력하세요." value={career.description} onChange={(e) => upd(setCareers, i, { description: e.target.value })} />
                    </Field>
                  </SubBlock>
                ))}
                <Button type="button" variant="secondary" className="w-full" onClick={() => setCareers((p) => [...p, EMPTY_CAREER()])}>
                  <Plus size={15} /> 경력 추가
                </Button>
              </>
            )}

            {step === 3 && (
              <Field label="보유 기술" hint="쉼표(,)로 구분해서 입력하세요.">
                <textarea
                  className={`${inputClass} min-h-[120px] resize-y py-3`}
                  maxLength={LIMIT.tags}
                  placeholder="예: Python, Django, PostgreSQL, Docker, React, Git"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                />
              </Field>
            )}

            {step === 4 && (
              <>
                {certificates.map((cert, i) => (
                  <SubBlock key={i} label={`자격증 ${i + 1}`} onRemove={() => setCertificates((p) => p.filter((_, idx) => idx !== i))} removeLabel={`자격증 ${i + 1} 삭제`}>
                    <Field label="자격증명" required>
                      <input className={inputClass} maxLength={LIMIT.name} placeholder="예: 정보처리기사" value={cert.name} onChange={(e) => upd(setCertificates, i, { name: e.target.value })} />
                    </Field>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="발급 기관">
                        <input className={inputClass} maxLength={LIMIT.name} placeholder="예: 한국산업인력공단" value={cert.issued_by} onChange={(e) => upd(setCertificates, i, { issued_by: e.target.value })} />
                      </Field>
                      <Field label="취득년월">
                        <MonthPicker value={cert.issued_at} onChange={(v) => upd(setCertificates, i, { issued_at: v })} />
                      </Field>
                    </div>
                  </SubBlock>
                ))}
                <Button type="button" variant="secondary" className="w-full" onClick={() => setCertificates((p) => [...p, EMPTY_CERT()])}>
                  <Plus size={15} /> 자격증 추가
                </Button>
              </>
            )}

            {error && <Alert tone="danger">{error}</Alert>}
          </div>
        </div>
        <ModalFooter isFirst={isFirst} isLast={isLast} submitting={submitting} onClose={onClose} onPrev={handlePrev} onNext={handleNext} onSubmit={handleSubmit} />
      </ModalShell>
    </ModalBackdrop>
  )
}

// ── 자기소개서 모달 ────────────────────────────────────────────────────────────────

const EMPTY_ITEM = () => ({ question: '', answer_text: '', max_length: '' })

function CoverLetterModal({ onClose, onSaved }) {
  const [title, setTitle] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [items, setItems] = useState([EMPTY_ITEM()])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleItemChange = (index, field, value) =>
    setItems((prev) => prev.map((item, i) => i === index ? { ...item, [field]: value } : item))
  const addItem = () => setItems((prev) => [...prev, EMPTY_ITEM()])
  const removeItem = (index) => {
    if (items.length === 1) return
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    setError('')
    if (!title.trim()) { setError('자기소개서 제목을 입력해주세요.'); return }
    if (items.some((it) => !it.question.trim() || !it.answer_text.trim())) {
      setError('모든 문항의 질문과 답변을 입력해주세요.'); return
    }
    setSubmitting(true)
    try {
      const res = await createCoverLetter({
        title: title.trim(), company_name: companyName.trim(),
        items: items.map((it, i) => ({
          question: it.question.trim(), answer_text: it.answer_text.trim(),
          max_length: it.max_length ? Number(it.max_length) : null, order_index: i + 1,
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
    <ModalBackdrop>
      <ModalShell id="cl-modal-title" title="신규 자기소개서 추가" description="자기소개서를 등록하고 JD/이력서와 함께 분석합니다." onClose={onClose}>
        <div className="overflow-y-auto flex-1">
          <div className="space-y-4 p-6">
            <div className="grid grid-cols-2 gap-4">
              <Field label="자기소개서 제목" required>
                <input className={inputClass} maxLength={LIMIT.name} placeholder="예: 토스 서버 직무 자기소개서" value={title} onChange={(e) => setTitle(e.target.value)} />
              </Field>
              <Field label="대상 기업">
                <input className={inputClass} maxLength={LIMIT.name} placeholder="예: 토스" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
              </Field>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <SubBlock
                  key={index}
                  label={`문항 ${index + 1}`}
                  onRemove={() => removeItem(index)}
                  removeLabel={`문항 ${index + 1} 삭제`}
                >
                  <Field label="질문" required>
                    <input className={inputClass} maxLength={LIMIT.line} placeholder="예: 지원 동기를 작성해주세요." value={item.question} onChange={(e) => handleItemChange(index, 'question', e.target.value)} />
                  </Field>
                  <Field label="답변" required>
                    <textarea className={`${inputClass} min-h-[120px] resize-y py-3`} maxLength={LIMIT.longText} placeholder="문항 답변을 입력하면 AI가 JD 적합도와 보완 포인트를 분석합니다." value={item.answer_text} onChange={(e) => handleItemChange(index, 'answer_text', e.target.value)} />
                  </Field>
                  <Field label="글자 수 제한" hint="선택 사항입니다.">
                    <input className={inputClass} type="number" placeholder="예: 1000" min="1" max={LIMIT.longText} value={item.max_length} onChange={(e) => handleItemChange(index, 'max_length', e.target.value)} />
                  </Field>
                </SubBlock>
              ))}
              <Button type="button" variant="secondary" className="w-full" onClick={addItem}>
                <Plus size={15} /> 문항 추가
              </Button>
            </div>

            {error && <Alert tone="danger">{error}</Alert>}
          </div>
        </div>
        <div className="shrink-0 flex justify-between gap-3 px-6 py-4 border-t border-[rgba(0,0,0,0.08)]">
          <Button variant="secondary" type="button" onClick={onClose} disabled={submitting}>취소</Button>
          <Button type="button" onClick={handleSubmit} disabled={submitting} className="min-w-32">
            {submitting ? '저장 중...' : '저장하고 선택'}
          </Button>
        </div>
      </ModalShell>
    </ModalBackdrop>
  )
}

export default SourceSelectionPage
