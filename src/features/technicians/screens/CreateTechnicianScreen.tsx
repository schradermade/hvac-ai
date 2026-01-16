/**
 * Create Technician Screen
 *
 * Modal screen for adding new technicians to the company
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TechnicianForm } from '../components/TechnicianForm';
import { useCreateTechnician } from '../hooks/useTechnicians';
import { colors } from '@/components/ui';
import type { RootStackParamList } from '@/navigation/types';
import type { TechnicianFormData } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateTechnician'>;

/**
 * CreateTechnicianScreen
 *
 * Professional form for adding new technicians to the team.
 *
 * Features:
 * - Role selection (technician, lead_tech, admin, office_staff)
 * - Status selection (active, inactive, on_leave)
 * - Professional form validation
 * - Loading states during creation
 * - Auto-navigation back on success
 */
export function CreateTechnicianScreen({ navigation }: Props) {
  const createMutation = useCreateTechnician();

  const handleSubmit = async (formData: TechnicianFormData) => {
    try {
      await createMutation.mutateAsync(formData);
      // Navigate back to technician list on success
      navigation.goBack();
    } catch (error) {
      // Error handling is managed by the mutation
      console.error('Failed to create technician:', error);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        <TechnicianForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={createMutation.isPending}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
});
