import { describe, it, expect } from 'vitest';
import {
  sttErrorMessage,
  isSttEnvRequired,
  isEmptyTranscript,
  isSupportedAudioMime,
  mediaErrorMessage,
  canStartRecording,
  shouldStopTtsOnRecordStart,
  canPlayTts,
  canSubmitAnswer,
  questionChangeResetState,
} from '../voice';

const err = (status, data) => ({ response: { status, data } });

describe('voice STT error mapping', () => {
  it('maps backend STT error codes/status', () => {
    expect(sttErrorMessage(err(413, { code: 'audio_too_large' }))).toContain('너무 큽');
    expect(sttErrorMessage(err(502, { code: 'whisper_stt_failed' }))).toContain('서버 호출');
    expect(sttErrorMessage(err(504, { code: 'whisper_stt_timeout' }))).toContain('시간이 초과');
    expect(sttErrorMessage(err(400, { audio: 'Only webm audio is supported.' }))).toContain('webm');
    expect(sttErrorMessage(err(400, { audio: 'Audio file is empty.' }))).toContain('녹음된 음성이 없');
    expect(sttErrorMessage(err(401, {}))).toContain('로그인');
  });
  it('env required (OPENAI_API_KEY) → provider message', () => {
    const e = err(500, { detail: 'OPENAI_API_KEY is not configured.' });
    expect(isSttEnvRequired(e)).toBe(true);
    expect(sttErrorMessage(e)).toContain('Provider');
  });
  it('network error', () => {
    expect(sttErrorMessage({})).toContain('네트워크');
  });
});

describe('voice helpers', () => {
  it('isEmptyTranscript', () => {
    expect(isEmptyTranscript('')).toBe(true);
    expect(isEmptyTranscript('   ')).toBe(true);
    expect(isEmptyTranscript('답변')).toBe(false);
  });
  it('isSupportedAudioMime webm only', () => {
    expect(isSupportedAudioMime('audio/webm;codecs=opus')).toBe(true);
    expect(isSupportedAudioMime('audio/mp4')).toBe(false);
  });
  it('mediaErrorMessage maps permission denial', () => {
    expect(mediaErrorMessage({ name: 'NotAllowedError' })).toContain('권한이 거부');
    expect(mediaErrorMessage({ name: 'NotFoundError' })).toContain('마이크를 찾을 수 없');
  });
  it('mutual exclusion rules', () => {
    expect(canStartRecording({ recording: false, uploading: false })).toBe(true);
    expect(canStartRecording({ recording: true, uploading: false })).toBe(false);
    expect(canStartRecording({ recording: false, uploading: true })).toBe(false);
    expect(shouldStopTtsOnRecordStart(true)).toBe(true);
    expect(canPlayTts({ recording: true, uploading: false })).toBe(false);
    expect(canSubmitAnswer({ recording: false, uploading: true })).toBe(false);
    expect(questionChangeResetState()).toEqual({ recording: false, uploading: false, transcript: '', error: '', isSpeaking: false });
  });
});
