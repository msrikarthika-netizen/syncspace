import StatusCodes from 'http-status-codes';
import adminService from '../services/adminService.js';
import { errorResponse, successResponse } from '../utils/common/responseObjects.js';

const auditContext = (req) => ({
  ipAddress: req.ip || req.socket?.remoteAddress || null,
  userAgent: req.get('user-agent') || null,
});

const respondError = (res, error) => {
  const message = error.message || 'Admin request failed';
  if (message.endsWith('not found')) {
    return res.status(StatusCodes.NOT_FOUND).json(errorResponse(message));
  }
  if (message.includes('At least one active')) {
    return res.status(StatusCodes.CONFLICT).json(errorResponse(message));
  }
  if (
    message.includes('Invalid') ||
    message.includes('Provide a role') ||
    message.includes('cannot change their own') ||
    message.includes('must be a boolean')
  ) {
    return res.status(StatusCodes.BAD_REQUEST).json(errorResponse(message));
  }
  console.error('Admin request failed:', error);
  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(errorResponse('Admin request could not be completed'));
};

export const getDashboard = async (_req, res) => {
  try {
    return res.json(successResponse(await adminService.getDashboard()));
  } catch (error) {
    return respondError(res, error);
  }
};

export const getUsers = async (req, res) => {
  try {
    return res.json(successResponse(await adminService.getUsers(req.query)));
  } catch (error) {
    return respondError(res, error);
  }
};

export const updateUser = async (req, res) => {
  try {
    const user = await adminService.updateUser({
      targetUserId: req.params.userId,
      actorId: req.user.id,
      updates: req.body || {},
      auditContext: auditContext(req),
    });
    return res.json(successResponse(user, 'User updated'));
  } catch (error) {
    return respondError(res, error);
  }
};

export const getTasks = async (req, res) => {
  try {
    return res.json(successResponse(await adminService.getTasks(req.query)));
  } catch (error) {
    return respondError(res, error);
  }
};

export const moderateTask = async (req, res) => {
  try {
    const result = await adminService.moderateTask({
      taskId: req.params.taskId,
      action: req.body?.action,
      reason: req.body?.reason,
      actorId: req.user.id,
      auditContext: auditContext(req),
    });
    return res.json(successResponse(result, 'Task moderation action completed'));
  } catch (error) {
    return respondError(res, error);
  }
};

export const getReports = async (req, res) => {
  try {
    return res.json(successResponse(await adminService.getReports(req.query)));
  } catch (error) {
    return respondError(res, error);
  }
};

export const deleteReport = async (req, res) => {
  try {
    const result = await adminService.deleteReport({
      reportId: req.params.reportId,
      reason: req.body?.reason,
      actorId: req.user.id,
      auditContext: auditContext(req),
    });
    return res.json(successResponse(result, 'Report removed'));
  } catch (error) {
    return respondError(res, error);
  }
};

export const getMonitoring = async (_req, res) => {
  try {
    return res.json(successResponse(await adminService.getMonitoring()));
  } catch (error) {
    return respondError(res, error);
  }
};

export const getAuditLogs = async (req, res) => {
  try {
    return res.json(successResponse(await adminService.getAuditLogs(req.query)));
  } catch (error) {
    return respondError(res, error);
  }
};
