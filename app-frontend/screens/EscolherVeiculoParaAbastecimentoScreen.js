/**
 * Tela para Escolher Veículo para Abastecimento
 * Similar à tela de escolher veículo para manutenção
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { listarVeiculosComTotais } from '../services/api';
import { commonStyles } from '../constants/styles';

export default function EscolherVeiculoParaAbastecimentoScreen({ navigation }) {
  const [veiculos, setVeiculos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarVeiculos();
  }, []);

  const carregarVeiculos = async () => {
    try {
      setLoading(true);
      const dados = await listarVeiculosComTotais();
      setVeiculos(Array.isArray(dados) ? dados : []);
    } catch (error) {
      console.error('Erro ao carregar veículos:', error);
      Alert.alert('Erro', 'Não foi possível carregar os veículos');
      setVeiculos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelecionarVeiculo = (veiculo) => {
    navigation.navigate('RegistrarAbastecimento', { veiculoId: veiculo.id });
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
          <Text style={commonStyles.headerTitle}>Escolher Veículo</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={commonStyles.loadingContainer}>
          <ActivityIndicator size="large" color={commonStyles.primaryColor} />
          <Text style={commonStyles.loadingText}>Carregando veículos...</Text>
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
        <Text style={commonStyles.headerTitle}>Escolher Veículo</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        {veiculos.length === 0 ? (
          <View style={commonStyles.emptyContainer}>
            <Ionicons name="car-outline" size={64} color={commonStyles.textLight} />
            <Text style={commonStyles.emptyText}>Nenhum veículo cadastrado</Text>
            <TouchableOpacity
              style={[commonStyles.button, { marginTop: 20 }]}
              onPress={() => navigation.navigate('CadastroVeiculo')}
            >
              <Text style={commonStyles.buttonText}>Cadastrar Veículo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          veiculos.map((veiculo) => (
            <TouchableOpacity
              key={veiculo.id}
              style={commonStyles.card}
              onPress={() => handleSelecionarVeiculo(veiculo)}
            >
              <View style={styles.cardContent}>
                <Ionicons name="car" size={32} color={commonStyles.primaryColor} />
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>{veiculo.placa}</Text>
                  {veiculo.modelo && (
                    <Text style={styles.cardSubtitle}>
                      {veiculo.modelo} {veiculo.ano ? `- ${veiculo.ano}` : ''}
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={24} color={commonStyles.textSecondary} />
              </View>
            </TouchableOpacity>
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
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardText: {
    flex: 1,
    marginLeft: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: commonStyles.textPrimary,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: commonStyles.textSecondary,
  },
});

