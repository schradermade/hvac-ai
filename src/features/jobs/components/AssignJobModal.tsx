import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui';
import { useTechnicians } from '@/features/technicians';
import { useAssignJob } from '../hooks/useJobAssignment';
import { colors, spacing, borderRadius, typography, shadows } from '@/components/ui';

interface AssignJobModalProps {
  jobId: string;
  visible: boolean;
  onClose: () => void;
}

/**
 * Bottom sheet modal for assigning a job to a technician
 */
export function AssignJobModal({ jobId, visible, onClose }: AssignJobModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string | null>(null);

  const { data: technicians, isLoading } = useTechnicians();
  const assignJob = useAssignJob();

  // Filter technicians by search query
  const filteredTechnicians = technicians?.technicians.filter((tech) => {
    const query = searchQuery.toLowerCase();
    const fullName = `${tech.firstName} ${tech.lastName}`.toLowerCase();
    return fullName.includes(query) || tech.role.toLowerCase().includes(query);
  });

  const handleAssign = () => {
    if (!selectedTechnicianId) return;

    const selectedTech = technicians?.technicians.find((t) => t.id === selectedTechnicianId);
    if (!selectedTech) return;

    assignJob.mutate(
      {
        jobId,
        technicianId: selectedTech.id,
        technicianName: `${selectedTech.firstName} ${selectedTech.lastName}`,
      },
      {
        onSuccess: () => {
          onClose();
          setSelectedTechnicianId(null);
          setSearchQuery('');
        },
      }
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Assign Job</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Subtitle */}
          <Text style={styles.subtitle}>Select technician to assign</Text>

          {/* Search Input */}
          <TextInput
            style={styles.searchInput}
            placeholder="Search technicians..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.textMuted}
          />

          {/* Technician List */}
          <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
            {isLoading && <Text style={styles.loadingText}>Loading technicians...</Text>}

            {filteredTechnicians?.map((tech) => (
              <TouchableOpacity
                key={tech.id}
                style={[
                  styles.technicianCard,
                  selectedTechnicianId === tech.id && styles.technicianCardSelected,
                ]}
                onPress={() => setSelectedTechnicianId(tech.id)}
              >
                {/* Avatar */}
                <View style={styles.avatarContainer}>
                  <Ionicons name="person" size={20} color={colors.primary} />
                </View>

                {/* Content */}
                <View style={styles.technicianContent}>
                  <View style={styles.technicianHeader}>
                    <Text style={styles.technicianName}>
                      {tech.firstName} {tech.lastName}
                    </Text>
                    <Text style={styles.technicianRole}>{formatRole(tech.role)}</Text>
                  </View>

                  {tech.certifications.length > 0 && (
                    <Text style={styles.certifications} numberOfLines={1}>
                      {tech.certifications
                        .slice(0, 2)
                        .map((c) => c.type.toUpperCase())
                        .join(', ')}
                    </Text>
                  )}

                  <View style={styles.availability}>
                    <View style={styles.availabilityDot} />
                    <Text style={styles.availabilityText}>Available</Text>
                  </View>
                </View>

                {/* Checkmark if selected */}
                {selectedTechnicianId === tech.id && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}

            {filteredTechnicians?.length === 0 && !isLoading && (
              <Text style={styles.emptyText}>No technicians found</Text>
            )}
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <Button variant="ghost" onPress={onClose} style={styles.cancelButton}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onPress={handleAssign}
              disabled={!selectedTechnicianId}
              loading={assignJob.isPending}
              style={styles.assignButton}
            >
              Assign Job
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function formatRole(role: string): string {
  return role.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    maxHeight: '90%',
    paddingTop: spacing[4],
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[6],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  closeButton: {
    padding: spacing[2],
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginBottom: spacing[4],
  },
  searchInput: {
    height: 48,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.base,
    paddingHorizontal: spacing[4],
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing[4],
  },
  listContainer: {
    maxHeight: 400,
    marginBottom: spacing[4],
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    padding: spacing[6],
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    padding: spacing[6],
  },
  technicianCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    backgroundColor: colors.surface,
    borderRadius: borderRadius.base,
    marginBottom: spacing[3],
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadows.sm,
  },
  technicianCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  technicianContent: {
    flex: 1,
  },
  technicianHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[1],
  },
  technicianName: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.textPrimary,
    marginRight: spacing[2],
  },
  technicianRole: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  certifications: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing[1],
  },
  availability: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  availabilityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
    marginRight: spacing[1],
  },
  availabilityText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  cancelButton: {
    flex: 1,
  },
  assignButton: {
    flex: 2,
  },
});
