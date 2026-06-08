import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createTemplate } from '../../api/adminApi'

const PERSONA_LABELS = {
  coach: '코치형',
  practical: '실무형',
  verify: '검증형',
}

const PROMPT_TYPES = ['general', 'opening', 'followup', 'closing']

export default function PromptCreateModal({ open, onClose, personas, activeTab }) {
  const queryClient = useQueryClient()
  const [personaType, setPersonaType] = useState(activeTab)
  const [title, setTitle] = useState('')
  const [promptType, setPromptType] = useState('general')
  const [saving, setSaving] = useState(false)

  if (!open) return null

  const canSave = title.trim().length > 0

  const resetForm = () => {
    setPersonaType(activeTab)
    setTitle('')
    setPromptType('general')
  }

  const handleCreate = async () => {
    if (!canSave) return
    const persona = personas.find((p) => p.persona_type === personaType)
    if (!persona) return

    setSaving(true)
    try {
      await createTemplate({
        persona_config_id: persona.persona_id,
        title: title.trim(),
        prompt_type: promptType,
      })
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      resetForm()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />
      <div className="relative z-10 w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
        <h2 className="mb-5 text-base font-semibold text-slate-900">새 프롬프트 템플릿</h2>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">페르소나 유형</label>
            <select
              value={personaType}
              onChange={(e) => setPersonaType(e.target.value)}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
            >
              {personas.map(({ persona_id, persona_type }) => (
                <option key={persona_id} value={persona_type}>
                  {PERSONA_LABELS[persona_type] ?? persona_type}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">프롬프트 타입</label>
            <select
              value={promptType}
              onChange={(e) => setPromptType(e.target.value)}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
            >
              {PROMPT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">제목</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="템플릿 제목을 입력하세요"
              className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={handleClose}
            disabled={saving}
            className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={handleCreate}
            disabled={!canSave || saving}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {saving ? '생성 중...' : '생성'}
          </button>
        </div>
      </div>
    </div>
  )
}
