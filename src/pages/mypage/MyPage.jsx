import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useJdStore } from '../../store/jdStore';
import { useAuthStore } from '../../store/authStore';
import { mypageApi } from '../../api/mypageApi';

const JOB_LABEL = {
  backend: '백엔드 개발자',
  frontend: '프론트엔드 개발자',
  fullstack: '풀스택 개발자',
  data: '데이터 엔지니어',
  ai_ml: 'AI/ML 엔지니어',
  devops: 'DevOps 엔지니어',
  pm: 'PM/기획자',
  etc: '기타',
};

function SectionCard({ title, children }) {
  return (
    <div className="bg-white rounded-2xl shadow p-5">
      <p className="text-xs font-bold uppercase tracking-wide text-[#08CB00] mb-3">{title}</p>
      {children}
    </div>
  );
}

function MyPage() {
  const navigate = useNavigate();
  const { jdData } = useJdStore();
  const user = useAuthStore((s) => s.user);

  // 실제 면접 기록 (GET /api/v1/mypage/interviews, request.user 기준)
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState('');

  useEffect(() => {
    if (!localStorage.getItem('access_token')) {
      navigate('/auth/login');
      return;
    }
    let active = true;
    mypageApi
      .getInterviewHistory()
      .then((data) => {
        if (active) setHistory(Array.isArray(data?.results) ? data.results : []);
      })
      .catch((err) => {
        if (!active) return;
        const s = err.response?.status;
        if (s === 401) {
          navigate('/auth/login');
          return;
        }
        if (s === 403) setHistoryError('접근 권한이 없습니다.');
        else if (s === 404) setHistoryError('기록을 찾을 수 없습니다.');
        else setHistoryError('면접 기록을 불러오지 못했습니다.');
        // mock 데이터로 대체하지 않음
      })
      .finally(() => {
        if (active) setHistoryLoading(false);
      });
    return () => {
      active = false;
    };
  }, [navigate]);

  const rawProfile = localStorage.getItem('userProfile');
  const profile = rawProfile ? JSON.parse(rawProfile) : null;

  const rawDocs = localStorage.getItem('userDocuments');
  const docs = rawDocs ? JSON.parse(rawDocs) : null;

  const careerLabel = profile?.careerType === 'new' ? '신입' : '경력';
  const majorLabel = profile?.majorType === 'major' ? '전공자' : '비전공자';
  const jobLabel = JOB_LABEL[profile?.jobRole] ?? profile?.jobRole ?? '백엔드 개발자';
  const yearsLabel = profile?.yearsExp && profile.yearsExp !== '0' ? `${profile.yearsExp}년차` : '신입';

  const company = jdData?.company_name ?? '회사명 미입력';
  const position = jdData?.position ?? '백엔드 개발자';

  return (
    <main className="min-h-screen bg-[#EEEEEE] px-4 py-8">
      <div className="mx-auto max-w-xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#253900]">마이페이지</h1>
            <p className="mt-1 text-sm text-slate-500">
              {user ? `${user.name || user.email}님의 면접 정보와 기록` : '내 면접 정보와 기록을 확인하세요.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/auth/login')}
            className="text-xs text-slate-400 hover:text-slate-600 border border-slate-200 rounded-lg px-3 py-1.5"
          >
            로그아웃
          </button>
        </div>

        <div className="space-y-4">
          {/* 내 프로필 */}
          <SectionCard title="내 프로필">
            <div className="flex flex-wrap gap-2">
              {[careerLabel, majorLabel, jobLabel, yearsLabel].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-[#EEEEEE] px-3 py-1 text-sm text-[#253900] font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="mt-3 text-xs text-[#08CB00] font-semibold"
            >
              프로필 수정
            </button>
          </SectionCard>

          {/* 등록한 JD */}
          <SectionCard title="등록한 JD">
            {jdData ? (
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {company} · {position}
                </p>
                {jdData.experience_level && (
                  <p className="mt-0.5 text-xs text-slate-400">{jdData.experience_level}</p>
                )}
                {jdData.tech_stacks?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {jdData.tech_stacks.map((s) => (
                      <span key={s} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-400">등록한 JD가 없습니다.</p>
            )}
            <button
              type="button"
              onClick={() => navigate('/jd')}
              className="mt-3 text-xs text-[#08CB00] font-semibold"
            >
              JD 수정
            </button>
          </SectionCard>

          {/* 등록한 지원 자료 */}
          <SectionCard title="등록한 지원 자료">
            {docs ? (
              <div className="space-y-2 text-sm text-slate-600">
                <p>
                  <span className="font-semibold text-slate-800">이력서:</span>{' '}
                  {docs.resume ? `${docs.resume.substring(0, 40)}...` : '미입력'}
                </p>
                <p>
                  <span className="font-semibold text-slate-800">자소서:</span>{' '}
                  {docs.coverLetters?.some((c) => c.answer) ? '작성 완료' : '미입력'}
                </p>
                <p>
                  <span className="font-semibold text-slate-800">프로젝트:</span>{' '}
                  {docs.projectExp ? `${docs.projectExp.substring(0, 40)}...` : '미입력'}
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-400">등록한 지원 자료가 없습니다.</p>
            )}
            <button
              type="button"
              onClick={() => navigate('/input/documents')}
              className="mt-3 text-xs text-[#08CB00] font-semibold"
            >
              자료 수정
            </button>
          </SectionCard>

          {/* 면접 기록 (실제 API) */}
          <SectionCard title="면접 기록">
            {historyLoading ? (
              <p className="text-sm text-slate-400">불러오는 중...</p>
            ) : historyError ? (
              <p className="text-sm text-red-600">{historyError}</p>
            ) : history.length === 0 ? (
              <p className="text-sm text-slate-400">아직 면접 기록이 없습니다.</p>
            ) : (
              <div className="space-y-3">
                {history.map((rec) => (
                  <div
                    key={rec.session_id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {rec.interview_type || '면접'}
                        {rec.persona ? ` · ${rec.persona}` : ''}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {rec.created_at ? new Date(rec.created_at).toLocaleDateString('ko-KR') : ''} · 상태 {rec.status} · 질문 {rec.question_count}/답변 {rec.answer_count}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {rec.has_report && rec.overall_score != null && (
                        <span
                          className="text-base font-bold"
                          style={{ color: rec.overall_score >= 80 ? '#08CB00' : '#f59e0b' }}
                        >
                          {rec.overall_score}점
                        </span>
                      )}
                      {rec.has_report && (
                        <button
                          type="button"
                          onClick={() => navigate(`/report/${rec.session_id}`)}
                          className="rounded-lg bg-[#253900] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-80"
                        >
                          결과 보기
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* 새 면접 시작 */}
          <button
            type="button"
            onClick={() => navigate('/jd')}
            className="w-full rounded-lg bg-[#08CB00] py-3 text-sm font-semibold text-white hover:bg-[#06a800] transition-colors"
          >
            새 면접 시작
          </button>
        </div>
      </div>
    </main>
  );
}

export default MyPage;
