import axiosInstance from './axiosInstance'

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function login(body) {
  const res = await axiosInstance.post('/auth/login', body)
  return res.data // { access_token, token_type }
}

// ── Members ───────────────────────────────────────────────────────────────────

export async function getMembers(params = {}) {
  const { status, ...rest } = params
  const query = { ...rest }
  if (status && status !== 'all') query.status = status
  const res = await axiosInstance.get('/admin/members', { params: query })
  const { total, page, size, results } = res.data
  return {
    users: results,
    total,
    page,
    size,
    totalPages: Math.ceil(total / size),
  }
}

export async function getMemberStats() {
  const [all, active, suspended] = await Promise.all([
    axiosInstance.get('/admin/members', { params: { page: 1, size: 1 } }),
    axiosInstance.get('/admin/members', { params: { page: 1, size: 1, status: 'active' } }),
    axiosInstance.get('/admin/members', { params: { page: 1, size: 1, status: 'suspended' } }),
  ])
  return {
    total: all.data.total,
    active: active.data.total,
    suspended: suspended.data.total,
  }
}

export async function toggleUserStatus(id, currentStatus) {
  const newStatus = currentStatus === 'active' ? 'suspended' : 'active'
  await axiosInstance.patch(`/admin/members/${id}/status`, { status: newStatus })
}

// ── Personas ──────────────────────────────────────────────────────────────────

export async function getPersonas() {
  const res = await axiosInstance.get('/admin/personas')
  return res.data.results // [{ persona_id, persona_type, active_template_id, ... }]
}

export async function switchTemplate(personaId, templateId) {
  await axiosInstance.patch(`/admin/personas/${personaId}/active-template`, {
    active_template_id: templateId,
  })
}

// ── Prompt Templates ──────────────────────────────────────────────────────────

export async function getTemplates(personaType) {
  const res = await axiosInstance.get('/admin/prompt-templates', {
    params: { persona_type: personaType },
  })
  return res.data.results // [{ template_id, persona_config_id, persona_type, title, ... }]
}

export async function createTemplate(body) {
  // body: { persona_config_id, title, prompt_type }
  const res = await axiosInstance.post('/admin/prompt-templates', body)
  return res.data
}

export async function deleteTemplate(templateId) {
  await axiosInstance.delete(`/admin/prompt-templates/${templateId}`)
}

// ── Prompt Versions ───────────────────────────────────────────────────────────

export async function getVersions(templateId) {
  const res = await axiosInstance.get(`/admin/prompt-templates/${templateId}/versions`)
  return res.data.results // [{ prompt_ver_id, version_number, content, change_note, created_at }]
}

export async function createVersion(templateId, body) {
  // body: { content, change_note? }
  const res = await axiosInstance.post(`/admin/prompt-templates/${templateId}/versions`, body)
  return res.data
}

export async function setDefaultVersion(templateId, versionId) {
  await axiosInstance.patch(`/admin/prompt-templates/${templateId}/default-version`, {
    default_version_id: versionId,
  })
}
