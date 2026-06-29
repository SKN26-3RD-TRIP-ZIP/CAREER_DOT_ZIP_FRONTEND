import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { resumeApi } from '../../api/resumeApi';
import { toUserMessage } from '../../api/errors';
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
const STEPS = ['프로필', 'JD 입력', '이력서', '자소서·프로젝트', '면접 설정'];

const fmtDateTime = (v) => (v ? new Date(v).toLocaleString('ko-KR') : '기록 없음');

function validateResumeFile(file) {
  if (!file) return '업로드할 이력서 파일을 선택해주세요.';
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!['pdf', 'docx'].includes(ext)) return 'PDF 또는 DOCX 파일만 업로드할 수 있습니다.';
  if (file.size > MAX_UPLOAD_SIZE) return '파일 크기는 10MB를 초과할 수 없습니다.';
  return null;
}

function formatApiError(err, fallback) {
  return toUserMessage(err, fallback);
}

function DocumentsInputPage() {
  const navigate = useNavigate();
  const [resumeList, setResumeList] = useState([]);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedResumeId, setSelectedResumeId] = useState(window.localStorage.getItem('careerzip_selected_resume_id') || '');
  const [resumeUploadName, setResumeUploadName] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeDetail, setResumeDetail] = useState(null);
  const [focusMemo, setFocusMemo] = useState('');
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
        selectResume(nextId);
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
      setSuccess('이력서가 업로드되었습니다. 선택된 이력서를 확인해주세요.');
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
      return;
    }
    window.localStorage.setItem('careerzip_selected_resume_id', selectedResumeId);
    navigate('/input/cover-letter-project');
  };

  return (
    <PageShell
      eyebrow="Step 3"
      title="이력서를 업로드해요"
      description="PDF 또는 DOCX 이력서를 업로드하고 면접 세션에서 사용할 이력서를 선택합니다."
      steps={STEPS}
      currentStep={3}
    >
      <Card className="mx-auto max-w-5xl p-6">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <form onSubmit={handleResumeUpload} className="rounded-lg border border-[rgba(0,0,0,0.12)] p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-[#253900]">이력서 파일 업로드</h2>
                <p className="mt-2 text-sm leading-6">PDF 또는 DOCX 파일을 끌어다 놓거나 파일 선택으로 업로드하세요.</p>
              </div>
              <StatusBadge tone="info">최대 10MB</StatusBadge>
            </div>
            <div className="mt-5 space-y-4">
              <Field label="이력서 제목">
                <input
                  type="text"
                  className={inputClass}
                  placeholder="예: 백엔드 이력서 v3"
                  value={resumeUploadName}
                  onChange={(e) => setResumeUploadName(e.target.value)}
                />
              </Field>
              <Field label="이력서 파일" hint="PDF, DOCX 파일을 지원합니다." required>
                <input
                  type="file"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className={inputClass}
                  onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
                />
              </Field>
              <Button type="submit" disabled={uploading} className="w-full">
                {uploading ? '업로드 중...' : '파일 선택 후 업로드'}
              </Button>
            </div>
          </form>

          <section className="rounded-lg border border-[rgba(0,0,0,0.12)] p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-xl font-black text-[#253900]">최근 이력서</h2>
              <Button type="button" variant="ghost" onClick={fetchResumes} disabled={resumeLoading}>
                새로고침
              </Button>
            </div>
            {resumeLoading ? (
              <LoadingState title="이력서 목록을 불러오는 중입니다" />
            ) : resumeList.length === 0 ? (
              <EmptyState title="아직 등록된 이력서가 없습니다" description="이력서를 업로드하면 면접 세션에서 선택할 수 있습니다." />
            ) : (
              <div className="grid gap-3">
                {resumeList.map((item) => (
                  <button
                    key={item.resume_id}
                    type="button"
                    onClick={() => selectResume(item.resume_id)}
                    className={`rounded-lg border p-4 text-left transition ${
                      selectedResumeId === item.resume_id
                        ? 'border-[#253900] bg-[#08CB00] text-[#000000]'
                        : 'border-[rgba(0,0,0,0.12)] bg-[#EEEEEE] text-[#000000] hover:opacity-80'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-black">{item.name || '이력서'}</p>
                      {selectedResumeId === item.resume_id && <StatusBadge tone="success">선택됨</StatusBadge>}
                    </div>
                    <p className="mt-1 text-xs">최근 수정 {fmtDateTime(item.updated_at)}</p>
                  </button>
                ))}
              </div>
            )}
            {selectedResumeId && (
              <Button type="button" variant="secondary" onClick={handleLoadResumeDetail} className="mt-4">
                선택 이력서 상세 보기
              </Button>
            )}
          </section>
        </div>

        {resumeDetail && (
          <div className="mt-6 rounded-lg border border-[rgba(0,0,0,0.12)] p-5 text-sm">
            <p className="font-black text-[#253900]">{resumeDetail.name || '이력서'}</p>
            <p className="mt-3 max-h-40 overflow-auto whitespace-pre-line leading-6">
              {resumeDetail.original_text || '추출된 이력서 텍스트가 없습니다.'}
            </p>
          </div>
        )}

        <Field label="면접에서 강조할 내용" hint="API 저장값은 아니며 세션 설정 전까지 브라우저에 보관됩니다.">
          <textarea
            rows={4}
            className={`${inputClass} mt-6`}
            placeholder="이력서 기반으로 면접에서 강조하고 싶은 내용을 적어두세요."
            value={focusMemo}
            onChange={(e) => setFocusMemo(e.target.value)}
          />
        </Field>

        {error && <Alert tone="danger" className="mt-5">{error}</Alert>}
        {success && <Alert tone="success" className="mt-5">{success}</Alert>}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Button type="button" variant="secondary" onClick={() => navigate('/jd')}>
            이전
          </Button>
          <Button type="button" onClick={handleNext}>
            저장하고 다음
          </Button>
        </div>
      </Card>
    </PageShell>
  );
}

export default DocumentsInputPage;
