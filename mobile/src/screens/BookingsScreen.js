import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TextInput, Button, Alert, Platform, Modal, TouchableOpacity } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { fetchMyBookings, createHotelBooking, createRestaurantBooking, cancelBooking, fetchHotels, fetchRestaurants, fetchAvailableRooms, fetchAvailableTables } from '../services/api';

export default function BookingsScreen() {
  const [items, setItems] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [type, setType] = useState('hotel'); // 'hotel' | 'restaurant'
  const [hotelId, setHotelId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [checkIn, setCheckIn] = useState(''); // YYYY-MM-DD
  const [checkOut, setCheckOut] = useState(''); // YYYY-MM-DD
  const [restaurantId, setRestaurantId] = useState('');
  const [tableId, setTableId] = useState('');
  const [bookingTime, setBookingTime] = useState(''); // ISO datetime
  const [guestCount, setGuestCount] = useState('2');
  const [durationHours, setDurationHours] = useState('2');
  const [showCheckInPicker, setShowCheckInPicker] = useState(false);
  const [showCheckOutPicker, setShowCheckOutPicker] = useState(false);
  const [showBookingTimePicker, setShowBookingTimePicker] = useState(false);
  const [hotels, setHotels] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [tables, setTables] = useState([]);
  const [hotelSearch, setHotelSearch] = useState('');
  const [restaurantSearch, setRestaurantSearch] = useState('');
  const [roomModalVisible, setRoomModalVisible] = useState(false);
  const [hotelModalVisible, setHotelModalVisible] = useState(false);
  const [tableModalVisible, setTableModalVisible] = useState(false);
  const [restaurantModalVisible, setRestaurantModalVisible] = useState(false);

  const load = async () => {
    setRefreshing(true);
    try {
      const res = await fetchMyBookings();
      setItems(Array.isArray(res) ? res : []);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    (async () => {
      const [h, r] = await Promise.all([
        fetchHotels({ limit: 50 }),
        fetchRestaurants({ limit: 50 }),
      ]);
      setHotels(Array.isArray(h) ? h : []);
      setRestaurants(Array.isArray(r) ? r : []);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (hotelId && checkIn && checkOut) {
        try {
          const rs = await fetchAvailableRooms(Number(hotelId), { check_in: checkIn, check_out: checkOut });
          setRooms(Array.isArray(rs) ? rs : []);
        } catch {
          setRooms([]);
        }
      } else {
        setRooms([]);
      }
    })();
  }, [hotelId, checkIn, checkOut]);

  useEffect(() => {
    (async () => {
      if (restaurantId && bookingTime) {
        try {
          const date = bookingTime.slice(0, 10);
          const ts = await fetchAvailableTables(Number(restaurantId), {
            booking_date: date,
            booking_time: bookingTime,
            duration_hours: Number(durationHours) || 2,
            guest_count: Number(guestCount) || 1,
          });
          setTables(Array.isArray(ts) ? ts : []);
        } catch {
          setTables([]);
        }
      } else {
        setTables([]);
      }
    })();
  }, [restaurantId, bookingTime, durationHours, guestCount]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Bookings</Text>
      <View style={styles.form}>
        <View style={styles.row}>
          <Button title={type === 'hotel' ? 'Hotel (selected)' : 'Hotel'} onPress={() => setType('hotel')} />
          <Button title={type === 'restaurant' ? 'Restaurant (selected)' : 'Restaurant'} onPress={() => setType('restaurant')} />
        </View>
        {type === 'hotel' ? (
          <>
            <Text style={styles.label}>Hotel</Text>
            <View style={styles.selectorRow}>
              <Button title={hotelId ? `Hotel #${hotelId}` : 'Select Hotel'} onPress={() => setHotelModalVisible(true)} />
              {hotelId ? <Button title="Clear" onPress={() => { setHotelId(''); setRooms([]); setRoomId(''); }} /> : null}
            </View>
            <Text style={styles.label}>Room</Text>
            <View style={styles.selectorRow}>
              <Button title={roomId ? `Room #${roomId}` : 'Select Room'} onPress={() => setRoomModalVisible(true)} disabled={!hotels.length || !hotelId || !checkIn || !checkOut} />
              {roomId ? <Button title="Clear" onPress={() => setRoomId('')} /> : null}
            </View>
            <Button title={checkIn ? `Check-in: ${checkIn}` : 'Pick check-in date'} onPress={() => setShowCheckInPicker(true)} />
            {showCheckInPicker && (
              <DateTimePicker
                value={checkIn ? new Date(checkIn) : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_, date) => {
                  setShowCheckInPicker(false);
                  if (date) setCheckIn(date.toISOString().slice(0, 10));
                }}
              />
            )}
            <Button title={checkOut ? `Check-out: ${checkOut}` : 'Pick check-out date'} onPress={() => setShowCheckOutPicker(true)} />
            {showCheckOutPicker && (
              <DateTimePicker
                value={checkOut ? new Date(checkOut) : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_, date) => {
                  setShowCheckOutPicker(false);
                  if (date) setCheckOut(date.toISOString().slice(0, 10));
                }}
              />
            )}
            <Button
              title={creating ? 'Creating...' : 'Create Hotel Booking'}
              disabled={creating || !hotelId || !roomId || !checkIn || !checkOut || (new Date(checkOut) <= new Date(checkIn))}
              onPress={async () => {
                if (!hotelId || !roomId || !checkIn || !checkOut) return Alert.alert('Missing fields', 'Fill all hotel booking fields');
                const start = new Date(checkIn);
                const end = new Date(checkOut);
                if (!(start instanceof Date) || !(end instanceof Date) || isNaN(start) || isNaN(end)) {
                  return Alert.alert('Invalid dates', 'Pick valid check-in and check-out dates');
                }
                if (end <= start) {
                  return Alert.alert('Invalid range', 'Check-out must be after check-in');
                }
                setCreating(true);
                try {
                  await createHotelBooking({
                    hotel_id: Number(hotelId),
                    room_id: Number(roomId),
                    check_in_date: checkIn,
                    check_out_date: checkOut,
                  });
                  setHotelId('');
                  setRoomId('');
                  setCheckIn('');
                  setCheckOut('');
                  await load();
                } catch (e) {
                  Alert.alert('Failed', e?.response?.data?.detail || 'Could not create booking');
                } finally {
                  setCreating(false);
                }
              }}
            />
          </>
        ) : (
          <>
            <Text style={styles.label}>Restaurant</Text>
            <View style={styles.selectorRow}>
              <Button title={restaurantId ? `Restaurant #${restaurantId}` : 'Select Restaurant'} onPress={() => setRestaurantModalVisible(true)} />
              {restaurantId ? <Button title="Clear" onPress={() => { setRestaurantId(''); setTables([]); setTableId(''); }} /> : null}
            </View>
            <Text style={styles.label}>Table</Text>
            <View style={styles.selectorRow}>
              <Button title={tableId ? `Table #${tableId}` : 'Select Table'} onPress={() => setTableModalVisible(true)} disabled={!restaurants.length || !restaurantId || !bookingTime} />
              {tableId ? <Button title="Clear" onPress={() => setTableId('')} /> : null}
            </View>
            <Button title={bookingTime ? `Time: ${bookingTime}` : 'Pick booking time'} onPress={() => setShowBookingTimePicker(true)} />
            {showBookingTimePicker && (
              <DateTimePicker
                value={bookingTime ? new Date(bookingTime) : new Date()}
                mode="datetime"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_, date) => {
                  setShowBookingTimePicker(false);
                  if (date) setBookingTime(date.toISOString().slice(0, 19));
                }}
              />
            )}
            <View style={styles.row}>
              <TextInput placeholder="Guests" keyboardType="numeric" value={guestCount} onChangeText={setGuestCount} style={[styles.input, { flex: 1 }]} />
              <TextInput placeholder="Duration (hrs)" keyboardType="numeric" value={durationHours} onChangeText={setDurationHours} style={[styles.input, { flex: 1 }]} />
            </View>
            <Button
              title={creating ? 'Creating...' : 'Create Restaurant Booking'}
              disabled={creating || !restaurantId || !tableId || !bookingTime || !(Number(guestCount) > 0) || !(Number(durationHours) > 0)}
              onPress={async () => {
                if (!restaurantId || !tableId || !bookingTime) return Alert.alert('Missing fields', 'Fill all restaurant booking fields');
                setCreating(true);
                try {
                  await createRestaurantBooking({
                    restaurant_id: Number(restaurantId),
                    table_id: Number(tableId),
                    booking_time: bookingTime,
                    num_guests: Number(guestCount) || 1,
                    duration_hours: Number(durationHours) || 2,
                  });
                  setRestaurantId('');
                  setTableId('');
                  setBookingTime('');
                  setGuestCount('2');
                  setDurationHours('2');
                  await load();
                } catch (e) {
                  Alert.alert('Failed', e?.response?.data?.detail || 'Could not create booking');
                } finally {
                  setCreating(false);
                }
              }}
            />
          </>
        )}
      </View>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>Ref: {item.reference || item.id}</Text>
            <Text>Status: {item.status}</Text>
            {item.hotel_id ? <Text>Hotel ID: {item.hotel_id}</Text> : null}
            {item.restaurant_id ? <Text>Restaurant ID: {item.restaurant_id}</Text> : null}
            {item.status !== 'CANCELLED' && (
              <View style={{ marginTop: 8 }}>
                <Button title="Cancel" color="#b91c1c" onPress={async () => {
                  try {
                    await cancelBooking(item.id);
                    await load();
                  } catch (e) {
                    Alert.alert('Failed', e?.response?.data?.detail || 'Could not cancel booking');
                  }
                }} />
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={<Text>No bookings yet.</Text>}
      />
    </View>
    {/* Hotel Modal */}
    <Modal visible={hotelModalVisible} animationType="slide">
      <View style={styles.modalContainer}>
        <Text style={styles.modalTitle}>Select Hotel</Text>
        <TextInput placeholder="Search hotels" value={hotelSearch} onChangeText={setHotelSearch} style={styles.input} />
        <FlatList
          data={hotels.filter(h => !hotelSearch || h.name?.toLowerCase().includes(hotelSearch.toLowerCase()))}
          keyExtractor={(i) => String(i.id)}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.rowItem} onPress={() => { setHotelId(String(item.id)); setHotelModalVisible(false); setRoomId(''); }}>
              <Text>{item.name}</Text>
              <Text style={styles.dim}>#{item.id}</Text>
            </TouchableOpacity>
          )}
        />
        <Button title="Close" onPress={() => setHotelModalVisible(false)} />
      </View>
    </Modal>
    {/* Room Modal */}
    <Modal visible={roomModalVisible} animationType="slide">
      <View style={styles.modalContainer}>
        <Text style={styles.modalTitle}>Select Room</Text>
        <FlatList
          data={rooms}
          keyExtractor={(i) => String(i.id)}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.rowItem} onPress={() => { setRoomId(String(item.id)); setRoomModalVisible(false); }}>
              <Text>{item.name || `Room ${item.id}`}</Text>
              <Text style={styles.dim}>#{item.id}</Text>
            </TouchableOpacity>
          )}
        />
        <Button title="Close" onPress={() => setRoomModalVisible(false)} />
      </View>
    </Modal>
    {/* Restaurant Modal */}
    <Modal visible={restaurantModalVisible} animationType="slide">
      <View style={styles.modalContainer}>
        <Text style={styles.modalTitle}>Select Restaurant</Text>
        <TextInput placeholder="Search restaurants" value={restaurantSearch} onChangeText={setRestaurantSearch} style={styles.input} />
        <FlatList
          data={restaurants.filter(r => !restaurantSearch || r.name?.toLowerCase().includes(restaurantSearch.toLowerCase()))}
          keyExtractor={(i) => String(i.id)}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.rowItem} onPress={() => { setRestaurantId(String(item.id)); setRestaurantModalVisible(false); setTableId(''); }}>
              <Text>{item.name}</Text>
              <Text style={styles.dim}>#{item.id}</Text>
            </TouchableOpacity>
          )}
        />
        <Button title="Close" onPress={() => setRestaurantModalVisible(false)} />
      </View>
    </Modal>
    {/* Table Modal */}
    <Modal visible={tableModalVisible} animationType="slide">
      <View style={styles.modalContainer}>
        <Text style={styles.modalTitle}>Select Table</Text>
        <FlatList
          data={tables}
          keyExtractor={(i) => String(i.id)}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.rowItem} onPress={() => { setTableId(String(item.id)); setTableModalVisible(false); }}>
              <Text>{item.name || `Table ${item.id}`}</Text>
              <Text style={styles.dim}>#{item.id}</Text>
            </TouchableOpacity>
          )}
        />
        <Button title="Close" onPress={() => setTableModalVisible(false)} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  title: { fontSize: 22, fontWeight: '600' },
  card: { padding: 12, borderWidth: 1, borderColor: '#eee', borderRadius: 10, marginBottom: 8 },
  name: { fontSize: 16, fontWeight: '600' },
  form: { padding: 12, borderWidth: 1, borderColor: '#ddd', borderRadius: 10, gap: 8, marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  selectorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: '#ccc', marginRight: 8 },
  pillActive: { backgroundColor: '#eef2ff', borderColor: '#6366f1' },
  modalContainer: { flex: 1, padding: 16, gap: 12 },
  modalTitle: { fontSize: 20, fontWeight: '600' },
  rowItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee', flexDirection: 'row', justifyContent: 'space-between' },
  dim: { color: '#6b7280' },
});

