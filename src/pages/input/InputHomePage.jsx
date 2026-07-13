import { Link } from 'react-router-dom';
import {
  BriefcaseBusiness,
  ChevronRight,
  FileText,
  FolderGit2,
  IdCard,
  NotebookText,
} from 'lucide-react';
import { PageShell } from '../../components/ui/DemoLayout';

const INPUT_SECTIONS = [
  {
    title: '프로필',
    badge: '기본 정보',
    description: '희망 직무, 경력, 전공 여부, 기술 스택을 관리합니다.',
    href: '/profile',
    action: '프로필 수정',
    icon: IdCard,
  },
  {
    title: 'JD',
    badge: '필수',
    description: '지원 회사, 직무, 주요 업무, 자격 요건과 인재상을 관리합니다.',
    href: '/input/jd',
    action: 'JD 관리',
    icon: BriefcaseBusiness,
  },
  {
    title: '이력서',
    badge: '필수',
    description: 'PDF 또는 DOCX 이력서를 업로드하고 면접에 사용할 이력서를 선택합니다.',
    href: '/input/documents',
    action: '이력서 관리',
    icon: FileText,
  },
  {
    title: '자기소개서',
    badge: '선택',
    description: '지원동기, 성장과정, 직무 역량 답변을 면접 질문 근거로 연결합니다.',
    href: '/input/cover-letter-project',
    action: '자소서 입력',
    icon: NotebookText,
  },
  {
    title: '프로젝트',
    badge: '선택',
    description: '프로젝트명, 사용 기술, 역할과 성과를 정리합니다.',
    href: '/input/cover-letter-project',
    action: '프로젝트 입력',
    icon: FolderGit2,
  },
];

export default function InputHomePage() {
  return (
    <PageShell
      title="자료 입력"
      description="면접 질문 생성과 분석에 쓰이는 자료를 한 곳에서 관리합니다."
      activeNav="자료 입력"
      maxWidth="max-w-[1220px]"
      actions={
        <Link
          to="/analysis"
          className="inline-flex h-12 items-center justify-center rounded-lg bg-[#05c700] px-6 text-base font-black text-white no-underline hover:bg-[#04b000]"
        >
          AI 분석으로 이동
        </Link>
      }
    >
        <div className="mb-8 rounded-lg border border-[#dbe8dc] bg-white p-5">
          <p className="text-sm font-black text-[#183300]">추천 입력 순서</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm font-bold text-[#4b5563]">
            <span className="rounded-full bg-[#e8f8e8] px-3 py-1 text-[#05a800]">프로필</span>
            <ChevronRight size={16} />
            <span className="rounded-full bg-[#e8f8e8] px-3 py-1 text-[#05a800]">JD</span>
            <ChevronRight size={16} />
            <span className="rounded-full bg-[#e8f8e8] px-3 py-1 text-[#05a800]">이력서</span>
            <ChevronRight size={16} />
            <span className="rounded-full bg-[#e8f8e8] px-3 py-1 text-[#05a800]">자기소개서·프로젝트</span>
            <ChevronRight size={16} />
            <span className="rounded-full bg-[#e8f8e8] px-3 py-1 text-[#05a800]">AI 분석</span>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {INPUT_SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <article key={section.title} className="flex min-h-[236px] flex-col rounded-lg border border-[#dfe5ea] bg-white p-6">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-[#e8f8e8] text-[#05b700]">
                      <Icon size={23} />
                    </span>
                    <div>
                      <h2 className="text-xl font-black text-[#183300]">{section.title}</h2>
                      <p className="mt-1 text-xs font-black text-[#05a800]">{section.badge}</p>
                    </div>
                  </div>
                </div>

                <p className="min-h-[54px] text-sm font-medium leading-6 text-[#5b6472]">{section.description}</p>

                <div className="mt-auto flex flex-wrap gap-2 pt-6">
                  <Link
                    to={section.href}
                    className="inline-flex h-11 items-center justify-center rounded-lg bg-[#05c700] px-4 text-sm font-black text-white no-underline hover:bg-[#04b000]"
                  >
                    {section.action}
                  </Link>
                  {section.secondaryHref && (
                    <Link
                      to={section.secondaryHref}
                      className="inline-flex h-11 items-center justify-center rounded-lg border border-[#d6dde3] bg-white px-4 text-sm font-black text-[#183300] no-underline hover:border-[#05c700]"
                    >
                      {section.secondaryAction}
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
    </PageShell>
  );
}
