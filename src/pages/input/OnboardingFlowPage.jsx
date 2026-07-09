import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, FileText, UploadCloud, UserRound } from 'lucide-react';
import { completeOnboarding, getMe } from '../../api/authApi';
import { coverLetterApi } from '../../api/coverLetterApi';
import { jdApi } from '../../api/jdApi';
import { profileApi } from '../../api/profileApi';
import { projectApi } from '../../api/projectApi';
import { resumeApi } from '../../api/resumeApi';
import { getTalentProfileCatalog, saveJdTalentProfile } from '../../api/talentProfileApi';
import { BrandLogo } from '../../components/layout/BrandLogo';
import {
  MAX_SELECTED_TRAITS,
  addTraitSelection,
  buildTalentProfilePayload,
  isTraitSelected,
  removeTraitSelection,
} from '../../components/talent-profile/talentProfileSelection';
import { useAuthStore } from '../../store/authStore';
import { resolveAuthedRedirect } from '../../utils/authNavigation';
import { normalizeTalentProfileCatalog } from '../../utils/talentProfile';

const STEPS = ['사용자 유형', '기본 프로필', 'JD 입력', '인재상', '자료 추가', '입력 요약'];

const USER_TYPES = [
  {
    id: 'non_major_new',
    title: '비전공 신입',
    career_type: 'new',
    major_type: 'non_major',
    description: 'CS 기초와 직무 맞춤 질문을 중심으로 준비합니다.',
  },
  {
    id: 'major_new',
    title: '전공 신입',
    career_type: 'new',
    major_type: 'major',
    description: '전공 지식과 프로젝트 경험을 함께 점검합니다.',
  },
  {
    id: 'non_major_career',
    title: '비전공 경력직',
    career_type: 'career',
    major_type: 'non_major',
    description: '실무 경험과 전환 배경을 중심으로 준비합니다.',
  },
  {
    id: 'career_change',
    title: '직무 전환자',
    career_type: 'career',
    major_type: 'major',
    description: '이전 경험을 지원 직무와 연결하는 연습을 합니다.',
  },
];

const initialForm = {
  userType: 'non_major_new',
  desired_job: '백엔드 개발자',
  career_year: '0',
  tech_stacks: 'Java, Spring Boot, MySQL',
  github_url: '',
  company_name: '',
  position: '백엔드 개발자',
  job_category: 'backend',
  experience_level: 'new',
  jd_text: '',
  jd_main_tasks: '',
  jd_requirements: '',
  jd_preferences: '',
  jd_custom_keywords: '',
  jd_custom_tech_stacks: '',
  resume_title: '',
  resume_file: null,
  cover_letter: '',
  project_name: '',
  project_description: '',
  project_contribution: '',
  project_tech_stack: '',
  project_github_url: '',
};

const inputClass =
  'h-12 w-full rounded-lg border border-[#cfd8df] bg-white px-4 text-sm font-bold outline-none transition focus:border-[#08CB00] focus:ring-2 focus:ring-[#08CB00]/20';

const textareaClass =
  'min-h-28 w-full rounded-lg border border-[#cfd8df] bg-white px-4 py-3 text-sm font-bold outline-none transition focus:border-[#08CB00] focus:ring-2 focus:ring-[#08CB00]/20';

function clampStep(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 1;
  return Math.min(STEPS.length, Math.max(1, parsed));
}

function splitList(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function getLocalValue(key, fallback = '') {
  try {
    return window.localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

function setLocalValue(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // localStorage가 막힌 환경에서도 온보딩 저장 자체는 진행한다.
  }
}

function selectedUserType(form) {
  return USER_TYPES.find((item) => item.id === form.userType) || USER_TYPES[0];
}

function extractId(payload, keys) {
  for (const key of keys) {
    if (payload?.[key]) return payload[key];
  }
  return '';
}

function Field({ label, children, required = false, hint }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-[#253900]">
        {label}
        {required ? <span className="ml-1 text-[#08CB00]">*</span> : null}
      </span>
      {children}
      {hint ? <span className="mt-1 block text-xs font-bold text-[rgba(0,0,0,0.55)]">{hint}</span> : null}
    </label>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-4 border-b border-[#e5e8eb] py-3 last:border-b-0">
      <dt className="font-black text-[#253900]">{label}</dt>
      <dd className="font-bold text-[rgba(0,0,0,0.7)]">{value || '입력 안 함'}</dd>
    </div>
  );
}

function selectedTalentSummary(selectedItems) {
  if (!selectedItems.length) return '';
  return selectedItems.map((item) => item.trait_name).join(', ');
}

function OnboardingHeader({ current }) {
  return (
    <header className="sticky top-0 z-20 border-b border-[#e5e8eb] bg-white">
      <div className="mx-auto flex min-h-[72px] max-w-[1440px] items-center gap-8 px-6 md:px-10">
        <div className="shrink-0">
          <BrandLogo disabled />
        </div>
        <nav className="flex min-w-0 flex-1 items-center justify-center gap-2 overflow-x-auto py-2" aria-label="온보딩 진행 단계">
          {STEPS.map((step, index) => {
            const stepNo = index + 1;
            const active = current === stepNo;
            return (
              <div key={step} className="flex shrink-0 items-center gap-2">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black ${
                    active ? 'bg-[#08CB00] text-white' : 'bg-[#f2f5f7] text-[#7b8791]'
                  }`}
                >
                  {stepNo}
                </span>
                <span className={`whitespace-nowrap text-xs font-black ${active ? 'text-[#009900]' : 'text-[#7b8791]'}`}>
                  {step}
                </span>
                {index < STEPS.length - 1 ? <span className="h-px w-8 bg-[#dfe5ea] lg:w-16" /> : null}
              </div>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

export default function OnboardingFlowPage() {
  const navigate = useNavigate();
  const { step } = useParams();
  const setUser = useAuthStore((state) => state.setUser);
  const current = clampStep(step);
  const [form, setForm] = useState(initialForm);
  const [profileExists, setProfileExists] = useState(false);
  const [saved, setSaved] = useState({
    jdId: '',
    resumeId: '',
    coverLetterId: '',
    projectId: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [talentCatalog, setTalentCatalog] = useState([]);
  const [talentLoading, setTalentLoading] = useState(false);
  const [talentError, setTalentError] = useState('');
  const [activeTalentCategoryCode, setActiveTalentCategoryCode] = useState('');
  const [selectedTalentItems, setSelectedTalentItems] = useState([]);
  const [talentSummary, setTalentSummary] = useState('');
  const userType = useMemo(() => selectedUserType(form), [form]);
  const activeTalentCategory = useMemo(
    () => talentCatalog.find((category) => category.category_code === activeTalentCategoryCode) || talentCatalog[0] || null,
    [activeTalentCategoryCode, talentCatalog],
  );

  useEffect(() => {
    if (String(current) !== String(step)) {
      navigate(`/input/onboarding/${current}`, { replace: true });
    }
  }, [current, navigate, step]);

  useEffect(() => {
    let alive = true;
    async function loadProfile() {
      try {
        const profile = await profileApi.getMyProfile();
        if (!alive) return;
        setProfileExists(true);
        setForm((prev) => ({
          ...prev,
          desired_job: profile?.desired_job || prev.desired_job,
          career_year: String(profile?.career_year ?? prev.career_year),
          github_url: profile?.github_url || prev.github_url,
          userType:
            USER_TYPES.find((item) => item.career_type === profile?.career_type && item.major_type === profile?.major_type)?.id ||
            prev.userType,
        }));
      } catch {
        if (alive) setProfileExists(false);
      }
    }
    loadProfile();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (current !== 4 || talentCatalog.length || talentLoading) return undefined;
    let alive = true;
    async function loadTalentCatalog() {
      setTalentLoading(true);
      setTalentError('');
      try {
        const data = await getTalentProfileCatalog();
        if (!alive) return;
        const normalized = normalizeTalentProfileCatalog(data);
        setTalentCatalog(normalized);
        setActiveTalentCategoryCode((prev) => prev || normalized[0]?.category_code || '');
      } catch {
        if (alive) setTalentError('인재상 목록을 불러오지 못했습니다. 인재상 선택 없이도 온보딩을 완료할 수 있습니다.');
      } finally {
        if (alive) setTalentLoading(false);
      }
    }
    loadTalentCatalog();
    return () => {
      alive = false;
    };
  }, [current, talentCatalog.length]);

  const update = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleTalentTrait = (trait) => {
    setSelectedTalentItems((prev) => (
      isTraitSelected(prev, trait.trait_code)
        ? removeTraitSelection(prev, trait.trait_code)
        : addTraitSelection(prev, trait)
    ));
  };

  const saveProfile = async () => {
    const selected = selectedUserType(form);
    const payload = {
      career_type: selected.career_type,
      major_type: selected.major_type,
      desired_job: form.desired_job.trim() || '백엔드 개발자',
      career_year: Number(form.career_year || 0),
      github_url: form.github_url.trim(),
    };
    if (profileExists) {
      await profileApi.updateMyProfile(payload);
    } else {
      await profileApi.createMyProfile(payload);
      setProfileExists(true);
    }
  };

  const saveJd = async () => {
    if (saved.jdId) return saved.jdId;
    const hasJdContent = [
      form.jd_text,
      form.jd_main_tasks,
      form.jd_requirements,
      form.jd_preferences,
    ].some((value) => value.trim());
    if (!form.company_name.trim() || !form.position.trim() || !hasJdContent) {
      throw new Error('JD 입력 단계에서 회사명, 직무명, 주요 업무 또는 자격 요건을 입력해주세요.');
    }
    const jd = await jdApi.createJd({
      company_name: form.company_name.trim(),
      position: form.position.trim(),
      job_category: form.job_category,
      experience_level: form.experience_level,
      tech_stacks: splitList(form.tech_stacks),
      custom_tech_stacks: splitList(form.jd_custom_tech_stacks),
      original_text: form.jd_text.trim(),
      main_tasks: form.jd_main_tasks.trim() || form.jd_text.trim(),
      requirements: form.jd_requirements.trim(),
      preferences: form.jd_preferences.trim(),
      custom_keywords: splitList(form.jd_custom_keywords),
    });
    const jdId = extractId(jd, ['jd_id', 'id']);
    if (jdId) {
      setSaved((prev) => ({ ...prev, jdId }));
      setLocalValue('careerzip_selected_jd_id', jdId);
    }
    return jdId;
  };

  const saveTalentProfile = async (jdId) => {
    if (!jdId || !selectedTalentItems.length) return;
    const payload = buildTalentProfilePayload({
      customSummary: talentSummary.trim(),
      confirmedByUser: true,
      selectedItems: selectedTalentItems,
    });
    await saveJdTalentProfile(jdId, payload);
  };

  const saveOptionalMaterials = async (savedOverride = saved) => {
    const nextSaved = {};

    if (form.resume_file && !savedOverride.resumeId) {
      const resume = await resumeApi.uploadResumeFile(form.resume_file, form.resume_title.trim() || form.resume_file.name);
      const resumeId = extractId(resume, ['resume_id', 'id']);
      if (resumeId) {
        nextSaved.resumeId = resumeId;
        setLocalValue('careerzip_selected_resume_id', resumeId);
      }
    }

    if (form.cover_letter.trim() && !savedOverride.coverLetterId) {
      const cover = await coverLetterApi.createCoverLetter({
        title: form.cover_letter.trim().split('\n')[0].slice(0, 60) || '온보딩 자기소개서',
        company_name: form.company_name.trim(),
        jd_id: savedOverride.jdId || undefined,
        items: [
          {
            question: '자기소개서',
            answer_text: form.cover_letter.trim(),
            order_index: 1,
          },
        ],
      });
      const coverLetterId = extractId(cover, ['cover_letter_id', 'id']);
      if (coverLetterId) {
        nextSaved.coverLetterId = coverLetterId;
        setLocalValue('careerzip_selected_cover_letter_id', coverLetterId);
      }
    }

    if ((form.project_name.trim() || form.project_description.trim()) && !savedOverride.projectId) {
      const project = await projectApi.createProject({
        project_name: form.project_name.trim() || '온보딩 프로젝트',
        description: form.project_description.trim() || form.project_name.trim() || '온보딩 프로젝트 경험',
        contribution: form.project_contribution.trim(),
        tech_stack: splitList(form.project_tech_stack),
        github_url: form.project_github_url.trim(),
      });
      const projectId = extractId(project, ['project_id', 'id']);
      if (projectId) {
        nextSaved.projectId = projectId;
        setLocalValue('careerzip_selected_project_ids', JSON.stringify([projectId]));
      }
    }

    if (Object.keys(nextSaved).length) {
      setSaved((prev) => ({ ...prev, ...nextSaved }));
    }
  };
  const validateCurrentStep = () => {
    if (current === 2 && !form.desired_job.trim()) {
      return '기본 프로필 단계에서 희망 직무를 입력해주세요.';
    }
    if (current === 3) {
      if (!form.company_name.trim()) return 'JD 입력 단계에서 회사명을 입력해주세요.';
      if (!form.position.trim()) return 'JD 입력 단계에서 직무명을 입력해주세요.';
      if (!form.jd_main_tasks.trim() && !form.jd_requirements.trim()) {
        return 'JD 입력 단계에서 주요 업무 또는 자격 요건을 입력해주세요.';
      }
    }
    return '';
  };

  const goNext = () => {
    setError('');
    const validationMessage = validateCurrentStep();
    if (validationMessage) {
      setError(validationMessage);
      return;
    }
    navigate('/input/onboarding/' + Math.min(STEPS.length, current + 1));
  };

  const complete = async () => {
    setSaving(true);
    setError('');
    try {
      await saveProfile();
      const jdId = saved.jdId || (await saveJd());
      const currentSaved = jdId && !saved.jdId ? { ...saved, jdId } : saved;
      if (jdId && !saved.jdId) {
        setSaved(currentSaved);
      }
      await saveTalentProfile(jdId);
      await saveOptionalMaterials(currentSaved);
      await completeOnboarding();
      const me = await getMe();
      setUser(me.data);
      navigate(resolveAuthedRedirect(me.data), { replace: true });
    } catch (err) {
      setError(err?.message || '온보딩 완료 처리 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f8fa] text-[#111]">
      <OnboardingHeader current={current} />
      <main className="mx-auto max-w-[1200px] px-5 py-10">
        <section className="rounded-2xl border border-[#dfe5ea] bg-white p-6 shadow-[0_18px_45px_rgba(0,0,0,0.04)] md:p-10">
          {current === 1 ? (
            <div>
              <h1 className="text-center text-3xl font-black">나에게 맞는 면접 유형을 찾아요</h1>
              <p className="mt-3 text-center text-sm font-bold text-[rgba(0,0,0,0.6)]">
                선택한 유형은 마이페이지 프로필에 저장되고 면접 준비 추천에 활용됩니다.
              </p>
              <div className="mt-10 grid gap-4 md:grid-cols-2">
                {USER_TYPES.map((item) => {
                  const selected = form.userType === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => update('userType', item.id)}
                      className={`relative min-h-[150px] rounded-xl border p-6 text-left transition ${
                        selected ? 'border-[#08CB00] bg-[#f0fff0]' : 'border-[#dfe5ea] bg-white hover:border-[#08CB00]'
                      }`}
                    >
                      <UserRound className="mb-5 h-6 w-6 text-[#7b8791]" />
                      <strong className="block text-lg font-black">{item.title}</strong>
                      <span className="mt-3 block text-sm font-bold leading-6 text-[rgba(0,0,0,0.6)]">{item.description}</span>
                      {selected ? <Check className="absolute right-6 top-6 h-6 w-6 text-[#08CB00]" /> : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {current === 2 ? (
            <div>
              <h1 className="text-center text-3xl font-black">기본 프로필을 입력해요</h1>
              <p className="mt-3 text-center text-sm font-bold text-[rgba(0,0,0,0.6)]">
                자료입력의 프로필 저장 API와 같은 데이터를 사용합니다.
              </p>
              <div className="mx-auto mt-10 grid max-w-3xl gap-5 md:grid-cols-2">
                <Field label="희망 직무" required>
                  <input className={inputClass} value={form.desired_job} onChange={(event) => update('desired_job', event.target.value)} />
                </Field>
                <Field label="경력 연차">
                  <input
                    className={inputClass}
                    type="number"
                    min="0"
                    value={form.career_year}
                    onChange={(event) => update('career_year', event.target.value)}
                  />
                </Field>
                <div className="md:col-span-2">
                  <Field label="개인 GitHub URL" hint="선택 입력입니다. 프로젝트 분석은 자료 추가 단계의 프로젝트 GitHub를 우선 사용합니다.">
                  <input className={inputClass} value={form.github_url} onChange={(event) => update('github_url', event.target.value)} />
                  </Field>
                </div>
              </div>
            </div>
          ) : null}

          {current === 3 ? (
            <div>
              <h1 className="text-center text-3xl font-black">지원할 JD를 저장해요</h1>
              <p className="mt-3 text-center text-sm font-bold text-[rgba(0,0,0,0.6)]">
                저장된 JD는 AI 분석과 면접 질문 생성의 기준 자료로 사용됩니다.
              </p>
              <div className="mx-auto mt-10 grid max-w-4xl gap-5 md:grid-cols-2">
                <Field label="회사명" required>
                  <input className={inputClass} value={form.company_name} onChange={(event) => update('company_name', event.target.value)} />
                </Field>
                <Field label="직무명" required>
                  <input className={inputClass} value={form.position} onChange={(event) => update('position', event.target.value)} />
                </Field>
                <Field label="직무 카테고리">
                  <select className={inputClass} value={form.job_category} onChange={(event) => update('job_category', event.target.value)}>
                    <option value="backend">백엔드</option>
                    <option value="frontend">프론트엔드</option>
                    <option value="fullstack">풀스택</option>
                    <option value="data">데이터</option>
                    <option value="ai">AI</option>
                  </select>
                </Field>
                <Field label="경력 구분">
                  <select className={inputClass} value={form.experience_level} onChange={(event) => update('experience_level', event.target.value)}>
                    <option value="new">신입</option>
                    <option value="junior">주니어</option>
                    <option value="mid">미들</option>
                    <option value="senior">시니어</option>
                  </select>
                </Field>
                <Field label="요구 기술 스택" hint="쉼표로 구분해서 입력해주세요. 질문 생성의 JD 기술 근거로 저장됩니다.">
                  <input className={inputClass} value={form.tech_stacks} onChange={(event) => update('tech_stacks', event.target.value)} />
                </Field>
                <Field label="추가 기술 스택">
                  <input
                    className={inputClass}
                    value={form.jd_custom_tech_stacks}
                    onChange={(event) => update('jd_custom_tech_stacks', event.target.value)}
                    placeholder="예: Redis, Kafka"
                  />
                </Field>
                <div className="md:col-span-2">
                  <Field label="주요 업무" required>
                    <textarea
                      className={textareaClass}
                      value={form.jd_main_tasks}
                      onChange={(event) => update('jd_main_tasks', event.target.value)}
                      placeholder="공고의 주요 업무를 정리해 주세요."
                    />
                  </Field>
                </div>
                <div className="md:col-span-2">
                  <Field label="자격 요건">
                    <textarea
                      className={textareaClass}
                      value={form.jd_requirements}
                      onChange={(event) => update('jd_requirements', event.target.value)}
                      placeholder="필수 역량, 경력, 기술 요건을 정리해 주세요."
                    />
                  </Field>
                </div>
                <div className="md:col-span-2">
                  <Field label="우대 사항">
                    <textarea
                      className={textareaClass}
                      value={form.jd_preferences}
                      onChange={(event) => update('jd_preferences', event.target.value)}
                      placeholder="우대 기술이나 경험이 있다면 적어주세요."
                    />
                  </Field>
                </div>
                <div className="md:col-span-2">
                  <Field label="질문 키워드" hint="면접 질문에 반영하고 싶은 키워드를 쉼표로 구분해서 입력해주세요.">
                    <input
                      className={inputClass}
                      value={form.jd_custom_keywords}
                      onChange={(event) => update('jd_custom_keywords', event.target.value)}
                      placeholder="예: 트랜잭션, 장애 대응, 성능 개선"
                    />
                  </Field>
                </div>
                <div className="md:col-span-2">
                  <Field label="JD 원문" hint="선택 입력입니다. 공고 원문이 있으면 붙여넣어 주세요.">
                    <textarea
                      className="min-h-48 w-full rounded-lg border border-[#cfd8df] bg-white px-4 py-3 text-sm font-bold outline-none transition focus:border-[#08CB00] focus:ring-2 focus:ring-[#08CB00]/20"
                      value={form.jd_text}
                      onChange={(event) => update('jd_text', event.target.value)}
                      placeholder="공고의 주요 업무, 자격 요건, 우대 사항을 붙여넣어 주세요."
                    />
                  </Field>
                </div>
              </div>
            </div>
          ) : null}

          {current === 4 ? (
            <div>
              <h1 className="text-center text-3xl font-black">JD 인재상을 선택해요</h1>
              <p className="mt-3 text-center text-sm font-bold text-[rgba(0,0,0,0.6)]">
                선택한 인재상은 JD에 저장되고 면접 질문 생성에 함께 반영됩니다.
              </p>
              {talentError ? (
                <p className="mx-auto mt-6 max-w-3xl rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-black text-amber-700">
                  {talentError}
                </p>
              ) : null}
              <div className="mt-10 rounded-xl border border-[#dfe5ea] p-5">
                {talentLoading ? (
                  <div className="py-12 text-center text-sm font-black text-[rgba(0,0,0,0.55)]">인재상 목록을 불러오는 중입니다.</div>
                ) : (
                  <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
                    <aside className="space-y-2">
                      {talentCatalog.map((category) => {
                        const active = activeTalentCategory?.category_code === category.category_code;
                        return (
                          <button
                            key={category.category_code}
                            type="button"
                            onClick={() => setActiveTalentCategoryCode(category.category_code)}
                            className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left text-sm font-black transition ${
                              active ? 'border-[#08CB00] bg-[#f0fff0] text-[#253900]' : 'border-[#dfe5ea] bg-white text-[rgba(0,0,0,0.7)]'
                            }`}
                          >
                            <span>{category.category_name}</span>
                            <span>{category.traits.length}개</span>
                          </button>
                        );
                      })}
                    </aside>
                    <section>
                      <div className="mb-4 flex items-center justify-between gap-4">
                        <div>
                          <strong className="block text-lg font-black">{activeTalentCategory?.category_name || '인재상'}</strong>
                          <span className="mt-1 block text-xs font-bold text-[rgba(0,0,0,0.55)]">
                            최대 {MAX_SELECTED_TRAITS}개까지 선택할 수 있습니다.
                          </span>
                        </div>
                        <span className="rounded-full border border-[#253900] px-4 py-2 text-sm font-black">
                          {selectedTalentItems.length} / {MAX_SELECTED_TRAITS}
                        </span>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        {(activeTalentCategory?.traits || []).map((trait) => {
                          const selected = isTraitSelected(selectedTalentItems, trait.trait_code);
                          return (
                            <button
                              key={trait.trait_code}
                              type="button"
                              onClick={() => toggleTalentTrait(trait)}
                              className={`min-h-[112px] rounded-xl border p-4 text-left transition ${
                                selected ? 'border-[#08CB00] bg-[#f0fff0]' : 'border-[#dfe5ea] bg-white hover:border-[#08CB00]'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <strong className="text-base font-black">{trait.trait_name}</strong>
                                {selected ? <Check className="h-5 w-5 shrink-0 text-[#08CB00]" /> : null}
                              </div>
                              <p className="mt-3 text-sm font-bold leading-6 text-[rgba(0,0,0,0.58)]">{trait.short_description}</p>
                            </button>
                          );
                        })}
                      </div>
                      <div className="mt-5">
                        <Field label="인재상 요약" hint="선택한 인재상에 대해 면접에서 특히 보고 싶은 기준이 있으면 적어주세요.">
                          <textarea
                            className={textareaClass}
                            value={talentSummary}
                            onChange={(event) => setTalentSummary(event.target.value)}
                            placeholder="예: 문제 해결 과정과 책임감 있는 커뮤니케이션을 중점적으로 확인하고 싶어요."
                          />
                        </Field>
                      </div>
                    </section>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {current === 5 ? (
            <div>
              <h1 className="text-center text-3xl font-black">선택 자료를 추가해요</h1>
              <p className="mt-3 text-center text-sm font-bold text-[rgba(0,0,0,0.6)]">
                이력서, 자기소개서, 프로젝트는 선택 사항입니다. 입력하면 면접 질문 생성에 더 많은 근거가 생깁니다.
              </p>
              <div className="mt-10 grid gap-5 lg:grid-cols-3">
                <div className="rounded-xl border border-[#dfe5ea] p-5">
                  <FileText className="mb-4 h-6 w-6 text-[#08CB00]" />
                  <Field label="이력서 제목">
                    <input className={inputClass} value={form.resume_title} onChange={(event) => update('resume_title', event.target.value)} />
                  </Field>
                  <Field label="이력서 파일" hint="PDF 또는 DOCX 파일을 업로드해주세요.">
                    <input
                      className="block w-full text-sm font-bold"
                      type="file"
                      accept=".pdf,.doc,.docx,application/pdf"
                      onChange={(event) => update('resume_file', event.target.files?.[0] || null)}
                    />
                  </Field>
                </div>
                <div className="rounded-xl border border-[#dfe5ea] p-5">
                  <UploadCloud className="mb-4 h-6 w-6 text-[#08CB00]" />
                  <Field label="자기소개서">
                    <textarea
                      className="min-h-[210px] w-full rounded-lg border border-[#cfd8df] bg-white px-4 py-3 text-sm font-bold outline-none transition focus:border-[#08CB00] focus:ring-2 focus:ring-[#08CB00]/20"
                      value={form.cover_letter}
                      onChange={(event) => update('cover_letter', event.target.value)}
                    />
                  </Field>
                </div>
                <div className="rounded-xl border border-[#dfe5ea] p-5">
                  <Field label="프로젝트명">
                    <input className={inputClass} value={form.project_name} onChange={(event) => update('project_name', event.target.value)} />
                  </Field>
                  <Field label="사용 기술" hint="쉼표로 구분해서 입력해주세요.">
                    <input className={inputClass} value={form.project_tech_stack} onChange={(event) => update('project_tech_stack', event.target.value)} />
                  </Field>
                  <Field label="기여도 / 역할">
                    <input className={inputClass} value={form.project_contribution} onChange={(event) => update('project_contribution', event.target.value)} />
                  </Field>
                  <Field label="프로젝트 GitHub URL">
                    <input className={inputClass} value={form.project_github_url} onChange={(event) => update('project_github_url', event.target.value)} />
                  </Field>
                  <Field label="프로젝트 설명">
                    <textarea className={textareaClass} value={form.project_description} onChange={(event) => update('project_description', event.target.value)} />
                  </Field>
                </div>
              </div>
            </div>
          ) : null}

          {current === 6 ? (
            <div>
              <h1 className="text-center text-3xl font-black">입력 내용을 확인해요</h1>
              <p className="mt-3 text-center text-sm font-bold text-[rgba(0,0,0,0.6)]">
                완료하면 온보딩이 끝나고 다음 화면으로 이동합니다.
              </p>
              <dl className="mx-auto mt-8 max-w-2xl rounded-xl border border-[#dfe5ea] p-5 text-sm">
                <SummaryRow label="사용자 유형" value={userType.title} />
                <SummaryRow label="희망 직무" value={form.desired_job} />
                <SummaryRow label="경력 연차" value={`${form.career_year || 0}년`} />
                <SummaryRow label="기술 스택" value={form.tech_stacks} />
                <SummaryRow label="GitHub" value={form.github_url} />
                <SummaryRow label="JD" value={form.company_name ? `${form.company_name} · ${form.position}` : ''} />
                <SummaryRow label="주요 업무" value={form.jd_main_tasks} />
                <SummaryRow label="자격 요건" value={form.jd_requirements} />
                <SummaryRow label="인재상" value={selectedTalentSummary(selectedTalentItems)} />
                <SummaryRow label="이력서" value={form.resume_file?.name || (saved.resumeId ? '등록 완료' : '')} />
                <SummaryRow label="자기소개서" value={form.cover_letter.trim() ? '등록 예정/완료' : ''} />
                <SummaryRow label="프로젝트" value={form.project_name || (saved.projectId ? '등록 완료' : '')} />
              </dl>
            </div>
          ) : null}

          {error ? <p className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-600">{error}</p> : null}

          <div className="mt-8 flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate(`/input/onboarding/${Math.max(1, current - 1)}`)}
              disabled={current === 1 || saving}
              className="h-12 rounded-lg border border-[#cfd8df] px-8 font-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              이전
            </button>
            {current < STEPS.length ? (
              <button
                type="button"
                onClick={goNext}
                disabled={saving}
                className="h-12 rounded-lg bg-[#08CB00] px-8 font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                다음
              </button>
            ) : (
              <button
                type="button"
                onClick={complete}
                disabled={saving}
                className="h-12 rounded-lg bg-[#08CB00] px-8 font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? '완료 처리 중...' : '온보딩 완료'}
              </button>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

