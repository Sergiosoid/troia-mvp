/**
 * Modal de Filtros de Busca
 * Permite aplicar filtros avançados na busca global
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { commonStyles } from '../constants/styles';
import ActionButton from './ActionButton';

const SPACING = 16;

const TIPOS_VEICULO = [
  { value: 'carro', label: 'Carro' },
  { value: 'moto', label: 'Moto' },
  { value: 'caminhao', label: 'Caminhão' },
  { value: 'van', label: 'Van' },
  { value: 'caminhonete', label: 'Caminhonete' },
  { value: 'onibus', label: 'Ônibus' },
  { value: 'barco', label: 'Barco' },
];

const TIPOS_MANUTENCAO = [
  { value: 'preventiva', label: 'Preventiva' },
  { value: 'corretiva', label: 'Corretiva' },
];

const TIPOS_BUSCA = [
  { value: '', label: 'Todos' },
  { value: 'veiculos', label: 'Veículos' },
  { value: 'manutencoes', label: 'Manutenções' },
  { value: 'abastecimentos', label: 'Abastecimentos' },
];

export default function FiltroBuscaModal({ visible, onClose, filtros, onAplicar }) {
  const [filtrosLocais, setFiltrosLocais] = useState(filtros || {});
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      setFiltrosLocais(filtros || {});
    }
  }, [visible, filtros]);

  const atualizarFiltro = (campo, valor) => {
    setFiltrosLocais(prev => ({
      ...prev,
      [campo]: valor,
    }));
  };

  const limparFiltros = () => {
    setFiltrosLocais({});
    onAplicar({});
  };

  const aplicarFiltros = () => {
    onAplicar(filtrosLocais);
    onClose();
  };

  const formatarData = (data) => {
    if (!data) return '';
    try {
      const date = new Date(data);
      return date.toISOString().split('T')[0];
    } catch {
      return data;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer} edges={['bottom']}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filtros de Busca</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Conteúdo */}
          <ScrollView
            style={styles.scrollContent}
            contentContainerStyle={[
              styles.scrollContentInner,
              { paddingBottom: insets.bottom + 20 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Tipo de Busca */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tipo de Item</Text>
              <View style={styles.optionsRow}>
                {TIPOS_BUSCA.map(tipo => (
                  <TouchableOpacity
                    key={tipo.value}
                    style={[
                      styles.optionButton,
                      filtrosLocais.tipo === tipo.value && styles.optionButtonActive,
                    ]}
                    onPress={() => atualizarFiltro('tipo', tipo.value || undefined)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        filtrosLocais.tipo === tipo.value && styles.optionTextActive,
                      ]}
                    >
                      {tipo.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Filtros de Data */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Período</Text>
              <View style={styles.inputRow}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Data Inicial</Text>
                  <TextInput
                    style={styles.input}
                    value={filtrosLocais.dataInicial || ''}
                    onChangeText={(text) => atualizarFiltro('dataInicial', text || undefined)}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#999"
                  />
                </View>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Data Final</Text>
                  <TextInput
                    style={styles.input}
                    value={filtrosLocais.dataFinal || ''}
                    onChangeText={(text) => atualizarFiltro('dataFinal', text || undefined)}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#999"
                  />
                </View>
              </View>
            </View>

            {/* Filtros de Valor */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Faixa de Valor (R$)</Text>
              <View style={styles.inputRow}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Valor Mínimo</Text>
                  <TextInput
                    style={styles.input}
                    value={filtrosLocais.valorMin?.toString() || ''}
                    onChangeText={(text) => atualizarFiltro('valorMin', text ? parseFloat(text) : undefined)}
                    placeholder="0.00"
                    keyboardType="numeric"
                    placeholderTextColor="#999"
                  />
                </View>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Valor Máximo</Text>
                  <TextInput
                    style={styles.input}
                    value={filtrosLocais.valorMax?.toString() || ''}
                    onChangeText={(text) => atualizarFiltro('valorMax', text ? parseFloat(text) : undefined)}
                    placeholder="0.00"
                    keyboardType="numeric"
                    placeholderTextColor="#999"
                  />
                </View>
              </View>
            </View>

            {/* Filtros de KM */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Faixa de KM</Text>
              <View style={styles.inputRow}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>KM Mínimo</Text>
                  <TextInput
                    style={styles.input}
                    value={filtrosLocais.kmMin?.toString() || ''}
                    onChangeText={(text) => atualizarFiltro('kmMin', text ? parseInt(text) : undefined)}
                    placeholder="0"
                    keyboardType="numeric"
                    placeholderTextColor="#999"
                  />
                </View>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>KM Máximo</Text>
                  <TextInput
                    style={styles.input}
                    value={filtrosLocais.kmMax?.toString() || ''}
                    onChangeText={(text) => atualizarFiltro('kmMax', text ? parseInt(text) : undefined)}
                    placeholder="0"
                    keyboardType="numeric"
                    placeholderTextColor="#999"
                  />
                </View>
              </View>
            </View>

            {/* Tipo de Veículo */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tipo de Veículo</Text>
              <View style={styles.optionsRow}>
                {TIPOS_VEICULO.map(tipo => (
                  <TouchableOpacity
                    key={tipo.value}
                    style={[
                      styles.optionButton,
                      filtrosLocais.tipo_veiculo === tipo.value && styles.optionButtonActive,
                    ]}
                    onPress={() => atualizarFiltro('tipo_veiculo', filtrosLocais.tipo_veiculo === tipo.value ? undefined : tipo.value)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        filtrosLocais.tipo_veiculo === tipo.value && styles.optionTextActive,
                      ]}
                    >
                      {tipo.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Tipo de Manutenção */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tipo de Manutenção</Text>
              <View style={styles.optionsRow}>
                {TIPOS_MANUTENCAO.map(tipo => (
                  <TouchableOpacity
                    key={tipo.value}
                    style={[
                      styles.optionButton,
                      filtrosLocais.tipo_manutencao === tipo.value && styles.optionButtonActive,
                    ]}
                    onPress={() => atualizarFiltro('tipo_manutencao', filtrosLocais.tipo_manutencao === tipo.value ? undefined : tipo.value)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        filtrosLocais.tipo_manutencao === tipo.value && styles.optionTextActive,
                      ]}
                    >
                      {tipo.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Footer com Botões */}
          <View style={[styles.modalFooter, { paddingBottom: insets.bottom + 10 }]}>
            <ActionButton
              label="Limpar Filtros"
              onPress={limparFiltros}
              style={styles.buttonSecondary}
              textStyle={styles.buttonSecondaryText}
            />
            <ActionButton
              label="Aplicar Filtros"
              onPress={aplicarFiltros}
              style={styles.buttonPrimary}
            />
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: commonStyles.textPrimary,
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentInner: {
    padding: SPACING,
  },
  section: {
    marginBottom: SPACING * 1.5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: commonStyles.textPrimary,
    marginBottom: SPACING / 2,
  },
  inputRow: {
    flexDirection: 'row',
    gap: SPACING / 2,
  },
  inputContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    color: commonStyles.textSecondary,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: SPACING / 2,
    fontSize: 14,
    color: commonStyles.textPrimary,
    backgroundColor: '#fff',
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING / 2,
  },
  optionButton: {
    paddingHorizontal: SPACING,
    paddingVertical: SPACING / 2,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  optionButtonActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  optionText: {
    fontSize: 14,
    color: '#666',
  },
  optionTextActive: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: SPACING / 2,
    padding: SPACING,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  buttonSecondary: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  buttonSecondaryText: {
    color: '#666',
  },
  buttonPrimary: {
    flex: 1,
  },
});

