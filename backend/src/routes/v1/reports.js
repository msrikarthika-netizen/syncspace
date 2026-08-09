import { Router } from 'express';
import {
  getReportByTask,
  getReportById,
  getUserReports,
  saveReportWebhook,
} from '../../controllers/reportController.js';
import { authenticate, authenticateInternal } from '../../middlewares/authMiddleware.js';

const router = Router();

router.get('/', authenticate, getUserReports);
router.get('/task/:taskId', authenticate, getReportByTask);
router.get('/:id', authenticate, getReportById);

// Internal webhook from Python AI service
router.post('/task/:taskId/save', authenticateInternal, saveReportWebhook);

export default router;
