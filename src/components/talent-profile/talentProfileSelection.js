export const MAX_SELECTED_TRAITS = 5;

export function normalizeSelectedItems(items = []) {
  return items.map((item, index) => ({ ...item, priority_order: index + 1 }));
}

export function isTraitSelected(selectedItems, traitCode) {
  return selectedItems.some((item) => item.trait_code === traitCode);
}

export function addTraitSelection(selectedItems, trait) {
  if (isTraitSelected(selectedItems, trait.trait_code)) return selectedItems;
  if (selectedItems.length >= MAX_SELECTED_TRAITS) return selectedItems;
  return normalizeSelectedItems([
    ...selectedItems,
    {
      trait_id: trait.trait_id,
      trait_code: trait.trait_code,
      trait_name: trait.trait_name,
      category_code: trait.category_code,
      category_name: trait.category_name,
      priority_order: selectedItems.length + 1,
      custom_description: '',
    },
  ]);
}

export function removeTraitSelection(selectedItems, traitCode) {
  return normalizeSelectedItems(selectedItems.filter((item) => item.trait_code !== traitCode));
}

export function moveTraitSelection(selectedItems, traitCode, direction) {
  const index = selectedItems.findIndex((item) => item.trait_code === traitCode);
  if (index < 0) return selectedItems;
  const target = direction === 'up' ? index - 1 : index + 1;
  if (target < 0 || target >= selectedItems.length) return selectedItems;
  const next = [...selectedItems];
  [next[index], next[target]] = [next[target], next[index]];
  return normalizeSelectedItems(next);
}

export function updateTraitDescription(selectedItems, traitCode, customDescription) {
  return selectedItems.map((item) => (
    item.trait_code === traitCode ? { ...item, custom_description: customDescription } : item
  ));
}

export function buildTalentProfilePayload({ sourceType = 'USER_DEFINED', customSummary = '', confirmedByUser = false, selectedItems = [] }) {
  return {
    source_type: sourceType,
    source_text: null,
    custom_summary: customSummary,
    confirmed_by_user: confirmedByUser,
    items: normalizeSelectedItems(selectedItems).map((item) => ({
      trait_code: item.trait_code,
      priority_order: item.priority_order,
      custom_description: item.custom_description || '',
    })),
  };
}

export function initializeSelectedItems(profile) {
  return normalizeSelectedItems((profile?.items || []).map((item) => ({
    trait_id: item.trait_id,
    trait_code: item.trait_code,
    trait_name: item.trait_name,
    category_code: item.category_code,
    category_name: item.category_name,
    priority_order: item.priority_order,
    custom_description: item.custom_description || '',
  })).sort((a, b) => a.priority_order - b.priority_order));
}
