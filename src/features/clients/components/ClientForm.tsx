import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Input, Button } from '@/components/ui';
import { colors, spacing, typography } from '@/components/ui';
import type { Client, ClientFormData } from '../types';

/**
 * Props for ClientForm component
 */
interface ClientFormProps {
  client?: Client;
  // eslint-disable-next-line no-unused-vars
  onSubmit: (data: ClientFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

/**
 * ClientForm Component
 *
 * Form for creating or editing clients with:
 * - Required fields: name, phone, address, city, state, zipCode
 * - Optional fields: secondaryPhone, email, homePurchaseDate, warrantyInfo, serviceNotes
 * - Validation
 * - Loading states
 */
export function ClientForm({ client, onSubmit, onCancel, isLoading = false }: ClientFormProps) {
  const [formData, setFormData] = useState<ClientFormData>({
    name: client?.name || '',
    phone: client?.phone || '',
    address: client?.address || '',
    city: client?.city || '',
    state: client?.state || '',
    zipCode: client?.zipCode || '',
    secondaryPhone: client?.secondaryPhone || '',
    email: client?.email || '',
    homePurchaseDate: client?.homePurchaseDate,
    warrantyInfo: client?.warrantyInfo || '',
    serviceNotes: client?.serviceNotes || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = () => {
    // Validate required fields
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone is required';
    }
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }
    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }
    if (!formData.zipCode.trim()) {
      newErrors.zipCode = 'ZIP code is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(formData);
  };

  const updateField = <K extends keyof ClientFormData>(field: K, value: ClientFormData[K]) => {
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
        <Text style={styles.title}>{client ? 'Edit Client' : 'Add Client'}</Text>

        <Text style={styles.sectionTitle}>Required Information</Text>

        <Input
          label="Client Name"
          placeholder="e.g., John Smith"
          value={formData.name}
          onChangeText={(value) => updateField('name', value)}
          error={errors.name}
          required
        />

        <Input
          label="Phone"
          placeholder="e.g., (555) 123-4567"
          value={formData.phone}
          onChangeText={(value) => updateField('phone', value)}
          error={errors.phone}
          keyboardType="phone-pad"
          required
        />

        <Input
          label="Address"
          placeholder="e.g., 123 Main St"
          value={formData.address}
          onChangeText={(value) => updateField('address', value)}
          error={errors.address}
          required
        />

        <Input
          label="City"
          placeholder="e.g., Springfield"
          value={formData.city}
          onChangeText={(value) => updateField('city', value)}
          error={errors.city}
          required
        />

        <Input
          label="State"
          placeholder="e.g., IL"
          value={formData.state}
          onChangeText={(value) => updateField('state', value)}
          error={errors.state}
          required
        />

        <Input
          label="ZIP Code"
          placeholder="e.g., 62701"
          value={formData.zipCode}
          onChangeText={(value) => updateField('zipCode', value)}
          error={errors.zipCode}
          keyboardType="number-pad"
          required
        />

        <Text style={styles.sectionTitle}>Optional Information</Text>

        <Input
          label="Secondary Phone"
          placeholder="e.g., (555) 987-6543"
          value={formData.secondaryPhone}
          onChangeText={(value) => updateField('secondaryPhone', value)}
          keyboardType="phone-pad"
        />

        <Input
          label="Email"
          placeholder="e.g., john@example.com"
          value={formData.email}
          onChangeText={(value) => updateField('email', value)}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Input
          label="Warranty Information"
          placeholder="Equipment warranties, expiration dates..."
          value={formData.warrantyInfo}
          onChangeText={(value) => updateField('warrantyInfo', value)}
          multiline
          // eslint-disable-next-line react-native/no-inline-styles
          style={{ minHeight: 80 }}
        />

        <Input
          label="Service Notes"
          placeholder="Service history, preferences, special instructions..."
          value={formData.serviceNotes}
          onChangeText={(value) => updateField('serviceNotes', value)}
          multiline
          // eslint-disable-next-line react-native/no-inline-styles
          style={{ minHeight: 100 }}
        />

        <View style={styles.actions}>
          <Button variant="secondary" onPress={onCancel} disabled={isLoading} style={styles.button}>
            Cancel
          </Button>
          <Button onPress={handleSubmit} loading={isLoading} style={styles.button}>
            {client ? 'Update Client' : 'Add Client'}
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}

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
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginTop: spacing[4],
    marginBottom: spacing[3],
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
