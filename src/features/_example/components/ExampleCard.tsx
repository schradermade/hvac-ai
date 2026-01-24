import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import type { Example } from '../types';

/**
 * Props for ExampleCard component
 *
 * Always define props interface at the top
 */
interface ExampleCardProps {
  example: Example;
  // Callback parameter names are for documentation only
  onPress?: (item: Example) => void;
  onDelete?: (itemId: string) => void;
}

/**
 * ExampleCard component
 *
 * Demonstrates:
 * - Small, focused component (< 150 lines)
 * - Props interface defined
 * - Proper TypeScript types
 * - StyleSheet at the bottom
 * - Optional callback props
 * - Accessible (uses Pressable)
 */
export function ExampleCard({ example, onPress, onDelete }: ExampleCardProps) {
  const handlePress = () => {
    onPress?.(example);
  };

  const handleDelete = () => {
    onDelete?.(example.id);
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={handlePress}
      disabled={!onPress}
    >
      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.title}>{example.title}</Text>

        {/* Status badge */}
        <View style={[styles.badge, styles[`badge_${example.status}`]]}>
          <Text style={styles.badgeText}>{example.status}</Text>
        </View>

        {/* Description */}
        <Text style={styles.description} numberOfLines={2}>
          {example.description}
        </Text>

        {/* Footer with date */}
        <Text style={styles.date}>Updated {formatDate(example.updatedAt)}</Text>
      </View>

      {/* Delete button */}
      {onDelete && (
        <Pressable
          style={({ pressed }) => [styles.deleteButton, pressed && styles.deleteButtonPressed]}
          onPress={handleDelete}
          hitSlop={8}
        >
          <Text style={styles.deleteButtonText}>×</Text>
        </Pressable>
      )}
    </Pressable>
  );
}

/**
 * Helper function to format date
 * In real app, use a library like date-fns
 */
function formatDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  pressed: {
    opacity: 0.7,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  // These styles are used dynamically via styles[`badge_${status}`]
  // eslint-disable-next-line react-native/no-unused-styles
  badge_draft: {
    backgroundColor: '#fef3c7',
  },
  // eslint-disable-next-line react-native/no-unused-styles
  badge_published: {
    backgroundColor: '#d1fae5',
  },
  // eslint-disable-next-line react-native/no-unused-styles
  badge_archived: {
    backgroundColor: '#e5e7eb',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  date: {
    fontSize: 12,
    color: '#9ca3af',
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  deleteButtonPressed: {
    backgroundColor: '#fecaca',
  },
  deleteButtonText: {
    fontSize: 24,
    color: '#dc2626',
    fontWeight: '300',
  },
});
