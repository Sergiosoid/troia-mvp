import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator,
  Platform,
  SafeAreaView
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { buscarManutencoes, buscarVeiculoPorPlaca, API_URL } from '../services/api';
import { commonStyles } from '../constants/styles';

const SPACING = 16; // Espaçamento padrão de 16
const DEBOUNCE_DELAY = 500; // Debounce de 500ms

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

export default function PesquisaScreen({ navigation, route }) {
  const [termo, setTermo] = useState('');
  const [placaBusca, setPlacaBusca] = useState('');
  const [resultados, setResultados] = useState([]);
  const [veiculoEncontrado, setVeiculoEncontrado] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState(null);
  const debounceTimer = useRef(null);

  // Refresh automático quando retornar com refresh:true
  useFocusEffect(
    React.useCallback(() => {
      if (route?.params?.refresh) {
        setResultados([]);
        setVeiculoEncontrado(null);
        setErro(null);
        navigation.setParams({ refresh: false });
      }
    }, [route?.params?.refresh])
  );

  // Função para buscar manutenções
  const buscarManutencoesHandler = async (termoBusca) => {
    if (!termoBusca || !termoBusca.trim()) {
      setResultados([]);
      setErro(null);
      setBuscando(false);
      return;
    }

    try {
      setBuscando(true);
      setErro(null);
      const dados = await buscarManutencoes(termoBusca.trim());
      setResultados(Array.isArray(dados) ? dados : []);
      setVeiculoEncontrado(null);
    } catch (error) {
      console.error('Erro ao buscar manutenções:', error);
      setErro(error.message || 'Não foi possível buscar manutenções. Verifique sua conexão.');
      setResultados([]);
    } finally {
      setBuscando(false);
    }
  };

  // Debounce para busca automática
  useEffect(() => {
    // Limpar timer anterior
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Se termo estiver vazio, limpar resultados
    if (!termo.trim()) {
      setResultados([]);
      setErro(null);
      setBuscando(false);
      return;
    }

    // Criar novo timer
    debounceTimer.current = setTimeout(() => {
      buscarManutencoesHandler(termo);
    }, DEBOUNCE_DELAY);

    // Cleanup
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [termo]);

  const handleBuscarPlaca = async () => {
    if (!placaBusca.trim()) {
      Alert.alert('Aviso', 'Digite uma placa para buscar');
      return;
    }

    try {
      setBuscando(true);
      setErro(null);
      const veiculo = await buscarVeiculoPorPlaca(placaBusca.trim().toUpperCase());
      setVeiculoEncontrado(veiculo);
      setResultados([]);
    } catch (error) {
      console.error('Erro ao buscar veículo:', error);
      const errorMessage = error.message?.includes('indisponível')
        ? error.message
        : error.message?.includes('não encontrado')
        ? 'Nenhum veículo encontrado com esta placa.'
        : 'Erro ao buscar veículo. Verifique sua conexão.';
      setErro(errorMessage);
      setVeiculoEncontrado(null);
    } finally {
      setBuscando(false);
    }
  };

  const handleNovaManutencao = () => {
    Alert.alert(
      'Nova Manutenção',
      'Como deseja cadastrar?',
      [
        {
          text: 'Tirar Foto',
          onPress: () => navigation.navigate('CameraCapture'),
        },
        {
          text: 'Inserir Manualmente',
          onPress: () => navigation.navigate('CadastroManutencao'),
        },
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ]
    );
  };

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
        <Text style={commonStyles.headerTitle}>Buscar Manutenções</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={commonStyles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Busca por placa */}
        <View style={commonStyles.card}>
          <Text style={commonStyles.sectionTitle}>Buscar por Placa</Text>
          <View style={commonStyles.inputContainer}>
            <Ionicons name="car-outline" size={20} color="#666" style={commonStyles.inputIcon} />
            <TextInput
              style={commonStyles.input}
              placeholder="Digite a placa (ex: ABC1D23)"
              placeholderTextColor="#999"
              value={placaBusca}
              onChangeText={(text) => setPlacaBusca(text.toUpperCase())}
              autoCapitalize="characters"
              maxLength={7}
            />
          </View>
          <TouchableOpacity
            style={[commonStyles.button, buscando && commonStyles.buttonDisabled]}
            onPress={handleBuscarPlaca}
            disabled={buscando}
          >
            {buscando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={commonStyles.buttonText}>Buscar Placa</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Busca geral de manutenções */}
        <View style={commonStyles.card}>
          <Text style={commonStyles.sectionTitle}>Buscar Manutenções</Text>
          <View style={commonStyles.inputContainer}>
            <Ionicons name="search-outline" size={20} color="#666" style={commonStyles.inputIcon} />
            <TextInput
              style={commonStyles.input}
              placeholder="Digite placa, proprietário ou descrição"
              placeholderTextColor="#999"
              value={termo}
              onChangeText={setTermo}
            />
            {buscando && (
              <ActivityIndicator size="small" color="#4CAF50" style={{ marginLeft: SPACING }} />
            )}
          </View>
          <Text style={styles.hintText}>
            A busca é automática após {DEBOUNCE_DELAY / 1000} segundos
          </Text>
        </View>

        {/* Estado de busca */}
        {buscando && termo.trim() && (
          <View style={styles.stateContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={commonStyles.loadingText}>Buscando manutenções...</Text>
          </View>
        )}

        {/* Estado de erro */}
        {erro && !buscando && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color="#f44336" />
            <Text style={styles.errorTitle}>Erro na Busca</Text>
            <Text style={styles.errorText}>{erro}</Text>
            <TouchableOpacity
              style={[commonStyles.button, commonStyles.buttonSecondary, { marginTop: SPACING }]}
              onPress={() => {
                setErro(null);
                if (termo.trim()) {
                  buscarManutencoesHandler(termo);
                }
              }}
            >
              <Text style={[commonStyles.buttonText, commonStyles.buttonSecondaryText]}>
                Tentar Novamente
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Resultado da busca por placa */}
        {veiculoEncontrado && !buscando && (
          <View style={styles.veiculoCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              <Text style={styles.cardTitle}>Veículo Encontrado</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardText}>
                <Text style={styles.bold}>Placa:</Text> {veiculoEncontrado.placa || 'N/A'}
              </Text>
              <Text style={styles.cardText}>
                <Text style={styles.bold}>Renavam:</Text> {veiculoEncontrado.renavam || 'N/A'}
              </Text>
              {veiculoEncontrado.proprietarioNome && (
                <Text style={styles.cardText}>
                  <Text style={styles.bold}>Proprietário:</Text> {veiculoEncontrado.proprietarioNome}
                </Text>
              )}
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[commonStyles.button, commonStyles.buttonSecondary, { flex: 1, marginRight: SPACING / 2 }]}
                onPress={() => navigation.navigate('VeiculoHistorico', { veiculoId: veiculoEncontrado.id })}
              >
                <Text style={[commonStyles.buttonText, commonStyles.buttonSecondaryText]}>Ver Histórico</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[commonStyles.button, { flex: 1, marginLeft: SPACING / 2 }]}
                onPress={() => navigation.navigate('CadastroManutencao', { veiculoId: veiculoEncontrado.id })}
              >
                <Text style={commonStyles.buttonText}>Nova Manutenção</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Resultados da busca geral */}
        {!buscando && !erro && resultados.length > 0 && (
          <View style={styles.resultsContainer}>
            <Text style={commonStyles.sectionTitle}>
              {resultados.length} {resultados.length === 1 ? 'Resultado' : 'Resultados'}
            </Text>
            {resultados.map((item) => {
              const tipoManutencao = item.tipo_manutencao || item.tipo;
              const areaManutencao = item.area_manutencao;
              const tipoIcon = getTipoManutencaoIcon(tipoManutencao);
              const areaIcon = getAreaManutencaoIcon(areaManutencao);
              const tipoLabel = getTipoManutencaoLabel(tipoManutencao);
              const areaLabel = getAreaManutencaoLabel(areaManutencao);

              return (
                <TouchableOpacity
                  key={item.id}
                  style={commonStyles.card}
                  onPress={() => {
                    if (item.veiculo_id) {
                      navigation.navigate('VeiculoHistorico', { veiculoId: item.veiculo_id });
                    }
                  }}
                >
                  {/* Header com Placa e Valor */}
                  <View style={styles.resultHeader}>
                    <View style={styles.resultHeaderLeft}>
                      <View style={styles.resultPlacaRow}>
                        <Ionicons name="car-outline" size={18} color="#666" />
                        <Text style={styles.resultPlaca}>{item.placa || 'N/A'}</Text>
                      </View>
                      <View style={styles.resultValorRow}>
                        <Ionicons name="cash-outline" size={18} color="#4CAF50" />
                        <Text style={styles.resultValor}>{formatarMoeda(item.valor)}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Data */}
                  {item.data && (
                    <View style={styles.resultDataRow}>
                      <Ionicons name="calendar-outline" size={16} color="#666" />
                      <Text style={styles.resultData}>{formatarData(item.data)}</Text>
                    </View>
                  )}

                  {/* Tipo e Área de Manutenção */}
                  <View style={styles.resultInfoRow}>
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

                  {/* Proprietário */}
                  {item.proprietarioNome && (
                    <Text style={styles.resultText}>
                      <Text style={styles.bold}>Proprietário:</Text> {item.proprietarioNome}
                    </Text>
                  )}

                  {/* Descrição */}
                  {item.descricao && (
                    <Text style={styles.resultText} numberOfLines={2}>
                      <Text style={styles.bold}>Descrição:</Text> {item.descricao}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Estado: Nada encontrado */}
        {!buscando && !erro && termo.trim() && resultados.length === 0 && (
          <View style={commonStyles.emptyContainer}>
            <Ionicons name="search-outline" size={64} color="#ccc" />
            <Text style={commonStyles.emptyText}>Nenhuma manutenção encontrada</Text>
            <Text style={styles.emptySubtext}>
              Tente buscar por placa, nome do proprietário ou descrição
            </Text>
          </View>
        )}

        {/* Botões de ação */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={commonStyles.button}
            onPress={handleNovaManutencao}
          >
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text style={[commonStyles.buttonText, { marginLeft: SPACING / 2 }]}>Nova Manutenção</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[commonStyles.button, commonStyles.buttonSecondary, { marginTop: SPACING }]}
            onPress={() => navigation.navigate('ListaManutencoes')}
          >
            <Text style={[commonStyles.buttonText, commonStyles.buttonSecondaryText]}>
              Ver Lista Completa
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: Platform.OS === 'android' ? SPACING * 2 : SPACING,
  },
  hintText: {
    fontSize: 12,
    color: commonStyles.textLight,
    marginTop: SPACING / 2,
    fontStyle: 'italic',
  },
  stateContainer: {
    alignItems: 'center',
    padding: SPACING * 2,
    marginTop: SPACING,
  },
  errorContainer: {
    backgroundColor: commonStyles.backgroundWhite,
    padding: SPACING * 2,
    borderRadius: 12,
    marginTop: SPACING,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: commonStyles.dangerColor,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: commonStyles.dangerColor,
    marginTop: SPACING,
    marginBottom: SPACING / 2,
  },
  errorText: {
    fontSize: 14,
    color: commonStyles.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  veiculoCard: {
    backgroundColor: '#e8f5e9',
    padding: SPACING,
    borderRadius: 12,
    marginTop: SPACING,
    borderWidth: 2,
    borderColor: commonStyles.primaryColor,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: SPACING / 2,
    color: commonStyles.textPrimary,
  },
  cardContent: {
    marginBottom: SPACING,
  },
  cardText: {
    fontSize: 16,
    color: commonStyles.textSecondary,
    marginBottom: SPACING / 2,
  },
  bold: {
    fontWeight: '600',
    color: commonStyles.textPrimary,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: SPACING,
  },
  resultsContainer: {
    marginTop: SPACING,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING,
  },
  resultHeaderLeft: {
    flex: 1,
  },
  resultPlacaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING / 2,
  },
  resultPlaca: {
    fontSize: 20,
    fontWeight: 'bold',
    color: commonStyles.textPrimary,
    marginLeft: SPACING / 2,
  },
  resultValorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultValor: {
    fontSize: 18,
    fontWeight: 'bold',
    color: commonStyles.primaryColor,
    marginLeft: SPACING / 2,
  },
  resultDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING,
  },
  resultData: {
    fontSize: 14,
    color: commonStyles.textSecondary,
    marginLeft: SPACING / 2,
  },
  resultInfoRow: {
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
  resultText: {
    fontSize: 14,
    color: commonStyles.textSecondary,
    marginBottom: SPACING / 2,
    lineHeight: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: commonStyles.textLight,
    textAlign: 'center',
    marginTop: SPACING / 2,
  },
  actionsContainer: {
    marginTop: SPACING * 2,
    marginBottom: SPACING,
  },
});
