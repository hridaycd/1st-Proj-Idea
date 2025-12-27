import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation } from 'react-query';
import axios from 'axios';
import { Calendar, Building2, Utensils, Users, ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';

const BookingForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [bookingType, setBookingType] = useState(location.state?.type || 'hotel');
  const [selectedHotel, setSelectedHotel] = useState(location.state?.hotelId || '');
  const [selectedRestaurant, setSelectedRestaurant] = useState(location.state?.restaurantId || '');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [guests, setGuests] = useState(1);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  const { data: hotels = [] } = useQuery(
    'hotels',
    async () => {
      const response = await axios.get('/api/hotels');
      return response.data;
    },
    { enabled: bookingType === 'hotel' }
  );

  const { data: restaurants = [] } = useQuery(
    'restaurants',
    async () => {
      const response = await axios.get('/api/restaurants');
      return response.data;
    },
    { enabled: bookingType === 'restaurant' }
  );

  const createBookingMutation = useMutation(
    async (bookingData) => {
      const response = await axios.post('/api/bookings', bookingData);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Booking created successfully!');
        navigate('/bookings');
      },
      onError: (error) => {
        toast.error(error.response?.data?.detail || 'Failed to create booking');
      },
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();

    if (bookingType === 'hotel') {
      if (!selectedHotel || !checkIn || !checkOut || !guestName || !guestPhone) {
        toast.error('Please fill all required fields');
        return;
      }
      createBookingMutation.mutate({
        hotel_id: selectedHotel,
        check_in_date: checkIn,
        check_out_date: checkOut,
        guest_count: guests,
        guest_name: guestName,
        guest_phone: guestPhone,
        guest_email: guestEmail,
        special_requests: specialRequests,
      });
    } else {
      if (!selectedRestaurant || !bookingDate || !bookingTime || !guestName || !guestPhone) {
        toast.error('Please fill all required fields');
        return;
      }
      createBookingMutation.mutate({
        restaurant_id: selectedRestaurant,
        booking_date: bookingDate,
        booking_time: bookingTime,
        guest_count: guests,
        guest_name: guestName,
        guest_phone: guestPhone,
        guest_email: guestEmail,
        special_requests: specialRequests,
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Booking</h1>
        <p className="text-gray-600">Fill in the details to complete your booking</p>
      </div>

      {/* Booking Type Selection */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-4">
          Booking Type
        </label>
        <div className="flex space-x-4">
          <button
            onClick={() => setBookingType('hotel')}
            className={`flex-1 p-4 border-2 rounded-lg transition-colors ${
              bookingType === 'hotel'
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Building2 className={`h-6 w-6 mx-auto mb-2 ${bookingType === 'hotel' ? 'text-blue-600' : 'text-gray-400'}`} />
            <span className={`font-medium ${bookingType === 'hotel' ? 'text-blue-600' : 'text-gray-600'}`}>
              Hotel Booking
            </span>
          </button>
          <button
            onClick={() => setBookingType('restaurant')}
            className={`flex-1 p-4 border-2 rounded-lg transition-colors ${
              bookingType === 'restaurant'
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Utensils className={`h-6 w-6 mx-auto mb-2 ${bookingType === 'restaurant' ? 'text-blue-600' : 'text-gray-400'}`} />
            <span className={`font-medium ${bookingType === 'restaurant' ? 'text-blue-600' : 'text-gray-600'}`}>
              Restaurant Booking
            </span>
          </button>
        </div>
      </div>

      {/* Booking Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 space-y-6">
        {/* Property Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {bookingType === 'hotel' ? 'Select Hotel' : 'Select Restaurant'} *
          </label>
          <select
            value={bookingType === 'hotel' ? selectedHotel : selectedRestaurant}
            onChange={(e) => {
              if (bookingType === 'hotel') {
                setSelectedHotel(e.target.value);
              } else {
                setSelectedRestaurant(e.target.value);
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Select {bookingType === 'hotel' ? 'Hotel' : 'Restaurant'}</option>
            {bookingType === 'hotel'
              ? hotels.map((hotel) => (
                  <option key={hotel.id} value={hotel.id}>
                    {hotel.name} - {hotel.city}
                  </option>
                ))
              : restaurants.map((restaurant) => (
                  <option key={restaurant.id} value={restaurant.id}>
                    {restaurant.name} - {restaurant.city}
                  </option>
                ))}
          </select>
        </div>

        {/* Date/Time Fields */}
        {bookingType === 'hotel' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Check-in Date *
              </label>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Check-out Date *
              </label>
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                min={checkIn || new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Booking Date *
              </label>
              <input
                type="date"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Booking Time *
              </label>
              <input
                type="time"
                value={bookingTime}
                onChange={(e) => setBookingTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>
        )}

        {/* Guests */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Guests *
          </label>
          <input
            type="number"
            min="1"
            max={bookingType === 'hotel' ? '10' : '20'}
            value={guests}
            onChange={(e) => setGuests(parseInt(e.target.value) || 1)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        {/* Guest Information */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Guest Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Guest Name *
              </label>
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Guest Phone *
              </label>
              <input
                type="tel"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Guest Email
              </label>
              <input
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Special Requests
              </label>
              <textarea
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Any special requests or preferences..."
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4 pt-4 border-t">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createBookingMutation.isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {createBookingMutation.isLoading ? 'Processing...' : 'Create Booking'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BookingForm;

