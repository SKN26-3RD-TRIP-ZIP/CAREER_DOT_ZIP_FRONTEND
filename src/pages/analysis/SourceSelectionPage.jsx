import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Plus, X } from 'lucide-react'
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
          getMeta={(i) => `최종 수정 ${formatDate(i.updated_at)}`}
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

      {modalType && (
        <ResourceModal
          type={modalType}
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

const MODAL_CONFIGS = {
  jd: {
    title: '신규 JD 추가',
    description: '채용 공고를 등록하고 분석에 사용할 JD로 선택합니다.',
    fields: [
      { key: 'company_name', label: '회사명', placeholder: '예: 토스', half: true, required: true },
      { key: 'position', label: '직무명', placeholder: '예: Backend Engineer', half: true, required: true },
      { key: 'original_text', label: 'JD 내용', placeholder: '공고 설명, 주요 업무, 자격 요건을 붙여넣으면 AI가 핵심 역량을 추출합니다.', textarea: true },
    ],
  },
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
  coverLetter: {
    title: '신규 자소서 추가',
    description: '자기소개서를 등록하고 JD/이력서와 함께 분석합니다.',
    fields: [
      { key: 'title', label: '자소서 제목', placeholder: '예: 토스 서버 직무 자소서', required: true },
      { key: 'company_name', label: '대상 기업', placeholder: '예: 토스', half: true },
      { key: '_question', label: '문항', placeholder: '예: 지원 동기를 작성해주세요.', half: true },
      { key: '_answer_text', label: '답변 내용', placeholder: '문항 답변을 입력하면 AI가 JD 적합도와 보완 포인트를 분석합니다.', textarea: true },
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
      if (type === 'jd') {
        res = await createJd({
          company_name: form.company_name,
          position: form.position,
          original_text: form.original_text || ' ',
          input_method: 'TEXT',
        })
        onSaved('jd', res.data.jd_id)
      } else if (type === 'resume') {
        res = await createResume({
          name: form.name,
          email: form.email || 'noreply@career.zip',
          phone: form.phone || '',
          original_text: form.original_text || '',
        })
        onSaved('resume', res.data.resume_id)
      } else if (type === 'coverLetter') {
        res = await createCoverLetter({
          title: form.title,
          company_name: form.company_name || '',
          items: [
            {
              question: form._question || '지원 동기',
              answer_text: form._answer_text || '',
              order_index: 1,
            },
          ],
        })
        onSaved('coverLetter', res.data.cover_letter_id)
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

export default SourceSelectionPage
