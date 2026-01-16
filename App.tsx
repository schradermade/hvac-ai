import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation';
import { AuthProvider } from './src/providers';
import { useMigrations } from './src/hooks/useMigrations';
import { Spinner } from './src/components/ui';
import { colors, spacing, typography } from './src/components/ui';

// Create QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

/**
 * App Root Component
 *
 * Sets up:
 * - Data migrations (equipment → clients)
 * - React Query for server state
 * - Authentication context
 * - React Navigation for routing
 * - Tab-based navigation structure
 */
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}

/**
 * App content with migration handling
 */
function AppContent() {
  const { isComplete, error } = useMigrations();

  // Show error screen if migration fails
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Migration Error</Text>
          <Text style={styles.errorMessage}>{error.message}</Text>
          <Text style={styles.errorHint}>Please restart the app or contact support</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show loading screen while migrations run
  if (!isComplete) {
    return (
      <SafeAreaView style={styles.container}>
        <Spinner message="Preparing app..." />
      </SafeAreaView>
    );
  }

  // Migrations complete - show main app
  return (
    <NavigationContainer>
      <RootNavigator />
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[6],
  },
  errorTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.semibold,
    color: colors.error,
    marginBottom: spacing[3],
  },
  errorMessage: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing[4],
  },
  errorHint: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
