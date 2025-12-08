/**
 * Tela de Gerenciamento de Veículos
 * Lista, edita e exclui veículos
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
import { listarVeiculosComTotais } from '../services/api';
import { commonStyles } from '../constants/styles';

export default function GerenciarVeiculosScreen({ navigation }) {
  const [veiculos, setVeiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      carregarVeiculos();
    }, [])
  );

  const carregarVeiculos = async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      }
      const dados = await listarVeiculosComTotais();
      setVeiculos(Array.isArray(dados) ? dados : []);
    } catch (error) {
      console.error('Erro ao carregar veículos:', error);
      setVeiculos([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    carregarVeiculos(true);
  };

  const handleEditar = (veiculo) => {
    Alert.alert('Em breve', 'Edição de veículo será implementada em breve');
  };

  const handleExcluir = (veiculo) => {
    Alert.alert(
      'Excluir Veículo',
      `Tem certeza que deseja excluir o veículo ${veiculo.placa}?`,
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

  const formatarValor = (valor) => {
    if (!valor) return 'R$ 0,00';
    return `R$ ${parseFloat(valor).toFixed(2).replace('.', ',')}`;
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
          <Text style={commonStyles.headerTitle}>Gerenciar Veículos</Text>
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
        <Text style={commonStyles.headerTitle}>Gerenciar Veículos</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('CadastroVeiculo', { returnTo: 'GerenciarVeiculos' })}
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
        {veiculos.length === 0 ? (
          <View style={commonStyles.emptyContainer}>
            <Ionicons name="car-outline" size={64} color={commonStyles.textLight} />
            <Text style={commonStyles.emptyText}>Nenhum veículo cadastrado</Text>
            <TouchableOpacity
              style={[commonStyles.button, { marginTop: 20 }]}
              onPress={() => navigation.navigate('CadastroVeiculo', { returnTo: 'GerenciarVeiculos' })}
            >
              <Text style={commonStyles.buttonText}>Cadastrar Primeiro Veículo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          veiculos.map((veiculo) => (
            <View key={veiculo.id} style={commonStyles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardInfo}>
                  <Ionicons name="car" size={24} color={commonStyles.primaryColor} />
                  <View style={styles.cardText}>
                    <Text style={styles.cardTitle}>{veiculo.placa}</Text>
                    {veiculo.modelo && (
                      <Text style={styles.cardSubtitle}>{veiculo.modelo} {veiculo.ano ? `- ${veiculo.ano}` : ''}</Text>
                    )}
                    {veiculo.totalGasto && (
                      <Text style={styles.cardValue}>Total gasto: {formatarValor(veiculo.totalGasto)}</Text>
                    )}
                  </View>
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('VeiculoHistorico', { veiculoId: veiculo.id })}
                  >
                    <Ionicons name="eye-outline" size={20} color={commonStyles.secondaryColor} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleEditar(veiculo)}
                  >
                    <Ionicons name="create-outline" size={20} color={commonStyles.secondaryColor} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleExcluir(veiculo)}
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
  cardValue: {
    fontSize: 14,
    color: commonStyles.primaryColor,
    fontWeight: '600',
    marginTop: 4,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    padding: 8,
  },
});

