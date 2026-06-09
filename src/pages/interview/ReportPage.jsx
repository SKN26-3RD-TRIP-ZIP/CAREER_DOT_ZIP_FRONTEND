import { useLocation, useNavigate } from 'react-router-dom';
import { useInterviewStore } from '../../store/interviewStore';
import { useJdStore } from '../../store/jdStore';

const MOCK_REPORT = {
  overall_score: 82,
  company: '카카오',
  position: '백엔드 개발자',
  date: '2026.06.09',
  strengths: [
    '프로젝트 경험을 구체적으로 설명함',
    'JD와 기술 스택 연결이 좋음',
    '백엔드 핵심 기술에 대한 이해도가 높음',
  ],
  weaknesses: [
    '성과 수치가 부족함',
    '기술 선택 이유가 다소 추상적임',
    '꼬리질문에서 답변의 깊이가 다소 부족함',
  ],
  improvements: [
    'STAR 구조로 답변 정리 (상황-과제-행동-결과)',
    '본인 기여도를 명확히 수치화',
    '기술 선택의 근거를 트레이드오프 관점에서 설명',
  ],
  recommendations: [
    'Spring Boot 트러블슈팅 사례 정리',
    '프로젝트 성과 수치화 (예: 응답속도 30% 개선)',
    '기술 면접 단골 질문 STAR 형식으로 사전 준비',
  ],
};

function ScoreCircle({ score }) {
  const color = score >= 80 ? '#08CB00' : score >= 60 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex flex-col items-center">
      <div
        className="w-28 h-28 rounded-full flex flex-col items-center justify-center border-4"
        style={{ borderColor: color }}
      >
        <span className="text-3xl font-bold" style={{ color }}>{score}</span>
        <span className="text-xs text-slate-500">점</span>
      </div>
      <p className="mt-2 text-sm font-semibold text-slate-600">종합 점수</p>
    </div>
  );
}

function TagList({ items, color }) {
  return (
    <ul className="mt-2 space-y-1">
      {items.map((item, idx) => (
        <li key={idx} className={`flex items-start gap-2 text-sm rounded-lg px-3 py-2 ${color}`}>
          <span className="mt-0.5">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function ReportPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { sessionId } = useInterviewStore();
  const { jdData } = useJdStore();

  const apiReport = location.state?.reportData;

  const score = apiReport?.summary?.score_summary?.overall_score ?? MOCK_REPORT.overall_score;
  const company = jdData?.company_name ?? MOCK_REPORT.company;
  const position = jdData?.position ?? MOCK_REPORT.position;

  const strengthText = apiReport?.summary?.score_detail?.strength;
  const weaknessText = apiReport?.summary?.score_detail?.weakness;
  const improvementText = apiReport?.summary?.score_detail?.improvement;

  const strengths = strengthText ? [strengthText] : MOCK_REPORT.strengths;
  const weaknesses = weaknessText ? [weaknessText] : MOCK_REPORT.weaknesses;
  const improvements = improvementText ? [improvementText] : MOCK_REPORT.improvements;

  return (
    <main className="min-h-screen bg-[#EEEEEE] px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#253900]">면접 결과 리포트</h1>
          <p className="mt-1 text-sm text-slate-500">
            {company} · {position} · {MOCK_REPORT.date}
          </p>
        </div>

        <div className="space-y-4">
          {/* 점수 카드 */}
          <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center">
            <ScoreCircle score={score} />
            <p className="mt-4 text-sm text-slate-500 text-center">
              {score >= 80
                ? '우수한 면접 실력을 보여주셨습니다!'
                : score >= 60
                ? '기본기는 갖추셨지만 보완이 필요합니다.'
                : '추가 준비가 필요합니다. 꾸준히 연습하세요!'}
            </p>
            {sessionId && (
              <p className="mt-1 text-xs text-slate-400">세션 ID: {sessionId}</p>
            )}
          </div>

          {/* 강점 */}
          <div className="bg-white rounded-2xl shadow p-6">
            <p className="text-sm font-bold text-[#253900]">강점</p>
            <TagList items={strengths} color="bg-green-50 text-green-800" />
          </div>

          {/* 약점 */}
          <div className="bg-white rounded-2xl shadow p-6">
            <p className="text-sm font-bold text-[#253900]">개선 필요</p>
            <TagList items={weaknesses} color="bg-amber-50 text-amber-800" />
          </div>

          {/* 개선 방향 */}
          <div className="bg-white rounded-2xl shadow p-6">
            <p className="text-sm font-bold text-[#253900]">개선 방향</p>
            <TagList items={improvements} color="bg-slate-50 text-slate-700" />
          </div>

          {/* 추천 학습 방향 */}
          <div className="bg-white rounded-2xl shadow p-6">
            <p className="text-sm font-bold text-[#253900]">추천 학습 방향</p>
            <TagList items={MOCK_REPORT.recommendations} color="bg-blue-50 text-blue-800" />
          </div>

          {/* 버튼 */}
          <div className="flex gap-3 pb-4">
            <button
              type="button"
              onClick={() => navigate('/mypage')}
              className="flex-1 rounded-lg bg-[#08CB00] py-3 text-sm font-semibold text-white hover:bg-[#06a800] transition-colors"
            >
              마이페이지에서 확인
            </button>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
            >
              새 면접
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default ReportPage;
