import { useNavigate } from 'react-router-dom';
import { useJdStore } from '../../store/jdStore';

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

const MOCK_INTERVIEW_HISTORY = [
  {
    id: 1,
    date: '2026.06.09',
    company: '카카오',
    position: '백엔드 개발자',
    type: '종합 면접',
    persona: '실무형',
    score: 82,
  },
];

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

  const rawProfile = localStorage.getItem('userProfile');
  const profile = rawProfile ? JSON.parse(rawProfile) : null;

  const rawDocs = localStorage.getItem('userDocuments');
  const docs = rawDocs ? JSON.parse(rawDocs) : null;

  const careerLabel = profile?.careerType === 'new' ? '신입' : '경력';
  const majorLabel = profile?.majorType === 'major' ? '전공자' : '비전공자';
  const jobLabel = JOB_LABEL[profile?.jobRole] ?? profile?.jobRole ?? '백엔드 개발자';
  const yearsLabel = profile?.yearsExp && profile.yearsExp !== '0'
    ? `${profile.yearsExp}년차`
    : '신입';

  const company = jdData?.company_name ?? '카카오';
  const position = jdData?.position ?? '백엔드 개발자';

  return (
    <main className="min-h-screen bg-[#EEEEEE] px-4 py-8">
      <div className="mx-auto max-w-xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#253900]">마이페이지</h1>
            <p className="mt-1 text-sm text-slate-500">내 면접 정보와 기록을 확인하세요.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/login')}
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
              <p className="text-sm text-slate-400">카카오 · 백엔드 개발자 (예시)</p>
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
              <div className="space-y-2 text-sm text-slate-500">
                <p><span className="font-semibold">이력서:</span> OO대학교 컴퓨터공학과, 인턴 경험 (예시)</p>
                <p><span className="font-semibold">자소서:</span> 작성 완료 (예시)</p>
                <p><span className="font-semibold">프로젝트:</span> Career.zip (예시)</p>
              </div>
            )}
            <button
              type="button"
              onClick={() => navigate('/input/documents')}
              className="mt-3 text-xs text-[#08CB00] font-semibold"
            >
              자료 수정
            </button>
          </SectionCard>

          {/* 면접 기록 */}
          <SectionCard title="면접 기록">
            <div className="space-y-3">
              {MOCK_INTERVIEW_HISTORY.map((rec) => (
                <div
                  key={rec.id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {rec.company} · {rec.position}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {rec.date} · {rec.type} · {rec.persona}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className="text-base font-bold"
                      style={{ color: rec.score >= 80 ? '#08CB00' : '#f59e0b' }}
                    >
                      {rec.score}점
                    </span>
                    <button
                      type="button"
                      onClick={() => navigate('/interview/report')}
                      className="rounded-lg bg-[#253900] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-80"
                    >
                      결과 보기
                    </button>
                  </div>
                </div>
              ))}
            </div>
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
