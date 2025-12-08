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
  Platform,
  SafeAreaView
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { listarVeiculosComTotais, calcularTotalGeral } from '../services/api';
import { commonStyles } from '../constants/styles';

const SPACING = 16; // Espaçamento padrão de 16

export default function HomeDashboardScreen({ navigation, route }) {
  const [veiculos, setVeiculos] = useState([]);
  const [totalGeral, setTotalGeral] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const carregarDados = async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      }
      
      const veiculosData = await listarVeiculosComTotais();
      setVeiculos(Array.isArray(veiculosData) ? veiculosData : []);
      
      const total = await calcularTotalGeral();
      setTotalGeral(total || 0);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      const errorMessage = error.message?.includes('indisponível')
        ? error.message
        : error.message?.includes('autenticado')
        ? 'Sessão expirada. Faça login novamente.'
        : 'Não foi possível carregar os dados. Verifique sua conexão.';
      
      if (!isRefresh) {
        Alert.alert('Erro', errorMessage);
      }
      
      setVeiculos([]);
      setTotalGeral(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Carregar dados ao montar
  useEffect(() => {
    carregarDados();
  }, []);

  // Refresh automático quando voltar com refresh:true
  useFocusEffect(
    React.useCallback(() => {
      if (route?.params?.refresh) {
        carregarDados(true);
        navigation.setParams({ refresh: false });
      }
    }, [route?.params?.refresh])
  );

  // Pull-to-refresh
  const onRefresh = () => {
    setRefreshing(true);
    carregarDados(true);
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
  };

  const formatarData = (data) => {
    if (!data) return 'Nunca';
    try {
      const date = new Date(data);
      return date.toLocaleDateString('pt-BR');
    } catch {
      return data;
    }
  };

  // Tela de loading dedicada
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={commonStyles.container} edges={['top']}>
        <View style={commonStyles.header}>
          <Text style={commonStyles.headerTitle}>Manutenções</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Configuracoes')}
            style={commonStyles.backButton}
          >
            <Ionicons name="settings-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>
        <View style={commonStyles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={commonStyles.loadingText}>Carregando seus veículos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={commonStyles.container} edges={['top']}>
      {/* Header com Configurações */}
      <View style={commonStyles.header}>
        <Text style={commonStyles.headerTitle}>Manutenções</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Configuracoes')}
          style={commonStyles.backButton}
        >
          <Ionicons name="settings-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={commonStyles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4CAF50']}
            tintColor="#4CAF50"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Card de Total Geral */}
        <View style={styles.totalCard}>
          <View style={styles.totalCardHeader}>
            <Ionicons name="wallet-outline" size={24} color="#fff" />
            <Text style={styles.totalCardTitle}>Total Geral</Text>
          </View>
          <Text style={styles.totalCardValue}>{formatarMoeda(totalGeral)}</Text>
          <Text style={styles.totalCardSubtitle}>
            {veiculos.length} {veiculos.length === 1 ? 'veículo' : 'veículos'} cadastrado{veiculos.length !== 1 ? 's' : ''}
          </Text>
          <TouchableOpacity
            style={styles.reportButton}
            onPress={() => Alert.alert('Em breve', 'Relatório geral será implementado em breve')}
          >
            <Ionicons name="document-text-outline" size={18} color="#fff" />
            <Text style={styles.reportButtonText}>Ver Relatório Geral</Text>
          </TouchableOpacity>
        </View>

        {/* Cards de Veículos */}
        <Text style={commonStyles.sectionTitle}>Meus Veículos</Text>
        
        {veiculos.length === 0 ? (
          <View style={commonStyles.emptyContainer}>
            <Ionicons name="car-outline" size={64} color="#ccc" />
            <Text style={commonStyles.emptyText}>Nenhum veículo cadastrado</Text>
            <TouchableOpacity
              style={[commonStyles.button, { marginTop: SPACING }]}
              onPress={() => navigation.navigate('CadastroProprietario')}
            >
              <Ionicons name="add-circle-outline" size={20} color="#fff" />
              <Text style={[commonStyles.buttonText, { marginLeft: SPACING / 2 }]}>
                Cadastrar Primeiro Veículo
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          veiculos.map((veiculo) => (
            <TouchableOpacity
              key={veiculo.id}
              style={commonStyles.card}
              onPress={() => navigation.navigate('VeiculoHistorico', { veiculoId: veiculo.id })}
            >
              {/* Header do Card */}
              <View style={styles.veiculoCardHeader}>
                <View style={styles.veiculoCardHeaderLeft}>
                  <View style={styles.veiculoPlacaRow}>
                    <Ionicons name="car-outline" size={20} color="#4CAF50" />
                    <Text style={styles.veiculoPlaca}>{veiculo.placa || 'N/A'}</Text>
                  </View>
                  {veiculo.proprietarioNome && (
                    <View style={styles.veiculoProprietarioRow}>
                      <Ionicons name="person-outline" size={16} color="#666" />
                      <Text style={styles.veiculoProprietario}>
                        {veiculo.proprietarioNome}
                      </Text>
                    </View>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={24} color="#666" />
              </View>
              
              {/* Body do Card */}
              <View style={styles.veiculoCardBody}>
                {/* Total Gasto */}
                <View style={styles.veiculoInfoRow}>
                  <View style={styles.veiculoInfoLabelRow}>
                    <Ionicons name="cash-outline" size={18} color="#4CAF50" />
                    <Text style={styles.veiculoLabel}>Total Gasto:</Text>
                  </View>
                  <Text style={styles.veiculoValue}>
                    {formatarMoeda(parseFloat(veiculo.totalGasto) || 0)}
                  </Text>
                </View>
                
                {/* Última Manutenção */}
                <View style={styles.veiculoInfoRow}>
                  <View style={styles.veiculoInfoLabelRow}>
                    <Ionicons name="calendar-outline" size={18} color="#666" />
                    <Text style={styles.veiculoLabel}>Última Manutenção:</Text>
                  </View>
                  <Text style={styles.veiculoValue}>
                    {formatarData(veiculo.ultimaData)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Botão Flutuante de Nova Manutenção */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('EscolherVeiculoParaManutencao')}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: Platform.OS === 'android' ? SPACING * 3 : SPACING * 2, // Espaço para FAB
  },
  totalCard: {
    backgroundColor: '#4CAF50',
    margin: SPACING,
    padding: SPACING * 1.5,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  totalCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING,
  },
  totalCardTitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginLeft: SPACING / 2,
    fontWeight: '600',
  },
  totalCardValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: SPACING / 2,
  },
  totalCardSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    marginBottom: SPACING,
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: SPACING / 2,
    borderRadius: 8,
  },
  reportButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: SPACING / 2,
  },
  veiculoCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING,
  },
  veiculoCardHeaderLeft: {
    flex: 1,
  },
  veiculoPlacaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING / 2,
  },
  veiculoPlaca: {
    fontSize: 24,
    fontWeight: 'bold',
    color: commonStyles.textPrimary,
    marginLeft: SPACING / 2,
  },
  veiculoProprietarioRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  veiculoProprietario: {
    fontSize: 14,
    color: commonStyles.textSecondary,
    marginLeft: SPACING / 2,
  },
  veiculoCardBody: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: SPACING,
    marginTop: SPACING / 2,
  },
  veiculoInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING,
  },
  veiculoInfoLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  veiculoLabel: {
    fontSize: 14,
    color: commonStyles.textSecondary,
    marginLeft: SPACING / 2,
  },
  veiculoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: commonStyles.textPrimary,
  },
  fab: {
    position: 'absolute',
    right: SPACING,
    bottom: SPACING,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
