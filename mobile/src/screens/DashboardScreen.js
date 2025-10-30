import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, RefreshControl, ScrollView } from 'react-native';
import { fetchDashboard } from '../services/api';

export default function DashboardScreen() {
  const [data, setData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setRefreshing(true);
    try {
      const d = await fetchDashboard();
      setData(d);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}>
      <Text style={styles.title}>Dashboard</Text>
      <Text>{data ? JSON.stringify(data, null, 2) : 'Loading...'}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 16, gap: 12 },
  title: { fontSize: 22, fontWeight: '600' },
});

