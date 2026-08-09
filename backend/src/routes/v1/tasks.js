import { Router } from 'express';
import {
  createTask,
  getTasks,
  getTaskById,
  getStats,
  deleteTask,
  updateSubtaskWebhook,
  failTaskWebhook,
} from '../../controllers/taskController.js';
import { authenticate, authenticateInternal, requireRole } from '../../middlewares/authMiddleware.js';

const router = Router();

// Protected routes
router.post('/', authenticate, requireRole('manager', 'admin'), createTask);
router.get('/', authenticate, getTasks);
router.get('/stats', authenticate, getStats);
router.get('/:id', authenticate, getTaskById);
router.delete('/:id', authenticate, requireRole('manager', 'admin'), deleteTask);

// Internal webhook from Python AI service.
router.post('/:taskId/subtask-update', authenticateInternal, updateSubtaskWebhook);
router.post('/:taskId/fail', authenticateInternal, failTaskWebhook);

export default router;
