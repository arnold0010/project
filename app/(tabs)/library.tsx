import React, { useState, useMemo } from 'react';
import { StyleSheet, ScrollView, View, TextInput, TouchableOpacity, Text as RNText, Modal, Image } from 'react-native';
import { Text } from '@/components/Themed';
import { FontAwesome } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

type Exercise = {
  id: string;
  name: string;
  muscleGroups: string[];
  programs: string[];
  difficulty: string;
  benefits: string;
  instructions: string;
  icon: React.ComponentProps<typeof FontAwesome>['name'];
};

export const EXERCISE_DB: Exercise[] = [
  {
    id: '1',
    name: 'Barbell Bench Press',
    muscleGroups: ['Chest', 'Triceps', 'Shoulders'],
    programs: ['Strength/Powerlifting', 'Hypertrophy/Bodybuilding'],
    difficulty: 'Intermediate',
    benefits: 'The ultimate upper-body mass builder. Develops sheer pushing strength and a robust, fully developed chest.',
    instructions: '1. Lie flat on the bench with eyes under the bar.\n2. Grip the bar slightly wider than shoulder-width.\n3. Lower the barbell down to your mid-chest.\n4. Press back up powerfully until your arms are straight.',
    icon: 'cube',
  },
  {
    id: '2',
    name: 'Barbell Squat',
    muscleGroups: ['Quads', 'Glutes', 'Core', 'Hamstrings'],
    programs: ['Strength/Powerlifting', 'Hypertrophy/Bodybuilding'],
    difficulty: 'Intermediate',
    benefits: 'Often called the king of all exercises. Builds massive whole-body strength, primarily targeting the legs while demanding absolute core stability.',
    instructions: '1. Unrack the bar across your upper back or traps.\n2. Keep your chest up and core braced tight.\n3. Squat down until your hips are below your knees.\n4. Drive up forcefully through the floor to stand back up.',
    icon: 'arrow-down',
  },
  {
    id: '3',
    name: 'Conventional Deadlift',
    muscleGroups: ['Hamstrings', 'Glutes', 'Lower Back', 'Traps'],
    programs: ['Strength/Powerlifting'],
    difficulty: 'Advanced',
    benefits: 'Builds incredible raw power and posterior chain thickness. Enhances posture, grip strength, and total-body explosiveness.',
    instructions: '1. Stand with mid-foot directly under the barbell.\n2. Hinge at the hips and grab the bar just outside your knees.\n3. Drop your hips, raise your chest, and pull the slack out.\n4. Push the floor away to stand tall.',
    icon: 'anchor',
  },
  {
    id: '4',
    name: 'Pull-Up',
    muscleGroups: ['Lats', 'Biceps', 'Rhomboids'],
    programs: ['Calisthenics/Bodyweight', 'Hypertrophy/Bodybuilding'],
    difficulty: 'Intermediate',
    benefits: 'The premier bodyweight pull. Drastically widens the back (V-Taper) and promotes elite upper-body relative strength.',
    instructions: '1. Grab the pull-up bar slightly wider than shoulder-width.\n2. Hang freely with straight arms and tight core.\n3. Pull yourself up by driving your elbows down to the floor.\n4. Clear the bar with your chin, then lower slowly.',
    icon: 'arrow-up',
  },
  {
    id: '5',
    name: 'Push-Up',
    muscleGroups: ['Chest', 'Triceps', 'Shoulders'],
    programs: ['Calisthenics/Bodyweight', 'Beginner'],
    difficulty: 'Beginner',
    benefits: 'An accessible, incredibly effective staple for chest development and joint health without requiring any equipment.',
    instructions: '1. Get into a high plank position, hands directly under shoulders.\n2. Lower your body under control until your chest grazes the floor.\n3. Push back up to full extension while keeping core and glutes squeezed.',
    icon: 'eject',
  },
  {
    id: '6',
    name: 'Incline Dumbbell Curl',
    muscleGroups: ['Biceps'],
    programs: ['Hypertrophy/Bodybuilding'],
    difficulty: 'Intermediate',
    benefits: 'Maximizes bicep isolation by putting the muscle in an extreme stretch position. Excellent for targeting the long head and building a massive peak.',
    instructions: '1. Sit on an incline bench set to 45-60 degrees with dumbbells.\n2. Let your arms hang straight down, fully stretched.\n3. Curl the dumbbells up while supinating (rotating) your wrists.\n4. Lower them slowly for maximum time under tension.',
    icon: 'link',
  },
  {
    id: '7',
    name: 'Front Plank',
    muscleGroups: ['Core', 'Abs', 'Shoulders'],
    programs: ['Calisthenics/Bodyweight', 'Beginner'],
    difficulty: 'Beginner',
    benefits: 'Builds isometric resilience in the anterior core. Vital for injury prevention and supporting heavy compound lifts.',
    instructions: '1. Lie face down, then prop yourself up on your forearms.\n2. Keep your body in a perfectly straight line from head to heels.\n3. Actively squeeze your abs, glutes, and quads.\n4. Hold for the designated time while breathing steadily.',
    icon: 'minus',
  },
  {
    id: '8',
    name: 'Lat Pulldown',
    muscleGroups: ['Lats', 'Biceps'],
    programs: ['Hypertrophy/Bodybuilding', 'Beginner'],
    difficulty: 'Beginner',
    benefits: 'The ultimate machine exercise for building back width. An excellent precursor or alternative to the standard pull-up.',
    instructions: '1. Adjust the knee pad so you are firmly secured.\n2. Grip the wide bar attachment.\n3. Lean slightly back and pull the bar down to your collarbone.\n4. Squeeze your shoulder blades, then let the bar slowly rise back up.',
    icon: 'arrow-down',
  },
];

const FILTERS = ['All', 'Strength/Powerlifting', 'Hypertrophy/Bodybuilding', 'Calisthenics/Bodyweight', 'Beginner'];

export default function LibraryScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  // Filter DB
  const filteredExercises = useMemo(() => {
    return EXERCISE_DB.filter((ex) => {
      // Name Search
      const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            ex.muscleGroups.some(mg => mg.toLowerCase().includes(searchQuery.toLowerCase()));
      // Program category
      const matchesFilter = activeFilter === 'All' || ex.programs.includes(activeFilter) || (activeFilter === 'Beginner' && ex.difficulty === 'Beginner');
      
      return matchesSearch && matchesFilter;
    });
  }, [searchQuery, activeFilter]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Exercise Library</Text>
        <Text style={styles.subtitle}>{EXERCISE_DB.length} Approved Movements</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <FontAwesome name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
          <TextInput 
            style={[styles.searchInput, { color: theme.text }]} 
            placeholder="Search exercise or muscle..." 
            placeholderTextColor="#8E8E93"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
             <TouchableOpacity onPress={() => setSearchQuery('')}>
                <FontAwesome name="times-circle" size={18} color="#8E8E93" />
             </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filterWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {FILTERS.map((f) => {
            const isActive = activeFilter === f;
            return (
              <TouchableOpacity 
                key={f} 
                style={[
                  styles.filterChip, 
                  { backgroundColor: isActive ? theme.tint : theme.card, borderColor: isActive ? theme.tint : theme.border }
                ]}
                onPress={() => setActiveFilter(f)}
              >
                <Text style={[styles.filterText, { color: isActive ? '#0A0B10' : theme.text }]}>
                   {f === 'Hypertrophy/Bodybuilding' ? 'Hypertrophy' : f === 'Strength/Powerlifting' ? 'Powerlifting' : f === 'Calisthenics/Bodyweight' ? 'Calisthenics' : f}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      {/* Exercise List */}
      <ScrollView contentContainerStyle={styles.list}>
        {filteredExercises.map((ex) => (
          <TouchableOpacity 
            key={ex.id} 
            style={[styles.exerciseCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => setSelectedExercise(ex)}
          >
            <View style={[styles.iconContainer, { backgroundColor: theme.tint + '15' }]}>
              <FontAwesome name={ex.icon as any} size={28} color={theme.tint} />
            </View>
            <View style={styles.cardDetails}>
              <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>{ex.name}</Text>
              <Text style={styles.cardSubtitle}>{ex.muscleGroups.join(', ')}</Text>
              
              <View style={styles.tagContainer}>
                <View style={[styles.tag, { backgroundColor: theme.background, borderColor: theme.border }]}>
                  <Text style={styles.tagText}>{ex.difficulty}</Text>
                </View>
                {ex.programs.slice(0, 1).map(p => (
                  <View key={p} style={[styles.tag, { backgroundColor: theme.background, borderColor: theme.border }]}>
                    <Text style={styles.tagText} numberOfLines={1}>
                       {p.split('/')[0]}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
            <FontAwesome name="chevron-right" size={14} color="#8E8E93" style={styles.cardArrow} />
          </TouchableOpacity>
        ))}
        {filteredExercises.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.text }]}>No exercises found matching your search.</Text>
          </View>
        )}
      </ScrollView>

      {/* Detail Modal */}
      <Modal
        visible={!!selectedExercise}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedExercise(null)}
      >
        {selectedExercise && (
          <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
            <View style={styles.modalDragBar} />
            
            <View style={styles.modalHeader}>
              <View style={[styles.modalIconBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
                 <FontAwesome name={selectedExercise.icon as any} size={40} color={theme.tint} />
              </View>
              <View style={styles.modalHeaderText}>
                 <Text style={[styles.modalTitle, { color: theme.text }]}>{selectedExercise.name}</Text>
                 <Text style={[styles.modalDifficulty, { color: theme.tint }]}>{selectedExercise.difficulty} Level</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedExercise(null)}>
                <FontAwesome name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView contentContainerStyle={styles.modalScroll}>
              
              {/* Targets */}
              <View style={[styles.modalSection, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={[styles.sectionHeading, { color: theme.text }]}>Primary Targets</Text>
                <View style={styles.tagWrap}>
                  {selectedExercise.muscleGroups.map(mg => (
                    <View key={mg} style={[styles.bigTag, { backgroundColor: theme.background, borderColor: theme.tint }]}>
                      <RNText style={[styles.bigTagText, { color: theme.tint }]}>{mg}</RNText>
                    </View>
                  ))}
                </View>
              </View>

              {/* Programs */}
              <View style={[styles.modalSection, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={[styles.sectionHeading, { color: theme.text }]}>Ideal For</Text>
                {selectedExercise.programs.map(p => (
                   <Text key={p} style={[styles.bulletPoint, { color: theme.text }]}>• {p.replace('/', ' / ')}</Text>
                ))}
              </View>

              {/* Benefits */}
              <View style={[styles.modalSection, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={styles.sectionHeadingRow}>
                  <FontAwesome name="star" size={18} color="#FFD60A" style={{ marginRight: 8 }} />
                  <Text style={[styles.sectionHeading, { color: theme.text, marginBottom: 0 }]}>Benefits</Text>
                </View>
                <Text style={styles.paragraph}>{selectedExercise.benefits}</Text>
              </View>

              {/* Instructions */}
              <View style={[styles.modalSection, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={styles.sectionHeadingRow}>
                  <FontAwesome name="list-ol" size={18} color={theme.tint} style={{ marginRight: 8 }} />
                  <Text style={[styles.sectionHeading, { color: theme.text, marginBottom: 0 }]}>Execution Instructions</Text>
                </View>
                {selectedExercise.instructions.split('\n').map((step, idx) => (
                  <Text key={idx} style={styles.stepText}>{step}</Text>
                ))}
              </View>
              
            </ScrollView>
            
            <View style={[styles.modalFooter, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
               <TouchableOpacity style={[styles.modalActionBtn, { backgroundColor: theme.tint }]} onPress={() => setSelectedExercise(null)}>
                  <Text style={styles.modalActionText}>Close Library</Text>
               </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>

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
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filterWrapper: {
    marginBottom: 10,
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: {
    fontWeight: '600',
    fontSize: 14,
  },
  list: {
    padding: 16,
    paddingTop: 8,
  },
  exerciseCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardDetails: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 10,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  cardArrow: {
    marginLeft: 12,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
  },
  modalContainer: {
    flex: 1,
    paddingTop: 12,
  },
  modalDragBar: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#3A3A3C',
    alignSelf: 'center',
    marginBottom: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  modalIconBox: {
    width: 70,
    height: 70,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  modalHeaderText: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modalDifficulty: {
    fontSize: 16,
    fontWeight: '600',
  },
  closeBtn: {
    padding: 8,
  },
  modalScroll: {
    padding: 20,
    paddingBottom: 100,
  },
  modalSection: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bigTag: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  bigTagText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  bulletPoint: {
    fontSize: 16,
    marginBottom: 6,
    fontWeight: '500',
  },
  paragraph: {
    fontSize: 16,
    color: '#8E8E93',
    lineHeight: 24,
  },
  stepText: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 10,
    lineHeight: 24,
  },
  modalFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopWidth: 1,
  },
  modalActionBtn: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  modalActionText: {
    color: '#0A0B10',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
