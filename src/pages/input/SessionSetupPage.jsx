import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { coverLetterApi } from '../../api/coverLetterApi';
import { interviewApi } from '../../api/interviewApi';
import { jdApi } from '../../api/jdApi';
import { resumeApi } from '../../api/resumeApi';
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
  { value: 'verify', label: '검증형', desc: '답변 근거·사실 확인 중심' },
  { value: 'pressure', label: '압박형', desc: '반박·한계 테스트 중심' },
];

const INTERVIEW_MODE_OPTIONS = [
  { value: 'text', label: '텍스트', desc: '키보드 답변으로 진행' },
  { value: 'voice', label: '음성', desc: '마이크 답변으로 진행' },
];

const DEFAULT_QUESTION_COUNT = 5;

function fmtDateTime(v) {
  return v ? new Date(v).toLocaleString('ko-KR') : '기록 없음';
}

function getResults(data) {
  return Array.isArray(data?.results) ? data.results : [];
}

function formatApiError(err, fallback) {
  const status = err?.response?.status;
  const detail = err?.response?.data;
  if (!err?.response) return '백엔드 서버에 연결할 수 없습니다. runserver가 켜져 있는지 확인해주세요.';
  if (status === 401) return '로그인이 필요합니다. 로그인 페이지로 이동합니다.';
  if (status === 400) return `입력값 오류: ${typeof detail === 'object' ? JSON.stringify(detail) : String(detail)}`;
  if (status === 404) return '선택한 자료를 찾을 수 없습니다. 목록을 새로고침해주세요.';
  return `${fallback} (HTTP ${status})`;
}

function OptionCard({ option, checked, name, onChange }) {
  return (
    <label
      className={`cursor-pointer rounded-xl border p-3 transition-colors ${
        checked ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 hover:border-slate-400'
      }`}
    >
      <input
        type="radio"
        name={name}
        value={option.value}
        checked={checked}
        onChange={(e) => onChange(e.target.value)}
        className="sr-only"
      />
      <p className="text-sm font-semibold">{option.label}</p>
      <p className={`mt-0.5 text-xs ${checked ? 'text-slate-300' : 'text-slate-500'}`}>
        {option.desc}
      </p>
    </label>
  );
}

function SessionSetupPage() {
  const navigate = useNavigate();
  const { jdId, setJd } = useJdStore();
  const { setSessionId, resetInterview } = useInterviewStore();

  const [jds, setJds] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [coverLetters, setCoverLetters] = useState([]);
  const [selectedJdId, setSelectedJdId] = useState(
    jdId || window.localStorage.getItem('careerzip_selected_jd_id') || window.localStorage.getItem('careerzip_temp_jd_id') || ''
  );
  const [selectedResumeId, setSelectedResumeId] = useState(
    window.localStorage.getItem('careerzip_selected_resume_id') || ''
  );
  const [selectedCoverLetterId, setSelectedCoverLetterId] = useState(
    window.localStorage.getItem('careerzip_selected_cover_letter_id') || ''
  );
  const [interviewType, setInterviewType] = useState('comprehensive');
  const [interviewMode, setInterviewMode] = useState('voice');
  const [persona, setPersona] = useState('practical');
  const [totalQuestionCount, setTotalQuestionCount] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState('');

  const selectedJd = useMemo(
    () => jds.find((item) => item.jd_id === selectedJdId) || null,
    [jds, selectedJdId]
  );
  const selectedResume = useMemo(
    () => resumes.find((item) => item.resume_id === selectedResumeId) || null,
    [resumes, selectedResumeId]
  );
  const selectedCoverLetter = useMemo(
    () => coverLetters.find((item) => item.cover_letter_id === selectedCoverLetterId) || null,
    [coverLetters, selectedCoverLetterId]
  );

  const fetchSources = async () => {
    setInitialLoading(true);
    setError('');
    try {
      const [jdData, resumeData, coverLetterData] = await Promise.all([
        jdApi.getJds(),
        resumeApi.getResumes(),
        coverLetterApi.getCoverLetters(),
      ]);
      const nextJds = getResults(jdData);
      const nextResumes = getResults(resumeData);
      const nextCoverLetters = getResults(coverLetterData);
      setJds(nextJds);
      setResumes(nextResumes);
      setCoverLetters(nextCoverLetters);

      const rememberedJd = nextJds.some((item) => item.jd_id === selectedJdId)
        ? selectedJdId
        : (nextJds[0]?.jd_id || '');
      const rememberedResume = nextResumes.some((item) => item.resume_id === selectedResumeId)
        ? selectedResumeId
        : (nextResumes[0]?.resume_id || '');
      const rememberedCoverLetter = nextCoverLetters.some((item) => item.cover_letter_id === selectedCoverLetterId)
        ? selectedCoverLetterId
        : '';

      if (rememberedJd) {
        setSelectedJdId(rememberedJd);
        window.localStorage.setItem('careerzip_selected_jd_id', rememberedJd);
        const jd = nextJds.find((item) => item.jd_id === rememberedJd);
        if (jd) setJd(rememberedJd, jd);
      }
      if (rememberedResume) {
        setSelectedResumeId(rememberedResume);
        window.localStorage.setItem('careerzip_selected_resume_id', rememberedResume);
      }
      if (rememberedCoverLetter) {
        setSelectedCoverLetterId(rememberedCoverLetter);
      }
    } catch (err) {
      const message = formatApiError(err, '자료 목록을 불러오지 못했습니다.');
      setError(message);
      if (err?.response?.status === 401) navigate('/auth/login');
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    if (!localStorage.getItem('access_token')) {
      setError('로그인이 필요합니다. 로그인 페이지로 이동합니다.');
      navigate('/auth/login');
      return;
    }
    fetchSources();
  }, []);

  const handleSelectJd = (nextId) => {
    setSelectedJdId(nextId);
    window.localStorage.setItem('careerzip_selected_jd_id', nextId);
    const jd = jds.find((item) => item.jd_id === nextId);
    if (jd) setJd(nextId, jd);
  };

  const handleSelectResume = (nextId) => {
    setSelectedResumeId(nextId);
    window.localStorage.setItem('careerzip_selected_resume_id', nextId);
  };

  const handleSelectCoverLetter = (nextId) => {
    setSelectedCoverLetterId(nextId);
    if (nextId) window.localStorage.setItem('careerzip_selected_cover_letter_id', nextId);
    else window.localStorage.removeItem('careerzip_selected_cover_letter_id');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedJdId) {
      setError('면접에 사용할 JD를 선택해주세요.');
      return;
    }
    if (!selectedResumeId) {
      setError('면접에 사용할 이력서를 선택해주세요.');
      return;
    }
    if (!localStorage.getItem('access_token')) {
      setError('로그인이 필요합니다. 로그인 페이지로 이동합니다.');
      navigate('/auth/login');
      return;
    }

    const count = parseInt(totalQuestionCount, 10);
    const questionCount = !Number.isNaN(count) && count > 0 ? count : DEFAULT_QUESTION_COUNT;
    const sessionPayload = {
      jd_id: selectedJdId,
      resume_id: selectedResumeId,
      cover_letter_id: selectedCoverLetterId || undefined,
      persona_type: persona,
      persona,
      interview_type: interviewType,
      interview_mode: interviewMode,
      total_question_count: questionCount,
    };

    setLoading(true);
    let newSessionId = null;

    try {
      setLoadingStep('세션 생성 중...');
      resetInterview();
      const sessionData = await interviewApi.createSession(sessionPayload);
      newSessionId = sessionData?.session_id ?? sessionData?.id;
      if (!newSessionId) throw new Error('session_id를 응답에서 찾을 수 없습니다.');
      setSessionId(newSessionId);

      setLoadingStep('면접 질문 생성 중...');
      await interviewApi.generateQuestions(newSessionId, { question_count: questionCount });

      navigate(interviewMode === 'text' ? '/interview/question' : '/interview');
    } catch (err) {
      const message = formatApiError(err, newSessionId ? '질문 생성에 실패했습니다.' : '세션 생성에 실패했습니다.');
      setError(message);
      if (err?.response?.status === 401) navigate('/auth/login');
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-8 text-slate-900">
      <section className="mx-auto max-w-4xl rounded-2xl bg-white p-6 shadow">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">면접 설정</h1>
            <p className="mt-1 text-sm text-slate-500">
              사용할 JD와 이력서를 선택하고 면접 방식을 정하세요.
            </p>
          </div>
          <button
            type="button"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
            onClick={fetchSources}
            disabled={initialLoading || loading}
          >
            목록 새로고침
          </button>
        </div>

        {initialLoading ? (
          <div className="mt-6 rounded-xl bg-slate-50 p-6 text-sm text-slate-500">자료 목록을 불러오는 중...</div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-7">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <section className="rounded-xl border border-slate-200 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-800">JD 선택</p>
                  <button type="button" className="text-xs font-semibold text-slate-500" onClick={() => navigate('/jd')}>
                    추가
                  </button>
                </div>
                <div className="space-y-2">
                  {jds.length === 0 && <p className="text-sm text-slate-400">등록된 JD가 없습니다.</p>}
                  {jds.map((item) => (
                    <button
                      key={item.jd_id}
                      type="button"
                      onClick={() => handleSelectJd(item.jd_id)}
                      className={`w-full rounded-lg border p-3 text-left transition-colors ${
                        selectedJdId === item.jd_id
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      <p className="text-sm font-semibold">{item.company_name} · {item.position}</p>
                      <p className={`mt-1 text-xs ${selectedJdId === item.jd_id ? 'text-slate-300' : 'text-slate-400'}`}>
                        등록 {fmtDateTime(item.created_at)}
                      </p>
                    </button>
                  ))}
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-800">이력서 선택</p>
                  <button type="button" className="text-xs font-semibold text-slate-500" onClick={() => navigate('/input/documents')}>
                    추가
                  </button>
                </div>
                <div className="space-y-2">
                  {resumes.length === 0 && <p className="text-sm text-slate-400">등록된 이력서가 없습니다.</p>}
                  {resumes.map((item) => (
                    <button
                      key={item.resume_id}
                      type="button"
                      onClick={() => handleSelectResume(item.resume_id)}
                      className={`w-full rounded-lg border p-3 text-left transition-colors ${
                        selectedResumeId === item.resume_id
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      <p className="text-sm font-semibold">{item.name || '이력서'}</p>
                      <p className={`mt-1 text-xs ${selectedResumeId === item.resume_id ? 'text-slate-300' : 'text-slate-400'}`}>
                        수정 {fmtDateTime(item.updated_at)}
                      </p>
                    </button>
                  ))}
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 p-4">
                <p className="mb-3 text-sm font-semibold text-slate-800">자소서 선택</p>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => handleSelectCoverLetter('')}
                    className={`w-full rounded-lg border p-3 text-left transition-colors ${
                      !selectedCoverLetterId
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    <p className="text-sm font-semibold">선택 안 함</p>
                    <p className={`mt-1 text-xs ${!selectedCoverLetterId ? 'text-slate-300' : 'text-slate-400'}`}>
                      자소서 없이 질문 생성
                    </p>
                  </button>
                  {coverLetters.map((item) => (
                    <button
                      key={item.cover_letter_id}
                      type="button"
                      onClick={() => handleSelectCoverLetter(item.cover_letter_id)}
                      className={`w-full rounded-lg border p-3 text-left transition-colors ${
                        selectedCoverLetterId === item.cover_letter_id
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p className={`mt-1 text-xs ${selectedCoverLetterId === item.cover_letter_id ? 'text-slate-300' : 'text-slate-400'}`}>
                        {item.company_name || fmtDateTime(item.created_at)}
                      </p>
                    </button>
                  ))}
                </div>
              </section>
            </div>

            <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-800">선택 요약</p>
              <dl className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-xs text-slate-400">JD</dt>
                  <dd className="mt-1 font-semibold text-slate-700">
                    {selectedJd ? `${selectedJd.company_name} · ${selectedJd.position}` : '선택되지 않음'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">이력서</dt>
                  <dd className="mt-1 font-semibold text-slate-700">
                    {selectedResume ? selectedResume.name : '선택되지 않음'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">자소서</dt>
                  <dd className="mt-1 font-semibold text-slate-700">
                    {selectedCoverLetter ? selectedCoverLetter.title : '선택 안 함'}
                  </dd>
                </div>
              </dl>
            </section>

            <div>
              <p className="text-sm font-semibold text-slate-800">
                면접 유형 <span className="ml-1 text-red-500">*</span>
              </p>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                {INTERVIEW_TYPE_OPTIONS.map((opt) => (
                  <OptionCard
                    key={opt.value}
                    option={opt}
                    checked={interviewType === opt.value}
                    name="interview_type"
                    onChange={setInterviewType}
                  />
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-800">
                면접 모드 <span className="ml-1 text-red-500">*</span>
              </p>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {INTERVIEW_MODE_OPTIONS.map((opt) => (
                  <OptionCard
                    key={opt.value}
                    option={opt}
                    checked={interviewMode === opt.value}
                    name="interview_mode"
                    onChange={setInterviewMode}
                  />
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-800">
                면접관 유형 <span className="ml-1 text-red-500">*</span>
              </p>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {PERSONA_OPTIONS.map((opt) => (
                  <OptionCard
                    key={opt.value}
                    option={opt}
                    checked={persona === opt.value}
                    name="persona"
                    onChange={setPersona}
                  />
                ))}
              </div>
            </div>

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

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="submit"
                disabled={loading || !selectedJdId || !selectedResumeId}
                className="rounded-lg bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white disabled:bg-slate-400"
              >
                {loading ? loadingStep || '처리 중...' : '면접 시작'}
              </button>
              <button
                type="button"
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm"
                onClick={() => navigate('/jd')}
                disabled={loading}
              >
                JD 추가
              </button>
              <button
                type="button"
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm"
                onClick={() => navigate('/input/documents')}
                disabled={loading}
              >
                이력서 추가
              </button>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}

export default SessionSetupPage;
