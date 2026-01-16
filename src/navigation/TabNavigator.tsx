import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '@/components/ui';
import { TodaysJobsScreen } from '@/features/jobs';
import { ClientListScreen } from '@/features/clients';
import { TechnicianListScreen } from '@/features/technicians';
import { HistoryScreen, SettingsScreen } from '@/screens';
import type { RootTabParamList } from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();

/**
 * TabNavigator
 *
 * Main navigation structure with 4 tabs:
 * - Jobs: Today's scheduled jobs (main entry point)
 * - Clients: Customer management
 * - AI: Past diagnostic sessions and AI conversations
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
        headerShown: false,
        tabBarActiveTintColor: '#000000',
        tabBarInactiveTintColor: colors.textMuted,
        tabBarActiveBackgroundColor: colors.primaryLight,
        tabBarStyle: {
          backgroundColor: colors.primaryLight + '30',
          borderTopWidth: 0,
          height: 75,
          paddingBottom: 0,
          paddingTop: 0,
        },
        tabBarItemStyle: {
          borderRightWidth: 1,
          borderRightColor: colors.border,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.primaryLight + '30',
        },
        tabBarLabelStyle: {
          fontSize: typography.fontSize.base,
          fontWeight: typography.fontWeight.semibold,
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="Jobs"
        component={TodaysJobsScreen}
        options={{
          title: 'Jobs',
          tabBarLabel: 'Jobs',
          tabBarIcon: ({ color }) => <Ionicons name="calendar-outline" size={20} color={color} />,
        }}
      />
      <Tab.Screen
        name="Clients"
        component={ClientListScreen}
        options={{
          title: 'Clients',
          tabBarLabel: 'Clients',
          tabBarIcon: ({ color }) => <Ionicons name="people-outline" size={22} color={color} />,
        }}
      />
      <Tab.Screen
        name="Technicians"
        component={TechnicianListScreen}
        options={{
          title: 'Technicians',
          tabBarLabel: 'Team',
          tabBarIcon: ({ color }) => (
            <Ionicons name="people-circle-outline" size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          title: 'AI',
          tabBarLabel: 'Copilot',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name="sparkles-outline" size={22} color={focused ? '#FFFFFF' : color} />
          ),
          tabBarActiveTintColor: '#FFFFFF',
          tabBarItemStyle: {
            borderRightWidth: 1,
            borderRightColor: colors.border,
            borderTopWidth: 1,
            borderTopColor: '#D4D7FB',
            backgroundColor: colors.primaryLight + '30',
          },
          tabBarActiveBackgroundColor: '#9B9EF6',
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color }) => <Ionicons name="settings-outline" size={22} color={color} />,
          tabBarItemStyle: {
            borderRightWidth: 0,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          },
        }}
      />
    </Tab.Navigator>
  );
}
