import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { TabNavigator } from './TabNavigator';
import { DiagnosticChatScreen } from '@/features/diagnostic';
import { ClientDetailScreen } from '@/features/clients';
import { CreateEquipmentScreen, EquipmentDetailScreen } from '@/features/equipment';
import { JobDetailScreen } from '@/features/jobs';
import { colors, typography } from '@/components/ui';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Get the title for the currently active tab
 * Used to set proper back button labels when navigating from tabs to detail screens
 */
function getHeaderTitle(route: RouteProp<RootStackParamList, 'Main'>): string {
  const routeName = getFocusedRouteNameFromRoute(route) ?? 'Jobs';

  switch (routeName) {
    case 'Jobs':
      return 'Jobs';
    case 'Clients':
      return 'Clients';
    case 'History':
      return 'Sessions';
    case 'Settings':
      return 'Settings';
    default:
      return 'Jobs';
  }
}

/**
 * Root Stack Navigator
 *
 * Wraps the tab navigator with a stack for modal/detail screens
 * Enables navigation to screens like DiagnosticChat while maintaining tab state
 */
export function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primaryLight,
        },
        headerTintColor: colors.primary,
        headerTitleStyle: {
          fontSize: typography.fontSize.xl,
          fontWeight: typography.fontWeight.bold,
          color: colors.textPrimary,
        },
        headerShadowVisible: true,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="Main"
        component={TabNavigator}
        options={({ route }) => ({
          headerShown: false,
          title: getHeaderTitle(route),
        })}
      />
      <Stack.Screen
        name="ClientDetail"
        component={ClientDetailScreen}
        options={{
          title: 'Client Details',
        }}
      />
      <Stack.Screen
        name="JobDetail"
        component={JobDetailScreen}
        options={{
          title: 'Job Details',
        }}
      />
      <Stack.Screen
        name="CreateEquipment"
        component={CreateEquipmentScreen}
        options={{
          title: 'Add Equipment',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="EquipmentDetail"
        component={EquipmentDetailScreen}
        options={{
          title: 'Equipment Details',
        }}
      />
      <Stack.Screen
        name="DiagnosticChat"
        component={DiagnosticChatScreen}
        options={{
          title: 'Diagnostic Assistant',
        }}
      />
    </Stack.Navigator>
  );
}
