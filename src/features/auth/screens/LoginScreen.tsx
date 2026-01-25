/**
 * Login Screen
 *
 * Professional login interface with:
 * - Clean centered layout
 * - Large input fields (48pt)
 * - Show/hide password toggle
 * - Clear error messages
 * - Loading states
 */

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui';
import { colors, spacing, typography, borderRadius } from '@/components/ui';
import { useAuth } from '@/providers';
import { useSavedAccounts } from '../hooks/useSavedAccounts';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

const BRAND_SIZE = 32;

WebBrowser.maybeCompleteAuthSession();

export function LoginScreen() {
  const { loginWithOidc, loginWithSavedAccount, isLoading, error, clearError } = useAuth();
  const { accounts, isLoading: accountsLoading } = useSavedAccounts();
  const [authError, setAuthError] = useState<string | null>(null);

  const authUrl = process.env.EXPO_PUBLIC_AUTH_URL;
  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'hvacops', path: 'auth' });
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: 'hvacops-mobile',
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
    },
    authUrl
      ? {
          authorizationEndpoint: `${authUrl}/auth/authorize`,
        }
      : undefined
  );

  useEffect(() => {
    const handleAuthResponse = async () => {
      if (response?.type !== 'success' || !response.params.code) {
        return;
      }
      if (!request?.codeVerifier) {
        setAuthError('Missing PKCE verifier. Please retry.');
        return;
      }

      clearError();
      setAuthError(null);

      try {
        await loginWithOidc(response.params.code, request.codeVerifier);
      } catch (err) {
        console.error('OIDC login failed:', err);
        setAuthError('Sign-in failed. Please try again.');
      }
    };

    handleAuthResponse();
  }, [response, request, loginWithOidc, clearError]);

  const quickAccounts = accounts.filter((item) => item.hasSession && !item.isExpired);

  const handleQuickLogin = async (accountId: string) => {
    clearError();

    try {
      await loginWithSavedAccount(accountId);
    } catch (err) {
      console.error('Quick login failed:', err);
    }
  };

  const handleSsoLogin = async () => {
    if (!authUrl) {
      setAuthError('Auth service is not configured.');
      return;
    }

    setAuthError(null);
    await promptAsync();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo and Branding */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.logoContainer}>
              <Ionicons name="snow" size={BRAND_SIZE} color={colors.primary} />
            </View>
            <Text style={styles.appName}>HVACOps</Text>
          </View>
          <Text style={styles.subtitle}>Welcome back</Text>
        </View>

        {!accountsLoading && quickAccounts.length > 0 && (
          <View style={styles.quickLoginSection}>
            <Text style={styles.quickLoginTitle}>Quick sign-in</Text>
            {quickAccounts.map((item) => (
              <TouchableOpacity
                key={item.account.id}
                style={styles.quickLoginCard}
                onPress={() => handleQuickLogin(item.account.id)}
                disabled={isLoading}
              >
                <View style={styles.quickLoginIcon}>
                  <Ionicons name="snow" size={18} color={colors.primary} />
                </View>
                <View style={styles.quickLoginInfo}>
                  <Text style={styles.quickLoginName}>
                    {item.account.firstName} {item.account.lastName}
                  </Text>
                  <Text style={styles.quickLoginEmail}>{item.account.email}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Form */}
        <View style={styles.form}>
          {(error || authError) && (
            <View style={styles.authErrorContainer}>
              <Ionicons name="alert-circle" size={20} color={colors.error} />
              <Text style={styles.authErrorText}>
                {authError || error?.message || 'Sign-in failed'}
              </Text>
            </View>
          )}

          <Button onPress={handleSsoLogin} loading={isLoading} style={styles.signInButton}>
            Continue with HVACOps
          </Button>

          <Text style={styles.ssoHint}>Secure sign-in uses your organization account.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[8],
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing[8],
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  logoContainer: {
    width: BRAND_SIZE,
    height: BRAND_SIZE,
    borderRadius: BRAND_SIZE / 2,
    backgroundColor: colors.primaryLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[2],
  },
  appName: {
    fontSize: BRAND_SIZE,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  quickLoginSection: {
    marginBottom: spacing[6],
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  quickLoginTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing[3],
    textAlign: 'center',
  },
  quickLoginCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.base,
    padding: spacing[4],
    marginBottom: spacing[3],
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickLoginIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  quickLoginInfo: {
    flex: 1,
  },
  quickLoginName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  quickLoginEmail: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  form: {
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  authErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error + '10',
    padding: spacing[3],
    borderRadius: borderRadius.base,
    marginBottom: spacing[4],
    gap: spacing[2],
  },
  authErrorText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.error,
  },
  signInButton: {
    marginBottom: spacing[4],
  },
  ssoHint: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
