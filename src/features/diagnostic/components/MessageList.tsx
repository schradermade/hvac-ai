import React, { useRef, useEffect } from 'react';
import { FlatList, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '@/components/ui';
import { MessageBubble } from './MessageBubble';
import type { Message } from '../types';

/**
 * Props for MessageList component
 */
interface MessageListProps {
  messages: Message[];
  isCollaborative: boolean;
  currentUserId: string;
}

/**
 * MessageList component
 *
 * Displays a scrollable list of chat messages with:
 * - Auto-scroll to bottom on new messages
 * - Empty state when no messages
 * - Collaborative session support with sender attribution
 * - Color-coded messages by participant role
 * - Optimized rendering with FlatList
 */
export function MessageList({ messages, isCollaborative, currentUserId }: MessageListProps) {
  const flatListRef = useRef<FlatList>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages.length]);

  // Empty state
  if (messages.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <Ionicons name="sparkles" size={48} color="#6366F1" />
        </View>
        <Text style={styles.emptyTitle}>HVACOps Assistant</Text>
        <Text style={styles.emptySubtitle}>Powered by HVAC.ai • Ready to help</Text>

        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>Try asking about:</Text>
          <View style={styles.suggestionCard}>
            <Ionicons name="thermometer-outline" size={16} color="#6366F1" />
            <Text style={styles.suggestionText}>Refrigerant charging procedures</Text>
          </View>
          <View style={styles.suggestionCard}>
            <Ionicons name="build-outline" size={16} color="#6366F1" />
            <Text style={styles.suggestionText}>Troubleshooting system issues</Text>
          </View>
          <View style={styles.suggestionCard}>
            <Ionicons name="calculator-outline" size={16} color="#6366F1" />
            <Text style={styles.suggestionText}>Superheat and subcooling calculations</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <FlatList
      ref={flatListRef}
      data={messages}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <MessageBubble
          message={item}
          isCollaborative={isCollaborative}
          currentUserId={currentUserId}
        />
      )}
      contentContainerStyle={styles.listContent}
      style={styles.list}
      showsVerticalScrollIndicator={false}
      onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    backgroundColor: '#EEF2FF',
  },
  listContent: {
    paddingTop: spacing[4],
    paddingBottom: spacing[2],
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
    backgroundColor: '#EEF2FF',
  },
  emptyIconContainer: {
    marginBottom: spacing[4],
  },
  emptyTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing[1],
  },
  emptySubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginBottom: spacing[6],
  },
  suggestionsContainer: {
    width: '100%',
    maxWidth: 400,
    gap: spacing[2],
  },
  suggestionsTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing[2],
  },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  suggestionText: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    flex: 1,
  },
});
