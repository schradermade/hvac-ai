import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Input, Button } from '@/components/ui';
import { colors, spacing, typography, borderRadius } from '@/components/ui';
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

const JOB_TYPES: Array<{ label: string; value: JobType }> = [
  { label: 'Maintenance', value: 'maintenance' },
  { label: 'Repair', value: 'repair' },
  { label: 'Installation', value: 'installation' },
  { label: 'Inspection', value: 'inspection' },
  { label: 'Emergency', value: 'emergency' },
];

/**
 * JobForm Component
 *
 * Simplified form for creating jobs
 * TODO: Add equipment selector, better date/time pickers
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

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.form}>
        <Text style={styles.title}>{job ? 'Edit Job' : 'Create Job'}</Text>

        <View style={styles.field}>
          <Text style={styles.label}>
            Client <Text style={styles.required}>*</Text>
          </Text>
          {clientsLoading ? (
            <Text style={styles.loadingText}>Loading clients...</Text>
          ) : (
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.clientId}
                onValueChange={(value: string) => updateField('clientId', value)}
                style={styles.pickerIOS}
                itemStyle={styles.pickerItemIOS}
              >
                <Picker.Item label="Select a client..." value="" />
                {clients.map((client) => (
                  <Picker.Item key={client.id} label={client.name} value={client.id} />
                ))}
              </Picker>
            </View>
          )}
          {!clientsLoading && clients.length === 0 && (
            <Text style={styles.warningText}>No clients found. Create a client first.</Text>
          )}
          {errors.clientId && <Text style={styles.errorText}>{errors.clientId}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>
            Job Type <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.type}
              onValueChange={(value) => updateField('type', value as JobType)}
              style={styles.pickerIOS}
              itemStyle={styles.pickerItemIOS}
            >
              {JOB_TYPES.map((type) => (
                <Picker.Item key={type.value} label={type.label} value={type.value} />
              ))}
            </Picker>
          </View>
        </View>

        <Input
          label="Description"
          placeholder="e.g., Annual maintenance check"
          value={formData.description}
          onChangeText={(value) => updateField('description', value)}
          error={errors.description}
          required
        />

        <Input
          label="Notes"
          placeholder="Additional details..."
          value={formData.notes}
          onChangeText={(value) => updateField('notes', value)}
          multiline
          // eslint-disable-next-line react-native/no-inline-styles
          style={{ minHeight: 80 }}
        />

        <Text style={styles.helperText}>
          Note: Job will be scheduled for 2 hours from now by default. Full date/time selection
          coming soon.
        </Text>

        <View style={styles.actions}>
          <Button variant="secondary" onPress={onCancel} disabled={isLoading} style={styles.button}>
            Cancel
          </Button>
          <Button onPress={handleSubmit} loading={isLoading} style={styles.button}>
            {job ? 'Update Job' : 'Create Job'}
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  form: {
    padding: spacing[4],
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing[6],
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
  pickerContainer: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  pickerIOS: {
    height: 216,
  },
  pickerItemIOS: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
  },
  loadingText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    padding: spacing[3],
    fontStyle: 'italic',
  },
  warningText: {
    fontSize: typography.fontSize.sm,
    color: colors.warning,
    marginTop: spacing[2],
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    color: colors.error,
    marginTop: spacing[2],
  },
  helperText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing[2],
    marginBottom: spacing[4],
  },
  actions: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[6],
    marginBottom: spacing[8],
  },
  button: {
    flex: 1,
  },
});
