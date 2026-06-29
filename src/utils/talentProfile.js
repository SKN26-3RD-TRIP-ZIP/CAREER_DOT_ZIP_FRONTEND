export const TALENT_PROFILE_STEPS = ['JD 입력', '인재상 설정', '이력서', '자기소개서·프로젝트', '완료'];
export const CUSTOM_SUMMARY_MAX_LENGTH = 1000;

export function getCreatedJdId(data) {
  return data?.jd_id ?? data?.id ?? data?.jd?.jd_id ?? data?.jd?.id ?? null;
}

export function normalizeTalentProfileCatalog(data) {
  const rawCategories = data?.categories || data?.results || data || [];
  if (!Array.isArray(rawCategories)) return [];

  return rawCategories.map((category, index) => {
    const categoryCode = category.category_code || category.code || category.id || `category-${index + 1}`;
    const categoryName = category.category_name || category.name || category.label || categoryCode;
    const traits = Array.isArray(category.traits) ? category.traits : [];

    return {
      ...category,
      category_code: categoryCode,
      category_name: categoryName,
      traits: traits.map((trait, traitIndex) => {
        const traitCode = trait.trait_code || trait.code || trait.id || `${categoryCode}-trait-${traitIndex + 1}`;
        return {
          ...trait,
          trait_id: trait.trait_id || trait.id || traitCode,
          trait_code: traitCode,
          trait_name: trait.trait_name || trait.name || trait.label || traitCode,
          category_code: categoryCode,
          category_name: categoryName,
          short_description: trait.short_description || trait.description || '',
        };
      }),
    };
  });
}
