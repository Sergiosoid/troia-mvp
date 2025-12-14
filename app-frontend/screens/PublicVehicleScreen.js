import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import HeaderBar from '../components/HeaderBar';
import { commonStyles } from '../constants/styles';
import { buscarVeiculoCompartilhado } from '../services/api';
import { getErrorMessage } from '../utils/errorMessages';

export default function PublicVehicleScreen({ navigation, route }) {
  const { token } = route?.params || {};
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();

  const carregarDados = async () => {
    if (!token) {
      Alert.alert('Ops!', 'Token de compartilhamento inválido');
      navigation.goBack();
      return;
    }

    try {
      setLoading(true);
      const resultado = await buscarVeiculoCompartilhado(token);
      setDados(resultado);
    } catch (error) {
      console.error('Erro ao carregar veículo compartilhado:', error);
      Alert.alert('Ops!', getErrorMessage(error));
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      carregarDados();
    }, [token])
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

  const formatarMoeda = (valor) => {
    if (!valor || valor === null || valor === undefined) return 'Valor não disponível';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  };

  const formatarKm = (km) => {
    if (!km) return 'N/A';
    return parseInt(km).toLocaleString('pt-BR');
  };

  const getOrigemLabel = (origem) => {
    const labels = {
      manual: 'Manual',
      ocr: 'OCR (Foto)',
      abastecimento: 'Abastecimento',
    };
    return labels[origem] || origem || 'Manual';
  };

  if (loading) {
    return (
      <View style={commonStyles.container}>
        <HeaderBar title="Histórico Técnico" navigation={navigation} />
        <View style={commonStyles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={commonStyles.loadingText}>Carregando dados...</Text>
        </View>
      </View>
    );
  }

  if (!dados || !dados.veiculo) {
    return (
      <View style={commonStyles.container}>
        <HeaderBar title="Histórico Técnico" navigation={navigation} />
        <View style={commonStyles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>Veículo não encontrado</Text>
          <Text style={styles.emptySubtext}>
            O link de compartilhamento pode estar inválido ou expirado.
          </Text>
        </View>
      </View>
    );
  }

  const { veiculo, manutencoes = [], km_historico = [] } = dados;

  return (
    <View style={commonStyles.container}>
      <HeaderBar title="Histórico Técnico" navigation={navigation} />

      {/* Badge de visualização pública */}
      <View style={styles.publicBadge}>
        <Ionicons name="eye-outline" size={16} color="#2196F3" />
        <Text style={styles.publicBadgeText}>Visualização Pública - Apenas Leitura</Text>
      </View>

      <ScrollView
        style={commonStyles.scrollContainer}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
      >
        {/* Informações do Veículo */}
        <View style={styles.veiculoInfo}>
          <Text style={styles.veiculoPlaca}>{veiculo.placa || 'N/A'}</Text>
          <Text style={styles.veiculoModelo}>
            {veiculo.marca || ''} {veiculo.modelo || ''} {veiculo.ano || ''}
          </Text>
          <View style={styles.veiculoDetails}>
            <View style={styles.detailItem}>
              <Ionicons name="speedometer-outline" size={16} color="#666" />
              <Text style={styles.detailText}>{formatarKm(veiculo.km_atual)} km</Text>
            </View>
            {veiculo.tipo_veiculo && (
              <View style={styles.detailItem}>
                <Ionicons name="car-outline" size={16} color="#666" />
                <Text style={styles.detailText}>{veiculo.tipo_veiculo}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Histórico de KM */}
        {km_historico.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Histórico de KM</Text>
            {km_historico.slice(0, 10).map((registro) => (
              <View key={registro.id} style={commonStyles.card}>
                <View style={styles.kmRegistroHeader}>
                  <View style={styles.kmRegistroLeft}>
                    <Text style={styles.kmRegistroData}>
                      {formatarData(registro.data_registro || registro.criado_em)}
                    </Text>
                    <Text style={styles.kmRegistroOrigem}>
                      {getOrigemLabel(registro.origem)}
                    </Text>
                  </View>
                  <Text style={styles.kmRegistroKm}>
                    {formatarKm(registro.km)} km
                  </Text>
                </View>
              </View>
            ))}
            {km_historico.length > 10 && (
              <Text style={styles.moreText}>
                +{km_historico.length - 10} registros anteriores
              </Text>
            )}
          </View>
        )}

        {/* Histórico de Manutenções */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Manutenções ({manutencoes.length})
          </Text>

          {manutencoes.length === 0 ? (
            <View style={commonStyles.emptyContainer}>
              <Ionicons name="construct-outline" size={64} color="#ccc" />
              <Text style={styles.emptyTitle}>Nenhuma manutenção registrada</Text>
            </View>
          ) : (
            manutencoes.map((manutencao) => (
              <View key={manutencao.id} style={commonStyles.card}>
                <View style={styles.manutencaoHeader}>
                  <View style={styles.manutencaoLeft}>
                    <Text style={styles.manutencaoData}>
                      {formatarData(manutencao.data)}
                    </Text>
                    {manutencao.tipo && (
                      <View style={styles.tipoBadge}>
                        <Text style={styles.tipoText}>{manutencao.tipo}</Text>
                      </View>
                    )}
                  </View>
                </View>

                {manutencao.descricao && (
                  <Text style={styles.manutencaoDescricao}>{manutencao.descricao}</Text>
                )}

                <View style={styles.manutencaoDetails}>
                  {manutencao.km_antes && (
                    <Text style={styles.manutencaoKm}>
                      KM: {formatarKm(manutencao.km_antes)}
                      {manutencao.km_depois && ` → ${formatarKm(manutencao.km_depois)}`}
                    </Text>
                  )}
                  {manutencao.tipo_manutencao && (
                    <Text style={styles.manutencaoTipo}>
                      {manutencao.tipo_manutencao}
                      {manutencao.area_manutencao && ` - ${manutencao.area_manutencao}`}
                    </Text>
                  )}
                </View>

                {manutencao.imagem_url && (
                  <View style={styles.imagemContainer}>
                    <Image
                      source={{ uri: manutencao.imagem_url }}
                      style={styles.imagem}
                      resizeMode="cover"
                    />
                  </View>
                )}

                <View style={styles.privacidadeBadge}>
                  <Ionicons name="lock-closed-outline" size={12} color="#999" />
                  <Text style={styles.privacidadeText}>
                    Valores e observações não são exibidos nesta visualização pública
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
  },
  publicBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e3f2fd',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#bbdefb',
  },
  publicBadgeText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '600',
    marginLeft: 6,
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
    marginBottom: 12,
  },
  veiculoDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  kmRegistroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  kmRegistroLeft: {
    flex: 1,
  },
  kmRegistroData: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  kmRegistroOrigem: {
    fontSize: 12,
    color: '#999',
  },
  kmRegistroKm: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  manutencaoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  manutencaoLeft: {
    flex: 1,
  },
  manutencaoData: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  manutencaoDescricao: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  manutencaoDetails: {
    marginBottom: 8,
  },
  manutencaoKm: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  manutencaoTipo: {
    fontSize: 14,
    color: '#666',
  },
  tipoBadge: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  tipoText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '500',
  },
  imagemContainer: {
    marginTop: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  imagem: {
    width: '100%',
    height: 200,
    backgroundColor: '#f5f5f5',
  },
  privacidadeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbe6',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#ffc107',
  },
  privacidadeText: {
    fontSize: 11,
    color: '#856404',
    marginLeft: 6,
    flex: 1,
  },
  moreText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
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

