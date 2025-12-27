import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { 
  Building2, 
  Utensils, 
  Calendar, 
  TrendingUp, 
  DollarSign,
  Users,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const OwnerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState('7d'); // 7d, 30d, 90d

  // Fetch owner's properties
  const { data: properties = [] } = useQuery(
    'owner-properties',
    async () => {
      if (user?.user_type === 'hotel_owner') {
        const response = await axios.get('/api/hotels/my-hotels');
        return response.data;
      } else {
        const response = await axios.get('/api/restaurants/my-restaurants');
        return response.data;
      }
    }
  );

  // Fetch bookings
  const { data: bookings = [] } = useQuery(
    ['owner-bookings', timeRange],
    async () => {
      const response = await axios.get('/api/bookings/owner-bookings', {
        params: { time_range: timeRange }
      });
      return response.data;
    }
  );

  // Calculate statistics
  const stats = {
    totalBookings: bookings.length,
    confirmedBookings: bookings.filter(b => b.status === 'confirmed').length,
    pendingBookings: bookings.filter(b => b.status === 'pending').length,
    totalRevenue: bookings
      .filter(b => b.status === 'confirmed' && b.payment_status === 'completed')
      .reduce((sum, b) => sum + (b.total_amount || 0), 0),
    averageBookingValue: bookings.length > 0
      ? bookings.reduce((sum, b) => sum + (b.total_amount || 0), 0) / bookings.length
      : 0,
  };

  const recentBookings = bookings.slice(0, 5);

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">
          Owner Dashboard
        </h1>
        <p className="text-blue-100">
          Welcome back, {user?.name}! Manage your {user?.user_type === 'hotel_owner' ? 'hotels' : 'restaurants'} and bookings
        </p>
      </div>

      {/* Time Range Filter */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Time Range:</span>
          <div className="flex space-x-2">
            {['7d', '30d', '90d'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Bookings</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-100">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Confirmed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.confirmedBookings}</p>
            </div>
            <div className="p-3 rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingBookings}</p>
            </div>
            <div className="p-3 rounded-full bg-yellow-100">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">₹{stats.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-full bg-purple-100">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Properties Section */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            My {user?.user_type === 'hotel_owner' ? 'Hotels' : 'Restaurants'}
          </h2>
          <button
            onClick={() => navigate(user?.user_type === 'hotel_owner' ? '/hotels' : '/restaurants')}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Manage →
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.slice(0, 3).map((property) => (
            <div key={property.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                {user?.user_type === 'hotel_owner' ? (
                  <Building2 className="h-5 w-5 text-blue-600 mr-2" />
                ) : (
                  <Utensils className="h-5 w-5 text-orange-600 mr-2" />
                )}
                <h3 className="font-semibold text-gray-900">{property.name}</h3>
              </div>
              <p className="text-sm text-gray-600">{property.city}, {property.state}</p>
            </div>
          ))}
          {properties.length === 0 && (
            <p className="text-gray-600 col-span-full">No properties yet. Add your first property!</p>
          )}
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Recent Bookings</h2>
          <button
            onClick={() => navigate('/owner/bookings')}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            View All →
          </button>
        </div>
        <div className="space-y-4">
          {recentBookings.length > 0 ? (
            recentBookings.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="font-medium text-gray-900">#{booking.booking_reference}</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {booking.hotel ? booking.hotel.name : booking.restaurant?.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {booking.guest_name} • {booking.guest_phone}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900">₹{booking.total_amount}</p>
                  <p className="text-sm text-gray-600">
                    {booking.hotel_id 
                      ? `${new Date(booking.check_in_date).toLocaleDateString()} - ${new Date(booking.check_out_date).toLocaleDateString()}`
                      : `${new Date(booking.booking_date).toLocaleDateString()} ${booking.booking_time}`
                    }
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No bookings yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          onClick={() => navigate('/owner/bookings')}
          className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-left"
        >
          <Calendar className="h-8 w-8 text-blue-600 mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage Bookings</h3>
          <p className="text-gray-600 text-sm">View and manage all your bookings</p>
        </button>
        <button
          onClick={() => navigate('/owner/analytics')}
          className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-left"
        >
          <TrendingUp className="h-8 w-8 text-purple-600 mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">View Analytics</h3>
          <p className="text-gray-600 text-sm">Get insights into your business performance</p>
        </button>
      </div>
    </div>
  );
};

export default OwnerDashboard;

