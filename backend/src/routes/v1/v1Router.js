import { Router } from 'express';
import authRoutes from './auth.js';
import taskRoutes from './tasks.js';
import reportRoutes from './reports.js';

const v1Router = Router();

v1Router.use('/auth', authRoutes);
v1Router.use('/tasks', taskRoutes);
v1Router.use('/reports', reportRoutes);

export default v1Router;
