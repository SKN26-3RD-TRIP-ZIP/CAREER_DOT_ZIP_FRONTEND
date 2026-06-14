import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { coverLetterApi } from '../../api/coverLetterApi';
import { interviewApi } from '../../api/interviewApi';
import { jdApi } from '../../api/jdApi';
import { resumeApi } from '../../api/resumeApi';
import { useJdStore } from '../../store/jdStore';
import { useInterviewStore } from '../../store/interviewStore';
import {
  Alert,
  Button,
  Card,
  EmptyState,
  Field,
  LoadingState,
  PageShell,
  StatusBadge,
  inputClass,
} from '../../components/ui/DemoLayout';

const STEPS = ['프로필', 'JD 등록', '이력서', '면접 설정'];

const INTERVIEW_TYPE_OPTIONS = [
  { value: 'technical', label: '기술 면접', desc: '직무 관련 기술 역량 중심' },
  { value: 'personality', label: '인성 면접', desc: '가치관, 태도, 협업 역량 중심' },
  { value: 'comprehensive', label: '종합 면접', desc: '기술과 인성을 함께 점검' },
];

const PERSONA_OPTIONS = [
  { value: 'coach', label: '코치형', desc: '성장과 개선 포인트 중심으로 질문' },
  { value: 'practical', label: '실무형', desc: '실제 업무 상황 중심으로 질문' },
  { value: 'verify', label: '검증형', desc: '답변의 근거와 사실 확인 중심' },
  { value: 'pressure', label: '압박형', desc: '반박과 한계 상황 테스트 중심' },
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
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.results) ? data.results : [];
}

function formatApiError(err, fallback) {
  const status = err?.response?.status;
  const detail = err?.response?.data;
  if (!err?.response) return '서버에 연결할 수 없습니다. 백엔드 실행 상태를 확인해주세요.';
  if (status === 401) return '로그인이 필요합니다. 다시 로그인해주세요.';
  if (status === 400) return `입력값 오류: ${typeof detail === 'object' ? JSON.stringify(detail) : String(detail)}`;
  if (status === 404) return '선택한 자료를 찾을 수 없습니다. 목록을 새로고침해주세요.';
  return `${fallback} (HTTP ${status})`;
}

function OptionCard({ option, checked, name, onChange }) {
  return (
    <label
      className={`cursor-pointer rounded-lg border p-4 transition ${
        checked ? 'border-emerald-600 bg-emerald-50 text-emerald-900' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
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
      <p className="text-sm font-bold">{option.label}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{option.desc}</p>
    </label>
  );
}

function SelectableItem({ selected, title, meta, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-lg border p-4 text-left transition ${
        selected ? 'border-emerald-600 bg-emerald-50 text-emerald-900' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">{title}</p>
        {selected && <StatusBadge tone="success">선택됨</StatusBadge>}
      </div>
      {meta && <p className="mt-1 text-xs leading-5 text-slate-500">{meta}</p>}
    </button>
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
    jdId || window.localStorage.getItem('careerzip_selected_jd_id') || window.localStorage.getItem('careerzip_temp_jd_id') || '',
  );
  const [selectedResumeId, setSelectedResumeId] = useState(window.localStorage.getItem('careerzip_selected_resume_id') || '');
  const [selectedCoverLetterId, setSelectedCoverLetterId] = useState(window.localStorage.getItem('careerzip_selected_cover_letter_id') || '');
  const [interviewType, setInterviewType] = useState('comprehensive');
  const [interviewMode, setInterviewMode] = useState('voice');
  const [persona, setPersona] = useState('practical');
  const [totalQuestionCount, setTotalQuestionCount] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState('');

  const selectedJd = useMemo(() => jds.find((item) => item.jd_id === selectedJdId) || null, [jds, selectedJdId]);
  const selectedResume = useMemo(() => resumes.find((item) => item.resume_id === selectedResumeId) || null, [resumes, selectedResumeId]);
  const selectedCoverLetter = useMemo(
    () => coverLetters.find((item) => item.cover_letter_id === selectedCoverLetterId) || null,
    [coverLetters, selectedCoverLetterId],
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

      const rememberedJd = nextJds.some((item) => item.jd_id === selectedJdId) ? selectedJdId : nextJds[0]?.jd_id || '';
      const rememberedResume = nextResumes.some((item) => item.resume_id === selectedResumeId) ? selectedResumeId : nextResumes[0]?.resume_id || '';
      const rememberedCoverLetter = nextCoverLetters.some((item) => item.cover_letter_id === selectedCoverLetterId) ? selectedCoverLetterId : '';

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
      if (rememberedCoverLetter) setSelectedCoverLetterId(rememberedCoverLetter);
    } catch (err) {
      setError(formatApiError(err, '자료 목록을 불러오지 못했습니다.'));
      if (err?.response?.status === 401) navigate('/auth/login');
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    if (!localStorage.getItem('access_token')) {
      setError('로그인이 필요합니다. 다시 로그인해주세요.');
      navigate('/auth/login');
      return;
    }
    fetchSources();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setError('면접에 사용할 JD를 선택해주세요. JD가 없다면 먼저 등록해야 합니다.');
      return;
    }
    if (!selectedResumeId) {
      setError('면접에 사용할 이력서를 선택해주세요. 이력서가 없다면 먼저 업로드해야 합니다.');
      return;
    }
    if (!localStorage.getItem('access_token')) {
      setError('로그인이 필요합니다. 다시 로그인해주세요.');
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
      setError(formatApiError(err, newSessionId ? '질문 생성에 실패했습니다.' : '세션 생성에 실패했습니다.'));
      if (err?.response?.status === 401) navigate('/auth/login');
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  return (
    <PageShell
      eyebrow="Step 4"
      title="면접 설정"
      description="저장된 JD와 이력서를 선택하고 면접 유형, 진행 방식, 면접관 페르소나를 정합니다."
      actions={
        <Button type="button" variant="secondary" onClick={fetchSources} disabled={initialLoading || loading}>
          목록 새로고침
        </Button>
      }
      steps={STEPS}
      currentStep={4}
    >
      <Card className="p-6">
        {initialLoading ? (
          <LoadingState title="면접 자료 목록을 불러오는 중입니다" />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid gap-4 lg:grid-cols-3">
              <section className="rounded-lg border border-slate-200 p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-slate-900">JD 선택</p>
                  <Button type="button" variant="ghost" onClick={() => navigate('/jd')}>
                    추가
                  </Button>
                </div>
                {jds.length === 0 ? (
                  <EmptyState
                    title="등록된 JD가 없습니다"
                    description="직접 입력, Mock 공고 저장, PDF 업로드 중 하나로 JD를 먼저 등록해주세요."
                    actionLabel="JD 등록"
                    actionTo="/jd"
                  />
                ) : (
                  <div className="space-y-2">
                    {jds.map((item) => (
                      <SelectableItem
                        key={item.jd_id}
                        selected={selectedJdId === item.jd_id}
                        title={`${item.company_name || '회사명 없음'} · ${item.position || '직무명 없음'}`}
                        meta={`등록 ${fmtDateTime(item.created_at)}`}
                        onClick={() => handleSelectJd(item.jd_id)}
                      />
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-lg border border-slate-200 p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-slate-900">이력서 선택</p>
                  <Button type="button" variant="ghost" onClick={() => navigate('/input/documents')}>
                    추가
                  </Button>
                </div>
                {resumes.length === 0 ? (
                  <EmptyState
                    title="등록된 이력서가 없습니다"
                    description="PDF 또는 DOCX 이력서를 업로드한 뒤 면접에 사용할 이력서를 선택해주세요."
                    actionLabel="이력서 업로드"
                    actionTo="/input/documents"
                  />
                ) : (
                  <div className="space-y-2">
                    {resumes.map((item) => (
                      <SelectableItem
                        key={item.resume_id}
                        selected={selectedResumeId === item.resume_id}
                        title={item.name || '이력서'}
                        meta={`수정 ${fmtDateTime(item.updated_at)}`}
                        onClick={() => handleSelectResume(item.resume_id)}
                      />
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-lg border border-slate-200 p-4">
                <p className="mb-3 text-sm font-bold text-slate-900">자소서 선택</p>
                <div className="space-y-2">
                  <SelectableItem
                    selected={!selectedCoverLetterId}
                    title="선택 안 함"
                    meta="자소서 없이 JD와 이력서만으로 질문을 생성합니다."
                    onClick={() => handleSelectCoverLetter('')}
                  />
                  {coverLetters.length === 0 ? (
                    <EmptyState title="저장된 자소서가 없습니다" description="자소서는 선택 항목입니다. 없어도 면접을 시작할 수 있습니다." />
                  ) : (
                    coverLetters.map((item) => (
                      <SelectableItem
                        key={item.cover_letter_id}
                        selected={selectedCoverLetterId === item.cover_letter_id}
                        title={item.title || '자기소개서'}
                        meta={item.company_name || fmtDateTime(item.created_at)}
                        onClick={() => handleSelectCoverLetter(item.cover_letter_id)}
                      />
                    ))
                  )}
                </div>
              </section>
            </div>

            <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-bold text-slate-900">선택 요약</p>
              <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-xs text-slate-500">JD</dt>
                  <dd className="mt-1 font-semibold text-slate-800">
                    {selectedJd ? `${selectedJd.company_name} · ${selectedJd.position}` : '선택되지 않음'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">이력서</dt>
                  <dd className="mt-1 font-semibold text-slate-800">{selectedResume ? selectedResume.name || '이력서' : '선택되지 않음'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">자소서</dt>
                  <dd className="mt-1 font-semibold text-slate-800">{selectedCoverLetter ? selectedCoverLetter.title || '자기소개서' : '선택 안 함'}</dd>
                </div>
              </dl>
            </section>

            <section>
              <p className="text-sm font-bold text-slate-900">면접 유형</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {INTERVIEW_TYPE_OPTIONS.map((opt) => (
                  <OptionCard key={opt.value} option={opt} checked={interviewType === opt.value} name="interview_type" onChange={setInterviewType} />
                ))}
              </div>
            </section>

            <section>
              <p className="text-sm font-bold text-slate-900">면접 모드</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {INTERVIEW_MODE_OPTIONS.map((opt) => (
                  <OptionCard key={opt.value} option={opt} checked={interviewMode === opt.value} name="interview_mode" onChange={setInterviewMode} />
                ))}
              </div>
            </section>

            <section>
              <p className="text-sm font-bold text-slate-900">면접관 페르소나</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {PERSONA_OPTIONS.map((opt) => (
                  <OptionCard key={opt.value} option={opt} checked={persona === opt.value} name="persona" onChange={setPersona} />
                ))}
              </div>
            </section>

            <Field label="질문 수" hint={`선택 항목입니다. 비워두면 기본 ${DEFAULT_QUESTION_COUNT}개로 생성합니다.`}>
              <input
                type="number"
                min="1"
                max="20"
                className={`${inputClass} max-w-40`}
                placeholder={String(DEFAULT_QUESTION_COUNT)}
                value={totalQuestionCount}
                onChange={(e) => setTotalQuestionCount(e.target.value)}
              />
            </Field>

            {error && <Alert tone="danger">{error}</Alert>}

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={loading || !selectedJdId || !selectedResumeId}>
                {loading ? loadingStep || '처리 중...' : `${interviewMode === 'text' ? 'text' : 'voice'} 면접 시작`}
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate('/jd')} disabled={loading}>
                JD 추가
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate('/input/documents')} disabled={loading}>
                이력서 추가
              </Button>
            </div>
          </form>
        )}
      </Card>
    </PageShell>
  );
}

export default SessionSetupPage;
