import { useCallback, useEffect, useRef, useState } from 'react';
import { interviewApi } from '../api/interviewApi';

export function useTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastMethod, setLastMethod] = useState(null);
  const [lastVoice, setLastVoice] = useState(null);
  const audioRef = useRef(null);
  const audioUrlRef = useRef(null);
  const browserTtsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const audioSupported = typeof Audio !== 'undefined';
  const isSupported = browserTtsSupported || audioSupported;

  const cleanupOpenAiAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  }, []);

  const speakWithBrowser = useCallback(
    (text) => {
      if (!browserTtsSupported || !text) return false;

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      utterance.rate = 1;
      utterance.pitch = 1;

      utterance.onstart = () => {
        setLastMethod('browser');
        setLastVoice(null);
        setIsSpeaking(true);
      };
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
      return true;
    },
    [browserTtsSupported]
  );

  const stop = useCallback(() => {
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

      if (options.sessionId && audioSupported) {
        try {
          setIsSpeaking(true);
          const result = await interviewApi.synthesizeSpeech({
            session_id: options.sessionId,
            text
          });
          const audioUrl = URL.createObjectURL(result.audioBlob);
          const audio = new Audio(audioUrl);

          audioRef.current = audio;
          audioUrlRef.current = audioUrl;
          setLastMethod('openai');
          setLastVoice(result.voice || null);

          audio.onended = () => {
            cleanupOpenAiAudio();
            setIsSpeaking(false);
          };
          audio.onerror = () => {
            cleanupOpenAiAudio();
            setIsSpeaking(false);
            speakWithBrowser(text);
          };

          await audio.play();
          return;
        } catch (error) {
          cleanupOpenAiAudio();
          setIsSpeaking(false);
        }
      }

      speakWithBrowser(text);
    },
    [audioSupported, cleanupOpenAiAudio, isSupported, speakWithBrowser, stop]
  );

  useEffect(() => {
    return () => {
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
