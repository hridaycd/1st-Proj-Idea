import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const WebSocketContext = createContext();

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Connect to WebSocket server
      const newSocket = io('ws://localhost:8000', {
        transports: ['websocket'],
        query: {
          client_id: user.id.toString(),
        },
      });

      newSocket.on('connect', () => {
        console.log('WebSocket connected');
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
      });

      newSocket.on('booking_update', (data) => {
        console.log('Booking update received:', data);
        setNotifications(prev => [...prev, {
          id: Date.now(),
          type: 'booking_update',
          data,
          timestamp: new Date(),
        }]);
      });

      newSocket.on('availability_update', (data) => {
        console.log('Availability update received:', data);
        setNotifications(prev => [...prev, {
          id: Date.now(),
          type: 'availability_update',
          data,
          timestamp: new Date(),
        }]);
      });

      newSocket.on('notification', (data) => {
        console.log('Notification received:', data);
        setNotifications(prev => [...prev, {
          id: Date.now(),
          type: 'notification',
          data,
          timestamp: new Date(),
        }]);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    } else {
      if (socket) {
        socket.close();
        setSocket(null);
        setIsConnected(false);
      }
    }
  }, [isAuthenticated, user]);

  const joinRoom = (roomId) => {
    if (socket && isConnected) {
      socket.emit('join_room', roomId);
    }
  };

  const leaveRoom = (roomId) => {
    if (socket && isConnected) {
      socket.emit('leave_room', roomId);
    }
  };

  const sendMessage = (message) => {
    if (socket && isConnected) {
      socket.emit('message', message);
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const value = {
    socket,
    isConnected,
    notifications,
    joinRoom,
    leaveRoom,
    sendMessage,
    clearNotifications,
    removeNotification,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};
