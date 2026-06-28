import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { listQuestionPacks, createQuestionPack, applyQuestionPack } from '../../api/questionPackApi';
import { interviewApi } from '../../api/interviewApi';
import { useInterviewStore } from '../../store/interviewStore';
import { getErrorCode, toUserMessage } from '../../api/errors';
import {
  interviewTypeLabel,
  packQuestionCount,
  packStatusLabel,
  isPackApplicable,
} from '../../utils/questionPack';
import {
  PageShell,
  Card,
  Button,
  Alert,
  Field,
  inputClass,
  LoadingState,
  EmptyState,
  StatusBadge,
} from '../../components/ui/DemoLayout';

const TYPE_OPTIONS = [
  { value: 'technical', label: '기술' },
  { value: 'personality', label: '인성' },
  { value: 'comprehensive', label: '종합' },
];

function selectedJdId() {
  return (
    localStorage.getItem('careerzip_selected_jd_id') ||
    localStorage.getItem('careerzip_temp_jd_id') ||
    ''
  );
}

export default function QuestionPacksPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const focus = params.get('focus') || '';

  const resetInterview = useInterviewStore((s) => s.resetInterview);
  const setSessionId = useInterviewStore((s) => s.setSessionId);

  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState('');
  const [packs, setPacks] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [notice, setNotice] = useState('');

  const [newType, setNewType] = useState('technical');
  const [newCount, setNewCount] = useState('5');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const [applyingId, setApplyingId] = useState(null);
  const [applyError, setApplyError] = useState('');

  const load = useCallback(async () => {
    setStatus('loading');
    setError('');
    try {
      const res = await listQuestionPacks();
      setPacks(res.data?.results ?? []);
      setStatus('ready');
    } catch (err) {
      setError(toUserMessage(err, '질문팩 목록을 불러오지 못했습니다.'));
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(
    () => (filterType === 'all' ? packs : packs.filter((p) => p.interview_type === filterType)),
    [packs, filterType]
  );

  const handleCreate = async () => {
    if (creating) return;
    setCreateError('');
    setNotice('');
    const count = Number(newCount);
    if (!Number.isFinite(count) || count < 1 || count > 20) {
      setCreateError('질문 수는 1~20 사이여야 합니다.');
      return;
    }
    setCreating(true);
    try {
      await createQuestionPack({ interviewType: newType, questionCount: count });
      setNotice('질문팩을 생성했습니다.');
      await load();
    } catch (err) {
      const code = getErrorCode(err);
      if (code === 'POINTS_INSUFFICIENT' || err?.response?.status === 402) {
        setCreateError('포인트가 부족하여 질문팩을 생성할 수 없습니다.');
      } else {
        setCreateError(toUserMessage(err, '질문팩 생성에 실패했습니다.'));
      }
    } finally {
      setCreating(false);
    }
  };

  const startWithPack = async (pack) => {
    if (applyingId) return;
    setApplyError('');
    const jdId = selectedJdId();
    if (!jdId) {
      setApplyError('면접에 사용할 JD가 없습니다. 먼저 자료 입력에서 JD를 선택·저장해 주세요.');
      return;
    }
    setApplyingId(pack.question_pack_id);
    try {
      resetInterview();
      const sessionData = await interviewApi.createSession({
        jd_id: jdId,
        interview_type: pack.interview_type,
        interview_mode: 'text',
      });
      const sessionId = sessionData?.session_id ?? sessionData?.id;
      if (!sessionId) throw new Error('session_id를 찾을 수 없습니다.');
      await applyQuestionPack(pack.question_pack_id, { sessionId });
      setSessionId(sessionId);
      // InterviewQuestionCheckPage 가 sessionId 로 질문을 직접 로드한다.
      navigate('/interview/question');
    } catch (err) {
      const code = getErrorCode(err);
      if (code === 'SESSION_QUESTIONS_EXIST') {
        setApplyError('이미 질문이 있는 세션입니다. 새 세션으로 다시 시도해 주세요.');
      } else if (code === 'POINTS_INSUFFICIENT' || err?.response?.status === 402) {
        setApplyError('포인트가 부족합니다.');
      } else {
        setApplyError(toUserMessage(err, '질문팩 적용에 실패했습니다.'));
      }
      setApplyingId(null);
    }
  };

  return (
    <PageShell
      activeNav="면접 진행"
      title="질문팩"
      description="미리 생성한 질문팩을 선택해 면접 세션에 적용할 수 있습니다."
    >
      {focus && (
        <Alert tone="info" className="mb-4">
          약점 집중 연습: <strong>{focus}</strong> 역량에 맞는 질문팩을 선택해 연습을 시작하세요.
        </Alert>
      )}

      {/* 새 질문팩 생성 */}
      <Card className="mb-6 p-6">
        <h2 className="text-lg font-black text-[#253900]">새 질문팩 만들기</h2>
        <p className="mt-1 text-sm text-[rgba(0,0,0,0.6)]">생성 시 포인트가 차감됩니다. 잔액이 부족하면 생성할 수 없습니다.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_140px_auto] sm:items-end">
          <Field label="면접 유형">
            <select className={inputClass} value={newType} onChange={(e) => setNewType(e.target.value)}>
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="질문 수">
            <input
              type="number"
              min={1}
              max={20}
              className={inputClass}
              value={newCount}
              onChange={(e) => setNewCount(e.target.value)}
            />
          </Field>
          <Button type="button" onClick={handleCreate} disabled={creating}>
            {creating ? '생성 중...' : '질문팩 생성'}
          </Button>
        </div>
        {createError && (
          <Alert tone="danger" className="mt-3">
            {createError}
          </Alert>
        )}
        {notice && (
          <Alert tone="info" className="mt-3">
            {notice}
          </Alert>
        )}
      </Card>

      {/* 필터 */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold text-[#253900]">유형 필터</span>
        {[{ value: 'all', label: '전체' }, ...TYPE_OPTIONS].map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => setFilterType(o.value)}
            className={`rounded-full border px-3 py-1 text-xs font-black transition ${
              filterType === o.value
                ? 'border-[#08CB00] bg-[rgba(8,203,0,0.12)] text-[#253900]'
                : 'border-[rgba(0,0,0,0.18)] bg-[#EEEEEE] text-[rgba(0,0,0,0.55)]'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      {applyError && (
        <Alert tone="danger" className="mb-4">
          {applyError}
        </Alert>
      )}

      {status === 'loading' && <LoadingState title="질문팩을 불러오는 중입니다" />}

      {status === 'error' && (
        <Card className="p-6">
          <Alert tone="danger">{error}</Alert>
          <Button type="button" className="mt-4" onClick={load}>
            다시 시도
          </Button>
        </Card>
      )}

      {status === 'ready' && visible.length === 0 && (
        <EmptyState
          title="질문팩이 없습니다"
          description="위에서 새 질문팩을 만들거나, 면접 설정에서 질문을 생성해 보세요."
          actionLabel="면접 설정으로"
          actionTo="/session-setup"
        />
      )}

      {status === 'ready' && visible.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {visible.map((pack) => {
            const count = packQuestionCount(pack);
            const applicable = isPackApplicable(pack);
            const isApplying = applyingId === pack.question_pack_id;
            return (
              <Card key={pack.question_pack_id} className="flex flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-black text-[#253900]">{pack.title || '질문팩'}</h3>
                    <p className="mt-1 text-xs text-[rgba(0,0,0,0.55)]">
                      {interviewTypeLabel(pack.interview_type)} · 질문 {count}개
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <StatusBadge tone={applicable ? 'success' : 'default'}>{packStatusLabel(pack.status)}</StatusBadge>
                    {pack.is_fallback && <StatusBadge tone="warning">Fallback</StatusBadge>}
                  </div>
                </div>
                <div className="mt-auto flex items-center justify-between gap-2">
                  <span className="text-xs text-[rgba(0,0,0,0.45)]">
                    {pack.created_at ? new Date(pack.created_at).toLocaleDateString('ko-KR') : ''}
                  </span>
                  <Button
                    type="button"
                    onClick={() => startWithPack(pack)}
                    disabled={!applicable || isApplying || Boolean(applyingId)}
                  >
                    {isApplying ? '적용 중...' : '이 질문팩으로 면접'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
