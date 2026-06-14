import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Card, Field, PageShell, StatusBadge, inputClass } from '../../components/ui/DemoLayout';

const STEPS = ['프로필', 'JD 입력', '이력서', '자소서·프로젝트', '면접 설정'];

function safeJsonParse(value) {
  if (!value) return {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function CoverLetterProjectPage() {
  const navigate = useNavigate();
  const savedDocs = useMemo(() => safeJsonParse(localStorage.getItem('userDocuments')), []);
  const [coverLetter, setCoverLetter] = useState(savedDocs.coverLetter || '');
  const [projectTitle, setProjectTitle] = useState(savedDocs.projectTitle || '');
  const [projectRole, setProjectRole] = useState(savedDocs.projectRole || '');
  const [projectExp, setProjectExp] = useState(savedDocs.projectExp || '');
  const [saved, setSaved] = useState(false);

  const persistAndMove = () => {
    const prev = safeJsonParse(localStorage.getItem('userDocuments'));
    localStorage.setItem(
      'userDocuments',
      JSON.stringify({
        ...prev,
        coverLetter,
        projectTitle,
        projectRole,
        projectExp,
      }),
    );
    setSaved(true);
    navigate('/interview/setup');
  };

  return (
    <PageShell
      eyebrow="Step 4"
      title="자소서·프로젝트 경험"
      description="선택 입력입니다. 입력하지 않아도 면접을 시작할 수 있고, 입력하면 더 깊이 있는 맞춤 질문을 받을 수 있어요."
      steps={STEPS}
      currentStep={4}
      actions={<StatusBadge tone="info">선택 입력</StatusBadge>}
    >
      <Card className="mx-auto max-w-5xl p-6">
        <Alert tone="info">
          자소서와 프로젝트 경험은 현재 브라우저 준비 메모로 저장됩니다. 기존 자소서 API에 저장된 문서는 Step 5에서 별도로 선택할 수 있습니다.
        </Alert>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="rounded-lg border border-[#000000] p-5">
            <h2 className="text-xl font-black text-[#253900]">자기소개서</h2>
            <p className="mt-2 text-sm leading-6">지원동기, 성장과정, 직무역량 등 문항별 답변을 붙여넣어 보완 포인트를 정리하세요.</p>
            <Field label="자기소개서 내용" hint="선택 입력입니다. 비워두어도 다음 단계로 이동할 수 있습니다.">
              <textarea
                rows={12}
                className={`${inputClass} mt-4`}
                placeholder="지원동기, 직무역량, 협업 경험 등을 입력하세요."
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
              />
            </Field>
          </section>

          <section className="rounded-lg border border-[#000000] p-5">
            <h2 className="text-xl font-black text-[#253900]">프로젝트 경험</h2>
            <p className="mt-2 text-sm leading-6">프로젝트명, 역할, 기술 스택, 성과를 함께 적으면 STAR 기반 심화 질문 준비에 도움이 됩니다.</p>
            <div className="mt-4 space-y-4">
              <Field label="프로젝트명">
                <input className={inputClass} placeholder="예: Career.zip" value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} />
              </Field>
              <Field label="기여도 / 역할">
                <input className={inputClass} placeholder="예: 백엔드 API 설계 · 기여도 80%" value={projectRole} onChange={(e) => setProjectRole(e.target.value)} />
              </Field>
              <Field label="프로젝트 설명">
                <textarea
                  rows={7}
                  className={inputClass}
                  placeholder="문제 상황, 맡은 역할, 사용 기술, 결과를 입력하세요."
                  value={projectExp}
                  onChange={(e) => setProjectExp(e.target.value)}
                />
              </Field>
            </div>
          </section>
        </div>

        {saved && <Alert tone="success" className="mt-5">입력 내용이 브라우저에 저장되었습니다.</Alert>}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Button type="button" variant="secondary" onClick={() => navigate('/input/documents')}>
            이전
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={persistAndMove}>
              건너뛰기
            </Button>
            <Button type="button" onClick={persistAndMove}>
              저장하고 다음
            </Button>
          </div>
        </div>
      </Card>
    </PageShell>
  );
}

export default CoverLetterProjectPage;
