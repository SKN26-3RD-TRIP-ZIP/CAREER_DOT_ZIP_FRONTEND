import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMe } from '../../api/authApi';
import { coverLetterApi } from '../../api/coverLetterApi';
import { projectApi } from '../../api/projectApi';
import { Alert, Button, Card, Field, LoadingState, PageShell, StatusBadge, inputClass } from '../../components/ui/DemoLayout';
import { useAuthStore } from '../../store/authStore';

function safeJsonParse(value, fallback = {}) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function getResults(data) {
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.results) ? data.results : [];
}

function draftKey(userId, type) {
  return `careerzip:draft:${userId}:${type}`;
}

function formatApiError(err, fallback) {
  const status = err?.response?.status;
  const detail = err?.response?.data?.detail || err?.response?.data;
  if (!err?.response) return '서버에 연결할 수 없습니다. 백엔드 실행 상태를 확인해주세요.';
  if (status === 401) return '로그인이 필요합니다. 다시 로그인해주세요.';
  if (status === 400) return typeof detail === 'string' ? detail : `입력값 오류: ${JSON.stringify(detail)}`;
  if (status === 404) return '저장 대상을 찾을 수 없습니다. 자료를 새로고침해주세요.';
  return `${fallback} (HTTP ${status})`;
}

function selectedJdId() {
  return window.localStorage.getItem('careerzip_selected_jd_id') || window.localStorage.getItem('careerzip_temp_jd_id') || '';
}

function saveSelectedProjectId(projectId) {
  if (!projectId) return;
  window.localStorage.setItem('careerzip_selected_project_ids', JSON.stringify([projectId]));
}

function CoverLetterProjectPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [currentUser, setCurrentUser] = useState(user);
  const [coverLetter, setCoverLetter] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [projectRole, setProjectRole] = useState('');
  const [projectExp, setProjectExp] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!window.localStorage.getItem('access_token')) {
      navigate('/auth/login');
      return undefined;
    }

    let active = true;
    const load = async () => {
      setInitialLoading(true);
      setError('');
      try {
        const storedUser = useAuthStore.getState().user;
        const me = storedUser?.user_id ? storedUser : (await getMe()).data;
        if (!active) return;
        setCurrentUser(me);
        setUser(me);

        const [coverLetterListData, projectListData] = await Promise.all([
          coverLetterApi.getCoverLetters(),
          projectApi.getProjects(),
        ]);
        if (!active) return;

        const coverLetters = getResults(coverLetterListData);
        const projects = getResults(projectListData);
        const latestCoverLetter = coverLetters[0];
        const latestProject = projects[0];

        if (latestCoverLetter?.cover_letter_id) {
          const detail = await coverLetterApi.getCoverLetterDetail(latestCoverLetter.cover_letter_id);
          if (!active) return;
          const answers = getResults(detail?.items).map((item) => item.answer_text).filter(Boolean);
          setCoverLetter(answers.join('\n\n'));
          window.localStorage.setItem('careerzip_selected_cover_letter_id', latestCoverLetter.cover_letter_id);
          window.localStorage.removeItem(draftKey(me.user_id, 'coverletter'));
        } else {
          setCoverLetter(window.localStorage.getItem(draftKey(me.user_id, 'coverletter')) || '');
        }

        if (latestProject?.project_id) {
          setProjectTitle(latestProject.project_name || '');
          setProjectRole(latestProject.contribution || '');
          setProjectExp(latestProject.description || '');
          saveSelectedProjectId(latestProject.project_id);
          window.localStorage.removeItem(draftKey(me.user_id, 'project'));
        } else {
          const draft = safeJsonParse(window.localStorage.getItem(draftKey(me.user_id, 'project')));
          setProjectTitle(draft.projectTitle || '');
          setProjectRole(draft.projectRole || '');
          setProjectExp(draft.projectExp || '');
        }

        if (latestCoverLetter || latestProject) {
          setNotice('서버에 저장된 최신 자소서·프로젝트를 우선 불러왔습니다.');
        }
      } catch (err) {
        if (!active) return;
        setError(formatApiError(err, '자소서·프로젝트 자료를 불러오지 못했습니다.'));
        if (err?.response?.status === 401) navigate('/auth/login');
      } finally {
        if (active) setInitialLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [navigate, setUser]);

  const saveCoverDraft = (value) => {
    setCoverLetter(value);
    if (!currentUser?.user_id) return;
    const key = draftKey(currentUser.user_id, 'coverletter');
    if (value.trim()) window.localStorage.setItem(key, value);
    else window.localStorage.removeItem(key);
  };

  const saveProjectDraft = (next) => {
    const draft = {
      projectTitle,
      projectRole,
      projectExp,
      ...next,
    };
    if (!currentUser?.user_id) return;
    const key = draftKey(currentUser.user_id, 'project');
    if (draft.projectTitle.trim() || draft.projectRole.trim() || draft.projectExp.trim()) {
      window.localStorage.setItem(key, JSON.stringify(draft));
    } else {
      window.localStorage.removeItem(key);
    }
  };

  const hasAnyInput = Boolean(coverLetter.trim() || projectTitle.trim() || projectRole.trim() || projectExp.trim());
  const hasProjectInput = Boolean(projectTitle.trim() || projectRole.trim() || projectExp.trim());

  const handleSkip = () => {
    setError('');
    if (hasAnyInput) {
      setError('입력한 내용이 있습니다. 서버 저장 후 자료입력으로 돌아가거나 입력을 비워주세요.');
      return;
    }
    navigate('/input');
  };

  const handleSaveAndMove = async () => {
    setError('');
    setNotice('');

    if (!currentUser?.user_id) {
      setError('로그인 사용자 정보를 확인하지 못했습니다. 다시 로그인해주세요.');
      navigate('/auth/login');
      return;
    }

    if (!hasAnyInput) {
      navigate('/input');
      return;
    }

    if (hasProjectInput && !projectTitle.trim()) {
      setError('프로젝트 경험을 저장하려면 프로젝트명을 입력해주세요.');
      return;
    }

    if (hasProjectInput && !projectExp.trim()) {
      setError('프로젝트 경험을 저장하려면 프로젝트 설명을 입력해주세요.');
      return;
    }

    setSaving(true);
    try {
      let coverLetterId = '';
      let projectId = '';

      if (coverLetter.trim()) {
        const payload = {
          title: coverLetter.trim().split('\n')[0].slice(0, 60) || '자기소개서',
          company_name: '',
          items: [
            {
              question: '자기소개서',
              answer_text: coverLetter.trim(),
              order_index: 1,
            },
          ],
        };
        const jdId = selectedJdId();
        if (jdId) payload.jd_id = jdId;
        const savedCoverLetter = await coverLetterApi.createCoverLetter(payload);
        coverLetterId = savedCoverLetter?.cover_letter_id;
        if (!coverLetterId) throw new Error('자기소개서 저장 응답에 cover_letter_id가 없습니다.');
        window.localStorage.setItem('careerzip_selected_cover_letter_id', coverLetterId);
        window.localStorage.removeItem(draftKey(currentUser.user_id, 'coverletter'));
      }

      if (hasProjectInput) {
        const savedProject = await projectApi.createProject({
          project_name: projectTitle.trim(),
          description: projectExp.trim(),
          contribution: projectRole.trim(),
          tech_stack: [],
        });
        projectId = savedProject?.project_id;
        if (!projectId) throw new Error('프로젝트 저장 응답에 project_id가 없습니다.');
        saveSelectedProjectId(projectId);
        window.localStorage.removeItem(draftKey(currentUser.user_id, 'project'));
      }

      setNotice('서버에 저장했습니다. 자료입력 화면으로 돌아갑니다.');
      navigate('/input');
    } catch (err) {
      setError(formatApiError(err, '자소서·프로젝트 저장에 실패했습니다.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell
      title="자소서·프로젝트 경험"
      description="입력한 내용은 서버에 저장한 뒤 면접 질문 생성 자료로 연결합니다."
      actions={<StatusBadge tone="info">서버 저장</StatusBadge>}
    >
      <Card className="mx-auto max-w-5xl p-6">
        {initialLoading ? (
          <LoadingState title="서버에 저장된 자소서와 프로젝트를 확인하는 중입니다" />
        ) : (
          <>
            <Alert tone="info">
              Draft는 현재 로그인 사용자 키로만 임시 저장됩니다. 서버 저장에 성공하면 해당 Draft는 삭제됩니다.
            </Alert>
            {notice && <Alert tone="success" className="mt-4">{notice}</Alert>}

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <section className="rounded-lg border border-[rgba(0,0,0,0.12)] p-5">
                <h2 className="text-xl font-black text-[#253900]">자기소개서</h2>
                <p className="mt-2 text-sm leading-6">지원동기, 성장과정, 직무역량 등 문항별 답변을 붙여넣어 보완 포인트를 정리하세요.</p>
                <Field label="자기소개서 내용" hint="저장하면 서버의 자기소개서 API에 문항 1개로 등록됩니다.">
                  <textarea
                    rows={12}
                    className={`${inputClass} mt-4`}
                    placeholder="지원동기, 직무역량, 협업 경험 등을 입력하세요."
                    value={coverLetter}
                    onChange={(e) => saveCoverDraft(e.target.value)}
                  />
                </Field>
              </section>

              <section className="rounded-lg border border-[rgba(0,0,0,0.12)] p-5">
                <h2 className="text-xl font-black text-[#253900]">프로젝트 경험</h2>
                <p className="mt-2 text-sm leading-6">프로젝트명, 역할, 기술 스택, 성과를 함께 적으면 STAR 기반 심화 질문 준비에 도움이 됩니다.</p>
                <div className="mt-4 space-y-4">
                  <Field label="프로젝트명">
                    <input
                      className={inputClass}
                      placeholder="예: Career.zip"
                      value={projectTitle}
                      onChange={(e) => {
                        setProjectTitle(e.target.value);
                        saveProjectDraft({ projectTitle: e.target.value });
                      }}
                    />
                  </Field>
                  <Field label="기여도 / 역할">
                    <input
                      className={inputClass}
                      placeholder="예: 백엔드 API 설계 · 기여도 80%"
                      value={projectRole}
                      onChange={(e) => {
                        setProjectRole(e.target.value);
                        saveProjectDraft({ projectRole: e.target.value });
                      }}
                    />
                  </Field>
                  <Field label="프로젝트 설명">
                    <textarea
                      rows={7}
                      className={inputClass}
                      placeholder="문제 상황, 맡은 역할, 사용 기술, 결과를 입력하세요."
                      value={projectExp}
                      onChange={(e) => {
                        setProjectExp(e.target.value);
                        saveProjectDraft({ projectExp: e.target.value });
                      }}
                    />
                  </Field>
                </div>
              </section>
            </div>

            {error && <Alert tone="danger" className="mt-5">{error}</Alert>}

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Button type="button" variant="secondary" onClick={() => navigate('/input')} disabled={saving}>
                이전
              </Button>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" onClick={handleSkip} disabled={saving}>
                  입력 없이 자료입력으로
                </Button>
                <Button type="button" onClick={handleSaveAndMove} disabled={saving}>
                  {saving ? '저장 중...' : '저장하고 자료입력으로'}
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </PageShell>
  );
}

export default CoverLetterProjectPage;
