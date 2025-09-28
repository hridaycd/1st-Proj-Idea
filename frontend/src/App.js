import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { WebSocketProvider } from './contexts/WebSocketContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Hotels from './pages/Hotels';
import Restaurants from './pages/Restaurants';
import Bookings from './pages/Bookings';
import Profile from './pages/Profile';
import HotelDetails from './pages/HotelDetails';
import RestaurantDetails from './pages/RestaurantDetails';
import BookingForm from './pages/BookingForm';
import OwnerDashboard from './pages/OwnerDashboard';
import OwnerBookings from './pages/OwnerBookings';
import OwnerAnalytics from './pages/OwnerAnalytics';
import './App.css';

function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.user_type)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Protected routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="hotels" element={<Hotels />} />
        <Route path="hotels/:id" element={<HotelDetails />} />
        <Route path="restaurants" element={<Restaurants />} />
        <Route path="restaurants/:id" element={<RestaurantDetails />} />
        <Route path="bookings" element={<Bookings />} />
        <Route path="bookings/new" element={<BookingForm />} />
        <Route path="profile" element={<Profile />} />
        
        {/* Owner routes */}
        <Route path="owner/dashboard" element={
          <ProtectedRoute allowedRoles={['hotel_owner', 'restaurant_owner']}>
            <OwnerDashboard />
          </ProtectedRoute>
        } />
        <Route path="owner/bookings" element={
          <ProtectedRoute allowedRoles={['hotel_owner', 'restaurant_owner']}>
            <OwnerBookings />
          </ProtectedRoute>
        } />
        <Route path="owner/analytics" element={
          <ProtectedRoute allowedRoles={['hotel_owner', 'restaurant_owner']}>
            <OwnerAnalytics />
          </ProtectedRoute>
        } />
      </Route>
      
      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <div className="App">
          <AppRoutes />
        </div>
      </WebSocketProvider>
    </AuthProvider>
  );
}

export default App;
