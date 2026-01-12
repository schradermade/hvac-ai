import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useDiagnosticChat } from '../hooks/useDiagnostic';
import { MessageList } from '../components/MessageList';
import { ChatInput } from '../components/ChatInput';
import { EquipmentSelector } from '../components/EquipmentSelector';
import { colors } from '@/components/ui';
import type { Equipment } from '@/features/equipment';
import type { EquipmentContext } from '../types';

/**
 * DiagnosticChatScreen
 *
 * Main screen for the diagnostic chat feature.
 * Provides an AI-powered assistant for HVAC diagnostics and troubleshooting.
 *
 * Features:
 * - Real-time chat with AI assistant
 * - Equipment context awareness
 * - Multiple diagnostic modes (expert/guided/quick)
 * - Offline-capable with mock responses
 */
export function DiagnosticChatScreen() {
  const { messages, sendMessage, isLoading, setEquipmentContext } = useDiagnosticChat('expert');
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | undefined>();

  const handleEquipmentChange = (equipment: Equipment | undefined) => {
    if (equipment) {
      setSelectedEquipmentId(equipment.id);
      // Convert Equipment to EquipmentContext
      const context: EquipmentContext = {
        manufacturer: equipment.manufacturer,
        modelNumber: equipment.modelNumber,
        systemType: equipment.systemType,
        refrigerant: equipment.refrigerant,
        installDate: equipment.installDate,
      };
      setEquipmentContext(context);
    } else {
      setSelectedEquipmentId(undefined);
      setEquipmentContext(undefined);
    }
  };

  return (
    <View style={styles.container}>
      <EquipmentSelector
        selectedEquipmentId={selectedEquipmentId}
        onEquipmentChange={handleEquipmentChange}
      />
      <MessageList messages={messages} />
      <ChatInput
        onSend={sendMessage}
        disabled={isLoading}
        placeholder="Ask about diagnostics, troubleshooting, or calculations..."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
});
