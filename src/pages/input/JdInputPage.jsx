import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jdApi } from '../../api/jdApi';
import { jobsApi } from '../../api/jobsApi';
import { useJdStore } from '../../store/jdStore';
import {
  Alert,
  Button,
  Card,
  EmptyState,
  Field,
  LoadingState,
  PageShell,
  inputClass,
} from '../../components/ui/DemoLayout';

const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;
const STEPS = ['프로필', 'JD 입력', '이력서', '자소서·프로젝트', '면접 설정'];

const INPUT_MODES = [
  { id: 'manual', label: '직접 입력' },
  { id: 'mock', label: 'Mock 공고' },
  { id: 'upload', label: 'PDF 업로드' },
];

const JOB_CATEGORY_OPTIONS = [
  { value: 'backend', label: '백엔드' },
  { value: 'frontend', label: '프론트엔드' },
  { value: 'fullstack', label: '풀스택' },
  { value: 'data', label: '데이터' },
  { value: 'ai_ml', label: 'AI/ML' },
  { value: 'devops', label: 'DevOps' },
  { value: 'security', label: '보안' },
  { value: 'pm', label: 'PM/기획' },
  { value: 'etc', label: '기타' },
];

const EXPERIENCE_LEVEL_OPTIONS = [
  { value: 'new', label: '신입' },
  { value: 'junior', label: '주니어' },
  { value: 'experienced', label: '경력' },
  { value: 'intern', label: '인턴' },
  { value: 'etc', label: '기타' },
];

const TECH_STACK_OPTIONS = ['Python', 'Django', 'Java', 'Spring', 'JavaScript', 'React', 'Node.js', 'MySQL', 'Docker', 'AWS'];

const INITIAL_FORM = {
  company_name: '',
  position: '',
  job_category: '',
  experience_level: '',
  tech_stacks: [],
  custom_tech_stacks: '',
  main_tasks: '',
  requirements: '',
  preferences: '',
  jd_text: '',
  custom_keywords: '',
};

const INITIAL_UPLOAD_FORM = {
  company_name: '',
  position: '',
  file: null,
};

function parseCommaSeparated(value) {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((v, i, arr) => arr.indexOf(v) === i);
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

function validateJdPdf(file) {
  if (!file) return '업로드할 PDF 파일을 선택해주세요.';
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext !== 'pdf') return 'JD 업로드는 PDF 파일만 가능합니다.';
  if (file.size > MAX_UPLOAD_SIZE) return '파일 크기는 10MB를 초과할 수 없습니다.';
  return null;
}

function JdInputPage() {
  const navigate = useNavigate();
  const { setJd } = useJdStore();
  const [activeMode, setActiveMode] = useState('manual');
  const [form, setForm] = useState(INITIAL_FORM);
  const [uploadForm, setUploadForm] = useState(INITIAL_UPLOAD_FORM);
  const [mockSearch, setMockSearch] = useState('');
  const [mockJobs, setMockJobs] = useState([]);
  const [selectedMockJob, setSelectedMockJob] = useState(null);
  const [mockLoading, setMockLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);

  const rememberJd = (data) => {
    const nextJdId = data?.jd_id ?? data?.id ?? null;
    if (!nextJdId) return;
    setJd(nextJdId, data);
    window.localStorage.setItem('careerzip_temp_jd_id', nextJdId);
    window.localStorage.setItem('careerzip_selected_jd_id', nextJdId);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleTechStackToggle = (stack) => {
    setForm((prev) => {
      const already = prev.tech_stacks.includes(stack);
      return {
        ...prev,
        tech_stacks: already ? prev.tech_stacks.filter((s) => s !== stack) : [...prev.tech_stacks, stack],
      };
    });
  };

  const validateManual = () => {
    if (!form.company_name.trim()) return '회사명을 입력해주세요.';
    if (!form.position.trim()) return '직무명을 입력해주세요.';
    if (!form.job_category) return '직무 카테고리를 선택해주세요.';
    if (!form.experience_level) return '경력 구분을 선택해주세요.';
    if (!form.main_tasks.trim() && !form.requirements.trim() && !form.jd_text.trim()) {
      return '주요업무, 자격요건, JD 원문 중 하나 이상 입력해주세요.';
    }
    return null;
  };

  const buildPayload = () => {
    const payload = {
      company_name: form.company_name.trim(),
      position: form.position.trim(),
      job_category: form.job_category,
      experience_level: form.experience_level,
      tech_stacks: form.tech_stacks,
      custom_tech_stacks: parseCommaSeparated(form.custom_tech_stacks),
      main_tasks: form.main_tasks.trim(),
      requirements: form.requirements.trim(),
      preferences: form.preferences.trim(),
      original_text: form.jd_text.trim(),
      custom_keywords: parseCommaSeparated(form.custom_keywords),
    };

    Object.keys(payload).forEach((key) => {
      const val = payload[key];
      if (val === '' || (Array.isArray(val) && val.length === 0)) delete payload[key];
    });

    return payload;
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessData(null);
    const validationError = validateManual();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const data = await jdApi.createJd(buildPayload());
      rememberJd(data);
      setSuccessData(data);
      navigate('/input/documents');
    } catch (err) {
      setError(formatApiError(err, 'JD 저장에 실패했습니다.'));
      if (err?.response?.status === 401) navigate('/auth/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchMockJobs = async () => {
    setMockLoading(true);
    setError('');
    try {
      const data = await jobsApi.searchJobs({ q: mockSearch, size: 8 });
      const results = Array.isArray(data?.results) ? data.results : [];
      setMockJobs(results);
      setSelectedMockJob((prev) => prev ?? results[0] ?? null);
    } catch (err) {
      setError(formatApiError(err, 'Mock 공고 목록을 불러오지 못했습니다.'));
      if (err?.response?.status === 401) navigate('/auth/login');
    } finally {
      setMockLoading(false);
    }
  };

  useEffect(() => {
    if (activeMode === 'mock' && mockJobs.length === 0) fetchMockJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMode]);

  const handleMockSave = async () => {
    setError('');
    setSuccessData(null);
    if (!selectedMockJob) {
      setError('저장할 Mock 채용공고를 선택해주세요.');
      return;
    }

    setLoading(true);
    try {
      const data = await jobsApi.saveJobAsJd(selectedMockJob);
      rememberJd(data);
      setSuccessData(data);
      navigate('/input/documents');
    } catch (err) {
      setError(formatApiError(err, 'Mock 공고 저장에 실패했습니다.'));
      if (err?.response?.status === 401) navigate('/auth/login');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessData(null);

    if (!uploadForm.company_name.trim()) {
      setError('회사명을 입력해주세요.');
      return;
    }
    if (!uploadForm.position.trim()) {
      setError('직무명을 입력해주세요.');
      return;
    }
    const fileError = validateJdPdf(uploadForm.file);
    if (fileError) {
      setError(fileError);
      return;
    }

    setLoading(true);
    try {
      const data = await jdApi.uploadJdPdf(uploadForm.file, {
        company_name: uploadForm.company_name.trim(),
        position: uploadForm.position.trim(),
      });
      rememberJd(data);
      setSuccessData(data);
      navigate('/input/documents');
    } catch (err) {
      setError(formatApiError(err, 'JD PDF 업로드에 실패했습니다.'));
      if (err?.response?.status === 401) navigate('/auth/login');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setForm(INITIAL_FORM);
    setUploadForm(INITIAL_UPLOAD_FORM);
    setSelectedMockJob(null);
    setError('');
    setSuccessData(null);
  };

  return (
    <PageShell
      eyebrow="Step 2"
      title="JD 입력"
      description="직접 입력, Mock 채용공고 저장, PDF 업로드 중 하나를 선택해 면접 질문의 기준이 될 JD를 저장합니다."
      steps={STEPS}
      currentStep={2}
    >
      <Card className="mx-auto max-w-4xl p-6">
        {successData ? (
          <div className="space-y-5">
            <Alert tone="success">
              JD가 저장되었습니다. {successData.company_name || ''} {successData.position || ''}
            </Alert>
            {(successData.jd_id ?? successData.id) && (
              <p className="text-sm text-[#000000]">
                JD ID: <span className="font-mono font-semibold text-[#253900]">{successData.jd_id ?? successData.id}</span>
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={() => navigate('/input/documents')}>
                저장하고 다음
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate('/interview/setup')}>
                면접 설정으로 이동
              </Button>
              <Button type="button" variant="ghost" onClick={handleReset}>
                다른 JD 등록
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2 rounded-lg border border-[rgba(0,0,0,0.12)] bg-[#EEEEEE] p-1">
              {INPUT_MODES.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => {
                    setActiveMode(mode.id);
                    setError('');
                  }}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    activeMode === mode.id ? 'bg-[#253900] text-[#EEEEEE]' : 'text-[#000000] hover:opacity-80'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            {activeMode === 'manual' && (
              <form onSubmit={handleManualSubmit} className="mt-6 space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="회사명" required>
                    <input name="company_name" type="text" className={inputClass} placeholder="예: 카카오" value={form.company_name} onChange={handleChange} />
                  </Field>
                  <Field label="직무명" required>
                    <input name="position" type="text" className={inputClass} placeholder="예: 백엔드 개발자" value={form.position} onChange={handleChange} />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="직무 카테고리" required>
                    <select name="job_category" className={inputClass} value={form.job_category} onChange={handleChange}>
                      <option value="">선택해주세요</option>
                      {JOB_CATEGORY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="경력 구분" required>
                    <select name="experience_level" className={inputClass} value={form.experience_level} onChange={handleChange}>
                      <option value="">선택해주세요</option>
                      {EXPERIENCE_LEVEL_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
                <div>
                  <p className="mb-2 text-sm font-black text-[#253900]">기술 스택</p>
                  <div className="flex flex-wrap gap-2">
                    {TECH_STACK_OPTIONS.map((stack) => {
                      const checked = form.tech_stacks.includes(stack);
                      return (
                        <button
                          key={stack}
                          type="button"
                          onClick={() => handleTechStackToggle(stack)}
                          className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                            checked ? 'border-[#253900] bg-[#08CB00] text-[#000000]' : 'border-[rgba(0,0,0,0.12)] bg-[#EEEEEE] text-[#000000] hover:opacity-80'
                          }`}
                        >
                          {stack}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <Field label="기타 기술 스택" hint="쉼표로 구분해 입력해주세요.">
                  <input name="custom_tech_stacks" type="text" className={inputClass} placeholder="DRF, Redis, FastAPI" value={form.custom_tech_stacks} onChange={handleChange} />
                </Field>
                <Field label="주요 업무">
                  <textarea name="main_tasks" rows={3} className={inputClass} placeholder="주요 업무를 입력해주세요." value={form.main_tasks} onChange={handleChange} />
                </Field>
                <Field label="자격 요건">
                  <textarea name="requirements" rows={3} className={inputClass} placeholder="자격 요건을 입력해주세요." value={form.requirements} onChange={handleChange} />
                </Field>
                <Field label="우대 사항">
                  <textarea name="preferences" rows={2} className={inputClass} placeholder="우대 사항을 입력해주세요." value={form.preferences} onChange={handleChange} />
                </Field>
                <Field label="JD 원문 또는 추가 설명" hint="주요 업무, 자격 요건, JD 원문 중 하나 이상은 필요합니다.">
                  <textarea name="jd_text" rows={4} className={inputClass} placeholder="JD 원문을 붙여넣어도 됩니다." value={form.jd_text} onChange={handleChange} />
                </Field>
                <Field label="직접 입력 키워드" hint="쉼표로 구분해 입력해주세요.">
                  <input name="custom_keywords" type="text" className={inputClass} placeholder="API, 인증, 배포" value={form.custom_keywords} onChange={handleChange} />
                </Field>
                {error && <Alert tone="danger">{error}</Alert>}
                <div className="flex flex-wrap justify-between gap-2">
                  <Button type="button" variant="secondary" onClick={() => navigate('/profile')} disabled={loading}>
                    이전
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? '저장 중...' : '저장하고 다음'}
                  </Button>
                </div>
              </form>
            )}

            {activeMode === 'mock' && (
              <div className="mt-6 space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="search"
                    className={inputClass}
                    placeholder="회사명, 직무, 기술 스택 검색"
                    value={mockSearch}
                    onChange={(e) => setMockSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') fetchMockJobs();
                    }}
                  />
                  <Button type="button" variant="secondary" onClick={fetchMockJobs} disabled={mockLoading}>
                    {mockLoading ? '검색 중...' : '검색'}
                  </Button>
                </div>
                {mockLoading ? (
                  <LoadingState title="Mock 공고를 불러오는 중입니다" description="" />
                ) : mockJobs.length === 0 ? (
                  <EmptyState title="표시할 Mock 공고가 없습니다" description="검색어를 바꾸거나 목록을 새로고침해주세요." actionLabel="다시 검색" onAction={fetchMockJobs} />
                ) : (
                  <div className="grid gap-2">
                    {mockJobs.map((job) => {
                      const id = job.job_id ?? job.id ?? `${job.company_name}-${job.position}`;
                      const selected = selectedMockJob === job;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setSelectedMockJob(job)}
                          className={`rounded-lg border p-4 text-left transition ${
                            selected ? 'border-[#253900] bg-[#08CB00] text-[#000000]' : 'border-[rgba(0,0,0,0.12)] bg-[#EEEEEE] text-[#000000] hover:opacity-80'
                          }`}
                        >
                          <p className="text-sm font-bold">
                            {job.company_name || '회사명 없음'} · {job.position || '직무명 없음'}
                          </p>
                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#000000]">
                            {job.job_description || job.requirements || '공고 요약이 없습니다.'}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
                {error && <Alert tone="danger">{error}</Alert>}
                <div className="flex flex-wrap justify-between gap-2">
                  <Button type="button" variant="secondary" onClick={() => navigate('/profile')} disabled={loading}>
                    이전
                  </Button>
                  <Button type="button" disabled={loading || !selectedMockJob} onClick={handleMockSave}>
                    {loading ? '저장 중...' : '선택 공고를 저장하고 다음'}
                  </Button>
                </div>
              </div>
            )}

            {activeMode === 'upload' && (
              <form onSubmit={handleUploadSubmit} className="mt-6 space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="회사명" required>
                    <input
                      type="text"
                      className={inputClass}
                      placeholder="예: 카카오"
                      value={uploadForm.company_name}
                      onChange={(e) => setUploadForm((prev) => ({ ...prev, company_name: e.target.value }))}
                    />
                  </Field>
                  <Field label="직무명" required>
                    <input
                      type="text"
                      className={inputClass}
                      placeholder="예: 백엔드 개발자"
                      value={uploadForm.position}
                      onChange={(e) => setUploadForm((prev) => ({ ...prev, position: e.target.value }))}
                    />
                  </Field>
                </div>
                <Field label="JD PDF 파일" hint="PDF만 가능하며 최대 10MB까지 업로드할 수 있습니다." required>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    className={inputClass}
                    onChange={(e) => setUploadForm((prev) => ({ ...prev, file: e.target.files?.[0] ?? null }))}
                  />
                </Field>
                {error && <Alert tone="danger">{error}</Alert>}
                <div className="flex flex-wrap justify-between gap-2">
                  <Button type="button" variant="secondary" onClick={() => navigate('/profile')} disabled={loading}>
                    이전
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? '업로드 중...' : 'PDF 업로드하고 다음'}
                  </Button>
                </div>
              </form>
            )}
          </>
        )}
      </Card>
    </PageShell>
  );
}

export default JdInputPage;
