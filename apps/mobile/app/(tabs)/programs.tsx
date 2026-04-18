// apps/mobile/app/(tabs)/programs.tsx
import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useDB } from '../../db';
import type { Program } from '@workout/core';

export default function ProgramsScreen() {
  const db = useDB();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    db.getPrograms().then(setPrograms);
    db.getSetting('active_program_id').then(setActiveId);
  }, [db]));

  async function activateProgram(program: Program) {
    await db.setSetting('active_program_id', program.id);
    await db.setSetting('active_routine_index', '0');
    setActiveId(program.id);
    Alert.alert('Program Started', `${program.name} is now your active program.`);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Programs</Text>
        <TouchableOpacity style={styles.newBtn} onPress={() => Alert.alert('Coming Soon', 'Custom program creation is not yet available.')}>
          <Text style={styles.newBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={programs}
        keyExtractor={p => p.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.programName}>{item.name}</Text>
              {activeId === item.id && <Text style={styles.activeBadge}>Active</Text>}
            </View>
            <Text style={styles.desc}>{item.description}</Text>
            {activeId !== item.id && (
              <TouchableOpacity style={styles.startBtn} onPress={() => activateProgram(item)}>
                <Text style={styles.startBtnText}>Start Program</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 28, fontWeight: 'bold' },
  newBtn: { backgroundColor: '#f0f7ff', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  newBtnText: { color: '#007AFF', fontWeight: '600' },
  card: { borderWidth: 1, borderColor: '#eee', borderRadius: 12, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  programName: { fontSize: 17, fontWeight: '600' },
  activeBadge: { backgroundColor: '#34C759', color: '#fff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, fontSize: 12 },
  desc: { color: '#666', fontSize: 14, marginBottom: 10 },
  startBtn: { backgroundColor: '#007AFF', borderRadius: 8, padding: 10 },
  startBtnText: { color: '#fff', textAlign: 'center', fontWeight: '600' },
});
