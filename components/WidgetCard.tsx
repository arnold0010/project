import React from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { Link } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface WidgetCardProps {
  title: string;
  description?: string;
  iconName: React.ComponentProps<typeof FontAwesome>['name'];
  href: any;
  value?: string;
  color?: string;
}

export default function WidgetCard({
  title,
  description,
  iconName,
  href,
  value,
  color,
}: WidgetCardProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  const accentColor = color || theme.tint;

  return (
    <Link href={href} asChild>
      <TouchableOpacity activeOpacity={0.8} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.header}>
          <View style={[styles.titleRow]}>
            <View style={[styles.iconContainer, { backgroundColor: accentColor + '20' }]}>
              <FontAwesome name={iconName} size={20} color={accentColor} />
            </View>
          </View>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit>{title}</Text>
        </View>
        <View style={styles.content}>
          {value && <Text style={[styles.value, { color: theme.text }]}>{value}</Text>}
          {description && <Text style={styles.description}>{description}</Text>}
        </View>
      </TouchableOpacity>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '45%',
    margin: 8,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  header: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleRow: {
    marginBottom: 8,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    marginTop: 4,
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: '#8E8E93',
    lineHeight: 18,
  },
});
