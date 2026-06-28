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
  // 브라우저 getUserMedia 오류명을 화면에서 다룰 수 있는 상태값과 안내 문구로 변환한다.
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
  // 세션 생성 전에 마이크 권한, 장치 선택, 실제 음성 입력 상태를 한 훅에서 관리한다.
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
    // 테스트가 끝나거나 장치를 바꿀 때 이전 스트림/오디오 노드를 모두 정리한다.
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
    // 권한 허용 전에는 label이 비어 있을 수 있지만, 장치 존재 여부는 미리 확인할 수 있다.
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
    // Web Audio API의 time domain 데이터를 RMS로 바꿔 실제 말소리 입력 여부를 판단한다.
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
        // 순간적인 소음이 아니라 일정 시간 정상 입력이 유지될 때만 마이크 확인 완료로 본다.
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
    // 중복 클릭/장치 변경으로 이전 요청이 늦게 끝나도 최신 요청만 반영되도록 requestId를 사용한다.
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
      // 사용자가 특정 마이크를 선택했다면 해당 deviceId로 권한을 요청한다.
      const constraints = {
        audio: {
          ...AUDIO_CONSTRAINTS,
          ...(selectedDeviceId ? { deviceId: { exact: selectedDeviceId } } : {})
        }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (!mountedRef.current || requestId !== requestIdRef.current) {
        // 컴포넌트가 사라졌거나 더 최신 요청이 있으면 방금 얻은 스트림은 즉시 닫는다.
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
      // 장치를 바꾸면 이전 검증 결과는 무효이므로 다시 권한/입력 테스트를 진행하게 한다.
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
    // 최초 진입 시 브라우저 지원 여부와 현재 연결된 입력 장치를 확인한다.
    mountedRef.current = true;

    if (!navigator.mediaDevices?.getUserMedia) {
      setIsSupported(false);
      setPermissionStatus('unsupported');
      setMessage('현재 브라우저에서는 마이크 확인을 지원하지 않습니다.');
    } else {
      refreshDevices().catch(() => {});
    }

    const onDeviceChange = () => {
      // 마이크가 꽂히거나 빠지면 검증 상태를 초기화하고 목록을 갱신한다.
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
