/**
 * Tela de Edição de Perfil
 * Permite editar nome, email e senha do usuário
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getLoggedUser } from '../utils/authStorage';
import { commonStyles } from '../constants/styles';

export default function EditarPerfilScreen({ navigation }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSenhaAtual, setShowSenhaAtual] = useState(false);
  const [showNovaSenha, setShowNovaSenha] = useState(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);

  useEffect(() => {
    carregarDadosUsuario();
  }, []);

  const carregarDadosUsuario = async () => {
    try {
      const user = await getLoggedUser();
      if (user) {
        setNome(user.nome || '');
        setEmail(user.email || '');
      }
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
    }
  };

  const handleSalvar = async () => {
    if (!nome.trim()) {
      Alert.alert('Atenção', 'Nome é obrigatório');
      return;
    }

    if (!email.trim()) {
      Alert.alert('Atenção', 'Email é obrigatório');
      return;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Atenção', 'Email inválido');
      return;
    }

    // Se está alterando senha, validar
    if (novaSenha || senhaAtual || confirmarSenha) {
      if (!senhaAtual) {
        Alert.alert('Atenção', 'Informe a senha atual para alterar');
        return;
      }
      if (!novaSenha || novaSenha.length < 6) {
        Alert.alert('Atenção', 'Nova senha deve ter pelo menos 6 caracteres');
        return;
      }
      if (novaSenha !== confirmarSenha) {
        Alert.alert('Atenção', 'As senhas não coincidem');
        return;
      }
    }

    setLoading(true);
    try {
      // TODO: Implementar chamada ao backend quando endpoint estiver disponível
      // Por enquanto, apenas atualizar localmente
      Alert.alert(
        'Em breve',
        'A edição de perfil será implementada em breve. Por enquanto, os dados são apenas exibidos.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Erro', 'Erro ao salvar alterações');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={commonStyles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={commonStyles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={commonStyles.textPrimary} />
        </TouchableOpacity>
        <Text style={commonStyles.headerTitle}>Editar Perfil</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={commonStyles.label}>Nome *</Text>
        <View style={commonStyles.inputContainer}>
          <Ionicons name="person-outline" size={20} color={commonStyles.textSecondary} style={commonStyles.inputIcon} />
          <TextInput
            style={commonStyles.input}
            value={nome}
            onChangeText={setNome}
            placeholder="Seu nome completo"
            autoCapitalize="words"
          />
        </View>

        <Text style={commonStyles.label}>Email *</Text>
        <View style={commonStyles.inputContainer}>
          <Ionicons name="mail-outline" size={20} color={commonStyles.textSecondary} style={commonStyles.inputIcon} />
          <TextInput
            style={commonStyles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="seu@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            editable={false}
          />
        </View>
        <Text style={styles.hint}>Email não pode ser alterado</Text>

        <View style={styles.divider} />

        <Text style={commonStyles.label}>Alterar Senha</Text>
        <Text style={styles.hint}>Deixe em branco se não quiser alterar</Text>

        <Text style={[commonStyles.label, { marginTop: 10 }]}>Senha Atual</Text>
        <View style={commonStyles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color={commonStyles.textSecondary} style={commonStyles.inputIcon} />
          <TextInput
            style={commonStyles.input}
            value={senhaAtual}
            onChangeText={setSenhaAtual}
            placeholder="Digite sua senha atual"
            secureTextEntry={!showSenhaAtual}
          />
          <TouchableOpacity onPress={() => setShowSenhaAtual(!showSenhaAtual)}>
            <Ionicons
              name={showSenhaAtual ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={commonStyles.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <Text style={commonStyles.label}>Nova Senha</Text>
        <View style={commonStyles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color={commonStyles.textSecondary} style={commonStyles.inputIcon} />
          <TextInput
            style={commonStyles.input}
            value={novaSenha}
            onChangeText={setNovaSenha}
            placeholder="Mínimo 6 caracteres"
            secureTextEntry={!showNovaSenha}
          />
          <TouchableOpacity onPress={() => setShowNovaSenha(!showNovaSenha)}>
            <Ionicons
              name={showNovaSenha ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={commonStyles.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <Text style={commonStyles.label}>Confirmar Nova Senha</Text>
        <View style={commonStyles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color={commonStyles.textSecondary} style={commonStyles.inputIcon} />
          <TextInput
            style={commonStyles.input}
            value={confirmarSenha}
            onChangeText={setConfirmarSenha}
            placeholder="Digite a nova senha novamente"
            secureTextEntry={!showConfirmarSenha}
          />
          <TouchableOpacity onPress={() => setShowConfirmarSenha(!showConfirmarSenha)}>
            <Ionicons
              name={showConfirmarSenha ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={commonStyles.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[commonStyles.button, loading && commonStyles.buttonDisabled]}
          onPress={handleSalvar}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={commonStyles.buttonText}>Salvar Alterações</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    ...commonStyles.header,
    paddingTop: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  hint: {
    fontSize: 12,
    color: commonStyles.textLight,
    marginTop: -10,
    marginBottom: 10,
    marginLeft: 15,
  },
  divider: {
    height: 1,
    backgroundColor: commonStyles.borderColor,
    marginVertical: 20,
  },
});

