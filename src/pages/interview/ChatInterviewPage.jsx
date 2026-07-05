import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Bot, Loader2, Plus, Send, UserRound } from 'lucide-react';
import { interviewApi } from '../../api/interviewApi';
import { useInterviewStore } from '../../store/interviewStore';
import { extractGuardrail, guardrailUserMessage } from '../../utils/guardrail';
import './ChatInterviewPage.css';

function getQuestionId(question) {
  return question?.question_id || question?.id || '';
}

function getQuestionText(question) {
  return question?.question_text || question?.text || '';
}

function getQuestionCategory(question) {
  const category = question?.question_category || question?.question_type || 'general';
  if (category === 'technical') return '기술 면접';
  if (category === 'personality') return '인성 면접';
  if (category === 'follow_up') return '꼬리질문';
  return '면접 질문';
}

function normalizeQuestions(response) {
  const items = Array.isArray(response?.results) ? response.results : Array.isArray(response) ? response : [];
  return [...items].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
}

function normalizeFollowupQuestion(question) {
  if (!question) return null;
  const questionId = getQuestionId(question);
  const questionText = getQuestionText(question);
  if (!questionId || !questionText) return null;

  return {
    ...question,
    question_id: questionId,
    question_text: questionText,
    question_type: question.question_type || 'follow_up',
    question_category: question.question_category || 'follow_up',
  };
}

function insertQuestionAfterIndex(items, index, nextQuestion) {
  const nextQuestionId = getQuestionId(nextQuestion);
  if (!nextQuestionId || items.some((item) => getQuestionId(item) === nextQuestionId)) return items;

  const nextItems = [...items];
  nextItems.splice(index + 1, 0, nextQuestion);
  return nextItems;
}

function ChatTopbar({ currentIndex, total, completed, onEnd }) {
  const progressPercent = total > 0 ? Math.min(100, Math.max(0, ((currentIndex + 1) / total) * 100)) : 0;

  return (
    <header className="chat-interview-topbar">
      <Link className="chat-interview-logo" to="/dashboard">
        <span>CZ</span>
        <strong>Career.zip</strong>
      </Link>
      <div className="chat-interview-stage">
        <i aria-hidden="true" />
        채팅 면접 · 연습
      </div>
      <div className="chat-interview-progress" aria-label="질문 진행률">
        <strong>Q{Math.min(currentIndex + 1, Math.max(total, 1))} / {Math.max(total, 1)}</strong>
        <span><em style={{ width: `${progressPercent}%` }} /></span>
      </div>
      <button type="button" className="chat-interview-end" disabled={!completed} onClick={onEnd}>
        면접 종료
      </button>
    </header>
  );
}

function ChatMessage({ message }) {
  const isUser = message.role === 'user';
  return (
    <article className={`chat-message ${isUser ? 'is-user' : 'is-ai'}`}>
      <div className="chat-message-avatar" aria-hidden="true">
        {isUser ? <UserRound size={16} /> : <Bot size={16} />}
      </div>
      <div className="chat-message-body">
        <div className="chat-message-meta">
          <strong>{isUser ? '나' : 'AI 면접관'}</strong>
          {message.meta && <span>{message.meta}</span>}
        </div>
        <p>{message.text}</p>
      </div>
    </article>
  );
}

function getErrorMessage(error, fallback) {
  const guardrail = extractGuardrail(error);
  if (guardrail) return guardrailUserMessage(guardrail);
  const data = error?.response?.data;
  if (typeof data?.detail === 'string') return data.detail;
  if (typeof data?.answer_text === 'string') return data.answer_text;
  if (Array.isArray(data?.answer_text)) return data.answer_text.join(' ');
  if (error?.message) return error.message;
  return fallback;
}

function ChatInterviewPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const storeSessionId = useInterviewStore((state) => state.sessionId);
  const questions = useInterviewStore((state) => state.questions);
  const currentQuestionIndex = useInterviewStore((state) => state.currentQuestionIndex);
  const setSessionId = useInterviewStore((state) => state.setSessionId);
  const setQuestions = useInterviewStore((state) => state.setQuestions);
  const setCurrentQuestionIndex = useInterviewStore((state) => state.setCurrentQuestionIndex);

  const urlSessionId = searchParams.get('sessionId') || '';
  const sessionId = urlSessionId || storeSessionId;
  const totalQuestions = questions.length;
  const safeCurrentIndex = Math.min(currentQuestionIndex, Math.max(totalQuestions - 1, 0));
  const currentQuestion = questions[safeCurrentIndex] || null;
  const currentQuestionId = getQuestionId(currentQuestion);
  const currentQuestionText = getQuestionText(currentQuestion);

  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState('');
  const [typingText, setTypingText] = useState('');
  const lastBotQuestionIdRef = useRef('');
  const chatEndRef = useRef(null);

  const hasQuestion = Boolean(sessionId && currentQuestionId && currentQuestionText);

  const appendBotQuestion = useCallback((question, index) => {
    const questionId = getQuestionId(question);
    const questionText = getQuestionText(question);
    if (!questionId || !questionText || lastBotQuestionIdRef.current === questionId) return;
    lastBotQuestionIdRef.current = questionId;
    setMessages((prev) => [
      ...prev,
      {
        id: `ai-${questionId}`,
        role: 'ai',
        text: questionText,
        meta: `질문 ${index + 1} · ${getQuestionCategory(question)}`,
      },
    ]);
  }, []);

  useEffect(() => {
    if (urlSessionId && urlSessionId !== storeSessionId) setSessionId(urlSessionId);
  }, [setSessionId, storeSessionId, urlSessionId]);

  useEffect(() => {
    if (!sessionId || questions.length > 0) return undefined;
    let ignore = false;
    setLoadingQuestions(true);
    setError('');

    interviewApi.getQuestions(sessionId)
      .then((response) => {
        if (ignore) return;
        const loadedQuestions = normalizeQuestions(response);
        setQuestions(loadedQuestions);
        setCurrentQuestionIndex(0);
      })
      .catch((err) => {
        if (!ignore) setError(getErrorMessage(err, '면접 질문을 불러오지 못했습니다.'));
      })
      .finally(() => {
        if (!ignore) setLoadingQuestions(false);
      });

    return () => {
      ignore = true;
    };
  }, [questions.length, sessionId, setCurrentQuestionIndex, setQuestions]);

  useEffect(() => {
    if (currentQuestion) appendBotQuestion(currentQuestion, safeCurrentIndex);
  }, [appendBotQuestion, currentQuestion, safeCurrentIndex]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, loading, typingText]);

  const completeInterview = useCallback(async () => {
    if (completed || !sessionId) return;
    setTypingText('면접 세션을 마무리하고 있습니다...');
    await interviewApi.updateSessionStatus(sessionId, 'completed');
    setCompleted(true);
    setTypingText('');
    setMessages((prev) => [
      ...prev,
      {
        id: `complete-${Date.now()}`,
        role: 'ai',
        text: '수고하셨습니다. 모든 질문 답변이 저장되었습니다. 리포트에서 결과를 확인해보세요.',
        meta: '면접 완료',
      },
    ]);
  }, [completed, sessionId]);

  const moveToNextQuestion = useCallback(async () => {
    if (safeCurrentIndex >= totalQuestions - 1) {
      await completeInterview();
      return;
    }
    setCurrentQuestionIndex(safeCurrentIndex + 1);
  }, [completeInterview, safeCurrentIndex, setCurrentQuestionIndex, totalQuestions]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const answerText = draft.trim();
    if (!answerText || !hasQuestion || loading || completed) return;

    setDraft('');
    setError('');
    setLoading(true);
    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        role: 'user',
        text: answerText,
        meta: '나',
      },
    ]);

    try {
      setTypingText('답변을 저장하고 있습니다...');
      const answer = await interviewApi.submitAnswer({
        session_id: sessionId,
        question_id: currentQuestionId,
        answer_text: answerText,
      });

      setTypingText('AI가 다음 질문을 준비 중...');
      let followupQuestion = null;
      try {
        const followup = await interviewApi.generateFollowup(answer.answer_id);
        followupQuestion = normalizeFollowupQuestion(followup?.followup_question);
      } catch {
        followupQuestion = null;
      }

      if (followupQuestion) {
        const latestState = useInterviewStore.getState();
        const nextQuestions = insertQuestionAfterIndex(
          latestState.questions,
          latestState.currentQuestionIndex,
          followupQuestion,
        );
        setQuestions(nextQuestions);
        setCurrentQuestionIndex(latestState.currentQuestionIndex + 1);
        appendBotQuestion(followupQuestion, latestState.currentQuestionIndex + 1);
      } else {
        await moveToNextQuestion();
      }
    } catch (err) {
      setError(getErrorMessage(err, '답변 처리 중 문제가 발생했습니다.'));
    } finally {
      setTypingText('');
      setLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  const handleEnd = () => {
    if (completed && sessionId) navigate(`/report/${sessionId}`);
  };

  const headerLabel = useMemo(() => {
    if (completed) return '면접 완료';
    if (loading) return '답변 처리 중';
    if (loadingQuestions) return '질문 불러오는 중';
    return '실시간 채팅 면접';
  }, [completed, loading, loadingQuestions]);

  return (
    <main className="chat-interview">
      <ChatTopbar
        currentIndex={safeCurrentIndex}
        total={totalQuestions}
        completed={completed}
        onEnd={handleEnd}
      />

      <section className="chat-interview-shell">
        <section className="chat-interview-panel">
          <div className="chat-interview-ai">
            <span aria-hidden="true"><Bot size={20} /></span>
            <div>
              <strong>AI 면접관</strong>
              <p>채팅으로 답변을 입력하면, 맥락에 맞춰 꼬리질문을 이어갑니다.</p>
            </div>
            <em>{getQuestionCategory(currentQuestion)}</em>
          </div>

          <section className="chat-interview-window" aria-label="실시간 채팅 면접">
            <div className="chat-interview-window-head">
              <strong>{headerLabel}</strong>
              <span>{currentQuestion ? `질문 ${safeCurrentIndex + 1}` : '질문 대기'}</span>
            </div>

            <div className="chat-interview-messages">
              {!sessionId && (
                <div className="chat-interview-empty">
                  면접 설정 화면에서 세션과 질문을 먼저 생성해주세요.
                </div>
              )}
              {sessionId && loadingQuestions && (
                <div className="chat-interview-empty">
                  <Loader2 size={18} className="chat-interview-spin" />
                  질문을 불러오고 있습니다.
                </div>
              )}
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {typingText && (
                <div className="chat-interview-typing">
                  <Loader2 size={15} className="chat-interview-spin" />
                  {typingText}
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          </section>

          {error && <p className="chat-interview-error">{error}</p>}

          <form className="chat-interview-compose" onSubmit={handleSubmit}>
            <button type="button" className="chat-interview-add" disabled>
              <Plus size={18} />
            </button>
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={completed ? '면접이 완료되었습니다.' : '답변을 입력하세요...'}
              disabled={!hasQuestion || loading || loadingQuestions || completed}
              rows={1}
            />
            <button
              type="submit"
              className="chat-interview-send"
              disabled={!draft.trim() || !hasQuestion || loading || loadingQuestions || completed}
            >
              {loading ? <Loader2 size={18} className="chat-interview-spin" /> : <Send size={18} />}
              전송
            </button>
          </form>

          <p className="chat-interview-hint">Enter로 전송 · Shift+Enter로 줄바꿈</p>
        </section>
      </section>
    </main>
  );
}

export default ChatInterviewPage;
