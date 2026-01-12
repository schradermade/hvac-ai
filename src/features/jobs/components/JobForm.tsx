import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input, Button } from '@/components/ui';
import { colors, spacing, typography, borderRadius, shadows } from '@/components/ui';
import { useClientList } from '@/features/clients';
import type { Job, JobFormData, JobType } from '../types';

/**
 * Props for JobForm component
 */
interface JobFormProps {
  job?: Job;
  // eslint-disable-next-line no-unused-vars
  onSubmit: (data: JobFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const JOB_TYPES: Array<{ label: string; value: JobType; icon: string }> = [
  { label: 'Maintenance', value: 'maintenance', icon: '🔧' },
  { label: 'Repair', value: 'repair', icon: '🛠️' },
  { label: 'Installation', value: 'installation', icon: '📦' },
  { label: 'Inspection', value: 'inspection', icon: '🔍' },
  { label: 'Emergency', value: 'emergency', icon: '🚨' },
];

/**
 * JobForm Component
 *
 * Premium form for creating/editing jobs with modal pickers and clean UX
 */
export function JobForm({ job, onSubmit, onCancel, isLoading = false }: JobFormProps) {
  const { data: clientsData, isLoading: clientsLoading } = useClientList();
  const clients = clientsData?.items || [];

  // Default to 2 hours from now
  const now = new Date();
  const defaultStart = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const defaultEnd = new Date(defaultStart.getTime() + 2 * 60 * 60 * 1000);

  const [formData, setFormData] = useState<JobFormData>({
    clientId: job?.clientId || '',
    type: job?.type || 'maintenance',
    scheduledStart: job?.scheduledStart || defaultStart,
    scheduledEnd: job?.scheduledEnd || defaultEnd,
    description: job?.description || '',
    notes: job?.notes || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState('');

  // Filter clients based on search query
  const filteredClients = useMemo(() => {
    if (!clientSearchQuery.trim()) {
      return clients;
    }

    const query = clientSearchQuery.toLowerCase();
    return clients.filter((client) => {
      const name = client.name.toLowerCase();
      const phone = client.phone.toLowerCase();
      const address = client.address.toLowerCase();
      const city = client.city.toLowerCase();

      return (
        name.includes(query) ||
        phone.includes(query) ||
        address.includes(query) ||
        city.includes(query)
      );
    });
  }, [clients, clientSearchQuery]);

  const selectedClient = clients.find((c) => c.id === formData.clientId);
  const selectedType = JOB_TYPES.find((t) => t.value === formData.type);

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.clientId) {
      newErrors.clientId = 'Client is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(formData);
  };

  const updateField = <K extends keyof JobFormData>(field: K, value: JobFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.form}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>{job ? 'Edit Job' : 'Create Job'}</Text>
              <Text style={styles.subtitle}>Schedule a service appointment</Text>
            </View>

            {/* Essential Fields Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Job Details</Text>

              {/* Client Selector */}
              <View style={styles.field}>
                <Text style={styles.label}>
                  Client <Text style={styles.required}>*</Text>
                </Text>
                <TouchableOpacity
                  style={[styles.selectButton, errors.clientId && styles.selectButtonError]}
                  onPress={() => setShowClientPicker(true)}
                  disabled={clientsLoading}
                >
                  <Text
                    style={[
                      styles.selectButtonText,
                      !selectedClient && styles.selectButtonPlaceholder,
                    ]}
                  >
                    {clientsLoading
                      ? 'Loading clients...'
                      : selectedClient
                        ? selectedClient.name
                        : 'Select a client...'}
                  </Text>
                  <Text style={styles.selectButtonIcon}>›</Text>
                </TouchableOpacity>
                {errors.clientId && <Text style={styles.errorText}>{errors.clientId}</Text>}
              </View>

              {/* Job Type Selector */}
              <View style={styles.field}>
                <Text style={styles.label}>
                  Job Type <Text style={styles.required}>*</Text>
                </Text>
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => setShowTypePicker(true)}
                >
                  <View style={styles.selectButtonContent}>
                    <Text style={styles.selectButtonIcon}>{selectedType?.icon}</Text>
                    <Text style={styles.selectButtonText}>{selectedType?.label}</Text>
                  </View>
                  <Text style={styles.selectButtonIcon}>›</Text>
                </TouchableOpacity>
              </View>

              {/* Schedule Display - Read only for now */}
              <View style={styles.field}>
                <Text style={styles.label}>Scheduled Time</Text>
                <View style={styles.scheduleCard}>
                  <View style={styles.scheduleRow}>
                    <Text style={styles.scheduleLabel}>Date</Text>
                    <Text style={styles.scheduleValue}>{formatDate(formData.scheduledStart)}</Text>
                  </View>
                  <View style={styles.scheduleDivider} />
                  <View style={styles.scheduleRow}>
                    <Text style={styles.scheduleLabel}>Time</Text>
                    <Text style={styles.scheduleValue}>
                      {formatTime(formData.scheduledStart)} - {formatTime(formData.scheduledEnd)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.helperText}>
                  📅 Defaults to 2 hours from now • Date/time editing coming soon
                </Text>
              </View>
            </View>

            {/* Description Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Service Description</Text>

              <Input
                label="Description"
                placeholder="e.g., Annual maintenance check"
                value={formData.description}
                onChangeText={(value) => updateField('description', value)}
                error={errors.description}
                required
              />

              <Input
                label="Notes (Optional)"
                placeholder="Additional details..."
                value={formData.notes}
                onChangeText={(value) => updateField('notes', value)}
                multiline
                // eslint-disable-next-line react-native/no-inline-styles
                style={{ minHeight: 80 }}
              />
            </View>
          </View>
        </ScrollView>

        {/* Fixed Action Bar - always visible above keyboard */}
        <View style={styles.actionBar}>
          <Button variant="secondary" onPress={onCancel} disabled={isLoading} style={styles.button}>
            Cancel
          </Button>
          <Button onPress={handleSubmit} loading={isLoading} style={styles.buttonPrimary}>
            {job ? 'Update Job' : 'Create Job'}
          </Button>
        </View>
      </KeyboardAvoidingView>

      {/* Client Picker Modal */}
      <Modal
        visible={showClientPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowClientPicker(false);
          setClientSearchQuery('');
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => {
                setShowClientPicker(false);
                setClientSearchQuery('');
              }}
            >
              <Text style={styles.modalClose}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Client</Text>
            <TouchableOpacity
              onPress={() => {
                setShowClientPicker(false);
                setClientSearchQuery('');
              }}
            >
              <Text style={styles.modalClose}>Done</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name, phone, or address..."
              placeholderTextColor={colors.textMuted}
              value={clientSearchQuery}
              onChangeText={setClientSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <FlatList
            data={filteredClients}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.listItem, formData.clientId === item.id && styles.listItemSelected]}
                onPress={() => {
                  updateField('clientId', item.id);
                  setShowClientPicker(false);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.listItemContent}>
                  <View style={styles.listItemText}>
                    <Text style={styles.listItemTitle}>{item.name}</Text>
                    <Text style={styles.listItemSubtitle}>
                      {item.address}, {item.city}
                    </Text>
                  </View>
                  {formData.clientId === item.id && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.listSeparator} />}
            contentContainerStyle={styles.listContent}
          />
        </SafeAreaView>
      </Modal>

      {/* Job Type Picker Modal */}
      <Modal
        visible={showTypePicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTypePicker(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowTypePicker(false)}>
              <Text style={styles.modalClose}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Job Type</Text>
            <TouchableOpacity onPress={() => setShowTypePicker(false)}>
              <Text style={styles.modalClose}>Done</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={JOB_TYPES}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.listItem, formData.type === item.value && styles.listItemSelected]}
                onPress={() => {
                  updateField('type', item.value);
                  setShowTypePicker(false);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.listItemContent}>
                  <View style={styles.jobTypeContent}>
                    <Text style={styles.jobTypeIcon}>{item.icon}</Text>
                    <Text style={styles.listItemTitle}>{item.label}</Text>
                  </View>
                  {formData.type === item.value && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.listSeparator} />}
            contentContainerStyle={styles.listContent}
          />
        </SafeAreaView>
      </Modal>
    </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing[24], // Extra padding for action bar
  },
  form: {
    padding: spacing[4],
  },
  header: {
    marginBottom: spacing[6],
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing[1],
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: spacing[8],
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing[4],
  },
  field: {
    marginBottom: spacing[4],
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
    marginBottom: spacing[2],
  },
  required: {
    color: colors.error,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
    paddingHorizontal: spacing[4],
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  selectButtonError: {
    borderColor: colors.error,
  },
  selectButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  selectButtonText: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  selectButtonPlaceholder: {
    color: colors.disabled,
  },
  selectButtonIcon: {
    fontSize: typography.fontSize.xl,
    color: colors.textSecondary,
  },
  scheduleCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    ...shadows.sm,
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  scheduleDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing[2],
  },
  scheduleLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  scheduleValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  helperText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing[2],
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    color: colors.error,
    marginTop: spacing[2],
  },
  actionBar: {
    flexDirection: 'row',
    gap: spacing[3],
    padding: spacing[4],
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadows.lg,
  },
  button: {
    flex: 1,
  },
  buttonPrimary: {
    flex: 2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  searchContainer: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    paddingBottom: spacing[2],
    backgroundColor: colors.background,
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.base,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  modalClose: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
  listContent: {
    paddingVertical: spacing[2],
  },
  listItem: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    minHeight: 72,
    justifyContent: 'center',
  },
  listItemSelected: {
    backgroundColor: colors.primary + '10', // 10% opacity
  },
  listItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listItemText: {
    flex: 1,
    marginRight: spacing[3],
  },
  listItemTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing[1],
  },
  listItemSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  listSeparator: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing[4],
  },
  checkmark: {
    fontSize: 24,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  jobTypeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  jobTypeIcon: {
    fontSize: 32,
  },
});
