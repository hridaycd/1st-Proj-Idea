import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiBaseUrl } from '../constants/config';

const api = axios.create({
  baseURL: getApiBaseUrl(),
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('auth_token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function login(email, password) {
  const res = await api.post('/api/auth/login', { email, password });
  return res.data;
}

export async function register(payload) {
  const res = await api.post('/api/auth/register', payload);
  return res.data;
}

export async function getMe() {
  const res = await api.get('/api/auth/me');
  return res.data;
}

export async function fetchHotels(params = {}) {
  const res = await api.get('/api/hotels', { params });
  return res.data;
}

export async function fetchRestaurants(params = {}) {
  const res = await api.get('/api/restaurants', { params });
  return res.data;
}

export async function fetchDashboard() {
  const res = await api.get('/api/analytics/dashboard');
  return res.data;
}

export async function fetchMyBookings() {
  const res = await api.get('/api/bookings/my-bookings');
  return res.data;
}

export async function createHotelBooking({ hotel_id, room_id, check_in_date, check_out_date }) {
  const res = await api.post('/api/bookings/hotel', {
    hotel_id,
    room_id,
    check_in_date, // YYYY-MM-DD
    check_out_date, // YYYY-MM-DD
  });
  return res.data;
}

export async function createRestaurantBooking({ restaurant_id, table_id, booking_time, num_guests = 2, duration_hours = 2 }) {
  const res = await api.post('/api/bookings/restaurant', {
    restaurant_id,
    table_id,
    booking_time, // ISO string
    num_guests,
    duration_hours,
  });
  return res.data;
}

export async function cancelBooking(bookingId) {
  const res = await api.put(`/api/bookings/${bookingId}/cancel`);
  return res.data;
}

export async function fetchHotelRooms(hotelId) {
  const res = await api.get(`/api/hotels/${hotelId}/rooms`);
  return res.data;
}

export async function fetchRestaurantTables(restaurantId) {
  const res = await api.get(`/api/restaurants/${restaurantId}/tables`);
  return res.data;
}

export async function fetchAvailableRooms(hotelId, { check_in, check_out }) {
  const res = await api.get(`/api/hotels/${hotelId}/rooms/available`, {
    params: { check_in, check_out },
  });
  return res.data;
}

export async function fetchAvailableTables(restaurantId, { booking_date, booking_time, duration_hours = 2, guest_count = 1 }) {
  const res = await api.get(`/api/restaurants/${restaurantId}/tables/available`, {
    params: { booking_date, booking_time, duration_hours, guest_count },
  });
  return res.data;
}

export default api;

