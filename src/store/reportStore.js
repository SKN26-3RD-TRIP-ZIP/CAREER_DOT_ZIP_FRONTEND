import { create } from 'zustand';

/**
 * 리포트 화면의 UI 상태 (서버 데이터는 react-query 가 관리).
 * - 로드맵 체크 상태(로컬 토글)
 * - 선택된 로드맵 항목(오늘의 연습 질문 패널 연동)
 */
export const useReportStore = create((set) => ({
  checkedRoadmapIds: [],
  selectedRoadmapId: null,

  setSelectedRoadmapId: (selectedRoadmapId) => set({ selectedRoadmapId }),

  toggleRoadmapChecked: (id) =>
    set((state) => ({
      checkedRoadmapIds: state.checkedRoadmapIds.includes(id)
        ? state.checkedRoadmapIds.filter((x) => x !== id)
        : [...state.checkedRoadmapIds, id],
    })),

  resetRoadmapState: () => set({ checkedRoadmapIds: [], selectedRoadmapId: null }),
}));
