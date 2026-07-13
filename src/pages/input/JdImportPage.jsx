import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyzeJobUrl, ocrUploadJd, updateJd } from '../../api/jdAnalysisApi';
import {
  isLikelyHttpUrl,
  urlAnalysisErrorMessage,
  validateOcrFile,
  ocrErrorMessage,
  isOcrEnvRequired,
  confidenceText,
  jdFieldsFromResponse,
  buildJdPatchBody,
} from '../../utils/jdAnalysis';
import {
  PageShell,
  Card,
  Button,
  Alert,
  Field,
  inputClass,
  LoadingState,
  StatusBadge,
} from '../../components/ui/DemoLayout';

function saveErrorMessage(err) {
  const s = err?.response?.status;
  if (s === 404) return '수정할 JD를 찾을 수 없습니다. 다시 분석해 주세요.';
  if (s === 400) {
    const d = err?.response?.data;
    if (d && typeof d === 'object') {
      const k = Object.keys(d)[0];
      const v = d[k];
      if (Array.isArray(v) && v.length) return String(v[0]);
      if (typeof v === 'string') return v;
    }
    return '입력값을 확인해 주세요. (회사명·직무명은 비울 수 없습니다)';
  }
  if (!err?.response) return '네트워크 오류로 저장하지 못했습니다.';
  return '저장에 실패했습니다. 잠시 후 다시 시도해 주세요.';
}

export default function JdImportPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('url');
  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [envNote, setEnvNote] = useState('');
  const [result, setResult] = useState(null);

  // 수정 가능한 필드 (백엔드 PATCH 허용: company_name/position/job_requirements/keywords)
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveNotice, setSaveNotice] = useState('');
  const [saveError, setSaveError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const applyResult = (data) => {
    const r = jdFieldsFromResponse(data);
    setResult(r);
    setForm({
      company: r.company || '',
      position: r.position || '',
      requirements: r.requirements || '',
      keywords: r.techStacks.join(', '),
    });
    setSaveNotice(''); setSaveError('');
  };

  const reset = () => { setResult(null); setForm(null); setError(''); setEnvNote(''); setSaveNotice(''); setSaveError(''); };

  const handleAnalyzeUrl = async () => {
    setError(''); setEnvNote('');
    if (!isLikelyHttpUrl(url)) { setError('http 또는 https 로 시작하는 올바른 채용공고 URL을 입력해 주세요.'); return; }
    setLoading(true);
    try {
      const res = await analyzeJobUrl({ url: url.trim(), company_name: company.trim(), position: position.trim() });
      applyResult(res.data);
    } catch (err) {
      setError(urlAnalysisErrorMessage(err));
    } finally { setLoading(false); }
  };

  const handlePickFile = (e) => {
    const f = e.target.files?.[0] || null;
    setError(''); setEnvNote(''); reset();
    if (!f) { setFile(null); setPreviewUrl(''); return; }
    const v = validateOcrFile(f);
    if (!v.ok) { setError(v.error); setFile(null); setPreviewUrl(''); if (fileInputRef.current) fileInputRef.current.value = ''; return; }
    setFile(f);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(f.type.startsWith('image/') ? URL.createObjectURL(f) : '');
  };

  const handleOcrUpload = async () => {
    setError(''); setEnvNote('');
    const v = validateOcrFile(file);
    if (!v.ok) { setError(v.error); return; }
    setLoading(true);
    try {
      const res = await ocrUploadJd(file, { company_name: company.trim(), position: position.trim() });
      applyResult(res.data);
    } catch (err) {
      if (isOcrEnvRequired(err)) setEnvNote('이미지 OCR Provider 미설정 (LIVE_E2E_ENV_REQUIRED). PDF는 텍스트 추출로 동작합니다.');
      setError(ocrErrorMessage(err));
    } finally { setLoading(false); }
  };

  // navigateAfter=true 면 저장 성공 후에만 인재상 설정으로 이동 (실패 시 이동하지 않음)
  const saveEdits = async (navigateAfter) => {
    if (!result?.jdId || saving) return false;
    setSaving(true); setSaveNotice(''); setSaveError('');
    try {
      const res = await updateJd(result.jdId, buildJdPatchBody(form));
      applyResult(res.data);
      setSaveNotice('수정 내용을 저장했습니다.');
      if (navigateAfter) {
        localStorage.setItem('careerzip_selected_jd_id', String(result.jdId));
        navigate(`/input/jd/${result.jdId}/talent-profile`);
      }
      return true;
    } catch (err) {
      setSaveError(saveErrorMessage(err));
      return false;
    } finally { setSaving(false); }
  };

  const useWithoutEdit = () => {
    if (!result?.jdId) return;
    localStorage.setItem('careerzip_selected_jd_id', String(result.jdId));
    navigate(`/input/jd/${result.jdId}/talent-profile`);
  };

  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <PageShell
      activeNav="자료 입력"
      title="채용공고 가져오기"
      description="채용공고 URL을 분석하거나 이미지를 업로드해 JD를 자동 생성하고, 추출 결과를 수정해 저장합니다."
      actions={<Button type="button" variant="secondary" onClick={() => navigate('/input/jd/new')}>직접 입력으로</Button>}
    >
      <div className="mb-5 flex gap-2">
        <button type="button" onClick={() => { setTab('url'); reset(); }} className={`rounded-lg px-4 py-2 text-sm font-black transition ${tab === 'url' ? 'bg-[#08CB00] text-[#EEEEEE]' : 'border border-[rgba(0,0,0,0.18)] text-[#253900]'}`}>URL 분석</button>
        <button type="button" onClick={() => { setTab('ocr'); reset(); }} className={`rounded-lg px-4 py-2 text-sm font-black transition ${tab === 'ocr' ? 'bg-[#08CB00] text-[#EEEEEE]' : 'border border-[rgba(0,0,0,0.18)] text-[#253900]'}`}>이미지 OCR</button>
      </div>

      <Card className="p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="회사명 (선택, 보정)"><input className={inputClass} value={company} onChange={(e) => setCompany(e.target.value)} placeholder="예: A사" /></Field>
          <Field label="직무명 (선택, 보정)"><input className={inputClass} value={position} onChange={(e) => setPosition(e.target.value)} placeholder="예: 백엔드 개발자" /></Field>
        </div>
        {tab === 'url' ? (
          <div className="mt-4 space-y-3">
            <Field label="채용공고 URL" required><input className={inputClass} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." /></Field>
            <Button type="button" onClick={handleAnalyzeUrl} disabled={loading}>{loading ? '분석 중...' : 'URL 분석'}</Button>
            <p className="text-xs text-[rgba(0,0,0,0.5)]">공개적으로 접근 가능한 채용공고만 분석합니다. 내부 주소·로그인 페이지는 분석할 수 없습니다.</p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <input ref={fileInputRef} type="file" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" onChange={handlePickFile} className="block w-full text-sm" />
            {previewUrl && <img src={previewUrl} alt="미리보기" className="max-h-56 rounded-lg border border-[rgba(0,0,0,0.12)]" />}
            <Button type="button" onClick={handleOcrUpload} disabled={loading || !file}>{loading ? '처리 중...' : 'OCR 분석'}</Button>
            <p className="text-xs text-[rgba(0,0,0,0.5)]">PNG·JPG·JPEG·PDF, 최대 10MB. 결과를 확인·수정한 뒤 저장하세요.</p>
          </div>
        )}
        {envNote && <Alert tone="info" className="mt-3">{envNote}</Alert>}
        {error && <Alert tone="danger" className="mt-3">{error}</Alert>}
      </Card>

      {loading && <LoadingState title="채용공고를 분석하는 중입니다" />}

      {result && form && (
        <Card className="mt-6 p-6">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-black text-[#253900]">추출 결과 (수정 가능)</h2>
            <StatusBadge tone="success">추출 신뢰도 {confidenceText(result.confidence)}</StatusBadge>
          </div>
          {result.requiresUserConfirmation && (
            <Alert tone="warning" className="mt-3">OCR 추출 결과는 부정확할 수 있습니다. 내용을 확인·수정한 뒤 저장해 주세요.{result.ocrProvider ? ` (provider: ${result.ocrProvider})` : ''}</Alert>
          )}
          <p className="mt-2 text-xs text-[rgba(0,0,0,0.5)]">분석 시 JD가 생성되었습니다. 아래에서 수정한 뒤 "수정 내용 저장"을 누르면 반영됩니다.</p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="회사명"><input className={inputClass} value={form.company} onChange={setField('company')} /></Field>
            <Field label="직무명"><input className={inputClass} value={form.position} onChange={setField('position')} /></Field>
          </div>
          <div className="mt-4">
            <Field label="자격 요건"><textarea rows={3} className={inputClass} value={form.requirements} onChange={setField('requirements')} /></Field>
          </div>
          <div className="mt-4">
            <Field label="기술 키워드 (쉼표로 구분)"><input className={inputClass} value={form.keywords} onChange={setField('keywords')} placeholder="Python, Django, AWS" /></Field>
          </div>

          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            {[['주요 업무', result.mainTasks], ['우대 사항', result.preferences], ['출처 URL', result.sourceUrl], ['수집 시각', result.fetchedAt ? new Date(result.fetchedAt).toLocaleString('ko-KR') : '']].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-[rgba(0,0,0,0.1)] bg-[#EEEEEE] p-3">
                <dt className="text-xs font-bold text-[rgba(0,0,0,0.55)]">{label} (읽기 전용)</dt>
                <dd className="mt-1 break-words text-sm text-[#000000]">{value || <span className="text-[rgba(0,0,0,0.4)]">미제공</span>}</dd>
              </div>
            ))}
          </dl>

          {saveNotice && <Alert tone="info" className="mt-4">{saveNotice}</Alert>}
          {saveError && <Alert tone="danger" className="mt-4">{saveError}</Alert>}

          <p className="mt-4 text-sm font-bold text-[#253900]">저장 후 인재상 설정 화면으로 이동합니다.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" onClick={() => saveEdits(false)} disabled={saving}>{saving ? '저장 중...' : '수정 내용 저장'}</Button>
            <Button type="button" variant="secondary" onClick={() => saveEdits(true)} disabled={saving}>저장하고 인재상 설정으로</Button>
            <Button type="button" variant="ghost" onClick={useWithoutEdit} disabled={saving}>수정 없이 이 JD 사용</Button>
            <Button type="button" variant="ghost" onClick={reset} disabled={saving}>다시 분석</Button>
          </div>
        </Card>
      )}
    </PageShell>
  );
}
