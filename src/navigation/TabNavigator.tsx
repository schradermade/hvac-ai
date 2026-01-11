import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { colors, typography } from '@/components/ui';
import { DiagnosticChatScreen } from '@/features/diagnostic';
import { EquipmentScreen, HistoryScreen, SettingsScreen } from '@/screens';
import type { RootTabParamList } from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();

/**
 * TabNavigator
 *
 * Main navigation structure with 4 tabs:
 * - Diagnostics: AI chat assistant
 * - Equipment: Saved equipment profiles
 * - History: Past diagnostics
 * - Settings: App preferences
 *
 * Follows design principles:
 * - Professional, minimal design
 * - Clear labels (no mystery meat navigation)
 * - Uses design tokens for consistency
 * - Proper touch targets
 */
export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: typography.fontSize.xs,
          fontWeight: typography.fontWeight.medium,
        },
        headerStyle: {
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
          borderBottomWidth: 1,
        },
        headerTitleStyle: {
          fontSize: typography.fontSize.lg,
          fontWeight: typography.fontWeight.semibold,
          color: colors.textPrimary,
        },
      }}
    >
      <Tab.Screen
        name="Diagnostics"
        component={DiagnosticChatScreen}
        options={{
          headerTitle: 'Diagnostic Assistant',
          tabBarLabel: 'Diagnostics',
          tabBarIcon: ({ color }) => <TabIcon color={color} icon="💬" />,
        }}
      />
      <Tab.Screen
        name="Equipment"
        component={EquipmentScreen}
        options={{
          headerTitle: 'Equipment',
          tabBarLabel: 'Equipment',
          tabBarIcon: ({ color }) => <TabIcon color={color} icon="⚙️" />,
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          headerTitle: 'History',
          tabBarLabel: 'History',
          tabBarIcon: ({ color }) => <TabIcon color={color} icon="📋" />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          headerTitle: 'Settings',
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color }) => <TabIcon color={color} icon="⚙" />,
        }}
      />
    </Tab.Navigator>
  );
}

/**
 * Simple tab icon component
 * Using emojis as placeholders - will be replaced with proper icons later
 */
function TabIcon({ icon }: { icon: string; color: string }) {
  // eslint-disable-next-line react-native/no-inline-styles
  return <span style={{ fontSize: 24 }}>{icon}</span>;
}
