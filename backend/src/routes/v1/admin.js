import { Router } from 'express';
import {
  deleteReport,
  getAuditLogs,
  getDashboard,
  getMonitoring,
  getReports,
  getTasks,
  getUsers,
  moderateTask,
  updateUser,
} from '../../controllers/adminController.js';
import { authenticate, requireRole } from '../../middlewares/authMiddleware.js';

const router = Router();

// This guard is intentionally mounted on the router so every current and future
// admin endpoint is denied by default unless it is called with an admin JWT.
router.use(authenticate, requireRole('admin'));

router.get('/dashboard', getDashboard);
router.get('/users', getUsers);
router.patch('/users/:userId', updateUser);
router.get('/tasks', getTasks);
router.post('/tasks/:taskId/moderate', moderateTask);
router.get('/reports', getReports);
router.delete('/reports/:reportId', deleteReport);
router.get('/monitoring', getMonitoring);
router.get('/audit-logs', getAuditLogs);

export default router;
