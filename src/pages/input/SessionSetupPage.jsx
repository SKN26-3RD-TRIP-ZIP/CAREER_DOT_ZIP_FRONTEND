import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Mic, RotateCcw } from 'lucide-react';
import { coverLetterApi } from '../../api/coverLetterApi';
import { interviewApi } from '../../api/interviewApi';
import { jdApi } from '../../api/jdApi';
import { resumeApi } from '../../api/resumeApi';
import { useJdStore } from '../../store/jdStore';
import { useInterviewStore } from '../../store/interviewStore';
import { useMicrophoneSetupCheck } from '../../hooks/useMicrophoneSetupCheck';
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

const STEPS = ['프로필', 'JD 입력', '이력서', '자소서/프로젝트', '면접 설정'];

const INTERVIEW_TYPE_OPTIONS = [
  { value: 'technical', label: '기술 면접', desc: '직무 역량과 기술 판단 근거를 깊게 확인합니다.' },
  { value: 'personality', label: '인성 면접', desc: '가치관, 협업 방식, 성장 태도를 중심으로 질문합니다.' },
  { value: 'comprehensive', label: '종합 면접', desc: '기술과 인성을 함께 검증하는 실전형 구성입니다.' },
];

const PERSONA_OPTIONS = [
  { value: 'coach', label: '코치형', desc: '답변의 장점과 개선 포인트를 부드럽게 끌어냅니다.' },
  { value: 'practical', label: '실무형', desc: '현업 상황과 문제 해결 과정을 현실적으로 확인합니다.' },
  { value: 'verify', label: '검증형', desc: '경험의 근거, 역할, 성과를 꼼꼼히 확인합니다.' },
  { value: 'pressure', label: '압박형', desc: '반박과 추가 질문으로 답변의 일관성을 봅니다.', disabled: true },
];

const INTERVIEW_MODE_OPTIONS = [
  { value: 'voice', label: '음성 면접', desc: '마이크로 답변하며 실전 면접 흐름에 맞춰 진행합니다.' },
  { value: 'text', label: '텍스트 면접', desc: '키보드 답변으로 질문과 답변을 차분히 정리합니다.', disabled: true },
];

const DEFAULT_QUESTION_COUNT = 5;

function fmtDateTime(v) {
  return v ? new Date(v).toLocaleString('ko-KR') : '기록 없음';
}

function getResults(data) {
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.results) ? data.results : [];
}

function normalizeQuestions(response) {
  const items = getResults(response);
  return [...items].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
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

function SectionTitle({ kicker, title, description }) {
  return (
    <div>
      {kicker && <p className="text-xs font-black text-[#08CB00]">{kicker}</p>}
      <h2 className="mt-1 text-lg font-black text-[#000000]">{title}</h2>
      {description && <p className="mt-1 text-sm leading-6 text-[rgba(0,0,0,0.62)]">{description}</p>}
    </div>
  );
}

function OptionCard({ option, checked, name, onChange }) {
  const disabled = Boolean(option.disabled);

  return (
    <label
      className={`flex min-h-[128px] flex-col justify-between rounded-lg border p-4 transition ${
        disabled
          ? 'cursor-not-allowed border-[rgba(0,0,0,0.10)] bg-[rgba(0,0,0,0.04)] text-[rgba(0,0,0,0.35)] opacity-70'
          : checked
          ? 'border-[#253900] bg-[#08CB00] text-[#000000] shadow-[0_10px_22px_rgba(0,0,0,0.16)]'
          : 'cursor-pointer border-[rgba(0,0,0,0.14)] bg-[#EEEEEE] text-[#000000] hover:border-[#253900]'
      }`}
    >
      <input
        type="radio"
        name={name}
        value={option.value}
        checked={checked}
        disabled={disabled}
        onChange={(e) => {
          if (!disabled) onChange(e.target.value);
        }}
        className="sr-only"
      />
      <span className="flex items-start justify-between gap-3">
        <span>
          <span className="flex items-center gap-2 text-base font-black">
            {option.label}
            {disabled && <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-[rgba(0,0,0,0.46)]">준비중</span>}
          </span>
          <span className="mt-2 block text-sm leading-6">{option.desc}</span>
        </span>
        <span
          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-black ${
            checked
              ? 'border-[#253900] bg-[#253900] text-[#EEEEEE]'
              : disabled
                ? 'border-[rgba(0,0,0,0.18)] bg-[rgba(0,0,0,0.05)] text-transparent'
                : 'border-[rgba(0,0,0,0.25)] text-[rgba(0,0,0,0.45)]'
          }`}
          aria-hidden="true"
        >
          {checked ? '✓' : ''}
        </span>
      </span>
    </label>
  );
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
  );
}

function MicrophoneCheckPanel({ micCheck, required }) {
  const {
    isSupported,
    permissionStatus,
    inputStatus,
    message,
    devices,
    selectedDeviceId,
    level,
    waveform,
    isTesting,
    isVerified,
    requestMicrophone,
    retry,
    handleDeviceChange,
  } = micCheck;
  const [displayInputStatus, setDisplayInputStatus] = useState(inputStatus);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setDisplayInputStatus(inputStatus);
    }, 650);

    return () => window.clearTimeout(timerId);
  }, [inputStatus]);

  const statusLabel = isVerified
    ? '확인 완료'
    : permissionStatus === 'granted'
      ? '테스트 진행 중'
      : permissionStatus === 'checking'
        ? '권한 확인 중'
        : permissionStatus === 'denied'
          ? '권한 거부'
          : permissionStatus === 'no-device'
            ? '장치 없음'
            : permissionStatus === 'unsupported'
              ? '미지원'
              : '대기';

  return (
    <section className="space-y-4 rounded-lg border border-[rgba(0,0,0,0.12)] bg-[#EEEEEE] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionTitle
          kicker="Microphone"
          title="마이크 점검"
          description={required ? '음성 면접을 시작하기 전에 마이크 입력이 정상인지 확인합니다.' : '텍스트 면접에서는 마이크 점검이 필수는 아닙니다.'}
        />
        <span
          className={`rounded-full px-3 py-1 text-xs font-black ${
            isVerified ? 'bg-[#08CB00] text-[#000000]' : 'bg-white text-[rgba(0,0,0,0.62)]'
          }`}
        >
          {statusLabel}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <div className="space-y-3">
          <Field label="마이크 장치">
            <select
              className={inputClass}
              value={selectedDeviceId}
              disabled={!isSupported || devices.length === 0}
              onChange={(e) => handleDeviceChange(e.target.value)}
            >
              {devices.length === 0 ? (
                <option value="">사용 가능한 마이크 없음</option>
              ) : (
                devices.map((device) => (
                  <option key={device.deviceId || device.label} value={device.deviceId}>
                    {device.label}
                  </option>
                ))
              )}
            </select>
          </Field>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={requestMicrophone} disabled={!isSupported || permissionStatus === 'checking'}>
              <Mic size={16} />
              마이크 확인
            </Button>
            {(permissionStatus === 'denied' || permissionStatus === 'error' || permissionStatus === 'no-device') && (
              <Button type="button" variant="ghost" onClick={retry}>
                <RotateCcw size={16} />
                재시도
              </Button>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-[rgba(0,0,0,0.10)] bg-white p-4">
          <div className="flex items-center justify-between gap-3 text-xs font-black text-[#253900]">
            <span>입력 레벨</span>
            <span>{Math.round(level * 100)}%</span>
          </div>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-[rgba(8,203,0,0.12)]">
            <span className="block h-full rounded-full bg-[#08CB00] transition-all" style={{ width: `${Math.round(level * 100)}%` }} />
          </div>
          <div className="mt-4 flex h-16 items-end gap-1 rounded-lg bg-[rgba(8,203,0,0.10)] px-3 py-2">
            {waveform.map((value, index) => (
              <span
                key={`${index}-${value}`}
                className={`flex-1 rounded-full ${isTesting ? 'bg-[#08CB00]' : 'bg-[rgba(37,57,0,0.22)]'}`}
                style={{ height: `${Math.max(8, Math.round(value * 52))}px` }}
              />
            ))}
          </div>
          <div className="mt-3 min-h-[72px] space-y-1">
            <div className="flex items-start gap-2 text-sm leading-6 text-[rgba(0,0,0,0.70)]">
              {isVerified ? <Check size={17} className="mt-1 shrink-0 text-[#08CB00]" /> : <Mic size={17} className="mt-1 shrink-0 text-[#253900]" />}
              <span className="line-clamp-2">{message}</span>
            </div>
            <p className="h-5 text-xs font-bold text-[#A05A00]">
              {!isVerified && displayInputStatus === 'too_low' ? '소리가 조금 작습니다. 평소 말하는 목소리로 한 번 더 말해 주세요.' : ''}
            </p>
            <p className="h-5 text-xs font-bold text-[#C01616]">
              {required && !isVerified ? '음성 면접은 마이크 확인 완료 후 시작할 수 있습니다.' : ''}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function SessionSetupPage() {
  const navigate = useNavigate();
  const { jdId, setJd } = useJdStore();
  const { setSessionId, setQuestions, setCurrentQuestionIndex, resetInterview } = useInterviewStore();
  const micCheck = useMicrophoneSetupCheck();
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
  const requiresMicrophone = interviewMode === 'voice';

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
    if (requiresMicrophone && !micCheck.isVerified) {
      setError('음성 면접을 시작하려면 마이크 점검을 먼저 완료해 주세요.');
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

      setLoadingStep('생성된 질문을 불러오는 중...');
      const questionResponse = await interviewApi.getQuestions(newSessionId);
      const orderedQuestions = normalizeQuestions(questionResponse);
      setQuestions(orderedQuestions);
      setCurrentQuestionIndex(0);

      navigate('/interview/question');
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
      title="면접 설정"
      description="선택한 자료를 바탕으로 면접 유형, 면접관 페르소나, 질문 수, 진행 방식을 설정합니다."
      actions={
        <Button type="button" variant="secondary" onClick={fetchSources} disabled={initialLoading || loading}>
          목록 새로고침
        </Button>
      }
      steps={STEPS}
      currentStep={5}
      activeNav="면접 진행"
    >
      <Card className="overflow-hidden">
        <div className="border-b border-[rgba(0,0,0,0.10)] bg-[#253900] px-6 py-5 text-[#EEEEEE]">
          <p className="text-xs font-black text-[#08CB00]">Step 5</p>
          <h2 className="mt-1 text-2xl font-black">면접 설정 카드</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[rgba(238,238,238,0.78)]">
            Step 5에서 면접 조건을 확정한 뒤 바로 세션과 질문을 생성합니다.
          </p>
        </div>

        {initialLoading ? (
          <div className="p-6">
            <LoadingState title="면접 자료 목록을 불러오는 중입니다" description="저장된 JD, 이력서, 자기소개서를 확인하고 있습니다." />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8 p-6">
            <section className="space-y-4">
              <SectionTitle
                kicker="Source"
                title="연결 자료 확인"
                description="면접 질문을 만들 JD와 이력서를 확인합니다. 자기소개서는 선택 사항입니다."
              />
              <div className="grid gap-4 lg:grid-cols-3">
                <section className="rounded-lg border border-[rgba(0,0,0,0.12)] p-4">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <p className="text-sm font-black text-[#253900]">JD 선택</p>
                    <Button type="button" variant="ghost" onClick={() => navigate('/jd')} className="h-9 px-3 py-0">
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
                    <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
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

                <section className="rounded-lg border border-[rgba(0,0,0,0.12)] p-4">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <p className="text-sm font-black text-[#253900]">이력서 선택</p>
                    <Button type="button" variant="ghost" onClick={() => navigate('/input/documents')} className="h-9 px-3 py-0">
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
                    <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
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

                <section className="rounded-lg border border-[rgba(0,0,0,0.12)] p-4">
                  <p className="mb-3 text-sm font-black text-[#253900]">자기소개서 선택</p>
                  <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                    <SelectableItem
                      selected={!selectedCoverLetterId}
                      title="선택 안 함"
                      meta="자기소개서 없이 JD와 이력서만으로 질문을 생성합니다."
                      onClick={() => handleSelectCoverLetter('')}
                    />
                    {coverLetters.length === 0 ? (
                      <EmptyState
                        title="저장된 자기소개서가 없습니다"
                        description="자기소개서는 선택 항목입니다. 없어도 면접을 시작할 수 있습니다."
                      />
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
            </section>

            <section className="rounded-lg border border-[rgba(0,0,0,0.12)] bg-[#EEEEEE] p-4">
              <p className="text-sm font-black text-[#253900]">선택 요약</p>
              <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-xs font-bold text-[#253900]">JD</dt>
                  <dd className="mt-1 font-semibold text-[#000000]">
                    {selectedJd ? `${selectedJd.company_name} · ${selectedJd.position}` : '선택되지 않음'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-bold text-[#253900]">이력서</dt>
                  <dd className="mt-1 font-semibold text-[#000000]">{selectedResume ? selectedResume.name || '이력서' : '선택되지 않음'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold text-[#253900]">자기소개서</dt>
                  <dd className="mt-1 font-semibold text-[#000000]">
                    {selectedCoverLetter ? selectedCoverLetter.title || '자기소개서' : '선택 안 함'}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="space-y-4">
              <SectionTitle
                kicker="Type"
                title="면접 유형 선택"
                description="이번 세션에서 가장 중요하게 확인할 면접 범위를 선택합니다."
              />
              <div className="grid gap-3 md:grid-cols-3">
                {INTERVIEW_TYPE_OPTIONS.map((opt) => (
                  <OptionCard key={opt.value} option={opt} checked={interviewType === opt.value} name="interview_type" onChange={setInterviewType} />
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <SectionTitle
                kicker="Persona"
                title="면접관 페르소나 선택"
                description="질문 톤과 검증 강도를 결정합니다."
              />
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {PERSONA_OPTIONS.map((opt) => (
                  <OptionCard key={opt.value} option={opt} checked={persona === opt.value} name="persona" onChange={setPersona} />
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <SectionTitle
                kicker="Questions"
                title="질문 수 / 꼬리질문 설정"
                description="생성할 기본 질문 수를 정하고, 답변 기반 꼬리질문 흐름을 확인합니다."
              />
              <div className="grid gap-4 lg:grid-cols-[minmax(0,280px)_1fr]">
                <Field label="질문 수" hint={`비워두면 기본 ${DEFAULT_QUESTION_COUNT}개로 생성합니다.`}>
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
                <div className="rounded-lg border border-[#253900] bg-[#08CB00] p-4 text-[#000000]">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-black">꼬리질문 자동 생성</p>
                    <span className="rounded-full border border-[#253900] bg-[#253900] px-3 py-1 text-xs font-black text-[#EEEEEE]">
                      활성화
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6">면접 진행 중 답변 내용에 따라 추가 검증 질문을 이어갑니다.</p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <SectionTitle
                kicker="Mode"
                title="음성 면접 또는 텍스트 면접 선택"
                description="실전 연습 방식에 맞게 진행 모드를 선택합니다."
              />
              <div className="grid gap-3 md:grid-cols-2">
                {INTERVIEW_MODE_OPTIONS.map((opt) => (
                  <OptionCard key={opt.value} option={opt} checked={interviewMode === opt.value} name="interview_mode" onChange={setInterviewMode} />
                ))}
              </div>
            </section>

            <MicrophoneCheckPanel micCheck={micCheck} required={requiresMicrophone} />

            {error && <Alert tone="danger">{error}</Alert>}

            <div className="flex flex-wrap justify-between gap-3 border-t border-[rgba(0,0,0,0.10)] pt-6">
              <Button type="button" variant="secondary" onClick={() => navigate('/input/cover-letter-project')} disabled={loading}>
                이전
              </Button>
              <Button type="submit" disabled={loading || !selectedJdId || !selectedResumeId || (requiresMicrophone && !micCheck.isVerified)} className="min-w-36">
                {loading ? loadingStep || '처리 중...' : '면접 시작'}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </PageShell>
  );
}

export default SessionSetupPage;
