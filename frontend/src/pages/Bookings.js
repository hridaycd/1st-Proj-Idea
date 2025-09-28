import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Calendar, Building2, Utensils, Clock, MapPin, Phone, Mail, X, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';

const Bookings = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [filter, setFilter] = useState('all');

  const { data: bookings = [], isLoading } = useQuery(
    'user-bookings',
    async () => {
      const response = await axios.get('/api/bookings/my-bookings');
      return response.data;
    }
  );

  const cancelBookingMutation = useMutation(
    async (bookingId) => {
      const response = await axios.put(`/api/bookings/${bookingId}/cancel`);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('user-bookings');
        toast.success('Booking cancelled successfully');
        setSelectedBooking(null);
      },
      onError: (error) => {
        toast.error(error.response?.data?.detail || 'Failed to cancel booking');
      },
    }
  );

  const filteredBookings = bookings.filter(booking => {
    switch (filter) {
      case 'pending':
        return booking.status === 'pending';
      case 'confirmed':
        return booking.status === 'confirmed';
      case 'cancelled':
        return booking.status === 'cancelled';
      case 'completed':
        return booking.status === 'completed';
      default:
        return true;
    }
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
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleCancelBooking = (bookingId) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      cancelBookingMutation.mutate(bookingId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
        <p className="text-gray-600">Manage your hotel and restaurant bookings</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
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
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'completed'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Completed ({bookings.filter(b => b.status === 'completed').length})
          </button>
        </div>
      </div>

      {/* Bookings List */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
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
                      <div className="flex items-center text-gray-600 mt-1">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span className="text-sm">
                          {booking.hotel ? 
                            `${booking.hotel.city}, ${booking.hotel.state}` : 
                            `${booking.restaurant?.city}, ${booking.restaurant?.state}`
                          }
                        </span>
                      </div>
                    </div>

                    <div>
                      {booking.hotel_id ? (
                        <div>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Check-in:</span> {formatDate(booking.check_in_date)}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Check-out:</span> {formatDate(booking.check_out_date)}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Date:</span> {formatDate(booking.booking_date)}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Time:</span> {formatTime(booking.booking_time)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      <p><span className="font-medium">Guests:</span> {booking.guest_count}</p>
                      <p><span className="font-medium">Total:</span> ₹{booking.total_amount}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedBooking(booking)}
                        className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        View Details
                      </button>
                      {booking.status === 'pending' && (
                        <button
                          onClick={() => handleCancelBooking(booking.id)}
                          disabled={cancelBookingMutation.isLoading}
                          className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 border border-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredBookings.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
          <p className="text-gray-600 mb-4">You haven't made any bookings yet</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start Booking
          </button>
        </div>
      )}

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Booking Details
                </h2>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Booking Reference</p>
                    <p className="text-lg font-semibold text-gray-900">#{selectedBooking.booking_reference}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Status</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedBooking.status)}`}>
                      {getStatusIcon(selectedBooking.status)}
                      <span className="ml-1 capitalize">{selectedBooking.status}</span>
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600">Property</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedBooking.hotel ? selectedBooking.hotel.name : selectedBooking.restaurant?.name}
                  </p>
                  <div className="flex items-center text-gray-600 mt-1">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span className="text-sm">
                      {selectedBooking.hotel ? 
                        `${selectedBooking.hotel.address}, ${selectedBooking.hotel.city}, ${selectedBooking.hotel.state}` : 
                        `${selectedBooking.restaurant?.address}, ${selectedBooking.restaurant?.city}, ${selectedBooking.restaurant?.state}`
                      }
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Guest Name</p>
                    <p className="text-gray-900">{selectedBooking.guest_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Guest Phone</p>
                    <p className="text-gray-900">{selectedBooking.guest_phone}</p>
                  </div>
                </div>

                {selectedBooking.special_requests && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Special Requests</p>
                    <p className="text-gray-900">{selectedBooking.special_requests}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Amount</p>
                    <p className="text-lg font-semibold text-gray-900">₹{selectedBooking.total_amount}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Payment Status</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedBooking.payment_status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedBooking.payment_status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;
