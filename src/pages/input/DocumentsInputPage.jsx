import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { resumeApi } from '../../api/resumeApi';
import {
  Alert,
  Button,
  Card,
  EmptyState,
  Field,
  LoadingState,
  PageShell,
  StatusBadge,
  inputClass,
} from '../../components/ui/DemoLayout';

const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;
const STEPS = ['프로필', 'JD 등록', '이력서', '면접 설정'];

const TABS = [
  { id: 'resume', label: '이력서' },
  { id: 'coverletter', label: '자기소개서 메모' },
  { id: 'project', label: '프로젝트 메모' },
];

const COVER_LETTER_QUESTIONS = [
  '지원 동기를 작성해주세요.',
  '본인의 강점과 약점을 작성해주세요.',
  '대표 프로젝트 경험을 작성해주세요.',
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
  if (!err?.response) return '서버에 연결할 수 없습니다. 백엔드 실행 상태를 확인해주세요.';
  if (status === 401) return '로그인이 필요합니다. 다시 로그인해주세요.';
  if (status === 413) return '파일 크기는 10MB를 초과할 수 없습니다.';
  if (status === 422) return typeof detail === 'string' ? detail : '파일에서 텍스트를 추출하지 못했습니다.';
  if (status === 400) return typeof detail === 'string' ? detail : `입력값 오류: ${JSON.stringify(detail)}`;
  return `${fallback} (HTTP ${status})`;
}

function DocumentsInputPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('resume');
  const [resume, setResume] = useState('');
  const [coverLetters, setCoverLetters] = useState(COVER_LETTER_QUESTIONS.map((q) => ({ question: q, answer: '' })));
  const [projectExp, setProjectExp] = useState('');
  const [saving, setSaving] = useState(false);
  const [resumeList, setResumeList] = useState([]);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedResumeId, setSelectedResumeId] = useState(window.localStorage.getItem('careerzip_selected_resume_id') || '');
  const [resumeUploadName, setResumeUploadName] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeDetail, setResumeDetail] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
      setError(formatApiError(err, '이력서 목록을 불러오지 못했습니다.'));
      if (err?.response?.status === 401) navigate('/auth/login');
    } finally {
      setResumeLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCoverLetterChange = (idx, value) => {
    setCoverLetters((prev) => prev.map((item, i) => (i === idx ? { ...item, answer: value } : item)));
  };

  const selectResume = (resumeId) => {
    setSelectedResumeId(resumeId);
    window.localStorage.setItem('careerzip_selected_resume_id', resumeId);
    setResumeDetail(null);
    setSuccess('');
  };

  const handleResumeUpload = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
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
      setSuccess('이력서가 업로드되었습니다. 목록에서 선택된 이력서를 확인해주세요.');
    } catch (err) {
      setError(formatApiError(err, '이력서 업로드에 실패했습니다.'));
      if (err?.response?.status === 401) navigate('/auth/login');
    } finally {
      setUploading(false);
    }
  };

  const handleLoadResumeDetail = async () => {
    if (!selectedResumeId) return;
    setError('');
    setSuccess('');
    try {
      const data = await resumeApi.getResumeDetail(selectedResumeId);
      setResumeDetail(data);
    } catch (err) {
      setError(formatApiError(err, '이력서 상세를 불러오지 못했습니다.'));
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
    localStorage.setItem('userDocuments', JSON.stringify({ resume, coverLetters, projectExp, resume_id: selectedResumeId }));
    window.localStorage.setItem('careerzip_selected_resume_id', selectedResumeId);
    setTimeout(() => {
      setSaving(false);
      navigate('/interview/setup');
    }, 200);
  };

  return (
    <PageShell
      eyebrow="Step 3"
      title="이력서와 보조 자료"
      description="PDF 또는 DOCX 이력서를 업로드하고 면접 세션에서 사용할 이력서를 선택합니다. 자소서와 프로젝트는 현재 화면 내 준비 메모로 저장됩니다."
      steps={STEPS}
      currentStep={3}
    >
      <Card className="mx-auto max-w-4xl overflow-hidden">
        <div className="grid grid-cols-3 border-b border-slate-200">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-4 text-sm font-semibold transition ${
                activeTab === tab.id ? 'border-b-2 border-emerald-600 text-emerald-700' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'resume' && (
            <div className="space-y-6">
              <form onSubmit={handleResumeUpload} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-900">이력서 파일 업로드</p>
                    <p className="mt-1 text-xs text-slate-500">PDF 또는 DOCX, 최대 10MB</p>
                  </div>
                  <StatusBadge tone="info">실제 API 저장</StatusBadge>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="이력서 제목 (선택)"
                    value={resumeUploadName}
                    onChange={(e) => setResumeUploadName(e.target.value)}
                  />
                  <input
                    type="file"
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className={inputClass}
                    onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
                  />
                </div>
                <div className="mt-4 flex justify-end">
                  <Button type="submit" disabled={uploading}>
                    {uploading ? '업로드 중...' : '이력서 업로드'}
                  </Button>
                </div>
              </form>

              <section>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-900">저장된 이력서 선택</p>
                  <Button type="button" variant="ghost" onClick={fetchResumes} disabled={resumeLoading}>
                    {resumeLoading ? '새로고침 중...' : '새로고침'}
                  </Button>
                </div>

                {resumeLoading ? (
                  <LoadingState title="이력서 목록을 불러오는 중입니다" />
                ) : resumeList.length === 0 ? (
                  <EmptyState
                    title="아직 등록된 이력서가 없습니다"
                    description="PDF 또는 DOCX 이력서를 업로드하면 면접 세션에서 선택할 수 있습니다."
                  />
                ) : (
                  <div className="grid gap-2">
                    {resumeList.map((item) => (
                      <button
                        key={item.resume_id}
                        type="button"
                        onClick={() => selectResume(item.resume_id)}
                        className={`rounded-lg border p-4 text-left transition ${
                          selectedResumeId === item.resume_id
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold">{item.name || '이력서'}</p>
                          {selectedResumeId === item.resume_id && <StatusBadge tone="success">선택됨</StatusBadge>}
                        </div>
                        <p className="mt-1 text-xs text-slate-500">최근 수정 {fmtDateTime(item.updated_at)}</p>
                      </button>
                    ))}
                  </div>
                )}

                {selectedResumeId && (
                  <Button type="button" variant="secondary" onClick={handleLoadResumeDetail} className="mt-3">
                    선택 이력서 상세 보기
                  </Button>
                )}
                {resumeDetail && (
                  <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    <p className="font-semibold text-slate-900">{resumeDetail.name || '이력서'}</p>
                    <p className="mt-2 max-h-36 overflow-auto whitespace-pre-line leading-6">
                      {resumeDetail.original_text || '추출된 이력서 텍스트가 없습니다.'}
                    </p>
                  </div>
                )}
              </section>

              <Field label="보조 메모" hint="API 저장값은 아니며 세션 설정 전까지 브라우저에 보관됩니다.">
                <textarea
                  rows={5}
                  className={inputClass}
                  placeholder="이력서 기반으로 면접에서 강조하고 싶은 내용을 적어두세요."
                  value={resume}
                  onChange={(e) => setResume(e.target.value)}
                />
              </Field>
            </div>
          )}

          {activeTab === 'coverletter' && (
            <div className="space-y-5">
              <Alert tone="info">현재 자소서 메모는 브라우저에만 보관됩니다. 저장된 자소서가 있는 경우 면접 설정 화면에서 별도로 선택할 수 있습니다.</Alert>
              {coverLetters.map((item, idx) => (
                <Field key={item.question} label={`Q${idx + 1}. ${item.question}`}>
                  <textarea
                    rows={4}
                    className={inputClass}
                    placeholder="답변을 입력해주세요."
                    value={item.answer}
                    onChange={(e) => handleCoverLetterChange(idx, e.target.value)}
                  />
                </Field>
              ))}
            </div>
          )}

          {activeTab === 'project' && (
            <div className="space-y-4">
              <Alert tone="info">프로젝트 경험은 현재 면접 준비 메모로만 저장됩니다. 실제 프로젝트 API가 없는 경우 빈 상태로 표시됩니다.</Alert>
              <Field label="프로젝트 경험" hint="프로젝트명, 기간, 역할, 기술 스택, 성과를 함께 적어두면 질문 준비에 도움이 됩니다.">
                <textarea
                  rows={10}
                  className={inputClass}
                  placeholder={'예시:\n프로젝트명: Career.zip\n기간: 2026.03 ~ 2026.06\n역할: 백엔드 개발\n기여: AI 질문 생성 API 설계 및 구현'}
                  value={projectExp}
                  onChange={(e) => setProjectExp(e.target.value)}
                />
              </Field>
            </div>
          )}

          {error && <Alert tone="danger" className="mt-5">{error}</Alert>}
          {success && <Alert tone="success" className="mt-5">{success}</Alert>}
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <Button type="button" variant="secondary" onClick={() => navigate('/jd')}>
            JD 다시 등록
          </Button>
          <Button type="button" onClick={handleNext} disabled={saving}>
            {saving ? '저장 중...' : '면접 설정으로 이동'}
          </Button>
        </div>
      </Card>
    </PageShell>
  );
}

export default DocumentsInputPage;
