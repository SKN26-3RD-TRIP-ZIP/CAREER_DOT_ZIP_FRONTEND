import { useCallback, useEffect, useRef, useState } from 'react';
import { interviewApi } from '../api/interviewApi';

export function useTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastMethod, setLastMethod] = useState(null);
  const [lastVoice, setLastVoice] = useState(null);
  // OpenAI TTS로 만든 mp3 객체 URL은 재생이 끝나면 반드시 해제해야 메모리 누수를 막을 수 있다.
  const audioRef = useRef(null);
  const audioUrlRef = useRef(null);
  const requestIdRef = useRef(0);
  const browserTtsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const audioSupported = typeof Audio !== 'undefined';
  const isSupported = browserTtsSupported || audioSupported;

  const cleanupOpenAiAudio = useCallback(() => {
    // 이전 질문 음성이 남아 있으면 새 질문 재생 전에 정리한다.
    if (audioRef.current) {
      const audio = audioRef.current;
      audio.onended = null;
      audio.onerror = null;
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  }, []);

  const speakWithBrowser = useCallback(
    (text, requestId = requestIdRef.current, options = {}) => {
      // 백엔드 TTS가 없거나 실패했을 때 브라우저 기본 TTS로 fallback한다.
      if (!browserTtsSupported || !text) return false;
      if (requestId !== requestIdRef.current) return false;

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      utterance.rate = 1;
      utterance.pitch = 1;

      utterance.onstart = () => {
        if (requestId !== requestIdRef.current) return;
        setLastMethod('browser');
        setLastVoice(null);
        setIsSpeaking(true);
      };
      utterance.onend = () => {
        if (requestId !== requestIdRef.current) return;
        setIsSpeaking(false);
        options.onEnd?.({ method: 'browser' });
      };
      utterance.onerror = () => {
        if (requestId === requestIdRef.current) setIsSpeaking(false);
      };

      window.speechSynthesis.speak(utterance);
      return true;
    },
    [browserTtsSupported]
  );

  const stop = useCallback(() => {
    // requestId를 증가시켜 이전 비동기 재생 요청이 뒤늦게 상태를 바꾸지 못하게 한다.
    requestIdRef.current += 1;
    cleanupOpenAiAudio();
    if (browserTtsSupported) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, [browserTtsSupported, cleanupOpenAiAudio]);

  const speak = useCallback(
    async (text, options = {}) => {
      if (!isSupported || !text) {
        options.onEnd?.({ method: 'none' });
        return;
      }

      stop();
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;

      if (options.sessionId && audioSupported) {
        try {
          // sessionId가 있을 때는 세션 persona를 반영하는 백엔드 OpenAI TTS를 우선 사용한다.
          setIsSpeaking(true);
          const result = await interviewApi.synthesizeSpeech({
            session_id: options.sessionId,
            text
          });
          if (requestId !== requestIdRef.current) return;

          const audioUrl = URL.createObjectURL(result.audioBlob);
          const audio = new Audio(audioUrl);

          if (requestId !== requestIdRef.current) {
            URL.revokeObjectURL(audioUrl);
            return;
          }

          audioRef.current = audio;
          audioUrlRef.current = audioUrl;
          setLastMethod('openai');
          setLastVoice(result.voice || null);

          audio.onended = () => {
            if (requestId !== requestIdRef.current) return;
            cleanupOpenAiAudio();
            setIsSpeaking(false);
          };
          audio.onerror = () => {
            // mp3 재생 자체가 실패하면 질문 진행을 막지 않도록 브라우저 TTS로 대체한다.
            if (requestId !== requestIdRef.current) return;
            cleanupOpenAiAudio();
            setIsSpeaking(false);
            speakWithBrowser(text, requestId, options);
          };

          await audio.play();
          return;
        } catch (error) {
          if (requestId !== requestIdRef.current) return;
          cleanupOpenAiAudio();
          setIsSpeaking(false);
        }
      }

      // 백엔드 TTS를 사용할 수 없는 경우에도 최소한 질문 읽기 경험은 유지한다.
      const started = speakWithBrowser(text, requestId, options);
      if (!started && requestId === requestIdRef.current) {
        options.onEnd?.({ method: 'none' });
      }
    },
    [audioSupported, cleanupOpenAiAudio, isSupported, speakWithBrowser, stop]
  );

  useEffect(() => {
    return () => {
      requestIdRef.current += 1;
      cleanupOpenAiAudio();
      if (browserTtsSupported) {
        window.speechSynthesis.cancel();
      }
    };
  }, [browserTtsSupported, cleanupOpenAiAudio]);

  return {
    speak,
    stop,
    isSpeaking,
    isSupported,
    lastMethod,
    lastVoice
  };
}
