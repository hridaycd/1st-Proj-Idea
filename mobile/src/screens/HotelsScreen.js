import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput } from 'react-native';
import { fetchHotels } from '../services/api';

export default function HotelsScreen() {
  const [items, setItems] = useState([]);
  const [city, setCity] = useState('');

  const load = async () => {
    const res = await fetchHotels(city ? { city } : {});
    setItems(res || []);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city]);

  return (
    <View style={styles.container}>
      <TextInput placeholder="Filter by city" value={city} onChangeText={setCity} style={styles.input} />
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            <Text>{item.city}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12 },
  card: { padding: 12, borderWidth: 1, borderColor: '#eee', borderRadius: 10, marginBottom: 8 },
  name: { fontSize: 16, fontWeight: '600' },
});

