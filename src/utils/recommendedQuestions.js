/**
 * 약점(weakness) 텍스트 → 추천 연습 질문 정적 매핑.
 * LLM 호출 없음. 키워드 포함 여부로 매핑하고, 매칭이 없으면 일반 질문으로 fallback.
 *
 * 사용처: 리포트 상세 / 마이페이지 (약점 기반 추천 연습 질문)
 */

// 키워드 → 추천 질문. 위에서부터 먼저 매칭된 항목 우선.
const RULES = [
  { keywords: ['구체', '추상', '모호', '두루뭉술', '디테일'], question: '프로젝트에서 본인이 직접 기여한 부분을 수치와 함께 구체적으로 설명해주세요.' },
  { keywords: ['수치', '정량', '성과', '결과'], question: '담당했던 작업의 성과를 정량적 수치(%, 시간, 규모)로 설명해보세요.' },
  { keywords: ['기술', '깊이', '원리', 'cs', '이해도', '지식'], question: '사용한 핵심 기술의 동작 원리를 면접관이 이해할 수 있게 설명해보세요.' },
  { keywords: ['직무', '연관', '관련성', '적합', '연결'], question: '해당 경험이 지원 직무와 어떻게 연결되는지 설명해주세요.' },
  { keywords: ['논리', '구조', '두서', '흐름', 'star'], question: 'STAR(상황-과제-행동-결과) 구조로 대표 경험 하나를 다시 설명해보세요.' },
  { keywords: ['협업', '소통', '커뮤니케이션', '팀'], question: '협업 중 갈등이나 의견 차이를 어떻게 조율했는지 사례로 설명해주세요.' },
  { keywords: ['문제', '해결', '트러블', '장애'], question: '가장 어려웠던 문제 상황과 그것을 해결한 과정을 단계별로 설명해주세요.' },
  { keywords: ['길이', '짧', '부족', '간단'], question: '핵심 답변에 배경·행동·결과를 더해 2~3문장 이상으로 확장해 설명해보세요.' },
];

const DEFAULT_QUESTIONS = [
  '대표 프로젝트에서 본인의 역할과 기여를 구체적으로 설명해주세요.',
  '사용한 기술을 선택한 이유와 트레이드오프를 설명해주세요.',
  '해당 경험이 지원 직무에 어떻게 도움이 되는지 설명해주세요.',
];

function toText(item) {
  if (item == null) return '';
  if (typeof item === 'string') return item;
  // 객체 형태( {tag, label, text, name, content} 등 ) 대응
  return String(item.text ?? item.label ?? item.tag ?? item.name ?? item.content ?? '');
}

/**
 * @param {Array|string} weaknesses 약점 목록(문자열/배열/객체배열 모두 허용)
 * @param {number} max 최대 추천 질문 수
 * @returns {Array<{weakness: string, question: string}>}
 */
export function getRecommendedQuestions(weaknesses, max = 3) {
  const list = Array.isArray(weaknesses)
    ? weaknesses
    : weaknesses
      ? [weaknesses]
      : [];

  const out = [];
  const usedQuestions = new Set();

  for (const raw of list) {
    const text = toText(raw).trim();
    if (!text) continue;
    const lower = text.toLowerCase();
    const rule = RULES.find((r) => r.keywords.some((k) => lower.includes(k.toLowerCase())));
    const question = rule ? rule.question : DEFAULT_QUESTIONS[out.length % DEFAULT_QUESTIONS.length];
    if (usedQuestions.has(question)) continue;
    usedQuestions.add(question);
    out.push({ weakness: text, question });
    if (out.length >= max) break;
  }

  // 약점이 없으면 일반 추천 질문으로 채움
  if (out.length === 0) {
    return DEFAULT_QUESTIONS.slice(0, max).map((question) => ({ weakness: '', question }));
  }
  return out;
}

export default getRecommendedQuestions;
