import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, TextInput, Text as RNText, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Text } from '@/components/Themed';
import { FontAwesome } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import AsyncStorage from '@react-native-async-storage/async-storage';

type SetData = { id: string; reps: string; weight: string; completed: boolean; targetReps?: string };
type ExerciseData = { id: string; name: string; sets: SetData[] };
type TrackerState = { exercises: ExerciseData[]; startTime: number | null; sessionTitle: string | null };

const STORAGE_KEY = '@workout_tracker_data';
const HISTORY_KEY = '@workout_history';

// Helper to generate a preset exercise block
const createExercise = (name: string, targetReps: string, setCount = 3): ExerciseData => ({
  id: Date.now().toString() + Math.random().toString(),
  name,
  sets: Array.from({ length: setCount }).map((_, i) => ({
    id: Date.now().toString() + i + Math.random().toString(),
    reps: '',
    weight: '',
    completed: false,
    targetReps
  }))
});

export default function TrackScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];

  const [exercises, setExercises] = useState<ExerciseData[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [sessionTitle, setSessionTitle] = useState<string | null>(null);

  // Load tracker state
  useEffect(() => {
    const loadData = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setExercises(parsed);
          } else {
            setExercises(parsed.exercises || []);
            setStartTime(parsed.startTime || null);
            setSessionTitle(parsed.sessionTitle || null);
          }
        }
      } catch (e) {
        console.error("Failed to load workout data", e);
      }
    };
    loadData();
  }, []);

  // Save tracker state on change
  useEffect(() => {
    const saveData = async () => {
      try {
        if (exercises.length > 0 || startTime !== null) {
          const payload: TrackerState = { exercises, startTime, sessionTitle };
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        } else {
          // If perfectly empty, clear storage
          await AsyncStorage.removeItem(STORAGE_KEY);
        }
      } catch (e) {
        console.error("Failed to save workout data", e);
      }
    };
    saveData();
  }, [exercises, startTime, sessionTitle]);

  const startBlankWorkout = () => {
    setSessionTitle("Custom Workout");
    setStartTime(Date.now());
    addExercise();
  };

  const startPreset = (title: string, templateExercises: ExerciseData[]) => {
    setSessionTitle(title);
    setStartTime(Date.now());
    setExercises(templateExercises);
  };

  const addExercise = () => {
    if (startTime === null) setStartTime(Date.now());
    const newEx: ExerciseData = {
      id: Date.now().toString(),
      name: 'New Exercise',
      sets: [{ id: Date.now().toString() + '-0', reps: '', weight: '', completed: false }],
    };
    setExercises([...exercises, newEx]);
  };

  const updateExerciseName = (exId: string, txt: string) => {
    setExercises(exercises.map(ex => ex.id === exId ? { ...ex, name: txt } : ex));
  };

  const removeExercise = (exId: string) => {
    Alert.alert('Remove Exercise', 'Are you sure you want to remove this exercise?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => {
        const filtered = exercises.filter(ex => ex.id !== exId);
        setExercises(filtered);
        if (filtered.length === 0) setSessionTitle(null); 
      }}
    ]);
  };

  const addSet = (exId: string) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exId) {
        const lastSet = ex.sets.length > 0 ? ex.sets[ex.sets.length - 1] : { reps: '', weight: '', targetReps: undefined };
        return {
          ...ex, 
          sets: [...ex.sets, { id: Date.now().toString(), reps: '', weight: lastSet.weight, completed: false, targetReps: lastSet.targetReps }]
        };
      }
      return ex;
    }));
  };

  const updateSet = (exId: string, setId: string, field: 'reps' | 'weight', val: string) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exId) {
        return {
          ...ex,
          sets: ex.sets.map(s => {
             if (s.id === setId && !s.completed) {
                return { ...s, [field]: val };
             }
             return s;
          })
        };
      }
      return ex;
    }));
  };

  const toggleSetComplete = (exId: string, setId: string) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exId) {
        return {
          ...ex,
          sets: ex.sets.map(s => s.id === setId ? { ...s, completed: !s.completed } : s)
        };
      }
      return ex;
    }));
  };

  const requestFinishWorkout = () => {
    Alert.alert('Finish Workout', 'Are you done with all your exercises?', [
      { text: 'Keep Going', style: 'cancel' },
      { text: 'Finish', style: 'default', onPress: finishWorkout }
    ]);
  };

  const formatDuration = (ms: number) => {
    const totalMins = Math.floor(ms / 60000);
    if (totalMins < 60) return `${totalMins}m`;
    const hrs = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    return `${hrs}h ${mins}m`;
  };

  const finishWorkout = async () => {
    let durationStr = "0m";
    if (startTime) {
      const ms = Date.now() - startTime;
      durationStr = formatDuration(ms);
    }

    let totalVolume = 0;
    exercises.forEach(ex => {
      ex.sets.forEach(set => {
        if (set.completed) {
           const w = parseFloat(set.weight) || 0;
           const r = parseInt(set.reps) || 0;
           totalVolume += (w * r);
        }
      });
    });

    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const finalTitle = sessionTitle || `Workout on ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    
    const newSession = {
      id: Date.now().toString(),
      date: formattedDate,
      title: finalTitle,
      time: durationStr,
      volume: `${totalVolume.toLocaleString()} kg`,
      exercises: exercises
    };

    try {
      const existingHistoryStr = await AsyncStorage.getItem(HISTORY_KEY);
      const existingHistory = existingHistoryStr ? JSON.parse(existingHistoryStr) : [];
      const updatedHistory = [newSession, ...existingHistory];
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));

      // Clear tracking state flawlessly
      setExercises([]); 
      setStartTime(null);
      setSessionTitle(null);
      await AsyncStorage.removeItem(STORAGE_KEY);
      
      Alert.alert("Success", `Workout saved!\n\nDuration: ${durationStr}\nVolume: ${newSession.volume}`);

    } catch (e) {
      console.error("Failed to commit workout history", e);
      Alert.alert("Error", "Could not save your workout history.");
    }
  };

  // ---------------------------------------------------------------------------
  // RENDER: Preset Menu (Empty State)
  // ---------------------------------------------------------------------------
  if (exercises.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Start Workout</Text>
          <Text style={styles.subtitle}>Select a routine or build your own</Text>
        </View>

        <ScrollView contentContainerStyle={styles.presetList}>
          
          <TouchableOpacity 
            style={[styles.presetCard, { backgroundColor: theme.tint, borderColor: theme.tint }]}
            onPress={startBlankWorkout}
            activeOpacity={0.8}
          >
            <View style={styles.presetRow}>
              <View style={[styles.presetIconBox, { backgroundColor: '#0A0B1030' }]}>
                <FontAwesome name="plus" size={24} color="#0A0B10" />
              </View>
              <View style={styles.presetTextCol}>
                <Text style={[styles.presetTitle, { color: '#0A0B10' }]}>Blank Workout</Text>
                <Text style={[styles.presetSub, { color: '#0A0B1080' }]}>Start from absolute scratch</Text>
              </View>
            </View>
          </TouchableOpacity>

          <Text style={[styles.sectionHeading, { color: theme.text }]}>Classic Splits</Text>

          <TouchableOpacity 
            style={[styles.presetCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => startPreset("Push Day", [
              createExercise("Barbell Bench Press", "5-8", 4),
              createExercise("Overhead Press", "8-12", 3),
              createExercise("Incline Dumbbell Press", "8-12", 3),
              createExercise("Tricep Extensions", "10-15", 3),
            ])}
            activeOpacity={0.8}
          >
            <View style={styles.presetRow}>
              <View style={[styles.presetIconBox, { backgroundColor: theme.tint + '15' }]}>
                <FontAwesome name="arrow-up" size={24} color={theme.tint} />
              </View>
              <View style={styles.presetTextCol}>
                <Text style={[styles.presetTitle, { color: theme.text }]}>Push Day</Text>
                <Text style={styles.presetSub}>Chest, Shoulders, Triceps</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.presetCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => startPreset("Pull Day", [
              createExercise("Conventional Deadlift", "3-5", 3),
              createExercise("Pull-Ups", "8-12", 4),
              createExercise("Lat Pulldown", "10-15", 3),
              createExercise("Bicep Curls", "10-15", 3),
            ])}
            activeOpacity={0.8}
          >
            <View style={styles.presetRow}>
              <View style={[styles.presetIconBox, { backgroundColor: theme.tint + '15' }]}>
                <FontAwesome name="arrow-down" size={24} color={theme.tint} />
              </View>
              <View style={styles.presetTextCol}>
                <Text style={[styles.presetTitle, { color: theme.text }]}>Pull Day</Text>
                <Text style={styles.presetSub}>Back, Biceps, Forearms</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.presetCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => startPreset("Leg Day", [
              createExercise("Barbell Squat", "5-8", 4),
              createExercise("Romanian Deadlift", "8-12", 3),
              createExercise("Leg Press", "10-15", 3),
              createExercise("Calf Raises", "15-20", 4),
            ])}
            activeOpacity={0.8}
          >
            <View style={styles.presetRow}>
              <View style={[styles.presetIconBox, { backgroundColor: theme.tint + '15' }]}>
                <FontAwesome name="anchor" size={24} color={theme.tint} />
              </View>
              <View style={styles.presetTextCol}>
                <Text style={[styles.presetTitle, { color: theme.text }]}>Leg Day</Text>
                <Text style={styles.presetSub}>Quads, Hamstrings, Glutes, Calves</Text>
              </View>
            </View>
          </TouchableOpacity>

        </ScrollView>
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER: Active Tracker View
  // ---------------------------------------------------------------------------
  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.headerActive}>
        <View style={styles.headerActiveCol}>
          <Text style={styles.subtitleActive}>Tracking</Text>
          <TextInput
             style={[styles.titleInput, { color: theme.text }]}
             value={sessionTitle || "Custom Workout"}
             onChangeText={setSessionTitle}
             placeholder="Workout Name"
             placeholderTextColor="#8E8E93"
             selectTextOnFocus
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
        {exercises.map((ex, idx) => (
          <View key={ex.id} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.exerciseNumber}>{idx + 1}</Text>
                <TextInput
                  style={[styles.exerciseNameInput, { color: theme.text }]}
                  value={ex.name}
                  onChangeText={(txt) => updateExerciseName(ex.id, txt)}
                  placeholder="Exercise Name"
                  placeholderTextColor="#8E8E93"
                  selectTextOnFocus
                />
              </View>
              <TouchableOpacity style={styles.moreButton} onPress={() => removeExercise(ex.id)}>
                <FontAwesome name="trash" size={20} color="#FF3B30" />
              </TouchableOpacity>
            </View>

            {/* Sets Header */}
            {ex.sets.length > 0 && (
              <View style={styles.setsHeader}>
                <Text style={styles.setHeaderText}>Set</Text>
                <Text style={[styles.setHeaderText, { flex: 1.5 }]}>kg</Text>
                <Text style={[styles.setHeaderText, { flex: 1.5 }]}>Reps</Text>
                <Text style={[styles.setHeaderText, { width: 44, textAlign: 'center' }]}>✔</Text>
              </View>
            )}

            {ex.sets.map((s, sIdx) => (
              <View key={s.id} style={[styles.setRow, s.completed && { opacity: 0.6 }]}>
                <View style={styles.setNumberBox}>
                  <Text style={[styles.setNumberText, { color: theme.text }]}>{sIdx + 1}</Text>
                </View>
                
                <TextInput
                  style={[
                    styles.setInput, 
                    { color: theme.text, backgroundColor: theme.background, borderColor: s.completed ? 'transparent' : theme.border },
                    s.completed && { color: '#8E8E93' }
                  ]}
                  value={s.weight}
                  onChangeText={(val) => updateSet(ex.id, s.id, 'weight', val)}
                  placeholder="-"
                  placeholderTextColor="#8E8E93"
                  keyboardType="numeric"
                  editable={!s.completed}
                />

                <TextInput
                  style={[
                    styles.setInput, 
                    { color: theme.text, backgroundColor: theme.background, borderColor: s.completed ? 'transparent' : theme.border },
                    s.completed && { color: '#8E8E93' }
                  ]}
                  value={s.reps}
                  onChangeText={(val) => updateSet(ex.id, s.id, 'reps', val)}
                  placeholder={s.targetReps ? s.targetReps : "-"}
                  placeholderTextColor={s.targetReps && !s.completed ? theme.tint + '80' : "#8E8E93"}
                  keyboardType="numeric"
                  editable={!s.completed}
                />

                <TouchableOpacity 
                  style={[
                    styles.checkButton, 
                    s.completed ? { backgroundColor: '#34C75920', borderColor: '#34C759' } : { borderColor: theme.border }
                  ]}
                  onPress={() => toggleSetComplete(ex.id, s.id)}
                >
                  <FontAwesome 
                    name={s.completed ? "check" : "check"} 
                    size={16} 
                    color={s.completed ? "#34C759" : theme.tabIconDefault} 
                  />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity style={styles.addSetButton} onPress={() => addSet(ex.id)}>
              <Text style={[styles.addSetText, { color: theme.tint }]}>+ Add Set</Text>
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity 
          style={[styles.addExerciseButton, { borderColor: theme.tint }]} 
          onPress={addExercise}
        >
          <FontAwesome name="plus" size={16} color={theme.tint} style={{ marginRight: 8 }} />
          <RNText style={[styles.addExerciseText, { color: theme.tint }]}>Add Exercise</RNText>
        </TouchableOpacity>

      </ScrollView>
      
      {exercises.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity style={[styles.finishButton, { backgroundColor: theme.tint }]} onPress={requestFinishWorkout}>
            <Text style={styles.finishButtonText}>Finish Workout</Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  headerActive: {
    padding: 20,
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
    backgroundColor: '#0A0B10'
  },
  headerActiveCol: {
    flex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 4,
  },
  subtitleActive: {
    fontSize: 14,
    color: '#8E8E93',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 4,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 0,
    margin: 0,
  },
  sectionHeading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 16,
    marginLeft: 4,
  },
  presetList: {
    padding: 16,
    paddingBottom: 40,
  },
  presetCard: {
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
    padding: 20,
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  presetRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  presetIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  presetTextCol: {
    flex: 1,
  },
  presetTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  presetSub: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  list: {
    padding: 16,
    paddingBottom: 120,
  },
  card: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  exerciseNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00E5FF',
    marginRight: 10,
    width: 20,
  },
  exerciseNameInput: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
    paddingVertical: 4,
  },
  moreButton: {
    padding: 8,
    marginLeft: 8,
  },
  setsHeader: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  setHeaderText: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  setNumberBox: {
    width: 30,
    marginRight: 12,
    alignItems: 'center',
  },
  setNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8E8E93',
  },
  setInput: {
    flex: 1.5,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
    marginRight: 12,
  },
  checkButton: {
    width: 44,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addSetButton: {
    marginTop: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  addSetText: {
    fontSize: 16,
    fontWeight: '600',
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    marginTop: 10,
    marginBottom: 40,
  },
  addExerciseText: {
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(10, 11, 16, 0.95)',
    borderTopWidth: 1,
    borderTopColor: '#2C2C2E',
    zIndex: 10,
  },
  finishButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  finishButtonText: {
    color: '#0A0B10',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
