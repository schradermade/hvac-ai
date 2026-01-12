import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabNavigator } from './TabNavigator';
import { DiagnosticChatScreen } from '@/features/diagnostic';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Root Stack Navigator
 *
 * Wraps the tab navigator with a stack for modal/detail screens
 * Enables navigation to screens like DiagnosticChat while maintaining tab state
 */
export function RootNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Main" component={TabNavigator} options={{ headerShown: false }} />
      <Stack.Screen
        name="DiagnosticChat"
        component={DiagnosticChatScreen}
        options={{
          title: 'Diagnostic Assistant',
          headerBackTitle: 'Back',
        }}
      />
    </Stack.Navigator>
  );
}
