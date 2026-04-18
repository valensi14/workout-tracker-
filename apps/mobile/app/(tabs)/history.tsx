// apps/mobile/app/(tabs)/history.tsx
import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useDB } from '../../db';
import type { WorkoutSession } from '@workout/core';

export default function HistoryScreen() {
  const db = useDB();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);

  useFocusEffect(useCallback(() => {
    db.getSessions(50).then(setSessions);
  }, [db]));

  function formatDate(ts: number) {
    return new Date(ts).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  }

  function formatDuration(start: number, end: number | null) {
    if (!end) return '';
    const mins = Math.round((end - start) / 60000);
    return `${mins} min`;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>History</Text>
      <FlatList
        data={sessions}
        keyExtractor={s => s.id}
        ListEmptyComponent={<Text style={styles.empty}>No workouts yet. Start one from Today!</Text>}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View>
              <Text style={styles.date}>{formatDate(item.startedAt)}</Text>
              {item.notes && <Text style={styles.notes}>{item.notes}</Text>}
            </View>
            <Text style={styles.duration}>{formatDuration(item.startedAt, item.finishedAt)}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#eee' },
  date: { fontSize: 16, fontWeight: '500' },
  notes: { fontSize: 13, color: '#888', marginTop: 2 },
  duration: { fontSize: 14, color: '#888' },
  empty: { marginTop: 60, textAlign: 'center', color: '#aaa' },
});
