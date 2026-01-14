/**
 * Componente DateInput reutilizável
 * Garante funcionamento correto em iOS e Android
 * 
 * Padrão:
 * - Estado sempre como Date | null
 * - Conversão para string apenas no envio
 * - Tratamento correto de event.type === 'dismissed'
 */

import React, { useState } from 'react';
import { Platform, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { commonStyles } from '../constants/styles';

export default function DateInput({ 
  value, 
  onChange, 
  placeholder = 'Selecione a data',
  label,
  error,
  maximumDate,
  minimumDate,
  disabled = false,
}) {
  const [showPicker, setShowPicker] = useState(false);

  // Garantir que value seja sempre Date ou null
  const dateValue = value instanceof Date ? value : (value ? new Date(value) : new Date());

  const formatarData = (date) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return '';
    }
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }

    // Tratar event.type === 'dismissed'
    if (event.type === 'dismissed') {
      if (Platform.OS === 'ios') {
        setShowPicker(false);
      }
      return;
    }

    // Tratar event.type === 'set'
    if (event.type === 'set' && selectedDate) {
      // Garantir que selectedDate seja Date válido
      const dateObj = selectedDate instanceof Date ? selectedDate : new Date(selectedDate);
      if (!isNaN(dateObj.getTime())) {
        onChange(dateObj);
      }
    }
  };

  const handleConfirm = () => {
    setShowPicker(false);
  };

  const handleCancel = () => {
    setShowPicker(false);
  };

  return (
    <>
      {label && <Text style={commonStyles.label}>{label}</Text>}
      <TouchableOpacity
        style={[
          commonStyles.inputContainer,
          error && styles.inputError,
          disabled && styles.inputDisabled
        ]}
        onPress={() => !disabled && setShowPicker(true)}
        disabled={disabled}
      >
        <Ionicons name="calendar-outline" size={20} color="#666" style={commonStyles.inputIcon} />
        <Text style={[
          commonStyles.input,
          { color: dateValue && !isNaN(dateValue.getTime()) ? '#333' : '#999', paddingVertical: 12 }
        ]}>
          {dateValue && !isNaN(dateValue.getTime()) ? formatarData(dateValue) : placeholder}
        </Text>
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}

      {showPicker && (
        Platform.OS === 'ios' ? (
          <Modal
            visible={showPicker}
            transparent={false}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={handleCancel}
          >
            <SafeAreaView style={styles.modalContainer} edges={['bottom']}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <TouchableOpacity onPress={handleCancel} style={styles.modalButton}>
                    <Text style={styles.modalButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <Text style={styles.modalTitle}>Selecione a data</Text>
                  <TouchableOpacity onPress={handleConfirm} style={styles.modalButton}>
                    <Text style={[styles.modalButtonText, styles.modalButtonConfirm]}>Confirmar</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.pickerContainer}>
                  <DateTimePicker
                    value={dateValue}
                    mode="date"
                    display="spinner"
                    maximumDate={maximumDate}
                    minimumDate={minimumDate}
                    onChange={handleDateChange}
                    locale="pt-BR"
                    style={styles.picker}
                  />
                </View>
              </View>
            </SafeAreaView>
          </Modal>
        ) : (
          <DateTimePicker
            value={dateValue}
            mode="date"
            display="default"
            maximumDate={maximumDate}
            minimumDate={minimumDate}
            onChange={handleDateChange}
          />
        )
      )}
    </>
  );
}

const styles = StyleSheet.create({
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalButton: {
    padding: 8,
    minWidth: 80,
  },
  modalButtonText: {
    fontSize: 16,
    color: '#666',
  },
  modalButtonConfirm: {
    color: '#4CAF50',
    fontWeight: '600',
    textAlign: 'right',
  },
  pickerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 20,
  },
  picker: {
    width: '100%',
    height: 216,
  },
});

