import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '@/components/ui';
import { colors } from '@/components/ui';
import type { TabScreenProps } from '@/navigation/types';

/**
 * HistoryScreen
 *
 * Shows diagnostic history with:
 * - Past diagnostic conversations
 * - Search and filter
 * - Resume previous diagnostics
 * - Export reports
 */
// eslint-disable-next-line no-unused-vars
export function HistoryScreen(_props: TabScreenProps<'History'>) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <EmptyState
          title="No diagnostic history"
          description="Your past diagnostics and conversations will appear here for easy reference"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
});
