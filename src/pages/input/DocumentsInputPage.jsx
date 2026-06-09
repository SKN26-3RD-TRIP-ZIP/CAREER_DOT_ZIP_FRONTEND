import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const TABS = [
  { id: 'resume', label: '이력서' },
  { id: 'coverletter', label: '자기소개서' },
  { id: 'project', label: '프로젝트' },
];

const COVER_LETTER_QUESTIONS = [
  '지원 동기를 작성해주세요.',
  '본인의 강점과 약점을 작성해주세요.',
  '팀 프로젝트 협업 경험을 작성해주세요.',
];

function DocumentsInputPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('resume');
  const [resume, setResume] = useState('');
  const [coverLetters, setCoverLetters] = useState(
    COVER_LETTER_QUESTIONS.map((q) => ({ question: q, answer: '' }))
  );
  const [projectExp, setProjectExp] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCoverLetterChange = (idx, value) => {
    setCoverLetters((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, answer: value } : item))
    );
  };

  const handleNext = () => {
    setSaving(true);
    // mock 저장
    localStorage.setItem('userDocuments', JSON.stringify({ resume, coverLetters, projectExp }));
    setTimeout(() => {
      setSaving(false);
      navigate('/session-setup');
    }, 400);
  };

  return (
    <main className="min-h-screen bg-[#EEEEEE] px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <p className="text-xs font-semibold text-[#08CB00] uppercase tracking-wide mb-1">Step 3 / 4</p>
          <h1 className="text-2xl font-bold text-[#253900]">지원 자료 입력</h1>
          <p className="mt-1 text-sm text-slate-500">이력서, 자기소개서, 프로젝트 경험을 입력해주세요.</p>
        </div>

        <div className="bg-white rounded-2xl shadow overflow-hidden">
          {/* 탭 */}
          <div className="flex border-b border-slate-200">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                  activeTab === tab.id
                    ? 'border-b-2 border-[#08CB00] text-[#253900]'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* 이력서 탭 */}
            {activeTab === 'resume' && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-slate-700">이력서 내용 입력</p>
                <p className="text-xs text-slate-400">주요 경력, 학력, 스킬 등을 자유롭게 입력하세요.</p>
                <textarea
                  rows={10}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:border-[#08CB00]"
                  placeholder="예시:&#10;이름: 홍길동&#10;학력: OO대학교 컴퓨터공학과 (2020~2024)&#10;경력: ABC 스타트업 백엔드 인턴 (2023.07~2023.12)&#10;스킬: Java, Spring Boot, MySQL, Docker"
                  value={resume}
                  onChange={(e) => setResume(e.target.value)}
                />
              </div>
            )}

            {/* 자기소개서 탭 */}
            {activeTab === 'coverletter' && (
              <div className="space-y-5">
                <p className="text-sm font-semibold text-slate-700">자기소개서 작성</p>
                {coverLetters.map((item, idx) => (
                  <div key={idx}>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Q{idx + 1}. {item.question}
                    </label>
                    <textarea
                      rows={4}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:border-[#08CB00]"
                      placeholder="답변을 입력하세요..."
                      value={item.answer}
                      onChange={(e) => handleCoverLetterChange(idx, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* 프로젝트 탭 */}
            {activeTab === 'project' && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-slate-700">프로젝트 경험</p>
                <p className="text-xs text-slate-400">주요 프로젝트의 기여도, 기술 스택, 성과를 입력하세요.</p>
                <textarea
                  rows={10}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:border-[#08CB00]"
                  placeholder="예시:&#10;프로젝트명: Career.zip&#10;기간: 2026.03 ~ 2026.06&#10;역할: 백엔드 개발 (Django, MySQL)&#10;기여: AI 질문 생성 API 설계 및 구현, 세션 관리 로직 개발&#10;성과: 모의면접 서비스 MVP 완성, 사용자 100명 테스트 완료"
                  value={projectExp}
                  onChange={(e) => setProjectExp(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 px-6 py-4 flex justify-between items-center">
            <button
              type="button"
              onClick={() => navigate('/jd')}
              className="text-sm text-slate-400 hover:text-slate-600"
            >
              ← JD 다시 입력
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={saving}
              className="rounded-lg bg-[#08CB00] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#06a800] disabled:opacity-50 transition-colors"
            >
              {saving ? '저장 중...' : '면접 설정으로 이동 →'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default DocumentsInputPage;
