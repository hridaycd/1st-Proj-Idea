import React from 'react';
import { X, Bell, Calendar, Building2, Utensils } from 'lucide-react';
import { useWebSocket } from '../contexts/WebSocketContext';

const NotificationPanel = ({ isOpen, onClose, notifications }) => {
  const { removeNotification } = useWebSocket();

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'booking_update':
        return <Calendar size={16} className="text-blue-500" />;
      case 'availability_update':
        return <Building2 size={16} className="text-green-500" />;
      default:
        return <Bell size={16} className="text-gray-500" />;
    }
  };

  const getNotificationTitle = (type) => {
    switch (type) {
      case 'booking_update':
        return 'Booking Update';
      case 'availability_update':
        return 'Availability Update';
      default:
        return 'Notification';
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="fixed top-16 right-4 w-80 bg-white rounded-lg shadow-xl z-50 max-h-96 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell size={32} className="mx-auto mb-2 text-gray-300" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="p-4 hover:bg-gray-50 transition-colors duration-200"
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">
                          {getNotificationTitle(notification.type)}
                        </p>
                        <button
                          onClick={() => removeNotification(notification.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.data?.message || 'New update available'}
                      </p>
                      
                      <p className="text-xs text-gray-400 mt-1">
                        {formatTime(notification.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => {
                notifications.forEach(n => removeNotification(n.id));
              }}
              className="w-full text-sm text-gray-600 hover:text-gray-800 text-center"
            >
              Clear all notifications
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default NotificationPanel;
