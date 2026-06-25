import { useCallback, useEffect, useRef, useState } from 'react';
import { interviewApi } from '../api/interviewApi';

export function useTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastMethod, setLastMethod] = useState(null);
  const [lastVoice, setLastVoice] = useState(null);
  const audioRef = useRef(null);
  const audioUrlRef = useRef(null);
  const requestIdRef = useRef(0);
  const browserTtsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const audioSupported = typeof Audio !== 'undefined';
  const isSupported = browserTtsSupported || audioSupported;

  const cleanupOpenAiAudio = useCallback(() => {
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
    (text, requestId = requestIdRef.current) => {
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
        if (requestId === requestIdRef.current) setIsSpeaking(false);
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
    requestIdRef.current += 1;
    cleanupOpenAiAudio();
    if (browserTtsSupported) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, [browserTtsSupported, cleanupOpenAiAudio]);

  const speak = useCallback(
    async (text, options = {}) => {
      if (!isSupported || !text) return;

      stop();
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;

      if (options.sessionId && audioSupported) {
        try {
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
            if (requestId !== requestIdRef.current) return;
            cleanupOpenAiAudio();
            setIsSpeaking(false);
            speakWithBrowser(text, requestId);
          };

          await audio.play();
          return;
        } catch (error) {
          if (requestId !== requestIdRef.current) return;
          cleanupOpenAiAudio();
          setIsSpeaking(false);
        }
      }

      speakWithBrowser(text, requestId);
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
