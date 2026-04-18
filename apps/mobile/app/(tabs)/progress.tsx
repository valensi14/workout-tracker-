// apps/mobile/app/(tabs)/progress.tsx
import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useDB } from '../../db';
import type { Exercise, WorkoutSet } from '@workout/core';
import { epley1RM, calculateVolume } from '@workout/core';

export default function ProgressScreen() {
  const db = useDB();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selected, setSelected] = useState<Exercise | null>(null);
  const [history, setHistory] = useState<WorkoutSet[]>([]);

  useFocusEffect(useCallback(() => {
    db.getExercises().then(setExercises);
  }, [db]));

  async function selectExercise(ex: Exercise) {
    setSelected(ex);
    const sets = await db.getSetsByExercise(ex.id);
    setHistory(sets);
  }

  const sessionBests = useMemo(() => {
    const groups: Record<string, WorkoutSet[]> = {};
    for (const s of history) (groups[s.sessionId] ??= []).push(s);
    return Object.entries(groups).map(([, sets], i) => {
      const best = sets.reduce((b, s) => epley1RM(s.weight, s.reps) > epley1RM(b.weight, b.reps) ? s : b);
      return {
        index: i + 1,
        estimated1RM: epley1RM(best.weight, best.reps),
        volume: calculateVolume(sets),
        bestWeight: best.weight,
        bestReps: best.reps,
        date: best.completedAt,
      };
    }).sort((a, b) => a.date - b.date);
  }, [history]);

  const allTimePR = history.length > 0
    ? history.reduce((b, s) => epley1RM(s.weight, s.reps) > epley1RM(b.weight, b.reps) ? s : b)
    : null;

  if (!selected) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Progress</Text>
        <Text style={styles.subtitle}>Select an exercise</Text>
        <FlatList
          data={exercises}
          keyExtractor={e => e.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.row} onPress={() => selectExercise(item)}>
              <Text style={styles.name}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={() => setSelected(null)} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>{selected.name}</Text>

      {allTimePR && (
        <View style={styles.prCard}>
          <Text style={styles.prLabel}>All-Time PR</Text>
          <Text style={styles.prValue}>{allTimePR.weight}kg × {allTimePR.reps} reps</Text>
          <Text style={styles.prEst}>Est. 1RM: {epley1RM(allTimePR.weight, allTimePR.reps)}kg</Text>
        </View>
      )}

      {sessionBests.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session History</Text>
          {sessionBests.map((b, i) => (
            <View key={i} style={styles.historyRow}>
              <Text style={styles.historyDate}>{new Date(b.date).toLocaleDateString()}</Text>
              <Text style={styles.historyStats}>
                Best: {b.bestWeight}kg×{b.bestReps} · 1RM: {b.estimated1RM}kg · Vol: {b.volume}kg
              </Text>
            </View>
          ))}
        </View>
      )}

      {history.length === 0 && (
        <Text style={styles.empty}>No logged sets yet.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { color: '#888', marginBottom: 16 },
  backBtn: { marginBottom: 8 },
  backText: { color: '#007AFF', fontSize: 16 },
  row: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  name: { fontSize: 16 },
  prCard: { backgroundColor: '#f0f7ff', borderRadius: 12, padding: 16, marginVertical: 16 },
  prLabel: { color: '#007AFF', fontWeight: '600', marginBottom: 4 },
  prValue: { fontSize: 22, fontWeight: 'bold' },
  prEst: { color: '#555', marginTop: 4 },
  section: { marginTop: 8 },
  sectionTitle: { fontWeight: '600', fontSize: 16, marginBottom: 8 },
  historyRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  historyDate: { fontSize: 14, fontWeight: '500', color: '#333' },
  historyStats: { fontSize: 13, color: '#666', marginTop: 2 },
  empty: { textAlign: 'center', color: '#aaa', marginTop: 40 },
});
