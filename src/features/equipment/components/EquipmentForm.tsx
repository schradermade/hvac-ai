import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Input, Button } from '@/components/ui';
import { colors, spacing, typography, borderRadius } from '@/components/ui';
import { useClientList } from '@/features/clients';
import type { Equipment, EquipmentFormData, SystemType } from '../types';

/**
 * Props for EquipmentForm component
 */
interface EquipmentFormProps {
  equipment?: Equipment;
  // eslint-disable-next-line no-unused-vars
  onSubmit: (data: EquipmentFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

/**
 * EquipmentForm Component
 *
 * Form for creating or editing equipment with:
 * - All equipment fields
 * - Validation
 * - Loading states
 * - Cancel option
 */
export function EquipmentForm({
  equipment,
  onSubmit,
  onCancel,
  isLoading = false,
}: EquipmentFormProps) {
  const { data: clientsData } = useClientList();
  const clients = clientsData?.items || [];

  const [formData, setFormData] = useState<EquipmentFormData>({
    clientId: equipment?.clientId || '',
    name: equipment?.name || '',
    manufacturer: equipment?.manufacturer || '',
    modelNumber: equipment?.modelNumber || '',
    serialNumber: equipment?.serialNumber || '',
    systemType: equipment?.systemType || 'split_system',
    refrigerant: equipment?.refrigerant || 'R-410A',
    tonnage: equipment?.tonnage,
    location: equipment?.location || '',
    notes: equipment?.notes || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = () => {
    // Validate
    const newErrors: Record<string, string> = {};

    if (!formData.clientId) {
      newErrors.clientId = 'Client is required';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(formData);
  };

  const updateField = <K extends keyof EquipmentFormData>(
    field: K,
    value: EquipmentFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when field is updated
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
        <Text style={styles.title}>{equipment ? 'Edit Equipment' : 'Add Equipment'}</Text>

        <View style={styles.field}>
          <Text style={styles.label}>
            Client <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.clientId}
              onValueChange={(value: string) => updateField('clientId', value)}
              style={styles.picker}
            >
              <Picker.Item label="Select a client..." value="" />
              {clients.map((client) => (
                <Picker.Item key={client.id} label={client.name} value={client.id} />
              ))}
            </Picker>
          </View>
          {errors.clientId && <Text style={styles.errorText}>{errors.clientId}</Text>}
        </View>

        <Input
          label="Equipment Name"
          placeholder="e.g., Main Floor AC"
          value={formData.name}
          onChangeText={(value) => updateField('name', value)}
          error={errors.name}
          required
        />

        <Input
          label="Manufacturer"
          placeholder="e.g., Carrier, Trane, Lennox"
          value={formData.manufacturer}
          onChangeText={(value) => updateField('manufacturer', value)}
        />

        <Input
          label="Model Number"
          placeholder="e.g., 24ACC6"
          value={formData.modelNumber}
          onChangeText={(value) => updateField('modelNumber', value)}
        />

        <Input
          label="Serial Number"
          placeholder="e.g., 1234567890"
          value={formData.serialNumber}
          onChangeText={(value) => updateField('serialNumber', value)}
        />

        <View style={styles.field}>
          <Text style={styles.label}>System Type</Text>
          <View style={styles.systemTypeGrid}>
            {SYSTEM_TYPES.map((type) => (
              <SystemTypeButton
                key={type.value}
                label={type.label}
                selected={formData.systemType === type.value}
                onPress={() => updateField('systemType', type.value)}
              />
            ))}
          </View>
        </View>

        <Input
          label="Refrigerant"
          placeholder="e.g., R-410A, R-22"
          value={formData.refrigerant}
          onChangeText={(value) => updateField('refrigerant', value)}
        />

        <Input
          label="Tonnage"
          placeholder="e.g., 3"
          value={formData.tonnage?.toString() || ''}
          onChangeText={(value) => {
            const parsed = parseFloat(value);
            updateField('tonnage', !isNaN(parsed) ? parsed : undefined);
          }}
          keyboardType="decimal-pad"
        />

        <Input
          label="Location"
          placeholder="e.g., Rooftop, Basement"
          value={formData.location}
          onChangeText={(value) => updateField('location', value)}
        />

        <Input
          label="Notes"
          placeholder="Additional information..."
          value={formData.notes}
          onChangeText={(value) => updateField('notes', value)}
          multiline
          // eslint-disable-next-line react-native/no-inline-styles
          style={{ minHeight: 100 }}
        />

        <View style={styles.actions}>
          <Button variant="secondary" onPress={onCancel} disabled={isLoading} style={styles.button}>
            Cancel
          </Button>
          <Button onPress={handleSubmit} loading={isLoading} style={styles.button}>
            {equipment ? 'Update Equipment' : 'Add Equipment'}
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}

/**
 * System type button for selection
 */
function SystemTypeButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Button
      variant={selected ? 'primary' : 'secondary'}
      size="sm"
      onPress={onPress}
      style={styles.systemTypeButton}
    >
      {label}
    </Button>
  );
}

const SYSTEM_TYPES: Array<{ label: string; value: SystemType }> = [
  { label: 'Split System', value: 'split_system' },
  { label: 'Package Unit', value: 'package_unit' },
  { label: 'Heat Pump', value: 'heat_pump' },
  { label: 'Mini Split', value: 'mini_split' },
  { label: 'Other', value: 'other' },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    minHeight: 48,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  picker: {
    height: 48,
  },
  errorText: {
    fontSize: typography.fontSize.xs,
    color: colors.error,
    marginTop: spacing[1],
  },
  systemTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  systemTypeButton: {
    minWidth: 110,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[6],
  },
  button: {
    flex: 1,
  },
});
