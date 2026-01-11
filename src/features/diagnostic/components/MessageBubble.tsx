import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
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
 * Displays a single message in the chat with:
 * - Different styling for user vs assistant messages
 * - Loading indicator for assistant responses
 * - Timestamp display
 */
export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.assistantContainer]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        {message.isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#6b7280" />
            <Text style={styles.loadingText}>Thinking...</Text>
          </View>
        ) : (
          <Text style={[styles.text, isUser ? styles.userText : styles.assistantText]}>
            {message.content}
          </Text>
        )}
      </View>
      <Text style={[styles.timestamp, isUser ? styles.userTimestamp : styles.assistantTimestamp]}>
        {formatTimestamp(message.timestamp)}
      </Text>
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
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  assistantContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: '#2563eb',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#f3f4f6',
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: '#ffffff',
  },
  assistantText: {
    color: '#1f2937',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 15,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  timestamp: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 4,
  },
  userTimestamp: {
    textAlign: 'right',
  },
  assistantTimestamp: {
    textAlign: 'left',
  },
});
