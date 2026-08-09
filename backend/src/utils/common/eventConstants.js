export const SOCKET_EVENTS = {
  // Task events
  TASK_QUEUED: 'task:queued',
  TASK_PROCESSING: 'task:processing',
  TASK_PROGRESS: 'task:progress',
  TASK_COMPLETED: 'task:completed',
  TASK_FAILED: 'task:failed',

  // Agent events
  AGENT_STARTED: 'agent:started',
  AGENT_PROGRESS: 'agent:progress',
  AGENT_COMPLETED: 'agent:completed',
  AGENT_FAILED: 'agent:failed',

  // Report events
  REPORT_GENERATING: 'report:generating',
  REPORT_READY: 'report:ready',

  // Subtask events
  SUBTASK_STARTED: 'subtask:started',
  SUBTASK_COMPLETED: 'subtask:completed',

  // Connection
  JOIN_TASK_ROOM: 'join:task',
  LEAVE_TASK_ROOM: 'leave:task',
};
