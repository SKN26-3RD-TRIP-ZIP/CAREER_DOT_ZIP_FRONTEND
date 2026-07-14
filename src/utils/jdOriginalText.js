const SECTION_KEYS = {
  '직무 카테고리': 'job_category',
  '경력 구분': 'experience_level',
  '기술스택': 'tech_stacks',
  '주요업무': 'main_tasks',
  '자격요건': 'requirements',
  '우대사항': 'preferences',
  '추가 설명': 'jd_text',
};

const SECTION_PATTERN = /^\[(직무 카테고리|경력 구분|기술스택|주요업무|자격요건|우대사항|추가 설명)\]\s*(.*)$/;

export function parseJdOriginalText(value) {
  const text = String(value || '').replace(/\r\n?/g, '\n').trim();
  if (!text) return { hasStructuredSections: false, jd_text: '' };

  const sections = {};
  const unstructured = [];
  let currentKey = null;
  let hasStructuredSections = false;

  text.split('\n').forEach((line) => {
    const match = line.match(SECTION_PATTERN);
    if (match) {
      hasStructuredSections = true;
      currentKey = SECTION_KEYS[match[1]];
      sections[currentKey] = match[2] ? [match[2]] : [];
      return;
    }

    if (currentKey) sections[currentKey].push(line);
    else unstructured.push(line);
  });

  if (!hasStructuredSections) {
    return { hasStructuredSections: false, jd_text: text };
  }

  const result = { hasStructuredSections: true };
  Object.entries(sections).forEach(([key, lines]) => {
    result[key] = lines.join('\n').trim();
  });
  if (!result.jd_text && unstructured.length) result.jd_text = unstructured.join('\n').trim();
  result.jd_text ||= '';
  return result;
}

