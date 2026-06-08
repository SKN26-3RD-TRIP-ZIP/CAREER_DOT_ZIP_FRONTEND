import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { getPersonas, getTemplates, switchTemplate } from '../../api/adminApi'
import PromptCard from '../../components/admin/PromptCard'
import PromptCreateModal from '../../components/admin/PromptCreateModal'

const TABS = [
  { value: 'coach', label: '코치형' },
  { value: 'practical', label: '실무형' },
  { value: 'verify', label: '검증형' },
]

export default function Prompts() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('coach')
  const [createOpen, setCreateOpen] = useState(false)
  const [switching, setSwitching] = useState(null)

  const { data: personas = [], isLoading: personasLoading } = useQuery({
    queryKey: ['personas'],
    queryFn: getPersonas,
  })

  const currentPersona = personas.find((p) => p.persona_type === activeTab)

  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['templates', activeTab],
    queryFn: () => getTemplates(activeTab),
    enabled: !!currentPersona,
  })

  const isLoading = personasLoading || (!!currentPersona && templatesLoading)

  const handleActivate = async (persona, templateId) => {
    setSwitching(templateId)
    try {
      await switchTemplate(persona.persona_id, templateId)
      await queryClient.invalidateQueries({ queryKey: ['personas'] })
      await queryClient.invalidateQueries({ queryKey: ['templates', activeTab] })
    } finally {
      setSwitching(null)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1">
          {TABS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setActiveTab(value)}
              className={[
                'rounded-lg px-4 py-1.5 text-sm font-medium transition-colors',
                activeTab === value
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setCreateOpen(true)}
          disabled={personas.length === 0}
          className="flex items-center gap-1.5 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          새 프롬프트
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <p className="text-sm text-slate-400">불러오는 중...</p>
        </div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-16 gap-3">
          <p className="text-sm text-slate-400">등록된 템플릿이 없습니다.</p>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <Plus className="h-3.5 w-3.5" />
            첫 템플릿 추가
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {templates.map((template) => {
            const isActive = template.template_id === currentPersona?.active_template_id
            return (
              <PromptCard
                key={template.template_id}
                template={template}
                isActive={isActive}
                onActivate={
                  !isActive && currentPersona
                    ? () => handleActivate(currentPersona, template.template_id)
                    : undefined
                }
              />
            )
          })}
        </div>
      )}

      {switching !== null && (
        <p className="text-center text-xs text-slate-400">활성화 중...</p>
      )}

      <PromptCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        personas={personas}
        activeTab={activeTab}
      />
    </div>
  )
}
