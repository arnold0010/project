import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Text as RNText, TextInput, Alert, ScrollView } from 'react-native';
import { Text } from '@/components/Themed';
import { FontAwesome } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TEMPLATES = [
  { id: '1', name: 'Quick Sip', time: 30 },
  { id: '2', name: 'Standard Rest', time: 60 },
  { id: '3', name: 'Hypertrophy', time: 90 },
  { id: '4', name: 'Strength Rest', time: 120 },
  { id: '5', name: 'Powerlifting', time: 180 },
  { id: '6', name: 'Long Break', time: 300 },
];

export default function TimerScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];

  // Logic State
  const [mode, setMode] = useState<'setup' | 'running'>('setup');
  const [initialTime, setInitialTime] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isActive, setIsActive] = useState(false);

  // Custom Input State
  const [customMins, setCustomMins] = useState('');
  const [customSecs, setCustomSecs] = useState('');

  useEffect(() => {
    let interval: any;
    
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isActive && timeLeft <= 0) {
      setIsActive(false);
      
      // Navigate back to setup first
      setMode('setup');
      
      // Safe Alert for both Web and Native
      setTimeout(() => {
        try {
          Alert.alert("Time's Up!", "Your rest period is over. Get back to work!");
        } catch (e) {
          if (typeof window !== 'undefined' && window.alert) {
             window.alert("Time's Up! Your rest period is over.");
          }
        }
      }, 100);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft]);

  // Actions
  const startTemplate = async (seconds: number) => {
    setInitialTime(seconds);
    setTimeLeft(seconds);
    setMode('running');
    setIsActive(true);
    try {
      await AsyncStorage.setItem('@last_timer', seconds.toString());
    } catch (e) {
      console.log('Failed to save last timer');
    }
  };

  const startCustom = () => {
    const mins = parseInt(customMins) || 0;
    const secs = parseInt(customSecs) || 0;
    const totalSecs = (mins * 60) + secs;
    if (totalSecs > 0) {
      startTemplate(totalSecs);
      setCustomMins('');
      setCustomSecs('');
    } else {
      Alert.alert('Invalid Time', 'Please enter a valid time for your custom timer.');
    }
  };

  const handleStop = () => {
    setIsActive(false);
    setMode('setup');
  };

  const handlePausePlay = () => {
    setIsActive(!isActive);
  };

  const handleReset = () => {
    setIsActive(false);
    setTimeLeft(initialTime);
  };

  const addTime = (seconds: number) => {
    setTimeLeft(prev => prev + seconds);
  };

  // Format Helper
  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (mode === 'setup') {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Rest Timer</Text>
          <Text style={styles.subtitle}>Select a template or create custom</Text>
        </View>

        <ScrollView contentContainerStyle={styles.setupContainer}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Templates</Text>
          <View style={styles.grid}>
            {TEMPLATES.map((t) => (
              <TouchableOpacity
                key={t.id}
                style={[styles.templateCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => startTemplate(t.time)}
              >
                <Text style={[styles.templateTime, { color: theme.tint }]}>{formatTime(t.time)}</Text>
                <Text style={styles.templateName}>{t.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 30 }]}>Custom Timer</Text>
          <View style={[styles.customBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.inputRow}>
              <View style={styles.inputGroup}>
                <TextInput
                  style={[styles.timeInput, { color: theme.text, borderColor: theme.border }]}
                  value={customMins}
                  onChangeText={setCustomMins}
                  placeholder="00"
                  placeholderTextColor="#8E8E93"
                  keyboardType="numeric"
                  maxLength={2}
                />
                <Text style={styles.inputLabel}>MINS</Text>
              </View>
              <Text style={[styles.colon, { color: theme.text }]}>:</Text>
              <View style={styles.inputGroup}>
                <TextInput
                  style={[styles.timeInput, { color: theme.text, borderColor: theme.border }]}
                  value={customSecs}
                  onChangeText={setCustomSecs}
                  placeholder="00"
                  placeholderTextColor="#8E8E93"
                  keyboardType="numeric"
                  maxLength={2}
                />
                <Text style={styles.inputLabel}>SECS</Text>
              </View>
            </View>
            <TouchableOpacity style={[styles.startCustomBtn, { backgroundColor: theme.tint }]} onPress={startCustom}>
              <Text style={styles.startCustomText}>Start Custom Timer</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.headerActive}>
        <Text style={[styles.title, { color: theme.text }]}>Resting</Text>
      </View>

      <View style={styles.mainContent}>
        {/* The large timer visual */}
        <View style={[
          styles.timerCircle, 
          { borderColor: isActive ? theme.tint : theme.border, shadowColor: isActive ? theme.tint : 'transparent' }
        ]}>
          <Text style={[styles.timeText, { color: theme.text }]}>{formatTime(timeLeft)}</Text>
          <Text style={styles.timeLabel}>{isActive ? 'Remaining' : 'Paused'}</Text>
        </View>

        {/* Playback Controls */}
        <View style={styles.controls}>
          <TouchableOpacity 
            style={[styles.controlButton, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={handleStop}
          >
            <FontAwesome name="stop" size={24} color={theme.text} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.playButton, { backgroundColor: isActive ? theme.tint : theme.card, borderColor: isActive ? theme.tint : theme.border, borderWidth: isActive ? 0 : 2 }]}
            onPress={handlePausePlay}
          >
            <FontAwesome name={isActive ? "pause" : "play"} size={isActive ? 32 : 28} color={isActive ? "#0A0B10" : theme.tint} style={!isActive && { marginLeft: 6 }} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.controlButton, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={handleReset}
          >
            <FontAwesome name="refresh" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>
        
        {/* Quick Adds */}
        <View style={styles.quickAddGroup}>
          <TouchableOpacity style={[styles.quickAddBtn, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => addTime(30)}>
            <RNText style={[styles.quickAddText, { color: theme.text }]}>+30s</RNText>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickAddBtn, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => addTime(60)}>
            <RNText style={[styles.quickAddText, { color: theme.text }]}>+1m</RNText>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickAddBtn, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => addTime(120)}>
            <RNText style={[styles.quickAddText, { color: theme.text }]}>+2m</RNText>
          </TouchableOpacity>
        </View>
      </View>
    </View>
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
    alignItems: 'center',
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
  setupContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    marginLeft: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  templateCard: {
    width: '48%',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 4,
  },
  templateTime: {
    fontSize: 24,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
    marginBottom: 4,
  },
  templateName: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  customBox: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  inputGroup: {
    alignItems: 'center',
  },
  timeInput: {
    fontSize: 40,
    fontWeight: 'bold',
    width: 80,
    height: 70,
    borderWidth: 1,
    borderRadius: 12,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  inputLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 8,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  colon: {
    fontSize: 40,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginBottom: 24,
  },
  startCustomBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  startCustomText: {
    color: '#0A0B10',
    fontSize: 18,
    fontWeight: 'bold',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
  },
  timerCircle: {
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 60,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  timeText: {
    fontSize: 72,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  timeLabel: {
    fontSize: 18,
    color: '#8E8E93',
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '70%',
    marginBottom: 40,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  quickAddGroup: {
    flexDirection: 'row',
    gap: 16,
  },
  quickAddBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
  },
  quickAddText: {
    fontWeight: '600',
    fontSize: 16,
  },
});
