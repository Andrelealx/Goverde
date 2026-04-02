import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  label: string;
  value: number | string;
  sub?: string;
  color?: string;
}

export default function KpiCard({ label, value, sub, color = '#2D6A4F' }: Props) {
  return (
    <View style={styles.card}>
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {sub && <Text style={styles.sub}>{sub}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    margin: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  value: { fontSize: 28, fontWeight: '700', marginBottom: 4 },
  label: { fontSize: 13, color: '#374151', fontWeight: '500' },
  sub: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
});
