import React, { useMemo } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Spinner } from '@/components/ui';
import { colors, spacing, typography, borderRadius, shadows } from '@/components/ui';
import { useTodaysJobs } from '@/features/jobs';
import { useClientList } from '@/features/clients';
import type { RootStackParamList, RootTabParamList } from '@/navigation/types';

type NavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<RootTabParamList, 'History'>,
  NativeStackNavigationProp<RootStackParamList>
>;
type IconName = keyof typeof Ionicons.glyphMap;

const PALETTE = {
  background: '#9BA3F5', // Deeper, richer purple - sharp contrast with white cards
  surface: '#FFFFFF', // Pure white - maximum contrast
  accent: '#6B73E8', // Saturated purple - bold and clear
  accentDark: '#4E56D9', // Rich deep purple - strong presence
  border: '#7780DB', // Dark border - clearly defined edges
  text: '#1A2470', // Very dark purple - sharp readability
  textLight: '#3D4791', // Dark muted purple - still readable
  white: '#FFFFFF',
  statusGreen: '#059669', // Slightly darker green - more contrast
  statusAmber: '#d97706', // Darker amber - more visible
} as const;

interface AITool {
  id: string;
  title: string;
  subtitle: string;
  icon: IconName;
  comingSoon?: boolean;
  onPress?: () => void;
}

interface QuickAction {
  id: string;
  label: string;
  prompt: string;
}

const PRIMARY_TOOLS: AITool[] = [
  {
    id: 'visual-diagnosis',
    title: 'Visual Diagnosis',
    subtitle: 'Photo analysis',
    icon: 'camera',
    comingSoon: true,
  },
  {
    id: 'error-code',
    title: 'Error Codes',
    subtitle: 'Decode & fix',
    icon: 'warning',
    comingSoon: true,
  },
  {
    id: 'part-finder',
    title: 'Part Finder',
    subtitle: 'Identify parts',
    icon: 'cube',
    comingSoon: true,
  },
  {
    id: 'manuals',
    title: 'Manuals',
    subtitle: 'Equipment docs',
    icon: 'book',
    comingSoon: true,
  },
  {
    id: 'calculators',
    title: 'Calculators',
    subtitle: 'Charge, airflow, sizing',
    icon: 'calculator',
    comingSoon: true,
  },
  {
    id: 'safety',
    title: 'Safety Check',
    subtitle: 'Pre-start verification',
    icon: 'shield-checkmark',
    comingSoon: true,
  },
];

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: '1',
    label: 'Normal R-410A pressure?',
    prompt: 'What is normal operating pressure for R-410A refrigerant?',
  },
  {
    id: '2',
    label: 'Calculate charge',
    prompt: 'Help me calculate the correct refrigerant charge for this system.',
  },
  {
    id: '3',
    label: 'Airflow per ton',
    prompt: 'What is the standard airflow per ton for residential AC?',
  },
  { id: '4', label: 'Superheat check', prompt: 'How do I measure and adjust superheat?' },
  { id: '5', label: 'Subcooling check', prompt: 'How do I measure and adjust subcooling?' },
];

const SECONDARY_TOOLS: AITool[] = [
  {
    id: 'voice',
    title: 'Voice Assistant',
    subtitle: 'Hands-free mode for gloves',
    icon: 'mic',
    comingSoon: true,
  },
  {
    id: 'troubleshoot',
    title: 'Guided Troubleshooting',
    subtitle: 'Step-by-step diagnostic trees',
    icon: 'git-branch',
    comingSoon: true,
  },
  {
    id: 'training',
    title: 'Training Mode',
    subtitle: 'Learn equipment & certifications',
    icon: 'school',
    comingSoon: true,
  },
  {
    id: 'documentation',
    title: 'Auto Documentation',
    subtitle: 'Generate service reports',
    icon: 'document-text',
    comingSoon: true,
  },
];

const STATUS_PRIORITY = ['in_progress', 'accepted', 'assigned', 'scheduled'];

export function CopilotScreen() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { data: todaysJobsData, isLoading: jobsLoading } = useTodaysJobs();
  const { data: clientsData } = useClientList();

  const clients = useMemo(() => clientsData?.items || [], [clientsData?.items]);
  const todaysJobs = useMemo(() => {
    const items = [...(todaysJobsData?.items || [])];
    items.sort(
      (a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime()
    );
    return items;
  }, [todaysJobsData?.items]);

  const activeJob = useMemo(
    () =>
      todaysJobs.find((job) => job.status === 'in_progress') ||
      STATUS_PRIORITY.map((status) => todaysJobs.find((job) => job.status === status)).find(
        Boolean
      ) ||
      todaysJobs[0],
    [todaysJobs]
  );

  const getClientName = (clientId?: string) =>
    clients.find((client) => client.id === clientId)?.name || 'Unknown Client';

  const formatTime = (date: Date) =>
    date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  const handleToolPress = (tool: AITool) => {
    if (tool.comingSoon) return;
    if (tool.onPress) tool.onPress();
  };

  const handleJobCopilot = (jobId: string) => {
    navigation.navigate('JobCopilot', { jobId });
  };

  const handleQuickAction = (action: QuickAction) => {
    if (!activeJob) {
      navigation.navigate('Jobs');
      return;
    }
    navigation.navigate('JobCopilot', { jobId: activeJob.id, initialPrompt: action.prompt });
  };

  if (jobsLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Spinner message="Initializing AI systems..." />
      </SafeAreaView>
    );
  }

  return (
    <>
      <StatusBar barStyle="dark-content" translucent />
      <View style={styles.container}>
        {/* Status bar spacer - NO background */}
        <View style={{ height: insets.top }} />

        {/* Fixed Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Copilot</Text>
              <Ionicons name="sparkles" size={16} color="#FFFFFF" style={{ marginLeft: 8 }} />
            </View>
            <View style={styles.poweredBy}>
              <Text style={styles.poweredByText}>Powered by</Text>
              <View style={styles.poweredByBrandContainer}>
                <Ionicons name="snow" size={14} color="#FFFFFF" />
                <Text style={styles.poweredByBrand}>HVACOps.ai</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Scrollable Content */}
        <ScrollView
          style={styles.scrollViewBackground}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: spacing[8] + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Active Job Banner */}
          {activeJob && (
            <TouchableOpacity
              style={styles.jobBanner}
              onPress={() => handleJobCopilot(activeJob.id)}
              activeOpacity={0.9}
            >
              <View style={styles.jobBannerContent}>
                <View style={styles.jobBannerIcon}>
                  <Ionicons name="briefcase" size={16} color={PALETTE.white} />
                </View>
                <View style={styles.jobBannerText}>
                  <Text style={styles.jobBannerTitle}>
                    {activeJob.type.toUpperCase()} • {getClientName(activeJob.clientId)}
                  </Text>
                  <Text style={styles.jobBannerSubtitle}>
                    {formatTime(activeJob.scheduledStart)} • Tap for Job Copilot
                  </Text>
                </View>
                <View style={styles.jobBannerLive}>
                  <View style={styles.livePulse} />
                  <Text style={styles.jobBannerLiveText}>ACTIVE</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}

          {/* Primary AI Tools Grid */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>AI Tools</Text>
            </View>
            <View style={styles.toolsGrid}>
              {PRIMARY_TOOLS.map((tool) => (
                <TouchableOpacity
                  key={tool.id}
                  style={[styles.toolCard, tool.comingSoon && styles.toolCardDisabled]}
                  onPress={() => handleToolPress(tool)}
                  activeOpacity={0.85}
                  disabled={tool.comingSoon}
                >
                  <View style={styles.toolIconWrapper}>
                    <View style={styles.toolIconContainer}>
                      <Ionicons
                        name={tool.icon}
                        size={32}
                        color={tool.comingSoon ? colors.textMuted : PALETTE.accent}
                      />
                    </View>
                    {tool.comingSoon && (
                      <View style={styles.toolBadge}>
                        <Text style={styles.toolBadgeText}>Soon</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.toolTitle, tool.comingSoon && styles.toolTitleDisabled]}>
                    {tool.title}
                  </Text>
                  <Text
                    style={[styles.toolSubtitle, tool.comingSoon && styles.toolSubtitleDisabled]}
                  >
                    {tool.subtitle}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <Text style={styles.sectionHint}>Common queries</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickActionsScroll}
            >
              {QUICK_ACTIONS.map((action) => (
                <TouchableOpacity
                  key={action.id}
                  style={[styles.quickActionChip, !activeJob && styles.quickActionDisabled]}
                  onPress={() => handleQuickAction(action)}
                  activeOpacity={0.8}
                  disabled={!activeJob}
                >
                  <Ionicons
                    name="sparkles"
                    size={14}
                    color={activeJob ? PALETTE.accent : colors.textMuted}
                  />
                  <Text
                    style={[styles.quickActionText, !activeJob && styles.quickActionTextDisabled]}
                  >
                    {action.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {!activeJob && (
              <Text style={styles.quickActionHint}>Select a job to use quick actions</Text>
            )}
          </View>

          {/* Secondary Capabilities */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>More Capabilities</Text>
              <Text style={styles.sectionHint}>Coming soon</Text>
            </View>
            <View style={styles.capabilitiesList}>
              {SECONDARY_TOOLS.map((tool) => (
                <TouchableOpacity
                  key={tool.id}
                  style={[styles.capabilityRow, tool.comingSoon && styles.capabilityDisabled]}
                  onPress={() => handleToolPress(tool)}
                  activeOpacity={0.8}
                  disabled={tool.comingSoon}
                >
                  <View style={styles.capabilityIcon}>
                    <Ionicons
                      name={tool.icon}
                      size={24}
                      color={tool.comingSoon ? colors.textMuted : PALETTE.accent}
                    />
                  </View>
                  <View style={styles.capabilityContent}>
                    <Text
                      style={[
                        styles.capabilityTitle,
                        tool.comingSoon && styles.capabilityTitleDisabled,
                      ]}
                    >
                      {tool.title}
                    </Text>
                    <Text
                      style={[
                        styles.capabilitySubtitle,
                        tool.comingSoon && styles.capabilitySubtitleDisabled,
                      ]}
                    >
                      {tool.subtitle}
                    </Text>
                  </View>
                  {tool.comingSoon && (
                    <View style={styles.capabilityBadge}>
                      <Text style={styles.capabilityBadgeText}>Soon</Text>
                    </View>
                  )}
                  {!tool.comingSoon && (
                    <Ionicons name="chevron-forward" size={20} color={PALETTE.accent} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* AI Info Card */}
          <View style={styles.section}>
            <View style={styles.infoCard}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="shield-checkmark" size={28} color={PALETTE.accent} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>HVAC-Trained AI</Text>
                <Text style={styles.infoText}>
                  All features use AI trained on thousands of HVAC scenarios, manufacturer manuals,
                  and diagnostic patterns. Results improve with use.
                </Text>
              </View>
            </View>
          </View>

          {/* Bottom spacer */}
          <View style={{ height: spacing[10] }} />
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollViewBackground: {
    flex: 1,
    backgroundColor: PALETTE.background,
  },
  scrollContent: {
    paddingTop: spacing[5],
  },
  header: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[2],
    paddingBottom: spacing[2],
    backgroundColor: PALETTE.accentDark,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.15)',
    ...shadows.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 40,
    fontWeight: '800',
    color: PALETTE.white,
    letterSpacing: -2,
    textTransform: 'uppercase',
  },
  poweredBy: {
    alignItems: 'flex-end',
    gap: spacing[1],
  },
  poweredByText: {
    fontSize: typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  poweredByBrandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  poweredByBrand: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: PALETTE.white,
  },
  jobBanner: {
    marginHorizontal: spacing[5],
    marginBottom: spacing[5],
    borderRadius: borderRadius.lg,
    backgroundColor: PALETTE.accentDark,
    ...shadows.md,
  },
  jobBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    gap: spacing[3],
  },
  jobBannerIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.base,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  jobBannerText: {
    flex: 1,
  },
  jobBannerTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: PALETTE.white,
    marginBottom: spacing[1],
  },
  jobBannerSubtitle: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  jobBannerLive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  livePulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.error,
  },
  jobBannerLiveText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: PALETTE.white,
    letterSpacing: 0.5,
  },
  section: {
    paddingHorizontal: spacing[5],
    marginBottom: spacing[6],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[4],
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: PALETTE.text,
  },
  sectionHint: {
    fontSize: typography.fontSize.sm,
    color: PALETTE.textLight,
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  toolCard: {
    width: '48%',
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.border,
    alignItems: 'center',
    ...shadows.sm,
  },
  toolCardDisabled: {
    // Keep container bright - only dim content
  },
  toolIconWrapper: {
    position: 'relative',
    marginBottom: spacing[3],
  },
  toolIconContainer: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(107, 115, 232, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    backgroundColor: PALETTE.statusAmber,
    borderWidth: 2,
    borderColor: PALETTE.surface,
  },
  toolBadgeText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: PALETTE.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  toolTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: PALETTE.text,
    textAlign: 'center',
    marginBottom: spacing[1],
  },
  toolTitleDisabled: {
    color: colors.textMuted,
  },
  toolSubtitle: {
    fontSize: typography.fontSize.sm,
    color: PALETTE.textLight,
    textAlign: 'center',
  },
  toolSubtitleDisabled: {
    color: colors.textMuted,
  },
  quickActionsScroll: {
    gap: spacing[2],
    paddingRight: spacing[5],
  },
  quickActionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  quickActionDisabled: {
    // Keep container bright - only dim content
  },
  quickActionText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: PALETTE.text,
  },
  quickActionTextDisabled: {
    color: colors.textMuted,
  },
  quickActionHint: {
    fontSize: typography.fontSize.xs,
    color: PALETTE.textLight,
    marginTop: spacing[2],
    fontStyle: 'italic',
  },
  capabilitiesList: {
    gap: spacing[2],
  },
  capabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    borderRadius: borderRadius.lg,
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  capabilityDisabled: {
    // Keep container bright - only dim content
  },
  capabilityIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.base,
    backgroundColor: 'rgba(107, 115, 232, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  capabilityContent: {
    flex: 1,
  },
  capabilityTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: PALETTE.text,
    marginBottom: spacing[1],
  },
  capabilityTitleDisabled: {
    color: colors.textMuted,
  },
  capabilitySubtitle: {
    fontSize: typography.fontSize.sm,
    color: PALETTE.textLight,
  },
  capabilitySubtitleDisabled: {
    color: colors.textMuted,
  },
  capabilityBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    backgroundColor: PALETTE.statusAmber + '25',
    borderWidth: 1,
    borderColor: PALETTE.statusAmber + '50',
  },
  capabilityBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: PALETTE.statusAmber,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoCard: {
    flexDirection: 'row',
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.border,
    gap: spacing[3],
    alignItems: 'flex-start',
  },
  infoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(107, 115, 232, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: PALETTE.text,
    marginBottom: spacing[2],
  },
  infoText: {
    fontSize: typography.fontSize.sm,
    color: PALETTE.textLight,
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
  },
});
