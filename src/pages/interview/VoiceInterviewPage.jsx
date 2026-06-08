import { useEffect, useState } from 'react';
import { useInterview } from '../../hooks/useInterview';
import { useSTT } from '../../hooks/useSTT';
import { useTTS } from '../../hooks/useTTS';

function ScoreRow({ label, value }) {
  if (value === null || value === undefined) return null;
  return (
    <div className="flex justify-between py-1 text-sm">
      <span className="text-slate-600">{label}</span>
      <span className="font-semibold">{typeof value === 'number' ? value.toFixed(1) : value}</span>
    </div>
  );
}

function ReportPanel({ reportData, reportLoading, sessionId }) {
  if (reportLoading) {
    return (
      <div className="mt-6 rounded-xl border border-slate-200 p-6 text-center text-slate-500">
        면접 결과를 분석 중입니다...
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="mt-6 rounded-xl border border-slate-200 p-4 text-sm text-slate-500">
        <p>리포트를 불러오지 못했습니다.</p>
        <p className="mt-1">평가가 완료되면 별도로 확인할 수 있습니다.</p>
        <p className="mt-1 text-xs">세션 ID: {sessionId}</p>
      </div>
    );
  }

  const summary = reportData.summary ?? {};
  const scoreSummary = summary.score_summary ?? {};
  const scoreDetail = summary.score_detail ?? {};
  const meta = summary.evaluation_metadata ?? {};
  const tags = summary.dynamically_triggered_tags ?? {};

  return (
    <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-6">
      <h2 className="text-lg font-bold text-blue-900">면접 결과 리포트</h2>
      <p className="mt-1 text-xs text-blue-700">
        평가 완료: {meta.evaluated_at ? new Date(meta.evaluated_at).toLocaleString('ko-KR') : '-'}
      </p>

      <div className="mt-4 rounded-lg bg-white p-4">
        <p className="text-sm font-semibold text-slate-700">점수 요약</p>
        <ScoreRow label="종합 점수" value={scoreSummary.overall_score} />
        <ScoreRow label="BEI 평균" value={scoreSummary.bei_avg} />
        <ScoreRow label="CBI 평균" value={scoreSummary.cbi_avg} />
        <ScoreRow label="기술 역량" value={scoreSummary.tech_avg} />
      </div>

      {(scoreDetail.strength || scoreDetail.weakness) && (
        <div className="mt-3 space-y-2">
          {scoreDetail.strength && (
            <div className="rounded-lg bg-green-50 p-3 text-sm">
              <span className="font-semibold text-green-800">강점: </span>
              <span className="text-green-700">{scoreDetail.strength}</span>
            </div>
          )}
          {scoreDetail.weakness && (
            <div className="rounded-lg bg-amber-50 p-3 text-sm">
              <span className="font-semibold text-amber-800">개선 필요: </span>
              <span className="text-amber-700">{scoreDetail.weakness}</span>
            </div>
          )}
          {scoreDetail.improvement && (
            <div className="rounded-lg bg-slate-50 p-3 text-sm">
              <span className="font-semibold text-slate-700">권고사항: </span>
              <span className="text-slate-600">{scoreDetail.improvement}</span>
            </div>
          )}
        </div>
      )}

      {(tags.strength_tags?.length > 0 || tags.weakness_tags?.length > 0) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {tags.strength_tags?.map((tag) => (
            <span key={tag} className="rounded-full bg-green-100 px-3 py-1 text-xs text-green-800">
              {tag}
            </span>
          ))}
          {tags.weakness_tags?.map((tag) => (
            <span key={tag} className="rounded-full bg-red-100 px-3 py-1 text-xs text-red-800">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function VoiceInterviewPage() {
  const [manualSessionId, setManualSessionId] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [accessTokenInput, setAccessTokenInput] = useState('');
  const [hasAccessToken, setHasAccessToken] = useState(false);

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

  // 면접 완료 화면
  if (isInterviewComplete) {
    return (
      <main className="min-h-screen bg-slate-100 px-6 py-8 text-slate-900">
        <section className="mx-auto max-w-4xl rounded-2xl bg-white p-6 shadow">
          <div className="rounded-xl bg-green-50 p-6 text-center">
            <p className="text-3xl">✓</p>
            <h1 className="mt-2 text-2xl font-bold text-green-900">면접이 완료되었습니다</h1>
            <p className="mt-2 text-green-700">
              총 {questions.length}개의 질문에 모두 답변하셨습니다.
            </p>
            <p className="mt-1 text-sm text-green-600">세션 ID: {sessionId}</p>
          </div>

          <ReportPanel
            reportData={reportData}
            reportLoading={reportLoading}
            sessionId={sessionId}
          />

          <button
            type="button"
            className="mt-6 rounded-lg bg-slate-900 px-6 py-2 text-white"
            onClick={handleReset}
          >
            새 면접 시작
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-8 text-slate-900">
      <section className="mx-auto max-w-4xl rounded-2xl bg-white p-6 shadow">
        <h1 className="text-2xl font-bold">Career.zip 음성 면접</h1>
        <p className="mt-2 text-sm text-slate-600">
          session_id를 입력하면 면접이 시작됩니다. 질문은 자동으로 TTS 재생되고, 음성 답변을 STT로 인식합니다.
        </p>

        {/* 인증 토큰 설정 */}
        <div className="mt-6 rounded-xl border border-slate-200 p-4">
          <h2 className="text-base font-semibold">인증 토큰</h2>
          <p className="mt-1 text-sm text-slate-500">
            access_token:{' '}
            <span className={hasAccessToken ? 'font-semibold text-green-700' : 'font-semibold text-red-600'}>
              {hasAccessToken ? '저장됨' : '없음'}
            </span>
          </p>
          <textarea
            className="mt-2 min-h-20 w-full rounded-lg border border-slate-300 p-3 text-sm"
            value={accessTokenInput}
            onChange={(e) => setAccessTokenInput(e.target.value)}
            placeholder="access token을 붙여넣으세요"
          />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white"
              onClick={handleSaveAccessToken}
            >
              토큰 저장
            </button>
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
              onClick={handleRemoveAccessToken}
            >
              토큰 삭제
            </button>
          </div>
        </div>

        {/* 세션 ID 입력 */}
        <div className="mt-4 rounded-xl border border-slate-200 p-4">
          <label className="block text-sm font-semibold">Session ID</label>
          <div className="mt-2 flex gap-2">
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={manualSessionId}
              onChange={(e) => setManualSessionId(e.target.value)}
              placeholder="예: b457ad22-0a20-4aea-930f-0493cadcb4ee"
            />
            <button
              type="button"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white disabled:bg-slate-400"
              onClick={handleLoadQuestions}
              disabled={loading}
            >
              {loading ? '불러오는 중...' : '면접 시작'}
            </button>
          </div>
          {sessionId && <p className="mt-2 text-xs text-slate-500">세션: {sessionId}</p>}
        </div>

        {/* 현재 질문 + TTS */}
        <div className="mt-4 rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">
              {questions.length > 0
                ? `질문 ${currentQuestionIndex + 1} / ${questions.length}`
                : '현재 질문'}
            </h2>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50"
                onClick={handleSpeak}
                disabled={!currentQuestion || isSpeaking}
              >
                질문 듣기
              </button>
              <button
                type="button"
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50"
                onClick={stop}
                disabled={!isSpeaking}
              >
                중지
              </button>
            </div>
          </div>

          <div className="mt-3 min-h-16 rounded-lg bg-slate-50 p-4 text-base leading-relaxed">
            {currentQuestion?.question_text || '면접 시작 버튼을 누르면 질문이 표시됩니다.'}
          </div>

          {!isTTSSupported && (
            <p className="mt-2 text-sm text-amber-600">
              이 브라우저는 TTS를 지원하지 않습니다. 질문 텍스트를 직접 읽어주세요.
            </p>
          )}
        </div>

        {/* STT 음성 답변 */}
        <div className="mt-4 rounded-xl border border-slate-200 p-4">
          <h2 className="text-base font-semibold">음성 답변</h2>

          {!isSTTSupported && (
            <p className="mt-2 text-sm text-amber-600">
              이 브라우저는 STT를 지원하지 않습니다. 아래에 직접 입력해주세요.
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white disabled:bg-slate-400"
              onClick={startListening}
              disabled={!currentQuestion || isListening || isSpeaking || !isSTTSupported}
            >
              {isListening ? '녹음 중...' : '녹음 시작'}
            </button>
            <button
              type="button"
              className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white disabled:bg-slate-400"
              onClick={stopListening}
              disabled={!isListening}
            >
              녹음 중지
            </button>
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
              onClick={resetTranscript}
            >
              초기화
            </button>
          </div>

          <textarea
            className="mt-3 min-h-36 w-full rounded-lg border border-slate-300 p-3 text-sm"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="STT 결과가 여기에 표시됩니다. 직접 수정할 수 있습니다."
          />

          <p className="mt-1 text-xs text-slate-400">
            상태: {isListening ? '녹음 중' : '대기'} · 답변 시간: {speechDuration}초
          </p>

          <button
            type="button"
            className="mt-3 rounded-lg bg-green-600 px-5 py-2 text-sm text-white disabled:bg-slate-400"
            onClick={handleSubmit}
            disabled={loading || isListening || !currentQuestion || !transcript.trim()}
          >
            {loading ? '저장 중...' : '답변 제출 및 STT 저장'}
          </button>
        </div>

        {/* 에러 메시지 */}
        {(error || sttError) && (
          <div className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {error || sttError}
          </div>
        )}

        {/* 성공 메시지 */}
        {successMessage && (
          <div className="mt-4 rounded-lg bg-green-50 p-4 text-sm text-green-700">
            {successMessage}
          </div>
        )}

        {/* 디버그 정보 */}
        <div className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
          <p>sessionId: {sessionId || '-'} · questions: {questions.length} · index: {currentQuestionIndex} · questionId: {currentQuestion?.question_id || '-'}</p>
          {error && <p className="mt-1 text-red-500">error: {error}</p>}
        </div>
      </section>
    </main>
  );
}

export default VoiceInterviewPage;
