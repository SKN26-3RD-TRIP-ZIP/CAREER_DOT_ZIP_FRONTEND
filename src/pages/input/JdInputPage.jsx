import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { jdApi } from '../../api/jdApi';
import { jobsApi } from '../../api/jobsApi';
import { toUserMessage } from '../../api/errors';
import { useJdStore } from '../../store/jdStore';
import { getCreatedJdId } from '../../utils/talentProfile';
import { parseJdOriginalText } from '../../utils/jdOriginalText';
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

const INPUT_MODES = [
  { id: 'manual', label: '직접 입력' },
  { id: 'mock', label: '합성 공고 검색' },
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

function listText(value) {
  if (Array.isArray(value)) return value.filter(Boolean).join(', ');
  return value || '';
}

function parseKeywords(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.filter(Boolean);
  } catch {
    // 문자열 키워드는 아래 쉼표 파싱으로 처리한다.
  }
  return parseCommaSeparated(String(value));
}

function detailToForm(data) {
  const keywords = parseKeywords(data?.keywords);
  const parsed = parseJdOriginalText(data?.original_text);
  const parsedTechStacks = parseCommaSeparated(parsed.tech_stacks || '');
  const selectedTechStacks = parsedTechStacks.filter((stack) => TECH_STACK_OPTIONS.includes(stack));
  const customTechStacks = parsedTechStacks.filter((stack) => !TECH_STACK_OPTIONS.includes(stack));
  const reservedKeywords = new Set([
    parsed.job_category,
    parsed.experience_level,
    ...parsedTechStacks,
  ].filter(Boolean));
  return {
    ...INITIAL_FORM,
    company_name: data?.company_name || '',
    position: data?.position || '',
    job_category: data?.job_category || parsed.job_category || '',
    experience_level: data?.experience_level || parsed.experience_level || '',
    tech_stacks: selectedTechStacks,
    custom_tech_stacks: customTechStacks.join(', '),
    main_tasks: data?.main_tasks || parsed.main_tasks || '',
    requirements: data?.requirements || parsed.requirements || data?.job_requirements || '',
    preferences: data?.preferences || parsed.preferences || '',
    jd_text: data?.jd_text ?? parsed.jd_text ?? '',
    custom_keywords: keywords.filter((keyword) => !reservedKeywords.has(keyword)).join(', '),
  };
}

function formatApiError(err, fallback) {
  return toUserMessage(err, fallback);
}

function validateJdFile(file) {
  if (!file) return '업로드할 PDF 또는 DOCX 파일을 선택해 주세요.';
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!['pdf', 'docx'].includes(ext)) return 'PDF 또는 DOCX 파일만 업로드할 수 있습니다.';
  if (file.size > MAX_UPLOAD_SIZE) return '파일 크기는 10MB를 초과할 수 없습니다.';
  return null;
}

function JdInputPage() {
  const navigate = useNavigate();
  const { jdId: editingJdId } = useParams();
  const isEditMode = Boolean(editingJdId);
  const { setJd } = useJdStore();
  const [activeMode, setActiveMode] = useState('manual');
  const [form, setForm] = useState(INITIAL_FORM);
  const [uploadForm, setUploadForm] = useState(INITIAL_UPLOAD_FORM);
  const [mockSearch, setMockSearch] = useState('');
  const [mockJobs, setMockJobs] = useState([]);
  const [selectedMockJob, setSelectedMockJob] = useState(null);
  const [mockLoading, setMockLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);

  const rememberJd = (data) => {
    const nextJdId = getCreatedJdId(data);
    if (!nextJdId) return null;
    setJd(nextJdId, data);
    window.localStorage.setItem('careerzip_temp_jd_id', nextJdId);
    window.localStorage.setItem('careerzip_selected_jd_id', nextJdId);
    return nextJdId;
  };

  const goTalentProfile = (data) => {
    const nextJdId = rememberJd(data);
    if (!nextJdId) {
      setError('JD 저장은 완료됐지만 응답에서 JD ID를 찾을 수 없습니다. 새로고침 후 다시 시도해주세요.');
      return;
    }
    navigate(`/input/jd/${nextJdId}/talent-profile`);
  };

  useEffect(() => {
    if (!isEditMode) return;

    let alive = true;
    const loadJdDetail = async () => {
      setInitialLoading(true);
      setError('');
      try {
        const data = await jdApi.getJdDetail(editingJdId);
        if (!alive) return;
        setForm(detailToForm(data));
      } catch (err) {
        if (!alive) return;
        setError(formatApiError(err, 'JD 정보를 불러오지 못했습니다.'));
        if (err?.response?.status === 401) navigate('/auth/login');
      } finally {
        if (alive) setInitialLoading(false);
      }
    };

    loadJdDetail();
    return () => {
      alive = false;
    };
  }, [editingJdId, isEditMode, navigate]);

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
      jd_text: form.jd_text.trim(),
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
      const data = isEditMode
        ? await jdApi.updateJd(editingJdId, buildPayload())
        : await jdApi.createJd(buildPayload());
      setSuccessData(data);
      if (isEditMode) {
        rememberJd(data);
        navigate('/input/jd');
      } else {
        goTalentProfile(data);
      }
    } catch (err) {
      setError(formatApiError(err, isEditMode ? 'JD 수정에 실패했습니다.' : 'JD 저장에 실패했습니다.'));
      if (err?.response?.status === 401) navigate('/auth/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchMockJobs = async () => {
    setMockLoading(true);
    setError('');
    try {
      const data = await jobsApi.searchJobs({ keyword: mockSearch, size: 8 });
      const results = Array.isArray(data?.results) ? data.results : [];
      setMockJobs(results);
      setSelectedMockJob((prev) => prev ?? results[0] ?? null);
    } catch (err) {
      setError(formatApiError(err, '합성 공고 목록을 불러오지 못했습니다.'));
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
      setError('저장할 합성 채용공고를 선택해주세요.');
      return;
    }

    setLoading(true);
    try {
      const data = await jobsApi.saveJobAsJd(selectedMockJob);
      setSuccessData(data);
      goTalentProfile(data);
    } catch (err) {
      setError(formatApiError(err, '합성 공고 저장에 실패했습니다.'));
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
    const fileError = validateJdFile(uploadForm.file);
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
      setSuccessData(data);
      goTalentProfile(data);
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

  if (initialLoading) {
    return (
      <PageShell
        title="JD 수정"
        description="기존 JD 정보를 불러오고 있습니다."
        maxWidth="max-w-[1220px]"
      >
        <LoadingState title="JD 정보를 불러오는 중입니다" description="저장된 채용공고 내용을 확인하고 있습니다." />
      </PageShell>
    );
  }

  return (
    <PageShell
      title={isEditMode ? 'JD 수정' : 'JD 입력'}
      description={isEditMode ? '저장된 JD 내용을 수정합니다.' : '직접 입력, 개발·연습용 합성 공고 검색, PDF 업로드 중 하나를 선택해 면접 질문의 기준이 될 JD를 저장합니다.'}
      actions={!isEditMode && <Button type="button" variant="secondary" onClick={() => navigate('/input/jd-import')}>URL·이미지로 가져오기</Button>}
    >
      <Card className="mx-auto max-w-4xl p-6">
        {successData ? (
          <div className="space-y-5">
            <Alert tone="success">
              JD가 저장되었습니다. {successData.company_name || ''} {successData.position || ''}
            </Alert>
            {getCreatedJdId(successData) && (
              <p className="text-sm text-[#000000]">
                JD ID: <span className="font-mono font-semibold text-[#253900]">{getCreatedJdId(successData)}</span>
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={() => goTalentProfile(successData)}>
                인재상 설정으로
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate('/input')}>
                자료입력으로 이동
              </Button>
              <Button type="button" variant="ghost" onClick={handleReset}>
                다른 JD 등록
              </Button>
            </div>
          </div>
        ) : (
          <>
            {!isEditMode && (
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
            )}

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
                  <Button type="button" variant="secondary" onClick={() => navigate('/input/jd')} disabled={loading}>
                    이전
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? '저장 중...' : isEditMode ? '수정 완료' : '저장하고 인재상 설정으로'}
                  </Button>
                </div>
              </form>
            )}

            {activeMode === 'mock' && (
              <div className="mt-6 space-y-4">
                <Alert tone="info">
                  이 목록은 Career.zip 개발·연습용 합성 공고입니다. 실제 사람인 또는 실제 기업 공고가 아닙니다.
                </Alert>
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
                  <LoadingState title="합성 공고를 불러오는 중입니다" description="" />
                ) : mockJobs.length === 0 ? (
                  <EmptyState title="표시할 합성 공고가 없습니다" description="검색어를 바꾸거나 목록을 새로고침해주세요." actionLabel="다시 검색" onAction={fetchMockJobs} />
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
                            {job.is_mock && <span className="ml-2 rounded-full bg-[#253900] px-2 py-0.5 text-[11px] text-[#EEEEEE]">합성</span>}
                          </p>
                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#000000]">
                            {job.job_description || listText(job.requirements) || '공고 요약이 없습니다.'}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
                {error && <Alert tone="danger">{error}</Alert>}
                <div className="flex flex-wrap justify-between gap-2">
                  <Button type="button" variant="secondary" onClick={() => navigate('/input/jd')} disabled={loading}>
                    이전
                  </Button>
                  <Button type="button" disabled={loading || !selectedMockJob} onClick={handleMockSave}>
                    {loading ? '저장 중...' : '선택한 합성 공고를 저장하고 인재상 설정으로'}
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
                <Field label="JD 파일" hint="PDF 또는 DOCX 파일만 가능하며 최대 10MB까지 업로드할 수 있습니다." required>
                  <input
                    type="file"
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className={inputClass}
                    onChange={(e) => setUploadForm((prev) => ({ ...prev, file: e.target.files?.[0] ?? null }))}
                  />
                </Field>
                {error && <Alert tone="danger">{error}</Alert>}
                <div className="flex flex-wrap justify-between gap-2">
                  <Button type="button" variant="secondary" onClick={() => navigate('/input/jd')} disabled={loading}>
                    이전
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? '업로드 중...' : 'PDF 업로드하고 인재상 설정으로'}
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
