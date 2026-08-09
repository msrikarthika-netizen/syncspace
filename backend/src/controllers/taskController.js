import taskService from '../services/taskService.js';
import { successResponse, errorResponse } from '../utils/common/responseObjects.js';
import StatusCodes from 'http-status-codes';

export const createTask = async (req, res) => {
  try {
    const { title, description, priority, tags, deadline, workspaceId } = req.body;
    if (!title || !description) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json(errorResponse('Title and description are required'));
    }
    const task = await taskService.createTask({
      title,
      description,
      priority,
      tags,
      deadline,
      userId: req.user.id,
      workspaceId,
    });
    return res
      .status(StatusCodes.CREATED)
      .json(successResponse(task, 'Task created and queued for AI processing'));
  } catch (err) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(errorResponse(err.message));
  }
};

export const getTasks = async (req, res) => {
  try {
    const { status, priority } = req.query;
    const tasks = await taskService.getTasksByUser(req.user.id, { status, priority });
    return res.status(StatusCodes.OK).json(successResponse(tasks));
  } catch (err) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(errorResponse(err.message));
  }
};

export const getTaskById = async (req, res) => {
  try {
    const task = await taskService.getTaskById(req.params.id, req.user.id);
    return res.status(StatusCodes.OK).json(successResponse(task));
  } catch (err) {
    return res
      .status(err.message === 'Unauthorized' ? StatusCodes.FORBIDDEN : StatusCodes.NOT_FOUND)
      .json(errorResponse(err.message));
  }
};

export const getStats = async (req, res) => {
  try {
    const stats = await taskService.getStats(req.user.id);
    return res.status(StatusCodes.OK).json(successResponse(stats));
  } catch (err) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(errorResponse(err.message));
  }
};

export const deleteTask = async (req, res) => {
  try {
    const result = await taskService.deleteTask(req.params.id, req.user.id);
    return res.status(StatusCodes.OK).json(successResponse(result, 'Task deleted'));
  } catch (err) {
    return res
      .status(err.message === 'Unauthorized' ? StatusCodes.FORBIDDEN : StatusCodes.NOT_FOUND)
      .json(errorResponse(err.message));
  }
};

// Webhook from Python AI to update subtask progress.
export const updateSubtaskWebhook = async (req, res) => {
  try {
    const { taskId } = req.params;
    const subtask = await taskService.updateSubtaskFromAI(taskId, req.body);
    return res.status(StatusCodes.OK).json(successResponse(subtask));
  } catch (err) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(errorResponse(err.message));
  }
};

// Webhook from Python AI if the entire task fails.
export const failTaskWebhook = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { error } = req.body;
    await taskService.failTaskFromAI(taskId, error);
    return res.status(StatusCodes.OK).json(successResponse(null, 'Task marked as failed'));
  } catch (err) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(errorResponse(err.message));
  }
};
