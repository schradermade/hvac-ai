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
import { Ionicons } from '@expo/vector-icons';
import { Input, Button } from '@/components/ui';
import { colors, spacing, typography, borderRadius, shadows } from '@/components/ui';
import { useClientList, useClient } from '@/features/clients';
import type { Equipment, EquipmentFormData, SystemType } from '../types';

/**
 * Props for EquipmentForm component
 */
interface EquipmentFormProps {
  equipment?: Equipment;
  initialClientId?: string; // Pre-fill clientId when creating from client detail
  // eslint-disable-next-line no-unused-vars
  onSubmit: (data: EquipmentFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const SYSTEM_TYPES: Array<{
  label: string;
  value: SystemType;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  { label: 'Split System', value: 'split_system', icon: 'git-network-outline' },
  { label: 'Package Unit', value: 'package_unit', icon: 'cube-outline' },
  { label: 'Heat Pump', value: 'heat_pump', icon: 'flame-outline' },
  { label: 'Mini Split', value: 'mini_split', icon: 'layers-outline' },
  { label: 'Other', value: 'other', icon: 'ellipsis-horizontal-circle-outline' },
];

/**
 * EquipmentForm Component
 *
 * Premium form for creating or editing HVAC equipment with:
 * - Sectioned layout for better organization
 * - Read-only client display when creating from client context
 * - Modal picker for client selection (standalone mode)
 * - Professional system type selection with icons
 * - Fixed action bar above keyboard
 * - Comprehensive validation and error handling
 */
export function EquipmentForm({
  equipment,
  initialClientId,
  onSubmit,
  onCancel,
  isLoading = false,
}: EquipmentFormProps) {
  const { data: clientsData, isLoading: clientsLoading } = useClientList();
  const clients = useMemo(() => clientsData?.items || [], [clientsData?.items]);

  // Load the initial client if provided
  const { data: initialClient } = useClient(initialClientId || '');

  const [formData, setFormData] = useState<EquipmentFormData>({
    clientId: equipment?.clientId || initialClientId || '',
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
  const [showClientPicker, setShowClientPicker] = useState(false);
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

  const selectedClient = clients.find((c) => c.id === formData.clientId) || initialClient;

  const handleSubmit = () => {
    // Validate
    const newErrors: Record<string, string> = {};

    if (!formData.clientId) {
      newErrors.clientId = 'Client is required';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Equipment name is required';
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

  const isClientLocked = !!initialClientId;

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
              <Text style={styles.title}>{equipment ? 'Edit Equipment' : 'Add Equipment'}</Text>
              <Text style={styles.subtitle}>
                {equipment ? 'Update equipment details' : 'Add new HVAC equipment to client'}
              </Text>
            </View>

            {/* Client Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="person-outline" size={20} color={colors.primary} />
                <Text style={styles.sectionTitle}>Client</Text>
              </View>

              {isClientLocked && selectedClient ? (
                // Read-only client display when creating from client context
                <View style={styles.clientCard}>
                  <View style={styles.clientCardIcon}>
                    <Ionicons name="person" size={24} color={colors.primary} />
                  </View>
                  <View style={styles.clientCardContent}>
                    <Text style={styles.clientCardName}>{selectedClient.name}</Text>
                    <Text style={styles.clientCardDetails}>
                      {selectedClient.address}, {selectedClient.city}
                    </Text>
                  </View>
                  <Ionicons name="lock-closed" size={20} color={colors.textMuted} />
                </View>
              ) : (
                // Client selector for standalone mode
                <View style={styles.field}>
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
                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                  {errors.clientId && <Text style={styles.errorText}>{errors.clientId}</Text>}
                </View>
              )}
            </View>

            {/* Equipment Details Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="construct-outline" size={20} color={colors.primary} />
                <Text style={styles.sectionTitle}>Equipment Details</Text>
              </View>

              <Input
                label="Equipment Name"
                placeholder="e.g., Main Floor AC, Rooftop Unit 1"
                value={formData.name}
                onChangeText={(value) => updateField('name', value)}
                error={errors.name}
                required
              />

              <Input
                label="Manufacturer"
                placeholder="e.g., Carrier, Trane, Lennox, Rheem"
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

              <Input
                label="Location"
                placeholder="e.g., Rooftop, Basement, Attic"
                value={formData.location}
                onChangeText={(value) => updateField('location', value)}
              />
            </View>

            {/* Technical Specifications Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="settings-outline" size={20} color={colors.primary} />
                <Text style={styles.sectionTitle}>Technical Specifications</Text>
              </View>

              {/* System Type */}
              <View style={styles.field}>
                <Text style={styles.label}>System Type</Text>
                <View style={styles.systemTypeGrid}>
                  {SYSTEM_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type.value}
                      style={[
                        styles.systemTypeButton,
                        formData.systemType === type.value && styles.systemTypeButtonSelected,
                      ]}
                      onPress={() => updateField('systemType', type.value)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={type.icon}
                        size={20}
                        color={
                          formData.systemType === type.value ? colors.primary : colors.textSecondary
                        }
                      />
                      <Text
                        style={[
                          styles.systemTypeButtonText,
                          formData.systemType === type.value && styles.systemTypeButtonTextSelected,
                        ]}
                      >
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <Input
                label="Refrigerant Type"
                placeholder="e.g., R-410A, R-22, R-32"
                value={formData.refrigerant}
                onChangeText={(value) => updateField('refrigerant', value)}
              />

              <Input
                label="Tonnage (Cooling Capacity)"
                placeholder="e.g., 2.5, 3, 4"
                value={formData.tonnage?.toString() || ''}
                onChangeText={(value) => {
                  const parsed = parseFloat(value);
                  updateField('tonnage', !isNaN(parsed) ? parsed : undefined);
                }}
                keyboardType="decimal-pad"
              />
              <Text style={styles.helperText}>
                Common residential sizes: 1.5, 2, 2.5, 3, 3.5, 4, 5 tons
              </Text>
            </View>

            {/* Additional Information Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="document-text-outline" size={20} color={colors.primary} />
                <Text style={styles.sectionTitle}>Additional Information</Text>
              </View>

              <Input
                label="Notes (Optional)"
                placeholder="Installation date, warranty info, service history..."
                value={formData.notes}
                onChangeText={(value) => updateField('notes', value)}
                multiline
                // eslint-disable-next-line react-native/no-inline-styles
                style={{ minHeight: 100 }}
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
            {equipment ? 'Update Equipment' : 'Add Equipment'}
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
            <View style={styles.searchInputContainer}>
              <Ionicons
                name="search"
                size={20}
                color={colors.textMuted}
                style={styles.searchIcon}
              />
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
                  setClientSearchQuery('');
                }}
                activeOpacity={0.7}
              >
                <View style={styles.listItemContent}>
                  <View style={styles.listItemIcon}>
                    <Ionicons name="person" size={24} color={colors.primary} />
                  </View>
                  <View style={styles.listItemText}>
                    <Text style={styles.listItemTitle}>{item.name}</Text>
                    <Text style={styles.listItemSubtitle}>
                      {item.address}, {item.city}
                    </Text>
                  </View>
                  {formData.clientId === item.id && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                  )}
                </View>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.listSeparator} />}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyList}>
                <Text style={styles.emptyListText}>
                  {clientSearchQuery
                    ? `No clients match "${clientSearchQuery}"`
                    : 'No clients found'}
                </Text>
              </View>
            }
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  clientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    ...shadows.sm,
  },
  clientCardIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientCardContent: {
    flex: 1,
  },
  clientCardName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing[1],
  },
  clientCardDetails: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
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
  selectButtonText: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  selectButtonPlaceholder: {
    color: colors.disabled,
  },
  systemTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  systemTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    minWidth: 110,
    ...shadows.sm,
  },
  systemTypeButtonSelected: {
    backgroundColor: colors.primary + '10',
    borderColor: colors.primary,
    borderWidth: 2,
  },
  systemTypeButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  systemTypeButtonTextSelected: {
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
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
  searchContainer: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    paddingBottom: spacing[2],
    backgroundColor: colors.background,
  },
  searchInputContainer: {
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: spacing[4],
    top: '50%',
    transform: [{ translateY: -10 }],
    zIndex: 1,
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.base,
    paddingLeft: spacing[12],
    paddingRight: spacing[4],
    paddingVertical: spacing[3],
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 48,
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
    backgroundColor: colors.primary + '10',
  },
  listItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  listItemIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listItemText: {
    flex: 1,
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
  emptyList: {
    padding: spacing[8],
    alignItems: 'center',
  },
  emptyListText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
