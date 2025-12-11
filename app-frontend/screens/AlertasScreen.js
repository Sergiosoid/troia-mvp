/**
 * Tela de Alertas de Manutenção
 * Exibe alertas automáticos baseados em KM e tempo
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { buscarAlertas } from '../services/api';
import { commonStyles } from '../constants/styles';
import HeaderBar from '../components/HeaderBar';

const SPACING = 16;

export default function AlertasScreen({ navigation }) {
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();

  const carregarAlertas = async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      }
      const dados = await buscarAlertas();
      setAlertas(Array.isArray(dados) ? dados : []);
    } catch (error) {
      console.error('Erro ao carregar alertas:', error);
      setAlertas([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    carregarAlertas();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      carregarAlertas(true);
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    carregarAlertas(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'vermelho':
        return '#F44336';
      case 'amarelo':
        return '#FFC107';
      case 'verde':
        return '#4CAF50';
      default:
        return '#666';
    }
  };

  const getStatusIcon = (tipo) => {
    if (tipo.includes('Óleo') || tipo.includes('oleo')) {
      return 'water-outline';
    }
    if (tipo.includes('Revisão') || tipo.includes('revisao')) {
      return 'build-outline';
    }
    return 'warning-outline';
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

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={commonStyles.container} edges={['top']}>
        <HeaderBar title="Alertas de Manutenção" navigation={navigation} />
        <View style={commonStyles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={commonStyles.loadingText}>Carregando alertas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const totalAlertas = alertas.reduce((total, veiculo) => total + veiculo.alertas.length, 0);
  const alertasVermelhos = alertas.reduce(
    (total, veiculo) => total + veiculo.alertas.filter(a => a.status === 'vermelho').length,
    0
  );
  const alertasAmarelos = alertas.reduce(
    (total, veiculo) => total + veiculo.alertas.filter(a => a.status === 'amarelo').length,
    0
  );

  return (
    <SafeAreaView style={commonStyles.container} edges={['top']}>
      <HeaderBar title="Alertas de Manutenção" navigation={navigation} />

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
        {/* Resumo de Alertas */}
        {totalAlertas > 0 && (
          <View style={styles.resumoCard}>
            <View style={styles.resumoHeader}>
              <Ionicons name="warning-outline" size={24} color="#333" />
              <Text style={styles.resumoTitle}>Resumo</Text>
            </View>
            <View style={styles.resumoStats}>
              {alertasVermelhos > 0 && (
                <View style={styles.resumoItem}>
                  <View style={[styles.resumoBadge, { backgroundColor: '#F44336' }]} />
                  <Text style={styles.resumoText}>{alertasVermelhos} Urgente</Text>
                </View>
              )}
              {alertasAmarelos > 0 && (
                <View style={styles.resumoItem}>
                  <View style={[styles.resumoBadge, { backgroundColor: '#FFC107' }]} />
                  <Text style={styles.resumoText}>{alertasAmarelos} Atenção</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Lista de Alertas por Veículo */}
        {alertas.length === 0 ? (
          <View style={commonStyles.emptyContainer}>
            <Ionicons name="checkmark-circle-outline" size={64} color="#4CAF50" />
            <Text style={commonStyles.emptyText}>
              Nenhum alerta de manutenção no momento
            </Text>
            <Text style={styles.emptySubtext}>
              Todos os seus veículos estão em dia com as manutenções
            </Text>
          </View>
        ) : (
          alertas.map((veiculo) => (
            <View key={veiculo.veiculoId} style={styles.veiculoSection}>
              <Text style={styles.veiculoNome}>{veiculo.veiculoNome}</Text>
              
              {veiculo.alertas.map((alerta, index) => {
                const statusColor = getStatusColor(alerta.status);
                const iconName = getStatusIcon(alerta.tipo);

                return (
                  <View
                    key={index}
                    style={[
                      styles.alertaCard,
                      { borderLeftColor: statusColor, borderLeftWidth: 4 },
                    ]}
                  >
                    <View style={styles.alertaHeader}>
                      <View style={styles.alertaHeaderLeft}>
                        <View style={[styles.alertaIconContainer, { backgroundColor: `${statusColor}20` }]}>
                          <Ionicons name={iconName} size={24} color={statusColor} />
                        </View>
                        <View style={styles.alertaInfo}>
                          <Text style={styles.alertaTipo}>{alerta.tipo}</Text>
                          <View style={styles.alertaStatusBadge}>
                            <View style={[styles.alertaStatusDot, { backgroundColor: statusColor }]} />
                            <Text style={[styles.alertaStatusText, { color: statusColor }]}>
                              {alerta.status === 'vermelho' ? 'Urgente' : 
                               alerta.status === 'amarelo' ? 'Atenção' : 'Em dia'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    <View style={styles.alertaDetalhes}>
                      {alerta.faltaKm > 0 && (
                        <View style={styles.alertaDetalheItem}>
                          <Ionicons name="speedometer-outline" size={16} color="#666" />
                          <Text style={styles.alertaDetalheText}>
                            Faltam {alerta.faltaKm.toLocaleString('pt-BR')} km
                          </Text>
                        </View>
                      )}
                      
                      {alerta.faltaMeses > 0 && (
                        <View style={styles.alertaDetalheItem}>
                          <Ionicons name="calendar-outline" size={16} color="#666" />
                          <Text style={styles.alertaDetalheText}>
                            Faltam {alerta.faltaMeses} meses
                          </Text>
                        </View>
                      )}

                      {alerta.faltaKm <= 0 && alerta.faltaMeses <= 0 && (
                        <View style={styles.alertaDetalheItem}>
                          <Ionicons name="warning-outline" size={16} color="#F44336" />
                          <Text style={[styles.alertaDetalheText, { color: '#F44336', fontWeight: '600' }]}>
                            Manutenção vencida!
                          </Text>
                        </View>
                      )}

                      {alerta.ultimoServicoData && (
                        <View style={styles.alertaDetalheItem}>
                          <Ionicons name="time-outline" size={16} color="#666" />
                          <Text style={styles.alertaDetalheText}>
                            Último serviço: {formatarData(alerta.ultimoServicoData)}
                            {alerta.ultimoServicoKm && ` (${alerta.ultimoServicoKm.toLocaleString('pt-BR')} km)`}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: SPACING,
  },
  resumoCard: {
    ...commonStyles.card,
    marginBottom: SPACING,
    padding: SPACING,
  },
  resumoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING,
  },
  resumoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: commonStyles.textPrimary,
    marginLeft: SPACING / 2,
  },
  resumoStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING,
  },
  resumoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING / 2,
  },
  resumoBadge: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  resumoText: {
    fontSize: 14,
    color: commonStyles.textSecondary,
  },
  veiculoSection: {
    marginBottom: SPACING * 1.5,
  },
  veiculoNome: {
    fontSize: 16,
    fontWeight: '600',
    color: commonStyles.textPrimary,
    marginBottom: SPACING / 2,
    paddingHorizontal: SPACING / 2,
  },
  alertaCard: {
    ...commonStyles.card,
    marginBottom: SPACING,
    padding: SPACING,
  },
  alertaHeader: {
    marginBottom: SPACING,
  },
  alertaHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertaIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING,
  },
  alertaInfo: {
    flex: 1,
  },
  alertaTipo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: commonStyles.textPrimary,
    marginBottom: SPACING / 4,
  },
  alertaStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING / 4,
  },
  alertaStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  alertaStatusText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  alertaDetalhes: {
    gap: SPACING / 2,
  },
  alertaDetalheItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING / 2,
  },
  alertaDetalheText: {
    fontSize: 14,
    color: commonStyles.textSecondary,
  },
  emptySubtext: {
    fontSize: 14,
    color: commonStyles.textSecondary,
    textAlign: 'center',
    marginTop: SPACING / 2,
    paddingHorizontal: SPACING,
  },
});

