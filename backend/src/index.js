import express from 'express';
import http from 'http';
import cors from 'cors';
import connectDB from './config/dbConfig.js';
import { PORT, NODE_ENV, FRONTEND_ORIGINS } from './config/serverConfig.js';
import { initSocket } from './server/socketServer.js';
import apiRouter from './routes/apiRoutes.js';
import { ensureConfiguredAdmin } from './services/adminBootstrapService.js';

const app = express();
const httpServer = http.createServer(app);

// ── Middleware ────────────────────────────────────────────────
app.use(
  cors({
    origin(origin, callback) {
      callback(null, !origin || FRONTEND_ORIGINS.includes(origin.replace(/\/+$/, '')));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Root endpoint ─────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'SyncSpace Backend API is running',
    data: {
      service: 'syncspace-backend',
      env: NODE_ENV,
      health: '/health',
      api: '/api/v1',
    },
  });
});

// ── Health check ──────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'syncspace-backend', env: NODE_ENV, timestamp: new Date() });
});

// ── API routes ────────────────────────────────────────────────
app.use('/api', apiRouter);

// ── 404 fallback ──────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

// ── Global error handler ──────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────
async function start() {
  await connectDB();
  await ensureConfiguredAdmin();
  initSocket(httpServer);

  httpServer.listen(PORT, () => {
    console.log(`\n🚀 SyncSpace Backend running on http://localhost:${PORT}`);
    console.log(`📡 Socket.IO ready`);
    console.log(`🌍 Environment: ${NODE_ENV}\n`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
