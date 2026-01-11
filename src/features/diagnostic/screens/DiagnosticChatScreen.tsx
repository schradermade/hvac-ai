import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { useDiagnosticChat } from '../hooks/useDiagnostic';
import { MessageList } from '../components/MessageList';
import { ChatInput } from '../components/ChatInput';

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
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <MessageList messages={messages} />
        <ChatInput
          onSend={sendMessage}
          disabled={isLoading}
          placeholder="Ask about diagnostics, troubleshooting, or calculations..."
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
  },
});
