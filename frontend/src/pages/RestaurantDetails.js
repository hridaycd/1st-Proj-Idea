import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'react-query';
import axios from 'axios';
import { Utensils, MapPin, Star, Calendar, Clock, Users, Phone, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';

const RestaurantDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedTable, setSelectedTable] = useState(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [guests, setGuests] = useState(2);

  const { data: restaurant, isLoading } = useQuery(
    ['restaurant', id],
    async () => {
      const response = await axios.get(`/api/restaurants/${id}`);
      return response.data;
    }
  );

  const { data: tables = [] } = useQuery(
    ['restaurant-tables', id],
    async () => {
      const response = await axios.get(`/api/restaurants/${id}/tables`);
      return response.data;
    },
    { enabled: !!restaurant }
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

  const handleBookNow = () => {
    if (!selectedTable || !bookingDate || !bookingTime) {
      toast.error('Please select table, date, and time');
      return;
    }

    createBookingMutation.mutate({
      restaurant_id: id,
      table_id: selectedTable.id,
      booking_date: bookingDate,
      booking_time: bookingTime,
      guest_count: guests,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="text-center py-12">
        <Utensils className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Restaurant not found</h3>
        <button
          onClick={() => navigate('/restaurants')}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to Restaurants
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/restaurants')}
        className="flex items-center text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Restaurants
      </button>

      {/* Restaurant Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{restaurant.name}</h1>
            <div className="flex items-center text-gray-600 mb-2">
              <MapPin className="h-4 w-4 mr-1" />
              <span>{restaurant.address}, {restaurant.city}, {restaurant.state}</span>
            </div>
            <div className="flex items-center mb-2">
              <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
              <span className="text-sm font-medium">4.5</span>
              <span className="text-sm text-gray-600 ml-2">(120 reviews)</span>
            </div>
            {restaurant.cuisine_type && (
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {restaurant.cuisine_type}
              </span>
            )}
          </div>
        </div>

        {restaurant.description && (
          <p className="text-gray-600 mb-4">{restaurant.description}</p>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="flex items-center text-gray-600">
            <Phone className="h-4 w-4 mr-2" />
            <span className="text-sm">{restaurant.phone || 'N/A'}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <Mail className="h-4 w-4 mr-2" />
            <span className="text-sm">{restaurant.email || 'N/A'}</span>
          </div>
          {restaurant.opening_hours && (
            <div className="flex items-center text-gray-600">
              <Clock className="h-4 w-4 mr-2" />
              <span className="text-sm">{restaurant.opening_hours}</span>
            </div>
          )}
        </div>
      </div>

      {/* Booking Form */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Book a Table</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Booking Date
            </label>
            <input
              type="date"
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Booking Time
            </label>
            <input
              type="time"
              value={bookingTime}
              onChange={(e) => setBookingTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Guests
          </label>
          <input
            type="number"
            min="1"
            max="20"
            value={guests}
            onChange={(e) => setGuests(parseInt(e.target.value) || 1)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Tables Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Table
          </label>
          <div className="space-y-2">
            {tables.filter(table => table.capacity >= guests).map((table) => (
              <div
                key={table.id}
                onClick={() => setSelectedTable(table)}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  selectedTable?.id === table.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">Table {table.table_number}</h3>
                    <p className="text-sm text-gray-600">{table.description || 'Comfortable table'}</p>
                    <div className="flex items-center mt-2 text-sm text-gray-600">
                      <Users className="h-4 w-4 mr-1" />
                      <span>Seats {table.capacity} guests</span>
                    </div>
                  </div>
                  {selectedTable?.id === table.id && (
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedTable && bookingDate && bookingTime && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Booking Summary</p>
                <p className="text-lg font-semibold text-gray-900">
                  Table {selectedTable.table_number} for {guests} guests
                </p>
                <p className="text-sm text-gray-600">
                  {new Date(bookingDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {bookingTime}
                </p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleBookNow}
          disabled={!selectedTable || !bookingDate || !bookingTime || createBookingMutation.isLoading}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {createBookingMutation.isLoading ? 'Processing...' : 'Book Table'}
        </button>
      </div>
    </div>
  );
};

export default RestaurantDetails;

