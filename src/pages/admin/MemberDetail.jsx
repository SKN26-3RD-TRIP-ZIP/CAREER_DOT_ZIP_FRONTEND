import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMemberDetail } from '../../api/adminApi';

function Row({ label, value }) {
  return (
    <div className="flex justify-between border-b border-[rgba(0,0,0,0.08)] py-2 text-sm">
      <span className="text-[rgba(0,0,0,0.68)]">{label}</span>
      <span className="font-medium text-[#000000]">{value ?? '-'}</span>
    </div>
  );
}

function MemberDetail() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    getMemberDetail(userId)
      .then((data) => {
        if (active) setMember(data);
      })
      .catch((err) => {
        if (!active) return;
        const s = err.response?.status;
        if (s === 401) {
          navigate('/admin/live/login');
          return;
        }
        if (s === 403) setError('관리자 권한이 필요합니다.');
        else if (s === 404) setError('회원을 찾을 수 없습니다.');
        else setError('회원 정보를 불러오지 못했습니다.');
        // mock 데이터로 대체하지 않음
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [userId, navigate]);

  return (
    <main className="min-h-screen bg-[#EEEEEE] px-4 py-8">
      <div className="mx-auto max-w-xl">
        <button
          type="button"
          onClick={() => navigate('/admin/live/members')}
          className="mb-4 text-xs text-[rgba(0,0,0,0.68)] hover:text-[#253900] border border-[rgba(0,0,0,0.12)] rounded-lg px-3 py-1.5"
        >
          ← 회원 목록으로 돌아가기
        </button>

        <h1 className="text-2xl font-bold text-[#253900] mb-4">회원 상세</h1>

        {loading ? (
          <p className="text-sm text-[rgba(0,0,0,0.52)]">불러오는 중...</p>
        ) : error ? (
          <p className="text-sm text-[#000000]">{error}</p>
        ) : member ? (
          <div className="space-y-4">
            <div className="bg-[#EEEEEE] rounded-2xl shadow p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-[#08CB00] mb-3">기본 정보</p>
              <Row label="이름" value={member.name} />
              <Row label="이메일" value={member.email} />
              <Row label="role" value={member.role} />
              <Row label="상태(status)" value={member.status} />
              <Row label="활성(is_active)" value={String(member.is_active)} />
              <Row label="이메일 인증(is_verified)" value={String(member.is_verified)} />
              <Row label="관리자(is_staff)" value={String(member.is_staff)} />
              <Row label="가입일" value={member.created_at} />
              <Row label="최근 로그인" value={member.last_login} />
            </div>

            <div className="bg-[#EEEEEE] rounded-2xl shadow p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-[#08CB00] mb-3">면접/리포트 요약</p>
              <Row label="완료 면접 수" value={member.practice_count ?? 0} />
              <Row label="면접 세션 수" value={member.interview_count} />
              <Row label="완료된 면접 수" value={member.completed_interview_count} />
              <Row label="리포트 수" value={member.report_count} />
              <Row label="최근 면접 일자" value={member.latest_interview_at} />
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}

export default MemberDetail;
