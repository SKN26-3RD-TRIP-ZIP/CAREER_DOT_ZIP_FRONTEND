import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Check,
  Clock,
  Code2,
  FileText,
  ListChecks,
  MessageSquare,
  Mic,
  RotateCcw,
  UserRound
} from 'lucide-react';
import { interviewApi } from '../../api/interviewApi';
import { jdApi } from '../../api/jdApi';
import { useMicrophoneSetupCheck } from '../../hooks/useMicrophoneSetupCheck';
import { useInterviewStore } from '../../store/interviewStore';
import { useJdStore } from '../../store/jdStore';
import './InterviewSetupCheckPage.css';

const INTERVIEW_TYPES = [
  {
    id: 'technical',
    title: '기술 면접',
    desc: '기술, CS, 프로젝트 구현 경험 중심',
    icon: Code2
  },
  {
    id: 'personality',
    title: '인성·직무 면접',
    desc: '인성, 책임, 경험, 지원 동기, 직무 적합성 중심',
    icon: UserRound
  },
  {
    id: 'mixed',
    title: '종합 면접',
    desc: '기술 + 인성 + 직무 질문 종합',
    icon: Briefcase
  }
];

const PERSONAS = [
  {
    id: 'coach',
    title: '코치형',
    desc: '따뜻하고 친절한 피드백으로 성장을 돕는 스타일',
    icon: MessageSquare
  },
  {
    id: 'practical',
    title: '실무형',
    desc: '실제 업무 관점에서 실무 역량을 평가',
    icon: ListChecks
  },
  {
    id: 'verify',
    title: '검증형',
    desc: '논리적이고 엄격하게 핵심 역량을 검증',
    icon: FileText
  }
];

const QUESTION_COUNTS = [
  { id: '5', label: '5문항', estimatedTime: '예상 20분' },
  { id: '8', label: '8문항', estimatedTime: '예상 30~35분' },
  { id: '12', label: '12문항', estimatedTime: '예상 45~50분' }
];

const MATERIALS = [
  ['JD', '토스 Backend Developer', '확인됨'],
  ['이력서', '김현지_백엔드_이력서.pdf', '최신'],
  ['자기소개서', '자기소개서_최종.pdf', '최신'],
  ['희망 직무', '백엔드 개발자', '우선']
];

const PERMISSION_LABELS = {
  idle: '권한 대기',
  checking: '확인 중',
  granted: '허용됨',
  denied: '거부됨',
  'no-device': '장치 없음',
  unsupported: '브라우저 미지원',
  error: '오류'
};

const INPUT_LABELS = {
  idle: '테스트 전',
  no_input: '입력 없음',
  too_low: '음량이 너무 작음',
  normal: '정상 입력'
};

function OptionCard({ item, selected, onSelect }) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      className={`setup-option-card ${selected ? 'is-selected' : ''}`}
      aria-pressed={selected}
      onClick={onSelect}
    >
      <span className="setup-option-card__icon">
        <Icon size={22} strokeWidth={2.1} />
      </span>
      {selected && (
        <span className="setup-option-card__check" aria-hidden="true">
          <Check size={14} strokeWidth={3} />
        </span>
      )}
      <strong>{item.title}</strong>
      <p>{item.desc}</p>
    </button>
  );
}

function Waveform({ waveform }) {
  return (
    <div className="setup-waveform" aria-label="실시간 음성 파형">
      {waveform.map((value, index) => (
        <span
          key={`${index}-${value.toFixed(3)}`}
          style={{ height: `${Math.max(8, Math.round(value * 58))}px` }}
        />
      ))}
    </div>
  );
}

function getStartErrorMessage(error) {
  const status = error?.response?.status;
  const data = error?.response?.data;

  if (!error?.response) {
    return '백엔드 서버에 연결할 수 없습니다. runserver가 켜져 있는지 확인해 주세요.';
  }
  if (status === 401) {
    return '로그인이 필요합니다. 로그인 후 다시 시도해 주세요.';
  }
  if (typeof data?.detail === 'string') {
    return data.detail;
  }
  if (data && typeof data === 'object') {
    return `입력값 오류: ${JSON.stringify(data)}`;
  }
  if (error?.message) {
    return error.message;
  }
  return '면접 세션 또는 질문 생성에 실패했습니다.';
}

function normalizeJdList(response) {
  if (Array.isArray(response?.results)) return response.results;
  if (Array.isArray(response)) return response;
  return [];
}

function InterviewSetupCheckPage({ embedded = false }) {
  const navigate = useNavigate();
  const [selectedInterviewType, setSelectedInterviewType] = useState('technical');
  const [selectedPersona, setSelectedPersona] = useState('practical');
  const [selectedQuestionCount, setSelectedQuestionCount] = useState('5');
  const [startStatus, setStartStatus] = useState('idle');
  const [startError, setStartError] = useState('');
  const { jdId, setJd } = useJdStore();
  const setSessionId = useInterviewStore((state) => state.setSessionId);
  const setQuestions = useInterviewStore((state) => state.setQuestions);
  const setCurrentQuestionIndex = useInterviewStore((state) => state.setCurrentQuestionIndex);
  const resetInterview = useInterviewStore((state) => state.resetInterview);
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
    handleDeviceChange
  } = useMicrophoneSetupCheck();

  const statusTone = useMemo(() => {
    if (isVerified) return 'success';
    if (permissionStatus === 'denied' || permissionStatus === 'no-device' || permissionStatus === 'unsupported' || permissionStatus === 'error') {
      return 'danger';
    }
    if (inputStatus === 'too_low') return 'warning';
    return 'neutral';
  }, [inputStatus, isVerified, permissionStatus]);

  const levelPercent = Math.round(Math.min(1, Math.max(0, level)) * 100);
  const selectedInterviewTypeItem = INTERVIEW_TYPES.find((item) => item.id === selectedInterviewType);
  const selectedPersonaItem = PERSONAS.find((item) => item.id === selectedPersona);
  const selectedQuestionCountItem = QUESTION_COUNTS.find((item) => item.id === selectedQuestionCount);
  const canStartInterview = Boolean(
    isVerified &&
    selectedInterviewTypeItem &&
    selectedPersonaItem &&
    selectedQuestionCountItem &&
    startStatus !== 'loading'
  );

  const handleStartInterview = async () => {
    if (!canStartInterview) return;
    setStartError('');

    if (!window.localStorage.getItem('access_token')) {
      setStartError('로그인 토큰이 없습니다. 로그인 후 다시 시도해 주세요.');
      return;
    }

    let effectiveJdId = jdId || window.localStorage.getItem('careerzip_temp_jd_id');

    if (!effectiveJdId) {
      setStartError('사용할 JD 정보가 없습니다. 자료 입력 또는 기존 JD 선택 후 다시 시도해 주세요.');
      return;
    }

    setStartStatus('loading');

    try {
      resetInterview();
      const jdListResponse = await jdApi.listJds();
      const currentUserJds = normalizeJdList(jdListResponse);
      const selectedJd = currentUserJds.find((item) => String(item.jd_id ?? item.id) === String(effectiveJdId));

      if (!selectedJd) {
        const latestJd = currentUserJds[0];
        if (!latestJd) {
          throw new Error('현재 로그인 계정에 저장된 JD가 없습니다. JD 입력 후 다시 시도해 주세요.');
        }

        effectiveJdId = latestJd.jd_id ?? latestJd.id;
        setJd(effectiveJdId, latestJd);
        window.localStorage.setItem('careerzip_temp_jd_id', effectiveJdId);
      }

      const totalQuestionCount = Number(selectedQuestionCount);
      const sessionPayload = {
        jd_id: effectiveJdId,
        persona: selectedPersona,
        interview_type: selectedInterviewType === 'mixed' ? 'comprehensive' : selectedInterviewType,
        interview_mode: 'voice',
        total_question_count: totalQuestionCount
      };
      const session = await interviewApi.createSession(sessionPayload);
      const createdSessionId = session?.session_id;

      if (!createdSessionId) {
        throw new Error('세션 생성 응답에 session_id가 없습니다.');
      }

      await interviewApi.generateQuestions(createdSessionId, {
        question_count: totalQuestionCount
      });

      const questionResponse = await interviewApi.getQuestions(createdSessionId);
      const loadedQuestions = Array.isArray(questionResponse?.results)
        ? questionResponse.results
        : Array.isArray(questionResponse)
          ? questionResponse
          : [];
      const orderedQuestions = [...loadedQuestions].sort(
        (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)
      );

      if (orderedQuestions.length === 0) {
        throw new Error('생성된 질문을 불러오지 못했습니다.');
      }

      setSessionId(createdSessionId);
      setQuestions(orderedQuestions);
      setCurrentQuestionIndex(0);
      navigate('/interview/question');
    } catch (error) {
      setStartError(getStartErrorMessage(error));
    } finally {
      setStartStatus('idle');
    }
  };

  return (
    <main className={`interview-setup-check ${embedded ? 'is-embedded' : ''}`}>
      {!embedded && (
        <nav className="setup-topbar" aria-label="Career.zip navigation">
          <a className="setup-logo" href="/dashboard">
            <span>CZ</span>
            Career.zip
          </a>
          <div className="setup-nav-links">
            <a href="/dashboard">Dashboard</a>
            <a href="/data">Data Input</a>
            <a href="/analysis">Analysis</a>
            <a className="is-active" href="/interview/setup">Interview</a>
            <a href="/report">Report</a>
            <a href="/mypage">MyPage</a>
            <a href="/admin">Admin</a>
          </div>
          <div className="setup-top-actions">
            <span className="setup-badge">비로그인 데모</span>
            <a className="setup-profile-chip" href="/mypage/profile">
              <span className="setup-user__avatar">김</span>
              김햄찌
            </a>
          </div>
        </nav>
      )}

      <section className="setup-page-head">
        <div>
          <p>Career.zip / Interview Setup</p>
          <h1>면접을 설정하세요</h1>
          <span>면접 옵션을 선택하고 마이크를 점검한 후, 자신감 있게 면접을 시작하세요.</span>
        </div>
      </section>

      <section className="setup-status-strip">
        <Check size={16} />
        <strong>현재 MVP 연동 상태</strong>
        <span>면접 설정은 테스트 화면에서 조정하고, 마이크 확인 후 실제 면접 화면으로 이동합니다.</span>
      </section>

      <section className="setup-grid">
        <article className="setup-card setup-card--span-6">
          <h2>1. 면접 유형</h2>
          <div className="setup-option-grid setup-option-grid--three">
            {INTERVIEW_TYPES.map((item) => (
              <OptionCard
                key={item.id}
                item={item}
                selected={selectedInterviewType === item.id}
                onSelect={() => setSelectedInterviewType(item.id)}
              />
            ))}
          </div>
        </article>

        <article className="setup-card setup-card--span-6">
          <h2>2. 면접관 스타일</h2>
          <div className="setup-option-grid setup-option-grid--three">
            {PERSONAS.map((item) => (
              <OptionCard
                key={item.id}
                item={item}
                selected={selectedPersona === item.id}
                onSelect={() => setSelectedPersona(item.id)}
              />
            ))}
          </div>
        </article>

        <article className="setup-card setup-card--span-4">
          <h2>3. 질문 수</h2>
          <div className="setup-segmented">
            {QUESTION_COUNTS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={selectedQuestionCount === item.id ? 'is-selected' : ''}
                aria-pressed={selectedQuestionCount === item.id}
                onClick={() => setSelectedQuestionCount(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <p className="setup-time">
            <Clock size={15} /> {selectedQuestionCountItem?.estimatedTime ?? '예상 시간 확인 필요'}
          </p>
        </article>

        <article className="setup-card setup-card--span-8">
          <h2>4. 사용할 자료 요약</h2>
          <div className="setup-material-table">
            {MATERIALS.map(([label, value, status]) => (
              <div key={label}>
                <strong>{label}</strong>
                <span>{value}</span>
                <em>{status}</em>
              </div>
            ))}
          </div>
        </article>

        <article className="setup-card setup-card--span-12 setup-mic-card">
          <div className="setup-section-title">
            <div>
              <h2>5. 마이크 점검</h2>
              <p>마이크 권한을 허용한 뒤 평소 목소리로 1초 정도 말해 주세요.</p>
            </div>
            <span className={`setup-status-pill ${statusTone}`}>
              {isVerified ? '확인 완료' : PERMISSION_LABELS[permissionStatus]}
            </span>
          </div>

          <div className="setup-mic-layout">
            <div className="setup-mic-controls">
              <label>
                <span>마이크 장치</span>
                <select
                  value={selectedDeviceId}
                  onChange={(event) => handleDeviceChange(event.target.value)}
                  disabled={!isSupported || devices.length === 0}
                >
                  {devices.length === 0 ? (
                    <option>마이크 장치를 찾을 수 없습니다</option>
                  ) : (
                    devices.map((device) => (
                      <option key={device.deviceId || device.label} value={device.deviceId}>
                        {device.label}
                      </option>
                    ))
                  )}
                </select>
              </label>

              <button
                type="button"
                className="setup-outline-button"
                onClick={requestMicrophone}
                disabled={!isSupported || permissionStatus === 'checking'}
              >
                <Mic size={16} />
                마이크 권한 요청
              </button>

              {(permissionStatus === 'denied' || permissionStatus === 'error' || permissionStatus === 'no-device') && (
                <button type="button" className="setup-secondary-button" onClick={retry}>
                  <RotateCcw size={16} />
                  다시 시도
                </button>
              )}
            </div>

            <div className="setup-audio-panel">
              <div className="setup-level-head">
                <span>입력 레벨</span>
                <strong>{levelPercent}%</strong>
              </div>
              <div className="setup-level-bar" aria-hidden="true">
                <span style={{ width: `${levelPercent}%` }} />
              </div>
              <Waveform waveform={waveform} />
            </div>

            <div className={`setup-input-status ${statusTone}`}>
              <span className="setup-input-status__icon">
                <Mic size={24} />
              </span>
              <div>
                <strong>{isVerified ? '정상 입력' : INPUT_LABELS[inputStatus]}</strong>
                <p>{isVerified ? '마이크 음성이 안정적으로 확인되었습니다.' : message}</p>
              </div>
            </div>
          </div>

          <div className="setup-mic-message">
            <span>{isTesting ? '테스트 진행 중' : '테스트 대기'}</span>
            <p>{message}</p>
          </div>
        </article>
      </section>

      <section className="setup-summary-bar" aria-label="면접 설정 요약">
        <div>
          <Code2 size={20} />
          <span>면접 유형</span>
          <strong>{selectedInterviewTypeItem?.title ?? '선택 필요'}</strong>
        </div>
        <div>
          <UserRound size={20} />
          <span>면접관 스타일</span>
          <strong>{selectedPersonaItem?.title ?? '선택 필요'}</strong>
        </div>
        <div>
          <ListChecks size={20} />
          <span>질문 수</span>
          <strong>{selectedQuestionCountItem?.label ?? '선택 필요'}</strong>
        </div>
        <div>
          <Mic size={20} />
          <span>답변 방식</span>
          <strong>음성</strong>
        </div>
        <div>
          <Check size={20} />
          <span>마이크 상태</span>
          <strong>{isVerified ? '확인 완료' : '확인 필요'}</strong>
        </div>
      </section>

      <button
        type="button"
        className="setup-start-button"
        disabled={!canStartInterview}
        onClick={handleStartInterview}
      >
        {startStatus === 'loading' ? '세션과 질문 생성 중' : '면접 시작'}
      </button>
      {startError && (
        <p className="setup-start-error" role="alert">
          {startError}
        </p>
      )}
    </main>
  );
}

export default InterviewSetupCheckPage;
