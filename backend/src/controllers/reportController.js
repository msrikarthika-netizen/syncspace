import reportService from '../services/reportService.js';
import { successResponse, errorResponse } from '../utils/common/responseObjects.js';
import StatusCodes from 'http-status-codes';

export const getReportByTask = async (req, res) => {
  try {
    const report = await reportService.getReportByTask(req.params.taskId, req.user.id);
    return res.status(StatusCodes.OK).json(successResponse(report));
  } catch (err) {
    return res
      .status(err.message === 'Unauthorized' ? StatusCodes.FORBIDDEN : StatusCodes.NOT_FOUND)
      .json(errorResponse(err.message));
  }
};

export const getReportById = async (req, res) => {
  try {
    const report = await reportService.getReportById(req.params.id, req.user.id);
    return res.status(StatusCodes.OK).json(successResponse(report));
  } catch (err) {
    return res
      .status(err.message === 'Unauthorized' ? StatusCodes.FORBIDDEN : StatusCodes.NOT_FOUND)
      .json(errorResponse(err.message));
  }
};

export const getUserReports = async (req, res) => {
  try {
    const reports = await reportService.getUserReports(req.user.id);
    return res.status(StatusCodes.OK).json(successResponse(reports));
  } catch (err) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(errorResponse(err.message));
  }
};

// Internal webhook from Python AI to save completed report
export const saveReportWebhook = async (req, res) => {
  try {
    const { taskId } = req.params;
    // For internal webhook: userId comes from body (AI service passes it)
    const report = await reportService.createReport({
      taskId,
      reportData: req.body,
      userId: req.body.user_id,
    });
    return res.status(StatusCodes.CREATED).json(successResponse(report, 'Report saved'));
  } catch (err) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(errorResponse(err.message));
  }
};
