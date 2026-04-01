import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text as RNText, Modal, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { Text } from '@/components/Themed';
import { FontAwesome } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

interface ProgressModalProps {
  visible: boolean;
  onClose: () => void;
}

type PhotoType = { id: string; uri: string; date: string };
type WeightEntry = { date: string; value: number };

export default function ProgressModal({ visible, onClose }: ProgressModalProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];

  const [activeTab, setActiveTab] = useState<'metrics' | 'analytics'>('metrics');
  
  // Data State
  const [photos, setPhotos] = useState<PhotoType[]>([]);
  const [weights, setWeights] = useState<WeightEntry[]>([
    { date: 'Jan 1', value: 85 },
    { date: 'Feb 1', value: 84.5 },
    { date: 'Mar 1', value: 84 },
    { date: 'Apr 1', value: 83.2 },
    { date: 'May 1', value: 82.5 },
    { date: 'Jun 1', value: 82 },
  ]); // Mocked progression
  const [maxes, setMaxes] = useState({ bench: 0, squat: 0, deadlift: 0 });

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible]);

  const loadData = async () => {
    try {
      // Load Photos
      const storedPhotos = await AsyncStorage.getItem('@user_photos');
      if (storedPhotos) setPhotos(JSON.parse(storedPhotos));

      // Load History for 1RM
      const historyStr = await AsyncStorage.getItem('@workout_history');
      if (historyStr) {
        const history = JSON.parse(historyStr);
        let bMax = 0, sMax = 0, dMax = 0;

        // Epley Formula helper
        const calc1RM = (w: number, r: number) => r === 1 ? w : w * (1 + r / 30);

        history.forEach((session: any) => {
          if (session.exercises) {
             session.exercises.forEach((ex: any) => {
               const name = ex.name.toLowerCase();
               ex.sets.forEach((set: any) => {
                 if (set.completed) {
                   const w = parseFloat(set.weight) || 0;
                   const r = parseInt(set.reps) || 0;
                   if (w > 0 && r > 0) {
                     const estimated = calc1RM(w, r);
                     if (name.includes('bench') && estimated > bMax) bMax = estimated;
                     if (name.includes('squat') && estimated > sMax) sMax = estimated;
                     if (name.includes('deadlift') && estimated > dMax) dMax = estimated;
                   }
                 }
               });
             });
          }
        });
        setMaxes({ bench: Math.round(bMax), squat: Math.round(sMax), deadlift: Math.round(dMax) });
      }
    } catch (e) {
      console.error("Failed to load progress data", e);
    }
  };

  const uploadPhoto = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission Required", "You've refused to allow this app to access your photos!");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const newPhoto: PhotoType = {
        id: Date.now().toString(),
        uri: result.assets[0].uri,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      };
      
      const newArray = [newPhoto, ...photos];
      setPhotos(newArray);
      await AsyncStorage.setItem('@user_photos', JSON.stringify(newArray));
    }
  };

  const removePhoto = (id: string) => {
    Alert.alert("Delete Photo", "Are you sure you want to remove this progress photo?", [
       { text: "Cancel", style: "cancel" },
       { text: "Delete", style: "destructive", onPress: async () => {
          const newArray = photos.filter(p => p.id !== id);
          setPhotos(newArray);
          await AsyncStorage.setItem('@user_photos', JSON.stringify(newArray));
       }}
    ])
  };

  const maxWeightInChart = Math.max(...weights.map(w => w.value)) + 5;
  const minWeightInChart = Math.min(...weights.map(w => w.value)) - 5;
  const chartRange = maxWeightInChart - minWeightInChart;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.dragBar} />
        
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Personal Progress</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <FontAwesome name="close" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>

        {/* Custom Tabs */}
        <View style={[styles.tabContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'metrics' && { backgroundColor: theme.tint }]} 
            onPress={() => setActiveTab('metrics')}
          >
            <RNText style={[styles.tabText, activeTab === 'metrics' ? { color: '#0A0B10' } : { color: theme.text }]}>Body Metrics</RNText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'analytics' && { backgroundColor: theme.tint }]} 
            onPress={() => setActiveTab('analytics')}
          >
            <RNText style={[styles.tabText, activeTab === 'analytics' ? { color: '#0A0B10' } : { color: theme.text }]}>Advanced Analytics</RNText>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          {activeTab === 'metrics' && (
            <>
              {/* Graph Section */}
              <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Weight Progression (kg)</Text>
                <View style={styles.graphContainer}>
                  {weights.map((w, idx) => {
                    const heightPercent = ((w.value - minWeightInChart) / chartRange) * 100;
                    return (
                      <View key={idx} style={styles.barWrapper}>
                        <RNText style={styles.barLabelTop}>{w.value}</RNText>
                        <View style={[styles.bar, { backgroundColor: theme.tint, height: `${Math.max(10, heightPercent)}%` }]} />
                        <RNText style={styles.barLabel}>{w.date}</RNText>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Photo Section */}
              <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                 <View style={styles.photoHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0 }]}>Progress Photos</Text>
                    <TouchableOpacity style={[styles.addPhotoBtn, { backgroundColor: theme.tint }]} onPress={uploadPhoto}>
                       <FontAwesome name="plus" size={14} color="#0A0B10" />
                       <Text style={styles.addPhotoText}>Upload</Text>
                    </TouchableOpacity>
                 </View>
                 
                 <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
                   {photos.map(p => (
                     <TouchableOpacity key={p.id} onLongPress={() => removePhoto(p.id)} activeOpacity={0.9}>
                       <Image source={{ uri: p.uri }} style={[styles.photoImg, { borderColor: theme.border }]} />
                       <RNText style={[styles.photoDate, { color: theme.text }]}>{p.date}</RNText>
                     </TouchableOpacity>
                   ))}
                   {photos.length === 0 && (
                     <View style={[styles.emptyPhoto, { borderColor: theme.border }]}>
                       <FontAwesome name="camera" size={30} color={theme.border} />
                       <Text style={styles.emptyPhotoText}>No photos attached</Text>
                     </View>
                   )}
                 </ScrollView>
              </View>
            </>
          )}

          {activeTab === 'analytics' && (
            <>
              {/* 1RM Section */}
              <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                 <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 4 }]}>Theoretical 1 Rep Max</Text>
                 <Text style={styles.subtitle}>Calculated using the Epley Formula directly from your workout history logs.</Text>
                 
                 <View style={styles.maxesGrid}>
                   <View style={[styles.maxBox, { borderColor: theme.border }]}>
                      <RNText style={styles.maxTitle}>BENCH PRESS</RNText>
                      <RNText style={[styles.maxVal, { color: theme.tint }]}>{maxes.bench}<RNText style={styles.maxUnit}> kg</RNText></RNText>
                   </View>
                   <View style={[styles.maxBox, { borderColor: theme.border }]}>
                      <RNText style={styles.maxTitle}>SQUAT</RNText>
                      <RNText style={[styles.maxVal, { color: theme.tint }]}>{maxes.squat}<RNText style={styles.maxUnit}> kg</RNText></RNText>
                   </View>
                   <View style={[styles.maxBox, { borderColor: theme.border, marginTop: 16 }]}>
                      <RNText style={styles.maxTitle}>DEADLIFT</RNText>
                      <RNText style={[styles.maxVal, { color: theme.tint }]}>{maxes.deadlift}<RNText style={styles.maxUnit}> kg</RNText></RNText>
                   </View>
                 </View>

                 {maxes.bench === 0 && maxes.squat === 0 && maxes.deadlift === 0 && (
                    <Text style={styles.warningText}>Complete a workout containing sets of Bench Press, Squat, or Deadlift to populate your theoretical maximums!</Text>
                 )}
              </View>
            </>
          )}

        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 12,
  },
  dragBar: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#3A3A3C',
    alignSelf: 'center',
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabText: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
  },
  sectionCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 20,
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
    marginBottom: 24,
  },
  graphContainer: {
    height: 180,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: 20,
    paddingHorizontal: 4,
  },
  barWrapper: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    width: 36,
  },
  bar: {
    width: 14,
    borderRadius: 7,
    marginVertical: 6,
  },
  barLabel: {
    fontSize: 10,
    color: '#8E8E93',
    fontWeight: 'bold',
  },
  barLabelTop: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: 'bold',
  },
  photoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addPhotoText: {
    color: '#0A0B10',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 13,
  },
  photoScroll: {
    flexDirection: 'row',
  },
  photoImg: {
    width: 120,
    height: 160,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 12,
  },
  photoDate: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
    width: 120,
  },
  emptyPhoto: {
    width: 120,
    height: 160,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyPhotoText: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  maxesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  maxBox: {
    width: '48%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: '#1C1C1E',
  },
  maxTitle: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 8,
  },
  maxVal: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  maxUnit: {
    fontSize: 16,
  },
  warningText: {
     color: '#FF9500',
     marginTop: 20,
     fontSize: 13,
     textAlign: 'center',
     paddingHorizontal: 20,
  }
});
