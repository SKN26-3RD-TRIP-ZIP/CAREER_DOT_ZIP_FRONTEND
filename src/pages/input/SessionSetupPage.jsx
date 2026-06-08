import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { interviewApi } from '../../api/interviewApi';
import { useJdStore } from '../../store/jdStore';
import { useInterviewStore } from '../../store/interviewStore';

const INTERVIEW_TYPE_OPTIONS = [
  { value: 'technical', label: '기술 면접', desc: '직무 관련 기술 역량 중심' },
  { value: 'personality', label: '인성 면접', desc: '가치관·태도·협업 역량 중심' },
  { value: 'comprehensive', label: '종합 면접', desc: '기술 + 인성 통합' },
];

const PERSONA_OPTIONS = [
  { value: 'coach', label: '코치형', desc: '성장·개선점 중심으로 질문' },
  { value: 'practical', label: '실무형', desc: '실제 업무 상황 중심으로 질문' },
  { value: 'verifier', label: '검증형', desc: '답변 근거·사실 확인 중심' },
  { value: 'pressure', label: '압박형', desc: '반박·한계 테스트 중심' },
];

const DEFAULT_QUESTION_COUNT = 5;

function SessionSetupPage() {
  const navigate = useNavigate();
  const { jdId, jdData } = useJdStore();
  const { setSessionId, resetInterview } = useInterviewStore();

  const [interviewType, setInterviewType] = useState('technical');
  const [persona, setPersona] = useState('practical');
  const [totalQuestionCount, setTotalQuestionCount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!jdId) {
      setError('JD 정보가 없습니다. JD 입력 페이지로 돌아가주세요.');
      return;
    }
    if (!localStorage.getItem('access_token')) {
      setError('로그인이 필요합니다. access token을 먼저 저장해주세요.');
      return;
    }

    const payload = {
      jd_id: jdId,
      interview_type: interviewType,
      persona,
    };
    const count = parseInt(totalQuestionCount, 10);
    if (!Number.isNaN(count) && count > 0) {
      payload.total_question_count = count;
    }

    setLoading(true);
    try {
      resetInterview();
      const data = await interviewApi.createSession(payload);
      const newSessionId = data?.session_id ?? data?.id;
      if (!newSessionId) throw new Error('session_id를 응답에서 찾을 수 없습니다.');
      setSessionId(newSessionId);
      navigate('/interview');
    } catch (err) {
      const status = err?.response?.status;
      if (!err?.response) {
        setError('백엔드 서버에 연결할 수 없습니다. runserver가 켜져 있는지 확인해주세요.');
      } else if (status === 401) {
        setError('인증에 실패했습니다. access token을 다시 저장해주세요.');
      } else if (status === 400) {
        const detail = err?.response?.data;
        const msg = typeof detail === 'object' ? JSON.stringify(detail) : String(detail);
        setError(`입력값 오류: ${msg}`);
      } else if (status === 404) {
        setError('JD를 찾을 수 없습니다. 다시 JD를 생성해주세요.');
      } else {
        setError(`세션 생성에 실패했습니다. (HTTP ${status})`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-8 text-slate-900">
      <section className="mx-auto max-w-2xl rounded-2xl bg-white p-6 shadow">
        <h1 className="text-2xl font-bold">면접 설정</h1>
        <p className="mt-1 text-sm text-slate-500">
          면접 유형과 면접관 페르소나를 선택하면 세션이 생성됩니다.
        </p>

        {/* JD 요약 */}
        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">선택된 JD</p>
          {jdId ? (
            <div className="mt-1">
              <p className="text-sm font-semibold text-slate-800">
                {jdData?.company_name && `${jdData.company_name} · `}
                {jdData?.position || '직무명 없음'}
              </p>
              <p className="mt-0.5 font-mono text-xs text-slate-400">{jdId}</p>
            </div>
          ) : (
            <div className="mt-1">
              <p className="text-sm text-red-600">JD 정보가 없습니다.</p>
              <button
                type="button"
                className="mt-2 rounded-lg bg-slate-900 px-3 py-1.5 text-xs text-white"
                onClick={() => navigate('/jd')}
              >
                JD 입력하러 가기
              </button>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* 면접 유형 */}
          <div>
            <p className="text-sm font-semibold text-slate-800">
              면접 유형 <span className="ml-1 text-red-500">*</span>
            </p>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {INTERVIEW_TYPE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`cursor-pointer rounded-xl border p-3 transition-colors ${
                    interviewType === opt.value
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 hover:border-slate-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="interview_type"
                    value={opt.value}
                    checked={interviewType === opt.value}
                    onChange={(e) => setInterviewType(e.target.value)}
                    className="sr-only"
                  />
                  <p className="text-sm font-semibold">{opt.label}</p>
                  <p className={`mt-0.5 text-xs ${interviewType === opt.value ? 'text-slate-300' : 'text-slate-500'}`}>
                    {opt.desc}
                  </p>
                </label>
              ))}
            </div>
          </div>

          {/* 면접관 페르소나 */}
          <div>
            <p className="text-sm font-semibold text-slate-800">
              면접관 유형 <span className="ml-1 text-red-500">*</span>
            </p>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {PERSONA_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`cursor-pointer rounded-xl border p-3 transition-colors ${
                    persona === opt.value
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 hover:border-slate-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="persona"
                    value={opt.value}
                    checked={persona === opt.value}
                    onChange={(e) => setPersona(e.target.value)}
                    className="sr-only"
                  />
                  <p className="text-sm font-semibold">{opt.label}</p>
                  <p className={`mt-0.5 text-xs ${persona === opt.value ? 'text-slate-300' : 'text-slate-500'}`}>
                    {opt.desc}
                  </p>
                </label>
              ))}
            </div>
          </div>

          {/* 질문 수 */}
          <div>
            <label htmlFor="total_question_count" className="block text-sm font-semibold text-slate-800">
              질문 수
              <span className="ml-1 text-xs font-normal text-slate-400">(선택, 기본 {DEFAULT_QUESTION_COUNT}개)</span>
            </label>
            <input
              id="total_question_count"
              type="number"
              min="1"
              max="20"
              className="mt-1 w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder={String(DEFAULT_QUESTION_COUNT)}
              value={totalQuestionCount}
              onChange={(e) => setTotalQuestionCount(e.target.value)}
            />
          </div>

          {/* 에러 */}
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}

          {/* 버튼 */}
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={loading || !jdId}
              className="rounded-lg bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white disabled:bg-slate-400"
            >
              {loading ? '세션 생성 중...' : '면접 시작'}
            </button>
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm"
              onClick={() => navigate('/jd')}
              disabled={loading}
            >
              JD 다시 선택
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

export default SessionSetupPage;
