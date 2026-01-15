/**
 * Componente SelectInput reutilizável
 * Garante funcionamento correto em iOS e Android
 * 
 * Padrão:
 * - Modal fullscreen/pageSheet (nunca inline)
 * - FlatList para performance
 * - Altura mínima 48-56px
 * - FontSize >= 16
 * - Área de toque confortável
 * - Compatível com ScrollView
 */

import React, { useState } from 'react';
import { Platform, Modal, StyleSheet, Text, TouchableOpacity, View, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { commonStyles } from '../constants/styles';

export default function SelectInput({ 
  value, 
  options = [],
  onChange, 
  placeholder = 'Selecione uma opção',
  label,
  error,
  disabled = false,
  icon = 'chevron-down',
  loading = false,
  emptyMessage = 'Nenhuma opção disponível',
}) {
  const [showModal, setShowModal] = useState(false);

  // Encontrar o label da opção selecionada
  const selectedOption = options.find(opt => {
    if (typeof opt === 'object' && opt !== null) {
      return opt.value === value;
    }
    return opt === value;
  });

  const displayText = selectedOption 
    ? (typeof selectedOption === 'object' ? selectedOption.label : selectedOption)
    : placeholder;

  const handleSelect = (option) => {
    const optionValue = typeof option === 'object' ? option.value : option;
    onChange(optionValue);
    setShowModal(false);
  };

  const handleCancel = () => {
    setShowModal(false);
  };

  // Normalizar opções para formato consistente
  const normalizedOptions = options.map(opt => {
    if (typeof opt === 'object' && opt !== null) {
      return { label: opt.label || String(opt.value), value: opt.value };
    }
    return { label: String(opt), value: opt };
  });

  return (
    <>
      {label && <Text style={commonStyles.label}>{label}</Text>}
      <TouchableOpacity
        style={[
          commonStyles.inputContainer,
          styles.selectButton,
          error && styles.inputError,
          disabled && styles.inputDisabled
        ]}
        onPress={() => !disabled && !loading && setShowModal(true)}
        disabled={disabled || loading}
        activeOpacity={0.7}
      >
        <Ionicons 
          name={icon} 
          size={20} 
          color={disabled ? '#ccc' : '#666'} 
          style={commonStyles.inputIcon} 
        />
        <Text style={[
          styles.selectText,
          !selectedOption && styles.selectTextPlaceholder,
          disabled && styles.selectTextDisabled
        ]}>
          {loading ? 'Carregando...' : displayText}
        </Text>
        {loading ? (
          <Ionicons name="hourglass-outline" size={20} color="#666" />
        ) : (
          <Ionicons name="chevron-down" size={20} color={disabled ? '#ccc' : '#666'} />
        )}
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={showModal}
        transparent={false}
        animationType="slide"
        presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
        onRequestClose={handleCancel}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={handleCancel} style={styles.modalButton}>
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle} numberOfLines={1}>
                {label || 'Selecione uma opção'}
              </Text>
              <View style={styles.modalButton} />
            </View>

            {/* Lista de opções */}
            {normalizedOptions.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="alert-circle-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>{emptyMessage}</Text>
              </View>
            ) : (
              <FlatList
                data={normalizedOptions}
                keyExtractor={(item, index) => `option-${item.value}-${index}`}
                renderItem={({ item }) => {
                  const isSelected = item.value === value;
                  return (
                    <TouchableOpacity
                      style={[
                        styles.optionItem,
                        isSelected && styles.optionItemSelected
                      ]}
                      onPress={() => handleSelect(item)}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.optionText,
                        isSelected && styles.optionTextSelected
                      ]}>
                        {item.label}
                      </Text>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                      )}
                    </TouchableOpacity>
                  );
                }}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={true}
                initialNumToRender={20}
                maxToRenderPerBatch={10}
                windowSize={10}
              />
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  selectButton: {
    minHeight: 56,
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  selectText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginHorizontal: 8,
  },
  selectTextPlaceholder: {
    color: '#999',
  },
  selectTextDisabled: {
    color: '#ccc',
  },
  inputError: {
    borderColor: '#F44336',
    borderWidth: 1,
  },
  inputDisabled: {
    backgroundColor: '#f5f5f5',
    opacity: 0.7,
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 8,
    marginLeft: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
    minHeight: 56,
  },
  modalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  modalButton: {
    padding: 8,
    minWidth: 80,
  },
  modalButtonText: {
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    paddingVertical: 8,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 56,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  optionItemSelected: {
    backgroundColor: '#f5f5f5',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  optionTextSelected: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});
