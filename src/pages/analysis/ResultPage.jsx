import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Loader2, Target, Cpu, FileText, AlertTriangle, ChevronDown } from 'lucide-react'
import { getAnalysisResult, getAnalysisStatus } from '../../api/analysisApi'
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
    { label: '자소서 포인트', value: `${clCount}건`, tone: 'positive', icon: FileText, desc: '강점으로 활용 가능' },
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

  useEffect(() => {
    if (!sessionId) return

    const startTime = Date.now()
    let pollCount = 0
    console.log('[Analysis] 폴링 시작 session_id:', sessionId, new Date().toISOString())

    const poll = async () => {
      pollCount += 1
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
      try {
        const res = await getAnalysisStatus(sessionId)
        console.log(`[Analysis] 폴링 #${pollCount} (${elapsed}s):`, res.data.status)
        if (res.data.status === 'ready') {
          clearInterval(intervalRef.current)
          try {
            const matchRes = await getAnalysisResult(sessionId)
            console.log('[Analysis] 결과 데이터:', matchRes.data)
            setResult(mapResult(matchRes.data))
            setStatus('ready')
          } catch (resultErr) {
            console.error('[Analysis] 결과 조회 에러:', resultErr)
            setStatus('failed')
          }
        } else if (res.data.status === 'failed') {
          clearInterval(intervalRef.current)
          setStatus('failed')
        }
      } catch (err) {
        clearInterval(intervalRef.current)
        console.error('[Analysis] 폴링 에러:', err)
        setStatus('failed')
      }
    }

    poll()
    intervalRef.current = setInterval(poll, 3000)
    return () => clearInterval(intervalRef.current)
  }, [sessionId])

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
            <p className="m-0 font-black text-[#253900]">AI가 JD, 이력서, 자소서를 분석하고 있습니다.</p>
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
            AI가 JD, 이력서, 자소서의 간극을 분석했습니다.
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

          {/* 인사이트 + 면접 질문 */}
          <div className="grid gap-6 lg:grid-cols-2 items-start">
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
                  <AccordionSection title="자소서 개선 포인트">
                    <BulletList items={display.clPoints} tone="positive" />
                  </AccordionSection>
                )}
              </div>
            </section>

            <section className="space-y-4">
              <SectionTitle kicker="Questions" title="생성된 면접 질문" description="분석 결과를 바탕으로 예상되는 면접 질문입니다." />
              <div className="rounded-lg border border-[rgba(0,0,0,0.12)] overflow-hidden">
                {display.questions.map((q, index) => (
                  <AccordionSection key={q.id ?? index} title={q.question_text ?? q}>
                    {q.answer ? (
                      <StarAnswer answer={q.answer} />
                    ) : (
                      <p className="text-xs text-[rgba(0,0,0,0.45)] py-1">아직 준비된 답변이 없습니다.</p>
                    )}
                  </AccordionSection>
                ))}
              </div>
            </section>
          </div>

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

function StarAnswer({ answer }) {
  const labels = { summary: '요약', situation: '상황', task: '과제', action: '행동', result: '결과' }
  return (
    <div className="grid gap-2 p-3 rounded-lg border border-[#08CB00] bg-[rgba(8,203,0,0.06)]">
      {Object.entries(answer).map(([key, value]) =>
        value ? (
          <div key={key} className="grid gap-2" style={{ gridTemplateColumns: '60px 1fr' }}>
            <span className="text-xs font-black text-[#253900]">▶ {labels[key] ?? key}</span>
            <p className="m-0 text-xs text-[#000000] leading-[1.6]">{value}</p>
          </div>
        ) : null
      )}
    </div>
  )
}

export default ResultPage
