import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { TabNavigator } from './TabNavigator';
import { DiagnosticChatScreen } from '@/features/diagnostic';
import { ClientDetailScreen } from '@/features/clients';
import { CreateEquipmentScreen, EquipmentDetailScreen } from '@/features/equipment';
import { JobDetailScreen } from '@/features/jobs';
import {
  TechnicianDetailScreen,
  CreateTechnicianScreen,
  MyProfileScreen,
} from '@/features/technicians';
import { LoginScreen, SignupScreen, PasswordResetScreen } from '@/features/auth';
import { useAuth } from '@/providers';
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
 * Conditionally shows auth screens or main app based on authentication state.
 * Wraps the tab navigator with a stack for modal/detail screens.
 */
export function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading spinner while checking auth state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

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
      {!isAuthenticated ? (
        // Auth screens (shown when not authenticated)
        <>
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="Signup"
            component={SignupScreen}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="PasswordReset"
            component={PasswordResetScreen}
            options={{
              headerShown: false,
            }}
          />
        </>
      ) : (
        // Main app screens (shown when authenticated)
        <>
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
            name="TechnicianDetail"
            component={TechnicianDetailScreen}
            options={{
              title: 'Technician Details',
            }}
          />
          <Stack.Screen
            name="CreateTechnician"
            component={CreateTechnicianScreen}
            options={{
              title: 'Add Technician',
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="MyProfile"
            component={MyProfileScreen}
            options={{
              title: 'My Profile',
            }}
          />
          <Stack.Screen
            name="DiagnosticChat"
            component={DiagnosticChatScreen}
            options={{
              title: 'HVAC.ai',
              headerStyle: {
                backgroundColor: '#6366F1',
              },
              headerTintColor: '#FFFFFF',
              headerTitleStyle: {
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.bold,
                color: '#FFFFFF',
              },
              headerShadowVisible: false,
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
