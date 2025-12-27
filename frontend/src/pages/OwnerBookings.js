import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Calendar, Building2, Utensils, Clock, CheckCircle, X, AlertCircle, Search, Filter } from 'lucide-react';
import { toast } from 'react-toastify';

const OwnerBookings = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: bookings = [], isLoading } = useQuery(
    'owner-bookings',
    async () => {
      const response = await axios.get('/api/bookings/owner-bookings');
      return response.data;
    }
  );

  const updateBookingStatusMutation = useMutation(
    async ({ bookingId, status }) => {
      const response = await axios.put(`/api/bookings/${bookingId}/status`, { status });
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('owner-bookings');
        toast.success('Booking status updated successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.detail || 'Failed to update booking status');
      },
    }
  );

  const filteredBookings = bookings.filter(booking => {
    const matchesFilter = filter === 'all' || booking.status === filter;
    const matchesSearch = 
      booking.booking_reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.guest_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.guest_phone?.includes(searchQuery) ||
      (booking.hotel?.name || booking.restaurant?.name)?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'cancelled':
        return <X className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const handleStatusUpdate = (bookingId, newStatus) => {
    if (window.confirm(`Are you sure you want to ${newStatus} this booking?`)) {
      updateBookingStatusMutation.mutate({ bookingId, status: newStatus });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Bookings</h1>
            <p className="text-gray-600">View and manage all bookings for your properties</p>
          </div>
          <button
            onClick={() => navigate('/owner/dashboard')}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search by reference, guest name, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({bookings.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'pending'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pending ({bookings.filter(b => b.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilter('confirmed')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'confirmed'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Confirmed ({bookings.filter(b => b.status === 'confirmed').length})
          </button>
          <button
            onClick={() => setFilter('cancelled')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'cancelled'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Cancelled ({bookings.filter(b => b.status === 'cancelled').length})
          </button>
        </div>
      </div>

      {/* Bookings List */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    {booking.hotel_id ? (
                      <Building2 className="h-5 w-5 text-blue-600" />
                    ) : (
                      <Utensils className="h-5 w-5 text-orange-600" />
                    )}
                    <h3 className="text-lg font-semibold text-gray-900">
                      #{booking.booking_reference}
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                      {getStatusIcon(booking.status)}
                      <span className="ml-1 capitalize">{booking.status}</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {booking.hotel ? booking.hotel.name : booking.restaurant?.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {booking.hotel ? 
                          `${booking.hotel.city}, ${booking.hotel.state}` : 
                          `${booking.restaurant?.city}, ${booking.restaurant?.state}`
                        }
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-900">Guest Information</p>
                      <p className="text-sm text-gray-600">{booking.guest_name}</p>
                      <p className="text-sm text-gray-600">{booking.guest_phone}</p>
                    </div>

                    <div>
                      {booking.hotel_id ? (
                        <div>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Check-in:</span> {new Date(booking.check_in_date).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Check-out:</span> {new Date(booking.check_out_date).toLocaleDateString()}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Date:</span> {new Date(booking.booking_date).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Time:</span> {booking.booking_time}
                          </p>
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Guests:</span> {booking.guest_count}
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        ₹{booking.total_amount}
                      </p>
                      <p className="text-sm text-gray-600">
                        Payment: <span className={booking.payment_status === 'completed' ? 'text-green-600' : 'text-yellow-600'}>
                          {booking.payment_status}
                        </span>
                      </p>
                    </div>
                  </div>

                  {booking.special_requests && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 mb-1">Special Requests:</p>
                      <p className="text-sm text-gray-600">{booking.special_requests}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {booking.status === 'pending' && (
                <div className="flex space-x-2 pt-4 border-t">
                  <button
                    onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                    disabled={updateBookingStatusMutation.isLoading}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 font-medium"
                  >
                    Accept Booking
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                    disabled={updateBookingStatusMutation.isLoading}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 font-medium"
                  >
                    Reject Booking
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {filteredBookings.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
          <p className="text-gray-600">No bookings match your search criteria</p>
        </div>
      )}
    </div>
  );
};

export default OwnerBookings;

