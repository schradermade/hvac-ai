import React from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Card, Badge } from '@/components/ui';
import { colors, spacing, typography, borderRadius } from '@/components/ui';
import { useAuth } from '@/providers';
import type { TabScreenProps, RootStackParamList } from '@/navigation/types';
import Constants from 'expo-constants';

/**
 * SettingsScreen
 *
 * Professional settings screen following FAANG-level design standards:
 * - Hero section with app branding
 * - Sectioned layout with icon headers
 * - Tappable cards with icon containers and chevrons
 * - App information and support options
 */
// eslint-disable-next-line no-unused-vars
export function SettingsScreen(_props: TabScreenProps<'Settings'>) {
  const { user, logout } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const appVersion = Constants.expoConfig?.version || '1.0.0';
  const buildNumber = Constants.expoConfig?.extra?.buildNumber || '1';

  const getRoleDisplay = (role?: string): string => {
    const roleMap: Record<string, string> = {
      admin: 'Admin',
      lead_tech: 'Lead Technician',
      technician: 'Technician',
      office_staff: 'Office Staff',
    };
    return role ? roleMap[role] || role : 'User';
  };

  const getRoleVariant = (role?: string): 'info' | 'success' | 'neutral' => {
    switch (role) {
      case 'admin':
        return 'info';
      case 'lead_tech':
        return 'success';
      default:
        return 'neutral';
    }
  };

  const handleSupport = () => {
    Alert.alert('Support', 'Contact support at support@hvacai.app or visit our help center.', [
      { text: 'OK' },
    ]);
  };

  const handlePrivacy = () => {
    Alert.alert('Privacy Policy', 'Privacy policy coming soon.', [{ text: 'OK' }]);
  };

  const handleTerms = () => {
    Alert.alert('Terms of Service', 'Terms of service coming soon.', [{ text: 'OK' }]);
  };

  const handleAbout = () => {
    Alert.alert(
      'About HVACOps',
      'HVACOps is a professional diagnostic assistant for HVAC technicians, providing on-demand technical support and calculations in the field.',
      [{ text: 'OK' }]
    );
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
          } catch (error) {
            console.error('Logout error:', error);
            Alert.alert('Error', 'Failed to sign out. Please try again.');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroContent}>
            <View style={styles.appNameRow}>
              <Ionicons name="snow" size={28} color={colors.primary} />
              <Text style={styles.appName}>HVACOps</Text>
            </View>
            <Text style={styles.appTagline}>Professional Diagnostic Assistant</Text>
          </View>
        </View>

        {/* My Profile Section */}
        {user && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person-outline" size={24} color={colors.primary} />
              <Text style={styles.sectionTitle}>My Profile</Text>
            </View>

            <Card style={styles.card}>
              <TouchableOpacity
                style={styles.profileItem}
                onPress={() => navigation.navigate('MyProfile')}
                activeOpacity={0.7}
              >
                <View style={styles.profileIconContainer}>
                  <Ionicons name="person" size={24} color={colors.primary} />
                </View>
                <View style={styles.profileContent}>
                  <Text style={styles.profileName}>
                    {user.firstName} {user.lastName}
                  </Text>
                  <View style={styles.profileMeta}>
                    <Badge variant={getRoleVariant(user.role)}>{getRoleDisplay(user.role)}</Badge>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </Card>
          </View>
        )}

        {/* Preferences Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="options-outline" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Preferences</Text>
          </View>

          <Card style={styles.card}>
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => Alert.alert('Coming Soon', 'Unit preferences will be available soon.')}
              activeOpacity={0.7}
            >
              <View style={styles.settingIconContainer}>
                <Ionicons name="thermometer-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Units</Text>
                <Text style={styles.settingSubtitle}>Imperial (°F, PSI)</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() =>
                Alert.alert(
                  'Coming Soon',
                  'Default refrigerant preferences will be available soon.'
                )
              }
              activeOpacity={0.7}
            >
              <View style={styles.settingIconContainer}>
                <Ionicons name="flask-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Default Refrigerant</Text>
                <Text style={styles.settingSubtitle}>R-410A</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </Card>
        </View>

        {/* App Information Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle-outline" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>App Information</Text>
          </View>

          <Card style={styles.card}>
            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="code-slash-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>VERSION</Text>
                <Text style={styles.infoValue}>{appVersion}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="hammer-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>BUILD</Text>
                <Text style={styles.infoValue}>{buildNumber}</Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Support & Help Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="help-circle-outline" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Support & Help</Text>
          </View>

          <Card style={styles.card}>
            <TouchableOpacity
              style={styles.settingItem}
              onPress={handleSupport}
              activeOpacity={0.7}
            >
              <View style={styles.settingIconContainer}>
                <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Contact Support</Text>
                <Text style={styles.settingSubtitle}>Get help from our team</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.settingItem} onPress={handleAbout} activeOpacity={0.7}>
              <View style={styles.settingIconContainer}>
                <Ionicons name="information-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>About</Text>
                <Text style={styles.settingSubtitle}>Learn more about HVACOps</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </Card>
        </View>

        {/* Legal Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text-outline" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Legal</Text>
          </View>

          <Card style={styles.card}>
            <TouchableOpacity
              style={styles.settingItem}
              onPress={handlePrivacy}
              activeOpacity={0.7}
            >
              <View style={styles.settingIconContainer}>
                <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Privacy Policy</Text>
                <Text style={styles.settingSubtitle}>How we handle your data</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.settingItem} onPress={handleTerms} activeOpacity={0.7}>
              <View style={styles.settingIconContainer}>
                <Ionicons name="document-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Terms of Service</Text>
                <Text style={styles.settingSubtitle}>Agreement and policies</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </Card>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="log-out-outline" size={24} color={colors.error} />
            <Text style={styles.sectionTitle}>Account</Text>
          </View>

          <Card style={styles.card}>
            <TouchableOpacity style={styles.settingItem} onPress={handleLogout} activeOpacity={0.7}>
              <View style={[styles.settingIconContainer, styles.logoutIconContainer]}>
                <Ionicons name="log-out-outline" size={20} color={colors.error} />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, styles.logoutText]}>Sign Out</Text>
                <Text style={styles.settingSubtitle}>Sign out of your account</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </Card>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Made with precision for HVAC professionals</Text>
          <Text style={styles.footerCopyright}>© 2024 HVACOps. All rights reserved.</Text>
        </View>

        {/* Bottom spacer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryLight,
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[8],
    paddingBottom: spacing[4],
  },
  heroContent: {
    flex: 1,
  },
  appNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[1],
  },
  appName: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  appTagline: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  section: {
    marginBottom: spacing[6],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    marginBottom: spacing[3],
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    marginHorizontal: spacing[4],
    padding: 0,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    minHeight: 72,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.base,
    backgroundColor: colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing[1],
  },
  settingSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.base,
    backgroundColor: colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing[1],
  },
  infoValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing[4],
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[6],
  },
  footerText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  footerCopyright: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
  },
  bottomSpacer: {
    height: spacing[8],
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    minHeight: 80,
  },
  profileIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileContent: {
    flex: 1,
  },
  profileName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing[2],
  },
  profileMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutIconContainer: {
    backgroundColor: colors.error + '10',
  },
  logoutText: {
    color: colors.error,
  },
});
