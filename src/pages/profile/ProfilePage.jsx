import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileApi } from '../../api/profileApi';

const JOB_OPTIONS = [
  { value: 'backend', label: '백엔드 개발자' },
  { value: 'frontend', label: '프론트엔드 개발자' },
  { value: 'fullstack', label: '풀스택 개발자' },
  { value: 'data', label: '데이터 엔지니어' },
  { value: 'ai_ml', label: 'AI/ML 엔지니어' },
  { value: 'devops', label: 'DevOps 엔지니어' },
  { value: 'pm', label: 'PM/기획자' },
  { value: 'etc', label: '기타' },
];

function formatApiError(err, fallback) {
  const status = err?.response?.status;
  const data = err?.response?.data;
  if (!err?.response) return '백엔드 서버에 연결할 수 없습니다.';
  if (status === 401) return '로그인이 필요합니다.';
  if (data?.detail) return data.detail;
  if (data?.error) return typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
  return `${fallback} (HTTP ${status})`;
}

function RadioGroup({ label, name, options, value, onChange }) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-slate-800">{label}</p>
      <div className="flex gap-3">
        {options.map((opt) => (
          <label
            key={opt.value}
            className={`flex-1 cursor-pointer rounded-xl border px-4 py-3 text-center text-sm font-medium transition-colors ${
              value === opt.value
                ? 'border-[#08CB00] bg-[#08CB00] text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:border-[#08CB00]'
            }`}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={(e) => onChange(e.target.value)}
              className="sr-only"
            />
            {opt.label}
          </label>
        ))}
      </div>
    </div>
  );
}

function ProfilePage() {
  const navigate = useNavigate();
  const [careerType, setCareerType] = useState('new');
  const [majorType, setMajorType] = useState('major');
  const [jobRole, setJobRole] = useState('backend');
  const [yearsExp, setYearsExp] = useState('');
  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!localStorage.getItem('access_token')) {
      navigate('/auth/login');
      return;
    }

    let active = true;
    profileApi
      .getMyProfile()
      .then((profile) => {
        if (!active) return;
        setHasProfile(true);
        setCareerType(profile.career_type || 'new');
        setMajorType(profile.major_type || 'major');
        setJobRole(profile.desired_job || 'backend');
        setYearsExp(String(profile.career_year ?? ''));
      })
      .catch((err) => {
        if (!active) return;
        if (err?.response?.status === 404) {
          setHasProfile(false);
          return;
        }
        if (err?.response?.status === 401) {
          navigate('/auth/login');
          return;
        }
        setError(formatApiError(err, '프로필을 불러오지 못했습니다.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [navigate]);

  const persistLocalProfile = (careerYear) => {
    localStorage.setItem(
      'userProfile',
      JSON.stringify({
        careerType,
        majorType,
        jobRole,
        yearsExp: String(careerYear),
      })
    );
  };

  const handleNext = async () => {
    setError('');
    const careerYear = Number.parseInt(yearsExp || '0', 10);
    if (Number.isNaN(careerYear) || careerYear < 0 || careerYear > 30) {
      setError('경력 연차는 0부터 30 사이로 입력해주세요.');
      return;
    }

    const payload = {
      career_type: careerType,
      major_type: majorType,
      desired_job: jobRole,
      career_year: careerYear,
    };

    setSaving(true);
    try {
      if (hasProfile) {
        await profileApi.updateMyProfile(payload);
      } else {
        try {
          await profileApi.createMyProfile(payload);
        } catch (err) {
          if (err?.response?.status !== 409) throw err;
          await profileApi.updateMyProfile(payload);
        }
      }
      persistLocalProfile(careerYear);
      navigate('/jd');
    } catch (err) {
      const message = formatApiError(err, '프로필 저장에 실패했습니다.');
      setError(message);
      if (err?.response?.status === 401) navigate('/auth/login');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#EEEEEE] px-4 py-8">
      <div className="mx-auto max-w-xl">
        <div className="mb-6">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#08CB00]">Step 1 / 4</p>
          <h1 className="text-2xl font-bold text-[#253900]">프로필 입력</h1>
          <p className="mt-1 text-sm text-slate-500">맞춤 면접을 위해 기본 정보를 입력해주세요.</p>
        </div>

        <div className="space-y-6 rounded-2xl bg-white p-6 shadow">
          {loading ? (
            <p className="text-sm text-slate-500">프로필을 불러오는 중입니다.</p>
          ) : (
            <>
              <RadioGroup
                label="경력 구분"
                name="careerType"
                options={[
                  { value: 'new', label: '신입' },
                  { value: 'career', label: '경력' },
                ]}
                value={careerType}
                onChange={setCareerType}
              />

              <RadioGroup
                label="전공 여부"
                name="majorType"
                options={[
                  { value: 'major', label: '전공자' },
                  { value: 'non_major', label: '비전공자' },
                ]}
                value={majorType}
                onChange={setMajorType}
              />

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800" htmlFor="desired_job">
                  희망 직무
                </label>
                <select
                  id="desired_job"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-[#08CB00] focus:outline-none"
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value)}
                >
                  {JOB_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800" htmlFor="career_year">
                  경력 연차
                  <span className="ml-1 text-xs font-normal text-slate-400">신입이면 0 또는 비워두세요.</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="career_year"
                    type="number"
                    min="0"
                    max="30"
                    className="w-24 rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-[#08CB00] focus:outline-none"
                    placeholder="0"
                    value={yearsExp}
                    onChange={(e) => setYearsExp(e.target.value)}
                  />
                  <span className="text-sm text-slate-500">년</span>
                </div>
              </div>

              {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

              <button
                type="button"
                onClick={handleNext}
                disabled={saving}
                className="w-full rounded-lg bg-[#08CB00] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#06a800] disabled:opacity-50"
              >
                {saving ? '저장 중...' : '다음 단계: JD 등록'}
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

export default ProfilePage;
