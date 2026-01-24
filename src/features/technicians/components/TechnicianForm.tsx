/**
 * Technician Form Component
 *
 * Professional form for creating/editing technicians
 */

import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Button, Card } from '@/components/ui';
import { colors, spacing, typography, borderRadius } from '@/components/ui';
import type { TechnicianFormData, TechnicianRole, TechnicianStatus } from '../types';

interface TechnicianFormProps {
  initialData?: Partial<TechnicianFormData>;
  onSubmit: (data: TechnicianFormData) => void | Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

/**
 * Technician Form
 */
export function TechnicianForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: TechnicianFormProps) {
  const [formData, setFormData] = useState<TechnicianFormData>({
    email: initialData?.email || '',
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    phone: initialData?.phone || '',
    role: initialData?.role || 'technician',
    status: initialData?.status || 'active',
    certifications: initialData?.certifications || [],
    licenseNumber: initialData?.licenseNumber || '',
    licenseExpiry: initialData?.licenseExpiry,
    hireDate: initialData?.hireDate,
    notes: initialData?.notes || '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof TechnicianFormData, string>>>({});

  const handleSubmit = async () => {
    // Validate
    const newErrors: Partial<Record<keyof TechnicianFormData, string>> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone is required';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    await onSubmit(formData);
  };

  const roleOptions: { value: TechnicianRole; label: string }[] = [
    { value: 'technician', label: 'Technician' },
    { value: 'lead_tech', label: 'Lead Technician' },
    { value: 'admin', label: 'Admin' },
    { value: 'office_staff', label: 'Office Staff' },
  ];

  const statusOptions: { value: TechnicianStatus; label: string }[] = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'on_leave', label: 'On Leave' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Basic Information Section */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          {/* First Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              First Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.firstName && styles.inputError]}
              value={formData.firstName}
              onChangeText={(text) => setFormData({ ...formData, firstName: text })}
              placeholder="Enter first name"
              placeholderTextColor={colors.textMuted}
              editable={!isLoading}
            />
            {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
          </View>

          {/* Last Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Last Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.lastName && styles.inputError]}
              value={formData.lastName}
              onChangeText={(text) => setFormData({ ...formData, lastName: text })}
              placeholder="Enter last name"
              placeholderTextColor={colors.textMuted}
              editable={!isLoading}
            />
            {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Email <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              placeholder="technician@company.com"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          {/* Phone */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Phone <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.phone && styles.inputError]}
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              placeholder="(555) 123-4567"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              editable={!isLoading}
            />
            {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
          </View>
        </Card>

        {/* Role & Status Section */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Role & Status</Text>

          {/* Role */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Role</Text>
            <View style={styles.roleButtons}>
              {roleOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.roleButton,
                    formData.role === option.value && styles.roleButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, role: option.value })}
                  disabled={isLoading}
                >
                  <Text
                    style={[
                      styles.roleButtonText,
                      formData.role === option.value && styles.roleButtonTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Status */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Status</Text>
            <View style={styles.roleButtons}>
              {statusOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.roleButton,
                    formData.status === option.value && styles.roleButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, status: option.value })}
                  disabled={isLoading}
                >
                  <Text
                    style={[
                      styles.roleButtonText,
                      formData.status === option.value && styles.roleButtonTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Card>

        {/* Optional Information Section */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Optional Information</Text>

          {/* License Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>License Number</Text>
            <TextInput
              style={styles.input}
              value={formData.licenseNumber}
              onChangeText={(text) => setFormData({ ...formData, licenseNumber: text })}
              placeholder="License number (optional)"
              placeholderTextColor={colors.textMuted}
              editable={!isLoading}
            />
          </View>

          {/* Notes */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              placeholder="Additional notes (optional)"
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!isLoading}
            />
          </View>
        </Card>

        {/* Bottom Spacer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Button onPress={onCancel} variant="ghost" disabled={isLoading} style={styles.cancelButton}>
          Cancel
        </Button>
        <Button
          onPress={handleSubmit}
          variant="primary"
          disabled={isLoading}
          loading={isLoading}
          style={styles.submitButton}
        >
          {initialData ? 'Save Changes' : 'Add Technician'}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
  },
  section: {
    marginBottom: spacing[4],
    padding: spacing[4],
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing[4],
  },
  inputGroup: {
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
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.base,
    paddingHorizontal: spacing[3],
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  inputError: {
    borderColor: colors.error,
  },
  textArea: {
    height: 100,
    paddingTop: spacing[3],
    paddingBottom: spacing[3],
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    color: colors.error,
    marginTop: spacing[1],
  },
  roleButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  roleButton: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.base,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  roleButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  roleButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
  },
  roleButtonTextActive: {
    color: colors.surface,
  },
  bottomSpacer: {
    height: spacing[8],
  },
  actionButtons: {
    flexDirection: 'row',
    padding: spacing[4],
    gap: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 2,
  },
});
