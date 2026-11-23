import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

// If VITE_SOCKET_URL is provided, use it; otherwise automatically derive from VITE_API_URL (strip /api)
const API_URL = import.meta.env.VITE_API_URL;
const DERIVED_SOCKET_URL = API_URL ? API_URL.replace(/\/api\/?$/, '') : null;
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || DERIVED_SOCKET_URL || 'http://localhost:5000';

export function useSocket(room, eventHandlers = {}) {
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      if (room) {
        socket.emit('join-room', room);
      }
    });

    // Register event handlers
    Object.entries(eventHandlers).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    return () => {
      socket.disconnect();
    };
  }, [room]); // eslint-disable-line react-hooks/exhaustive-deps

  return socketRef;
}
