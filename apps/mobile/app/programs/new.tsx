// apps/mobile/app/programs/new.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useDB } from '../../db';
import type { Exercise, Routine, RoutineExercise } from '@workout/core';
import * as Crypto from 'expo-crypto';

export default function NewProgramScreen() {
  const db = useDB();
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [routines, setRoutines] = useState<Array<{ name: string; exercises: Array<{ exerciseId: string; sets: number; reps: string }> }>>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);

  useEffect(() => { db.getExercises().then(setExercises); }, []);

  function addRoutine() {
    setRoutines(prev => [...prev, { name: `Day ${prev.length + 1}`, exercises: [] }]);
  }

  function addExerciseToRoutine(routineIdx: number, exerciseId: string) {
    setRoutines(prev => prev.map((r, i) =>
      i === routineIdx ? { ...r, exercises: [...r.exercises, { exerciseId, sets: 3, reps: '8-12' }] } : r
    ));
  }

  async function save() {
    if (!name.trim()) { Alert.alert('Name required'); return; }
    const programId = Crypto.randomUUID();
    const program = { id: programId, name: name.trim(), description: description.trim(), createdAt: Date.now() };
    const rList: Routine[] = routines.map((r, i) => ({ id: Crypto.randomUUID(), programId, name: r.name, order: i }));
    const reList: RoutineExercise[] = routines.flatMap((r, ri) =>
      r.exercises.map((e, ei) => ({ id: Crypto.randomUUID(), routineId: rList[ri].id, exerciseId: e.exerciseId, sets: e.sets, reps: e.reps, order: ei }))
    );
    try {
      await db.seedPrograms([program], rList, reList);
      router.back();
    } catch {
      Alert.alert('Error', "Couldn't save program — try again");
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>New Program</Text>
      <TextInput style={styles.input} placeholder="Program name" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Description (optional)" value={description} onChangeText={setDescription} />

      <Text style={styles.section}>Days</Text>
      {routines.map((routine, ri) => (
        <View key={ri} style={styles.routineBlock}>
          <TextInput
            style={styles.input}
            value={routine.name}
            onChangeText={v => setRoutines(prev => prev.map((r, i) => i === ri ? { ...r, name: v } : r))}
          />
          {routine.exercises.map((e, ei) => {
            const ex = exercises.find(x => x.id === e.exerciseId);
            return <Text key={ei} style={styles.exerciseItem}>{ex?.name ?? e.exerciseId} — {e.sets}×{e.reps}</Text>;
          })}
          <TouchableOpacity onPress={() => {
            Alert.alert('Add Exercise', 'Choose exercise', exercises.slice(0, 10).map(ex => ({ text: ex.name, onPress: () => addExerciseToRoutine(ri, ex.id) })));
          }}>
            <Text style={styles.addEx}>+ Add Exercise</Text>
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity onPress={addRoutine} style={styles.addDay}>
        <Text style={styles.addDayText}>+ Add Day</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={save} style={styles.saveBtn}>
        <Text style={styles.saveBtnText}>Save Program</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginBottom: 10 },
  section: { fontWeight: '600', fontSize: 16, marginVertical: 12 },
  routineBlock: { borderWidth: 1, borderColor: '#eee', borderRadius: 10, padding: 12, marginBottom: 10 },
  exerciseItem: { color: '#555', fontSize: 14, marginBottom: 4 },
  addEx: { color: '#007AFF', fontSize: 14 },
  addDay: { borderWidth: 1, borderColor: '#007AFF', borderRadius: 10, padding: 12, marginBottom: 12 },
  addDayText: { color: '#007AFF', textAlign: 'center' },
  saveBtn: { backgroundColor: '#007AFF', borderRadius: 10, padding: 14, marginBottom: 40 },
  saveBtnText: { color: '#fff', textAlign: 'center', fontWeight: 'bold', fontSize: 16 },
});
