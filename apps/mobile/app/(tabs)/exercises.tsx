// apps/mobile/app/(tabs)/exercises.tsx
import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TextInput, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useDB } from '../../db';
import type { Exercise } from '@workout/core';

export default function ExercisesScreen() {
  const db = useDB();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [query, setQuery] = useState('');

  useFocusEffect(useCallback(() => {
    db.getExercises().then(setExercises);
  }, [db]));

  const filtered = exercises.filter(e =>
    e.name.toLowerCase().includes(query.toLowerCase()) ||
    e.muscleGroup.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Exercises</Text>
      <TextInput
        style={styles.search}
        placeholder="Search exercises..."
        value={query}
        onChangeText={setQuery}
        clearButtonMode="while-editing"
      />
      <FlatList
        data={filtered}
        keyExtractor={e => e.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.meta}>{item.muscleGroup} · {item.equipment ?? 'no equipment'}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 12 },
  search: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 10, marginBottom: 12, fontSize: 15 },
  row: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  name: { fontSize: 16, fontWeight: '500' },
  meta: { fontSize: 13, color: '#888', marginTop: 2, textTransform: 'capitalize' },
});
