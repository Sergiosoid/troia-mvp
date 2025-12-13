import React, { useState } from 'react';
import { View, Text, TextInput, Alert, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { cadastrarProprietario } from '../services/api';
import { commonStyles } from '../constants/styles';
import HeaderBar from '../components/HeaderBar';

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
        const returnTo = route?.params?.returnTo;
        Alert.alert('Sucesso', 'Proprietário cadastrado com sucesso!', [
          {
            text: 'OK',
            onPress: () => {
              setNome(''); setCpf(''); setRg(''); setCnh('');
              // Navegar conforme contexto (sem redirects automáticos)
              if (returnTo === 'GerenciarProprietarios') {
                navigation.navigate('GerenciarProprietarios', { refresh: true });
              } else if (returnTo === 'Configuracoes') {
                navigation.navigate('Configuracoes');
              } else if (returnTo === 'HomeDashboard') {
                navigation.navigate('HomeDashboard', { refresh: true });
              } else {
                // Por padrão, voltar para tela anterior
                navigation.goBack();
              }
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
        <HeaderBar title="Cadastrar Proprietário" navigation={navigation} />
        <View style={commonStyles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={commonStyles.loadingText}>Salvando proprietário...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={commonStyles.container}>
      <HeaderBar title="Cadastrar Proprietário" navigation={navigation} />

      <ScrollView style={commonStyles.scrollContainer} contentContainerStyle={{ paddingBottom: Platform.OS === 'android' ? 40 : 20 }}>
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

          {/* Botão para importar CNH via foto (melhoria futura) */}
          <CameraButton
            onPress={() => {
              Alert.alert(
                'Em breve',
                'A importação de CNH via foto será implementada em breve. Por enquanto, preencha manualmente.',
                [{ text: 'OK' }]
              );
            }}
            label="Importar CNH via Foto"
            variant="secondary"
            style={{ marginBottom: 10 }}
          />

          <TouchableOpacity
            style={[commonStyles.button, loading && commonStyles.buttonDisabled]}
            onPress={enviarProprietario}
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
                Cadastrar Proprietário
              </Text>
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
