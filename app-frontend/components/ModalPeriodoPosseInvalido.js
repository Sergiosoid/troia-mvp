/**
 * ⚠️ COMPONENTE OBSOLETO - MANTIDO POR COMPATIBILIDADE
 * 
 * Este modal foi usado no modelo antigo onde era necessário "configurar aquisição"
 * após cadastrar o veículo. No modelo atual, a aquisição é informada durante o cadastro.
 * 
 * STATUS: Não está mais em uso ativo, mas mantido caso algum código legado ainda o chame.
 * 
 * Se encontrar este modal sendo exibido, é um bug - a aquisição deve ser informada no cadastro.
 */
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
          
          <Text style={styles.title}>Histórico Indisponível</Text>
          
          <Text style={styles.message}>
            Dados ainda insuficientes para algumas funcionalidades.
          </Text>
          
          <Text style={styles.subMessage}>
            Você pode continuar usando o app normalmente. Algumas métricas podem não estar disponíveis até que mais dados sejam registrados.
          </Text>

          <View style={styles.buttonContainer}>
            <ActionButton
              onPress={onConfigurar}
              label="Ver Detalhes"
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

