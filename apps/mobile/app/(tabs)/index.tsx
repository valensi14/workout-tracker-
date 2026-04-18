// apps/mobile/app/(tabs)/index.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useDB } from '../../db';
import { useWorkoutStore } from '../../store/workout';
import type { Routine, WorkoutSession } from '@workout/core';
import * as Crypto from 'expo-crypto';

export default function TodayScreen() {
  const db = useDB();
  const router = useRouter();
  const { activeSession, restoreSession, startSession } = useWorkoutStore();
  const [nextRoutine, setNextRoutine] = useState<Routine | null>(null);

  useFocusEffect(useCallback(() => {
    (async () => {
      // Restore draft session if one exists and store is empty
      if (!activeSession) {
        const draft = await db.getDraftSession();
        if (draft) {
          const sets = await db.getSetsBySession(draft.id);
          restoreSession(draft, sets);
        }
      }

      // Load next scheduled routine
      const activeProgramId = await db.getSetting('active_program_id');
      if (activeProgramId) {
        const indexStr = await db.getSetting('active_routine_index');
        const index = indexStr ? parseInt(indexStr, 10) : 0;
        const routines = await db.getRoutinesByProgram(activeProgramId);
        if (routines.length > 0) setNextRoutine(routines[index % routines.length]);
      } else {
        setNextRoutine(null);
      }
    })();
  }, [activeSession]));

  async function startWorkout(routine: Routine | null) {
    const session: WorkoutSession = {
      id: Crypto.randomUUID(),
      routineId: routine?.id ?? null,
      startedAt: Date.now(),
      finishedAt: null,
      notes: null,
    };
    await db.createSession(session);
    startSession(session);
    router.push(`/workout/${session.id}`);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Today</Text>

      {activeSession ? (
        <TouchableOpacity style={styles.resumeButton} onPress={() => router.push(`/workout/${activeSession.id}`)}>
          <Text style={styles.buttonText}>Resume Workout</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.actions}>
          {nextRoutine && (
            <TouchableOpacity style={styles.startButton} onPress={() => startWorkout(nextRoutine)}>
              <Text style={styles.buttonText}>Start: {nextRoutine.name}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.emptyButton} onPress={() => startWorkout(null)}>
            <Text style={styles.emptyButtonText}>Start Empty Workout</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 24 },
  actions: { gap: 12 },
  startButton: { backgroundColor: '#007AFF', borderRadius: 12, padding: 16 },
  resumeButton: { backgroundColor: '#34C759', borderRadius: 12, padding: 16 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600', textAlign: 'center' },
  emptyButton: { borderWidth: 1, borderColor: '#007AFF', borderRadius: 12, padding: 16 },
  emptyButtonText: { color: '#007AFF', fontSize: 16, textAlign: 'center' },
});
