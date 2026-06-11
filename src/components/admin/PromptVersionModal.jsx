import { useEffect, useState } from 'react'
import { getVersions, createVersion, setDefaultVersion } from '../../api/adminApi'

function errorMessage(err) {
  const s = err?.response?.status
  if (s === 403) return '관리자 권한이 필요합니다.'
  if (s === 404) return '프롬프트 템플릿 또는 버전을 찾을 수 없습니다.'
  // 401 은 axios 전역 인터셉터에서 /auth/login 으로 처리됨
  return '요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.'
}

export default function PromptVersionModal({ template, open, onClose, onChanged }) {
  const templateId = template?.template_id
  const [versions, setVersions] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [newContent, setNewContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')

  const load = async () => {
    if (!templateId) return
    setLoading(true)
    setError('')
    try {
      const list = await getVersions(templateId) // mock 대체 없음
      const arr = Array.isArray(list) ? list : []
      setVersions(arr)
      setSelected(arr[0] ?? null)
    } catch (err) {
      setError(errorMessage(err))
      setVersions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open && templateId) {
      setNewContent('')
      setNotice('')
      load()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, templateId])

  if (!open || !template) return null

  const handleCreate = async () => {
    if (!newContent.trim()) {
      setError('새 버전 내용을 입력해주세요.')
      return
    }
    setSaving(true)
    setError('')
    setNotice('')
    try {
      await createVersion(templateId, { content: newContent.trim() })
      setNotice('새 버전이 저장되었습니다.')
      setNewContent('')
      await load()
      onChanged?.()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleSetDefault = async (versionId) => {
    setSaving(true)
    setError('')
    setNotice('')
    try {
      await setDefaultVersion(templateId, versionId)
      setNotice('기본 버전이 변경되었습니다.')
      await load()
      onChanged?.()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const defaultVersionId = template.default_version_id

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-bold text-slate-900">
            버전 관리 · {template.title}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        <div className="grid flex-1 grid-cols-1 gap-4 overflow-y-auto p-5 sm:grid-cols-2">
          {/* 버전 목록 */}
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#08CB00]">버전 목록</p>
            {loading ? (
              <p className="text-sm text-slate-400">불러오는 중...</p>
            ) : versions.length === 0 ? (
              <p className="text-sm text-slate-400">등록된 버전이 없습니다.</p>
            ) : (
              <ul className="space-y-2">
                {versions.map((v) => {
                  const isDefault = v.prompt_ver_id === defaultVersionId
                  const isSel = selected?.prompt_ver_id === v.prompt_ver_id
                  return (
                    <li
                      key={v.prompt_ver_id}
                      className={[
                        'cursor-pointer rounded-lg border px-3 py-2',
                        isSel ? 'border-[#08CB00] bg-green-50' : 'border-slate-200 hover:bg-slate-50',
                      ].join(' ')}
                      onClick={() => setSelected(v)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-800">v{v.version_number}</span>
                        {isDefault ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">기본</span>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleSetDefault(v.prompt_ver_id) }}
                            disabled={saving}
                            className="rounded border border-slate-200 px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                          >
                            기본으로 지정
                          </button>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-400">
                        {v.created_at ? new Date(v.created_at).toLocaleString('ko-KR') : ''}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                        {(v.content || '').slice(0, 80)}
                      </p>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* 선택 버전 전체 content + 새 버전 추가 */}
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#08CB00]">선택 버전 내용</p>
              <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                {selected?.content || '버전을 선택하세요.'}
              </pre>
            </div>
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#08CB00]">새 버전 추가</p>
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                rows={5}
                placeholder="새 버전 content 입력 (기존 버전을 수정하지 않고 새 버전으로 저장됩니다)"
                className="w-full rounded-lg border border-slate-300 p-2 text-xs"
              />
              <button
                onClick={handleCreate}
                disabled={saving}
                className="mt-2 w-full rounded-md bg-slate-900 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
              >
                {saving ? '저장 중...' : '새 버전 저장'}
              </button>
            </div>
          </div>
        </div>

        {(error || notice) && (
          <div className="border-t border-slate-100 px-5 py-3">
            {error && <p className="text-sm text-red-600">{error}</p>}
            {notice && !error && <p className="text-sm text-emerald-600">{notice}</p>}
          </div>
        )}
      </div>
    </div>
  )
}
