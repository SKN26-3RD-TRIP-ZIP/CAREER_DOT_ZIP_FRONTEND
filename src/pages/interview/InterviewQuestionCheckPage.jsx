import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Check,
  CircleStop,
  Clock,
  Loader2,
  Mic,
  Play,
  RotateCcw,
  Square,
  Volume2
} from 'lucide-react';
import { interviewApi } from '../../api/interviewApi';
import { useTTS } from '../../hooks/useTTS';
import { useInterviewStore } from '../../store/interviewStore';
import './InterviewQuestionCheckPage.css';

const waveBars = [18, 32, 44, 25, 58, 36, 68, 42, 60, 28, 52, 38, 70, 46, 34, 56, 24, 48, 30, 40];

const RECORDING_OPTIONS = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    channelCount: 1
  }
};

function formatElapsedTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function getQuestionId(question) {
  return question?.question_id || question?.id || '';
}

function getQuestionText(question) {
  return question?.question_text || question?.text || '';
}

function getQuestionType(question) {
  const type = question?.question_type || question?.sourceType || question?.source_type || '질문';
  if (type === 'technical') return '기술';
  if (type === 'personality') return '인성';
  if (type === 'job') return '직무';
  return type;
}

function getErrorMessage(error, fallback) {
  const data = error?.response?.data;
  if (typeof data?.detail === 'string') return data.detail;
  if (typeof data?.audio === 'string') return data.audio;
  if (Array.isArray(data?.audio)) return data.audio.join(' ');
  if (error?.message) return error.message;
  return fallback;
}

function normalizeQuestions(response) {
  const items = Array.isArray(response?.results) ? response.results : Array.isArray(response) ? response : [];
  return [...items].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
}

function Topbar({ stageLabel, currentIndex, total, isCompleted, onEnd }) {
  const progressPercent = total > 0 ? Math.min(100, Math.max(0, ((currentIndex + 1) / total) * 100)) : 0;

  return (
    <header className="question-check-topbar">
      <Link className="question-check-logo" to="/dashboard">
        <span>CZ</span>
        <strong>Career.zip</strong>
      </Link>

      <div className="question-check-stage">
        <i aria-hidden="true" />
        {stageLabel}
      </div>

      <div className="question-check-progress" aria-label="질문 진행률">
        <strong>Q{Math.min(currentIndex + 1, Math.max(total, 1))} / {Math.max(total, 1)}</strong>
        <span><em style={{ width: `${progressPercent}%` }} /></span>
      </div>

      <button type="button" className="question-check-end" disabled={!isCompleted} onClick={onEnd}>
        면접 종료
      </button>
    </header>
  );
}

function QuestionCard({ isAnswering, question, currentIndex }) {
  const text = getQuestionText(question);

  return (
    <section className="question-check-question-card">
      <div className="question-check-tags">
        <span>{getQuestionType(question)}</span>
        <span>Q{currentIndex + 1}</span>
      </div>
      <h1>{text || '면접 설정에서 세션과 질문을 먼저 생성해 주세요.'}</h1>
      {isAnswering && <p>답변을 마치면 녹음을 종료하고 저장이 완료될 때까지 기다려 주세요.</p>}
    </section>
  );
}

function Waveform({ isActive }) {
  return (
    <div className={`question-check-wave ${isActive ? 'is-active' : ''}`} aria-label="답변 음성 파형">
      {waveBars.map((height, index) => (
        <span key={`${height}-${index}`} style={{ '--bar-height': `${height}px` }} />
      ))}
    </div>
  );
}

function InterviewQuestionCheckPage() {
  const navigate = useNavigate();
  const sessionId = useInterviewStore((state) => state.sessionId);
  const questions = useInterviewStore((state) => state.questions);
  const currentQuestionIndex = useInterviewStore((state) => state.currentQuestionIndex);
  const setQuestions = useInterviewStore((state) => state.setQuestions);
  const setCurrentQuestionIndex = useInterviewStore((state) => state.setCurrentQuestionIndex);
  const { speak, stop, isSpeaking, isSupported: isTtsSupported } = useTTS();

  const [mode, setMode] = useState('reading');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedDuration, setRecordedDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [sttResult, setSttResult] = useState(null);
  const [answerId, setAnswerId] = useState('');
  const [processingStep, setProcessingStep] = useState('idle');
  const [failedStep, setFailedStep] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [questionLoadError, setQuestionLoadError] = useState('');

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const recordingStartedAtRef = useRef(0);

  const totalQuestions = questions.length;
  const safeCurrentIndex = Math.min(currentQuestionIndex, Math.max(totalQuestions - 1, 0));
  const currentQuestion = questions[safeCurrentIndex] || null;
  const currentQuestionId = getQuestionId(currentQuestion);
  const currentQuestionText = getQuestionText(currentQuestion);

  const isAnswering = mode === 'answering';
  const isProcessing = processingStep !== 'idle';
  const isSaved = processingStep === 'saved';
  const hasQuestion = Boolean(sessionId && currentQuestionId && currentQuestionText);

  const stageLabel = useMemo(() => {
    if (isCompleted) return '면접 완료';
    if (isProcessing && processingStep !== 'saved') return '답변 저장 중';
    if (isAnswering) return '답변 녹음 중';
    if (isSpeaking) return '질문 TTS 재생';
    return '질문 확인';
  }, [isAnswering, isCompleted, isProcessing, isSpeaking, processingStep]);

  const processingLabel = useMemo(() => {
    if (processingStep === 'stt') return 'Whisper STT 처리 중입니다.';
    if (processingStep === 'answer') return '답변 텍스트를 저장 중입니다.';
    if (processingStep === 'patch') return 'STT 분석값을 답변에 저장 중입니다.';
    if (processingStep === 'complete') return '면접 세션을 완료 처리 중입니다.';
    if (processingStep === 'saved') return '답변 저장이 완료되었습니다.';
    return '';
  }, [processingStep]);

  const cleanupRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    mediaRecorderRef.current = null;
  }, []);

  const resetAnswerState = useCallback(() => {
    setMode('reading');
    setRecordingSeconds(0);
    setRecordedDuration(0);
    setAudioBlob(null);
    setSttResult(null);
    setAnswerId('');
    setProcessingStep('idle');
    setFailedStep('');
    setErrorMessage('');
  }, []);

  useEffect(() => {
    if (!sessionId) return undefined;

    let canceled = false;
    const loadQuestions = async () => {
      setIsLoadingQuestions(true);
      setQuestionLoadError('');
      try {
        const response = await interviewApi.getQuestions(sessionId);
        if (canceled) return;
        const loadedQuestions = normalizeQuestions(response);
        setQuestions(loadedQuestions);
        setCurrentQuestionIndex(Math.min(currentQuestionIndex, Math.max(loadedQuestions.length - 1, 0)));
      } catch (error) {
        if (!canceled) {
          setQuestionLoadError(getErrorMessage(error, '질문을 불러오지 못했습니다.'));
        }
      } finally {
        if (!canceled) setIsLoadingQuestions(false);
      }
    };

    loadQuestions();

    return () => {
      canceled = true;
    };
  }, [currentQuestionIndex, sessionId, setCurrentQuestionIndex, setQuestions]);

  useEffect(() => {
    if (!isAnswering) return undefined;

    const timerId = window.setInterval(() => {
      const elapsed = Math.max(0, Math.floor((Date.now() - recordingStartedAtRef.current) / 1000));
      setRecordingSeconds(elapsed);
    }, 250);

    return () => window.clearInterval(timerId);
  }, [isAnswering]);

  useEffect(() => {
    if (!hasQuestion || isCompleted) return undefined;
    resetAnswerState();
    if (isTtsSupported) {
      speak(currentQuestionText, { sessionId });
    }

    return () => {
      stop();
      cleanupRecording();
    };
  }, [cleanupRecording, currentQuestionId, currentQuestionText, hasQuestion, isCompleted, isTtsSupported, resetAnswerState, sessionId, speak, stop]);

  const processAndSave = useCallback(
    async ({ blob = audioBlob, duration = recordedDuration, reuseStt = false } = {}) => {
      if (!sessionId || !currentQuestionId) {
        setErrorMessage('세션 또는 질문 정보가 없습니다. 면접 설정부터 다시 진행해 주세요.');
        return;
      }
      if (!blob && !reuseStt) {
        setErrorMessage('처리할 녹음 파일이 없습니다.');
        return;
      }

      setErrorMessage('');

      let nextSttResult = reuseStt ? sttResult : null;
      let nextAnswerId = answerId;

      try {
        if (!nextSttResult) {
          setProcessingStep('stt');
          setFailedStep('');
          const formData = new FormData();
          formData.append('audio', blob, 'answer.webm');
          formData.append('language', 'ko');
          nextSttResult = await interviewApi.transcribeAudio(formData);
          setSttResult(nextSttResult);
        }

        const sttText = nextSttResult?.stt_text?.trim();
        if (!sttText) {
          throw new Error('Whisper STT 결과 텍스트가 비어 있습니다.');
        }

        if (!nextAnswerId) {
          setProcessingStep('answer');
          const answer = await interviewApi.submitAnswer({
            session_id: sessionId,
            question_id: currentQuestionId,
            answer_text: sttText,
            speech_duration: nextSttResult?.speech_duration ?? duration
          });
          nextAnswerId = answer?.answer_id;
          if (!nextAnswerId) {
            throw new Error('답변 저장 응답에 answer_id가 없습니다.');
          }
          setAnswerId(nextAnswerId);
        }

        setProcessingStep('patch');
        await interviewApi.patchSttResult(nextAnswerId, {
          stt_text: sttText,
          audio_url: null,
          speech_duration: nextSttResult?.speech_duration ?? duration,
          total_pause_duration: nextSttResult?.total_pause_duration ?? 0,
          long_pause_count: nextSttResult?.long_pause_count ?? 0
        });

        setFailedStep('');
        setProcessingStep('saved');
      } catch (error) {
        const step = nextSttResult ? (nextAnswerId ? 'patch' : 'answer') : 'stt';
        setFailedStep(step);
        setProcessingStep('idle');
        setErrorMessage(getErrorMessage(error, '답변 처리 중 문제가 발생했습니다.'));
      }
    },
    [answerId, audioBlob, currentQuestionId, recordedDuration, sessionId, sttResult]
  );

  const handleStartRecording = async () => {
    if (!hasQuestion || isProcessing) return;
    stop();
    setErrorMessage('');
    setFailedStep('');
    setProcessingStep('idle');
    setAudioBlob(null);
    setSttResult(null);
    setAnswerId('');
    setRecordedDuration(0);
    setRecordingSeconds(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia(RECORDING_OPTIONS);
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      const recorder = new MediaRecorder(stream, { mimeType });

      chunksRef.current = [];
      streamRef.current = stream;
      mediaRecorderRef.current = recorder;
      recordingStartedAtRef.current = Date.now();

      recorder.ondataavailable = (event) => {
        if (event.data?.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const duration = Math.max(0.1, (Date.now() - recordingStartedAtRef.current) / 1000);
        const blob = new Blob(chunksRef.current, { type: mimeType });
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        mediaRecorderRef.current = null;
        setMode('recorded');
        setRecordedDuration(duration);
        setAudioBlob(blob);
        processAndSave({ blob, duration });
      };

      recorder.start();
      setMode('answering');
    } catch (error) {
      setErrorMessage(getErrorMessage(error, '마이크 녹음을 시작하지 못했습니다.'));
    }
  };

  const handleStopRecording = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return;
    mediaRecorderRef.current.stop();
  };

  const handleRetry = () => {
    if (failedStep === 'stt') {
      processAndSave({ blob: audioBlob, duration: recordedDuration });
      return;
    }
    processAndSave({ blob: audioBlob, duration: recordedDuration, reuseStt: true });
  };

  const handleNext = async () => {
    if (!isSaved || isCompleted) return;

    if (safeCurrentIndex >= totalQuestions - 1) {
      try {
        setProcessingStep('complete');
        await interviewApi.updateSessionStatus(sessionId, 'completed');
        setProcessingStep('idle');
        setIsCompleted(true);
      } catch (error) {
        setProcessingStep('saved');
        setErrorMessage(getErrorMessage(error, '세션 완료 처리에 실패했습니다.'));
      }
      return;
    }

    setCurrentQuestionIndex(safeCurrentIndex + 1);
  };

  const handleEndInterview = () => {
    if (isCompleted && sessionId) navigate(`/report/${sessionId}`);
  };

  const helperText = useMemo(() => {
    if (!sessionId) return '면접 설정 화면에서 세션과 질문을 먼저 생성해 주세요.';
    if (isLoadingQuestions) return '질문을 불러오고 있습니다.';
    if (questionLoadError) return questionLoadError;
    if (isAnswering) return '답변을 녹음하고 있습니다.';
    if (isProcessing && processingStep !== 'saved') return processingLabel;
    if (isSaved) return '저장이 완료되었습니다. 다음 질문으로 이동할 수 있습니다.';
    return isTtsSupported ? '질문을 듣고 준비가 되면 답변 녹음을 시작하세요.' : '브라우저 TTS를 사용할 수 없습니다. 질문을 읽고 답변해 주세요.';
  }, [isAnswering, isLoadingQuestions, isProcessing, isSaved, isTtsSupported, processingLabel, processingStep, questionLoadError, sessionId]);

  return (
    <main className="interview-question-check">
      <Topbar
        stageLabel={stageLabel}
        currentIndex={safeCurrentIndex}
        total={totalQuestions}
        isCompleted={isCompleted}
        onEnd={handleEndInterview}
      />

      <section className="question-check-canvas">
        <div className="question-check-orb question-check-orb--left" aria-hidden="true" />
        <div className="question-check-orb question-check-orb--right" aria-hidden="true" />

        <section className="question-check-interviewer">
          <div className="question-check-bot">
            <Square size={20} />
            <span />
          </div>
          <div>
            <strong>AI 면접관</strong>
            <p>
              {isSpeaking
                ? '질문을 읽어드리고 있습니다.'
                : hasQuestion
                  ? `${sessionId} 세션의 ${safeCurrentIndex + 1}번째 질문입니다.`
                  : '면접 설정에서 질문을 생성해 주세요.'}
            </p>
          </div>
        </section>

        <QuestionCard isAnswering={isAnswering} question={currentQuestion} currentIndex={safeCurrentIndex} />

        <section className="question-check-answer">
          <div className="question-check-answer-head">
            <strong>내 답변</strong>
            <span>{isAnswering ? '녹음 중' : isSaved ? '저장 완료' : '답변 준비'}</span>
          </div>

          <div className="question-check-recorder">
            <Waveform isActive={isAnswering || isProcessing} />
            <div className={`question-check-mic ${isAnswering ? 'is-recording' : ''}`}>
              {isProcessing && processingStep !== 'saved' ? <Loader2 size={34} className="question-check-spin" /> : isAnswering ? <Mic size={34} /> : <Volume2 size={34} />}
            </div>
            <p>{helperText}</p>
          </div>
        </section>

        {errorMessage && (
          <section className="question-check-status is-error" role="alert">
            <strong>처리 중 문제가 발생했습니다.</strong>
            <span>{errorMessage}</span>
          </section>
        )}

        <section className="question-check-actions">
          {!isAnswering ? (
            <>
              {isCompleted ? (
                <button type="button" className="question-check-primary question-check-wide" onClick={handleEndInterview}>
                  <Check size={18} />
                  면접 종료하고 리포트로 이동
                </button>
              ) : null}
              {!isCompleted && failedStep ? (
                <button type="button" className="question-check-primary" disabled={isProcessing} onClick={handleRetry}>
                  <RotateCcw size={18} />
                  {failedStep === 'stt' ? 'STT 재시도' : '저장 재시도'}
                </button>
              ) : !isCompleted && isSaved ? (
                <button type="button" className="question-check-primary question-check-wide" onClick={handleNext}>
                  <Check size={18} />
                  {safeCurrentIndex >= totalQuestions - 1 ? '세션 완료 처리' : '다음 질문으로 이동'}
                </button>
              ) : !isCompleted ? (
                <button
                  type="button"
                  className="question-check-primary"
                  disabled={!hasQuestion || isProcessing}
                  onClick={handleStartRecording}
                >
                  <Play size={18} />
                  답변 녹음 시작
                </button>
              ) : null}
            </>
          ) : (
            <button type="button" className="question-check-primary question-check-wide" onClick={handleStopRecording}>
              <CircleStop size={18} />
              녹음 종료하고 저장 진행
            </button>
          )}
        </section>

        <section className="question-check-footnote">
          <Clock size={15} />
          {isAnswering
            ? `${formatElapsedTime(recordingSeconds)} · 녹음 중`
            : recordedDuration > 0
              ? `${formatElapsedTime(Math.round(recordedDuration))} · 녹음 파일 생성됨`
              : hasQuestion
                ? `${currentQuestion?.difficulty || 'medium'} · Whisper STT 저장 흐름`
                : '세션과 질문이 없으면 /interview/setup 화면으로 돌아가 주세요.'}
          <Check size={15} />
          {isCompleted ? '면접 종료 버튼이 활성화되었습니다.' : '저장 완료 전에는 다음 질문으로 이동할 수 없습니다.'}
        </section>
      </section>
    </main>
  );
}

export default InterviewQuestionCheckPage;
