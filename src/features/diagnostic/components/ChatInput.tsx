import React, { useState } from 'react';
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '@/components/ui';

/**
 * Props for ChatInput component
 */
interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  onFocus?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
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
  onFocus,
  containerStyle,
}: ChatInputProps) {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (!text.trim() || disabled) return;

    onSend(text.trim());
    setText('');
  };

  const canSend = text.trim().length > 0 && !disabled;

  return (
    <View style={[styles.container, containerStyle]}>
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
        onFocus={onFocus}
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
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    paddingBottom: spacing[8],
    backgroundColor: '#EEF2FF', // Match screen background
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
