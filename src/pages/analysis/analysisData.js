export const navItems = [
  { label: '대시보드', to: '/dashboard' },
  { label: '자료 입력', to: '/data' },
  { label: '면접 진행', to: '/analysis/source' },
  { label: '리포트', to: '/report' },
  { label: '마이페이지', to: '/mypage' },
]

export const resourceGroups = [
  {
    type: 'jd',
    title: 'JD 선택',
    description: '지원할 공고를 선택하거나 새 JD를 추가하세요.',
    addLabel: '신규 JD 추가',
    options: [
      { id: 'toss-backend', title: '토스 Backend Engineer', meta: '매칭 91% · Spring, MSA, 장애대응' },
      { id: 'naver-fe', title: '네이버 FE Developer', meta: '분석중 · React, TypeScript' },
      { id: 'coupang-platform', title: '쿠팡 Platform Engineer', meta: '대기 · Kafka, Redis, Linux' },
    ],
  },
  {
    type: 'resume',
    title: '이력서 선택',
    description: '분석 기준이 될 이력서 버전을 고르세요.',
    addLabel: '신규 이력서 추가',
    options: [
      { id: 'backend-v3', title: '백엔드 이력서 v3', meta: '최종 수정 2026.06.08 · 프로젝트 5건' },
      { id: 'junior-dev', title: '신입 개발자 이력서', meta: '최종 수정 2026.05.29 · 교육/수상 포함' },
      { id: 'data-analysis', title: '데이터 분석 이력서', meta: '최종 수정 2026.05.14 · SQL/Python 중심' },
    ],
  },
  {
    type: 'coverLetter',
    title: '자소서 선택',
    description: '기업/직무에 맞춘 자기소개서를 선택하세요.',
    addLabel: '신규 자소서 추가',
    options: [
      { id: 'kakao-backend', title: '카카오 백엔드 자소서', meta: '문항 4개 · 완성도 78%' },
      { id: 'toss-server', title: '토스 서버 자소서', meta: '문항 3개 · 보완 필요 2건' },
      { id: 'growth-common', title: '공통 성장과정 자소서', meta: '문항 2개 · 초안' },
    ],
  },
]

export const modalConfigs = {
  jd: {
    title: '신규 JD 추가',
    description: '채용 공고를 등록하고 분석에 사용할 JD로 선택합니다.',
    fields: [
      { label: '회사명', placeholder: '예: 토스', half: true },
      { label: '직무명', placeholder: '예: Backend Engineer', half: true },
      { label: '공고 URL', placeholder: '채용 공고 링크를 붙여넣으세요' },
      { label: '핵심 기술 스택', placeholder: 'Spring Boot, MSA, Redis, Kafka' },
      { label: 'JD 내용', placeholder: '공고 설명, 주요 업무, 자격 요건을 붙여넣으면 AI가 핵심 역량을 추출합니다.', textarea: true },
    ],
    chips: ['URL 자동 불러오기', '역량 키워드 추출'],
  },
  resume: {
    title: '신규 이력서 추가',
    description: '새 이력서를 등록하고 JD 매칭 분석에 사용합니다.',
    fields: [
      { label: '이력서 제목', placeholder: '예: 백엔드 이력서 v4' },
      { label: '파일 업로드', placeholder: 'PDF, DOCX 또는 링크 첨부' },
      { label: '대표 기술 스택', placeholder: 'Python, Django, Spring Boot, PostgreSQL' },
      { label: '프로젝트/경력 요약', placeholder: '주요 프로젝트, 성과 지표, 담당 역할을 입력하면 JD와의 매칭률을 계산합니다.', textarea: true },
    ],
    chips: ['파일에서 자동 추출', '프로젝트 태깅'],
  },
  coverLetter: {
    title: '신규 자소서 추가',
    description: '자기소개서를 등록하고 JD/이력서와 함께 분석합니다.',
    fields: [
      { label: '자소서 제목', placeholder: '예: 토스 서버 직무 자소서' },
      { label: '대상 기업/직무', placeholder: '예: 토스 / Backend Engineer' },
      { label: '문항 유형', placeholder: '지원동기, 성장과정, 직무역량, 협업경험' },
      { label: '자소서 내용', placeholder: '문항별 답변을 붙여넣으면 AI가 JD 적합도와 보완 포인트를 분석합니다.', textarea: true },
    ],
    chips: ['문항별 분석', 'STAR 구조 점검'],
  },
}

export const analysisResult = {
  jd_analysis_id: 'mock-uuid-0000-0000-0000-000000000001',

  match_score: 72.5,
  tech_score:  80.0,
  trait_score: 65.0,

  matched_keywords:   ['Python', 'Django', 'Redis'],
  unmatched_keywords: ['Kubernetes', 'Kafka'],

  jd_keywords: {
    tech_keywords:  ['Python', 'Django', 'Redis', 'Kubernetes'],
    trait_keywords: ['주도적으로 문제를 해결하는 분'],
    requirements: {
      min_years:       3,
      education:       '대졸',
      job_type:        '백엔드',
      required_tech:   ['Python', 'Django'],
      preferred_tech:  ['Kubernetes'],
    },
  },

  resume_analysis: {
    tech_stack:          ['Python', 'Django', 'Redis', 'PostgreSQL'],
    key_experiences:     ['배달 플랫폼 백엔드 개발', 'Redis 캐싱 최적화로 응답 속도 40% 개선'],
    strengths:           ['Python 백엔드 개발 2년 경험', 'Redis 캐싱 실무 적용'],
    trait_evidence:      ['팀 코드 리뷰 주도', '기능 개선 자발적 제안'],
    projects:            [{ name: '배달 플랫폼', role: '백엔드 개발', tech: 'Django, Redis, PostgreSQL' }],
    years_of_experience: 2,
    education:           '대졸',
    career_level:        'experienced',
  },

  gap: {
    missing_required_tech:  ['Kubernetes'],
    missing_preferred_tech: [],
    required_years:  3,
    current_years:   2,
    years_gap:       1.0,
    education_ok:    true,
    weak_traits: [
      { trait: '주도적으로 문제를 해결하는 분', similarity: 0.41 },
    ],
  },
  gap_message: {
    summary:      '몇 가지만 보완하면 경쟁력이 높아집니다.',
    tech_gaps:    ['Kubernetes: 실무 경험이 부족합니다 (필수)'],
    career_gap:   '요구 경력(3년) 대비 1.0년이 부족합니다.',
    trait_gaps:   ['\'주도적으로 문제를 해결하는 분\' 역량이 충분히 어필되지 않고 있어요.'],
    action_items: ['Kubernetes 실무 적용 경험 이력서에 추가', '경력 기술 시 수치·성과 중심으로 구체화'],
  },

  strengths:  ['Python 백엔드 개발 2년 경험', 'Redis 캐싱 실무 적용', '결제 도메인 이해도 높음'],
  weaknesses: ['Kubernetes 실무 경험 부족', '경력 1년 미충족', '테스트 자동화 경험 없음'],
  cl_points:  ['Redis 성능 개선 40% 수치 강조', '코드 리뷰 주도 경험 언급', '팀 협업 에피소드 구체화'],

  questions: [
    {
      id:            'mock-q-0001',
      question_type: 'trait',
      question_text: '팀 내에서 의견 충돌 상황이 발생했을 때, 어떤 방식으로 조율하셨나요?',
      order:         0,
      answer:        null,
    },
    {
      id:            'mock-q-0002',
      question_type: 'trait',
      question_text: '스타트업 환경에서의 협업 경험 중 가장 기억에 남는 에피소드는 무엇인가요?',
      order:         1,
      answer:        null,
    },
    {
      id:            'mock-q-0003',
      question_type: 'trait',
      question_text: '주도적으로 문제를 해결했던 경험을 구체적인 상황과 함께 설명해주세요.',
      order:         2,
      answer:        null,
    },
    {
      id:            'mock-q-0004',
      question_type: 'technical',
      question_text: 'Redis 캐싱 전략을 설명하고 실제 적용 경험을 말해주세요.',
      order:         3,
      answer: {
        summary:      'Redis TTL 전략으로 응답 속도 40%를 개선했습니다.',
        situation:    '트래픽 증가로 API 지연이 발생했습니다.',
        task:         '캐싱 전략 설계 및 적용을 담당했습니다.',
        action:       'Redis TTL 전략을 도입해 반복 조회를 캐싱했습니다.',
        result:       '응답 속도 40% 개선, 서버 부하 30% 감소.',
        basis_source: 'project:배달플랫폼',
      },
    },
    {
      id:            'mock-q-0005',
      question_type: 'technical',
      question_text: 'Django ORM에서 N+1 문제를 어떻게 해결하셨나요?',
      order:         4,
      answer:        null,
    },
    {
      id:            'mock-q-0006',
      question_type: 'technical',
      question_text: 'Kubernetes를 사용해본 경험이 없다면, 컨테이너 오케스트레이션을 어떻게 학습할 계획인가요?',
      order:         5,
      answer:        null,
    },
    {
      id:            'mock-q-0007',
      question_type: 'technical',
      question_text: 'RESTful API 설계 시 버전 관리 전략을 어떻게 구성하셨나요?',
      order:         6,
      answer:        null,
    },
    {
      id:            'mock-q-0008',
      question_type: 'experience',
      question_text: '배달 플랫폼 프로젝트에서 가장 어려웠던 기술적 문제와 해결 과정을 설명해주세요.',
      order:         7,
      answer:        null,
    },
    {
      id:            'mock-q-0009',
      question_type: 'experience',
      question_text: 'PostgreSQL과 Redis를 함께 사용할 때 데이터 정합성을 어떻게 관리하셨나요?',
      order:         8,
      answer:        null,
    },
    {
      id:            'mock-q-0010',
      question_type: 'experience',
      question_text: '성능 개선 작업을 진행할 때 지표를 어떻게 측정하고 검증하셨나요?',
      order:         9,
      answer:        null,
    },
  ],
}
