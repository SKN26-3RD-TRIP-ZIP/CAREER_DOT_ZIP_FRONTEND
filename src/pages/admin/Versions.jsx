import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getPersonas, getAllTemplates, getVersions, createVersion, setDefaultVersion } from '../../api/adminApi'

const PERSONA_LABEL = {
  coach:     '코치형 면접관',
  practical: '실무형 면접관',
  verifier:  '검증형 면접관',
}

/* ── 새 버전 배포 폼 ─────────────────────────────────────────────────────── */
function DeployForm({ template, versions, onClose, onDeployed }) {
  const [content, setContent] = useState(template.default_version_content ?? '')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const nextVersion = (Math.max(...(versions?.map((v) => v.version_number) ?? [0]), 0)) + 1

  const handleSubmit = async () => {
    if (!content.trim()) { setError('프롬프트 내용을 입력해주세요.'); return }
    setLoading(true)
    setError('')
    try {
      await createVersion(template.template_id, { content: content.trim(), change_note: note.trim() })
      onDeployed()
      onClose()
    } catch {
      setError('배포에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col">
      {/* 헤더 */}
      <div className="mb-6">
        <h2 className="text-base font-bold text-[#EEEEEE]">
          새 버전 : V{nextVersion} · 현재 템플릿 이름: {template.title}
        </h2>
        <p className="text-sm text-[#AAAAAA]">
          현재 버전: V{template.default_version_number ?? '—'}
        </p>
        <p className="mt-0.5 text-xs text-[#666666]">새로운 버전을 배포합니다.</p>
      </div>

      {/* 프롬프트 내용 */}
      <label className="mb-2 text-sm font-semibold text-[#CCCCCC]">프롬프트 내용</label>
      <textarea
        className="mb-5 h-64 resize-none rounded-xl border border-[#253900] bg-[#111400] p-4 text-sm text-[#EEEEEE] outline-none placeholder:text-[#444444] focus:border-[#08CB00]"
        placeholder="당신은 [페르소나] 면접관 입니다. 지원자의 답변을 분석하고..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      {/* 메모 */}
      <label className="mb-2 text-sm font-semibold text-[#CCCCCC]">메모</label>
      <textarea
        className="mb-4 h-24 resize-none rounded-xl border border-[#253900] bg-[#111400] p-4 text-sm text-[#EEEEEE] outline-none placeholder:text-[#444444] focus:border-[#08CB00]"
        placeholder="히스토리에 표시될 메모를 작성하세요."
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      {error && <p className="mb-3 text-xs text-red-500">{error}</p>}

      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="rounded-xl bg-[#08CB00] px-10 py-2.5 text-sm font-semibold text-[#000000] hover:bg-[#05A000] disabled:opacity-50"
        >
          {loading ? '배포 중...' : '확인'}
        </button>
      </div>
    </div>
  )
}

/* ── 버전 히스토리 ───────────────────────────────────────────────────────── */
function VersionHistory({ template, versions, isLoading, onDeploy, onRefresh }) {
  const [activating, setActivating] = useState(null)
  const [rollingBack, setRollingBack] = useState(null)

  const handleActivate = async (version) => {
    setActivating(version.prompt_ver_id)
    try {
      await setDefaultVersion(template.template_id, version.prompt_ver_id)
      onRefresh()
    } finally {
      setActivating(null)
    }
  }

  const handleRollback = async (version) => {
    setRollingBack(version.prompt_ver_id)
    try {
      await createVersion(template.template_id, {
        content: version.content,
        change_note: `v${version.version_number} 기준 롤백`,
      })
      onRefresh()
    } finally {
      setRollingBack(null)
    }
  }

  return (
    <div className="flex flex-col">
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-base font-semibold text-[#EEEEEE]">버전 히스토리</h2>
        <button
          onClick={onDeploy}
          className="rounded-xl bg-[#08CB00] px-5 py-2 text-sm font-semibold text-[#000000] hover:bg-[#05A000]"
        >
          새 버전 배포
        </button>
      </div>

      {isLoading ? (
        <p className="py-10 text-center text-sm text-[#666666]">불러오는 중...</p>
      ) : !versions || versions.length === 0 ? (
        <p className="py-10 text-center text-sm text-[#666666]">버전이 없습니다.</p>
      ) : (
        <div className="relative">
          {/* 타임라인 선 */}
          <div className="absolute left-[7px] top-3 bottom-3 w-px bg-[#253900]" />

          <div className="flex flex-col gap-0">
            {versions.map((ver) => {
              const isActive = ver.prompt_ver_id === template.default_version_id
              return (
                <div key={ver.prompt_ver_id} className="relative flex items-start gap-4 py-4">
                  {/* 타임라인 점 */}
                  <div
                    className={[
                      'relative z-10 mt-1 h-4 w-4 shrink-0 rounded-full border-2',
                      isActive
                        ? 'border-[#08CB00] bg-[#08CB00]'
                        : 'border-[#AAAAAA] bg-[#1A2200]',
                    ].join(' ')}
                  />

                  {/* 내용 */}
                  <div className="flex flex-1 items-start justify-between gap-4 border-b border-[#253900] pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#EEEEEE]">
                          v{ver.version_number}
                        </span>
                        {isActive && (
                          <span className="rounded-full bg-[#0A2200] px-2.5 py-0.5 text-xs font-semibold text-[#3DDD37]">
                            활성
                          </span>
                        )}
                      </div>
                      {ver.change_note && (
                        <p className="mt-0.5 text-xs text-[#AAAAAA]">{ver.change_note}</p>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-xs text-[#666666]">
                        {new Date(ver.created_at).toLocaleDateString('ko-KR', {
                          year: 'numeric', month: '2-digit', day: '2-digit',
                        }).replace(/\. /g, '.').slice(0, -1)}
                      </span>
                      {!isActive && (
                        <>
                          <button
                            onClick={() => handleActivate(ver)}
                            disabled={activating === ver.prompt_ver_id}
                            className="rounded-lg border border-[#253900] px-3 py-1 text-xs font-medium text-[#AAAAAA] hover:bg-[#253900] disabled:opacity-50"
                          >
                            {activating === ver.prompt_ver_id ? '...' : '활성화'}
                          </button>
                          <button
                            onClick={() => handleRollback(ver)}
                            disabled={rollingBack === ver.prompt_ver_id}
                            className="rounded-lg border border-[#253900] px-3 py-1 text-xs font-medium text-[#AAAAAA] hover:bg-[#253900] disabled:opacity-50"
                          >
                            {rollingBack === ver.prompt_ver_id ? '...' : '롤백'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── 메인 페이지 ─────────────────────────────────────────────────────────── */
export default function Versions() {
  const queryClient = useQueryClient()
  const [selectedPersonaId, setSelectedPersonaId] = useState(null)
  const [showDeploy, setShowDeploy] = useState(false)

  const { data: personas = [] } = useQuery({
    queryKey: ['personas'],
    queryFn: getPersonas,
  })

  const { data: templates = [] } = useQuery({
    queryKey: ['all-templates'],
    queryFn: getAllTemplates,
  })

  // 첫 번째 페르소나 자동 선택
  useEffect(() => {
    if (personas.length > 0 && selectedPersonaId === null) {
      setSelectedPersonaId(personas[0].persona_id)
    }
  }, [personas, selectedPersonaId])

  const selectedPersona = personas.find((p) => p.persona_id === selectedPersonaId) ?? null
  const activeTemplate = templates.find((t) => t.template_id === selectedPersona?.active_template_id) ?? null

  const { data: versions, isLoading: versionsLoading } = useQuery({
    queryKey: ['versions', activeTemplate?.template_id],
    queryFn: () => getVersions(activeTemplate.template_id),
    enabled: !!activeTemplate,
    select: (data) => data,
  })

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['versions', activeTemplate?.template_id] })
    queryClient.invalidateQueries({ queryKey: ['all-templates'] })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-[#EEEEEE]">버전 관리</h1>
        <p className="mt-1 text-xs text-[#666666]">
          prompts_promptversion — 버전 히스토리 · 활성 전환 · 롤백
        </p>
      </div>

      {/* 좌우 레이아웃 */}
      <div className="flex gap-5">
        {/* 좌: 페르소나 목록 */}
        <div className="flex w-56 shrink-0 flex-col gap-2">
          {personas.map((persona) => {
            const tpl = templates.find((t) => t.template_id === persona.active_template_id)
            const isSelected = persona.persona_id === selectedPersonaId
            return (
              <button
                key={persona.persona_id}
                onClick={() => { setSelectedPersonaId(persona.persona_id); setShowDeploy(false) }}
                className={[
                  'rounded-xl border p-4 text-left transition-colors',
                  isSelected
                    ? 'border-[#08CB00] bg-[#1A2200] shadow-sm'
                    : 'border-transparent bg-[#1A2200] shadow-sm hover:border-[#253900]',
                ].join(' ')}
              >
                <p className={`text-sm font-semibold ${isSelected ? 'text-[#EEEEEE]' : 'text-[#AAAAAA]'}`}>
                  {PERSONA_LABEL[persona.persona_type] ?? persona.persona_type}
                </p>
                <p className="mt-0.5 text-xs text-[#666666]">
                  현재 v{tpl?.default_version_number ?? '—'} · {tpl?.version_count ?? 0}개
                </p>
              </button>
            )
          })}
        </div>

        {/* 우: 버전 히스토리 or 새 버전 폼 */}
        <div className="flex-1 rounded-xl bg-[#1A2200] p-6 shadow-sm">
          {!selectedPersona || !activeTemplate ? (
            <p className="py-20 text-center text-sm text-[#666666]">
              좌측에서 페르소나를 선택하세요.
            </p>
          ) : showDeploy ? (
            <DeployForm
              template={activeTemplate}
              versions={versions ?? []}
              onClose={() => setShowDeploy(false)}
              onDeployed={handleRefresh}
            />
          ) : (
            <VersionHistory
              template={activeTemplate}
              versions={versions ?? []}
              isLoading={versionsLoading}
              onDeploy={() => setShowDeploy(true)}
              onRefresh={handleRefresh}
            />
          )}
        </div>
      </div>
    </div>
  )
}
