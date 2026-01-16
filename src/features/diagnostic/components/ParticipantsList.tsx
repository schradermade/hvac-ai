import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Participant } from '../types';
import { colors, spacing, typography } from '@/components/ui';

interface ParticipantsListProps {
  participants: Participant[];
  currentUserId: string;
  onInvite?: () => void;
}

/**
 * Horizontal list of participants in a diagnostic session
 * Shows avatars with online indicators and an invite button
 */
export function ParticipantsList({ participants, currentUserId, onInvite }: ParticipantsListProps) {
  // Filter out participants who have left
  const activeParticipants = participants.filter((p) => !p.leftAt);

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView}>
        {activeParticipants.map((participant) => (
          <View key={participant.id} style={styles.participantChip}>
            {/* Avatar Container */}
            <View style={styles.avatarContainer}>
              <View
                style={[
                  styles.avatar,
                  participant.id === 'ai' ? styles.avatarAI : styles.avatarTech,
                ]}
              >
                {participant.id === 'ai' ? (
                  <Ionicons name="sparkles" size={20} color="#fff" />
                ) : (
                  <Ionicons name="person" size={20} color={colors.primary} />
                )}
              </View>

              {/* Online indicator (not shown for AI) */}
              {participant.id !== 'ai' && <View style={styles.onlineIndicator} />}
            </View>

            {/* Name */}
            <Text
              style={[styles.name, participant.id === currentUserId && styles.nameHighlight]}
              numberOfLines={1}
            >
              {participant.id === currentUserId ? 'You' : getFirstName(participant.name)}
            </Text>
          </View>
        ))}

        {/* Invite button */}
        {onInvite && (
          <TouchableOpacity style={styles.inviteButton} onPress={onInvite}>
            <Ionicons name="person-add-outline" size={20} color={colors.primary} />
            <Text style={styles.inviteText}>Invite</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

/**
 * Extract first name from full name
 */
function getFirstName(fullName: string): string {
  return fullName.split(' ')[0] ?? fullName;
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  scrollView: {
    flexGrow: 0,
  },
  participantChip: {
    alignItems: 'center',
    marginRight: spacing[3],
    width: 56,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing[1],
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarAI: {
    backgroundColor: '#6366f1', // Indigo
  },
  avatarTech: {
    backgroundColor: colors.primary + '10',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  name: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  nameHighlight: {
    fontWeight: '600',
    color: colors.textPrimary,
  },
  inviteButton: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[2],
  },
  inviteText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    marginTop: spacing[1],
    fontWeight: '500',
  },
});
