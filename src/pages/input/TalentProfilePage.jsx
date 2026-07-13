import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Check, ChevronRight, MoveDown, MoveUp, X } from 'lucide-react';
import {
  Alert,
  Button,
  Card,
  EmptyState,
  PageShell,
  inputClass,
} from '../../components/ui/DemoLayout';
import Tooltip from '../../components/ui/Tooltip';
import {
  MAX_SELECTED_TRAITS,
  addTraitSelection,
  buildTalentProfilePayload,
  initializeSelectedItems,
  isTraitSelected,
  moveTraitSelection,
  removeTraitSelection,
  updateTraitDescription,
} from '../../components/talent-profile/talentProfileSelection';
import {
  getJdTalentProfile,
  getTalentProfileCatalog,
  saveJdTalentProfile,
} from '../../api/talentProfileApi';
import {
  CUSTOM_SUMMARY_MAX_LENGTH,
  normalizeTalentProfileCatalog,
} from '../../utils/talentProfile';

const cx = (...parts) => parts.filter(Boolean).join(' ');

function formatLoadError(error, scope) {
  const status = error?.response?.status;
  if (!error?.response) return `${scope} 중 네트워크 오류가 발생했습니다. Backend 실행 상태를 확인해주세요.`;
  if (status === 401) return '로그인이 만료되었습니다. 다시 로그인해주세요.';
  if (status === 403) return '이 JD에 접근할 권한이 없습니다.';
  if (status === 404) return '존재하지 않는 JD이거나 삭제된 JD입니다.';
  return `${scope}에 실패했습니다. (HTTP ${status})`;
}

function Skeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <div className="space-y-3 rounded-2xl border border-[rgba(0,0,0,0.08)] bg-[#EEEEEE] p-5">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="h-14 animate-pulse rounded-lg bg-[rgba(0,0,0,0.08)]" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-36 animate-pulse rounded-xl bg-[rgba(0,0,0,0.08)]" />
        ))}
      </div>
    </div>
  );
}

function CountBadge({ selectedCount, categoryCount, traitCount }) {
  return (
    <div className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-[#EEEEEE] px-5 py-4 text-right">
      <p className="text-3xl font-black text-[#08CB00]">{selectedCount} / {MAX_SELECTED_TRAITS}</p>
      <p className="mt-1 text-sm font-bold text-[rgba(0,0,0,0.60)]">3개 선택 권장</p>
      <p className="mt-2 text-xs font-semibold text-[rgba(0,0,0,0.50)]">카테고리 {categoryCount}개 · Trait {traitCount}개</p>
    </div>
  );
}

export default function TalentProfilePage() {
  const { jdId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [catalog, setCatalog] = useState([]);
  const [activeCategoryCode, setActiveCategoryCode] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [customSummary, setCustomSummary] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [toast, setToast] = useState('');
  const [saving, setSaving] = useState(false);

  const nextLogin = encodeURIComponent(`${location.pathname}${location.search}`);

  const traitCount = useMemo(
    () => catalog.reduce((sum, category) => sum + (category.traits?.length || 0), 0),
    [catalog],
  );
  const activeCategory = catalog.find((category) => category.category_code === activeCategoryCode) || catalog[0] || null;

  const redirectLogin = () => {
    navigate(`/auth/login?next=${nextLogin}`, { replace: true });
  };

  const load = async () => {
    if (!jdId) {
      setLoadError('JD ID가 없습니다. JD 입력 화면에서 다시 저장해주세요.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError('');
    setSaveError('');
    setToast('');

    let scope = '인재상 Catalog 조회';
    try {
      const catalogData = await getTalentProfileCatalog();
      const normalizedCatalog = normalizeTalentProfileCatalog(catalogData);
      setCatalog(normalizedCatalog);
      setActiveCategoryCode((prev) => prev || normalizedCatalog[0]?.category_code || '');

      scope = '기존 인재상 설정 조회';
      const profile = await getJdTalentProfile(jdId);
      setSelectedItems(initializeSelectedItems(profile));
      setCustomSummary(String(profile?.custom_summary || '').slice(0, CUSTOM_SUMMARY_MAX_LENGTH));
    } catch (error) {
      if (error?.response?.status === 401) {
        redirectLogin();
        return;
      }
      setLoadError(formatLoadError(error, scope));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jdId]);

  const toggleTrait = (trait) => {
    setSaveError('');
    setToast('');
    const selected = isTraitSelected(selectedItems, trait.trait_code);
    if (selected) {
      setSelectedItems(removeTraitSelection(selectedItems, trait.trait_code));
      return;
    }
    if (selectedItems.length >= MAX_SELECTED_TRAITS) {
      setSaveError('인재상 기준은 최대 5개까지 선택할 수 있습니다.');
      return;
    }
    setSelectedItems(addTraitSelection(selectedItems, trait));
  };

  const save = async (confirmedByUser) => {
    setSaveError('');
    setToast('');
    if (confirmedByUser && selectedItems.length === 0) {
      setSaveError('선택 완료 전 최소 1개 이상의 인재상 기준을 선택해주세요.');
      return;
    }

    setSaving(true);
    try {
      const payload = buildTalentProfilePayload({
        customSummary,
        confirmedByUser,
        selectedItems,
      });
      await saveJdTalentProfile(jdId, payload);
      const restored = await getJdTalentProfile(jdId);
      setSelectedItems(initializeSelectedItems(restored));
      setCustomSummary(String(restored?.custom_summary || '').slice(0, CUSTOM_SUMMARY_MAX_LENGTH));

      if (confirmedByUser) {
        window.localStorage.setItem('careerzip_selected_jd_id', String(jdId));
        navigate('/input');
      } else {
        setToast('인재상 기준이 임시 저장되었습니다.');
      }
    } catch (error) {
      if (error?.response?.status === 401) {
        redirectLogin();
        return;
      }
      setSaveError(formatLoadError(error, '인재상 기준 저장'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell
      activeNav="자료 입력"
      title="면접 연습에 반영할 인재상 기준을 선택해주세요"
      description="회사의 공식 인재상이 아닌, 사용자가 면접 연습을 위해 직접 설정한 인재상 기준입니다."
      maxWidth="max-w-7xl"
      actions={<CountBadge selectedCount={selectedItems.length} categoryCount={catalog.length} traitCount={traitCount} />}
    >
      {loading ? (
        <Skeleton />
      ) : loadError ? (
        <EmptyState title={loadError} description="문제가 계속되면 JD가 본인 계정에 속해 있는지 확인해주세요." actionLabel="Retry" onAction={load} />
      ) : catalog.length === 0 ? (
        <EmptyState title="선택 가능한 인재상 기준이 없습니다." description="Catalog API 응답이 비어 있습니다." actionLabel="Retry" onAction={load} />
      ) : (
        <div className="space-y-6">
          {toast && <Alert tone="success">{toast}</Alert>}
          {saveError && <Alert tone="danger">{saveError}</Alert>}

          <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
            <Card className="p-5">
              <h2 className="mb-4 text-sm font-black text-[#253900]">상위 인재상 영역</h2>
              <div className="space-y-2">
                {catalog.map((category) => {
                  const active = category.category_code === activeCategory?.category_code;
                  return (
                    <button
                      key={category.category_code}
                      type="button"
                      onClick={() => setActiveCategoryCode(category.category_code)}
                      className={cx(
                        'flex min-h-14 w-full items-center justify-between rounded-lg border px-4 text-left text-sm font-black transition focus:outline-none focus:ring-2 focus:ring-[rgba(8,203,0,0.30)]',
                        active ? 'border-[#08CB00] bg-[rgba(8,203,0,0.10)] text-[#253900]' : 'border-[rgba(0,0,0,0.12)] bg-[#EEEEEE] text-[#000000] hover:border-[#08CB00]',
                      )}
                    >
                      <span>{category.category_name}</span>
                      <ChevronRight size={18} aria-hidden="true" />
                    </button>
                  );
                })}
              </div>
            </Card>

            <section>
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-[#253900]">{activeCategory?.category_name}</h2>
                  <p className="mt-1 text-sm font-semibold text-[rgba(0,0,0,0.60)]">선택된 카테고리의 세부 인재상 기준입니다.</p>
                </div>
                <span className="text-sm font-black text-[#253900]">{activeCategory?.traits?.length || 0}개 Trait</span>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {(activeCategory?.traits || []).map((trait) => {
                  const selected = isTraitSelected(selectedItems, trait.trait_code);
                  const blocked = !selected && selectedItems.length >= MAX_SELECTED_TRAITS;
                  return (
                    <Tooltip key={trait.trait_code} text={trait.short_description || '설명 정보가 없습니다.'} className="w-full">
                      <button
                        type="button"
                        aria-pressed={selected}
                        aria-disabled={blocked}
                        onClick={() => toggleTrait(trait)}
                        className={cx(
                          'min-h-36 w-full rounded-xl border p-5 text-left transition focus:outline-none focus:ring-2 focus:ring-[rgba(8,203,0,0.30)]',
                          selected ? 'border-[#08CB00] bg-[rgba(8,203,0,0.10)]' : 'border-[rgba(0,0,0,0.12)] bg-[#EEEEEE] hover:border-[#08CB00]',
                          blocked && 'cursor-not-allowed opacity-45',
                        )}
                      >
                        <span className="flex items-start gap-3">
                          <span className={cx('mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded border', selected ? 'border-[#08CB00] bg-[#08CB00] text-[#EEEEEE]' : 'border-[rgba(0,0,0,0.25)]')}>
                            {selected && <Check size={16} aria-hidden="true" />}
                          </span>
                          <span>
                            <strong className="block text-lg font-black text-[#253900]">{trait.trait_name}</strong>
                            <span className="mt-3 block text-sm font-semibold leading-6 text-[rgba(0,0,0,0.62)]">{trait.short_description || '설명 정보가 없습니다.'}</span>
                          </span>
                        </span>
                      </button>
                    </Tooltip>
                  );
                })}
              </div>
            </section>
          </div>

          <Card className="p-5">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-black text-[#253900]">선택한 인재상 우선순위</h2>
              <p className="text-sm font-bold text-[rgba(0,0,0,0.60)]">우선순위는 항상 1부터 연속으로 저장됩니다.</p>
            </div>
            <div className="mt-4 grid gap-3">
              {selectedItems.length === 0 ? (
                <p className="rounded-lg border border-dashed border-[rgba(0,0,0,0.20)] p-5 text-sm font-bold text-[rgba(0,0,0,0.55)]">아직 선택한 인재상 기준이 없습니다.</p>
              ) : selectedItems.map((item, index) => (
                <div key={item.trait_code} className="grid gap-4 rounded-xl border border-[rgba(0,0,0,0.10)] bg-[#EEEEEE] p-4 lg:grid-cols-[96px_1fr_190px] lg:items-center">
                  <strong className="text-[#08CB00]">{index + 1}순위</strong>
                  <div>
                    <p className="text-base font-black text-[#253900]">{item.trait_name}</p>
                    <p className="mt-1 text-xs font-bold text-[rgba(0,0,0,0.55)]">{item.category_name}</p>
                    <label className="mt-3 block">
                      <span className="sr-only">{item.trait_name} 사용자 설명</span>
                      <input
                        value={item.custom_description || ''}
                        maxLength={500}
                        onChange={(event) => setSelectedItems(updateTraitDescription(selectedItems, item.trait_code, event.target.value.slice(0, 500)))}
                        placeholder="사용자 설명 입력 (최대 500자)"
                        className={inputClass}
                      />
                    </label>
                    <p className="mt-1 text-right text-xs font-semibold text-[rgba(0,0,0,0.45)]">{(item.custom_description || '').length} / 500</p>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button type="button" aria-label={`${item.trait_name} 위로 이동`} onClick={() => setSelectedItems(moveTraitSelection(selectedItems, item.trait_code, 'up'))} disabled={index === 0} className="rounded-lg border border-[rgba(0,0,0,0.18)] p-2 disabled:cursor-not-allowed disabled:opacity-40"><MoveUp size={18} /></button>
                    <button type="button" aria-label={`${item.trait_name} 아래로 이동`} onClick={() => setSelectedItems(moveTraitSelection(selectedItems, item.trait_code, 'down'))} disabled={index === selectedItems.length - 1} className="rounded-lg border border-[rgba(0,0,0,0.18)] p-2 disabled:cursor-not-allowed disabled:opacity-40"><MoveDown size={18} /></button>
                    <button type="button" aria-label={`${item.trait_name} 선택 해제`} onClick={() => setSelectedItems(removeTraitSelection(selectedItems, item.trait_code))} className="rounded-lg border border-[rgba(0,0,0,0.18)] p-2"><X size={18} /></button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <label className="block">
              <span className="text-xl font-black text-[#253900]">전체 요약</span>
              <textarea
                value={customSummary}
                maxLength={CUSTOM_SUMMARY_MAX_LENGTH}
                onChange={(event) => setCustomSummary(event.target.value.slice(0, CUSTOM_SUMMARY_MAX_LENGTH))}
                className={`${inputClass} mt-4 min-h-32`}
                placeholder="선택한 인재상 기준을 바탕으로 면접 연습에서 중점적으로 보고 싶은 기준을 작성해주세요."
              />
            </label>
            <p className="mt-2 text-right text-xs font-semibold text-[rgba(0,0,0,0.45)]">{customSummary.length} / {CUSTOM_SUMMARY_MAX_LENGTH}</p>
          </Card>

          <div className="flex flex-col-reverse gap-3 border-t border-[rgba(0,0,0,0.08)] pt-6 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="secondary" onClick={() => navigate('/input/jd')} disabled={saving}>이전</Button>
            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="secondary" onClick={() => save(false)} disabled={saving}>{saving ? '저장 중...' : '임시 저장'}</Button>
              <Button type="button" onClick={() => save(true)} disabled={saving}>{saving ? '저장 중...' : '선택 완료'}</Button>
            </div>
          </div>
        </div>
      )}

    </PageShell>
  );
}
