import React, { useState } from 'react';
import { View, Text, TextInput, Alert, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cadastrarProprietario } from '../services/api';
import { commonStyles } from '../constants/styles';

export default function CadastroProprietarioScreen({ navigation, route }) {
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [rg, setRg] = useState('');
  const [cnh, setCnh] = useState('');
  const [loading, setLoading] = useState(false);

  const enviarProprietario = async () => {
    if (!nome.trim()) {
      Alert.alert('Atenção', 'O nome é obrigatório');
      return;
    }

    setLoading(true);
    try {
      const response = await cadastrarProprietario({ nome: nome.trim(), cpf, rg, cnh });
      if (response && response.id) {
        Alert.alert('Sucesso', 'Proprietário cadastrado com sucesso!', [
          {
            text: 'OK',
            onPress: () => {
              setNome(''); setCpf(''); setRg(''); setCnh('');
              // Navegar para cadastro de veículo
              navigation.navigate('CadastroVeiculo', { proprietarioId: response.id });
            }
          }
        ]);
      } else {
        throw new Error('Resposta inválida do servidor');
      }
    } catch (error) {
      console.error('Erro ao cadastrar proprietário:', error);
      const errorMessage = error.message?.includes('indisponível')
        ? error.message
        : error.message?.includes('autenticado')
        ? 'Sessão expirada. Faça login novamente.'
        : 'Erro ao cadastrar proprietário. Verifique sua conexão e tente novamente.';
      Alert.alert('Erro', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={commonStyles.container}>
        <View style={commonStyles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={commonStyles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={commonStyles.headerTitle}>Cadastrar Proprietário</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={commonStyles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={commonStyles.loadingText}>Salvando proprietário...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={commonStyles.container}>
      {/* Header */}
      <View style={commonStyles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={commonStyles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={commonStyles.headerTitle}>Cadastrar Proprietário</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={commonStyles.scrollContainer}>
        <View style={commonStyles.card}>
          <View style={commonStyles.inputContainer}>
            <Ionicons name="person-outline" size={20} color="#666" style={commonStyles.inputIcon} />
            <TextInput
              style={commonStyles.input}
              placeholder="Nome completo *"
              placeholderTextColor="#999"
              value={nome}
              onChangeText={setNome}
              autoCapitalize="words"
            />
          </View>

          <View style={commonStyles.inputContainer}>
            <Ionicons name="card-outline" size={20} color="#666" style={commonStyles.inputIcon} />
            <TextInput
              style={commonStyles.input}
              placeholder="CPF"
              placeholderTextColor="#999"
              value={cpf}
              onChangeText={setCpf}
              keyboardType="numeric"
            />
          </View>

          <View style={commonStyles.inputContainer}>
            <Ionicons name="document-text-outline" size={20} color="#666" style={commonStyles.inputIcon} />
            <TextInput
              style={commonStyles.input}
              placeholder="RG"
              placeholderTextColor="#999"
              value={rg}
              onChangeText={setRg}
            />
          </View>

          <View style={commonStyles.inputContainer}>
            <Ionicons name="id-card-outline" size={20} color="#666" style={commonStyles.inputIcon} />
            <TextInput
              style={commonStyles.input}
              placeholder="CNH"
              placeholderTextColor="#999"
              value={cnh}
              onChangeText={setCnh}
            />
          </View>

          <TouchableOpacity
            style={[commonStyles.button, loading && commonStyles.buttonDisabled]}
            onPress={enviarProprietario}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={commonStyles.buttonText}>Cadastrar Proprietário</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Estilos específicos removidos - usando commonStyles.card
});
