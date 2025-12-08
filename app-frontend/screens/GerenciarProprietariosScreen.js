/**
 * Tela de Gerenciamento de Proprietários
 * Lista, edita e exclui proprietários
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { listarProprietarios } from '../services/api';
import { commonStyles } from '../constants/styles';

export default function GerenciarProprietariosScreen({ navigation }) {
  const [proprietarios, setProprietarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      carregarProprietarios();
    }, [])
  );

  const carregarProprietarios = async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      }
      const dados = await listarProprietarios();
      setProprietarios(Array.isArray(dados) ? dados : []);
    } catch (error) {
      console.error('Erro ao carregar proprietários:', error);
      setProprietarios([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    carregarProprietarios(true);
  };

  const handleEditar = (proprietario) => {
    Alert.alert('Em breve', 'Edição de proprietário será implementada em breve');
  };

  const handleExcluir = (proprietario) => {
    Alert.alert(
      'Excluir Proprietário',
      `Tem certeza que deseja excluir ${proprietario.nome}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Em breve', 'Exclusão será implementada em breve');
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={commonStyles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={commonStyles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={commonStyles.textPrimary} />
          </TouchableOpacity>
          <Text style={commonStyles.headerTitle}>Gerenciar Proprietários</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={commonStyles.loadingContainer}>
          <ActivityIndicator size="large" color={commonStyles.primaryColor} />
          <Text style={commonStyles.loadingText}>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={commonStyles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={commonStyles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={commonStyles.textPrimary} />
        </TouchableOpacity>
        <Text style={commonStyles.headerTitle}>Gerenciar Proprietários</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('CadastroProprietario', { returnTo: 'GerenciarProprietarios' })}
        >
          <Ionicons name="add" size={24} color={commonStyles.primaryColor} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {proprietarios.length === 0 ? (
          <View style={commonStyles.emptyContainer}>
            <Ionicons name="person-outline" size={64} color={commonStyles.textLight} />
            <Text style={commonStyles.emptyText}>Nenhum proprietário cadastrado</Text>
            <TouchableOpacity
              style={[commonStyles.button, { marginTop: 20 }]}
              onPress={() => navigation.navigate('CadastroProprietario', { returnTo: 'GerenciarProprietarios' })}
            >
              <Text style={commonStyles.buttonText}>Cadastrar Primeiro Proprietário</Text>
            </TouchableOpacity>
          </View>
        ) : (
          proprietarios.map((proprietario) => (
            <View key={proprietario.id} style={commonStyles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardInfo}>
                  <Ionicons name="person" size={24} color={commonStyles.primaryColor} />
                  <View style={styles.cardText}>
                    <Text style={styles.cardTitle}>{proprietario.nome}</Text>
                    {proprietario.cpf && (
                      <Text style={styles.cardSubtitle}>CPF: {proprietario.cpf}</Text>
                    )}
                    {proprietario.telefone && (
                      <Text style={styles.cardSubtitle}>Tel: {proprietario.telefone}</Text>
                    )}
                  </View>
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleEditar(proprietario)}
                  >
                    <Ionicons name="create-outline" size={20} color={commonStyles.secondaryColor} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleExcluir(proprietario)}
                  >
                    <Ionicons name="trash-outline" size={20} color={commonStyles.dangerColor} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardText: {
    marginLeft: 12,
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: commonStyles.textPrimary,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: commonStyles.textSecondary,
    marginTop: 2,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    padding: 8,
  },
});

