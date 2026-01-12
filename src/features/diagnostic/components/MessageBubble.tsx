import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '@/components/ui';
import type { Message } from '../types';

/**
 * Props for MessageBubble component
 */
interface MessageBubbleProps {
  message: Message;
}

/**
 * MessageBubble component
 *
 * Professional message bubble with FAANG-level design:
 * - Avatar icons for user and assistant
 * - Different styling for user vs assistant messages
 * - Loading indicator for assistant responses
 * - Timestamp display
 * - Proper spacing and shadows
 */
export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.assistantContainer]}>
      <View style={styles.messageRow}>
        {!isUser && (
          <View style={styles.avatarContainer}>
            <Ionicons name="sparkles" size={20} color="#6366F1" />
          </View>
        )}

        <View style={styles.contentContainer}>
          <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
            {message.isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#6366F1" />
                <Text style={styles.loadingText}>Thinking...</Text>
              </View>
            ) : (
              <Text style={[styles.text, isUser ? styles.userText : styles.assistantText]}>
                {message.content}
              </Text>
            )}
          </View>
          <Text
            style={[styles.timestamp, isUser ? styles.userTimestamp : styles.assistantTimestamp]}
          >
            {formatTimestamp(message.timestamp)}
          </Text>
        </View>

        {isUser && (
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={20} color="#FFFFFF" />
          </View>
        )}
      </View>
    </View>
  );
}

/**
 * Format timestamp for display
 */
function formatTimestamp(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');

  return `${displayHours}:${displayMinutes} ${ampm}`;
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing[4],
    paddingHorizontal: spacing[4],
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  assistantContainer: {
    alignItems: 'flex-start',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
    maxWidth: '85%',
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: '#6366F1' + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[1],
  },
  contentContainer: {
    flex: 1,
  },
  bubble: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.xl,
  },
  userBubble: {
    backgroundColor: '#6366F1',
    borderBottomRightRadius: borderRadius.sm,
  },
  assistantBubble: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderBottomLeftRadius: borderRadius.sm,
  },
  text: {
    fontSize: typography.fontSize.base,
    lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
  },
  userText: {
    color: colors.surface,
  },
  assistantText: {
    color: colors.textPrimary,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  timestamp: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    marginTop: spacing[1],
  },
  userTimestamp: {
    textAlign: 'right',
  },
  assistantTimestamp: {
    textAlign: 'left',
  },
});
