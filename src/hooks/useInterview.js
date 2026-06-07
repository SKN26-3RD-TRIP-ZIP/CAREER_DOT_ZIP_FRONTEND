import { useState } from 'react';
import { interviewApi } from '../api/interviewApi';
import { useInterviewStore } from '../store/interviewStore';

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
    setFollowupQuestion,
    moveNextQuestion
  } = useInterviewStore();

  const currentQuestion = followupQuestion || questions[currentQuestionIndex] || null;

  const loadQuestions = async (targetSessionId) => {
    setLoading(true);
    setError('');

    try {
      const data = await interviewApi.getQuestions(targetSessionId);
      setQuestions(data.results || []);
      return data.results || [];
    } catch (err) {
      setError('질문 목록을 불러오지 못했습니다.');
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
