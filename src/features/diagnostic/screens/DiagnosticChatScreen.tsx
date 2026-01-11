import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useDiagnosticChat } from '../hooks/useDiagnostic';
import { MessageList } from '../components/MessageList';
import { ChatInput } from '../components/ChatInput';
import { colors } from '@/components/ui';

/**
 * DiagnosticChatScreen
 *
 * Main screen for the diagnostic chat feature.
 * Provides an AI-powered assistant for HVAC diagnostics and troubleshooting.
 *
 * Features:
 * - Real-time chat with AI assistant
 * - Equipment context awareness
 * - Multiple diagnostic modes (expert/guided/quick)
 * - Offline-capable with mock responses
 */
export function DiagnosticChatScreen() {
  const { messages, sendMessage, isLoading } = useDiagnosticChat('expert');

  return (
    <View style={styles.container}>
      <MessageList messages={messages} />
      <ChatInput
        onSend={sendMessage}
        disabled={isLoading}
        placeholder="Ask about diagnostics, troubleshooting, or calculations..."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
});
