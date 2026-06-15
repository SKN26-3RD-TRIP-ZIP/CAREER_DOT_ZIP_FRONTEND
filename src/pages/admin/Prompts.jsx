import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getPersonas,
  getAllTemplates,
  switchTemplate,
  createTemplateWithContent,
} from '../../api/adminApi'

/* ── 상수 ────────────────────────────────────────────────────────────────── */
const PERSONA_LABEL = {
  coach:     '코치형 면접관',
  practical: '실무형 면접관',
  verifier:  '검증형 면접관',
  pressure:  '압박형 면접관',
}

const PERSONA_TYPE_LABEL = {
  coach:     '코치형',
  practical: '실무형',
  verifier:  '검증형',
  pressure:  '압박형',
}

/* ── 공통 모달 래퍼 ──────────────────────────────────────────────────────── */
function Modal({ onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-[#1A2200] p-8 shadow-2xl">
        {children}
      </div>
    </div>
  )
}

/* ── 미리보기 모달 ───────────────────────────────────────────────────────── */
function PreviewModal({ template, onClose }) {
  return (
    <Modal onClose={onClose}>
      <div className="mb-1 flex items-center gap-2">
        <h2 className="text-xl font-bold text-[#EEEEEE]">제목: {template.title}</h2>
        <span className="rounded-full bg-[#0A2200] px-2.5 py-0.5 text-xs font-semibold text-[#3DDD37]">활성</span>
      </div>
      <p className="mb-5 text-sm text-[#666666]">
        v{template.default_version_number ?? '—'} · 버전 {template.version_count ?? 0}개
      </p>
      <textarea
        readOnly
        value={template.default_version_content ?? ''}
        className="h-64 w-full resize-none rounded-xl border border-[#253900] bg-[#111400] p-4 text-sm text-[#CCCCCC] outline-none"
      />
      <div className="mt-6 flex justify-end">
        <button
          onClick={onClose}
          className="rounded-xl bg-[#08CB00] px-10 py-2.5 text-sm font-semibold text-[#000000] hover:bg-[#05A000]"
        >
          확인
        </button>
      </div>
    </Modal>
  )
}

/* ── 템플릿 선택(편집) 모달 ──────────────────────────────────────────────── */
function TemplateSelectModal({ persona, templates, onClose, onActivate }) {
  const [detail, setDetail] = useState(null)

  const personaTemplates = templates.filter(
    (t) => t.persona_type === persona.persona_type
  )

  if (detail) {
    return (
      <Modal onClose={onClose}>
        <h2 className="mb-1 text-xl font-bold text-[#EEEEEE]">
          템플릿 선택-{PERSONA_TYPE_LABEL[persona.persona_type]}
        </h2>
        <p className="mb-6 text-sm text-[#666666]">해당 면접관의 템플릿을 선택합니다.</p>

        <div className="rounded-xl border border-[#253900] p-5">
          <div className="mb-1 flex items-center gap-2">
            <h3 className="text-base font-bold text-[#EEEEEE]">제목: {detail.title}</h3>
            <span className="rounded-full bg-[#0A2200] px-2.5 py-0.5 text-xs font-semibold text-[#3DDD37]">활성</span>
          </div>
          <p className="mb-4 text-xs text-[#666666]">
            v{detail.default_version_number ?? '—'} · 버전 {detail.version_count ?? 0}개
          </p>
          <textarea
            readOnly
            value={detail.default_version_content ?? ''}
            className="h-52 w-full resize-none rounded-xl border border-[#253900] bg-[#111400] p-4 text-sm text-[#CCCCCC] outline-none"
          />
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-[#08CB00] px-10 py-2.5 text-sm font-semibold text-[#000000] hover:bg-[#05A000]"
          >
            확인
          </button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal onClose={onClose}>
      <h2 className="mb-1 text-xl font-bold text-[#EEEEEE]">
        템플릿 선택-{PERSONA_TYPE_LABEL[persona.persona_type]}
      </h2>
      <p className="mb-6 text-sm text-[#666666]">해당 면접관의 템플릿을 선택합니다.</p>

      {personaTemplates.length === 0 ? (
        <p className="py-10 text-center text-sm text-[#666666]">등록된 템플릿이 없습니다.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {personaTemplates.map((tpl) => {
            const isActive = tpl.template_id === persona.active_template_id
            return (
              <div key={tpl.template_id} className="rounded-xl border border-[#253900] p-4">
                <div className="mb-1 flex items-center gap-2">
                  <p className="truncate text-sm font-bold text-[#EEEEEE]">제목: {tpl.title}</p>
                  {isActive && (
                    <span className="shrink-0 rounded-full bg-[#0A2200] px-2 py-0.5 text-[10px] font-semibold text-[#3DDD37]">
                      활성
                    </span>
                  )}
                </div>
                <p className="mb-3 text-xs text-[#666666]">
                  v{tpl.default_version_number ?? '—'} · 버전 {tpl.version_count ?? 0}개
                </p>
                <div className="mb-3 h-20 overflow-hidden rounded-lg border border-[#253900] bg-[#111400] p-3 text-xs text-[#AAAAAA] line-clamp-4">
                  {tpl.default_version_content ?? '내용 없음'}
                </div>
                {isActive ? (
                  <button
                    onClick={() => setDetail(tpl)}
                    className="w-full rounded-lg bg-[#08CB00] py-1.5 text-sm font-semibold text-[#000000] hover:bg-[#05A000]"
                  >
                    편집
                  </button>
                ) : (
                  <button
                    onClick={() => onActivate(persona, tpl.template_id)}
                    className="w-full rounded-lg bg-orange-500 py-1.5 text-sm font-semibold text-white hover:bg-orange-600"
                  >
                    활성화
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button
          onClick={onClose}
          className="rounded-xl bg-[#08CB00] px-10 py-2.5 text-sm font-semibold text-[#000000] hover:bg-[#05A000]"
        >
          확인
        </button>
      </div>
    </Modal>
  )
}

/* ── 새 템플릿 생성 모달 ─────────────────────────────────────────────────── */
function CreateModal({ personas, onClose, onCreated }) {
  const [title, setTitle] = useState('')
  const [personaType, setPersonaType] = useState(personas[0]?.persona_type ?? 'coach')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!title.trim()) { setError('템플릿 이름을 입력해주세요.'); return }
    if (!content.trim()) { setError('프롬프트 내용을 입력해주세요.'); return }

    const persona = personas.find((p) => p.persona_type === personaType)
    if (!persona) { setError('페르소나를 선택해주세요.'); return }

    setLoading(true)
    setError('')
    try {
      await createTemplateWithContent({
        persona_config_id: persona.persona_id,
        title: title.trim(),
        content: content.trim(),
      })
      onCreated()
      onClose()
    } catch {
      setError('생성에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal onClose={onClose}>
      <h2 className="mb-6 text-xl font-bold text-[#EEEEEE]">새 템플릿 생성</h2>

      {/* 템플릿 이름 */}
      <div className="mb-5">
        <label className="mb-2 block text-sm font-semibold text-[#CCCCCC]">템플릿 이름</label>
        <input
          className="w-full rounded-xl border border-[#253900] bg-[#111400] px-4 py-2.5 text-sm text-[#EEEEEE] outline-none placeholder:text-[#444444] focus:border-[#08CB00]"
          placeholder="예: 압박형 면접관"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      {/* 페르소나 타입 */}
      <div className="mb-5">
        <label className="mb-1 block text-sm font-semibold text-[#CCCCCC]">페르소나 타입</label>
        <p className="mb-3 text-xs text-[#666666]">면접관의 성격과 질문 방식을 결정합니다</p>
        <div className="flex gap-2">
          {personas.map((p) => (
            <button
              key={p.persona_type}
              onClick={() => setPersonaType(p.persona_type)}
              className={[
                'rounded-xl border px-4 py-2 text-sm font-medium transition-colors',
                personaType === p.persona_type
                  ? 'border-[#08CB00] bg-[#0A2200] text-[#08CB00]'
                  : 'border-[#253900] bg-[#1A2200] text-[#AAAAAA] hover:border-[#08CB00]',
              ].join(' ')}
            >
              {PERSONA_TYPE_LABEL[p.persona_type] ?? p.persona_type}
            </button>
          ))}
        </div>
      </div>

      {/* 프롬프트 내용 */}
      <div className="mb-2">
        <label className="mb-2 block text-sm font-semibold text-[#CCCCCC]">프롬프트 내용</label>
        <textarea
          className="h-52 w-full resize-none rounded-xl border border-[#253900] bg-[#111400] p-4 text-sm text-[#EEEEEE] outline-none placeholder:text-[#444444] focus:border-[#08CB00]"
          placeholder="당신은 [페르소나] 면접관 입니다. 지원자의 답변을 분석하고..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>

      {error && <p className="mb-3 text-xs text-red-500">{error}</p>}

      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="rounded-xl bg-[#08CB00] px-10 py-2.5 text-sm font-semibold text-[#000000] hover:bg-[#05A000] disabled:opacity-50"
        >
          {loading ? '생성 중...' : '확인'}
        </button>
      </div>
    </Modal>
  )
}

/* ── 페르소나 카드 ───────────────────────────────────────────────────────── */
function PersonaCard({ persona, activeTemplate, onPreview, onEdit }) {
  return (
    <div className="rounded-xl bg-[#1A2200] p-6 shadow-sm">
      {/* 헤더 */}
      <div className="mb-1 flex items-center gap-2">
        <h3 className="text-base font-bold text-[#EEEEEE]">
          {PERSONA_LABEL[persona.persona_type] ?? persona.persona_type}
        </h3>
        {activeTemplate ? (
          <span className="rounded-full bg-[#0A2200] px-2.5 py-0.5 text-xs font-semibold text-[#3DDD37]">
            활성
          </span>
        ) : (
          <span className="rounded-full bg-[#2A2A2A] px-2.5 py-0.5 text-xs font-semibold text-[#888888]">
            비활성
          </span>
        )}
      </div>
      <p className="mb-4 text-xs text-[#666666]">
        persona_type: {persona.persona_type}
        {activeTemplate && (
          <>
            {' · '}v{activeTemplate.default_version_number ?? '—'}
            {' · '}버전 {activeTemplate.version_count ?? 0}개
          </>
        )}
      </p>

      {/* 프롬프트 미리보기 */}
      <div className="mb-4 min-h-[72px] rounded-xl border border-[#253900] p-3 text-sm text-[#AAAAAA] line-clamp-3">
        {activeTemplate?.default_version_content ?? (
          <span className="text-[#444444]">활성 템플릿이 없습니다.</span>
        )}
      </div>

      {/* 버튼 */}
      <div className="flex justify-end gap-2">
        <button
          onClick={onPreview}
          disabled={!activeTemplate}
          className="rounded-lg border border-[#253900] px-4 py-1.5 text-sm font-medium text-[#AAAAAA] hover:bg-[#253900] disabled:opacity-40"
        >
          미리보기
        </button>
        <button
          onClick={onEdit}
          className="rounded-lg bg-[#08CB00] px-4 py-1.5 text-sm font-semibold text-[#000000] hover:bg-[#05A000]"
        >
          편집
        </button>
      </div>
    </div>
  )
}

/* ── 메인 페이지 ─────────────────────────────────────────────────────────── */
export default function Prompts() {
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [editPersona, setEditPersona] = useState(null)
  const [previewTemplate, setPreviewTemplate] = useState(null)

  const { data: personas = [] } = useQuery({
    queryKey: ['personas'],
    queryFn: getPersonas,
  })

  const { data: templates = [] } = useQuery({
    queryKey: ['all-templates'],
    queryFn: getAllTemplates,
  })

  const getActiveTemplate = (persona) =>
    templates.find((t) => t.template_id === persona.active_template_id) ?? null

  const handleActivate = async (persona, templateId) => {
    await switchTemplate(persona.persona_id, templateId)
    queryClient.invalidateQueries({ queryKey: ['personas'] })
    queryClient.invalidateQueries({ queryKey: ['all-templates'] })
  }

  const handleCreated = () => {
    queryClient.invalidateQueries({ queryKey: ['all-templates'] })
    queryClient.invalidateQueries({ queryKey: ['personas'] })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 헤더 */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#EEEEEE]">프롬프트 관리</h1>
          <p className="mt-1 text-xs text-[#666666]">
            prompts_personaconfig · prompts_prompttemplate — 페르소나별 면접관 템플릿
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          disabled={personas.length === 0}
          className="rounded-xl bg-[#08CB00] px-5 py-2.5 text-sm font-semibold text-[#000000] hover:bg-[#05A000] disabled:opacity-50"
        >
          + 새 템플릿
        </button>
      </div>

      {/* 페르소나 2×2 그리드 */}
      {personas.length === 0 ? (
        <div className="flex items-center justify-center rounded-xl bg-[#1A2200] py-20 shadow-sm">
          <p className="text-sm text-[#666666]">페르소나 데이터가 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {personas.map((persona) => {
            const active = getActiveTemplate(persona)
            return (
              <PersonaCard
                key={persona.persona_id}
                persona={persona}
                activeTemplate={active}
                onPreview={() => active && setPreviewTemplate(active)}
                onEdit={() => setEditPersona(persona)}
              />
            )
          })}
        </div>
      )}

      {/* 미리보기 모달 */}
      {previewTemplate && (
        <PreviewModal
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
        />
      )}

      {/* 템플릿 선택(편집) 모달 */}
      {editPersona && (
        <TemplateSelectModal
          persona={editPersona}
          templates={templates}
          onClose={() => setEditPersona(null)}
          onActivate={async (persona, templateId) => {
            await handleActivate(persona, templateId)
            setEditPersona(null)
          }}
        />
      )}

      {/* 새 템플릿 생성 모달 */}
      {createOpen && (
        <CreateModal
          personas={personas}
          onClose={() => setCreateOpen(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  )
}
