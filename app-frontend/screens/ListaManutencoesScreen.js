import React, { useState, useEffect } from 'react';
import { 
  ScrollView, 
  View, 
  Text, 
  Image, 
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
import { 
  listarProprietarios, 
  listarVeiculosPorProprietario, 
  listarManutencoesPorVeiculo, 
  buscarVeiculoPorId, 
  API_URL 
} from '../services/api';
import { commonStyles } from '../constants/styles';
import { getErrorMessage } from '../utils/errorMessages';

const SPACING = 16; // Espaçamento padrão de 16

// Função para obter ícone do tipo de manutenção
const getTipoManutencaoIcon = (tipo) => {
  if (!tipo) return 'construct-outline';
  
  const tipoLower = tipo.toLowerCase();
  if (tipoLower.includes('preventiva') || tipoLower === 'preventiva') {
    return 'shield-checkmark-outline';
  }
  if (tipoLower.includes('corretiva') || tipoLower === 'corretiva') {
    return 'warning-outline';
  }
  return 'construct-outline';
};

// Função para obter ícone da área de manutenção
const getAreaManutencaoIcon = (area) => {
  if (!area) return 'settings-outline';
  
  const areaLower = area.toLowerCase();
  if (areaLower.includes('motor') || areaLower.includes('cambio') || areaLower === 'motor_cambio') {
    return 'car-sport-outline';
  }
  if (areaLower.includes('suspensao') || areaLower.includes('freio') || areaLower === 'suspensao_freio') {
    return 'disc-outline';
  }
  if (areaLower.includes('funilaria') || areaLower.includes('pintura') || areaLower === 'funilaria_pintura') {
    return 'color-palette-outline';
  }
  if (areaLower.includes('higienizacao') || areaLower.includes('estetica') || areaLower === 'higienizacao_estetica') {
    return 'sparkles-outline';
  }
  return 'settings-outline';
};

// Função para obter label do tipo de manutenção
const getTipoManutencaoLabel = (tipo) => {
  if (!tipo) return null;
  
  const tipoLower = tipo.toLowerCase();
  if (tipoLower.includes('preventiva') || tipoLower === 'preventiva') {
    return 'Preventiva';
  }
  if (tipoLower.includes('corretiva') || tipoLower === 'corretiva') {
    return 'Corretiva';
  }
  return tipo;
};

// Função para obter label da área de manutenção
const getAreaManutencaoLabel = (area) => {
  if (!area) return null;
  
  const areaLower = area.toLowerCase();
  if (areaLower === 'motor_cambio' || areaLower.includes('motor') || areaLower.includes('cambio')) {
    return 'Motor/Câmbio';
  }
  if (areaLower === 'suspensao_freio' || areaLower.includes('suspensao') || areaLower.includes('freio')) {
    return 'Suspensão/Freio';
  }
  if (areaLower === 'funilaria_pintura' || areaLower.includes('funilaria') || areaLower.includes('pintura')) {
    return 'Funilaria/Pintura';
  }
  if (areaLower === 'higienizacao_estetica' || areaLower.includes('higienizacao') || areaLower.includes('estetica')) {
    return 'Higienização/Estética';
  }
  return area;
};

export default function ListaManutencoesScreen({ navigation, route }) {
  const { veiculoId: veiculoIdParam } = route?.params || {};
  const [proprietarios, setProprietarios] = useState([]);
  const [veiculos, setVeiculos] = useState([]);
  const [proprietarioSelecionado, setProprietarioSelecionado] = useState(null);
  const [veiculoSelecionado, setVeiculoSelecionado] = useState(null);
  const [manutencoes, setManutencoes] = useState([]);
  const [loadingProprietarios, setLoadingProprietarios] = useState(true);
  const [loadingVeiculos, setLoadingVeiculos] = useState(false);
  const [loadingManutencoes, setLoadingManutencoes] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [mostrarProprietarios, setMostrarProprietarios] = useState(false);
  const [mostrarVeiculos, setMostrarVeiculos] = useState(false);

  // Função para carregar manutenções
  const carregarManutencoes = async () => {
    const veiculoFinal = veiculoSelecionado || veiculoIdParam;
    if (veiculoFinal) {
      setLoadingManutencoes(true);
      try {
        const dados = await listarManutencoesPorVeiculo(veiculoFinal);
        setManutencoes(Array.isArray(dados) ? dados : []);
      } catch (error) {
        console.error('Erro ao carregar manutenções:', error);
        setManutencoes([]);
        if (!refreshing) {
          Alert.alert('Ops!', getErrorMessage(error));
        }
      } finally {
        setLoadingManutencoes(false);
        setRefreshing(false);
      }
    } else {
      setManutencoes([]);
      setRefreshing(false);
    }
  };

  // Carregar proprietários ao montar
  useEffect(() => {
    const carregarProprietarios = async () => {
      setLoadingProprietarios(true);
      try {
        const dados = await listarProprietarios();
        setProprietarios(Array.isArray(dados) ? dados : []);
      } catch (error) {
        console.error('Erro ao carregar proprietários:', error);
        setProprietarios([]);
      } finally {
        setLoadingProprietarios(false);
      }
    };
    carregarProprietarios();
  }, []);

  // Carregar veículos quando proprietário for selecionado
  useEffect(() => {
    const carregarVeiculos = async () => {
      if (proprietarioSelecionado) {
        setLoadingVeiculos(true);
        try {
          const dados = await listarVeiculosPorProprietario(proprietarioSelecionado);
          setVeiculos(Array.isArray(dados) ? dados : []);
          setVeiculoSelecionado(null);
          setManutencoes([]);
        } catch (error) {
          console.error('Erro ao carregar veículos:', error);
          setVeiculos([]);
          if (error.message?.includes('indisponível') || error.message?.includes('autenticado')) {
            Alert.alert('Ops!', getErrorMessage(error));
          }
        } finally {
          setLoadingVeiculos(false);
        }
      } else {
        setVeiculos([]);
        setVeiculoSelecionado(null);
        setManutencoes([]);
      }
    };
    carregarVeiculos();
  }, [proprietarioSelecionado]);

  // Se veiculoId vier como parâmetro, selecionar automaticamente
  useEffect(() => {
    if (veiculoIdParam) {
      const buscarProprietarioDoVeiculo = async () => {
        try {
          const veiculo = await buscarVeiculoPorId(veiculoIdParam);
          if (veiculo && veiculo.proprietario_id) {
            setProprietarioSelecionado(veiculo.proprietario_id);
            setVeiculoSelecionado(veiculoIdParam);
          }
        } catch (error) {
          console.error('Erro ao buscar veículo:', error);
        }
      };
      buscarProprietarioDoVeiculo();
    }
  }, [veiculoIdParam]);

  // Carregar manutenções quando veículo for selecionado
  useEffect(() => {
    carregarManutencoes();
  }, [veiculoSelecionado, veiculoIdParam]);

  // Refresh automático quando voltar do CadastroManutencaoScreen
  useFocusEffect(
    React.useCallback(() => {
      if (route?.params?.refresh) {
        carregarManutencoes();
        navigation.setParams({ refresh: false });
      }
    }, [route?.params?.refresh, veiculoSelecionado, veiculoIdParam])
  );

  // Pull-to-refresh
  const onRefresh = () => {
    setRefreshing(true);
    carregarManutencoes();
  };

  const proprietarioSelecionadoObj = proprietarios.find(p => p.id === proprietarioSelecionado);
  const veiculoSelecionadoObj = veiculos.find(v => v.id === veiculoSelecionado);

  const formatarData = (data) => {
    if (!data) return 'Data não informada';
    try {
      const date = new Date(data);
      return date.toLocaleDateString('pt-BR');
    } catch {
      return data;
    }
  };

  const formatarMoeda = (valor) => {
    if (!valor) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(parseFloat(valor));
  };

  return (
    <SafeAreaView style={commonStyles.container} edges={['top']}>
      {/* Header */}
      <View style={commonStyles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={commonStyles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={commonStyles.headerTitle}>Lista de Manutenções</Text>
        <View style={{ width: 40 }} />
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
        {/* Seletor de Proprietário - apenas se não houver veiculoIdParam */}
        {!veiculoIdParam && (
          <View style={commonStyles.card}>
            <Text style={commonStyles.label}>Proprietário</Text>
            {loadingProprietarios ? (
              <ActivityIndicator size="small" color="#4CAF50" style={{ marginVertical: SPACING }} />
            ) : (
              <>
                <TouchableOpacity
                  style={[commonStyles.inputContainer, styles.pickerButton]}
                  onPress={() => {
                    if (proprietarios.length === 0) {
                      Alert.alert('Aviso', 'Nenhum proprietário cadastrado.');
                    } else {
                      setMostrarProprietarios(!mostrarProprietarios);
                    }
                  }}
                >
                  <Ionicons name="person-outline" size={20} color="#666" style={commonStyles.inputIcon} />
                  <Text style={styles.pickerText}>
                    {proprietarioSelecionadoObj
                      ? (proprietarioSelecionadoObj.nome || `Proprietário ${proprietarioSelecionadoObj.id}`)
                      : 'Selecione um proprietário...'}
                  </Text>
                  <Ionicons
                    name={mostrarProprietarios ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>

                {mostrarProprietarios && proprietarios.length > 0 && (
                  <View style={styles.optionsList}>
                    <TouchableOpacity
                      style={styles.optionItem}
                      onPress={() => {
                        setProprietarioSelecionado(null);
                        setMostrarProprietarios(false);
                      }}
                    >
                      <Text style={styles.optionText}>Limpar seleção</Text>
                    </TouchableOpacity>
                    {proprietarios.map(p => (
                      <TouchableOpacity
                        key={p.id}
                        style={[
                          styles.optionItem,
                          proprietarioSelecionado === p.id && styles.optionItemSelected
                        ]}
                        onPress={() => {
                          setProprietarioSelecionado(p.id);
                          setMostrarProprietarios(false);
                        }}
                      >
                        <Text style={styles.optionText}>{p.nome || `Proprietário ${p.id}`}</Text>
                        {proprietarioSelecionado === p.id && (
                          <Ionicons name="checkmark" size={20} color="#4CAF50" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {proprietarios.length === 0 && (
                  <View style={commonStyles.emptyContainer}>
                    <Ionicons name="person-outline" size={48} color="#ccc" />
                    <Text style={commonStyles.emptyText}>Nenhum proprietário cadastrado</Text>
                  </View>
                )}
              </>
            )}
          </View>
        )}

        {/* Seletor de Veículo - apenas se não houver veiculoIdParam */}
        {!veiculoIdParam && proprietarioSelecionado && (
          <View style={commonStyles.card}>
            <Text style={commonStyles.label}>Veículo</Text>
            {loadingVeiculos ? (
              <ActivityIndicator size="small" color="#4CAF50" style={{ marginVertical: SPACING }} />
            ) : (
              <>
                <TouchableOpacity
                  style={[commonStyles.inputContainer, styles.pickerButton]}
                  onPress={() => {
                    if (veiculos.length === 0) {
                      Alert.alert('Aviso', 'Nenhum veículo cadastrado para este proprietário.');
                    } else {
                      setMostrarVeiculos(!mostrarVeiculos);
                    }
                  }}
                >
                  <Ionicons name="car-outline" size={20} color="#666" style={commonStyles.inputIcon} />
                  <Text style={styles.pickerText}>
                    {veiculoSelecionadoObj
                      ? `${veiculoSelecionadoObj.placa || ''} - ${veiculoSelecionadoObj.renavam || ''}`
                      : 'Selecione um veículo...'}
                  </Text>
                  <Ionicons
                    name={mostrarVeiculos ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>

                {mostrarVeiculos && veiculos.length > 0 && (
                  <View style={styles.optionsList}>
                    <TouchableOpacity
                      style={styles.optionItem}
                      onPress={() => {
                        setVeiculoSelecionado(null);
                        setMostrarVeiculos(false);
                      }}
                    >
                      <Text style={styles.optionText}>Limpar seleção</Text>
                    </TouchableOpacity>
                    {veiculos.map(v => (
                      <TouchableOpacity
                        key={v.id}
                        style={[
                          styles.optionItem,
                          veiculoSelecionado === v.id && styles.optionItemSelected
                        ]}
                        onPress={() => {
                          setVeiculoSelecionado(v.id);
                          setMostrarVeiculos(false);
                        }}
                      >
                        <Text style={styles.optionText}>{v.placa || 'N/A'} - {v.renavam || 'N/A'}</Text>
                        {veiculoSelecionado === v.id && (
                          <Ionicons name="checkmark" size={20} color="#4CAF50" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {veiculos.length === 0 && (
                  <View style={commonStyles.emptyContainer}>
                    <Ionicons name="car-outline" size={48} color="#ccc" />
                    <Text style={commonStyles.emptyText}>Nenhum veículo cadastrado para este proprietário</Text>
                  </View>
                )}
              </>
            )}
          </View>
        )}

        {/* Lista de Manutenções */}
        {(veiculoSelecionado || veiculoIdParam) && (
          <View style={styles.manutencoesContainer}>
            <Text style={commonStyles.sectionTitle}>
              {manutencoes.length} {manutencoes.length === 1 ? 'Manutenção' : 'Manutenções'}
            </Text>

            {loadingManutencoes && !refreshing ? (
              <View style={commonStyles.loadingContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={commonStyles.loadingText}>Carregando manutenções...</Text>
              </View>
            ) : (
              <>
                {manutencoes.length === 0 ? (
                  <View style={commonStyles.emptyContainer}>
                    <Ionicons name="construct-outline" size={64} color="#ccc" />
                    <Text style={styles.emptyTitle}>Nenhuma manutenção encontrada</Text>
                    <Text style={styles.emptySubtext}>
                      Você ainda não registrou nenhuma manutenção para este veículo.
                    </Text>
                  </View>
                ) : (
                  manutencoes.map(m => {
                    const tipoManutencao = m.tipo_manutencao || m.tipo;
                    const areaManutencao = m.area_manutencao;
                    const tipoIcon = getTipoManutencaoIcon(tipoManutencao);
                    const areaIcon = getAreaManutencaoIcon(areaManutencao);
                    const tipoLabel = getTipoManutencaoLabel(tipoManutencao);
                    const areaLabel = getAreaManutencaoLabel(areaManutencao);

                    return (
                      <TouchableOpacity
                        key={m.id}
                        style={commonStyles.card}
                        onPress={() => Alert.alert('Detalhes', `ID: ${m.id}\nDescrição: ${m.descricao || 'N/A'}`)}
                      >
                        {/* Header com Data e Valor */}
                        <View style={styles.cardHeader}>
                          <View style={styles.cardHeaderLeft}>
                            <View style={styles.cardDataRow}>
                              <Ionicons name="calendar-outline" size={16} color="#666" />
                              <Text style={styles.cardData}>{formatarData(m.data)}</Text>
                            </View>
                            <View style={styles.cardValorRow}>
                              <Ionicons name="cash-outline" size={18} color="#4CAF50" />
                              <Text style={styles.cardValor}>
                                {formatarMoeda(m.valor)}
                              </Text>
                            </View>
                          </View>
                        </View>

                        {/* Tipo e Área de Manutenção */}
                        <View style={styles.cardInfoRow}>
                          {tipoManutencao && (
                            <View style={styles.infoBadge}>
                              <Ionicons name={tipoIcon} size={16} color="#1976d2" />
                              <Text style={styles.infoBadgeText}>{tipoLabel}</Text>
                            </View>
                          )}
                          {areaManutencao && (
                            <View style={styles.infoBadge}>
                              <Ionicons name={areaIcon} size={16} color="#4CAF50" />
                              <Text style={styles.infoBadgeText}>{areaLabel}</Text>
                            </View>
                          )}
                        </View>

                        {/* Descrição */}
                        {m.descricao && (
                          <Text style={styles.cardDescricao} numberOfLines={2}>
                            {m.descricao}
                          </Text>
                        )}

                        {/* Imagem */}
                        {m.imagem && (
                          <Image
                            source={{ 
                              uri: m.imagem_url || `${API_URL}/uploads/${m.imagem}` 
                            }}
                            style={styles.image}
                            onError={() => {
                              // Imagem não carregou, mas não é crítico
                            }}
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })
                )}
              </>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: Platform.OS === 'android' ? SPACING * 2 : SPACING,
  },
  pickerButton: {
    marginBottom: 0,
  },
  pickerText: {
    flex: 1,
    fontSize: 16,
    color: commonStyles.textPrimary,
  },
  optionsList: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: commonStyles.borderColor,
    borderRadius: 12,
    marginTop: SPACING,
    backgroundColor: commonStyles.backgroundWhite,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  optionItemSelected: {
    backgroundColor: '#e3f2fd',
  },
  optionText: {
    fontSize: 16,
    color: commonStyles.textPrimary,
  },
  manutencoesContainer: {
    marginTop: SPACING,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  cardDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING / 2,
  },
  cardData: {
    fontSize: 16,
    fontWeight: '600',
    color: commonStyles.textPrimary,
    marginLeft: SPACING / 2,
  },
  cardValorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardValor: {
    fontSize: 20,
    fontWeight: 'bold',
    color: commonStyles.primaryColor,
    marginLeft: SPACING / 2,
  },
  cardInfoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING / 2,
    marginBottom: SPACING,
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: SPACING / 2,
    paddingVertical: SPACING / 4,
    borderRadius: 12,
    marginRight: SPACING / 2,
  },
  infoBadgeText: {
    fontSize: 12,
    color: '#1976d2',
    fontWeight: '600',
    marginLeft: SPACING / 4,
  },
  cardDescricao: {
    fontSize: 14,
    color: commonStyles.textSecondary,
    marginTop: SPACING / 2,
    lineHeight: 20,
  },
  image: {
    width: '100%',
    height: 200,
    marginTop: SPACING,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: commonStyles.textPrimary,
    marginTop: SPACING,
    marginBottom: SPACING / 2,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: commonStyles.textSecondary,
    marginTop: SPACING / 2,
    textAlign: 'center',
    paddingHorizontal: SPACING,
  },
});
