import React, { useState } from 'react';
import { View, Text, TextInput, Alert, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { cadastrarVeiculo } from '../services/api';
import { commonStyles } from '../constants/styles';

export default function CadastroVeiculoScreen({ route, navigation }) {
  const { proprietarioId } = route?.params || {};
  const [placa, setPlaca] = useState('');
  const [renavam, setRenavam] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [ano, setAno] = useState('');
  const [loading, setLoading] = useState(false);

  const enviarVeiculo = async () => {
    // Validações simplificadas: apenas modelo e ano são obrigatórios
    if (!modelo.trim()) {
      Alert.alert('Atenção', 'Modelo é obrigatório');
      return;
    }
    
    if (!ano.trim()) {
      Alert.alert('Atenção', 'Ano é obrigatório');
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
        proprietario_id: proprietarioId || null
      });
      if (response && response.id) {
        const returnTo = route?.params?.returnTo;
        Alert.alert('Sucesso', 'Veículo cadastrado com sucesso!', [
          {
            text: 'OK',
            onPress: () => {
              setPlaca(''); setRenavam(''); setMarca(''); setModelo(''); setAno('');
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
      const errorMessage = error.message?.includes('indisponível')
        ? error.message
        : error.message?.includes('autenticado')
        ? 'Sessão expirada. Faça login novamente.'
        : 'Erro ao cadastrar veículo. Verifique sua conexão e tente novamente.';
      Alert.alert('Erro', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView edges={['top']} style={commonStyles.container}>
        <View style={commonStyles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={commonStyles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={commonStyles.headerTitle}>Cadastrar Veículo</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={commonStyles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={commonStyles.loadingText}>Salvando veículo...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={commonStyles.container}>
      {/* Header */}
      <View style={[commonStyles.header, { paddingTop: Platform.OS === 'ios' ? 0 : 16 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={commonStyles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={commonStyles.headerTitle}>Cadastrar Veículo</Text>
        <View style={{ width: 40 }} />
      </View>

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

          <View style={commonStyles.inputContainer}>
            <Ionicons name="car-sport-outline" size={20} color="#666" style={commonStyles.inputIcon} />
            <TextInput
              style={commonStyles.input}
              placeholder="Marca"
              placeholderTextColor="#999"
              value={marca}
              onChangeText={setMarca}
              autoCapitalize="words"
            />
          </View>

          <View style={commonStyles.inputContainer}>
            <Ionicons name="car-outline" size={20} color="#666" style={commonStyles.inputIcon} />
            <TextInput
              style={commonStyles.input}
              placeholder="Modelo *"
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

          <TouchableOpacity
            style={[commonStyles.button, loading && commonStyles.buttonDisabled]}
            onPress={enviarVeiculo}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={commonStyles.buttonText}>Cadastrar Veículo</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
