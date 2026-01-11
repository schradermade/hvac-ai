import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { Heading, Body } from '@/components/ui';
import { colors, spacing } from '@/components/ui';
import type { TabScreenProps } from '@/navigation/types';

/**
 * SettingsScreen
 *
 * App settings and preferences:
 * - Account settings
 * - Notification preferences
 * - Units (Imperial/Metric)
 * - Default refrigerant type
 * - About & support
 */
// eslint-disable-next-line no-unused-vars
export function SettingsScreen(_props: TabScreenProps<'Settings'>) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Heading level={1}>Settings</Heading>
          <Body secondary>Configure your preferences</Body>
        </View>
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
  header: {
    padding: spacing[4],
  },
});
