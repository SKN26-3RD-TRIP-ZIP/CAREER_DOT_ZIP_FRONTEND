import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Loader2, Target, Cpu, FileText, AlertTriangle, ChevronDown, RefreshCw, ThumbsUp, ThumbsDown } from 'lucide-react'
import { getAnalysisResult, getAnalysisStatus, getQuestions, generateQuestions, regenerateQuestions, submitQuestionFeedback } from '../../api/analysisApi'
import { analysisResult as mockData } from './analysisData'
import { Button, Card } from '../../components/ui/DemoLayout'

// ──────────────────────────────────────────────────────────────────────────────

function skillTone(value) {
  if (value >= 70) return 'positive'
  if (value >= 40) return 'warning'
  return 'danger'
}

function mapResult(data) {
  const matchScore = Math.round(data.match_score ?? 0)
  const techScore = Math.round(data.tech_score ?? 0)
  const clCount = (data.cl_points ?? []).length
  const gapCount = (data.weaknesses ?? []).length

  const metrics = [
    { label: 'JD 적합도', value: `${matchScore}%`, tone: matchScore >= 70 ? 'positive' : 'warning', icon: Target, desc: matchScore >= 70 ? '목표 수준 달성' : '보완 여지 있음' },
    { label: '기술 매칭률', value: `${techScore}%`, tone: techScore >= 70 ? 'positive' : 'warning', icon: Cpu, desc: techScore >= 70 ? '기술 스택 부합' : '일부 기술 부족' },
    { label: '자기소개서 포인트', value: `${clCount}건`, tone: 'positive', icon: FileText, desc: '강점으로 활용 가능' },
    { label: '우선 보완', value: `${gapCount}건`, tone: gapCount > 0 ? 'warning' : 'positive', icon: AlertTriangle, desc: gapCount > 0 ? '면접 전 준비 권장' : '보완 항목 없음' },
  ]

  const gap = data.gap ?? {}
  let skills = []
  if (Array.isArray(gap.tech_gap) && gap.tech_gap.length > 0) {
    skills = gap.tech_gap.slice(0, 6).map((item) => ({
      label: typeof item === 'string' ? item : (item.skill ?? item.keyword ?? String(item)),
      value: typeof item.score === 'number' ? Math.round(item.score) : 60,
    }))
  } else {
    const highScores = [94, 87, 81, 75, 68]
    const lowScores = [42, 35, 28]
    skills = [
      ...(data.matched_keywords ?? []).slice(0, 5).map((k, i) => ({ label: k, value: highScores[i] ?? 70 })),
      ...(data.unmatched_keywords ?? []).slice(0, 3).map((k, i) => ({ label: k, value: lowScores[i] ?? 35 })),
    ].slice(0, 6)
  }
  skills = skills.map((s) => ({ ...s, tone: skillTone(s.value) }))

  const keywords = [
    ...(data.matched_keywords ?? []).map((k) => ({ label: k, active: true })),
    ...(data.unmatched_keywords ?? []).map((k) => ({ label: k, active: false })),
  ]

  const sortedQuestions = [...(data.questions ?? [])].sort((a, b) => a.order - b.order)

  return {
    metrics,
    skills,
    keywords,
    strengths: data.strengths ?? [],
    gaps: data.weaknesses ?? [],
    actionItems: data.gap_message?.action_items ?? [],
    clPoints: data.cl_points ?? [],
    questions: sortedQuestions,
  }
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

// ──────────────────────────────────────────────────────────────────────────────

function ResultPage() {
  const location = useLocation()
  const sessionId = location.state?.sessionId
  const [status, setStatus] = useState(sessionId ? 'polling' : 'mock')
  const [result, setResult] = useState(null)
  const intervalRef = useRef(null)

  // 예상 질문 — 분석과 분리된 온디맨드 생성
  const [questions, setQuestions] = useState([])
  const [questionsState, setQuestionsState] = useState('idle') // idle | loading | ready
  const [questionsError, setQuestionsError] = useState('')
  const [genCount, setGenCount] = useState(0)
  const [maxGen, setMaxGen] = useState(3)
  const [feedback, setFeedback] = useState(null) // 'up' | 'down' | null

  useEffect(() => {
    if (!sessionId) return

    const MAX_POLL_MS = 10 * 60 * 1000 // 10분 초과 시 강제 종료
    const startTime = Date.now()

    const stopPolling = () => clearInterval(intervalRef.current)

    const poll = async () => {
      if (Date.now() - startTime > MAX_POLL_MS) {
        stopPolling()
        setStatus('failed')
        return
      }
      try {
        const res = await getAnalysisStatus(sessionId)
        if (res.data.status === 'ready') {
          stopPolling()
          try {
            const matchRes = await getAnalysisResult(sessionId)
            setResult(mapResult(matchRes.data))
            setStatus('ready')
          } catch {
            setStatus('failed')
          }
        } else if (res.data.status === 'failed') {
          stopPolling()
          setStatus('failed')
        }
      } catch {
        stopPolling()
        setStatus('failed')
      }
    }

    poll()
    intervalRef.current = setInterval(poll, 3000)
    return () => stopPolling()
  }, [sessionId])

  // 분석 완료 시 이미 생성된 질문이 있으면 가져온다 (생성은 하지 않음 → 버튼 노출)
  useEffect(() => {
    if (status !== 'ready' || !sessionId) return
    let cancelled = false
    getQuestions(sessionId)
      .then((res) => {
        if (cancelled) return
        setGenCount(res.data.generation_count ?? 0)
        setMaxGen(res.data.max_generations ?? 3)
        if (res.data.generated) {
          setQuestions(res.data.questions ?? [])
          setQuestionsState('ready')
        }
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [status, sessionId])

  // 최초 생성 / 재생성 공통 처리
  const runGenerate = async (isRegenerate) => {
    setQuestionsState('loading')
    setQuestionsError('')
    try {
      const res = isRegenerate
        ? await regenerateQuestions(sessionId)
        : await generateQuestions(sessionId)
      setQuestions(res.data.questions ?? [])
      setGenCount(res.data.generation_count ?? genCount)
      setMaxGen(res.data.max_generations ?? maxGen)
      setFeedback(null)            // 새 결과 → 피드백 초기화
      setQuestionsState('ready')
    } catch (err) {
      // 429 = 무료 재생성 횟수 소진
      if (err.response?.status === 429) {
        setGenCount(err.response.data.generation_count ?? maxGen)
        setQuestionsError(err.response.data.error || '재생성 횟수를 모두 사용했습니다.')
      } else {
        setQuestionsError('질문 생성에 실패했습니다. 다시 시도해주세요.')
      }
      setQuestionsState(questions.length ? 'ready' : 'idle')
    }
  }

  const handleFeedback = async (rating) => {
    setFeedback(rating)          // 낙관적 반영
    try {
      await submitQuestionFeedback(sessionId, rating)
    } catch {
      setFeedback(null)          // 실패 시 롤백
    }
  }

  if (status === 'polling') {
    return (
      <>
        <header className="mb-6">
          <p className="mb-1 text-xs font-black uppercase tracking-wide text-[#08CB00]">AI 분석</p>
          <h1 className="text-2xl font-black tracking-tight text-[#253900] md:text-3xl">분석 결과</h1>
        </header>
        <Card className="overflow-hidden">
          <div className="flex flex-col items-center justify-center gap-3 min-h-[360px] p-6 text-[rgba(0,0,0,0.6)] text-sm">
            <Loader2 size={32} className="animate-spin text-[#08CB00]" />
            <p className="m-0 font-black text-[#253900]">AI가 JD, 이력서, 자기소개서를 분석하고 있습니다.</p>
            <p className="m-0 text-xs">보통 30초~2분이 소요됩니다.</p>
          </div>
        </Card>
      </>
    )
  }

  if (status === 'failed') {
    return (
      <>
        <header className="mb-6">
          <p className="mb-1 text-xs font-black uppercase tracking-wide text-[#08CB00]">AI 분석</p>
          <h1 className="text-2xl font-black tracking-tight text-[#253900] md:text-3xl">분석 결과</h1>
        </header>
        <Card className="overflow-hidden">
          <div className="flex flex-col items-center justify-center gap-4 min-h-[360px] p-6">
            <p className="m-0 text-sm font-black text-[#000000]">분석 중 오류가 발생했습니다.</p>
            <Button as={Link} to="/analysis/source" variant="secondary">자료 다시 선택</Button>
          </div>
        </Card>
      </>
    )
  }

  const display = result ?? mapResult(mockData)

  return (
    <>
      {/* 페이지 헤더 */}
      <header className="mb-6 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="mb-1 text-xs font-black uppercase tracking-wide text-[#08CB00]">AI 분석</p>
          <h1 className="text-2xl font-black tracking-tight text-[#253900] md:text-3xl">분석 결과</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[rgba(0,0,0,0.65)]">
            AI가 JD, 이력서, 자기소개서의 간극을 분석했습니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button as={Link} to="/analysis/source" variant="secondary">자료 다시 선택</Button>
          <Button as={Link} to="/interview/setup">이 분석으로 면접 시작하기</Button>
        </div>
      </header>

      <Card className="overflow-hidden">
        {/* 다크 헤더 — 핵심 지표 요약 */}
        <div className="border-b border-[rgba(0,0,0,0.10)] bg-[#253900] px-6 py-5 text-[#EEEEEE]">
          <p className="text-xs font-black text-[#08CB00]">Analysis</p>
          <h2 className="mt-1 text-2xl font-black">분석 결과 요약</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {display.metrics.map((metric) => {
              const Icon = metric.icon
              return (
                <div key={metric.label} className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <Icon size={13} className="text-[#08CB00]" />
                    <p className="text-xs text-[rgba(238,238,238,0.65)]">{metric.label}</p>
                  </div>
                  <p className="text-2xl font-black text-[#08CB00]">{metric.value}</p>
                  <p className="text-xs text-[rgba(238,238,238,0.55)]">{metric.desc}</p>
                </div>
              )
            })}
          </div>
        </div>

        <div className="space-y-8 p-6">
          {/* 스킬 갭 + 키워드 */}
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="space-y-4">
              <SectionTitle kicker="Skills" title="스킬 갭 분석" description="JD 요구 기술 대비 현재 보유 수준을 시각화합니다." />
              <div className="rounded-lg border border-[rgba(0,0,0,0.12)] p-4 space-y-5">
                {display.skills.length === 0 ? (
                  <p className="text-sm text-[rgba(0,0,0,0.45)] text-center py-4">추출한 스킬 목록이 없습니다.</p>
                ) : display.skills.map((skill) => (
                  <div key={skill.label} className="grid items-center gap-3" style={{ gridTemplateColumns: '120px 1fr 36px' }}>
                    <span className="text-[13px] text-[#000000] truncate">{skill.label}</span>
                    <div className="h-2 overflow-hidden rounded-full bg-[rgba(0,0,0,0.08)]">
                      <span
                        className={`block h-full rounded-[inherit] transition-[width] duration-700 ${
                          skill.tone === 'positive' ? 'bg-[#08CB00]' : skill.tone === 'warning' ? 'bg-[#e59900]' : 'bg-[#e53935]'
                        }`}
                        style={{ width: `${skill.value}%` }}
                      />
                    </div>
                    <span className={`text-xs text-right font-bold ${
                      skill.tone === 'positive' ? 'text-[#08CB00]' : skill.tone === 'warning' ? 'text-[#e59900]' : 'text-[#e53935]'
                    }`}>
                      {skill.value}%
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <SectionTitle kicker="Keywords" title="키워드 추출" description="JD와 이력서에서 추출된 핵심 키워드입니다." />
              <div className="rounded-lg border border-[rgba(0,0,0,0.12)] p-4">
                {display.keywords.length === 0 ? (
                  <p className="text-sm text-[rgba(0,0,0,0.45)] text-center py-4">추출한 키워드 목록이 없습니다.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {display.keywords.map((keyword) => (
                      <span
                        key={keyword.label}
                        className={`inline-flex items-center justify-center rounded-full border text-xs px-3 py-1 font-bold ${
                          keyword.active
                            ? 'border-[#253900] bg-[#08CB00] text-[#000000]'
                            : 'border-[rgba(0,0,0,0.12)] bg-[#EEEEEE] text-[rgba(0,0,0,0.55)]'
                        }`}
                      >
                        {keyword.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* 강점 · 보완 포인트 */}
          <section className="space-y-4">
            <SectionTitle kicker="Insights" title="강점 · 보완 포인트" description="분석 결과를 기반으로 한 핵심 피드백입니다." />
            <div className="rounded-lg border border-[rgba(0,0,0,0.12)] overflow-hidden">
              <AccordionSection title="강점 분석" defaultOpen>
                <BulletList items={display.strengths} tone="positive" />
              </AccordionSection>
              <AccordionSection title="보완 필요">
                <BulletList items={display.gaps} tone="warning" />
              </AccordionSection>
              {display.actionItems.length > 0 && (
                <AccordionSection title="액션 아이템">
                  <BulletList items={display.actionItems} tone="action" />
                </AccordionSection>
              )}
              {display.clPoints.length > 0 && (
                <AccordionSection title="자기소개서 개선 포인트">
                  <BulletList items={display.clPoints} tone="positive" />
                </AccordionSection>
              )}
            </div>
          </section>

          {/* 예상 면접 질문 — 분석과 분리된 온디맨드 생성 */}
          <section className="space-y-4">
            <SectionTitle kicker="Questions" title="예상 면접 질문" description="버튼을 누르면 분석 결과를 바탕으로 맞춤 질문과 STAR 모범답변을 생성합니다." />
            {(() => {
              const isMock = status === 'mock'
              const shown = isMock ? display.questions : questions
              const hasQuestions = shown.length > 0
              const atLimit = genCount >= maxGen

              if (!hasQuestions) {
                return (
                  <div className="rounded-lg border border-dashed border-[rgba(0,0,0,0.2)] bg-[#EEEEEE] flex flex-col items-center gap-3 px-5 py-10 text-center">
                    <p className="m-0 max-w-md text-sm leading-6 text-[rgba(0,0,0,0.6)]">
                      분석 결과를 바탕으로 예상 면접 질문과 STAR 모범답변을 생성합니다. 수십 초 정도 걸릴 수 있어요.
                    </p>
                    <Button type="button" onClick={() => runGenerate(false)} disabled={questionsState === 'loading'} className="min-w-40">
                      {questionsState === 'loading'
                        ? <><Loader2 size={15} className="animate-spin" /> 생성 중...</>
                        : '예상 질문 생성'}
                    </Button>
                    {questionsError && <p className="m-0 text-xs text-[#e53935]">{questionsError}</p>}
                  </div>
                )
              }

              return (
                <>
                  <QuestionsList questions={shown} />
                  {!isMock && (
                    <>
                      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[rgba(0,0,0,0.12)] px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[rgba(0,0,0,0.55)]">이 질문이 도움이 되었나요?</span>
                          <button type="button" onClick={() => handleFeedback('up')} aria-label="만족"
                            className={`inline-grid place-items-center w-8 h-8 rounded-full border transition ${feedback === 'up' ? 'border-[#08CB00] bg-[rgba(8,203,0,0.12)] text-[#08CB00]' : 'border-[rgba(0,0,0,0.12)] text-[rgba(0,0,0,0.5)] hover:bg-[rgba(0,0,0,0.04)]'}`}>
                            <ThumbsUp size={14} />
                          </button>
                          <button type="button" onClick={() => handleFeedback('down')} aria-label="불만족"
                            className={`inline-grid place-items-center w-8 h-8 rounded-full border transition ${feedback === 'down' ? 'border-[#e53935] bg-[rgba(229,57,53,0.1)] text-[#e53935]' : 'border-[rgba(0,0,0,0.12)] text-[rgba(0,0,0,0.5)] hover:bg-[rgba(0,0,0,0.04)]'}`}>
                            <ThumbsDown size={14} />
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[rgba(0,0,0,0.45)]">생성 {genCount}/{maxGen}</span>
                          <Button type="button" variant="secondary" onClick={() => runGenerate(true)}
                            disabled={questionsState === 'loading' || atLimit}
                            className="h-9 px-3 py-0 text-xs">
                            {questionsState === 'loading'
                              ? <><Loader2 size={13} className="animate-spin" /> 생성 중...</>
                              : <><RefreshCw size={13} /> 다시 생성</>}
                          </Button>
                        </div>
                      </div>
                      {atLimit && (
                        <p className="m-0 text-xs text-[rgba(0,0,0,0.45)]">무료 재생성 횟수를 모두 사용했습니다.</p>
                      )}
                      {questionsError && <p className="m-0 text-xs text-[#e53935]">{questionsError}</p>}
                    </>
                  )}
                </>
              )
            })()}
          </section>

          {/* 하단 액션 */}
          <div className="flex flex-wrap justify-end gap-3 border-t border-[rgba(0,0,0,0.10)] pt-6">
            <Button as={Link} to="/analysis/source" variant="secondary">자료 다시 선택</Button>
            <Button as={Link} to="/interview/setup">이 분석으로 면접 시작하기</Button>
          </div>
        </div>
      </Card>
    </>
  )
}

function QuestionsList({ questions }) {
  if (!questions || questions.length === 0) {
    return (
      <div className="rounded-lg border border-[rgba(0,0,0,0.12)] px-4 py-8 text-center">
        <p className="m-0 text-sm text-[rgba(0,0,0,0.45)]">생성된 질문이 없습니다.</p>
      </div>
    )
  }
  return (
    <div className="rounded-lg border border-[rgba(0,0,0,0.12)] overflow-hidden">
      {questions.map((q, index) => (
        <AccordionSection key={q.id ?? index} title={q.question_text ?? q}>
          {q.answer ? (
            <StarAnswer answer={q.answer} questionType={q.question_type} />
          ) : (
            <p className="text-xs text-[rgba(0,0,0,0.45)] py-1">아직 준비된 답변이 없습니다.</p>
          )}
        </AccordionSection>
      ))}
    </div>
  )
}

function AccordionSection({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-[rgba(0,0,0,0.08)] last:border-b-0">
      <button
        type="button"
        className="flex items-center justify-between w-full px-4 py-3.5 bg-transparent border-0 cursor-pointer text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-sm font-black text-[#000000]">{title}</span>
        <ChevronDown
          size={16}
          className={`shrink-0 transition-transform duration-200 opacity-50 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="px-4 pb-4">
          {children}
        </div>
      )}
    </div>
  )
}

function BulletList({ items, tone }) {
  const dotColor =
    tone === 'positive' ? 'bg-[#08CB00]' : 'bg-[#253900]'
  return (
    <ul className="grid gap-2 m-0 list-none p-0 text-sm">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2 text-[rgba(0,0,0,0.80)] leading-6">
          <span className={`mt-2 w-1.5 h-1.5 shrink-0 rounded-full ${dotColor}`} aria-hidden="true" />
          {item}
        </li>
      ))}
    </ul>
  )
}

const STAR_LABELS = { summary: '요약', situation: '상황', task: '과제', action: '행동', result: '결과' }
const STAR_ORDER = ['summary', 'situation', 'task', 'action', 'result']

const TECH_LABELS = { summary: '요약', concept: '개념', experience: '적용 경험', tradeoff: '트레이드오프' }
const TECH_ORDER = ['summary', 'concept', 'experience', 'tradeoff']

function AnswerBlock({ fields, order, labels, answer }) {
  const unsupported =
    answer.groundedness?.grounded === false ? answer.groundedness.unsupported : null
  return (
    <div className="grid gap-2 p-3 rounded-lg border border-[#08CB00] bg-[rgba(8,203,0,0.06)]">
      {order.map((key) =>
        answer[key] ? (
          <div key={key} className="grid gap-2" style={{ gridTemplateColumns: '80px 1fr' }}>
            <span className="text-xs font-black text-[#253900]">▶ {labels[key]}</span>
            <p className="m-0 text-xs text-[#000000] leading-[1.6]">{answer[key]}</p>
          </div>
        ) : null
      )}
      {unsupported && unsupported.length > 0 && (
        <div className="mt-1 flex items-start gap-1.5 rounded-md bg-[rgba(229,57,53,0.08)] px-2.5 py-1.5">
          <span className="shrink-0 text-xs font-bold text-[#e53935]">⚠ 확인 필요</span>
          <p className="m-0 text-xs text-[rgba(0,0,0,0.7)] leading-[1.5]">
            이력서·자기소개서에서 확인되지 않은 수치입니다: {unsupported.join(', ')}. 실제 경험에 맞게 수정하세요.
          </p>
        </div>
      )}
    </div>
  )
}

function StarAnswer({ answer, questionType }) {
  if (questionType === 'technical') {
    return <AnswerBlock fields={TECH_LABELS} order={TECH_ORDER} labels={TECH_LABELS} answer={answer} />
  }
  return <AnswerBlock fields={STAR_LABELS} order={STAR_ORDER} labels={STAR_LABELS} answer={answer} />
}

export default ResultPage
