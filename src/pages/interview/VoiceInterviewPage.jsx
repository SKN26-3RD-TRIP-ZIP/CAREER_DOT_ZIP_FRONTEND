import { useEffect, useState } from 'react';
import { useInterview } from '../../hooks/useInterview';
import { useSTT } from '../../hooks/useSTT';
import { useTTS } from '../../hooks/useTTS';

function VoiceInterviewPage() {
  const [manualSessionId, setManualSessionId] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const {
    loading,
    error,
    sessionId,
    questions,
    currentQuestion,
    currentQuestionIndex,
    setSessionId,
    loadQuestions,
    submitVoiceAnswer
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
    resetTranscript
  } = useSTT();

  const {
    speak,
    stop,
    isSpeaking,
    isSupported: isTTSSupported
  } = useTTS();

  const handleLoadQuestions = async () => {
    if (!manualSessionId.trim()) {
      alert('session_id를 입력해주세요.');
      return;
    }

    setSuccessMessage('');
    setSessionId(manualSessionId.trim());
    await loadQuestions(manualSessionId.trim());
    setSuccessMessage('질문 목록을 불러왔습니다.');
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

    await submitVoiceAnswer({
      transcript: transcript.trim(),
      speechDuration
    });

    resetTranscript();
    setSuccessMessage('답변과 STT 결과가 저장되었습니다.');
  };

  useEffect(() => {
    if (currentQuestion?.question_text && isTTSSupported) {
      speak(currentQuestion.question_text);
    }
  }, [currentQuestion?.question_id, currentQuestion?.question_text, isTTSSupported, speak]);

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-8 text-slate-900">
      <section className="mx-auto max-w-4xl rounded-2xl bg-white p-6 shadow">
        <h1 className="text-2xl font-bold">Career.zip 음성 면접 MVP</h1>
        <p className="mt-2 text-sm text-slate-600">
          백엔드에서 생성된 session_id를 입력한 뒤 질문을 불러오고, 질문 TTS 재생과 STT 답변 제출을 테스트합니다.
        </p>

        <div className="mt-6 rounded-xl border border-slate-200 p-4">
          <label className="block text-sm font-semibold">Session ID</label>
          <div className="mt-2 flex gap-2">
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              value={manualSessionId}
              onChange={(event) => setManualSessionId(event.target.value)}
              placeholder="백엔드에서 생성된 session_id를 입력하세요"
            />
            <button
              type="button"
              className="rounded-lg bg-slate-900 px-4 py-2 text-white disabled:bg-slate-400"
              onClick={handleLoadQuestions}
              disabled={loading}
            >
              질문 불러오기
            </button>
          </div>
          {sessionId && <p className="mt-2 text-xs text-slate-500">현재 세션: {sessionId}</p>}
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">
              현재 질문 {questions.length > 0 ? `${currentQuestionIndex + 1} / ${questions.length}` : ''}
            </h2>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-lg border border-slate-300 px-3 py-2 disabled:opacity-50"
                onClick={handleSpeak}
                disabled={!currentQuestion || isSpeaking}
              >
                질문 듣기
              </button>
              <button
                type="button"
                className="rounded-lg border border-slate-300 px-3 py-2 disabled:opacity-50"
                onClick={stop}
                disabled={!isSpeaking}
              >
                중지
              </button>
            </div>
          </div>

          <div className="mt-4 rounded-lg bg-slate-50 p-4 text-lg">
            {currentQuestion?.question_text || '질문을 불러오면 여기에 표시됩니다.'}
          </div>

          {!isTTSSupported && (
            <p className="mt-2 text-sm text-amber-600">
              현재 브라우저는 TTS를 지원하지 않습니다. 질문 텍스트를 직접 읽어주세요.
            </p>
          )}
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 p-4">
          <h2 className="text-lg font-semibold">음성 답변</h2>

          {!isSTTSupported && (
            <p className="mt-2 text-sm text-amber-600">
              현재 브라우저는 STT를 지원하지 않습니다. 아래 답변 영역에 직접 입력해주세요.
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:bg-slate-400"
              onClick={startListening}
              disabled={!currentQuestion || isListening || isSpeaking || !isSTTSupported}
            >
              녹음 시작
            </button>
            <button
              type="button"
              className="rounded-lg bg-red-600 px-4 py-2 text-white disabled:bg-slate-400"
              onClick={stopListening}
              disabled={!isListening}
            >
              녹음 중지
            </button>
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-4 py-2"
              onClick={resetTranscript}
            >
              답변 초기화
            </button>
          </div>

          <textarea
            className="mt-4 min-h-40 w-full rounded-lg border border-slate-300 p-3"
            value={transcript}
            onChange={(event) => setTranscript(event.target.value)}
            placeholder="STT 결과가 여기에 표시됩니다. 직접 수정할 수 있습니다."
          />

          <p className="mt-2 text-sm text-slate-500">
            녹음 상태: {isListening ? '녹음 중' : '대기'} / 답변 시간: {speechDuration}초
          </p>

          <button
            type="button"
            className="mt-4 rounded-lg bg-green-600 px-4 py-2 text-white disabled:bg-slate-400"
            onClick={handleSubmit}
            disabled={loading || isListening || !currentQuestion || !transcript.trim()}
          >
            답변 제출 및 STT 저장
          </button>
        </div>

        {(error || sttError) && (
          <div className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {error || sttError}
          </div>
        )}

        {successMessage && (
          <div className="mt-6 rounded-lg bg-green-50 p-4 text-sm text-green-700">
            {successMessage}
          </div>
        )}
      </section>
    </main>
  );
}

export default VoiceInterviewPage;
