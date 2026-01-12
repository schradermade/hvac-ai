import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { EquipmentForm } from '../components/EquipmentForm';
import { useCreateEquipment } from '../hooks/useEquipment';
import { colors } from '@/components/ui';
import type { RootStackParamList } from '@/navigation/types';
import type { EquipmentFormData } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateEquipment'>;

/**
 * CreateEquipmentScreen
 *
 * Screen for creating new equipment with pre-filled client context.
 * Accessed from ClientDetailScreen to ensure equipment belongs to a client.
 *
 * Features:
 * - Pre-filled clientId from navigation params
 * - Professional form validation
 * - Loading states during creation
 * - Auto-navigation back on success
 */
export function CreateEquipmentScreen({ route, navigation }: Props) {
  const { clientId } = route.params;
  const createMutation = useCreateEquipment();

  const handleSubmit = async (formData: EquipmentFormData) => {
    try {
      await createMutation.mutateAsync(formData);
      // Navigate back to client detail on success
      navigation.goBack();
    } catch (error) {
      // Error handling is managed by the mutation
      console.error('Failed to create equipment:', error);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        <EquipmentForm
          initialClientId={clientId}
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
