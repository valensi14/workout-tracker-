import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useDB } from '../../db';
import type { Exercise, Routine, RoutineExercise } from '@workout/core';
import * as Crypto from 'expo-crypto';

interface SelectedExercise {
  exerciseId: string;
  sets: number;
  reps: string;
}

export default function NewProgramScreen() {
  const db = useDB();
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selected, setSelected] = useState<SelectedExercise[]>([]);

  useEffect(() => { db.getExercises().then(setExercises); }, [db]);

  function addExercise(exerciseId: string) {
    if (selected.find(s => s.exerciseId === exerciseId)) return;
    setSelected(p => [...p, { exerciseId, sets: 3, reps: '8-12' }]);
  }

  function removeExercise(exerciseId: string) {
    setSelected(p => p.filter(s => s.exerciseId !== exerciseId));
  }

  function showExercisePicker() {
    const available = exercises.filter(e => !selected.find(s => s.exerciseId === e.id));
    if (available.length === 0) { Alert.alert('All exercises added'); return; }
    Alert.alert(
      'Add Exercise',
      'Choose an exercise',
      [
        ...available.map(ex => ({ text: ex.name, onPress: () => addExercise(ex.id) })),
        { text: 'Cancel', style: 'cancel' as const },
      ]
    );
  }

  async function save() {
    if (!name.trim()) { Alert.alert('Name required'); return; }
    const programId = Crypto.randomUUID();
    const routineId = Crypto.randomUUID();
    const program = { id: programId, name: name.trim(), description: description.trim(), createdAt: Date.now() };
    const routine: Routine = { id: routineId, programId, name: 'Day 1', order: 0 };
    const routineExercises: RoutineExercise[] = selected.map((s, i) => ({
      id: Crypto.randomUUID(),
      routineId,
      exerciseId: s.exerciseId,
      sets: s.sets,
      reps: s.reps,
      order: i,
    }));
    try {
      await db.seedPrograms([program], [routine], routineExercises);
      router.back();
    } catch {
      Alert.alert('Error', "Couldn't save template — try again");
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>New Template</Text>
      <TextInput style={styles.input} placeholder="Template name" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Description (optional)" value={description} onChangeText={setDescription} />

      <Text style={styles.section}>Exercises</Text>

      {selected.length === 0 && (
        <Text style={styles.empty}>No exercises added yet.</Text>
      )}

      {selected.map(s => {
        const ex = exercises.find(e => e.id === s.exerciseId);
        return (
          <View key={s.exerciseId} style={styles.exRow}>
            <Text style={styles.exName} numberOfLines={1}>{ex?.name ?? s.exerciseId}</Text>
            <TextInput
              style={styles.smallInput}
              value={String(s.sets)}
              onChangeText={v => setSelected(p => p.map(x => x.exerciseId === s.exerciseId ? { ...x, sets: parseInt(v) || 1 } : x))}
              keyboardType="numeric"
            />
            <Text style={styles.label}>sets</Text>
            <TextInput
              style={styles.smallInput}
              value={s.reps}
              onChangeText={v => setSelected(p => p.map(x => x.exerciseId === s.exerciseId ? { ...x, reps: v } : x))}
            />
            <Text style={styles.label}>reps</Text>
            <TouchableOpacity onPress={() => removeExercise(s.exerciseId)}>
              <Text style={styles.remove}>×</Text>
            </TouchableOpacity>
          </View>
        );
      })}

      <TouchableOpacity onPress={showExercisePicker} style={styles.addBtn}>
        <Text style={styles.addBtnText}>+ Add Exercise</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={save} style={styles.saveBtn}>
        <Text style={styles.saveBtnText}>Save Template</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginBottom: 10 },
  section: { fontWeight: '600', fontSize: 16, marginTop: 8, marginBottom: 12 },
  empty: { color: '#aaa', fontSize: 14, marginBottom: 12 },
  exRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f9f9f9', borderRadius: 8, padding: 10, marginBottom: 8 },
  exName: { flex: 1, fontSize: 14, fontWeight: '500' },
  smallInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 6, padding: 4, width: 44, textAlign: 'center', fontSize: 13 },
  label: { fontSize: 12, color: '#888' },
  remove: { color: '#FF3B30', fontSize: 20, fontWeight: 'bold', paddingHorizontal: 4 },
  addBtn: { borderWidth: 1, borderColor: '#007AFF', borderRadius: 10, padding: 12, marginBottom: 12 },
  addBtnText: { color: '#007AFF', textAlign: 'center', fontWeight: '600' },
  saveBtn: { backgroundColor: '#007AFF', borderRadius: 10, padding: 14, marginBottom: 40 },
  saveBtnText: { color: '#fff', textAlign: 'center', fontWeight: 'bold', fontSize: 16 },
});
