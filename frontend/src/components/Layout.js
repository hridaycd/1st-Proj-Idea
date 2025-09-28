import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import NotificationPanel from './NotificationPanel';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const { user } = useAuth();
  const { notifications } = useWebSocket();
  const navigate = useNavigate();
  const location = useLocation();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleNotificationPanel = () => {
    setNotificationPanelOpen(!notificationPanelOpen);
  };

  const handleSidebarItemClick = (path) => {
    navigate(path);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar 
        onMenuClick={toggleSidebar}
        onNotificationClick={toggleNotificationPanel}
        notificationCount={notifications.length}
      />
      
      <div className="flex">
        <Sidebar 
          isOpen={sidebarOpen}
          onItemClick={handleSidebarItemClick}
          currentPath={location.pathname}
          userType={user?.user_type}
        />
        
        <main className={`flex-1 transition-all duration-300 ${
          sidebarOpen ? 'lg:ml-64' : 'lg:ml-64'
        }`}>
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
      
      <NotificationPanel 
        isOpen={notificationPanelOpen}
        onClose={() => setNotificationPanelOpen(false)}
        notifications={notifications}
      />
    </div>
  );
};

export default Layout;
