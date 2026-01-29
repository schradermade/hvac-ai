import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  NativeScrollEvent,
  NativeSyntheticEvent,
  InteractionManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '@/components/ui';
import { MessageBubble } from '@/features/diagnostic/components/MessageBubble';
import type { Message } from '@/features/diagnostic/types';

type Props = {
  messages: Message[];
  currentUserId: string;
  scrollKey: string;
  bottomInset?: number;
};

export type JobCopilotMessageListHandle = {
  scrollToLatest: () => void;
};

const SUGGESTIONS = [
  'Any repeat issues on this system?',
  'What was the last maintenance note?',
  'Summarize recent service history.',
];

const copilotPalette = {
  background: '#D4D7FB',
  surface: '#EEF0FF',
  accent: '#9B9EF6',
  border: '#B8BDF4',
} as const;

export const JobCopilotMessageList = forwardRef<JobCopilotMessageListHandle, Props>(
  ({ messages, currentUserId, scrollKey, bottomInset = 0 }, ref) => {
    const flatListRef = useRef<FlatList>(null);
    const isAtBottomRef = useRef(true);
    const hasInitialScrollRef = useRef(false);
    const scrollKeyRef = useRef<string | null>(null);

    if (scrollKeyRef.current !== scrollKey) {
      scrollKeyRef.current = scrollKey;
      hasInitialScrollRef.current = false;
    }

    useImperativeHandle(ref, () => ({
      scrollToLatest: () => {
        if (!isAtBottomRef.current) {
          return;
        }
        flatListRef.current?.scrollToEnd({ animated: true });
      },
    }));

    useEffect(() => {
      if (messages.length === 0) return;
      if (hasInitialScrollRef.current) return;
      const scrollToLatest = () => {
        if (hasInitialScrollRef.current) return;
        flatListRef.current?.scrollToEnd({ animated: false });
        isAtBottomRef.current = true;
        hasInitialScrollRef.current = true;
      };
      requestAnimationFrame(scrollToLatest);
      InteractionManager.runAfterInteractions(scrollToLatest);
    }, [messages.length, scrollKey]);

    const renderItem = useCallback(
      ({ item }: { item: Message }) => (
        <MessageBubble
          message={item}
          isCollaborative={false}
          currentUserId={currentUserId}
          variant="copilot"
        />
      ),
      [currentUserId]
    );

    if (messages.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="sparkles" size={48} color={copilotPalette.accent} />
          </View>
          <Text style={styles.emptyTitle}>Job Copilot</Text>
          <Text style={styles.emptySubtitle}>Ask about this job's history and notes.</Text>

          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsTitle}>Try asking:</Text>
            {SUGGESTIONS.map((item) => (
              <View key={item} style={styles.suggestionCard}>
                <Ionicons name="chatbubble-ellipses-outline" size={16} color={colors.primary} />
                <Text style={styles.suggestionText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      );
    }

    return (
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.listContent, { paddingBottom: spacing[2] + bottomInset }]}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        initialNumToRender={12}
        maxToRenderPerBatch={12}
        windowSize={7}
        maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
        onLayout={() => {
          if (!hasInitialScrollRef.current && messages.length > 0) {
            flatListRef.current?.scrollToEnd({ animated: false });
            isAtBottomRef.current = true;
            hasInitialScrollRef.current = true;
          }
        }}
        onContentSizeChange={() => {
          if (isAtBottomRef.current) {
            flatListRef.current?.scrollToEnd({ animated: true });
          }
        }}
        onScroll={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
          const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
          const paddingToBottom = 40;
          isAtBottomRef.current =
            layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
        }}
        scrollEventThrottle={16}
      />
    );
  }
);

const styles = StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: copilotPalette.background,
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
    backgroundColor: copilotPalette.background,
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
    textAlign: 'center',
  },
  suggestionsContainer: {
    width: '100%',
    maxWidth: 420,
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
    backgroundColor: copilotPalette.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: copilotPalette.border,
  },
  suggestionText: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    flex: 1,
  },
});
