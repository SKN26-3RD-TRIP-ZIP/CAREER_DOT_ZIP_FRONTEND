import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileApi } from '../../api/profileApi';
import {
  Alert,
  Button,
  Card,
  Field,
  LoadingState,
  PageShell,
  inputClass,
} from '../../components/ui/DemoLayout';

const STEPS = ['프로필', 'JD 입력', '이력서', '자소서·프로젝트', '면접 설정'];

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
  if (!err?.response) return '서버에 연결할 수 없습니다. 백엔드 실행 상태를 확인해주세요.';
  if (status === 401) return '로그인이 필요합니다. 다시 로그인해주세요.';
  if (data?.detail) return data.detail;
  if (data?.error) return typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
  return `${fallback} (HTTP ${status})`;
}

function safeJsonParse(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function ChoiceGroup({ label, name, options, value, onChange }) {
  return (
    <div>
      <p className="mb-2 text-sm font-black text-[#253900]">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt) => (
          <label
            key={opt.value}
            className={`cursor-pointer rounded-lg border px-4 py-3 text-center text-sm font-bold transition ${
              value === opt.value
                ? 'border-[#08CB00] bg-[#08CB00] text-[#EEEEEE]'
                : 'border-[rgba(0,0,0,0.18)] bg-[#EEEEEE] text-[#000000] hover:border-[#253900]'
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
  const localProfile = safeJsonParse(localStorage.getItem('userProfile')) || {};
  const [displayName, setDisplayName] = useState(localProfile.name || '');
  const [careerType, setCareerType] = useState('new');
  const [majorType, setMajorType] = useState('major');
  const [jobRole, setJobRole] = useState('backend');
  const [interests, setInterests] = useState(localProfile.interests || 'Java, Spring Boot, MySQL');
  const [yearsExp, setYearsExp] = useState('');
  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
        setDisplayName((prev) => prev || profile.name || localProfile.name || '');
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
        name: displayName,
        careerType,
        majorType,
        jobRole,
        interests,
        yearsExp: String(careerYear),
      }),
    );
  };

  const handleNext = async () => {
    setError('');
    setSuccess('');
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
      setSuccess('프로필이 저장되었습니다.');
      navigate('/jd');
    } catch (err) {
      setError(formatApiError(err, '프로필 저장에 실패했습니다.'));
      if (err?.response?.status === 401) navigate('/auth/login');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell
      eyebrow="Step 1"
      title="프로필 입력"
      description="경력, 전공 여부, 희망 직무를 저장하면 JD와 이력서 기반 면접 준비가 더 정확해집니다."
      steps={STEPS}
      currentStep={1}
    >
      <Card className="mx-auto max-w-3xl p-8">
        {loading ? (
          <LoadingState title="프로필을 불러오는 중입니다" />
        ) : (
          <div className="space-y-6">
            <Field label="이름">
              <input
                type="text"
                className={inputClass}
                placeholder="이름을 입력하세요"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </Field>
            <Field label="희망 직무" required>
              <select className={inputClass} value={jobRole} onChange={(e) => setJobRole(e.target.value)}>
                {JOB_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </Field>
            <ChoiceGroup
              label="경력 구분"
              name="careerType"
              options={[
                { value: 'new', label: '신입' },
                { value: 'career', label: '경력' },
              ]}
              value={careerType}
              onChange={setCareerType}
            />
            <ChoiceGroup
              label="전공 여부"
              name="majorType"
              options={[
                { value: 'major', label: '전공자' },
                { value: 'non_major', label: '비전공자' },
              ]}
              value={majorType}
              onChange={setMajorType}
            />
            <Field label="경력 연차" hint="신입이면 0을 입력해주세요.">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="30"
                  className={`${inputClass} w-32`}
                  placeholder="0"
                  value={yearsExp}
                  onChange={(e) => setYearsExp(e.target.value)}
                />
                <span className="text-sm font-bold text-[#000000]">년</span>
              </div>
            </Field>
            <Field label="관심 분야 · 기술스택" hint="쉼표로 구분해 입력하면 마이페이지와 추천 질문 문맥에 활용됩니다.">
              <input
                type="text"
                className={inputClass}
                placeholder="Java, Spring Boot, MySQL"
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
              />
            </Field>
            {error && <Alert tone="danger">{error}</Alert>}
            {success && <Alert tone="success">{success}</Alert>}
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={() => navigate('/mypage')}>
                마이페이지로 이동
              </Button>
              <Button type="button" onClick={handleNext} disabled={saving}>
                {saving ? '저장 중...' : '저장하고 다음'}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </PageShell>
  );
}

export default ProfilePage;
