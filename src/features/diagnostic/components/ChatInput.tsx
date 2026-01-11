import React, { useState } from 'react';
import {
  View,
  TextInput,
  Pressable,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

/**
 * Props for ChatInput component
 */
interface ChatInputProps {
  // eslint-disable-next-line no-unused-vars
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * ChatInput component
 *
 * Provides input field and send button for chat with:
 * - Auto-clear after sending
 * - Disabled state when loading
 * - Keyboard handling
 * - Accessible controls
 */
export function ChatInput({
  onSend,
  disabled = false,
  placeholder = 'Ask a question...',
}: ChatInputProps) {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (!text.trim() || disabled) return;

    onSend(text.trim());
    setText('');
  };

  const canSend = text.trim().length > 0 && !disabled;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.container}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          multiline
          maxLength={500}
          editable={!disabled}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
        />
        <Pressable
          style={({ pressed }) => [
            styles.sendButton,
            !canSend && styles.sendButtonDisabled,
            pressed && canSend && styles.sendButtonPressed,
          ]}
          onPress={handleSend}
          disabled={!canSend}
        >
          <Text style={[styles.sendButtonText, !canSend && styles.sendButtonTextDisabled]}>
            Send
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 20,
    fontSize: 15,
    color: '#1f2937',
    marginRight: 8,
  },
  sendButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#2563eb',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 70,
  },
  sendButtonPressed: {
    backgroundColor: '#1d4ed8',
  },
  sendButtonDisabled: {
    backgroundColor: '#e5e7eb',
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  sendButtonTextDisabled: {
    color: '#9ca3af',
  },
});
