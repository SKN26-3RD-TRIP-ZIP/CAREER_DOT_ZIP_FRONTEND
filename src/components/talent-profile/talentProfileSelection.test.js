import { describe, expect, it } from 'vitest';
import {
  MAX_SELECTED_TRAITS,
  addTraitSelection,
  buildTalentProfilePayload,
  initializeSelectedItems,
  isTraitSelected,
  moveTraitSelection,
  removeTraitSelection,
  updateTraitDescription,
} from './talentProfileSelection';

const trait = (n) => ({
  trait_id: n,
  trait_code: `T${n}`,
  trait_name: `Trait ${n}`,
  category_code: 'C1',
  category_name: 'Category',
});

describe('talentProfileSelection', () => {
  it('selects one trait and prevents duplicates', () => {
    const selected = addTraitSelection([], trait(1));
    expect(selected).toHaveLength(1);
    expect(isTraitSelected(selected, 'T1')).toBe(true);
    expect(addTraitSelection(selected, trait(1))).toHaveLength(1);
  });

  it('limits selection to five traits', () => {
    const selected = [1, 2, 3, 4, 5, 6].reduce((items, n) => addTraitSelection(items, trait(n)), []);
    expect(selected).toHaveLength(MAX_SELECTED_TRAITS);
    expect(selected.map((item) => item.priority_order)).toEqual([1, 2, 3, 4, 5]);
  });

  it('removes and reorders with continuous priority', () => {
    const selected = [1, 2, 3].reduce((items, n) => addTraitSelection(items, trait(n)), []);
    const removed = removeTraitSelection(selected, 'T2');
    expect(removed.map((item) => item.trait_code)).toEqual(['T1', 'T3']);
    expect(removed.map((item) => item.priority_order)).toEqual([1, 2]);

    const moved = moveTraitSelection(removed, 'T3', 'up');
    expect(moved.map((item) => item.trait_code)).toEqual(['T3', 'T1']);
    expect(moved.map((item) => item.priority_order)).toEqual([1, 2]);
  });

  it('keeps custom descriptions and builds save payload', () => {
    const selected = updateTraitDescription(addTraitSelection([], trait(1)), 'T1', 'A'.repeat(500));
    const payload = buildTalentProfilePayload({
      customSummary: 'summary',
      confirmedByUser: false,
      selectedItems: selected,
    });

    expect(payload.confirmed_by_user).toBe(false);
    expect(payload.custom_summary).toBe('summary');
    expect(payload.items).toEqual([
      { trait_code: 'T1', priority_order: 1, custom_description: 'A'.repeat(500) },
    ]);
  });

  it('restores saved profile order', () => {
    const restored = initializeSelectedItems({
      items: [
        { ...trait(2), priority_order: 2, custom_description: 'second' },
        { ...trait(1), priority_order: 1, custom_description: 'first' },
      ],
    });

    expect(restored.map((item) => item.trait_code)).toEqual(['T1', 'T2']);
    expect(restored.map((item) => item.custom_description)).toEqual(['first', 'second']);
  });
});
