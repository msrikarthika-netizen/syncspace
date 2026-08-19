import { Server } from 'socket.io';
import { FRONTEND_ORIGINS } from '../config/serverConfig.js';
import { SOCKET_EVENTS } from '../utils/common/eventConstants.js';

let io;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: FRONTEND_ORIGINS,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Join a task-specific room for real-time updates
    socket.on(SOCKET_EVENTS.JOIN_TASK_ROOM, ({ taskId }) => {
      const room = `task:${taskId}`;
      socket.join(room);
      console.log(`📡 ${socket.id} joined room ${room}`);
      socket.emit('room:joined', { room, taskId });
    });

    socket.on(SOCKET_EVENTS.LEAVE_TASK_ROOM, ({ taskId }) => {
      const room = `task:${taskId}`;
      socket.leave(room);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
};
