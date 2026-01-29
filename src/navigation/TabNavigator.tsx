import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
 * Custom label component for Copilot tab with icon on the right
 */
function CopilotTabLabel({ focused }: { focused: boolean }) {
  return (
    <View style={tabLabelStyles.wrapper}>
      <View style={tabLabelStyles.container}>
        <Text style={[tabLabelStyles.label, focused && tabLabelStyles.labelFocused]}>COPILOT</Text>
        <Ionicons
          name="sparkles"
          size={12}
          color={focused ? '#FFFFFF' : colors.textMuted}
          style={{ marginLeft: 4 }}
        />
      </View>
    </View>
  );
}

const tabLabelStyles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -1.05,
    color: colors.textMuted,
  },
  labelFocused: {
    color: '#FFFFFF',
  },
});

/**
 * TabNavigator
 *
 * Main navigation structure with 5 tabs:
 * - Jobs: Today's scheduled jobs (main entry point)
 * - Clients: Customer management
 * - Copilot: AI diagnostic assistant (center focal point)
 * - Team: Technician directory and collaboration
 * - Settings: App preferences
 *
 * Follows design principles:
 * - Professional, minimal design
 * - Clear labels (no mystery meat navigation)
 * - Uses design tokens for consistency
 * - Proper touch targets
 * - AI Copilot positioned centrally for easy access
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
        name="History"
        component={HistoryScreen}
        options={{
          title: 'AI',
          tabBarLabel: ({ focused }) => <CopilotTabLabel focused={focused} />,
          tabBarIcon: () => null,
          tabBarItemStyle: {
            borderRightWidth: 1,
            borderRightColor: colors.border,
            borderTopWidth: 1,
            borderTopColor: '#D4D7FB',
            backgroundColor: '#D4D7FB',
          },
          tabBarActiveBackgroundColor: '#4E56D9',
        }}
      />
      <Tab.Screen
        name="Technicians"
        component={TechnicianListScreen}
        options={{
          title: 'Technicians',
          tabBarLabel: 'Techs',
          tabBarIcon: ({ color }) => (
            <Ionicons name="people-circle-outline" size={22} color={color} />
          ),
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
            backgroundColor: colors.primaryLight + '30',
          },
        }}
      />
    </Tab.Navigator>
  );
}
