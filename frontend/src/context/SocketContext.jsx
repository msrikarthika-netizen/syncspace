import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const url = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
    socketRef.current = io(url, { transports: ['polling', 'websocket'], autoConnect: false });

    socketRef.current.on('connect', () => setConnected(true));
    socketRef.current.on('disconnect', () => setConnected(false));

    return () => socketRef.current?.disconnect();
  }, []);

  const joinTaskRoom = (taskId) => {
    const socket = socketRef.current;
    if (!socket) return;

    const joinRoom = () => socket.emit('join:task', { taskId });
    if (socket.connected) {
      joinRoom();
      return;
    }

    socket.once('connect', joinRoom);
    socket.connect();
  };
  const leaveTaskRoom = (taskId) => {
    socketRef.current?.emit('leave:task', { taskId });
  };
  const on = (event, handler) => socketRef.current?.on(event, handler);
  const off = (event, handler) => socketRef.current?.off(event, handler);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected, joinTaskRoom, leaveTaskRoom, on, off }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
