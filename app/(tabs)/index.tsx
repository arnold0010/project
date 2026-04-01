import React, { useState, useCallback } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity } from 'react-native';
import { Text } from '@/components/Themed';
import WidgetCard from '@/components/WidgetCard';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { EXERCISE_DB } from './library';
import ProgressModal from '@/components/ProgressModal';
import { FontAwesome } from '@expo/vector-icons';

export default function DashboardScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];

  const [progressVisible, setProgressVisible] = useState(false);

  const [activeWorkoutDesc, setActiveWorkoutDesc] = useState('Ready to lift');
  const [activeWorkoutVal, setActiveWorkoutVal] = useState('Start');

  const [historyDesc, setHistoryDesc] = useState('No sessions yet');
  const [historyVal, setHistoryVal] = useState('-');

  const [timerDesc, setTimerDesc] = useState('Ready for next interval');
  const [timerVal, setTimerVal] = useState('00:00');

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  useFocusEffect(
    useCallback(() => {
      const fetchDashboardData = async () => {
        try {
          // 1. Check active tracker
          const trackerStr = await AsyncStorage.getItem('@workout_tracker_data');
          if (trackerStr) {
            const parsed = JSON.parse(trackerStr);
            const exercises = parsed.exercises || [];
            if (exercises.length > 0) {
              setActiveWorkoutVal('In Progress');
              setActiveWorkoutDesc(`${exercises.length} Exercises Tracked`);
            } else {
              setActiveWorkoutVal('Start');
              setActiveWorkoutDesc('Ready to lift');
            }
          } else {
            setActiveWorkoutVal('Start');
            setActiveWorkoutDesc('Ready to lift');
          }

          // 2. Check history
          const historyStr = await AsyncStorage.getItem('@workout_history');
          if (historyStr) {
            const parsed = JSON.parse(historyStr);
            if (parsed.length > 0) {
              const latest = parsed[0];
              setHistoryVal(latest.title || 'Session');
              setHistoryDesc(`Vol: ${latest.volume} | Time: ${latest.time}`);
            } else {
              setHistoryVal('-');
              setHistoryDesc('No sessions yet');
            }
          } else {
            setHistoryVal('-');
            setHistoryDesc('No sessions yet');
          }

          // 3. Check Last Timer
          const lastTimerStr = await AsyncStorage.getItem('@last_timer');
          if (lastTimerStr) {
            const secs = parseInt(lastTimerStr);
            if (secs > 0) {
              setTimerVal(formatTime(secs));
              setTimerDesc('Last Used Interval');
            }
          }

        } catch (e) {
          console.error('Error fetching dashboard data', e);
        }
      };

      fetchDashboardData();
    }, [])
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={[styles.greeting, { color: theme.text }]}>Welcome back,</Text>
        <Text style={[styles.name, { color: theme.tint }]}>Athlete</Text>
      </View>

      <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Summary</Text>
      
      <View style={styles.widgetGrid}>
        <WidgetCard
          title="Track Workout"
          value={activeWorkoutVal}
          description={activeWorkoutDesc}
          iconName="play-circle"
          href="/(tabs)/track"
          color="#FF3B30"
        />
        <WidgetCard
          title="History"
          value={historyVal}
          description={historyDesc}
          iconName="history"
          href="/(tabs)/history"
          color="#FF9500"
        />
        <WidgetCard
          title="Timer"
          value={timerVal}
          description={timerDesc}
          iconName="clock-o"
          href="/(tabs)/timer"
          color="#34C759"
        />
        <WidgetCard
          title="Library"
          value={EXERCISE_DB.length.toString()}
          description="Approved Movements"
          iconName="book"
          href="/(tabs)/library"
          color="#AF52DE"
        />
      </View>

      <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 24 }]}>Advanced Analytics</Text>
      <TouchableOpacity 
         style={[styles.progressWidget, { backgroundColor: theme.card, borderColor: theme.border }]}
         activeOpacity={0.8}
         onPress={() => setProgressVisible(true)}
      >
         <View style={[styles.progressIconBox, { backgroundColor: theme.tint + '20' }]}>
            <FontAwesome name="line-chart" size={24} color={theme.tint} />
         </View>
         <View style={styles.progressTextCol}>
            <Text style={[styles.progressTitle, { color: theme.text }]}>Personal Progress</Text>
            <Text style={styles.progressSub}>Track core 1RM & visual metrics</Text>
         </View>
         <FontAwesome name="chevron-right" size={16} color="#8E8E93" />
      </TouchableOpacity>

      <ProgressModal visible={progressVisible} onClose={() => setProgressVisible(false)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    marginTop: 20,
    marginBottom: 30,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '300',
    opacity: 0.8,
  },
  name: {
    fontSize: 34,
    fontWeight: 'bold',
    marginTop: 4,
    textShadowColor: 'rgba(0, 229, 255, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    opacity: 0.9,
  },
  widgetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: -8,
  },
  progressWidget: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 40,
  },
  progressIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  progressTextCol: {
    flex: 1,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  progressSub: {
    fontSize: 14,
    color: '#8E8E93',
  },
});
