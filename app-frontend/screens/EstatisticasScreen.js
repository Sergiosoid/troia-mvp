/**
 * Tela de Estatísticas Avançadas
 * Exibe gráficos de consumo, gastos, KM e manutenções
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { buscarEstatisticas } from '../services/api';
import { commonStyles } from '../constants/styles';
import HeaderBar from '../components/HeaderBar';

const SPACING = 16;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - (SPACING * 2);

const chartConfig = {
  backgroundColor: '#ffffff',
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  decimalPlaces: 2,
  color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: '6',
    strokeWidth: '2',
    stroke: '#4CAF50',
  },
};

export default function EstatisticasScreen({ route, navigation }) {
  const { veiculoId } = route?.params || {};
  const [activeTab, setActiveTab] = useState('consumo');
  const [estatisticas, setEstatisticas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();

  const tabs = [
    { id: 'consumo', label: 'Consumo', icon: 'leaf-outline' },
    { id: 'gastos', label: 'Gastos', icon: 'wallet-outline' },
    { id: 'km', label: 'KM Rodados', icon: 'speedometer-outline' },
    { id: 'manutencoes', label: 'Manutenções', icon: 'construct-outline' },
  ];

  const carregarEstatisticas = async (isRefresh = false) => {
    if (!veiculoId) {
      setLoading(false);
      return;
    }

    try {
      if (!isRefresh) {
        setLoading(true);
      }
      const dados = await buscarEstatisticas(veiculoId);
      setEstatisticas(dados);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      setEstatisticas(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    carregarEstatisticas();
  }, [veiculoId]);

  useFocusEffect(
    React.useCallback(() => {
      carregarEstatisticas(true);
    }, [veiculoId])
  );

  const onRefresh = () => {
    setRefreshing(true);
    carregarEstatisticas(true);
  };

  const formatarData = (data) => {
    if (!data) return '';
    try {
      const date = new Date(data);
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    } catch {
      return data;
    }
  };

  const formatarMes = (mes, ano) => {
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${meses[mes - 1]}/${ano}`;
  };

  const renderConsumoChart = () => {
    if (!estatisticas?.consumo || estatisticas.consumo.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="leaf-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Nenhum dado de consumo disponível</Text>
        </View>
      );
    }

    const dadosComConsumo = estatisticas.consumo.filter(item => item.consumo !== null);
    
    if (dadosComConsumo.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="leaf-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Dados insuficientes para calcular consumo</Text>
        </View>
      );
    }

    const labels = dadosComConsumo.map(item => formatarData(item.data));
    const data = dadosComConsumo.map(item => item.consumo);

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Consumo Médio (km/l)</Text>
        <LineChart
          data={{
            labels: labels.length > 10 ? labels.slice(-10) : labels,
            datasets: [
              {
                data: data.length > 10 ? data.slice(-10) : data,
              },
            ],
          }}
          width={CHART_WIDTH}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
          yAxisSuffix=" km/l"
          segments={4}
        />
        <View style={styles.chartInfo}>
          <Text style={styles.chartInfoText}>
            Média: {(data.reduce((a, b) => a + b, 0) / data.length).toFixed(2)} km/l
          </Text>
        </View>
      </View>
    );
  };

  const renderGastosChart = () => {
    if (!estatisticas?.gastosMensais || estatisticas.gastosMensais.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="wallet-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Nenhum dado de gastos disponível</Text>
        </View>
      );
    }

    const labels = estatisticas.gastosMensais.map(item => formatarMes(item.mes, item.ano));
    const data = estatisticas.gastosMensais.map(item => item.total);

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Gastos Mensais (R$)</Text>
        <BarChart
          data={{
            labels: labels.length > 12 ? labels.slice(-12) : labels,
            datasets: [
              {
                data: data.length > 12 ? data.slice(-12) : data,
              },
            ],
          }}
          width={CHART_WIDTH}
          height={220}
          chartConfig={{
            ...chartConfig,
            color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
          }}
          style={styles.chart}
          yAxisLabel="R$ "
          yAxisSuffix=""
          segments={4}
          showValuesOnTopOfBars
        />
        <View style={styles.chartInfo}>
          <Text style={styles.chartInfoText}>
            Total: R$ {data.reduce((a, b) => a + b, 0).toFixed(2)}
          </Text>
        </View>
      </View>
    );
  };

  const renderKmChart = () => {
    if (!estatisticas?.kmRodados || estatisticas.kmRodados.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="speedometer-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Nenhum dado de KM disponível</Text>
        </View>
      );
    }

    const labels = estatisticas.kmRodados.map(item => formatarData(item.data));
    const data = estatisticas.kmRodados.map(item => item.km);

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>KM Rodados</Text>
        <LineChart
          data={{
            labels: labels.length > 20 ? labels.slice(-20) : labels,
            datasets: [
              {
                data: data.length > 20 ? data.slice(-20) : data,
              },
            ],
          }}
          width={CHART_WIDTH}
          height={220}
          chartConfig={{
            ...chartConfig,
            color: (opacity = 1) => `rgba(255, 152, 0, ${opacity})`,
          }}
          style={styles.chart}
          yAxisSuffix=" km"
          segments={4}
          bezier
        />
        {data.length > 0 && (
          <View style={styles.chartInfo}>
            <Text style={styles.chartInfoText}>
              KM Atual: {data[data.length - 1].toLocaleString('pt-BR')} km
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderManutencoesChart = () => {
    if (!estatisticas?.manutencoesDistribuicao || estatisticas.manutencoesDistribuicao.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="construct-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Nenhuma manutenção cadastrada</Text>
        </View>
      );
    }

    const colors = ['#4CAF50', '#2196F3', '#FF9800', '#F44336', '#9C27B0', '#00BCD4'];
    const data = estatisticas.manutencoesDistribuicao.map((item, index) => ({
      name: item.tipo,
      population: item.total,
      color: colors[index % colors.length],
      legendFontColor: '#333',
      legendFontSize: 12,
    }));

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Distribuição de Manutenções</Text>
        <PieChart
          data={data}
          width={CHART_WIDTH}
          height={220}
          chartConfig={chartConfig}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          style={styles.chart}
        />
        <View style={styles.chartInfo}>
          <Text style={styles.chartInfoText}>
            Total: {data.reduce((a, b) => a + b.population, 0)} manutenções
          </Text>
        </View>
      </View>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'consumo':
        return renderConsumoChart();
      case 'gastos':
        return renderGastosChart();
      case 'km':
        return renderKmChart();
      case 'manutencoes':
        return renderManutencoesChart();
      default:
        return null;
    }
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={commonStyles.container} edges={['top']}>
        <HeaderBar title="Estatísticas" navigation={navigation} />
        <View style={commonStyles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={commonStyles.loadingText}>Carregando estatísticas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={commonStyles.container} edges={['top']}>
      <HeaderBar title="Estatísticas" navigation={navigation} />

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
      >
        {tabs.map(tab => (
          <View
            key={tab.id}
            style={[
              styles.tab,
              activeTab === tab.id && styles.tabActive,
            ]}
          >
            <Ionicons
              name={tab.icon}
              size={20}
              color={activeTab === tab.id ? '#4CAF50' : '#666'}
            />
            <Text
              style={[
                styles.tabLabel,
                activeTab === tab.id && styles.tabLabelActive,
              ]}
            >
              {tab.label}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Conteúdo do Gráfico */}
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
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tabsContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabsContent: {
    paddingHorizontal: SPACING / 2,
    paddingVertical: SPACING / 2,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING,
    paddingVertical: SPACING / 2,
    marginHorizontal: SPACING / 4,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    gap: SPACING / 2,
  },
  tabActive: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  tabLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  scrollContent: {
    padding: SPACING,
  },
  chartContainer: {
    ...commonStyles.card,
    padding: SPACING,
    marginBottom: SPACING,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: commonStyles.textPrimary,
    marginBottom: SPACING,
    textAlign: 'center',
  },
  chart: {
    marginVertical: SPACING / 2,
    borderRadius: 16,
  },
  chartInfo: {
    marginTop: SPACING,
    paddingTop: SPACING,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  chartInfoText: {
    fontSize: 14,
    color: commonStyles.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  emptyContainer: {
    ...commonStyles.emptyContainer,
    paddingVertical: SPACING * 3,
  },
  emptyText: {
    ...commonStyles.emptyText,
    marginTop: SPACING,
  },
});

