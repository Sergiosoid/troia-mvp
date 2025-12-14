import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HeaderBar from '../components/HeaderBar';
import { commonStyles } from '../constants/styles';
import { buscarTimeline, buscarVeiculoPorId } from '../services/api';
import { getErrorMessage } from '../utils/errorMessages';

export default function TimelineVeiculoScreen({ navigation, route }) {
  const { veiculoId } = route?.params || {};
  const [veiculo, setVeiculo] = useState(null);
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();

  const carregarDados = async () => {
    if (!veiculoId) {
      Alert.alert('Ops!', 'Veículo não identificado');
      navigation.goBack();
      return;
    }

    try {
      setLoading(true);

      // Buscar dados do veículo
      const veiculoData = await buscarVeiculoPorId(veiculoId);
      if (veiculoData) {
        setVeiculo(veiculoData);
      }

      // Buscar timeline
      const timelineData = await buscarTimeline(veiculoId);
      setEventos(Array.isArray(timelineData) ? timelineData : []);
    } catch (error) {
      console.error('Erro ao carregar timeline:', error);
      Alert.alert('Ops!', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      carregarDados();
    }, [veiculoId])
  );

  const formatarData = (data) => {
    if (!data) return 'Data não informada';
    try {
      const date = new Date(data);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return data;
    }
  };

  const formatarKm = (km) => {
    if (!km && km !== 0) return null;
    return parseInt(km).toLocaleString('pt-BR');
  };

  const getTipoIcon = (tipo) => {
    switch (tipo) {
      case 'km':
        return 'speedometer-outline';
      case 'manutencao':
        return 'construct-outline';
      case 'transferencia':
        return 'swap-horizontal-outline';
      default:
        return 'ellipse-outline';
    }
  };

  const getTipoColor = (tipo) => {
    switch (tipo) {
      case 'km':
        return '#2196F3';
      case 'manutencao':
        return '#4CAF50';
      case 'transferencia':
        return '#FF9800';
      default:
        return '#666';
    }
  };

  const getOrigemLabel = (origem) => {
    const labels = {
      manual: 'Manual',
      ocr: 'OCR',
      abastecimento: 'Abastecimento',
      aquisicao: 'Aquisição',
      venda: 'Venda',
    };
    return labels[origem] || origem || '';
  };

  if (loading) {
    return (
      <View style={commonStyles.container}>
        <HeaderBar title="Linha do Tempo" navigation={navigation} />
        <View style={commonStyles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={commonStyles.loadingText}>Carregando timeline...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={commonStyles.container}>
      <HeaderBar title="Linha do Tempo" navigation={navigation} />

      <ScrollView 
        style={commonStyles.scrollContainer}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 20 }}
      >
        {/* Microcopy de Confiança */}
        <View style={styles.confiancaBanner}>
          <Ionicons name="shield-checkmark-outline" size={16} color="#666" />
          <Text style={styles.confiancaText}>
            Registros técnicos são preservados e não podem ser alterados após criação.
          </Text>
        </View>

        {/* Informações do Veículo */}
        {veiculo && (
          <View style={styles.veiculoInfo}>
            <Text style={styles.veiculoPlaca}>{veiculo.placa || 'N/A'}</Text>
            {veiculo.marca && veiculo.modelo && (
              <Text style={styles.veiculoModelo}>
                {veiculo.marca} {veiculo.modelo} {veiculo.ano ? `(${veiculo.ano})` : ''}
              </Text>
            )}
          </View>
        )}

        {/* Timeline */}
        {eventos.length === 0 ? (
          <View style={commonStyles.emptyContainer}>
            <Ionicons name="time-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>Nenhum evento registrado</Text>
            <Text style={styles.emptySubtext}>
              Ainda não há eventos na linha do tempo deste veículo.
            </Text>
          </View>
        ) : (
          <View style={styles.timelineContainer}>
            {eventos.map((evento, index) => {
              const tipoIcon = getTipoIcon(evento.tipo);
              const tipoColor = getTipoColor(evento.tipo);
              const isLast = index === eventos.length - 1;

              return (
                <View key={evento.id} style={styles.timelineItem}>
                  {/* Linha vertical */}
                  {!isLast && <View style={[styles.timelineLine, { backgroundColor: tipoColor }]} />}

                  {/* Ícone do evento */}
                  <View style={[styles.timelineIconContainer, { backgroundColor: tipoColor }]}>
                    <Ionicons name={tipoIcon} size={20} color="#fff" />
                  </View>

                  {/* Conteúdo do evento */}
                  <View style={styles.timelineContent}>
                    <View style={styles.eventoHeader}>
                      <Text style={styles.eventoData}>{formatarData(evento.data)}</Text>
                      {evento.origem && (
                        <View style={styles.origemBadge}>
                          <Text style={styles.origemText}>{getOrigemLabel(evento.origem)}</Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.eventoDescricao}>{evento.descricao}</Text>

                    {/* KM relacionado */}
                    {evento.km_relacionado !== null && evento.km_relacionado !== undefined && (
                      <View style={styles.kmInfo}>
                        <Ionicons name="speedometer-outline" size={14} color="#666" />
                        <Text style={styles.kmText}>
                          {formatarKm(evento.km_relacionado)} km
                        </Text>
                      </View>
                    )}

                    {/* Valor (apenas para manutenções com valor) */}
                    {evento.tipo === 'manutencao' && evento.valor !== null && evento.valor !== undefined && (
                      <View style={styles.valorInfo}>
                        <Ionicons name="cash-outline" size={14} color="#4CAF50" />
                        <Text style={styles.valorText}>
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(evento.valor)}
                        </Text>
                      </View>
                    )}

                    {/* Badges */}
                    <View style={styles.badgesContainer}>
                      {evento.isHerdado && (
                        <View style={styles.badgeHerdado}>
                          <Ionicons name="time-outline" size={12} color="#666" />
                          <Text style={styles.badgeText}>Herdado</Text>
                        </View>
                      )}
                      {evento.isProprietarioAnterior && (
                        <View style={styles.badgeAnterior}>
                          <Ionicons name="arrow-back-outline" size={12} color="#666" />
                          <Text style={styles.badgeText}>Período anterior</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  veiculoInfo: {
    backgroundColor: '#fff',
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  veiculoPlaca: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  veiculoModelo: {
    fontSize: 14,
    color: '#666',
  },
  timelineContainer: {
    position: 'relative',
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 24,
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    left: 15,
    top: 40,
    width: 2,
    height: '100%',
    opacity: 0.3,
  },
  timelineIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  timelineContent: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  eventoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  eventoData: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  origemBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  origemText: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
  },
  eventoDescricao: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
    marginBottom: 8,
  },
  kmInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  kmText: {
    fontSize: 13,
    color: '#666',
  },
  valorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  valorText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 6,
  },
  badgeHerdado: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  badgeAnterior: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
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
  confiancaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  confiancaText: {
    fontSize: 12,
    color: '#666',
    flex: 1,
    lineHeight: 16,
  },
});

