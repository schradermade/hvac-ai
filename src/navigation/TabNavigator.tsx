import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { colors, typography } from '@/components/ui';
import { TodaysJobsScreen } from '@/features/jobs';
import { ClientListScreen } from '@/features/clients';
import { HistoryScreen, SettingsScreen } from '@/screens';
import type { RootTabParamList } from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();

/**
 * TabNavigator
 *
 * Main navigation structure with 4 tabs:
 * - Jobs: Today's scheduled jobs (main entry point)
 * - Clients: Customer management
 * - History: Past diagnostic sessions
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
      initialRouteName="Jobs"
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
        name="Jobs"
        component={TodaysJobsScreen}
        options={{
          headerTitle: "Today's Jobs",
          tabBarLabel: 'Jobs',
          tabBarIcon: ({ color }) => <TabIcon color={color} icon="📅" />,
        }}
      />
      <Tab.Screen
        name="Clients"
        component={ClientListScreen}
        options={{
          headerTitle: 'Clients',
          tabBarLabel: 'Clients',
          tabBarIcon: ({ color }) => <TabIcon color={color} icon="👥" />,
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          headerTitle: 'Sessions',
          tabBarLabel: 'Sessions',
          tabBarIcon: ({ color }) => <TabIcon color={color} icon="🤖" />,
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
  return <Text style={{ fontSize: 24 }}>{icon}</Text>;
}
