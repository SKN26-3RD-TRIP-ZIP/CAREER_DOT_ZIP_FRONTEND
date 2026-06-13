import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { resumeApi } from '../../api/resumeApi';

const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;

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

const fmtDateTime = (v) => (v ? new Date(v).toLocaleString('ko-KR') : '기록 없음');

function validateResumeFile(file) {
  if (!file) return '업로드할 이력서 파일을 선택해주세요.';
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!['pdf', 'docx'].includes(ext)) return 'PDF 또는 DOCX 파일만 업로드할 수 있습니다.';
  if (file.size > MAX_UPLOAD_SIZE) return '파일 크기는 10MB를 초과할 수 없습니다.';
  return null;
}

function formatApiError(err, fallback) {
  const status = err?.response?.status;
  const detail = err?.response?.data?.detail || err?.response?.data;
  if (!err?.response) return '백엔드 서버에 연결할 수 없습니다. runserver가 켜져 있는지 확인해주세요.';
  if (status === 401) return '로그인이 필요합니다. 로그인 페이지로 이동합니다.';
  if (status === 413) return '파일 크기는 10MB를 초과할 수 없습니다.';
  if (status === 422) return typeof detail === 'string' ? detail : '파일에서 텍스트를 추출하지 못했습니다.';
  if (status === 400) return typeof detail === 'string' ? detail : `입력값 오류: ${JSON.stringify(detail)}`;
  return `${fallback} (HTTP ${status})`;
}

function DocumentsInputPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('resume');
  const [resume, setResume] = useState('');
  const [coverLetters, setCoverLetters] = useState(
    COVER_LETTER_QUESTIONS.map((q) => ({ question: q, answer: '' }))
  );
  const [projectExp, setProjectExp] = useState('');
  const [saving, setSaving] = useState(false);
  const [resumeList, setResumeList] = useState([]);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedResumeId, setSelectedResumeId] = useState(
    window.localStorage.getItem('careerzip_selected_resume_id') || ''
  );
  const [resumeUploadName, setResumeUploadName] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeDetail, setResumeDetail] = useState(null);
  const [error, setError] = useState('');

  const fetchResumes = async () => {
    setResumeLoading(true);
    setError('');
    try {
      const data = await resumeApi.getResumes();
      const results = Array.isArray(data?.results) ? data.results : [];
      setResumeList(results);
      const remembered = window.localStorage.getItem('careerzip_selected_resume_id');
      if (!selectedResumeId && (remembered || results[0]?.resume_id)) {
        const nextId = remembered || results[0].resume_id;
        setSelectedResumeId(nextId);
        window.localStorage.setItem('careerzip_selected_resume_id', nextId);
      }
    } catch (err) {
      const message = formatApiError(err, '이력서 목록을 불러오지 못했습니다.');
      setError(message);
      if (err?.response?.status === 401) navigate('/auth/login');
    } finally {
      setResumeLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const handleCoverLetterChange = (idx, value) => {
    setCoverLetters((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, answer: value } : item))
    );
  };

  const selectResume = (resumeId) => {
    setSelectedResumeId(resumeId);
    window.localStorage.setItem('careerzip_selected_resume_id', resumeId);
    setResumeDetail(null);
  };

  const handleResumeUpload = async (e) => {
    e.preventDefault();
    setError('');
    const fileError = validateResumeFile(resumeFile);
    if (fileError) {
      setError(fileError);
      return;
    }
    setUploading(true);
    try {
      const data = await resumeApi.uploadResumeFile(resumeFile, { name: resumeUploadName.trim() });
      const nextId = data?.resume_id;
      if (nextId) selectResume(nextId);
      setResumeUploadName('');
      setResumeFile(null);
      await fetchResumes();
    } catch (err) {
      const message = formatApiError(err, '이력서 업로드에 실패했습니다.');
      setError(message);
      if (err?.response?.status === 401) navigate('/auth/login');
    } finally {
      setUploading(false);
    }
  };

  const handleLoadResumeDetail = async () => {
    if (!selectedResumeId) return;
    setError('');
    try {
      const data = await resumeApi.getResumeDetail(selectedResumeId);
      setResumeDetail(data);
    } catch (err) {
      const message = formatApiError(err, '이력서 상세를 불러오지 못했습니다.');
      setError(message);
      if (err?.response?.status === 401) navigate('/auth/login');
    }
  };

  const handleNext = () => {
    setError('');
    if (!selectedResumeId) {
      setError('면접에 사용할 이력서를 업로드하거나 목록에서 선택해주세요.');
      setActiveTab('resume');
      return;
    }
    setSaving(true);
    localStorage.setItem(
      'userDocuments',
      JSON.stringify({ resume, coverLetters, projectExp, resume_id: selectedResumeId })
    );
    window.localStorage.setItem('careerzip_selected_resume_id', selectedResumeId);
    setTimeout(() => {
      setSaving(false);
      navigate('/session-setup');
    }, 200);
  };

  return (
    <main className="min-h-screen bg-[#EEEEEE] px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#08CB00]">Step 3 / 4</p>
          <h1 className="text-2xl font-bold text-[#253900]">지원 자료 입력</h1>
          <p className="mt-1 text-sm text-slate-500">이력서, 자기소개서, 프로젝트 경험을 입력해주세요.</p>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow">
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
            {activeTab === 'resume' && (
              <div className="space-y-6">
                <form onSubmit={handleResumeUpload} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-800">이력서 파일 업로드</p>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <input
                      type="text"
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      placeholder="이력서 제목 (선택)"
                      value={resumeUploadName}
                      onChange={(e) => setResumeUploadName(e.target.value)}
                    />
                    <input
                      type="file"
                      accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="text-xs text-slate-400">PDF 또는 DOCX, 최대 10MB</p>
                    <button
                      type="submit"
                      disabled={uploading}
                      className="rounded-lg bg-[#253900] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      {uploading ? '업로드 중...' : '업로드'}
                    </button>
                  </div>
                </form>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-700">저장된 이력서 선택</p>
                    <button
                      type="button"
                      onClick={fetchResumes}
                      disabled={resumeLoading}
                      className="text-xs font-semibold text-[#08CB00]"
                    >
                      {resumeLoading ? '새로고침 중' : '새로고침'}
                    </button>
                  </div>
                  <div className="space-y-2">
                    {resumeList.length === 0 && !resumeLoading && (
                      <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-400">등록된 이력서가 없습니다.</p>
                    )}
                    {resumeList.map((item) => (
                      <button
                        key={item.resume_id}
                        type="button"
                        onClick={() => selectResume(item.resume_id)}
                        className={`w-full rounded-xl border p-4 text-left transition-colors ${
                          selectedResumeId === item.resume_id
                            ? 'border-[#253900] bg-[#253900] text-white'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'
                        }`}
                      >
                        <p className="text-sm font-semibold">{item.name || '이력서'}</p>
                        <p className={`mt-1 text-xs ${selectedResumeId === item.resume_id ? 'text-slate-300' : 'text-slate-400'}`}>
                          최종 수정 {fmtDateTime(item.updated_at)}
                        </p>
                      </button>
                    ))}
                  </div>
                  {selectedResumeId && (
                    <button
                      type="button"
                      onClick={handleLoadResumeDetail}
                      className="mt-3 rounded-lg border border-slate-300 px-4 py-2 text-sm"
                    >
                      선택 이력서 상세 보기
                    </button>
                  )}
                  {resumeDetail && (
                    <div className="mt-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                      <p className="font-semibold text-slate-800">{resumeDetail.name}</p>
                      <p className="mt-2 line-clamp-4 whitespace-pre-line">
                        {resumeDetail.original_text || '추출된 이력서 텍스트가 없습니다.'}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-semibold text-slate-700">보충 메모</p>
                  <textarea
                    rows={5}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-[#08CB00] focus:outline-none"
                    placeholder="업로드 이력서 외에 면접 준비용 메모를 남길 수 있습니다."
                    value={resume}
                    onChange={(e) => setResume(e.target.value)}
                  />
                </div>
              </div>
            )}

            {activeTab === 'coverletter' && (
              <div className="space-y-5">
                <p className="text-sm font-semibold text-slate-700">자기소개서 작성</p>
                {coverLetters.map((item, idx) => (
                  <div key={item.question}>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Q{idx + 1}. {item.question}
                    </label>
                    <textarea
                      rows={4}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-[#08CB00] focus:outline-none"
                      placeholder="답변을 입력하세요..."
                      value={item.answer}
                      onChange={(e) => handleCoverLetterChange(idx, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'project' && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-slate-700">프로젝트 경험</p>
                <p className="text-xs text-slate-400">주요 프로젝트의 기여도, 기술 스택, 성과를 입력하세요.</p>
                <textarea
                  rows={10}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-[#08CB00] focus:outline-none"
                  placeholder="예시:&#10;프로젝트명: Career.zip&#10;기간: 2026.03 ~ 2026.06&#10;역할: 백엔드 개발 (Django, MySQL)&#10;기여: AI 질문 생성 API 설계 및 구현, 세션 관리 로직 개발"
                  value={projectExp}
                  onChange={(e) => setProjectExp(e.target.value)}
                />
              </div>
            )}

            {error && <div className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
            <button
              type="button"
              onClick={() => navigate('/jd')}
              className="text-sm text-slate-400 hover:text-slate-600"
            >
              JD 다시 입력
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={saving}
              className="rounded-lg bg-[#08CB00] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#06a800] disabled:opacity-50"
            >
              {saving ? '저장 중...' : '면접 설정으로 이동'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default DocumentsInputPage;
