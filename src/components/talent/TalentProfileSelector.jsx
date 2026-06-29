import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { getTalentCatalog } from '../../api/analysisApi'

// ── Tooltip ──────────────────────────────────────────────────────────────────
function InfoTooltip({ text }) {
  const [visible, setVisible] = useState(false)
  const timerRef = useRef(null)

  const show = () => {
    timerRef.current = setTimeout(() => setVisible(true), 200)
  }
  const hide = () => {
    clearTimeout(timerRef.current)
    setVisible(false)
  }

  if (!text) return null

  return (
    <span
      className="relative inline-block"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      tabIndex={0}
      aria-describedby={visible ? 'talent-tooltip' : undefined}
    >
      <span className="ml-1 inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-[rgba(0,0,0,0.25)] text-[10px] text-[rgba(0,0,0,0.45)]">?</span>
      {visible && (
        <span
          id="talent-tooltip"
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-56 -translate-x-1/2 rounded-lg bg-[#253900] px-3 py-2 text-xs leading-relaxed text-[#EEEEEE] shadow-lg"
        >
          {text}
          <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-[#253900]" />
        </span>
      )}
    </span>
  )
}

// ── 선택 태그 ─────────────────────────────────────────────────────────────────
function SelectedTag({ item, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[#253900] bg-[#08CB00] px-2.5 py-0.5 text-xs font-bold text-[#000000]">
      {item.priority_order}순위: {item.trait_name}
      <button
        type="button"
        className="ml-0.5 rounded-full hover:bg-[rgba(0,0,0,0.1)]"
        onClick={() => onRemove(item.trait_code)}
        aria-label={`${item.trait_name} 제거`}
      >
        <X size={11} />
      </button>
    </span>
  )
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────
/**
 * 인재상 카탈로그를 불러와 사용자가 최대 5개를 선택하는 UI.
 *
 * Props:
 *   sourceType        - "OFFICIAL" | "USER_DEFINED" | null
 *   onSourceTypeChange
 *   officialText      - 공식 인재상 원문
 *   onOfficialTextChange
 *   selectedItems     - [{trait_code, trait_name, priority_order, custom_description}]
 *   onSelectedChange
 */
export default function TalentProfileSelector({
  sourceType,
  onSourceTypeChange,
  officialText,
  onOfficialTextChange,
  selectedItems,
  onSelectedChange,
}) {
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    getTalentCatalog()
      .then((res) => {
        const cats = res.data || []
        setCategories(cats)
        if (cats.length > 0) setSelectedCategory(cats[0].category_code)
      })
      .catch(() => setError('인재상 목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }, [])

  const currentCategory = categories.find((c) => c.category_code === selectedCategory)

  const isChecked = (traitCode) => selectedItems.some((i) => i.trait_code === traitCode)

  const handleCheck = (trait) => {
    if (isChecked(trait.trait_code)) {
      onSelectedChange(
        selectedItems
          .filter((i) => i.trait_code !== trait.trait_code)
          .map((i, idx) => ({ ...i, priority_order: idx + 1 }))
      )
      return
    }
    if (selectedItems.length >= 5) {
      alert('최대 5개까지 선택 가능합니다.')
      return
    }
    onSelectedChange([
      ...selectedItems,
      {
        trait_code: trait.trait_code,
        trait_name: trait.trait_name,
        priority_order: selectedItems.length + 1,
        custom_description: '',
      },
    ])
  }

  const handleRemove = (traitCode) => {
    onSelectedChange(
      selectedItems
        .filter((i) => i.trait_code !== traitCode)
        .map((i, idx) => ({ ...i, priority_order: idx + 1 }))
    )
  }

  return (
    <div className="space-y-4">
      {/* 인재상 공개 여부 */}
      <fieldset className="space-y-2">
        <legend className="text-sm font-bold text-[#253900]">지원 회사의 인재상 정보를 알고 있나요?</legend>
        <div className="space-y-1.5">
          {[
            { value: 'OFFICIAL', label: '회사가 공식 인재상을 공개했습니다.' },
            { value: 'USER_DEFINED', label: '공식 인재상이 없어 직접 설정하겠습니다.' },
            { value: 'USER_DEFINED_UNKNOWN', label: '잘 모르겠습니다.' },
          ].map((opt) => (
            <label key={opt.value} className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                name="talent-source-type"
                value={opt.value}
                checked={sourceType === opt.value}
                onChange={() => onSourceTypeChange(opt.value)}
                className="accent-[#253900]"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </fieldset>

      {/* 공식 인재상 원문 입력 */}
      {sourceType === 'OFFICIAL' && (
        <div>
          <label className="mb-1 block text-xs font-bold text-[rgba(0,0,0,0.6)]">공식 인재상 원문</label>
          <textarea
            className="w-full rounded-lg border border-[rgba(0,0,0,0.18)] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#253900] min-h-[100px] resize-y"
            placeholder="회사 홈페이지나 공고에서 확인한 인재상 내용을 입력해주세요."
            maxLength={2000}
            value={officialText}
            onChange={(e) => onOfficialTextChange(e.target.value)}
          />
        </div>
      )}

      {/* 2단 인재상 선택 UI */}
      {sourceType !== 'OFFICIAL' && (
        <>
          {loading && <p className="text-xs text-[rgba(0,0,0,0.5)]">인재상 목록을 불러오는 중...</p>}
          {error && <p className="text-xs text-red-500">{error}</p>}
          {!loading && !error && (
            <div className="rounded-lg border border-[rgba(0,0,0,0.12)] overflow-hidden">
              <div className="grid grid-cols-[160px_1fr]">
                {/* 왼쪽: 상위 영역 */}
                <div className="border-r border-[rgba(0,0,0,0.10)] bg-[#f7f7f4]">
                  <p className="border-b border-[rgba(0,0,0,0.08)] px-3 py-2 text-[11px] font-black uppercase tracking-wide text-[rgba(0,0,0,0.4)]">영역</p>
                  {categories.map((cat) => {
                    const hasSelected = selectedItems.some((si) =>
                      cat.traits?.some((t) => t.trait_code === si.trait_code)
                    )
                    return (
                      <button
                        key={cat.category_code}
                        type="button"
                        onClick={() => setSelectedCategory(cat.category_code)}
                        className={`group relative w-full px-3 py-2.5 text-left text-xs transition ${
                          selectedCategory === cat.category_code
                            ? 'bg-[#253900] font-bold text-[#08CB00]'
                            : 'text-[rgba(0,0,0,0.7)] hover:bg-[rgba(0,0,0,0.05)]'
                        }`}
                      >
                        <span className="flex items-center justify-between gap-1">
                          <span className="leading-4">{cat.category_name}</span>
                          {hasSelected && (
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#08CB00]" />
                          )}
                        </span>
                        <InfoTooltip text={cat.short_description} />
                      </button>
                    )
                  })}
                </div>

                {/* 오른쪽: 세부 인재상 */}
                <div className="max-h-56 overflow-y-auto">
                  <p className="sticky top-0 border-b border-[rgba(0,0,0,0.08)] bg-white px-4 py-2 text-[11px] font-black uppercase tracking-wide text-[rgba(0,0,0,0.4)]">세부 인재상</p>
                  {currentCategory?.traits?.map((trait) => {
                    const checked = isChecked(trait.trait_code)
                    return (
                      <label
                        key={trait.trait_code}
                        className={`flex cursor-pointer items-start gap-3 px-4 py-3 transition hover:bg-[rgba(0,0,0,0.03)] ${
                          checked ? 'bg-[rgba(8,203,0,0.06)]' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="mt-0.5 shrink-0 accent-[#253900]"
                          checked={checked}
                          onChange={() => handleCheck(trait)}
                        />
                        <span>
                          <span className="flex items-center gap-1 text-sm font-bold text-[#000000]">
                            {trait.trait_name}
                            <InfoTooltip text={trait.short_description} />
                          </span>
                          <span className="mt-0.5 block text-xs leading-relaxed text-[rgba(0,0,0,0.5)]">
                            {trait.short_description}
                          </span>
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 선택 현황 */}
          <div>
            <p className="mb-2 text-xs text-[rgba(0,0,0,0.55)]">
              선택된 인재상 <span className="font-bold text-[#253900]">{selectedItems.length}/5</span>
              <span className="ml-1 text-[rgba(0,0,0,0.4)]">(권장: 3개)</span>
            </p>
            {selectedItems.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedItems.map((item) => (
                  <SelectedTag key={item.trait_code} item={item} onRemove={handleRemove} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
