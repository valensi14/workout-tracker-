// apps/mobile/app/workout/[id].tsx
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Alert, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDB } from '../../db';
import { useWorkoutStore } from '../../store/workout';
import type { Exercise } from '@workout/core';
import { getNextRoutineIndex } from '@workout/core';
import * as Crypto from 'expo-crypto';

interface SetEntry { id: string; exerciseId: string; weight: string; reps: string; done: boolean; }

export default function ActiveWorkoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useDB();
  const router = useRouter();
  const { activeSession, sets, addSet, finishSession } = useWorkoutStore();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [localSets, setLocalSets] = useState<SetEntry[]>([]);
  const [restSeconds, setRestSeconds] = useState<number | null>(null);

  useEffect(() => {
    if (!activeSession?.routineId) return;
    (async () => {
      const res = await db.getRoutineExercises(activeSession.routineId!);
      const exList = (await Promise.all(res.map(re => db.getExerciseById(re.exerciseId)))).filter(Boolean) as Exercise[];
      setExercises(exList);
      // Pre-populate one empty set row per exercise
      setLocalSets(exList.map(ex => ({ id: Crypto.randomUUID(), exerciseId: ex.id, weight: '', reps: '', done: false })));
    })();
  }, [activeSession]);

  // Rest timer countdown
  useEffect(() => {
    if (restSeconds === null || restSeconds <= 0) {
      if (restSeconds === 0) setRestSeconds(null);
      return;
    }
    const t = setTimeout(() => setRestSeconds(s => (s ?? 1) - 1), 1000);
    return () => clearTimeout(t);
  }, [restSeconds]);

  function addRow(exerciseId: string) {
    setLocalSets(p => [...p, { id: Crypto.randomUUID(), exerciseId, weight: '', reps: '', done: false }]);
  }

  async function completeSet(entry: SetEntry) {
    const weight = parseFloat(entry.weight);
    const reps = parseInt(entry.reps, 10);
    if (isNaN(weight) || isNaN(reps)) {
      Alert.alert('Invalid input', 'Enter valid weight and reps');
      return;
    }
    const newSet = {
      id: entry.id,
      sessionId: id!,
      exerciseId: entry.exerciseId,
      setNumber: sets.filter(s => s.exerciseId === entry.exerciseId).length + 1,
      weight,
      reps,
      rpe: null,
      completedAt: Date.now(),
    };
    try {
      await db.addSet(newSet);
      addSet(newSet);
      setLocalSets(p => p.map(s => s.id === entry.id ? { ...s, done: true } : s));
      setRestSeconds(90);
    } catch {
      Alert.alert('Error', "Couldn't save set — try again");
    }
  }

  async function handleFinish() {
    if (!id) return;
    try {
      await db.finishSession(id, Date.now());
      // Advance program index
      const activeProgramId = await db.getSetting('active_program_id');
      if (activeProgramId && activeSession?.routineId) {
        const routines = await db.getRoutinesByProgram(activeProgramId);
        const currentIdx = routines.findIndex(r => r.id === activeSession.routineId);
        const nextIdx = getNextRoutineIndex(currentIdx >= 0 ? currentIdx : 0, routines.length);
        await db.setSetting('active_routine_index', String(nextIdx));
      }
      finishSession();
      router.back();
    } catch {
      Alert.alert('Error', "Couldn't finish workout — try again");
    }
  }

  return (
    <View style={styles.container}>
      {restSeconds !== null && (
        <View style={styles.restBanner}>
          <Text style={styles.restText}>Rest: {restSeconds}s</Text>
          <TouchableOpacity onPress={() => setRestSeconds(null)}>
            <Text style={styles.skipRest}>Skip</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView>
        {exercises.map(exercise => {
          const exSets = localSets.filter(s => s.exerciseId === exercise.id);
          return (
            <View key={exercise.id} style={styles.exerciseBlock}>
              <Text style={styles.exerciseName}>{exercise.name}</Text>
              {exSets.map(entry => (
                <View key={entry.id} style={styles.setRow}>
                  <TextInput
                    style={[styles.input, entry.done && styles.inputDone]}
                    placeholder="kg"
                    value={entry.weight}
                    onChangeText={v => setLocalSets(p => p.map(s => s.id === entry.id ? { ...s, weight: v } : s))}
                    keyboardType="numeric"
                    editable={!entry.done}
                  />
                  <TextInput
                    style={[styles.input, entry.done && styles.inputDone]}
                    placeholder="reps"
                    value={entry.reps}
                    onChangeText={v => setLocalSets(p => p.map(s => s.id === entry.id ? { ...s, reps: v } : s))}
                    keyboardType="numeric"
                    editable={!entry.done}
                  />
                  {entry.done
                    ? <Text style={styles.done}>✓</Text>
                    : <TouchableOpacity onPress={() => completeSet(entry)} style={styles.logBtn}>
                        <Text style={styles.logBtnText}>Log</Text>
                      </TouchableOpacity>}
                </View>
              ))}
              <TouchableOpacity onPress={() => addRow(exercise.id)} style={styles.addSet}>
                <Text style={styles.addSetText}>+ Add Set</Text>
              </TouchableOpacity>
            </View>
          );
        })}

        {exercises.length === 0 && (
          <Text style={styles.empty}>No exercises in this routine.</Text>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.finishButton} onPress={handleFinish}>
        <Text style={styles.finishText}>Finish Workout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  restBanner: { backgroundColor: '#FF9500', padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  restText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  skipRest: { color: '#fff', textDecorationLine: 'underline' },
  exerciseBlock: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  exerciseName: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  setRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, width: 70, textAlign: 'center' },
  inputDone: { borderColor: '#ccc', backgroundColor: '#f5f5f5', color: '#aaa' },
  logBtn: { backgroundColor: '#007AFF', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  logBtnText: { color: '#fff', fontWeight: '600' },
  done: { color: '#34C759', fontWeight: 'bold', fontSize: 18, width: 30, textAlign: 'center' },
  addSet: { marginTop: 4 },
  addSetText: { color: '#007AFF' },
  finishButton: { margin: 16, backgroundColor: '#FF3B30', borderRadius: 12, padding: 16 },
  finishText: { color: '#fff', textAlign: 'center', fontWeight: 'bold', fontSize: 16 },
  empty: { textAlign: 'center', marginTop: 40, color: '#999', padding: 20 },
});
