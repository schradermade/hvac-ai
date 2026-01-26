import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '@/components/ui';
import type { Message } from '../types';

/**
 * Props for MessageBubble component
 */
interface MessageBubbleProps {
  message: Message;
  isCollaborative: boolean;
  currentUserId: string;
}

/**
 * Role colors for collaborative chat
 */
const ROLE_COLORS = {
  primary: '#2563eb', // Blue
  invited: '#9333ea', // Purple
  ai: '#6366f1', // Indigo
  system: '#6b7280', // Gray
};

/**
 * MessageBubble component
 *
 * Professional message bubble with FAANG-level design:
 * - Avatar icons for user and assistant
 * - Different styling for user vs assistant messages
 * - Sender attribution in collaborative mode
 * - Color coding by participant role
 * - System messages for join/leave events
 * - Loading indicator for assistant responses
 * - Timestamp display
 * - Proper spacing and shadows
 */
function MessageBubbleBase({ message, isCollaborative, currentUserId }: MessageBubbleProps) {
  const isOwnMessage = message.senderId === currentUserId;
  const isAI = message.senderId === 'ai' || message.role === 'assistant';
  const isSystem = message.senderId === 'system';
  const [sourcesExpanded, setSourcesExpanded] = useState(false);

  // System messages (join/leave events)
  if (isSystem) {
    return (
      <View style={styles.systemMessageContainer}>
        <Text style={styles.systemMessage}>{message.content}</Text>
        <Text style={styles.systemTimestamp}>{formatTimestamp(message.timestamp)}</Text>
      </View>
    );
  }

  // Get color based on role
  const getSenderColor = (): string => {
    if (isAI) return ROLE_COLORS.ai;
    if (message.senderRole === 'primary') return ROLE_COLORS.primary;
    if (message.senderRole === 'invited') return ROLE_COLORS.invited;
    return ROLE_COLORS.primary;
  };

  const getBubbleColor = (): string => {
    if (isAI) return ROLE_COLORS.ai + '10'; // Indigo 10%
    if (message.senderRole === 'primary') return ROLE_COLORS.primary + '10'; // Blue 10%
    if (message.senderRole === 'invited') return ROLE_COLORS.invited + '10'; // Purple 10%
    return ROLE_COLORS.primary + '10';
  };

  const senderColor = getSenderColor();

  return (
    <View
      style={[styles.container, isOwnMessage ? styles.userContainer : styles.assistantContainer]}
    >
      {/* Sender name (only in collaborative mode for non-own messages) */}
      {isCollaborative && !isOwnMessage && message.senderName && (
        <Text style={[styles.senderName, { color: senderColor }]}>{message.senderName}</Text>
      )}

      <View style={styles.messageRow}>
        {!isOwnMessage && (
          <View style={[styles.avatarContainer, { backgroundColor: senderColor + '15' }]}>
            {isAI ? (
              <Ionicons name="sparkles" size={20} color={senderColor} />
            ) : (
              <Ionicons name="person" size={20} color={senderColor} />
            )}
          </View>
        )}

        <View style={styles.contentContainer}>
          <View
            style={[
              styles.bubble,
              isOwnMessage && styles.userBubble,
              !isOwnMessage && { backgroundColor: getBubbleColor() },
            ]}
          >
            {message.isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={senderColor} />
                <Text style={styles.loadingText}>Thinking...</Text>
              </View>
            ) : (
              <Text style={[styles.text, isOwnMessage ? styles.userText : styles.assistantText]}>
                {message.content}
              </Text>
            )}
          </View>
          {isAI && !message.isLoading && message.sources?.length ? (
            <View style={styles.sourcesCard}>
              <TouchableOpacity
                style={styles.sourcesHeader}
                onPress={() => setSourcesExpanded((prev) => !prev)}
                activeOpacity={0.7}
              >
                <View style={styles.sourcesMeta}>
                  <Text style={styles.sourcesTitle}>Sources</Text>
                  <Text style={styles.sourcesCount}>{message.sources.length}</Text>
                </View>
                <Ionicons
                  name={sourcesExpanded ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
              <View
                style={[
                  styles.sourcesBody,
                  sourcesExpanded ? styles.sourcesBodyExpanded : styles.sourcesBodyCollapsed,
                ]}
              >
                {message.sources.map((source, index) => (
                  <Text key={`${source.snippet}-${index}`} style={styles.sourceLine}>
                    {formatSource(source)}
                  </Text>
                ))}
              </View>
            </View>
          ) : null}
          <Text
            style={[
              styles.timestamp,
              isOwnMessage ? styles.userTimestamp : styles.assistantTimestamp,
            ]}
          >
            {formatTimestamp(message.timestamp)}
          </Text>
        </View>

        {isOwnMessage && (
          <View style={[styles.avatarContainer, { backgroundColor: senderColor + '15' }]}>
            <Ionicons name="person" size={20} color={colors.surface} />
          </View>
        )}
      </View>
    </View>
  );
}

export const MessageBubble = React.memo(MessageBubbleBase);

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

function formatSource(source: { snippet: string; date?: string }) {
  if (!source.date) {
    return `• ${source.snippet}`;
  }
  const parsed = new Date(source.date);
  const stamp = Number.isNaN(parsed.getTime())
    ? source.date
    : parsed.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
  return `• ${source.snippet} (${stamp})`;
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
  senderName: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    marginBottom: spacing[1],
    marginLeft: 40, // Offset for avatar
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
  sourcesCard: {
    marginTop: spacing[2],
    padding: spacing[3],
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sourcesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[2],
  },
  sourcesMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  sourcesTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  sourcesCount: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    fontWeight: typography.fontWeight.semibold,
  },
  sourcesBody: {
    overflow: 'hidden',
  },
  sourcesBodyExpanded: {
    marginTop: spacing[2],
    opacity: 1,
    maxHeight: 4000,
  },
  sourcesBodyCollapsed: {
    marginTop: 0,
    opacity: 0,
    maxHeight: 0,
  },
  sourceLine: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
    marginTop: spacing[2],
  },
  // System messages
  systemMessageContainer: {
    alignItems: 'center',
    marginVertical: spacing[3],
    paddingHorizontal: spacing[4],
  },
  systemMessage: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  systemTimestamp: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    marginTop: spacing[1],
  },
});
