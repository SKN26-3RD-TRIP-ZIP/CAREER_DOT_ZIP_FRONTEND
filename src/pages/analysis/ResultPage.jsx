import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Loader2, Target, Cpu, FileText, AlertTriangle } from 'lucide-react'
import { getAnalysisResult, getAnalysisStatus } from '../../api/analysisApi'
import { analysisResult as mockData } from './analysisData'
import './Analysis.css'

function skillTone(value) {
  if (value >= 70) return 'positive'
  if (value >= 40) return 'warning'
  return 'danger'
}

// Map API response → display-ready shape
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

  // Skills: use gap.tech_gap if available, otherwise approximate from keywords
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

function ResultPage({ expanded = false }) {
  const location = useLocation()
  const sessionId = location.state?.sessionId
  const [status, setStatus] = useState(sessionId ? 'polling' : 'mock')
  const [result, setResult] = useState(null)
  const [selectedQuestion, setSelectedQuestion] = useState(expanded ? 3 : null)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (!sessionId) return

    const startTime = Date.now()
    let pollCount = 0
    console.log('[Analysis] 폴링 시작 session_id:', sessionId, new Date().toISOString())

    const poll = async () => {
      pollCount += 1
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
      console.log(`[Analysis] 폴링 #${pollCount} (경과 ${elapsed}s) — status 확인 중...`)
      try {
        const res = await getAnalysisStatus(sessionId)
        console.log(`[Analysis] 폴링 #${pollCount} 응답:`, res.data.status)
        if (res.data.status === 'ready') {
          clearInterval(intervalRef.current)
          console.log(`[Analysis] ✅ 분석 완료! 총 ${elapsed}s 소요 (폴링 ${pollCount}회)`)
          const matchRes = await getAnalysisResult(sessionId)
          console.log('[Analysis] 결과 데이터 수신:', matchRes.data)
          setResult(mapResult(matchRes.data))
          setStatus('ready')
        } else if (res.data.status === 'failed') {
          clearInterval(intervalRef.current)
          console.error(`[Analysis] ❌ 분석 실패 (${elapsed}s 경과)`)
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
      <div className="analysis-loading tall">
        <Loader2 size={32} className="analysis-spin" />
        <p>AI가 JD, 이력서, 자소서를 분석하고 있습니다.</p>
        <small>보통 30초~2분이 소요됩니다.</small>
      </div>
    )
  }

  if (status === 'failed') {
    return (
      <div className="analysis-loading tall">
        <p className="analysis-error-msg">분석 중 오류가 발생했습니다.</p>
        <Link className="analysis-secondary-button" to="/analysis/source">자료 다시 선택</Link>
      </div>
    )
  }

  // Use real result or fall back to mock
  const display = result ?? mapResult(mockData)

  return (
    <>
      <div className="analysis-page-head compact">
        <h1>AI가 JD, 이력서, 자소서의 간극을 분석했습니다.</h1>
        <div className="result-actions-top">
          <Link className="analysis-secondary-button" to="/analysis/source">자료 다시 선택</Link>
          <Link className="analysis-primary-button" to="/interview/setup">이 분석으로 면접 시작하기</Link>
        </div>
      </div>

      <section className="metric-grid" aria-label="분석 지표">
        {display.metrics.map((metric) => {
          const Icon = metric.icon
          return (
            <article className="analysis-card metric-card" key={metric.label}>
              <div className="metric-header">
                <span>{metric.label}</span>
                <div className={`metric-icon-wrap ${metric.tone}`}>
                  <Icon size={16} />
                </div>
              </div>
              <strong className={metric.tone}>{metric.value}</strong>
              <p className="metric-desc">{metric.desc}</p>
            </article>
          )
        })}
      </section>

      <section className="result-main-grid">
        <article className="analysis-card skill-card">
          <h2>스킬 갭 분석</h2>
          <div className="skill-list">
            {display.skills.map((skill) => (
              <div className="skill-row" key={skill.label}>
                <span>{skill.label}</span>
                <div className="skill-track">
                  <i className={skill.tone} style={{ width: `${skill.value}%` }} />
                </div>
                <em className={skill.tone}>{skill.value}%</em>
              </div>
            ))}
          </div>
        </article>

        <article className="analysis-card keyword-card">
          <h2>키워드 추출</h2>
          <div className="keyword-list">
            {display.keywords.map((keyword) => (
              <span
                className={`analysis-pill-chip ${keyword.active ? 'active' : ''}`}
                key={keyword.label}
              >
                {keyword.label}
              </span>
            ))}
          </div>
        </article>
      </section>

      <section className="result-lower-grid">
        <article className="analysis-card insight-card">
          <h2>강점 분석</h2>
          <BulletList items={display.strengths} tone="positive" />
          <h2>보완 필요</h2>
          <BulletList items={display.gaps} tone="warning" />
          {display.actionItems.length > 0 && (
            <>
              <h2>액션 아이템</h2>
              <BulletList items={display.actionItems} tone="action" />
            </>
          )}
          {display.clPoints.length > 0 && (
            <>
              <h2>자소서 개선 포인트</h2>
              <BulletList items={display.clPoints} tone="positive" />
            </>
          )}
        </article>

        <article className="analysis-card question-card">
          <h2>예상 질문</h2>
          <div className="question-list">
            {display.questions.map((q, index) => (
              <div key={q.id ?? index}>
                <button
                  className={selectedQuestion === index ? 'selected' : ''}
                  type="button"
                  onClick={() => setSelectedQuestion(selectedQuestion === index ? null : index)}
                >
                  {q.question_text ?? q}
                </button>
                {selectedQuestion === index && q.answer && (
                  <StarAnswer answer={q.answer} />
                )}
                {selectedQuestion === index && !q.answer && (
                  <p className="no-answer-msg">아직 준비된 답변이 없습니다.</p>
                )}
              </div>
            ))}
          </div>
        </article>
      </section>

    </>
  )
}

function BulletList({ items, tone }) {
  return (
    <ul className={`analysis-bullet-list ${tone}`}>
      {items.map((item) => <li key={item}>{item}</li>)}
    </ul>
  )
}

function StarAnswer({ answer }) {
  const labels = {
    summary: '요약',
    situation: '상황',
    task: '과제',
    action: '행동',
    result: '결과',
  }
  return (
    <div className="star-answer">
      {Object.entries(answer).map(([key, value]) =>
        value ? (
          <div key={key}>
            <strong>{labels[key] ?? key}</strong>
            <p>{value}</p>
          </div>
        ) : null
      )}
    </div>
  )
}

export default ResultPage
