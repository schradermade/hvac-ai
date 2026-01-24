import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useEquipmentList } from '@/features/equipment';
import { colors, spacing, typography } from '@/components/ui';
import type { Equipment } from '@/features/equipment';

/**
 * Props for EquipmentSelector component
 */
interface EquipmentSelectorProps {
  selectedEquipmentId?: string;
  onEquipmentChange: (equipment?: Equipment) => void;
}

/**
 * EquipmentSelector Component
 *
 * Dropdown to select equipment for diagnostic context.
 * Shows all saved equipment and allows selecting one to provide context to the AI.
 */
export function EquipmentSelector({
  selectedEquipmentId,
  onEquipmentChange,
}: EquipmentSelectorProps) {
  const { data, isLoading } = useEquipmentList();

  const equipment = data?.items || [];

  const handleChange = (itemValue: string) => {
    if (itemValue === 'none') {
      onEquipmentChange(undefined);
    } else {
      const selected = equipment.find((eq) => eq.id === itemValue);
      onEquipmentChange(selected);
    }
  };

  if (isLoading) {
    return null;
  }

  if (equipment.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Equipment Context (Optional)</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedEquipmentId || 'none'}
          onValueChange={handleChange}
          style={styles.picker}
        >
          <Picker.Item label="No equipment selected" value="none" />
          {equipment.map((eq) => {
            const label = eq.manufacturer ? `${eq.name} - ${eq.manufacturer}` : eq.name;
            return <Picker.Item key={eq.id} label={label} value={eq.id} />;
          })}
        </Picker>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing[3],
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing[2],
  },
  pickerContainer: {
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  picker: {
    height: 50,
  },
});
