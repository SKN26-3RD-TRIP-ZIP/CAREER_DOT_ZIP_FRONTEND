import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInterview } from '../../hooks/useInterview';
import { useSTT } from '../../hooks/useSTT';
import { useTTS } from '../../hooks/useTTS';
import {
  getReportMetadata,
  getReportScoreDetail,
  getReportScoreSummary,
  getReportTriggeredTags,
} from '../../utils/reportSummary';

const MOCK_QUESTIONS = [
  { question_id: 'mock-1', question_text: '지원하신 백엔드 직무에서 가장 자신 있는 기술 스택은 무엇인가요?', order_index: 0 },
  { question_id: 'mock-2', question_text: 'Spring Boot(또는 Django)를 사용한 프로젝트 경험을 설명해주세요.', order_index: 1 },
  { question_id: 'mock-3', question_text: '해당 프로젝트에서 본인의 구체적인 기여도는 무엇이었나요?', order_index: 2 },
];

const MOCK_FOLLOWUP = '그 기술을 선택한 이유와, 다른 기술 대비 장단점을 설명해주실 수 있나요?';

function ScoreRow({ label, value }) {
  if (value === null || value === undefined) return null;
  return (
    <div className="flex justify-between py-1 text-sm">
      <span className="text-[rgba(0,0,0,0.6)]">{label}</span>
      <span className="font-semibold">{typeof value === 'number' ? value.toFixed(1) : value}</span>
    </div>
  );
}

function ReportPanel({ reportData, reportLoading, sessionId }) {
  if (reportLoading) {
    return (
      <div className="mt-6 rounded-xl border border-[rgba(0,0,0,0.1)] p-6 text-center text-[rgba(0,0,0,0.5)]">
        면접 결과를 분석 중입니다...
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="mt-6 rounded-xl border border-[rgba(0,0,0,0.1)] p-4 text-sm text-[rgba(0,0,0,0.5)]">
        <p>리포트를 불러오지 못했습니다.</p>
        <p className="mt-1">평가가 완료되면 별도로 확인할 수 있습니다.</p>
        <p className="mt-1 text-xs">세션 ID: {sessionId}</p>
      </div>
    );
  }

  const scoreSummary = getReportScoreSummary(reportData);
  const scoreDetail = getReportScoreDetail(reportData);
  const meta = getReportMetadata(reportData);
  const tags = getReportTriggeredTags(reportData);

  return (
    <div className="mt-6 rounded-xl border border-[rgba(8,203,0,0.4)] bg-[rgba(8,203,0,0.1)] p-6">
      <h2 className="text-lg font-bold text-[#253900]">면접 결과 리포트</h2>
      <p className="mt-1 text-xs text-[#253900]">
        평가 완료: {meta.evaluated_at ? new Date(meta.evaluated_at).toLocaleString('ko-KR') : '-'}
      </p>

      <div className="mt-4 rounded-lg bg-[#EEEEEE] p-4">
        <p className="text-sm font-semibold text-[rgba(0,0,0,0.7)]">점수 요약</p>
        <ScoreRow label="종합 점수" value={scoreSummary.overall_score} />
        <ScoreRow label="BEI 평균" value={scoreSummary.bei_avg} />
        <ScoreRow label="CBI 평균" value={scoreSummary.cbi_avg} />
        <ScoreRow label="기술 역량" value={scoreSummary.tech_avg} />
      </div>

      {(scoreDetail.strength || scoreDetail.weakness) && (
        <div className="mt-3 space-y-2">
          {scoreDetail.strength && (
            <div className="rounded-lg bg-[rgba(8,203,0,0.1)] p-3 text-sm">
              <span className="font-semibold text-[#253900]">강점: </span>
              <span className="text-[#253900]">{scoreDetail.strength}</span>
            </div>
          )}
          {scoreDetail.weakness && (
            <div className="rounded-lg bg-[rgba(37,57,0,0.08)] p-3 text-sm">
              <span className="font-semibold text-[#253900]">개선 필요: </span>
              <span className="text-[#253900]">{scoreDetail.weakness}</span>
            </div>
          )}
          {scoreDetail.improvement && (
            <div className="rounded-lg bg-[rgba(0,0,0,0.04)] p-3 text-sm">
              <span className="font-semibold text-[rgba(0,0,0,0.7)]">권고사항: </span>
              <span className="text-[rgba(0,0,0,0.6)]">{scoreDetail.improvement}</span>
            </div>
          )}
        </div>
      )}

      {(tags.strength_tags?.length > 0 || tags.weakness_tags?.length > 0) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {tags.strength_tags?.map((tag) => (
            <span key={tag} className="rounded-full bg-[rgba(8,203,0,0.15)] px-3 py-1 text-xs text-[#253900]">
              {tag}
            </span>
          ))}
          {tags.weakness_tags?.map((tag) => (
            <span key={tag} className="rounded-full bg-[rgba(0,0,0,0.06)] px-3 py-1 text-xs text-[#000000]">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function VoiceInterviewPage() {
  const navigate = useNavigate();
  const [manualSessionId, setManualSessionId] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [accessTokenInput, setAccessTokenInput] = useState('');
  const [hasAccessToken, setHasAccessToken] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const autoLoadAttempted = useRef(false);

  // 데모 모드 상태
  const [isMockMode, setIsMockMode] = useState(false);
  const [mockIndex, setMockIndex] = useState(0);
  const [mockFollowup, setMockFollowup] = useState(null);
  const [mockDone, setMockDone] = useState(false);
  const [mockTranscript, setMockTranscript] = useState('');

  const {
    loading,
    error,
    isInterviewComplete,
    reportData,
    reportLoading,
    sessionId,
    questions,
    currentQuestion,
    currentQuestionIndex,
    setSessionId,
    loadQuestions,
    submitVoiceAnswer,
    resetInterview,
  } = useInterview();

  const {
    transcript,
    setTranscript,
    isListening,
    isSupported: isSTTSupported,
    speechDuration,
    error: sttError,
    startListening,
    stopListening,
    resetTranscript,
  } = useSTT();

  const { speak, stop, isSpeaking, isSupported: isTTSSupported } = useTTS();

  // store에 sessionId가 이미 있으면(세션 설정 페이지에서 넘어온 경우) 자동으로 질문 로드
  useEffect(() => {
    if (autoLoadAttempted.current) return;
    if (!sessionId) return;
    if (questions.length > 0) return;
    if (!localStorage.getItem('access_token')) return;

    autoLoadAttempted.current = true;
    setSuccessMessage('');
    loadQuestions(sessionId)
      .then((loaded) => {
        setSuccessMessage(`질문 ${loaded.length}개를 불러왔습니다. 면접을 시작합니다.`);
      })
      .catch(() => {
        setSuccessMessage('');
      });
  // sessionId가 마운트 시점에 이미 있을 때만 실행 — 의존성 배열 의도적 최소화
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const handleSaveAccessToken = () => {
    const token = accessTokenInput.trim();
    if (!token) {
      alert('access token을 입력해주세요.');
      return;
    }
    localStorage.setItem('access_token', token);
    setHasAccessToken(true);
    setAccessTokenInput('');
    setSuccessMessage('access token이 저장되었습니다.');
  };

  const handleRemoveAccessToken = () => {
    localStorage.removeItem('access_token');
    setHasAccessToken(false);
    setSuccessMessage('access token이 삭제되었습니다.');
  };

  const handleLoadQuestions = async () => {
    if (!localStorage.getItem('access_token')) {
      alert('access token을 먼저 저장해주세요.');
      return;
    }
    if (!manualSessionId.trim()) {
      alert('session_id를 입력해주세요.');
      return;
    }

    setSuccessMessage('');
    setSessionId(manualSessionId.trim());

    try {
      const loaded = await loadQuestions(manualSessionId.trim());
      setSuccessMessage(`질문 목록을 불러왔습니다. 총 ${loaded.length}개 / 면접이 시작되었습니다.`);
    } catch {
      setSuccessMessage('');
    }
  };

  const handleSpeak = () => {
    if (!currentQuestion?.question_text) return;
    speak(currentQuestion.question_text);
  };

  const handleSubmit = async () => {
    if (!transcript.trim()) {
      alert('답변 내용이 비어 있습니다.');
      return;
    }

    setSuccessMessage('');

    try {
      await submitVoiceAnswer({ transcript: transcript.trim(), speechDuration });
      resetTranscript();
      if (!isInterviewComplete) {
        setSuccessMessage('답변과 STT 결과가 저장되었습니다.');
      }
    } catch {
      // error state는 useInterview 내부에서 설정
    }
  };

  const handleReset = () => {
    resetInterview();
    resetTranscript();
    setManualSessionId('');
    setSuccessMessage('');
    autoLoadAttempted.current = false;
  };

  const handleNewInterview = () => {
    handleReset();
    navigate('/jd');
  };

  const handleViewReport = () => {
    if (sessionId) {
      navigate(`/report/${sessionId}`);
      return;
    }

    alert('리포트를 열 실제 session_id가 없습니다. 마이페이지로 이동합니다.');
    navigate('/mypage');
  };

  useEffect(() => {
    setHasAccessToken(Boolean(localStorage.getItem('access_token')));
  }, []);

  // 새 질문으로 넘어가면 자동 TTS 재생
  useEffect(() => {
    if (currentQuestion?.question_text && isTTSSupported && !isInterviewComplete) {
      speak(currentQuestion.question_text);
    }
  }, [currentQuestion?.question_id, currentQuestion?.question_text, isTTSSupported, isInterviewComplete, speak]);

  // 면접 진행 중 새로고침/창 닫기 방지 (진행 중일 때만)
  useEffect(() => {
    const inProgress = questions.length > 0 && !isInterviewComplete;
    if (!inProgress) return undefined;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [questions.length, isInterviewComplete]);

  // 면접 완료 화면
  if (isInterviewComplete) {
    return (
      <main className="min-h-screen bg-[rgba(0,0,0,0.06)] px-6 py-8 text-[#000000]">
        <section className="mx-auto max-w-4xl rounded-2xl bg-[#EEEEEE] p-6 shadow">
          <div className="rounded-xl bg-[rgba(8,203,0,0.1)] p-6 text-center">
            <p className="text-3xl">✓</p>
            <h1 className="mt-2 text-2xl font-bold text-[#253900]">면접이 완료되었습니다</h1>
            <p className="mt-2 text-[#253900]">
              총 {questions.length}개의 질문에 모두 답변하셨습니다.
            </p>
            <p className="mt-1 text-sm text-[#08CB00]">세션 ID: {sessionId}</p>
          </div>

          <ReportPanel
            reportData={reportData}
            reportLoading={reportLoading}
            sessionId={sessionId}
          />

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              className="rounded-lg bg-[#08CB00] px-6 py-2.5 text-sm font-semibold text-[#EEEEEE]"
              onClick={handleViewReport}
            >
              리포트 보기
            </button>
            <button
              type="button"
              className="rounded-lg border border-[rgba(0,0,0,0.18)] px-5 py-2.5 text-sm text-[rgba(0,0,0,0.6)]"
              onClick={handleNewInterview}
            >
              새 면접 시작
            </button>
          </div>
        </section>
      </main>
    );
  }

  const questionsLoaded = questions.length > 0;

  return (
    <main className="min-h-screen bg-[rgba(0,0,0,0.06)] px-6 py-8 text-[#000000]">
      <section className="mx-auto max-w-4xl rounded-2xl bg-[#EEEEEE] p-6 shadow">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">Career.zip 음성 면접</h1>
            <p className="mt-1 text-sm text-[rgba(0,0,0,0.6)]">
              질문은 자동으로 TTS 재생되고, 음성 답변을 STT로 인식합니다.
            </p>
          </div>
          <button
            type="button"
            className="rounded-lg border border-[rgba(0,0,0,0.18)] px-3 py-1.5 text-xs text-[rgba(0,0,0,0.5)]"
            onClick={() => navigate('/jd')}
          >
            JD 입력으로
          </button>
        </div>

        {/* 자동 로드 대기 중 안내 */}
        {loading && !questionsLoaded && (
          <div className="mt-4 rounded-xl border border-[rgba(8,203,0,0.4)] bg-[rgba(8,203,0,0.1)] p-4 text-sm text-[#253900]">
            면접 질문을 불러오는 중입니다...
          </div>
        )}

        {/* 세션 없음 안내 — store sessionId도 없고 수동 입력도 없는 경우 */}
        {!loading && !questionsLoaded && !sessionId && !isMockMode && (
          <div className="mt-4 rounded-xl border border-[rgba(37,57,0,0.3)] bg-[rgba(37,57,0,0.08)] p-4">
            <p className="text-sm font-semibold text-[#253900]">세션이 없습니다</p>
            <p className="mt-1 text-sm text-[#253900]">
              JD 입력 → 면접 설정 순서로 진행하거나, 데모 모드로 바로 시작할 수 있습니다.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-lg bg-[#08CB00] px-4 py-2 text-sm font-semibold text-[#EEEEEE]"
                onClick={() => { setIsMockMode(true); setMockIndex(0); setMockFollowup(null); setMockDone(false); }}
              >
                데모 면접 시작
              </button>
              <button
                type="button"
                className="rounded-lg bg-[#000000] px-4 py-2 text-sm text-[#EEEEEE]"
                onClick={() => navigate('/jd')}
              >
                JD 입력하러 가기
              </button>
            </div>
          </div>
        )}

        {/* ===== 데모 모드 면접 UI ===== */}
        {isMockMode && !mockDone && (
          <div className="mt-4 space-y-4">
            {/* 데모 질문 */}
            <div className="rounded-xl border border-[rgba(0,0,0,0.1)] p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-semibold">
                  질문 {mockFollowup ? '꼬리' : mockIndex + 1} / {MOCK_QUESTIONS.length}
                </h2>
                <span className="text-xs bg-[#08CB00] text-[#EEEEEE] rounded-full px-2 py-0.5">데모</span>
              </div>
              <div className="rounded-lg bg-[rgba(0,0,0,0.04)] p-4 text-base leading-relaxed">
                {mockFollowup ?? MOCK_QUESTIONS[mockIndex].question_text}
              </div>
              {mockFollowup && (
                <p className="mt-1 text-xs text-[#08CB00] font-semibold">꼬리질문</p>
              )}
            </div>

            {/* 답변 입력 */}
            <div className="rounded-xl border border-[rgba(0,0,0,0.1)] p-4">
              <h2 className="text-base font-semibold mb-2">텍스트 답변</h2>
              <textarea
                className="w-full min-h-32 rounded-lg border border-[rgba(0,0,0,0.18)] p-3 text-sm focus:outline-none focus:border-[#08CB00]"
                value={mockTranscript}
                onChange={(e) => setMockTranscript(e.target.value)}
                placeholder="답변을 입력하세요..."
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-lg bg-[#08CB00] px-5 py-2 text-sm font-semibold text-[#EEEEEE] disabled:opacity-50"
                  disabled={!mockTranscript.trim()}
                  onClick={() => {
                    if (!mockFollowup) {
                      setMockFollowup(MOCK_FOLLOWUP);
                    } else {
                      setMockFollowup(null);
                      setMockTranscript('');
                      if (mockIndex < MOCK_QUESTIONS.length - 1) {
                        setMockIndex((i) => i + 1);
                      } else {
                        setMockDone(true);
                      }
                    }
                    setMockTranscript('');
                  }}
                >
                  {!mockFollowup ? '답변 제출' : '꼬리질문 답변 제출'}
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-[rgba(0,0,0,0.2)] px-4 py-2 text-sm text-[#000000]"
                  onClick={() => setMockDone(true)}
                >
                  면접 종료
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 데모 모드 완료 화면 */}
        {isMockMode && mockDone && (
          <div className="mt-4 rounded-xl bg-[rgba(8,203,0,0.1)] border border-[rgba(8,203,0,0.4)] p-6 text-center">
            <p className="text-3xl">✓</p>
            <h2 className="mt-2 text-xl font-bold text-[#253900]">면접이 완료되었습니다</h2>
            <p className="mt-1 text-sm text-[#253900]">총 {MOCK_QUESTIONS.length}개의 질문에 답변하셨습니다.</p>
            <div className="mt-5 flex justify-center gap-3">
              <button
                type="button"
                className="rounded-lg bg-[#08CB00] px-6 py-2.5 text-sm font-semibold text-[#EEEEEE]"
                onClick={handleViewReport}
              >
                리포트 보기
              </button>
              <button
                type="button"
                className="rounded-lg border border-[rgba(0,0,0,0.18)] px-5 py-2.5 text-sm text-[rgba(0,0,0,0.6)]"
                onClick={() => { setIsMockMode(false); setMockIndex(0); setMockFollowup(null); setMockDone(false); setMockTranscript(''); }}
              >
                다시 시작
              </button>
            </div>
          </div>
        )}

        {/* 현재 질문 + TTS — 질문이 로드된 후에만 표시 */}
        {!isMockMode && questionsLoaded && (
          <div className="mt-4 rounded-xl border border-[rgba(0,0,0,0.1)] p-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold">
                질문 {currentQuestionIndex + 1} / {questions.length}
              </h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-[rgba(0,0,0,0.18)] px-3 py-1.5 text-sm disabled:opacity-50"
                  onClick={handleSpeak}
                  disabled={!currentQuestion || isSpeaking}
                >
                  질문 듣기
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-[rgba(0,0,0,0.18)] px-3 py-1.5 text-sm disabled:opacity-50"
                  onClick={stop}
                  disabled={!isSpeaking}
                >
                  중지
                </button>
              </div>
            </div>

            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-[rgba(0,0,0,0.5)]">
                <span>진행률</span>
                <span>{Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}%</span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-[rgba(0,0,0,0.06)]">
                <div
                  className="h-full rounded-full bg-[#08CB00] transition-all"
                  style={{ width: `${Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}%` }}
                />
              </div>
            </div>

            <div className="mt-3 min-h-16 rounded-lg bg-[rgba(0,0,0,0.04)] p-4 text-base leading-relaxed">
              {currentQuestion?.question_text || '질문을 불러오는 중입니다.'}
            </div>

            {(currentQuestion?.is_follow_up || currentQuestion?.parent_question_id || currentQuestion?.parent_question) && (
              <p className="mt-2 rounded-lg bg-[rgba(8,203,0,0.1)] px-3 py-2 text-xs text-[#253900]">
                답변을 더 구체화하기 위해 추가(꼬리) 질문이 생성되었습니다.
              </p>
            )}

            {!isTTSSupported && (
              <p className="mt-2 text-sm text-[#253900]">
                이 브라우저는 TTS를 지원하지 않습니다. 질문 텍스트를 직접 읽어주세요.
              </p>
            )}
          </div>
        )}

        {/* STT 음성 답변 — 질문이 로드된 후에만 표시 */}
        {questionsLoaded && (
          <div className="mt-4 rounded-xl border border-[rgba(0,0,0,0.1)] p-4">
            <h2 className="text-base font-semibold">음성 답변</h2>

            {!isSTTSupported && (
              <p className="mt-2 text-sm text-[#253900]">
                이 브라우저는 STT를 지원하지 않습니다. 아래에 직접 입력해주세요.
              </p>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-lg bg-[#253900] px-4 py-2 text-sm text-[#EEEEEE] disabled:bg-[rgba(0,0,0,0.3)]"
                onClick={startListening}
                disabled={!currentQuestion || isListening || isSpeaking || !isSTTSupported}
              >
                {isListening ? '녹음 중...' : '녹음 시작'}
              </button>
              <button
                type="button"
                className="rounded-lg bg-[#000000] px-4 py-2 text-sm text-[#EEEEEE] disabled:bg-[rgba(0,0,0,0.3)]"
                onClick={stopListening}
                disabled={!isListening}
              >
                녹음 중지
              </button>
              <button
                type="button"
                className="rounded-lg border border-[rgba(0,0,0,0.18)] px-4 py-2 text-sm"
                onClick={resetTranscript}
              >
                초기화
              </button>
            </div>

            <textarea
              className="mt-3 min-h-36 w-full rounded-lg border border-[rgba(0,0,0,0.18)] p-3 text-sm"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="STT 결과가 여기에 표시됩니다. 직접 수정할 수 있습니다."
            />

            {transcript.trim().length > 0 && transcript.trim().length < 20 && (
              <p className="mt-2 text-sm text-[#253900]">
                답변이 너무 짧습니다. 최소 2~3문장 이상으로 답변하면 더 정확한 피드백을 받을 수 있습니다. (저장은 가능합니다)
              </p>
            )}

            <p className="mt-1 text-xs text-[rgba(0,0,0,0.4)]">
              상태: {isListening ? '녹음 중' : '대기'} · 답변 시간: {speechDuration}초
            </p>

            <button
              type="button"
              className="mt-3 rounded-lg bg-[#08CB00] px-5 py-2 text-sm text-[#EEEEEE] disabled:bg-[rgba(0,0,0,0.3)]"
              onClick={handleSubmit}
              disabled={loading || isListening || !currentQuestion || !transcript.trim()}
            >
              {loading ? '저장 중...' : '답변 제출 및 STT 저장'}
            </button>
          </div>
        )}

        {/* 에러 메시지 */}
        {(error || sttError) && (
          <div className="mt-4 rounded-lg bg-[rgba(0,0,0,0.05)] p-4 text-sm text-[#000000]">
            {error || sttError}
          </div>
        )}

        {/* 성공 메시지 */}
        {successMessage && (
          <div className="mt-4 rounded-lg bg-[rgba(8,203,0,0.1)] p-4 text-sm text-[#253900]">
            {successMessage}
          </div>
        )}

        {/* 디버그 섹션 (토글) */}
        <div className="mt-6">
          <button
            type="button"
            className="text-xs text-[rgba(0,0,0,0.4)] underline"
            onClick={() => setShowDebug((v) => !v)}
          >
            {showDebug ? '디버그 닫기' : '디버그 열기'}
          </button>

          {showDebug && (
            <div className="mt-3 space-y-3 rounded-xl border border-[rgba(0,0,0,0.1)] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[rgba(0,0,0,0.4)]">디버그</p>

              {/* 인증 토큰 */}
              <div>
                <p className="text-sm font-semibold">인증 토큰</p>
                <p className="mt-1 text-sm text-[rgba(0,0,0,0.5)]">
                  access_token:{' '}
                  <span className={hasAccessToken ? 'font-semibold text-[#253900]' : 'font-semibold text-[#000000]'}>
                    {hasAccessToken ? '저장됨' : '없음'}
                  </span>
                </p>
                <textarea
                  className="mt-2 min-h-20 w-full rounded-lg border border-[rgba(0,0,0,0.18)] p-3 text-sm"
                  value={accessTokenInput}
                  onChange={(e) => setAccessTokenInput(e.target.value)}
                  placeholder="access token을 붙여넣으세요"
                />
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    className="rounded-lg bg-[#000000] px-4 py-2 text-sm text-[#EEEEEE]"
                    onClick={handleSaveAccessToken}
                  >
                    토큰 저장
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-[rgba(0,0,0,0.18)] px-4 py-2 text-sm"
                    onClick={handleRemoveAccessToken}
                  >
                    토큰 삭제
                  </button>
                </div>
              </div>

              {/* 수동 Session ID */}
              <div>
                <label className="block text-sm font-semibold">Session ID 직접 입력</label>
                <div className="mt-2 flex gap-2">
                  <input
                    className="w-full rounded-lg border border-[rgba(0,0,0,0.18)] px-3 py-2 text-sm"
                    value={manualSessionId}
                    onChange={(e) => setManualSessionId(e.target.value)}
                    placeholder="예: b457ad22-0a20-4aea-930f-0493cadcb4ee"
                  />
                  <button
                    type="button"
                    className="rounded-lg bg-[#000000] px-4 py-2 text-sm text-[#EEEEEE] disabled:bg-[rgba(0,0,0,0.3)]"
                    onClick={handleLoadQuestions}
                    disabled={loading}
                  >
                    {loading ? '불러오는 중...' : '시작'}
                  </button>
                </div>
              </div>

              {/* 상태 정보 */}
              <div className="rounded-lg bg-[rgba(0,0,0,0.04)] p-3 text-xs text-[rgba(0,0,0,0.5)]">
                <p>sessionId: {sessionId || '-'} · questions: {questions.length} · index: {currentQuestionIndex} · questionId: {currentQuestion?.question_id || '-'}</p>
                {error && <p className="mt-1 text-[#000000]">error: {error}</p>}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default VoiceInterviewPage;
