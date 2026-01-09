import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import DashboardSummaryCard from '../components/DashboardSummaryCard';
import FABMenu from '../components/FABMenu';
import VehicleCard from '../components/VehicleCard';
import { commonStyles } from '../constants/styles';
import { buscarAlertas, buscarResumoDashboard, calcularTotalGeral, listarVeiculosComTotais } from '../services/api';
import { getErrorMessage } from '../utils/errorMessages';

const SPACING = 16; // Espaçamento padrão de 16

export default function HomeDashboardScreen({ navigation, route }) {
  const [veiculos, setVeiculos] = useState([]);
  const [totalGeral, setTotalGeral] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [resumoDashboard, setResumoDashboard] = useState(null);
  const [loadingResumo, setLoadingResumo] = useState(true);
  const [alertas, setAlertas] = useState([]);
  const insets = useSafeAreaInsets();

  const carregarDados = async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
        setLoadingResumo(true);
      }
      
      // Carregar dados em paralelo com fallback individual
      console.log('[DIAGNÓSTICO HomeDashboard] Iniciando carregamento de dados...');
      const resultados = await Promise.allSettled([
        listarVeiculosComTotais(),
        calcularTotalGeral(),
        buscarResumoDashboard(),
        buscarAlertas(),
      ]);
      
      console.log('[DIAGNÓSTICO HomeDashboard] Resultados Promise.allSettled:', {
        veiculos: {
          status: resultados[0].status,
          value: resultados[0].status === 'fulfilled' ? resultados[0].value : resultados[0].reason,
          isArray: resultados[0].status === 'fulfilled' ? Array.isArray(resultados[0].value) : false
        },
        totalGeral: {
          status: resultados[1].status,
          value: resultados[1].status === 'fulfilled' ? resultados[1].value : resultados[1].reason
        },
        resumoDashboard: {
          status: resultados[2].status,
          value: resultados[2].status === 'fulfilled' ? resultados[2].value : resultados[2].reason,
          tipo: resultados[2].status === 'fulfilled' ? typeof resultados[2].value : 'N/A',
          keys: resultados[2].status === 'fulfilled' && typeof resultados[2].value === 'object' 
            ? Object.keys(resultados[2].value) 
            : 'N/A'
        },
        alertas: {
          status: resultados[3].status,
          value: resultados[3].status === 'fulfilled' ? resultados[3].value : resultados[3].reason,
          isArray: resultados[3].status === 'fulfilled' ? Array.isArray(resultados[3].value) : false
        }
      });
      
      // Processar resultados com fallback seguro
      // IMPORTANTE: Nunca bloquear renderização - sempre ter valores padrão
      const veiculosData = resultados[0].status === 'fulfilled' ? resultados[0].value : [];
      const total = resultados[1].status === 'fulfilled' ? resultados[1].value : 0;
      const resumo = resultados[2].status === 'fulfilled' ? resultados[2].value : null;
      const alertasData = resultados[3].status === 'fulfilled' ? resultados[3].value : [];
      
      console.log('[DIAGNÓSTICO HomeDashboard] Dados processados antes de setState:', {
        veiculosData: {
          tipo: typeof veiculosData,
          isArray: Array.isArray(veiculosData),
          length: Array.isArray(veiculosData) ? veiculosData.length : 'N/A',
          valor: veiculosData
        },
        total: {
          tipo: typeof total,
          valor: total
        },
        resumo: {
          tipo: typeof resumo,
          isNull: resumo === null,
          valor: resumo,
          stringified: JSON.stringify(resumo, null, 2)
        },
        alertasData: {
          tipo: typeof alertasData,
          isArray: Array.isArray(alertasData),
          length: Array.isArray(alertasData) ? alertasData.length : 'N/A',
          valor: alertasData
        }
      });
      
      setVeiculos(Array.isArray(veiculosData) ? veiculosData : []);
      setTotalGeral(total || 0);
      // Fallback seguro: se resumo falhar, usar estrutura vazia com valores padrão
      // IMPORTANTE: Garantir que os campos estejam mapeados corretamente do backend
      const resumoFinal = resumo ? {
        gasto30dias: typeof resumo.gasto30dias === 'number' && !isNaN(resumo.gasto30dias) ? resumo.gasto30dias : 0,
        consumoMedio: (typeof resumo.consumoMedio === 'number' && !isNaN(resumo.consumoMedio) && resumo.consumoMedio > 0) 
          ? resumo.consumoMedio 
          : null,
        litrosMes: typeof resumo.litrosMes === 'number' && !isNaN(resumo.litrosMes) ? resumo.litrosMes : 0,
        manutencaoProxima: resumo.manutencaoProxima || null
      } : {
        gasto30dias: 0,
        consumoMedio: null,
        litrosMes: 0,
        manutencaoProxima: null
      };
      console.log('[DIAGNÓSTICO HomeDashboard] Resumo final que será setado:', JSON.stringify(resumoFinal, null, 2));
      setResumoDashboard(resumoFinal);
      setAlertas(Array.isArray(alertasData) ? alertasData : []);
      
      // Log de erros individuais (sem bloquear)
      resultados.forEach((resultado, index) => {
        if (resultado.status === 'rejected') {
          const nomes = ['veículos', 'total geral', 'resumo dashboard', 'alertas'];
          console.error(`Erro ao carregar ${nomes[index]}:`, resultado.reason);
        }
      });
    } catch (error) {
      // Erro geral (muito raro com Promise.allSettled)
      console.error('Erro geral ao carregar dados:', error);
      
      if (!isRefresh) {
        Alert.alert('Ops!', getErrorMessage(error));
      }
      
      // Fallback seguro - nunca deixar null para evitar quebras
      setVeiculos([]);
      setTotalGeral(0);
      setResumoDashboard({
        gasto30dias: 0,
        consumoMedio: null,
        litrosMes: 0,
        manutencaoProxima: null
      });
      setAlertas([]);
      console.log('[DIAGNÓSTICO HomeDashboard] Erro capturado - usando fallback seguro');
    } finally {
      setLoading(false);
      setLoadingResumo(false);
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
      <SafeAreaView style={commonStyles.container} edges={[]}>
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <View style={styles.topBarPlaceholder} />
          <TouchableOpacity
            onPress={() => navigation.navigate('Configuracoes')}
            style={styles.topBarButton}
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
    <SafeAreaView style={commonStyles.container} edges={[]}>
      {/* Top Bar sem título - apenas ícones */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <View style={styles.topBarPlaceholder} />
        <View style={styles.topBarButtons}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Buscar')}
            style={styles.topBarButton}
          >
            <Ionicons name="search-outline" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('Configuracoes')}
            style={styles.topBarButton}
          >
            <Ionicons name="settings-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>
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
        {/* Dashboard Summary Cards - Foco em dados financeiros e operacionais */}
        <DashboardSummaryCard
          gasto30dias={resumoDashboard?.gasto30dias ?? 0}
          consumoMedio={resumoDashboard?.consumoMedio ?? null}
          litrosMes={resumoDashboard?.litrosMes ?? 0}
          manutencaoProxima={resumoDashboard?.manutencaoProxima ?? null}
          loading={loadingResumo}
        />

        {/* Card de Alertas */}
        {alertas.length > 0 && alertas.some(v => 
          v.alertas.some(a => a.status === 'vermelho' || a.status === 'amarelo')
        ) && (
          <TouchableOpacity
            style={styles.alertasCard}
            onPress={() => navigation.navigate('Alertas')}
            activeOpacity={0.8}
          >
            <View style={styles.alertasCardContent}>
              <View style={styles.alertasCardHeader}>
                <Ionicons name="warning" size={24} color="#F44336" />
                <Text style={styles.alertasCardTitle}>Há alertas de manutenção</Text>
              </View>
              <Text style={styles.alertasCardSubtitle}>
                {alertas.reduce((total, v) => 
                  total + v.alertas.filter(a => a.status === 'vermelho' || a.status === 'amarelo').length, 
                  0
                )} alerta{alertas.reduce((total, v) => 
                  total + v.alertas.filter(a => a.status === 'vermelho' || a.status === 'amarelo').length, 
                  0
                ) !== 1 ? 's' : ''} requerem atenção
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        )}

        {/* Espaço reservado para anúncios */}
        <View style={styles.adsContainer}>
          <Text style={styles.adsPlaceholder}>
            Espaço reservado para anúncios
          </Text>
        </View>

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
            <Text style={styles.emptyTitle}>Nenhum veículo cadastrado</Text>
            <Text style={styles.emptySubtext}>
              Comece cadastrando seu primeiro veículo para gerenciar manutenções e abastecimentos.
            </Text>
            <TouchableOpacity
              style={[commonStyles.button, { marginTop: 16, width: '90%', alignSelf: 'center', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }]}
              onPress={() => navigation.navigate('CadastroVeiculo')}
            >
              <Ionicons name="add-circle-outline" size={20} color="#fff" />
              <Text 
                style={[commonStyles.buttonText, { marginLeft: 8 }]}
                numberOfLines={1}
                allowFontScaling={false}
              >
                Cadastrar Veículo
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {veiculos.map((veiculo) => (
              <VehicleCard
                key={veiculo.id}
                veiculo={veiculo}
                onPress={() => navigation.navigate('VeiculoHistorico', { veiculoId: veiculo.id })}
                formatarMoeda={formatarMoeda}
                formatarData={formatarData}
              />
            ))}
            
            {/* Botão para adicionar novo veículo */}
            <TouchableOpacity
              style={styles.addVeiculoButton}
              onPress={() => navigation.navigate('CadastroVeiculo')}
            >
              <Ionicons name="add-circle-outline" size={22} color="#fff" />
              <Text style={styles.addVeiculoText}>Adicionar Novo Veículo</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* FAB Menu */}
      <FABMenu navigation={navigation} veiculos={veiculos} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: Platform.OS === 'android' ? SPACING * 8 : SPACING * 6, // Espaço para FAB
  },
  adsContainer: {
    backgroundColor: '#f0f0f0',
    margin: SPACING,
    marginBottom: SPACING / 2,
    padding: SPACING * 1.5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  adsPlaceholder: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  topBarPlaceholder: {
    flex: 1,
  },
  topBarButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  topBarButton: {
    padding: 8,
  },
  addVeiculoButton: {
    backgroundColor: commonStyles.primaryColor,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    margin: SPACING,
    marginTop: SPACING / 2,
    width: '90%',
    alignSelf: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  addVeiculoText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: SPACING / 2,
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
  alertasCard: {
    ...commonStyles.card,
    margin: SPACING,
    marginTop: SPACING / 2,
    padding: SPACING,
    backgroundColor: '#FFF3E0',
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alertasCardContent: {
    flex: 1,
  },
  alertasCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING / 4,
  },
  alertasCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: commonStyles.textPrimary,
    marginLeft: SPACING / 2,
  },
  alertasCardSubtitle: {
    fontSize: 14,
    color: commonStyles.textSecondary,
    marginLeft: SPACING * 2.5,
  },
});
