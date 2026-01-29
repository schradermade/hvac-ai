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
  variant?: 'default' | 'copilot';
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

const COPILOT_PALETTE = {
  background: '#D4D7FB',
  surface: '#EEF0FF',
  accent: '#9B9EF6',
  border: '#B8BDF4',
  accentText: '#2F3180',
} as const;

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
function MessageBubbleBase({
  message,
  isCollaborative,
  currentUserId,
  variant = 'default',
}: MessageBubbleProps) {
  const isOwnMessage = message.senderId === currentUserId;
  const isAI = message.senderId === 'ai' || message.role === 'assistant';
  const isSystem = message.senderId === 'system';
  const [sourcesExpanded, setSourcesExpanded] = useState(false);
  const isCopilot = variant === 'copilot';

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
    if (isCopilot) return COPILOT_PALETTE.accent;
    if (isAI) return ROLE_COLORS.ai;
    if (message.senderRole === 'primary') return ROLE_COLORS.primary;
    if (message.senderRole === 'invited') return ROLE_COLORS.invited;
    return ROLE_COLORS.primary;
  };

  const getBubbleColor = (): string => {
    if (isCopilot) return COPILOT_PALETTE.surface;
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
              isCopilot &&
                (isOwnMessage ? styles.copilotUserBubble : styles.copilotAssistantBubble),
            ]}
          >
            {message.isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={senderColor} />
                <Text style={[styles.loadingText, isCopilot && styles.copilotLoadingText]}>
                  Thinking...
                </Text>
              </View>
            ) : (
              <Text
                style={[
                  styles.text,
                  isOwnMessage ? styles.userText : styles.assistantText,
                  isCopilot &&
                    (isOwnMessage ? styles.copilotUserText : styles.copilotAssistantText),
                ]}
              >
                {message.content}
              </Text>
            )}
          </View>
          {isAI && !message.isLoading && message.sources?.length ? (
            <View style={[styles.sourcesCard, isCopilot && styles.copilotSourcesCard]}>
              <TouchableOpacity
                style={styles.sourcesHeader}
                onPress={() => setSourcesExpanded((prev) => !prev)}
                activeOpacity={0.7}
              >
                <View style={styles.sourcesMeta}>
                  <Text style={[styles.sourcesTitle, isCopilot && styles.copilotSourcesTitle]}>
                    Sources
                  </Text>
                  <View
                    style={[styles.sourcesCountBadge, isCopilot && styles.copilotSourcesCountBadge]}
                  >
                    <Text style={[styles.sourcesCount, isCopilot && styles.copilotSourcesCount]}>
                      {message.sources.length}
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name={sourcesExpanded ? 'chevron-up' : 'chevron-down'}
                  size={24}
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
                  <View
                    key={`${source.snippet}-${index}`}
                    style={[styles.sourceItem, isCopilot && styles.copilotSourceItem]}
                  >
                    <Text style={[styles.sourceLine, isCopilot && styles.copilotSourceLine]}>
                      {source.snippet}
                    </Text>
                    <View
                      style={[styles.sourceDivider, isCopilot && styles.copilotSourceDivider]}
                    />
                    {(source.authorName || source.authorEmail) && (
                      <Text style={[styles.sourceAuthor, isCopilot && styles.copilotSourceMeta]}>
                        {source.authorName || source.authorEmail}
                      </Text>
                    )}
                    {source.date ? (
                      <Text style={[styles.sourceDate, isCopilot && styles.copilotSourceMeta]}>
                        {formatSourceDate(source.date)}
                      </Text>
                    ) : null}
                  </View>
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
          <View
            style={[
              styles.avatarContainer,
              {
                backgroundColor: isCopilot ? senderColor : senderColor + '15',
              },
            ]}
          >
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

function formatSourceDate(date: string) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return date;
  }
  return parsed.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
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
  copilotUserBubble: {
    backgroundColor: COPILOT_PALETTE.accent,
    borderBottomRightRadius: borderRadius.sm,
  },
  copilotAssistantBubble: {
    backgroundColor: COPILOT_PALETTE.surface,
    borderWidth: 1,
    borderColor: COPILOT_PALETTE.border,
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
  copilotUserText: {
    color: colors.surface,
  },
  copilotAssistantText: {
    color: COPILOT_PALETTE.accentText,
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
  copilotLoadingText: {
    color: COPILOT_PALETTE.accentText,
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
  copilotSourcesCard: {
    backgroundColor: COPILOT_PALETTE.surface,
    borderColor: COPILOT_PALETTE.border,
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
  copilotSourcesTitle: {
    color: COPILOT_PALETTE.accentText,
  },
  sourcesCount: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.semibold,
  },
  copilotSourcesCount: {
    color: COPILOT_PALETTE.accentText,
  },
  sourcesCountBadge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: spacing[1],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  copilotSourcesCountBadge: {
    borderColor: COPILOT_PALETTE.border,
    backgroundColor: COPILOT_PALETTE.surface,
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
  },
  copilotSourceLine: {
    color: COPILOT_PALETTE.accentText,
  },
  sourceItem: {
    gap: spacing[1],
    padding: spacing[2],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    marginTop: spacing[2],
  },
  copilotSourceItem: {
    borderColor: COPILOT_PALETTE.border,
    backgroundColor: COPILOT_PALETTE.background,
  },
  sourceAuthor: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },
  copilotSourceMeta: {
    color: COPILOT_PALETTE.accentText,
  },
  sourceDivider: {
    height: 1,
    width: 25,
    backgroundColor: colors.border,
  },
  copilotSourceDivider: {
    backgroundColor: COPILOT_PALETTE.border,
  },
  sourceDate: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
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
