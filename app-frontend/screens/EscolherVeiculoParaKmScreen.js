/**
 * Tela para Escolher Veículo para Atualizar KM
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
import { Ionicons } from '@expo/vector-icons';
import { listarVeiculosComTotais } from '../services/api';
import { commonStyles } from '../constants/styles';
import HeaderBar from '../components/HeaderBar';

export default function EscolherVeiculoParaKmScreen({ navigation }) {
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
    navigation.navigate('AtualizarKm', { veiculoId: veiculo.id });
  };

  if (loading) {
    return (
      <View style={commonStyles.container}>
        <HeaderBar title="Escolher Veículo" navigation={navigation} />
        <View style={commonStyles.loadingContainer}>
          <ActivityIndicator size="large" color={commonStyles.primaryColor} />
          <Text style={commonStyles.loadingText}>Carregando veículos...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={commonStyles.container}>
      <HeaderBar title="Escolher Veículo" navigation={navigation} />

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
                  {veiculo.km_atual && (
                    <Text style={styles.cardKm}>
                      KM: {veiculo.km_atual.toLocaleString('pt-BR')}
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={24} color={commonStyles.textSecondary} />
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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
    marginBottom: 2,
  },
  cardKm: {
    fontSize: 12,
    color: commonStyles.textSecondary,
    fontStyle: 'italic',
  },
});

