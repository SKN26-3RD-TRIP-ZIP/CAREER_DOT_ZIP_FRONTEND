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

export async function getMemberDetail(userId) {
  const res = await axiosInstance.get(`/admin/members/${userId}`)
  return res.data
}

export async function getMemberStats() {
  const res = await axiosInstance.get('/admin/members/stats')
  return res.data // { total, active, suspended, today }
}

export async function setUserStatus(id, newStatus) {
  await axiosInstance.patch(`/admin/members/${id}/status`, { status: newStatus })
}


// 백엔드 DELETE 엔드포인트는 하드 삭제가 아니라 탈퇴(소프트 삭제) 처리다.
// status='withdrawn'으로 바꾸고 데이터는 보관 기간 경과 후 배치에서 익명화한다.
export async function withdrawMember(id) {
  await axiosInstance.delete(`/admin/members/${id}`)
}

export async function inviteMember(email) {
  const res = await axiosInstance.post('/admin/members/invite', { email })
  return res.data
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


export async function getAllTemplates() {
  const res = await axiosInstance.get('/admin/prompt-templates')
  return res.data.results
}

export async function createTemplate(body) {
  const res = await axiosInstance.post('/admin/prompt-templates', body)
  return res.data
}

export async function createTemplateWithContent({ persona_config_id, title, content }) {
  const res = await axiosInstance.post('/admin/prompt-templates', {
    persona_config_id,
    title,
    prompt_type: 'question_generation',
  })
  const templateId = res.data.template_id
  await axiosInstance.post(`/admin/prompt-templates/${templateId}/versions`, { content })
  return res.data
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

export async function getPromptVersionTestSetup(versionId) {
  const res = await axiosInstance.get(`/admin/prompt-versions/${versionId}/test-setup`)
  return res.data
}

export async function cleanupPromptTestRun(sessionId) {
  await axiosInstance.delete(`/admin/prompt-test-runs/${sessionId}`)
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export async function getDashboardStats() {
  const res = await axiosInstance.get('/admin/dashboard')
  return res.data
}

// ── Audit Logs ────────────────────────────────────────────────────────────────

export async function getAuditLogs(params = {}) {
  const { action_type, actor_id, page, size } = params
  const query = {}
  if (action_type) query.action_type = action_type
  if (actor_id) query.actor_id = actor_id
  if (page) query.page = page
  if (size) query.size = size
  const res = await axiosInstance.get('/admin/audit-logs', { params: query })
  return res.data // { total, page, size, results }
}
