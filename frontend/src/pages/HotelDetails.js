import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'react-query';
import axios from 'axios';
import { Building2, MapPin, Star, Calendar, Users, Phone, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';

const HotelDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);

  const { data: hotel, isLoading } = useQuery(
    ['hotel', id],
    async () => {
      const response = await axios.get(`/api/hotels/${id}`);
      return response.data;
    }
  );

  const { data: rooms = [] } = useQuery(
    ['hotel-rooms', id],
    async () => {
      const response = await axios.get(`/api/hotels/${id}/rooms`);
      return response.data;
    },
    { enabled: !!hotel }
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
    if (!selectedRoom || !checkIn || !checkOut) {
      toast.error('Please select room, check-in, and check-out dates');
      return;
    }

    createBookingMutation.mutate({
      hotel_id: id,
      room_id: selectedRoom.id,
      check_in_date: checkIn,
      check_out_date: checkOut,
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

  if (!hotel) {
    return (
      <div className="text-center py-12">
        <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Hotel not found</h3>
        <button
          onClick={() => navigate('/hotels')}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to Hotels
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/hotels')}
        className="flex items-center text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Hotels
      </button>

      {/* Hotel Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{hotel.name}</h1>
            <div className="flex items-center text-gray-600 mb-2">
              <MapPin className="h-4 w-4 mr-1" />
              <span>{hotel.address}, {hotel.city}, {hotel.state}</span>
            </div>
            <div className="flex items-center">
              <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
              <span className="text-sm font-medium">4.5</span>
              <span className="text-sm text-gray-600 ml-2">(120 reviews)</span>
            </div>
          </div>
        </div>

        {hotel.description && (
          <p className="text-gray-600 mb-4">{hotel.description}</p>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="flex items-center text-gray-600">
            <Phone className="h-4 w-4 mr-2" />
            <span className="text-sm">{hotel.phone || 'N/A'}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <Mail className="h-4 w-4 mr-2" />
            <span className="text-sm">{hotel.email || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Booking Form */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Book Your Stay</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Check-in Date
            </label>
            <input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Check-out Date
            </label>
            <input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              min={checkIn || new Date().toISOString().split('T')[0]}
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
            max="10"
            value={guests}
            onChange={(e) => setGuests(parseInt(e.target.value) || 1)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Rooms Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Room
          </label>
          <div className="space-y-2">
            {rooms.map((room) => (
              <div
                key={room.id}
                onClick={() => setSelectedRoom(room)}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  selectedRoom?.id === room.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{room.room_type}</h3>
                    <p className="text-sm text-gray-600">{room.description || 'Comfortable room with all amenities'}</p>
                    <div className="flex items-center mt-2 text-sm text-gray-600">
                      <Users className="h-4 w-4 mr-1" />
                      <span>Max {room.capacity} guests</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">₹{room.price_per_night}</p>
                    <p className="text-sm text-gray-600">per night</p>
                    {selectedRoom?.id === room.id && (
                      <CheckCircle className="h-5 w-5 text-blue-600 mt-2 ml-auto" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedRoom && checkIn && checkOut && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{selectedRoom.price_per_night * Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24))}
                </p>
                <p className="text-sm text-gray-600">
                  {Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24))} nights × ₹{selectedRoom.price_per_night}
                </p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleBookNow}
          disabled={!selectedRoom || !checkIn || !checkOut || createBookingMutation.isLoading}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {createBookingMutation.isLoading ? 'Processing...' : 'Book Now'}
        </button>
      </div>
    </div>
  );
};

export default HotelDetails;

