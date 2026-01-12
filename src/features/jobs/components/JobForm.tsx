import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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
              <TouchableOpacity style={styles.selectButton} onPress={() => setShowTypePicker(true)}>
                <View style={styles.selectButtonContent}>
                  <Text style={styles.selectButtonIcon}>{selectedType?.icon}</Text>
                  <Text style={styles.selectButtonText}>{selectedType?.label}</Text>
                </View>
                <Text style={styles.selectButtonIcon}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Schedule Display */}
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
                Default: 2 hours from now. Full date/time editing coming soon.
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

          {/* Bottom padding for fixed action bar */}
          <View style={styles.bottomPadding} />
        </View>
      </ScrollView>

      {/* Fixed Action Bar */}
      <View style={styles.actionBar}>
        <Button variant="secondary" onPress={onCancel} disabled={isLoading} style={styles.button}>
          Cancel
        </Button>
        <Button onPress={handleSubmit} loading={isLoading} style={styles.buttonPrimary}>
          {job ? 'Update Job' : 'Create Job'}
        </Button>
      </View>

      {/* Client Picker Modal */}
      <Modal
        visible={showClientPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowClientPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Client</Text>
              <TouchableOpacity onPress={() => setShowClientPicker(false)}>
                <Text style={styles.modalClose}>Done</Text>
              </TouchableOpacity>
            </View>
            <Picker
              selectedValue={formData.clientId}
              onValueChange={(value: string) => {
                updateField('clientId', value);
                setShowClientPicker(false);
              }}
              style={styles.picker}
            >
              <Picker.Item label="Select a client..." value="" />
              {clients.map((client) => (
                <Picker.Item key={client.id} label={client.name} value={client.id} />
              ))}
            </Picker>
          </View>
        </View>
      </Modal>

      {/* Job Type Picker Modal */}
      <Modal
        visible={showTypePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTypePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Job Type</Text>
              <TouchableOpacity onPress={() => setShowTypePicker(false)}>
                <Text style={styles.modalClose}>Done</Text>
              </TouchableOpacity>
            </View>
            <Picker
              selectedValue={formData.type}
              onValueChange={(value) => {
                updateField('type', value as JobType);
                setShowTypePicker(false);
              }}
              style={styles.picker}
            >
              {JOB_TYPES.map((type) => (
                <Picker.Item
                  key={type.value}
                  label={`${type.icon} ${type.label}`}
                  value={type.value}
                />
              ))}
            </Picker>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
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
  bottomPadding: {
    height: 100,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingBottom: spacing[8],
    maxHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
  picker: {
    width: '100%',
  },
});
