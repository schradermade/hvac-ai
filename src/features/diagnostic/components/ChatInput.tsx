import React, { useState } from 'react';
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '@/components/ui';

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
 * - 44pt minimum touch targets
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
          placeholderTextColor={colors.disabled}
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
          <Ionicons name="arrow-up" size={24} color={canSend ? colors.surface : colors.disabled} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    paddingBottom: spacing[5],
    backgroundColor: '#E0E7FF', // Slightly darker indigo for input area
    borderTopWidth: 0,
  },
  input: {
    flex: 1,
    minHeight: 52,
    maxHeight: 120,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[4],
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    marginRight: spacing[2],
    borderWidth: 1,
    borderColor: '#C7D2FE',
    textAlignVertical: 'center',
  },
  sendButton: {
    width: 52,
    height: 52,
    backgroundColor: '#6366F1',
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  sendButtonPressed: {
    backgroundColor: '#5558E3',
  },
  sendButtonDisabled: {
    backgroundColor: '#C7D2FE',
    shadowOpacity: 0,
    elevation: 0,
  },
});
