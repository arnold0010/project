import React, { useState, useCallback } from 'react';
import { StyleSheet, ScrollView, View, Text as RNText } from 'react-native';
import { Text } from '@/components/Themed';
import { FontAwesome } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';

const HISTORY_KEY = '@workout_history';

type SessionType = { id: string; date: string; title: string; time: string; volume: string };

export default function HistoryScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];

  const [history, setHistory] = useState<SessionType[]>([]);

  useFocusEffect(
    useCallback(() => {
      const fetchHistory = async () => {
        try {
          const data = await AsyncStorage.getItem(HISTORY_KEY);
          if (data) {
             setHistory(JSON.parse(data));
          } else {
             setHistory([]);
          }
        } catch (e) {
          console.error("Failed to load history", e);
        }
      };
      fetchHistory();
    }, [])
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>History</Text>
        <Text style={styles.subtitle}>Your Completed Sessions</Text>
      </View>

      {history.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={[styles.iconContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <FontAwesome name="history" size={40} color={theme.tint} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No Workouts Yet</Text>
          <Text style={styles.emptySubtitle}>Log your first session in the Track tab!</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {history.map((item) => (
            <View key={item.id} style={styles.timelineItem}>
              <View style={styles.timelineLeft}>
                <View style={[styles.timelineDot, { backgroundColor: theme.tint }]} />
                <View style={[styles.timelineLine, { backgroundColor: theme.border }]} />
              </View>
              <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardTitle, { color: theme.text }]}>{item.title}</Text>
                  <Text style={styles.date}>{item.date}</Text>
                </View>
                
                <View style={styles.statsRow}>
                  <View style={styles.statBox}>
                    <FontAwesome name="clock-o" size={14} color={theme.tint} />
                    <RNText style={[styles.statText, { color: theme.text }]}>{item.time}</RNText>
                  </View>
                  <View style={styles.statBox}>
                    <FontAwesome name="line-chart" size={14} color={theme.tint} />
                    <RNText style={[styles.statText, { color: theme.text }]}>{item.volume}</RNText>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
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
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 4,
  },
  list: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: -80,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 24,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  timelineLeft: {
    width: 30,
    alignItems: 'center',
  },
  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginTop: 6,
    zIndex: 1,
  },
  timelineLine: {
    position: 'absolute',
    top: 20,
    width: 2,
    height: '100%',
  },
  card: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  date: {
    fontSize: 14,
    color: '#8E8E93',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 229, 255, 0.05)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  statText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '600',
  },
});
