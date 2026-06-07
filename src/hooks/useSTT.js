import { useCallback, useEffect, useRef, useState } from 'react';

export function useSTT() {
  const recognitionRef = useRef(null);
  const startedAtRef = useRef(null);

  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechDuration, setSpeechDuration] = useState(0);
  const [error, setError] = useState('');

  const SpeechRecognition =
    typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;

  const isSupported = Boolean(SpeechRecognition);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    if (startedAtRef.current) {
      const duration = (Date.now() - startedAtRef.current) / 1000;
      setSpeechDuration(Number(duration.toFixed(2)));
      startedAtRef.current = null;
    }

    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('이 브라우저는 음성 인식을 지원하지 않습니다. 텍스트로 답변을 입력해주세요.');
      return;
    }

    setError('');

    const recognition = new SpeechRecognition();
    recognition.lang = 'ko-KR';
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (event) => {
      let text = '';

      for (let i = 0; i < event.results.length; i += 1) {
        text += event.results[i][0].transcript;
      }

      setTranscript(text.trim());
    };

    recognition.onerror = () => {
      setError('음성 인식 중 오류가 발생했습니다. 다시 시도하거나 텍스트로 입력해주세요.');
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    startedAtRef.current = Date.now();
    setIsListening(true);
    recognition.start();
  }, [SpeechRecognition, isSupported]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setSpeechDuration(0);
    setError('');
  }, []);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  return {
    transcript,
    setTranscript,
    isListening,
    isSupported,
    speechDuration,
    error,
    startListening,
    stopListening,
    resetTranscript
  };
}
