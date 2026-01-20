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

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '@/components/ui';
import { colors, spacing, typography, borderRadius } from '@/components/ui';
import { useAuth } from '@/providers';
import { useSavedAccounts } from '../hooks/useSavedAccounts';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const BRAND_SIZE = 32;

export function LoginScreen({ navigation }: Props) {
  const { login, loginWithSavedAccount, isLoading, error, clearError } = useAuth();
  const { accounts, isLoading: accountsLoading } = useSavedAccounts();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<{ email?: string; password?: string }>({});

  const validateForm = (): boolean => {
    const errors: { email?: string; password?: string } = {};

    if (!email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email';
    }

    if (!password) {
      errors.password = 'Password is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    clearError();

    try {
      await login({ email: email.trim().toLowerCase(), password });
      // Navigation happens automatically via AuthProvider state change
    } catch (err) {
      // Error is set in auth context
      console.error('Login failed:', err);
    }
  };

  const quickAccounts = accounts.filter((item) => item.hasSession && !item.isExpired);

  const handleQuickLogin = async (accountId: string) => {
    clearError();

    try {
      await loginWithSavedAccount(accountId);
    } catch (err) {
      console.error('Quick login failed:', err);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
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
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, formErrors.email && styles.inputError]}
                placeholder="your@email.com"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setFormErrors((prev) => ({ ...prev, email: undefined }));
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                editable={!isLoading}
              />
              {formErrors.email && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={16} color={colors.error} />
                  <Text style={styles.errorText}>{formErrors.email}</Text>
                </View>
              )}
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[
                    styles.input,
                    styles.passwordInput,
                    formErrors.password && styles.inputError,
                  ]}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.textMuted}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setFormErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="password"
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.showPasswordButton}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={24}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              {formErrors.password && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={16} color={colors.error} />
                  <Text style={styles.errorText}>{formErrors.password}</Text>
                </View>
              )}
            </View>

            {/* Forgot Password Link */}
            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={() => navigation.navigate('PasswordReset')}
              disabled={isLoading}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Auth Error */}
            {error && (
              <View style={styles.authErrorContainer}>
                <Ionicons name="alert-circle" size={20} color={colors.error} />
                <Text style={styles.authErrorText}>{error.message}</Text>
              </View>
            )}

            {/* Sign In Button */}
            <Button onPress={handleLogin} loading={isLoading} style={styles.signInButton}>
              Sign In
            </Button>

            {/* Sign Up Link */}
            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Don't have an account?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Signup')} disabled={isLoading}>
                <Text style={styles.signupLink}> Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
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
  inputContainer: {
    marginBottom: spacing[4],
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
    marginBottom: spacing[2],
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.base,
    paddingHorizontal: spacing[4],
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: colors.error,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 48,
  },
  showPasswordButton: {
    position: 'absolute',
    right: spacing[3],
    top: 12,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[2],
    gap: spacing[1],
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    color: colors.error,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: spacing[6],
  },
  forgotPasswordText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
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
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  signupLink: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
});
