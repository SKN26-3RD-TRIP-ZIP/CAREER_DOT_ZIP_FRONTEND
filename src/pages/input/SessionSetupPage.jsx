import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, Mic, RotateCcw } from 'lucide-react';
import { coverLetterApi } from '../../api/coverLetterApi';
import { interviewApi } from '../../api/interviewApi';
import { jdApi } from '../../api/jdApi';
import { mypageApi } from '../../api/mypageApi';
import { projectApi } from '../../api/projectApi';
import { resumeApi } from '../../api/resumeApi';
import { getPromptVersionTestSetup } from '../../api/adminApi';
import { useJdStore } from '../../store/jdStore';
import { useInterviewStore } from '../../store/interviewStore';
import { useMicrophoneSetupCheck } from '../../hooks/useMicrophoneSetupCheck';
import {
  Alert,
  Button,
  Card,
  Field,
  LoadingState,
  PageShell,
  StatusBadge,
  inputClass,
} from '../../components/ui/DemoLayout';

const INTERVIEW_TYPE_OPTIONS = [
  { value: 'technical', label: '기술 면접', desc: '직무 역량과 기술 판단 근거를 깊게 확인합니다.' },
  { value: 'personality', label: '인성 면접', desc: '가치관, 협업 방식, 성장 태도를 중심으로 질문합니다.' },
  { value: 'comprehensive', label: '종합 면접', desc: '기술과 인성을 함께 검증하는 실전형 구성입니다.' },
];

const PERSONA_OPTIONS = [
  { value: 'coach', label: '코치형', desc: '답변의 장점과 개선 포인트를 부드럽게 끌어냅니다.' },
  { value: 'practical', label: '실무형', desc: '현업 상황과 문제 해결 과정을 현실적으로 확인합니다.' },
  { value: 'verify', label: '검증형', desc: '경험의 근거, 역할, 성과를 꼼꼼히 확인합니다.' },
];

const INTERVIEW_MODE_OPTIONS = [
  { value: 'voice', label: '음성 면접', desc: '마이크로 답변하며 실전 면접 흐름에 맞춰 진행합니다.' },
  { value: 'text', label: '텍스트 면접', desc: '키보드 답변으로 질문과 답변을 차분히 정리합니다.' },
];

const DEFAULT_QUESTION_COUNT = 5;
const FALLBACK_INTERVIEW_START_POINT_COST = 10;
const CURRENT_SESSION_STORAGE_KEY = 'careerzip_current_session_id';
const QA_METADATA_SOURCE_LABEL = 'generation_metadata';

function fmtDateTime(v) {
  return v ? new Date(v).toLocaleString('ko-KR') : '기록 없음';
}

function getResults(data) {
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.results) ? data.results : [];
}

function getStoredProjectIds() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem('careerzip_selected_project_ids') || '[]');
    return Array.isArray(parsed) ? parsed.map((id) => String(id)).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function storeProjectIds(ids) {
  const nextIds = ids.map((id) => String(id)).filter(Boolean);
  if (nextIds.length) window.localStorage.setItem('careerzip_selected_project_ids', JSON.stringify(nextIds));
  else window.localStorage.removeItem('careerzip_selected_project_ids');
}

function getProjectId(project) {
  const id = project?.project_id ?? project?.id;
  return id == null ? '' : String(id);
}


function rememberCurrentSessionId(sessionId) {
  if (!sessionId || typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(CURRENT_SESSION_STORAGE_KEY, sessionId);
  } catch {
    // sessionStorage may be unavailable in some privacy/browser modes.
  }
}

function collectSourceTags(payload, depth = 0) {
  if (!payload || depth > 3) return [];
  if (Array.isArray(payload)) {
    return payload.flatMap((item) => collectSourceTags(item, depth + 1));
  }
  if (typeof payload !== 'object') return [];

  const directTags = Array.isArray(payload.source_tags)
    ? payload.source_tags
    : payload.source_tags
      ? [payload.source_tags]
      : [];

  return [
    ...directTags,
    ...collectSourceTags(payload.data, depth + 1),
    ...collectSourceTags(payload.results, depth + 1),
    ...collectSourceTags(payload.questions, depth + 1),
  ];
}

function extractGenerationMetadata(...payloads) {
  const metadataTag = payloads
    .flatMap((payload) => collectSourceTags(payload))
    .find((tag) => tag?.source_label === QA_METADATA_SOURCE_LABEL);

  if (!metadataTag) return null;

  return (
    metadataTag.metadata ??
    metadataTag.generation_metadata ??
    metadataTag.value ??
    metadataTag.data ??
    metadataTag.source_value ??
    metadataTag.payload ??
    metadataTag
  );
}

function debugGenerationMetadata(...payloads) {
  if (!import.meta.env.DEV) return;
  const metadata = extractGenerationMetadata(...payloads);
  if (metadata) {
    console.debug('[CareerZip QA] question generation metadata', metadata);
  }
}

function normalizeQuestions(response) {
  const items = getResults(response);
  return [...items].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
}

function formatApiError(err, fallback, interviewStartPointCost = FALLBACK_INTERVIEW_START_POINT_COST) {
  const status = err?.response?.status;
  const detail = err?.response?.data;
  if (status === 402 || detail?.code === 'POINTS_INSUFFICIENT') return `포인트가 부족합니다. 면접 시작에는 ${interviewStartPointCost}P가 필요합니다.`;
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


// 음성 면접 시작 전 마이크 권한, 장치 선택, 실제 입력 레벨을 확인하는 패널.
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

// JD/이력서/프로젝트를 선택하고 면접 세션과 질문을 생성한 뒤 실제 질문 화면으로 넘기는 설정 페이지.
function SessionSetupPage({ adminMode = false }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { jdId, setJd } = useJdStore();
  const { setSessionId, setQuestions, setCurrentQuestionIndex, resetInterview } = useInterviewStore();
  const micCheck = useMicrophoneSetupCheck();
  const [jds, setJds] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [coverLetters, setCoverLetters] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedJdId, setSelectedJdId] = useState(
    jdId || window.localStorage.getItem('careerzip_selected_jd_id') || window.localStorage.getItem('careerzip_temp_jd_id') || '',
  );
  const [selectedResumeId, setSelectedResumeId] = useState(window.localStorage.getItem('careerzip_selected_resume_id') || '');
  const [selectedCoverLetterId, setSelectedCoverLetterId] = useState(window.localStorage.getItem('careerzip_selected_cover_letter_id') || '');
  const [selectedProjectIds, setSelectedProjectIds] = useState(getStoredProjectIds);
  const [interviewType, setInterviewType] = useState('comprehensive');
  const [interviewMode, setInterviewMode] = useState('voice');
  const [persona, setPersona] = useState('practical');
  const [totalQuestionCount, setTotalQuestionCount] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState('');
  const [adminTestSetup, setAdminTestSetup] = useState(null);
  const [interviewStartPointCost, setInterviewStartPointCost] = useState(FALLBACK_INTERVIEW_START_POINT_COST);
  const [pointPolicyLoaded, setPointPolicyLoaded] = useState(adminMode);

  const selectedJd = useMemo(() => jds.find((item) => item.jd_id === selectedJdId) || null, [jds, selectedJdId]);
  const selectedResume = useMemo(() => resumes.find((item) => item.resume_id === selectedResumeId) || null, [resumes, selectedResumeId]);
  const selectedCoverLetter = useMemo(
    () => coverLetters.find((item) => item.cover_letter_id === selectedCoverLetterId) || null,
    [coverLetters, selectedCoverLetterId],
  );
  const selectedProjects = useMemo(
    () => projects.filter((item) => selectedProjectIds.includes(getProjectId(item))),
    [projects, selectedProjectIds],
  );
  // 음성 면접일 때만 마이크 확인 완료 여부를 세션 생성 조건으로 사용한다.
  const requiresMicrophone = interviewMode === 'voice';

  const loadInterviewStartPointPolicy = async () => {
    if (adminMode) return;
    try {
      const policy = await mypageApi.getInterviewSessionStartPointPolicy();
      const nextCost = Number(policy?.cost ?? Math.abs(Number(policy?.amount)));
      if (Number.isFinite(nextCost) && nextCost >= 0) {
        setInterviewStartPointCost(nextCost);
      }
      setPointPolicyLoaded(true);
    } catch {
      setPointPolicyLoaded(false);
      setInterviewStartPointCost(FALLBACK_INTERVIEW_START_POINT_COST);
    }
  };

  const applyAdminSetup = (setup) => {
    const materials = setup?.materials ?? {};
    const jd = materials.jd;
    const resume = materials.resume;
    const coverLetter = materials.cover_letter;
    const nextProjects = materials.projects ?? [];
    const setupPersona = setup?.persona?.persona_type || 'practical';
    const nextPersona = setupPersona === 'verifier' ? 'verify' : setupPersona;
    const nextQuestionCount = setup?.defaults?.question_count || DEFAULT_QUESTION_COUNT;

    setAdminTestSetup(setup);
    setJds(jd ? [jd] : []);
    setResumes(resume ? [resume] : []);
    setCoverLetters(coverLetter ? [coverLetter] : []);
    setProjects(nextProjects);
    setSelectedJdId(jd?.jd_id || '');
    setSelectedResumeId(resume?.resume_id || '');
    setSelectedCoverLetterId(coverLetter?.cover_letter_id || '');
    setSelectedProjectIds(nextProjects.map(getProjectId).filter(Boolean));
    setInterviewType(setup?.defaults?.interview_type || 'comprehensive');
    setInterviewMode(setup?.defaults?.interview_mode || 'voice');
    setPersona(nextPersona);
    setTotalQuestionCount(String(nextQuestionCount));
  };

  const fetchAdminSetup = async () => {
    const versionId = searchParams.get('versionId');
    if (!versionId) {
      setError('관리자 테스트에 사용할 프롬프트 버전이 없습니다. 버전 관리 화면에서 테스트 버튼으로 진입해주세요.');
      setInitialLoading(false);
      return;
    }

    setInitialLoading(true);
    setError('');
    try {
      const setup = await getPromptVersionTestSetup(versionId);
      applyAdminSetup(setup);
    } catch (err) {
      setError(formatApiError(err, '관리자 테스트 자료를 불러오지 못했습니다.'));
      if (err?.response?.status === 401) navigate('/admin/login');
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchSources = async () => {
    // 세션 생성 화면에 필요한 JD/이력서/자소서/프로젝트 목록을 한 번에 불러온다.
    setInitialLoading(true);
    setError('');
    try {
      const [jdData, resumeData, coverLetterData, projectData] = await Promise.all([
        jdApi.getJds(),
        resumeApi.getResumes(),
        coverLetterApi.getCoverLetters(),
        projectApi.getProjects(),
      ]);
      const nextJds = getResults(jdData);
      const nextResumes = getResults(resumeData);
      const nextCoverLetters = getResults(coverLetterData);
      const nextProjects = getResults(projectData);
      setJds(nextJds);
      setResumes(nextResumes);
      setCoverLetters(nextCoverLetters);
      setProjects(nextProjects);

      const rememberedJd = nextJds.some((item) => item.jd_id === selectedJdId) ? selectedJdId : nextJds[0]?.jd_id || '';
      const rememberedResume = nextResumes.some((item) => item.resume_id === selectedResumeId) ? selectedResumeId : nextResumes[0]?.resume_id || '';
      const rememberedCoverLetter = nextCoverLetters.some((item) => item.cover_letter_id === selectedCoverLetterId) ? selectedCoverLetterId : '';
      const nextProjectIdSet = new Set(nextProjects.map(getProjectId).filter(Boolean));
      const rememberedProjectIds = selectedProjectIds.filter((projectId) => nextProjectIdSet.has(projectId));

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
      setSelectedProjectIds(rememberedProjectIds);
      storeProjectIds(rememberedProjectIds);
      await loadInterviewStartPointPolicy();
    } catch (err) {
      setError(formatApiError(err, '자료 목록을 불러오지 못했습니다.', interviewStartPointCost));
      if (err?.response?.status === 401) navigate('/auth/login');
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    if (!localStorage.getItem('access_token')) {
      setError('로그인이 필요합니다. 다시 로그인해주세요.');
      navigate(adminMode ? '/admin/login' : '/auth/login');
      return;
    }
    if (adminMode) fetchAdminSetup();
    else fetchSources();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 질문 생성에 필요한 핵심 자료가 없으면 세션 생성을 시작하지 않는다.
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
      navigate(adminMode ? '/admin/login' : '/auth/login');
      return;
    }
    if (!adminMode) {
      const confirmed = window.confirm(`면접 시작 시 ${interviewStartPointCost}P가 차감됩니다.\n진행하시겠습니까?`);
      if (!confirmed) return;
    }

    const count = parseInt(totalQuestionCount, 10);
    const questionCount = !Number.isNaN(count) && count > 0 ? count : DEFAULT_QUESTION_COUNT;
    // 백엔드 세션 생성 API가 사용하는 필드명과 기존 프론트 필드명을 함께 맞춰 보낸다.
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
      // 이전 면접 상태를 비우고 새 세션부터 질문 목록까지 한 흐름으로 준비한다.
      resetInterview();
      const sessionData = await interviewApi.createSession(sessionPayload);
      newSessionId = sessionData?.session_id ?? sessionData?.id;
      if (!newSessionId) throw new Error('session_id를 응답에서 찾을 수 없습니다.');
      setSessionId(newSessionId);

      setLoadingStep('면접 질문 생성 중...');
      // 세션에 연결된 JD/이력서/프로젝트를 바탕으로 실제 면접 질문을 생성한다.
      const questionPayload = {
        question_count: questionCount,
        project_ids: selectedProjectIds,
        ...(adminMode && adminTestSetup?.prompt_version?.prompt_ver_id
          ? { prompt_version_id: adminTestSetup.prompt_version.prompt_ver_id }
          : {}),
      };
      if (import.meta.env.DEV) {
        console.debug('[SessionSetupPage] generateQuestions payload', questionPayload);
      }
      const questionGenerationResponse = await interviewApi.generateQuestions(newSessionId, questionPayload);

      setLoadingStep('생성된 질문을 불러오는 중...');
      // 생성 직후 다시 조회해 store에 정렬된 질문 목록을 넣고 실제 면접 화면으로 이동한다.
      const questionResponse = await interviewApi.getQuestions(newSessionId);
      debugGenerationMetadata(questionGenerationResponse, questionResponse);
      const orderedQuestions = normalizeQuestions(questionResponse);
      setQuestions(orderedQuestions);
      setCurrentQuestionIndex(0);
      rememberCurrentSessionId(newSessionId);

      if (adminMode) {
        window.localStorage.setItem(
          'careerzip_admin_interview_test',
          JSON.stringify({
            session_id: newSessionId,
            prompt_version_id: adminTestSetup?.prompt_version?.prompt_ver_id,
            template_id: adminTestSetup?.template?.template_id,
            persona_type: adminTestSetup?.persona?.persona_type,
            return_to: '/admin/versions',
          }),
        );
      }

      const nextInterviewPath = adminMode
        ? '/interview/question-admin'
        : interviewMode === 'text'
          ? '/interview/chat'
          : '/interview/question';
      navigate(`${nextInterviewPath}?sessionId=${encodeURIComponent(newSessionId)}`);
    } catch (err) {
      setError(formatApiError(err, newSessionId ? '질문 생성에 실패했습니다.' : '세션 생성에 실패했습니다.', interviewStartPointCost));
      if (err?.response?.status === 401) navigate(adminMode ? '/admin/login' : '/auth/login');
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
        <Button
          type="button"
          variant="secondary"
          onClick={adminMode ? fetchAdminSetup : fetchSources}
          disabled={initialLoading || loading}
        >
          목록 새로고침
        </Button>
      }
      activeNav="면접 진행"
      navDisabled={adminMode}
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
            </section>

            <section className="rounded-lg border border-[rgba(0,0,0,0.12)] bg-[#EEEEEE] p-4">
              <p className="text-sm font-black text-[#253900]">선택 요약</p>
              <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
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
                <div>
                  <dt className="text-xs font-bold text-[#253900]">프로젝트</dt>
                  <dd className="mt-1 font-semibold text-[#000000]">
                    {selectedProjects.length ? selectedProjects.map((item) => item.project_name || '프로젝트').join(', ') : '선택 안 함'}
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
              <div className="grid gap-3 md:grid-cols-3">
                {PERSONA_OPTIONS.map((opt) => (
                  <OptionCard
                    key={opt.value}
                    option={{ ...opt, disabled: adminMode || opt.disabled }}
                    checked={persona === opt.value}
                    name="persona"
                    onChange={setPersona}
                  />
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
                  <OptionCard
                    key={opt.value}
                    option={{ ...opt, disabled: adminMode || opt.disabled }}
                    checked={interviewMode === opt.value}
                    name="interview_mode"
                    onChange={setInterviewMode}
                  />
                ))}
              </div>
            </section>

            <MicrophoneCheckPanel micCheck={micCheck} required={requiresMicrophone} />

            {error && <Alert tone="danger">{error}</Alert>}
            {!adminMode && (
              <p className="text-sm font-bold text-[rgba(0,0,0,0.62)]">
                면접 시작 시 {interviewStartPointCost}P가 차감됩니다.
                {!pointPolicyLoaded && ' 현재 기본 정책 금액으로 안내 중입니다.'}
              </p>
            )}

            <div className="flex flex-wrap justify-between gap-3 border-t border-[rgba(0,0,0,0.10)] pt-6">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate(adminMode ? '/admin/versions' : '/input/cover-letter-project')}
                disabled={loading}
              >
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
