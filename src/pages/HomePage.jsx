import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, FileText, MessagesSquare, ShieldCheck } from 'lucide-react';
import { Button, Card, Logo } from '../components/ui/DemoLayout';

const valueCards = [
  {
    title: 'JD 기반 질문 생성',
    desc: '지원 공고의 자격 요건과 우대사항을 분석해 직무에 맞는 질문을 만듭니다.',
    icon: FileText,
  },
  {
    title: '실전형 꼬리질문',
    desc: '답변 흐름을 따라 CS, DB, 프로젝트 기여도까지 깊게 확인합니다.',
    icon: MessagesSquare,
  },
  {
    title: '면접 리포트·성장 관리',
    desc: '회차별 점수와 강점, 약점을 정리해 다음 연습 방향을 보여줍니다.',
    icon: BarChart3,
  },
];

const flow = ['JD 입력', '이력서 업로드', '면접 설정', '면접 진행', '리포트 확인'];

function HomePage() {
  return (
    <main className="min-h-screen bg-[#EEEEEE] text-[#000000]">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-6">
        <Logo />
        <nav className="hidden items-center gap-7 text-sm font-black text-[#253900] md:flex">
          <a href="#features">서비스 소개</a>
          <a href="#features">기능</a>
          <a href="#flow">요금제</a>
        </nav>
        <div className="flex items-center gap-2">
          <Button as={Link} to="/auth/login" variant="ghost">
            로그인
          </Button>
          <Button as={Link} to="/auth/signup">
            회원가입
          </Button>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-6xl items-center gap-8 px-5 pb-16 pt-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="inline-flex rounded-full border border-[#253900] px-4 py-2 text-xs font-black text-[#253900]">
            비전공 신입도 흔들리지 않는 면접 준비
          </p>
          <h1 className="mt-6 max-w-3xl text-5xl font-black leading-tight tracking-normal text-[#253900] md:text-6xl">
            실전 같은 AI 모의면접으로 합격에 한 걸음 더 가까이
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8">
            JD, 이력서, 자소서를 분석해 맞춤 면접 질문을 만들고 답변 피드백과 꼬리질문, 약점 보완까지 한 번에 도와드려요.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button as={Link} to="/auth/signup" className="min-w-40">
              무료로 시작하기
            </Button>
            <Button as={Link} to="/auth/login" variant="secondary" className="min-w-40">
              로그인
            </Button>
          </div>
        </div>

        <Card className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-black text-[#253900]">AI 분석 리포트</p>
              <p className="mt-4 text-6xl font-black text-[#000000]">82</p>
              <p className="mt-1 text-sm font-black text-[#253900]">점 / 100</p>
            </div>
            <span className="rounded-full border border-[rgba(0,0,0,0.12)] bg-[#08CB00] px-4 py-2 text-xs font-black">+12점</span>
          </div>
          <div className="mt-7 grid gap-3">
            {['맞춤 질문 생성', '실시간 답변 피드백', '성장 리포트 자동 저장'].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-lg border border-[rgba(0,0,0,0.12)] p-4">
                <ShieldCheck size={20} className="text-[#253900]" />
                <span className="text-sm font-black">{item}</span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section id="features" className="mx-auto w-full max-w-6xl px-5 py-12">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-black text-[#253900]">합격까지 필요한 모든 면접 준비, 한 곳에서</h2>
          <p className="mt-3 leading-7">자료 입력부터 실전 면접, 리포트까지 Career.zip이 단계별로 함께합니다.</p>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {valueCards.map(({ title, desc, icon: Icon }) => (
            <Card key={title} className="p-6">
              <Icon size={28} className="text-[#253900]" />
              <h3 className="mt-5 text-xl font-black text-[#253900]">{title}</h3>
              <p className="mt-3 text-sm leading-6">{desc}</p>
            </Card>
          ))}
        </div>
      </section>

      <section id="flow" className="mx-auto w-full max-w-6xl px-5 py-12">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-3xl font-black text-[#253900]">이렇게 진행돼요</h2>
            <p className="mt-3 leading-7">5단계만 따라오면 첫 모의면접 리포트를 받아볼 수 있어요.</p>
          </div>
          <Button as={Link} to="/auth/signup">
            모의면접 시작하기
          </Button>
        </div>
        <div className="mt-8 grid gap-3 md:grid-cols-5">
          {flow.map((item, index) => (
            <article key={item} className="rounded-lg border border-[rgba(0,0,0,0.12)] bg-[#EEEEEE] p-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#08CB00] text-sm font-black">{index + 1}</span>
              <h3 className="mt-5 text-lg font-black text-[#253900]">{item}</h3>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-14">
        <Card className="flex flex-col gap-5 p-8 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-black text-[#253900]">오늘 입력한 자료로 바로 면접을 시작하세요</h2>
            <p className="mt-3 leading-7">첫 리포트가 쌓이면 약점 기반 추천 질문까지 이어집니다.</p>
          </div>
          <Button as={Link} to="/auth/signup" className="shrink-0">
            시작하기 <ArrowRight size={18} className="ml-2" />
          </Button>
        </Card>
      </section>
      <footer className="py-6 text-center">
        <Link to="/admin/login" className="text-xs text-[#CCCCCC] hover:text-[#AAAAAA] transition-colors">
          ©2025 Career.zip
        </Link>
      </footer>
    </main>
  );
}

export default HomePage;
