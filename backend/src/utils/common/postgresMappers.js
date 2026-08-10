export const toIso = (value) => {
  if (!value) return value;
  if (value instanceof Date) return value.toISOString();
  return value;
};

export const toUser = (row) => {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    username: row.username,
    email: row.email,
    passwordHash: row.password_hash,
    avatar: row.avatar,
    role: row.role,
    isActive: row.is_active,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
};

export const toUserPreview = (value) => {
  if (!value) return null;
  return {
    _id: value._id || value.id,
    id: value.id || value._id,
    username: value.username,
    email: value.email,
    avatar: value.avatar,
    role: value.role,
  };
};

export const toSubtask = (row) => {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    parentTask: row.parent_task_id,
    title: row.title,
    description: row.description,
    agentType: row.agent_type,
    agentName: row.agent_name,
    status: row.status,
    result: row.result || '',
    error: row.error,
    startedAt: toIso(row.started_at),
    completedAt: toIso(row.completed_at),
    durationMs: row.duration_ms,
    order: row.sort_order,
    metadata: row.metadata || {},
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
};

export const toReport = (row) => {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    task: row.task || row.task_id,
    generatedBy: row.generated_by_user || row.generated_by,
    title: row.title,
    summary: row.summary,
    sections: row.sections || [],
    fullContent: row.full_content || '',
    stats: row.stats || {},
    status: row.status,
    viewedBy: row.viewed_by || [],
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
};

export const toTask = (row) => {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    title: row.title,
    description: row.description,
    priority: row.priority,
    status: row.status,
    assignedBy: row.assigned_by_user || row.assigned_by,
    workspace: row.workspace_id,
    deadline: toIso(row.deadline),
    tags: row.tags || [],
    subtasks: row.subtasks || [],
    report: row.report || row.report_id,
    aiMetadata: row.ai_metadata || {},
    progress: row.progress,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
};
