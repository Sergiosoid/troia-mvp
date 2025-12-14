import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import HeaderBar from '../components/HeaderBar';
import { commonStyles } from '../constants/styles';
import { listarHistoricoKm, buscarVeiculoPorId } from '../services/api';
import { getErrorMessage } from '../utils/errorMessages';

export default function HistoricoKmScreen({ navigation, route }) {
  const { veiculoId } = route?.params || {};
  const [veiculo, setVeiculo] = useState(null);
  const [historico, setHistorico] = useState([]);
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

      // Buscar histórico de KM
      const historicoData = await listarHistoricoKm(veiculoId);
      setHistorico(Array.isArray(historicoData) ? historicoData : []);
    } catch (error) {
      console.error('Erro ao carregar histórico de KM:', error);
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
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return data;
    }
  };

  const getOrigemLabel = (origem) => {
    const labels = {
      manual: 'Manual',
      ocr: 'OCR (Foto)',
      abastecimento: 'Abastecimento',
    };
    return labels[origem] || origem || 'Manual';
  };

  const getOrigemIcon = (origem) => {
    const icons = {
      manual: 'create-outline',
      ocr: 'camera-outline',
      abastecimento: 'water-outline',
    };
    return icons[origem] || 'create-outline';
  };

  const getOrigemColor = (origem) => {
    const colors = {
      manual: '#4CAF50',
      ocr: '#2196F3',
      abastecimento: '#FF9800',
    };
    return colors[origem] || '#666';
  };

  if (loading) {
    return (
      <View style={commonStyles.container}>
        <HeaderBar title="Histórico de KM" navigation={navigation} />
        <View style={commonStyles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={commonStyles.loadingText}>Carregando histórico...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={commonStyles.container}>
      <HeaderBar title="Histórico de KM" navigation={navigation} />

      <ScrollView
        style={commonStyles.scrollContainer}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
      >
        {/* Informações do Veículo */}
        {veiculo && (
          <View style={styles.veiculoInfo}>
            <Text style={styles.veiculoPlaca}>{veiculo.placa || 'N/A'}</Text>
            <Text style={styles.veiculoModelo}>
              {veiculo.marca || ''} {veiculo.modelo || ''} {veiculo.ano || ''}
            </Text>
            <Text style={styles.veiculoKmAtual}>
              KM Atual: {parseInt(veiculo.km_atual) || 0}
            </Text>
          </View>
        )}

        {/* Lista de Histórico */}
        <Text style={commonStyles.sectionTitle}>
          {historico.length} {historico.length === 1 ? 'Registro' : 'Registros'}
        </Text>

        {historico.length === 0 ? (
          <View style={commonStyles.emptyContainer}>
            <Ionicons name="speedometer-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>Nenhum registro de KM</Text>
            <Text style={styles.emptySubtext}>
              O histórico de KM será criado automaticamente quando você atualizar o KM do veículo.
            </Text>
          </View>
        ) : (
          historico.map((registro, index) => {
            const kmAnterior = index < historico.length - 1 
              ? parseInt(historico[index + 1].km) 
              : null;
            const kmAtual = parseInt(registro.km) || 0;
            const kmRodado = kmAnterior ? kmAtual - kmAnterior : null;

            return (
              <View key={registro.id} style={commonStyles.card}>
                <View style={styles.registroHeader}>
                  <View style={styles.registroLeft}>
                    <View style={[styles.origemBadge, { backgroundColor: `${getOrigemColor(registro.origem)}20` }]}>
                      <Ionicons 
                        name={getOrigemIcon(registro.origem)} 
                        size={16} 
                        color={getOrigemColor(registro.origem)} 
                      />
                      <Text style={[styles.origemText, { color: getOrigemColor(registro.origem) }]}>
                        {getOrigemLabel(registro.origem)}
                      </Text>
                    </View>
                    <Text style={styles.registroData}>
                      {formatarData(registro.data_registro || registro.criado_em)}
                    </Text>
                  </View>
                  <View style={styles.registroRight}>
                    <Text style={styles.registroKm}>{kmAtual.toLocaleString('pt-BR')} km</Text>
                    {kmRodado !== null && kmRodado > 0 && (
                      <Text style={styles.registroKmRodado}>
                        +{kmRodado.toLocaleString('pt-BR')} km
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
  },
  veiculoInfo: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  veiculoPlaca: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  veiculoModelo: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  veiculoKmAtual: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4CAF50',
  },
  registroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  registroLeft: {
    flex: 1,
  },
  registroRight: {
    alignItems: 'flex-end',
  },
  origemBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  origemText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  registroData: {
    fontSize: 14,
    color: '#666',
  },
  registroKm: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  registroKmRodado: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 4,
    fontWeight: '500',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

