import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import {
  CUSTOM_SUMMARY_MAX_LENGTH,
  getCreatedJdId,
  normalizeTalentProfileCatalog,
} from '../../utils/talentProfile';

describe('TalentProfilePage helpers', () => {
  it('extracts the real backend JD id without inventing a fallback', () => {
    expect(getCreatedJdId({ jd_id: 'jd-1' })).toBe('jd-1');
    expect(getCreatedJdId({ id: 'jd-2' })).toBe('jd-2');
    expect(getCreatedJdId({ jd: { jd_id: 'jd-3' } })).toBe('jd-3');
    expect(getCreatedJdId({ jd: { id: 'jd-4' } })).toBe('jd-4');
    expect(getCreatedJdId({})).toBeNull();
  });

  it('normalizes catalog categories and traits from API response data', () => {
    const catalog = normalizeTalentProfileCatalog({
      categories: Array.from({ length: 8 }, (_, categoryIndex) => ({
        category_code: `C${categoryIndex + 1}`,
        category_name: `Category ${categoryIndex + 1}`,
        traits: Array.from({ length: 4 }, (_, traitIndex) => ({
          trait_code: `C${categoryIndex + 1}T${traitIndex + 1}`,
          trait_name: `Trait ${traitIndex + 1}`,
          short_description: 'short',
        })),
      })),
    });

    expect(catalog).toHaveLength(8);
    expect(catalog.flatMap((category) => category.traits)).toHaveLength(32);
    expect(catalog.every((category) => category.traits.length === 4)).toBe(true);
    expect(catalog[0].traits[0]).toMatchObject({
      category_code: 'C1',
      category_name: 'Category 1',
      trait_code: 'C1T1',
      trait_name: 'Trait 1',
    });
  });

  it('supports result arrays and keeps a summary length contract for the UI', () => {
    const catalog = normalizeTalentProfileCatalog({
      results: [
        {
          code: 'execution',
          name: '실행과 책임',
          traits: [{ code: 'ownership', name: '오너십', description: '책임 있게 실행합니다.' }],
        },
      ],
    });

    expect(catalog[0].category_code).toBe('execution');
    expect(catalog[0].traits[0].trait_code).toBe('ownership');
    expect(CUSTOM_SUMMARY_MAX_LENGTH).toBeGreaterThanOrEqual(500);
  });
});

describe('TalentProfilePage route', () => {
  it('renders the operating page and preserves the jdId route parameter', async () => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });

    const { default: TalentProfilePage } = await import('./TalentProfilePage.jsx');
    const html = renderToString(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/input/jd/jd-route-123/talent-profile'] },
        React.createElement(
          Routes,
          null,
          React.createElement(Route, {
            path: '/input/jd/:jdId/talent-profile',
            element: React.createElement(TalentProfilePage),
          }),
        ),
      ),
    );

    expect(html).toContain('면접 연습에 반영할 인재상 기준을 선택해주세요');
    expect(html).toContain('jd-route-123');
    vi.unstubAllGlobals();
  }, 10000);
});
