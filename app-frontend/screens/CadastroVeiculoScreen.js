import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import HeaderBar from '../components/HeaderBar';
import { commonStyles } from '../constants/styles';
import { cadastrarVeiculo } from '../services/api';
import { getErrorMessage, getSuccessMessage } from '../utils/errorMessages';

export default function CadastroVeiculoScreen({ route, navigation }) {
  const { proprietarioId } = route?.params || {};
  const [placa, setPlaca] = useState('');
  const [renavam, setRenavam] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [ano, setAno] = useState('');
  const [tipoVeiculo, setTipoVeiculo] = useState('');
  const [mostrarTipoVeiculo, setMostrarTipoVeiculo] = useState(false);
  const [loading, setLoading] = useState(false);

  const tiposVeiculo = [
    { value: 'carro', label: 'Carro' },
    { value: 'moto', label: 'Moto' },
    { value: 'caminhao', label: 'Caminhão' },
    { value: 'van', label: 'Van' },
    { value: 'caminhonete', label: 'Caminhonete' },
    { value: 'onibus', label: 'Ônibus' },
    { value: 'barco', label: 'Barco' },
  ];

  const enviarVeiculo = async () => {
    // Validações simplificadas: apenas modelo e ano são obrigatórios
    if (!modelo.trim()) {
      Alert.alert('Atenção', 'O modelo é obrigatório');
      return;
    }
    
    if (!ano.trim()) {
      Alert.alert('Atenção', 'O ano é obrigatório');
      return;
    }

    setLoading(true);
    try {
      const response = await cadastrarVeiculo({ 
        placa: placa.trim() ? placa.trim().toUpperCase() : null, 
        renavam: renavam.trim() || null,
        marca: marca.trim() || null,
        modelo: modelo.trim(),
        ano: ano.trim(),
        tipo_veiculo: tipoVeiculo || null,
        proprietario_id: proprietarioId || null
      });
      if (response && response.id) {
        const returnTo = route?.params?.returnTo;
        Alert.alert('Sucesso', getSuccessMessage('veiculo'), [
          {
            text: 'OK',
            onPress: () => {
              setPlaca(''); setRenavam(''); setMarca(''); setModelo(''); setAno(''); setTipoVeiculo('');
              // Navegar conforme contexto
              if (returnTo === 'GerenciarVeiculos') {
                navigation.navigate('GerenciarVeiculos', { refresh: true });
              } else {
                // Navegar para HomeDashboard com refresh
                navigation.navigate('HomeDashboard', { refresh: true });
              }
            }
          }
        ]);
      } else {
        throw new Error('Resposta inválida do servidor');
      }
    } catch (error) {
      console.error('Erro ao cadastrar veículo:', error);
      Alert.alert('Ops!', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={commonStyles.container}>
        <HeaderBar title="Cadastrar Veículo" navigation={navigation} />
        <View style={commonStyles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={commonStyles.loadingText}>Salvando veículo...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={commonStyles.container}>
      <HeaderBar title="Cadastrar Veículo" navigation={navigation} />

      <ScrollView style={commonStyles.scrollContainer}>
        <View style={commonStyles.card}>
          {proprietarioId && (
            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={20} color="#2196F3" />
              <Text style={styles.infoText}>Veículo será vinculado ao proprietário selecionado</Text>
            </View>
          )}

          <View style={commonStyles.inputContainer}>
            <Ionicons name="car-outline" size={20} color="#666" style={commonStyles.inputIcon} />
            <TextInput
              style={commonStyles.input}
              placeholder="Placa (opcional)"
              placeholderTextColor="#999"
              value={placa}
              onChangeText={(text) => setPlaca(text.toUpperCase())}
              autoCapitalize="characters"
              maxLength={7}
            />
          </View>

          <View style={commonStyles.inputContainer}>
            <Ionicons name="barcode-outline" size={20} color="#666" style={commonStyles.inputIcon} />
            <TextInput
              style={commonStyles.input}
              placeholder="Renavam (opcional)"
              placeholderTextColor="#999"
              value={renavam}
              onChangeText={setRenavam}
              keyboardType="numeric"
            />
          </View>

          <Text style={commonStyles.label}>Fabricante</Text>
          <View style={commonStyles.inputContainer}>
            <Ionicons name="car-sport-outline" size={20} color="#666" style={commonStyles.inputIcon} />
            <TextInput
              style={commonStyles.input}
              placeholder="Ex: Toyota, Honda, Fiat..."
              placeholderTextColor="#999"
              value={marca}
              onChangeText={setMarca}
              autoCapitalize="words"
            />
          </View>

          <Text style={commonStyles.label}>Modelo / Identificação *</Text>
          <View style={commonStyles.inputContainer}>
            <Ionicons name="car-outline" size={20} color="#666" style={commonStyles.inputIcon} />
            <TextInput
              style={commonStyles.input}
              placeholder="Ex: Corolla, Civic, Uno..."
              placeholderTextColor="#999"
              value={modelo}
              onChangeText={setModelo}
              autoCapitalize="words"
            />
          </View>

          <View style={commonStyles.inputContainer}>
            <Ionicons name="calendar-outline" size={20} color="#666" style={commonStyles.inputIcon} />
            <TextInput
              style={commonStyles.input}
              placeholder="Ano *"
              placeholderTextColor="#999"
              value={ano}
              onChangeText={setAno}
              keyboardType="numeric"
              maxLength={4}
            />
          </View>

          <Text style={commonStyles.label}>Tipo de Veículo</Text>
          <View style={styles.pickerContainer}>
            <TouchableOpacity 
              style={[commonStyles.inputContainer, styles.pickerButton]}
              onPress={() => setMostrarTipoVeiculo(true)}
            >
              <Ionicons name="car-sport-outline" size={20} color="#666" style={commonStyles.inputIcon} />
              <Text style={styles.pickerText}>
                {tipoVeiculo 
                  ? tiposVeiculo.find(t => t.value === tipoVeiculo)?.label || tipoVeiculo
                  : 'Selecione o tipo (opcional)'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[commonStyles.button, loading && commonStyles.buttonDisabled]}
            onPress={enviarVeiculo}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text 
                style={commonStyles.buttonText}
                numberOfLines={1}
                allowFontScaling={false}
              >
                Cadastrar Veículo
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal de Seleção de Tipo de Veículo */}
      <Modal
        visible={mostrarTipoVeiculo}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMostrarTipoVeiculo(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setMostrarTipoVeiculo(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecione o Tipo de Veículo</Text>
              <TouchableOpacity
                onPress={() => setMostrarTipoVeiculo(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.modalScrollView}
              showsVerticalScrollIndicator={true}
            >
              {tiposVeiculo.map(tipo => (
                <TouchableOpacity
                  key={tipo.value}
                  style={[
                    styles.modalOptionItem,
                    tipoVeiculo === tipo.value && styles.modalOptionItemSelected
                  ]}
                  onPress={() => {
                    setTipoVeiculo(tipo.value);
                    setMostrarTipoVeiculo(false);
                  }}
                >
                  <Text style={[
                    styles.modalOptionText,
                    tipoVeiculo === tipo.value && styles.modalOptionTextSelected
                  ]}>
                    {tipo.label}
                  </Text>
                  {tipoVeiculo === tipo.value && (
                    <Ionicons name="checkmark" size={20} color="#4CAF50" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Pressable>
        </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  pickerContainer: {
    marginBottom: 15,
  },
  pickerButton: {
    justifyContent: 'space-between',
  },
  pickerText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxHeight: Dimensions.get('window').height * 0.6,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalScrollView: {
    maxHeight: Dimensions.get('window').height * 0.5,
  },
  modalOptionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalOptionItemSelected: {
    backgroundColor: '#e8f5e9',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333',
  },
  modalOptionTextSelected: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#1976d2',
    flex: 1,
  },
});
