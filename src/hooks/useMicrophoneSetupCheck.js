import { useCallback, useEffect, useRef, useState } from 'react';

const AUDIO_CONSTRAINTS = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  channelCount: 1
};

const SILENCE_THRESHOLD = 0.008;
const NORMAL_THRESHOLD = 0.028;
const NORMAL_HOLD_MS = 600;
const SMOOTHING_FACTOR = 0.78;
const FFT_SIZE = 1024;

function getPermissionErrorState(error) {
  if (!error) {
    return {
      permissionStatus: 'error',
      message: '마이크 연결 중 알 수 없는 오류가 발생했습니다.'
    };
  }

  if (error.name === 'NotAllowedError' || error.name === 'SecurityError') {
    return {
      permissionStatus: 'denied',
      message: '마이크 권한이 거부되었습니다. 브라우저 주소창 권한 설정을 확인한 뒤 다시 시도해 주세요.'
    };
  }

  if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
    return {
      permissionStatus: 'no-device',
      message: '사용 가능한 마이크 장치를 찾을 수 없습니다.'
    };
  }

  if (error.name === 'NotReadableError') {
    return {
      permissionStatus: 'error',
      message: '마이크를 다른 프로그램에서 사용 중일 수 있습니다. 사용 중인 앱을 닫고 다시 시도해 주세요.'
    };
  }

  if (error.name === 'OverconstrainedError') {
    return {
      permissionStatus: 'error',
      message: '선택한 마이크 장치를 사용할 수 없습니다. 다른 입력 장치를 선택해 주세요.'
    };
  }

  if (error.name === 'AbortError') {
    return {
      permissionStatus: 'error',
      message: '마이크 연결이 중단되었습니다. 다시 시도해 주세요.'
    };
  }

  return {
    permissionStatus: 'error',
    message: '마이크 연결 중 오류가 발생했습니다. 장치와 브라우저 권한을 확인해 주세요.'
  };
}

function getDeviceLabel(device, index) {
  return device.label || `마이크 ${index + 1}`;
}

export function useMicrophoneSetupCheck() {
  const [isSupported, setIsSupported] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState('idle');
  const [inputStatus, setInputStatus] = useState('idle');
  const [message, setMessage] = useState('마이크 권한을 확인할 준비가 되었습니다.');
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [level, setLevel] = useState(0);
  const [waveform, setWaveform] = useState(Array.from({ length: 34 }, () => 0.08));
  const [isTesting, setIsTesting] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const frameRef = useRef(null);
  const smoothedLevelRef = useRef(0);
  const normalStartedAtRef = useRef(null);
  const requestIdRef = useRef(0);
  const mountedRef = useRef(false);

  const cleanupAudio = useCallback(() => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    if (sourceRef.current) {
      try {
        sourceRef.current.disconnect();
      } catch {
        // noop
      }
      sourceRef.current = null;
    }

    if (analyserRef.current) {
      try {
        analyserRef.current.disconnect();
      } catch {
        // noop
      }
      analyserRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    const audioContext = audioContextRef.current;
    audioContextRef.current = null;
    if (audioContext && audioContext.state !== 'closed') {
      audioContext.close().catch(() => {});
    }

    smoothedLevelRef.current = 0;
    normalStartedAtRef.current = null;
    setIsTesting(false);
  }, []);

  const refreshDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return [];

    const deviceList = await navigator.mediaDevices.enumerateDevices();
    const audioInputs = deviceList
      .filter((device) => device.kind === 'audioinput')
      .map((device, index) => ({
        deviceId: device.deviceId,
        label: getDeviceLabel(device, index)
      }));

    if (!mountedRef.current) return audioInputs;

    setDevices(audioInputs);
    setSelectedDeviceId((current) => {
      if (current && audioInputs.some((device) => device.deviceId === current)) {
        return current;
      }
      return audioInputs[0]?.deviceId || '';
    });

    if (audioInputs.length === 0) {
      setPermissionStatus('no-device');
      setMessage('사용 가능한 마이크 장치를 찾을 수 없습니다.');
    }

    return audioInputs;
  }, []);

  const analyzeStream = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;

    const data = new Float32Array(analyser.fftSize);

    const tick = () => {
      analyser.getFloatTimeDomainData(data);

      let sum = 0;
      for (let index = 0; index < data.length; index += 1) {
        sum += data[index] * data[index];
      }

      const rms = Math.sqrt(sum / data.length);
      const smoothed =
        smoothedLevelRef.current * SMOOTHING_FACTOR + rms * (1 - SMOOTHING_FACTOR);

      smoothedLevelRef.current = smoothed;
      const nextLevel = Math.min(1, smoothed * 3.2);
      const now = Date.now();

      setLevel(nextLevel);
      setWaveform((previous) =>
        previous.map((_, index) => {
          const sample = Math.abs(data[Math.floor((index / previous.length) * data.length)] || 0);
          return Math.min(1, Math.max(0.06, sample * 3.8 + nextLevel * 0.22));
        })
      );

      if (smoothed < SILENCE_THRESHOLD) {
        setInputStatus('no_input');
        normalStartedAtRef.current = null;
      } else if (smoothed < NORMAL_THRESHOLD) {
        setInputStatus('too_low');
        normalStartedAtRef.current = null;
      } else {
        setInputStatus('normal');
        if (!normalStartedAtRef.current) {
          normalStartedAtRef.current = now;
        }
        if (now - normalStartedAtRef.current >= NORMAL_HOLD_MS) {
          setIsVerified(true);
        }
      }

      frameRef.current = requestAnimationFrame(tick);
    };

    tick();
  }, []);

  const requestMicrophone = useCallback(async () => {
    requestIdRef.current += 1;
    const requestId = requestIdRef.current;

    if (!navigator.mediaDevices?.getUserMedia || !window.AudioContext) {
      setIsSupported(false);
      setPermissionStatus('unsupported');
      setMessage('현재 브라우저에서는 마이크 확인을 지원하지 않습니다.');
      return;
    }

    cleanupAudio();
    setIsSupported(true);
    setPermissionStatus('checking');
    setInputStatus('idle');
    setMessage('마이크 권한과 장치를 확인하고 있습니다.');
    setIsVerified(false);
    setLevel(0);

    try {
      const constraints = {
        audio: {
          ...AUDIO_CONSTRAINTS,
          ...(selectedDeviceId ? { deviceId: { exact: selectedDeviceId } } : {})
        }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (!mountedRef.current || requestId !== requestIdRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      await refreshDevices();

      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = FFT_SIZE;

      source.connect(analyser);
      audioContextRef.current = audioContext;
      sourceRef.current = source;
      analyserRef.current = analyser;

      setPermissionStatus('granted');
      setIsTesting(true);
      setMessage('평소 목소리로 1초 정도 말해 주세요. 정상 입력이 확인되면 면접 시작 버튼이 활성화됩니다.');
      analyzeStream();
    } catch (error) {
      if (!mountedRef.current || requestId !== requestIdRef.current) return;

      cleanupAudio();
      const nextState = getPermissionErrorState(error);
      setPermissionStatus(nextState.permissionStatus);
      setInputStatus('idle');
      setMessage(nextState.message);
    }
  }, [analyzeStream, cleanupAudio, refreshDevices, selectedDeviceId]);

  const retry = useCallback(() => {
    requestMicrophone();
  }, [requestMicrophone]);

  const handleDeviceChange = useCallback(
    async (deviceId) => {
      setSelectedDeviceId(deviceId);
      setIsVerified(false);
      setInputStatus('idle');
      setLevel(0);
      cleanupAudio();
      setPermissionStatus('idle');
      setMessage('선택한 마이크로 다시 권한 요청을 진행해 주세요.');
    },
    [cleanupAudio]
  );

  useEffect(() => {
    mountedRef.current = true;

    if (!navigator.mediaDevices?.getUserMedia) {
      setIsSupported(false);
      setPermissionStatus('unsupported');
      setMessage('현재 브라우저에서는 마이크 확인을 지원하지 않습니다.');
    } else {
      refreshDevices().catch(() => {});
    }

    const onDeviceChange = () => {
      setIsVerified(false);
      refreshDevices().catch(() => {});
    };

    navigator.mediaDevices?.addEventListener?.('devicechange', onDeviceChange);

    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
      navigator.mediaDevices?.removeEventListener?.('devicechange', onDeviceChange);
      cleanupAudio();
    };
  }, [cleanupAudio, refreshDevices]);

  return {
    isSupported,
    permissionStatus,
    inputStatus,
    message,
    devices,
    selectedDeviceId,
    level,
    waveform,
    isTesting,
    isVerified,
    thresholds: {
      silence: SILENCE_THRESHOLD,
      normal: NORMAL_THRESHOLD,
      holdMs: NORMAL_HOLD_MS
    },
    requestMicrophone,
    retry,
    handleDeviceChange
  };
}
