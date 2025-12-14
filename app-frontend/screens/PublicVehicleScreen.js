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
import { buscarVeiculoCompartilhado, aceitarVeiculoCompartilhado } from '../services/api';
import { getErrorMessage } from '../utils/errorMessages';
import { isUserLoggedIn } from '../utils/authStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ActionButton from '../components/ActionButton';

const API_URL = 'https://troia-mvp.onrender.com';

export default function PublicVehicleScreen({ navigation, route }) {
  const { token } = route?.params || {};
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState(null);
  const [mostrarModalAceitar, setMostrarModalAceitar] = useState(false);
  const [aceitando, setAceitando] = useState(false);
  const insets = useSafeAreaInsets();

  const verificarLogin = async () => {
    try {
      const loggedIn = await isUserLoggedIn();
      setIsLoggedIn(loggedIn);
      if (loggedIn) {
        const id = await AsyncStorage.getItem('userId');
        setUserId(id);
      }
      return loggedIn;
    } catch (error) {
      console.error('Erro ao verificar login:', error);
      setIsLoggedIn(false);
      return false;
    }
  };

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
      await verificarLogin();
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

  const formatarDataHora = (data) => {
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

  const handleAceitarVeiculo = async () => {
    if (!token) {
      Alert.alert('Erro', 'Token de compartilhamento inválido');
      return;
    }

    try {
      setAceitando(true);
      const resultado = await aceitarVeiculoCompartilhado(token);
      
      // Salvar contexto para onboarding
      await AsyncStorage.setItem('onboarding_context', 'veiculo_aceito');
      
      // Navegar para onboarding contextual
      navigation.replace('OnboardingContextual', {
        contexto: 'veiculo_aceito',
        veiculoId: resultado.veiculo?.id || dados?.veiculo?.id,
      });
    } catch (error) {
      console.error('Erro ao aceitar veículo:', error);
      Alert.alert('Erro', getErrorMessage(error));
    } finally {
      setAceitando(false);
    }
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

      {/* Botão de aceitar veículo (se logado e não for proprietário) */}
      {isLoggedIn && dados?.veiculo && (
        <View style={styles.aceitarContainer}>
          <ActionButton
            onPress={() => setMostrarModalAceitar(true)}
            label="Aceitar este veículo"
            icon="checkmark-circle-outline"
            color="#4CAF50"
            style={styles.aceitarButton}
          />
        </View>
      )}

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

        {/* Linha do Tempo de KM */}
        {km_historico.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Linha do Tempo de KM ({km_historico.length} {km_historico.length === 1 ? 'registro' : 'registros'})
            </Text>
            <View style={styles.timelineContainer}>
              {km_historico.map((registro, index) => {
                const kmAnterior = index < km_historico.length - 1 
                  ? parseInt(km_historico[index + 1].km) 
                  : null;
                const kmAtual = parseInt(registro.km) || 0;
                const kmRodado = kmAnterior ? kmAtual - kmAnterior : null;
                const isLast = index === 0;

                return (
                  <View key={registro.id} style={styles.timelineItem}>
                    {/* Linha conectora */}
                    {!isLast && <View style={styles.timelineLine} />}
                    
                    {/* Ponto na linha do tempo */}
                    <View style={[styles.timelineDot, { backgroundColor: getOrigemColor(registro.origem) }]}>
                      <Ionicons 
                        name={getOrigemIcon(registro.origem)} 
                        size={12} 
                        color="#fff" 
                      />
                    </View>

                    {/* Conteúdo do registro */}
                    <View style={[commonStyles.card, styles.timelineCard]}>
                      <View style={styles.kmRegistroHeader}>
                        <View style={styles.kmRegistroLeft}>
                          <View style={[styles.origemBadge, { backgroundColor: `${getOrigemColor(registro.origem)}20` }]}>
                            <Ionicons 
                              name={getOrigemIcon(registro.origem)} 
                              size={14} 
                              color={getOrigemColor(registro.origem)} 
                            />
                            <Text style={[styles.origemText, { color: getOrigemColor(registro.origem) }]}>
                              {getOrigemLabel(registro.origem)}
                            </Text>
                          </View>
                          <Text style={styles.kmRegistroData}>
                            {formatarDataHora(registro.data_registro || registro.criado_em)}
                          </Text>
                        </View>
                        <View style={styles.kmRegistroRight}>
                          <Text style={styles.kmRegistroKm}>
                            {formatarKm(registro.km)} km
                          </Text>
                          {kmRodado !== null && kmRodado > 0 && (
                            <Text style={styles.kmRegistroRodado}>
                              +{formatarKm(kmRodado)} km
                            </Text>
                          )}
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
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
            manutencoes.map((manutencao, index) => {
              // Todas as manutenções em visualização pública são consideradas "herdadas" 
              // pois não mostram valores privados
              const isHerdada = true; // Sempre true em visualização pública

              return (
                <View 
                  key={manutencao.id} 
                  style={[commonStyles.card, isHerdada && styles.cardHerdada]}
                >
                  <View style={styles.manutencaoHeader}>
                    <View style={styles.manutencaoLeft}>
                      {/* Badge de manutenção herdada */}
                      {isHerdada && (
                        <View style={styles.herdadaBadge}>
                          <Ionicons name="time-outline" size={12} color="#666" />
                          <Text style={styles.herdadaText}>
                            Manutenção herdada
                          </Text>
                        </View>
                      )}
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
                      <View style={styles.manutencaoKmContainer}>
                        <Ionicons name="speedometer-outline" size={16} color="#666" />
                        <Text style={styles.manutencaoKm}>
                          KM: {formatarKm(manutencao.km_antes)}
                          {manutencao.km_depois && ` → ${formatarKm(manutencao.km_depois)}`}
                        </Text>
                      </View>
                    )}
                    {manutencao.tipo_manutencao && (
                      <View style={styles.manutencaoTipoContainer}>
                        <Ionicons name="construct-outline" size={16} color="#666" />
                        <Text style={styles.manutencaoTipo}>
                          {manutencao.tipo_manutencao}
                          {manutencao.area_manutencao && ` - ${manutencao.area_manutencao}`}
                        </Text>
                      </View>
                    )}
                  </View>

                  {manutencao.imagem_url && (
                    <View style={styles.imagemContainer}>
                      <Image
                        source={{ uri: manutencao.imagem_url.includes('http') ? manutencao.imagem_url : `${API_URL}/uploads/${manutencao.imagem_url}` }}
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
              );
            })
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
  timelineContainer: {
    position: 'relative',
    paddingLeft: 20,
  },
  timelineItem: {
    position: 'relative',
    marginBottom: 16,
  },
  timelineLine: {
    position: 'absolute',
    left: 9,
    top: 24,
    width: 2,
    height: '100%',
    backgroundColor: '#e0e0e0',
    zIndex: 0,
  },
  timelineDot: {
    position: 'absolute',
    left: 0,
    top: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    borderWidth: 2,
    borderColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  timelineCard: {
    marginLeft: 30,
    marginTop: 0,
  },
  kmRegistroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  kmRegistroLeft: {
    flex: 1,
  },
  kmRegistroRight: {
    alignItems: 'flex-end',
  },
  kmRegistroData: {
    fontSize: 13,
    color: '#666',
    marginTop: 6,
  },
  kmRegistroKm: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  kmRegistroRodado: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 4,
    fontWeight: '500',
  },
  origemBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  origemText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
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
    gap: 8,
  },
  manutencaoKmContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  manutencaoKm: {
    fontSize: 14,
    color: '#666',
  },
  manutencaoTipoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  manutencaoTipo: {
    fontSize: 14,
    color: '#666',
  },
  cardHerdada: {
    borderLeftWidth: 4,
    borderLeftColor: '#ffa726',
    opacity: 0.95,
  },
  herdadaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbe6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 6,
    alignSelf: 'flex-start',
  },
  herdadaText: {
    fontSize: 10,
    color: '#666',
    marginLeft: 4,
    fontWeight: '500',
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
  aceitarContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  aceitarButton: {
    width: '100%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalScroll: {
    maxHeight: 400,
  },
  avisoAceite: {
    padding: 20,
    alignItems: 'center',
  },
  avisoAceiteTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF9800',
    marginTop: 12,
    marginBottom: 16,
  },
  avisoAceiteText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  listaAviso: {
    width: '100%',
    marginBottom: 16,
  },
  itemAviso: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  avisoAceiteFinal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc3545',
    textAlign: 'center',
    marginTop: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#f5f5f5',
  },
  modalButtonCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  modalButtonConfirm: {
    flex: 1,
  },
});

