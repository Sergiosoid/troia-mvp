/**
 * Tela de Busca Global
 * Busca inteligente em veículos, manutenções e abastecimentos
 */

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { buscarGlobal } from '../services/api';
import { commonStyles } from '../constants/styles';
import HeaderBar from '../components/HeaderBar';
import FiltroBuscaModal from '../components/FiltroBuscaModal';
import { getErrorMessage } from '../utils/errorMessages';

const SPACING = 16;
const HISTORICO_KEY = '@busca_historico';
const MAX_HISTORICO = 5;

export default function BuscarScreen({ navigation }) {
  const [termo, setTermo] = useState('');
  const [resultados, setResultados] = useState({ veiculos: [], manutencoes: [], abastecimentos: [] });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filtros, setFiltros] = useState({});
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [historico, setHistorico] = useState([]);
  const [mostrarSugestoes, setMostrarSugestoes] = useState(true);
  const insets = useSafeAreaInsets();

  // Carregar histórico ao montar
  useEffect(() => {
    carregarHistorico();
  }, []);

  // Debounce para busca
  useEffect(() => {
    if (termo.trim().length === 0) {
      setResultados({ veiculos: [], manutencoes: [], abastecimentos: [] });
      setMostrarSugestoes(true);
      return;
    }

    const timeoutId = setTimeout(() => {
      realizarBusca(termo.trim());
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [termo, filtros]);

  const carregarHistorico = async () => {
    try {
      const historicoStr = await AsyncStorage.getItem(HISTORICO_KEY);
      if (historicoStr) {
        const historicoArray = JSON.parse(historicoStr);
        setHistorico(Array.isArray(historicoArray) ? historicoArray.slice(0, MAX_HISTORICO) : []);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  };

  const salvarNoHistorico = async (termoBusca) => {
    if (!termoBusca || termoBusca.trim().length === 0) return;

    try {
      const historicoStr = await AsyncStorage.getItem(HISTORICO_KEY);
      let historicoArray = historicoStr ? JSON.parse(historicoStr) : [];
      
      // Remover duplicatas e adicionar no início
      historicoArray = historicoArray.filter(item => item !== termoBusca);
      historicoArray.unshift(termoBusca);
      
      // Limitar tamanho
      historicoArray = historicoArray.slice(0, MAX_HISTORICO);
      
      await AsyncStorage.setItem(HISTORICO_KEY, JSON.stringify(historicoArray));
      setHistorico(historicoArray);
    } catch (error) {
      console.error('Erro ao salvar histórico:', error);
    }
  };

  const realizarBusca = async (termoBusca, isRefresh = false) => {
    if (!termoBusca || termoBusca.trim().length === 0) {
      setResultados({ veiculos: [], manutencoes: [], abastecimentos: [] });
      return;
    }

    try {
      if (!isRefresh) {
        setLoading(true);
      }
      setMostrarSugestoes(false);

      const dados = await buscarGlobal(termoBusca, filtros);
      setResultados(dados);

      // Salvar no histórico
      await salvarNoHistorico(termoBusca);
    } catch (error) {
      console.error('Erro ao buscar:', error);
      setResultados({ veiculos: [], manutencoes: [], abastecimentos: [] });
      if (!isRefresh && termo.trim().length > 0) {
        Alert.alert('Ops!', getErrorMessage(error));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    realizarBusca(termo.trim(), true);
  };

  const aplicarFiltros = (novosFiltros) => {
    setFiltros(novosFiltros);
  };

  const limparBusca = () => {
    setTermo('');
    setResultados({ veiculos: [], manutencoes: [], abastecimentos: [] });
    setFiltros({});
    setMostrarSugestoes(true);
  };

  const usarHistorico = (termoHistorico) => {
    setTermo(termoHistorico);
    setMostrarSugestoes(false);
  };

  const formatarData = (data) => {
    if (!data) return '';
    try {
      const date = new Date(data);
      return date.toLocaleDateString('pt-BR');
    } catch {
      return data;
    }
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor || 0);
  };

  const totalResultados = resultados.veiculos.length + resultados.manutencoes.length + resultados.abastecimentos.length;

  return (
    <View style={commonStyles.container}>
      <HeaderBar title="Buscar" navigation={navigation} />

      {/* Barra de Busca */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar veículos, manutenções, abastecimentos..."
            placeholderTextColor="#999"
            value={termo}
            onChangeText={setTermo}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {termo.length > 0 && (
            <TouchableOpacity onPress={limparBusca} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          onPress={() => setMostrarFiltros(true)}
          style={styles.filterButton}
        >
          <Ionicons name="options-outline" size={24} color="#4CAF50" />
          {Object.keys(filtros).length > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{Object.keys(filtros).length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Sugestões / Histórico */}
      {mostrarSugestoes && termo.length === 0 && (
        <View style={styles.sugestoesContainer}>
          {historico.length > 0 && (
            <View style={styles.sugestoesSection}>
              <Text style={styles.sugestoesTitle}>Buscas Recentes</Text>
              {historico.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.sugestaoItem}
                  onPress={() => usarHistorico(item)}
                >
                  <Ionicons name="time-outline" size={20} color="#666" />
                  <Text style={styles.sugestaoText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Loading */}
      {loading && !refreshing && (
        <View style={commonStyles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={commonStyles.loadingText}>Buscando...</Text>
        </View>
      )}

      {/* Resultados */}
      {!loading && !mostrarSugestoes && (
        <ScrollView
          style={commonStyles.scrollContainer}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 20 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#4CAF50']}
              tintColor="#4CAF50"
            />
          }
        >
          {totalResultados === 0 ? (
            <View style={commonStyles.emptyContainer}>
              <Ionicons name="search-outline" size={64} color="#ccc" />
              <Text style={styles.emptyTitle}>Nenhum resultado encontrado</Text>
              <Text style={styles.emptySubtext}>
                Tente usar termos diferentes ou ajustar os filtros para encontrar o que procura.
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.resultsHeader}>
                <Text style={styles.resultsCount}>
                  {totalResultados} resultado{totalResultados !== 1 ? 's' : ''} encontrado{totalResultados !== 1 ? 's' : ''}
                </Text>
              </View>

              {/* Veículos */}
              {resultados.veiculos.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Veículos ({resultados.veiculos.length})</Text>
                  {resultados.veiculos.map(veiculo => (
                    <TouchableOpacity
                      key={veiculo.id}
                      style={styles.resultCard}
                      onPress={() => navigation.navigate('VeiculoHistorico', { veiculoId: veiculo.id })}
                    >
                      <Ionicons name="car-outline" size={24} color="#4CAF50" />
                      <View style={styles.resultContent}>
                        <Text style={styles.resultTitle}>
                          {veiculo.modelo || 'Veículo'} {veiculo.ano ? `(${veiculo.ano})` : ''}
                        </Text>
                        <Text style={styles.resultSubtitle}>
                          {veiculo.placa || 'Sem placa'} • {veiculo.km_atual || 0} km
                        </Text>
                        {veiculo.proprietario_nome && (
                          <Text style={styles.resultDetail}>Proprietário: {veiculo.proprietario_nome}</Text>
                        )}
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#999" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Manutenções */}
              {resultados.manutencoes.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Manutenções ({resultados.manutencoes.length})</Text>
                  {resultados.manutencoes.map(manutencao => (
                    <TouchableOpacity
                      key={manutencao.id}
                      style={styles.resultCard}
                      onPress={() => navigation.navigate('VeiculoHistorico', { veiculoId: manutencao.veiculo_id })}
                    >
                      <Ionicons name="construct-outline" size={24} color="#2196F3" />
                      <View style={styles.resultContent}>
                        <Text style={styles.resultTitle}>{manutencao.descricao || 'Manutenção'}</Text>
                        <Text style={styles.resultSubtitle}>
                          {manutencao.veiculo_placa} • {formatarData(manutencao.data)}
                        </Text>
                        <Text style={styles.resultDetail}>
                          {formatarMoeda(manutencao.valor)} • {manutencao.tipo_manutencao || 'N/A'}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#999" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Abastecimentos */}
              {resultados.abastecimentos.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Abastecimentos ({resultados.abastecimentos.length})</Text>
                  {resultados.abastecimentos.map(abastecimento => (
                    <TouchableOpacity
                      key={abastecimento.id}
                      style={styles.resultCard}
                      onPress={() => navigation.navigate('RegistrarAbastecimento', { 
                        veiculoId: abastecimento.veiculo_id,
                        modoVisualizar: true,
                        abastecimentoId: abastecimento.id,
                      })}
                    >
                      <Ionicons name="car-sport-outline" size={24} color="#FF9800" />
                      <View style={styles.resultContent}>
                        <Text style={styles.resultTitle}>
                          {abastecimento.posto || 'Posto não informado'}
                        </Text>
                        <Text style={styles.resultSubtitle}>
                          {abastecimento.veiculo_placa} • {formatarData(abastecimento.data)}
                        </Text>
                        <Text style={styles.resultDetail}>
                          {abastecimento.litros?.toFixed(2) || 0}L • {formatarMoeda(abastecimento.valor_total)}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#999" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}

      {/* Modal de Filtros */}
      <FiltroBuscaModal
        visible={mostrarFiltros}
        onClose={() => setMostrarFiltros(false)}
        filtros={filtros}
        onAplicar={aplicarFiltros}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    padding: SPACING,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    gap: SPACING / 2,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: SPACING,
    gap: SPACING / 2,
  },
  searchIcon: {
    marginRight: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: commonStyles.textPrimary,
    paddingVertical: SPACING / 2,
  },
  clearButton: {
    padding: 4,
  },
  filterButton: {
    padding: SPACING / 2,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#dc3545',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  sugestoesContainer: {
    padding: SPACING,
  },
  sugestoesSection: {
    marginBottom: SPACING,
  },
  sugestoesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: commonStyles.textPrimary,
    marginBottom: SPACING / 2,
  },
  sugestaoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: SPACING / 2,
    gap: SPACING / 2,
  },
  sugestaoText: {
    fontSize: 14,
    color: commonStyles.textPrimary,
    flex: 1,
  },
  scrollContent: {
    padding: SPACING,
  },
  resultsHeader: {
    marginBottom: SPACING,
  },
  resultsCount: {
    fontSize: 14,
    color: commonStyles.textSecondary,
    fontWeight: '500',
  },
  section: {
    marginBottom: SPACING * 1.5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: commonStyles.textPrimary,
    marginBottom: SPACING,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: SPACING,
    marginBottom: SPACING / 2,
    ...commonStyles.shadow,
    gap: SPACING,
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: commonStyles.textPrimary,
    marginBottom: 4,
  },
  resultSubtitle: {
    fontSize: 14,
    color: commonStyles.textSecondary,
    marginBottom: 2,
  },
  resultDetail: {
    fontSize: 12,
    color: '#999',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: commonStyles.textPrimary,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: commonStyles.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
    lineHeight: 20,
  },
});

