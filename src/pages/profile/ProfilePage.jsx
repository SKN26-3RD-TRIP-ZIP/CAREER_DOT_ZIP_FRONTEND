import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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

function RadioGroup({ label, name, options, value, onChange }) {
  return (
    <div>
      <p className="text-sm font-semibold text-slate-800 mb-2">{label}</p>
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

  const handleNext = () => {
    localStorage.setItem('userProfile', JSON.stringify({
      careerType,
      majorType,
      jobRole,
      yearsExp: yearsExp || '0',
    }));
    navigate('/jd');
  };

  return (
    <main className="min-h-screen bg-[#EEEEEE] px-4 py-8">
      <div className="mx-auto max-w-xl">
        <div className="mb-6">
          <p className="text-xs font-semibold text-[#08CB00] uppercase tracking-wide mb-1">Step 1 / 4</p>
          <h1 className="text-2xl font-bold text-[#253900]">프로필 입력</h1>
          <p className="mt-1 text-sm text-slate-500">맞춤 면접을 위해 기본 정보를 입력해주세요.</p>
        </div>

        <div className="bg-white rounded-2xl shadow p-6 space-y-6">
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
            <label className="block text-sm font-semibold text-slate-800 mb-2">
              희망 직무
            </label>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:border-[#08CB00]"
              value={jobRole}
              onChange={(e) => setJobRole(e.target.value)}
            >
              {JOB_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-2">
              경력 연차
              <span className="ml-1 text-xs font-normal text-slate-400">(신입이면 0 또는 비워두세요)</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="30"
                className="w-24 rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:border-[#08CB00]"
                placeholder="0"
                value={yearsExp}
                onChange={(e) => setYearsExp(e.target.value)}
              />
              <span className="text-sm text-slate-500">년</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleNext}
            className="w-full rounded-lg bg-[#08CB00] py-3 text-sm font-semibold text-white hover:bg-[#06a800] transition-colors"
          >
            다음 — JD 등록
          </button>
        </div>
      </div>
    </main>
  );
}

export default ProfilePage;
