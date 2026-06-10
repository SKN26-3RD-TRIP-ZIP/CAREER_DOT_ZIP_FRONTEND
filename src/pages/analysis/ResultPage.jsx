import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { getAnalysisResult, getAnalysisStatus } from '../../api/analysisApi'
import { analysisResult as mockData } from './analysisData'
import './Analysis.css'

// Map API response → display-ready shape
function mapResult(data) {
  const matchScore = Math.round(data.match_score ?? 0)
  const techScore = Math.round(data.tech_score ?? 0)
  const clCount = (data.cl_points ?? []).length
  const gapCount = (data.weaknesses ?? []).length

  const metrics = [
    { label: 'JD 적합도', value: `${matchScore}%`, tone: matchScore >= 70 ? 'positive' : 'warning' },
    { label: '기술 매칭률', value: `${techScore}%`, tone: techScore >= 70 ? 'positive' : 'warning' },
    { label: '자소서 포인트', value: `${clCount}건`, tone: 'positive' },
    { label: '우선 보완', value: `${gapCount}건`, tone: gapCount > 0 ? 'warning' : 'positive' },
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

    const poll = async () => {
      try {
        const res = await getAnalysisStatus(sessionId)
        if (res.data.status === 'ready') {
          clearInterval(intervalRef.current)
          const matchRes = await getAnalysisResult(sessionId)
          setResult(mapResult(matchRes.data))
          setStatus('ready')
        } else if (res.data.status === 'failed') {
          clearInterval(intervalRef.current)
          setStatus('failed')
        }
      } catch {
        clearInterval(intervalRef.current)
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

  const selectedAnswer = selectedQuestion !== null ? display.questions[selectedQuestion]?.answer : null

  return (
    <>
      <div className="analysis-page-head compact">
        <div>
          <h1>AI가 JD, 이력서, 자소서의 간극을 분석했습니다.</h1>
        </div>
      </div>

      <section className="metric-grid" aria-label="분석 지표">
        {display.metrics.map((metric) => (
          <article className="analysis-card metric-card" key={metric.label}>
            <span>{metric.label}</span>
            <strong className={metric.tone}>{metric.value}</strong>
          </article>
        ))}
      </section>

      <section className="result-main-grid">
        <article className="analysis-card skill-card">
          <h2>스킬 갭 분석</h2>
          <div className="skill-list">
            {display.skills.map((skill) => (
              <div className="skill-row" key={skill.label}>
                <span>{skill.label}</span>
                <div className="skill-track"><i style={{ width: `${skill.value}%` }} /></div>
                <em>{skill.value}%</em>
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
              <button
                className={selectedQuestion === index ? 'selected' : ''}
                key={q.id ?? index}
                type="button"
                onClick={() => setSelectedQuestion(index)}
              >
                {q.question_text ?? q}
              </button>
            ))}
          </div>
          {selectedAnswer && <StarAnswer answer={selectedAnswer} />}
        </article>

        <aside className="result-actions">
          <Link className="analysis-primary-button tall" to="/interview/setup">이 분석으로 면접 시작하기</Link>
          <Link className="analysis-secondary-button tall" to="/analysis/source">자료 다시 선택</Link>
        </aside>
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
