import { useState } from 'react';
import { interviewApi } from '../api/interviewApi';
import { useInterviewStore } from '../store/interviewStore';

function getQuestionLoadErrorMessage(err) {
  const status = err?.response?.status;

  if (!err?.response) {
    return '백엔드 서버에 연결할 수 없습니다. runserver가 켜져 있는지 확인해주세요.';
  }

  if (status === 401) {
    return '인증에 실패했습니다. access token을 다시 저장해주세요.';
  }

  if (status === 403) {
    return '이 세션에 접근할 권한이 없습니다.';
  }

  if (status === 404) {
    return '세션 또는 질문 API를 찾을 수 없습니다. session_id를 확인해주세요.';
  }

  return '질문 목록을 불러오지 못했습니다.';
}

export function useInterview() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    sessionId,
    questions,
    currentQuestionIndex,
    followupQuestion,
    setSessionId,
    setQuestions,
    setCurrentQuestionIndex,
    setFollowupQuestion,
    moveNextQuestion
  } = useInterviewStore();

  const currentQuestion = followupQuestion || questions[currentQuestionIndex] || null;

  const loadQuestions = async (targetSessionId) => {
    setLoading(true);
    setError('');

    try {
      const data = await interviewApi.getQuestions(targetSessionId);
      console.log('[loadQuestions] response:', data);

      const results = Array.isArray(data?.results) ? data.results : [];
      const sortedQuestions = [...results].sort(
        (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)
      );

      setQuestions(sortedQuestions);
      setCurrentQuestionIndex(0);
      setFollowupQuestion(null);

      if (sortedQuestions.length === 0) {
        setError('질문이 없습니다.');
      }

      return sortedQuestions;
    } catch (err) {
      const message = getQuestionLoadErrorMessage(err);
      console.error('[loadQuestions] failed:', err);
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const submitVoiceAnswer = async ({ transcript, speechDuration }) => {
    if (!sessionId || !currentQuestion) {
      throw new Error('세션 또는 질문 정보가 없습니다.');
    }

    setLoading(true);
    setError('');

    try {
      const answer = await interviewApi.submitAnswer({
        session_id: sessionId,
        question_id: currentQuestion.question_id,
        answer_text: transcript,
        speech_duration: speechDuration
      });

      await interviewApi.patchSttResult(answer.answer_id, {
        stt_text: transcript,
        audio_url: null,
        speech_duration: speechDuration,
        total_pause_duration: 0,
        long_pause_count: 0
      });

      const followup = await interviewApi.generateFollowup(answer.answer_id);

      if (followup.next_action === 'GENERATE_FOLLOWUP') {
        setFollowupQuestion(followup.followup_question);
      } else {
        moveNextQuestion();
      }

      return {
        answer,
        followup
      };
    } catch (err) {
      console.error('[submitVoiceAnswer] failed:', err);
      setError('답변 제출 또는 STT 결과 저장에 실패했습니다.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    sessionId,
    questions,
    currentQuestion,
    currentQuestionIndex,
    setSessionId,
    loadQuestions,
    submitVoiceAnswer,
    moveNextQuestion
  };
}
