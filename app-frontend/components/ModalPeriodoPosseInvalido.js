import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ActionButton from './ActionButton';

export default function ModalPeriodoPosseInvalido({ visible, veiculoId, onConfigurar, onClose }) {
  // Modal bloqueante - não permite fechar sem ação
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => {}} // Não permite fechar pelo botão de voltar
    >
      <Pressable style={styles.overlay} onPress={() => {}}>
        <View style={styles.content} onStartShouldSetResponder={() => true}>
          <View style={styles.iconContainer}>
            <Ionicons name="warning" size={64} color="#FF9800" />
          </View>
          
          <Text style={styles.title}>Configuração Necessária</Text>
          
          <Text style={styles.message}>
            Antes de continuar, informe a data de aquisição e o KM inicial deste veículo.
          </Text>
          
          <Text style={styles.subMessage}>
            Isso é necessário para manter o histórico técnico confiável e permitir o registro de manutenções, abastecimentos e atualizações de KM.
          </Text>

          <View style={styles.buttonContainer}>
            <ActionButton
              onPress={onConfigurar}
              label="Configurar Aquisição"
              color="#4CAF50"
              style={styles.button}
            />
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 24,
  },
  subMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  buttonContainer: {
    width: '100%',
  },
  button: {
    width: '100%',
  },
});

