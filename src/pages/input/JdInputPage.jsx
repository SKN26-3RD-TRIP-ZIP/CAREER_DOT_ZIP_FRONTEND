import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jdApi } from '../../api/jdApi';
import { useJdStore } from '../../store/jdStore';

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

const TECH_STACK_OPTIONS = [
  'Python', 'Django', 'Java', 'Spring',
  'JavaScript', 'React', 'Node.js', 'MySQL', 'Docker', 'AWS',
];

function parseCommaSeparated(value) {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((v, i, arr) => arr.indexOf(v) === i);
}

function RequiredMark() {
  return <span className="ml-1 text-red-500">*</span>;
}

function FieldLabel({ htmlFor, children, required }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-semibold text-slate-800">
      {children}
      {required && <RequiredMark />}
    </label>
  );
}

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

function JdInputPage() {
  const navigate = useNavigate();
  const { setJd } = useJdStore();

  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleTechStackToggle = (stack) => {
    setForm((prev) => {
      const already = prev.tech_stacks.includes(stack);
      return {
        ...prev,
        tech_stacks: already
          ? prev.tech_stacks.filter((s) => s !== stack)
          : [...prev.tech_stacks, stack],
      };
    });
  };

  const validate = () => {
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
      if (val === '' || (Array.isArray(val) && val.length === 0)) {
        delete payload[key];
      }
    });

    return payload;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessData(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const payload = buildPayload();
      const data = await jdApi.createJd(payload);
      const jdId = data?.jd_id ?? data?.id ?? null;
      setJd(jdId, data);
      setSuccessData(data);
    } catch (err) {
      const status = err?.response?.status;
      if (!err?.response) {
        setError('백엔드 서버에 연결할 수 없습니다. runserver가 켜져 있는지 확인해주세요.');
      } else if (status === 401) {
        setError('인증에 실패했습니다. access token을 다시 저장해주세요.');
      } else if (status === 400) {
        const detail = err?.response?.data;
        setError(`입력값 오류: ${JSON.stringify(detail)}`);
      } else {
        setError(`JD 저장에 실패했습니다. (HTTP ${status})`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setForm(INITIAL_FORM);
    setError('');
    setSuccessData(null);
  };

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-8 text-slate-900">
      <section className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow">
        <h1 className="text-2xl font-bold">JD 입력</h1>
        <p className="mt-1 text-sm text-slate-500">
          지원할 직무의 JD 정보를 입력하면 맞춤 면접 질문이 생성됩니다.
        </p>

        {successData ? (
          <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-6">
            <p className="text-lg font-bold text-green-900">JD가 저장되었습니다</p>
            {(successData.jd_id ?? successData.id) && (
              <p className="mt-2 text-sm text-green-700">
                JD ID: <span className="font-mono font-semibold">{successData.jd_id ?? successData.id}</span>
              </p>
            )}
            <p className="mt-2 text-sm text-green-700">
              {successData.company_name && `${successData.company_name} · `}
              {successData.position}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white"
                onClick={() => navigate('/input/documents')}
              >
                지원 자료 입력으로 이동
              </button>
              <button
                type="button"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
                onClick={handleReset}
              >
                새 JD 입력
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {/* 회사명 + 직무명 */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel htmlFor="company_name" required>회사명</FieldLabel>
                <input
                  id="company_name"
                  name="company_name"
                  type="text"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="회사명을 입력하세요"
                  value={form.company_name}
                  onChange={handleChange}
                />
              </div>
              <div>
                <FieldLabel htmlFor="position" required>직무명</FieldLabel>
                <input
                  id="position"
                  name="position"
                  type="text"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="지원 직무를 입력하세요"
                  value={form.position}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* 직무 카테고리 */}
            <div>
              <FieldLabel htmlFor="job_category" required>직무 카테고리</FieldLabel>
              <select
                id="job_category"
                name="job_category"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={form.job_category}
                onChange={handleChange}
              >
                <option value="">선택해주세요</option>
                {JOB_CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* 경력 구분 */}
            <div>
              <FieldLabel htmlFor="experience_level" required>경력 구분</FieldLabel>
              <select
                id="experience_level"
                name="experience_level"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={form.experience_level}
                onChange={handleChange}
              >
                <option value="">선택해주세요</option>
                {EXPERIENCE_LEVEL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* 기술스택 */}
            <div>
              <FieldLabel>기술스택</FieldLabel>
              <div className="mt-2 flex flex-wrap gap-2">
                {TECH_STACK_OPTIONS.map((stack) => {
                  const checked = form.tech_stacks.includes(stack);
                  return (
                    <button
                      key={stack}
                      type="button"
                      onClick={() => handleTechStackToggle(stack)}
                      className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                        checked
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-300 bg-white text-slate-700 hover:border-slate-500'
                      }`}
                    >
                      {stack}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 기타 기술스택 직접입력 */}
            <div>
              <FieldLabel htmlFor="custom_tech_stacks">기타 기술스택 직접입력</FieldLabel>
              <input
                id="custom_tech_stacks"
                name="custom_tech_stacks"
                type="text"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="DRF, Redis, FastAPI (쉼표로 구분)"
                value={form.custom_tech_stacks}
                onChange={handleChange}
              />
              {form.custom_tech_stacks && (
                <p className="mt-1 text-xs text-slate-400">
                  → {JSON.stringify(parseCommaSeparated(form.custom_tech_stacks))}
                </p>
              )}
            </div>

            {/* 주요업무 */}
            <div>
              <FieldLabel htmlFor="main_tasks">주요업무</FieldLabel>
              <textarea
                id="main_tasks"
                name="main_tasks"
                rows={3}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="주요업무를 입력하세요"
                value={form.main_tasks}
                onChange={handleChange}
              />
            </div>

            {/* 자격요건 */}
            <div>
              <FieldLabel htmlFor="requirements">자격요건</FieldLabel>
              <textarea
                id="requirements"
                name="requirements"
                rows={3}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="자격요건을 입력하세요"
                value={form.requirements}
                onChange={handleChange}
              />
            </div>

            {/* 우대사항 */}
            <div>
              <FieldLabel htmlFor="preferences">우대사항</FieldLabel>
              <textarea
                id="preferences"
                name="preferences"
                rows={2}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="우대사항을 입력하세요"
                value={form.preferences}
                onChange={handleChange}
              />
            </div>

            {/* JD 원문 또는 추가 설명 */}
            <div>
              <FieldLabel htmlFor="jd_text">JD 원문 또는 추가 설명</FieldLabel>
              <textarea
                id="jd_text"
                name="jd_text"
                rows={4}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="JD 원문이나 추가 설명을 자유롭게 입력하세요"
                value={form.jd_text}
                onChange={handleChange}
              />
            </div>

            {/* 직접입력 키워드 */}
            <div>
              <FieldLabel htmlFor="custom_keywords">직접입력 키워드</FieldLabel>
              <input
                id="custom_keywords"
                name="custom_keywords"
                type="text"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="API, 인증, 배포 (쉼표로 구분)"
                value={form.custom_keywords}
                onChange={handleChange}
              />
              {form.custom_keywords && (
                <p className="mt-1 text-xs text-slate-400">
                  → {JSON.stringify(parseCommaSeparated(form.custom_keywords))}
                </p>
              )}
            </div>

            {/* 에러 */}
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* 필수 안내 */}
            <p className="text-xs text-slate-400">
              <RequiredMark /> 표시 항목과 주요업무·자격요건·JD 원문 중 하나 이상은 필수입니다.
            </p>

            {/* 버튼 */}
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white disabled:bg-slate-400"
              >
                {loading ? '저장 중...' : 'JD 저장'}
              </button>
              <button
                type="button"
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm"
                onClick={handleReset}
                disabled={loading}
              >
                초기화
              </button>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}

export default JdInputPage;
