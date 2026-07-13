import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import jdApi from '../../api/jdApi';
import { toUserMessage } from '../../api/errors';
import { useJdStore } from '../../store/jdStore';
import {
  Alert,
  Button,
  Card,
  EmptyState,
  LoadingState,
  PageShell,
  StatusBadge,
} from '../../components/ui/DemoLayout';

function normalizeList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function getJdId(jd) {
  return jd?.jd_id ?? jd?.id;
}

function getTitle(jd) {
  const parts = [jd?.company_name, jd?.position].filter(Boolean);
  return parts.length ? parts.join(' · ') : jd?.title || jd?.name || `JD #${getJdId(jd)}`;
}

function formatDate(value) {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value).slice(0, 10);
  return parsed.toLocaleDateString('ko-KR');
}

function toCommaText(value) {
  if (!value) return '';
  if (Array.isArray(value)) return value.filter(Boolean).join(', ');
  return String(value);
}

export default function JdManagementPage() {
  const navigate = useNavigate();
  const { jdId, setJd } = useJdStore();
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState(() => String(jdId || localStorage.getItem('careerzip_selected_jd_id') || ''));
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const selectedItem = useMemo(
    () => items.find((item) => String(getJdId(item)) === String(selectedId)),
    [items, selectedId],
  );
  const displayItems = useMemo(() => {
    if (!selectedId) return items;
    return [...items].sort((a, b) => {
      const aSelected = String(getJdId(a)) === String(selectedId);
      const bSelected = String(getJdId(b)) === String(selectedId);
      if (aSelected === bSelected) return 0;
      return aSelected ? -1 : 1;
    });
  }, [items, selectedId]);

  const loadJds = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await jdApi.getJds();
      const list = normalizeList(data);
      setItems(list);
      if (!selectedId && list.length) {
        const firstId = getJdId(list[0]);
        if (firstId) setSelectedId(String(firstId));
      }
    } catch (err) {
      setError(toUserMessage(err, 'JD 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = (item) => {
    const id = getJdId(item);
    if (!id) return;
    const nextId = String(id);
    setSelectedId(nextId);
    setJd(nextId, item);
    localStorage.setItem('careerzip_selected_jd_id', nextId);
    localStorage.setItem('careerzip_temp_jd_id', nextId);
    setNotice('면접 준비에 사용할 JD로 선택했습니다.');
  };

  const handleDelete = async (item) => {
    const id = getJdId(item);
    if (!id || deletingId) return;
    if (!window.confirm('이 JD를 삭제할까요? 삭제 후에는 되돌릴 수 없습니다.')) return;

    setDeletingId(String(id));
    setError('');
    setNotice('');
    try {
      await jdApi.deleteJd(id);
      const deletedId = String(id);
      if (selectedId === deletedId) {
        setSelectedId('');
        localStorage.removeItem('careerzip_selected_jd_id');
        localStorage.removeItem('careerzip_temp_jd_id');
      }
      setItems((prev) => prev.filter((entry) => String(getJdId(entry)) !== deletedId));
      setNotice('JD를 삭제했습니다.');
    } catch (err) {
      setError(toUserMessage(err, 'JD 삭제에 실패했습니다. 잠시 후 다시 시도해주세요.'));
    } finally {
      setDeletingId('');
    }
  };

  return (
    <PageShell
      activeNav="자료 입력"
      title="JD 관리"
      description="등록된 JD를 확인하고 면접 준비에 사용할 JD를 선택합니다. 새 JD를 등록하거나 URL·이미지로 가져올 수도 있습니다."
      maxWidth="max-w-[1220px]"
      actions={
        <>
          <Button as={Link} to="/input/jd-import" variant="secondary">
            URL·이미지로 가져오기
          </Button>
          <Button as={Link} to="/input/jd/new">
            새 JD 등록
          </Button>
        </>
      }
    >
      {notice && <Alert tone="success" className="mb-4">{notice}</Alert>}
      {error && <Alert tone="danger" className="mb-4">{error}</Alert>}

      {loading ? (
        <LoadingState title="JD 목록을 불러오는 중입니다" description="저장된 채용공고를 확인하고 있습니다." />
      ) : items.length === 0 ? (
        <EmptyState
          title="등록된 JD가 없습니다"
          description="직접 입력, 합성 공고 검색, PDF 업로드 중 하나로 면접 질문의 기준이 될 JD를 먼저 등록해주세요."
          actionLabel="새 JD 등록"
          actionTo="/input/jd/new"
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-3">
            {displayItems.map((item) => {
              const id = getJdId(item);
              const isSelected = String(id) === String(selectedId);
              const techText = toCommaText(item.tech_stacks || item.tech_stack || item.keywords);
              return (
                <Card
                  key={id || getTitle(item)}
                  className={`p-5 transition-colors ${
                    isSelected
                      ? 'border-[#05a800] bg-[#f0fgg0] shadow-[0_10px_24px_rgba(5,168,0,0.14)] ring-2 ring-[#b8f5b5]'
                      : ''
                  }`}
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <button
                      type="button"
                      onClick={() => handleSelect(item)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-black text-[#253900]">{getTitle(item)}</h2>
                        {isSelected && <StatusBadge tone="success">선택됨</StatusBadge>}
                      </div>
                      <dl className="mt-3 grid gap-2 text-sm text-[rgba(0,0,0,0.65)] sm:grid-cols-2">
                        <div>
                          <dt className="font-black text-[#253900]">직무 카테고리</dt>
                          <dd>{item.job_category || item.category || '-'}</dd>
                        </div>
                        <div>
                          <dt className="font-black text-[#253900]">경력 구분</dt>
                          <dd>{item.experience_level || item.career_level || '-'}</dd>
                        </div>
                        <div>
                          <dt className="font-black text-[#253900]">최종수정일</dt>
                          <dd>{formatDate(item.updated_at || item.created_at)}</dd>
                        </div>
                        <div>
                          <dt className="font-black text-[#253900]">기술 스택</dt>
                          <dd className="break-words">{techText || '-'}</dd>
                        </div>
                      </dl>
                    </button>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Button type="button" variant="secondary" onClick={() => handleSelect(item)}>
                        사용 JD 선택
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => navigate(`/input/jd/${id}/edit`)}
                        disabled={!id}
                      >
                        수정
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => navigate(`/input/jd/${id}/talent-profile`)}
                        disabled={!id}
                      >
                        인재상 설정
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="px-3"
                        onClick={() => handleDelete(item)}
                        disabled={!id || deletingId === String(id)}
                        title="JD 삭제"
                      >
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <Card className="h-fit p-5">
            <h2 className="text-lg font-black text-[#253900]">선택 요약</h2>
            {selectedItem ? (
              <div className="mt-4 space-y-3 text-sm">
                <p className="text-xl font-black text-[#08CB00]">{getTitle(selectedItem)}</p>
                <p className="leading-6 text-[rgba(0,0,0,0.65)]">
                  이 JD가 AI 분석, 면접 질문 생성, 면접 설정에서 기본 선택값으로 사용됩니다.
                </p>
                <Button
                  type="button"
                  className="w-full"
                  onClick={() => navigate(`/input/jd/${getJdId(selectedItem)}/talent-profile`)}
                >
                  인재상 확인하기
                </Button>
              </div>
            ) : (
              <p className="mt-4 text-sm leading-6 text-[rgba(0,0,0,0.6)]">
                목록에서 사용할 JD를 선택해주세요.
              </p>
            )}
          </Card>
        </div>
      )}
    </PageShell>
  );
}
