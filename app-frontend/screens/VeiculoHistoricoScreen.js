import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import ActionButton from '../components/ActionButton';
import HeaderBar from '../components/HeaderBar';
import { commonStyles } from '../constants/styles';
import { API_URL, buscarVeiculoPorId, excluirManutencao, listarHistoricoVeiculo } from '../services/api';

export default function VeiculoHistoricoScreen({ navigation, route }) {
  const { veiculoId } = route?.params || {};
  const [veiculo, setVeiculo] = useState(null);
  const [manutencoes, setManutencoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [excluindoId, setExcluindoId] = useState(null);
  const [modalExcluir, setModalExcluir] = useState({ visivel: false, manutencao: null });
  const insets = useSafeAreaInsets();

  const carregarDados = async () => {
    if (!veiculoId) {
      Alert.alert('Erro', 'Veículo não identificado');
      navigation.goBack();
      return;
    }

    try {
      setLoading(true);
      
      // Buscar histórico (que já retorna dados do veículo)
      const historico = await listarHistoricoVeiculo(veiculoId);
      setManutencoes(Array.isArray(historico) ? historico : []);
      
      // Extrair dados do veículo do primeiro item do histórico
      if (historico && historico.length > 0) {
        setVeiculo({
          placa: historico[0].placa,
          renavam: historico[0].renavam,
          proprietarioNome: historico[0].proprietarioNome,
        });
      } else {
        // Se não houver histórico, buscar veículo diretamente
        try {
          const veiculoData = await buscarVeiculoPorId(veiculoId);
          if (veiculoData) {
            setVeiculo({
              placa: veiculoData.placa,
              renavam: veiculoData.renavam,
              proprietarioNome: 'Proprietário não informado',
            });
          } else {
            Alert.alert('Aviso', 'Veículo não encontrado');
            navigation.goBack();
          }
        } catch (err) {
          console.error('Erro ao buscar veículo:', err);
          Alert.alert('Erro', err.message || 'Não foi possível buscar o veículo');
        }
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      const errorMessage = error.message?.includes('indisponível')
        ? error.message
        : error.message?.includes('autenticado')
        ? 'Sessão expirada. Faça login novamente.'
        : error.message || 'Não foi possível carregar o histórico. Verifique sua conexão.';
      Alert.alert('Erro', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      if (route?.params?.refresh) {
        carregarDados();
        navigation.setParams({ refresh: false });
      } else {
        carregarDados();
      }
    }, [veiculoId, route?.params?.refresh])
  );

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
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

  const handleExcluirManutencao = async () => {
    const { manutencao } = modalExcluir;
    if (!manutencao) return;

    try {
      setExcluindoId(manutencao.id);
      await excluirManutencao(manutencao.id);
      
      // Fechar modal
      setModalExcluir({ visivel: false, manutencao: null });
      
      // Navegar com refresh
      navigation.navigate('VeiculoHistorico', { veiculoId, refresh: true });
    } catch (error) {
      console.error('Erro ao excluir manutenção:', error);
      Alert.alert('Erro', error.message || 'Não foi possível excluir a manutenção');
    } finally {
      setExcluindoId(null);
    }
  };

  const abrirModalExcluir = (manutencao) => {
    setModalExcluir({ visivel: true, manutencao });
  };

  const fecharModalExcluir = () => {
    setModalExcluir({ visivel: false, manutencao: null });
  };

  if (loading) {
    return (
      <SafeAreaView style={commonStyles.container} edges={['top']}>
        <HeaderBar title="Histórico" navigation={navigation} />
        <View style={commonStyles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={commonStyles.loadingText}>Carregando histórico...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const rightComponent = (
    <View style={styles.headerButtons}>
      <TouchableOpacity
        onPress={() => navigation.navigate('Estatisticas', { veiculoId })}
        style={styles.headerButton}
      >
        <Ionicons name="stats-chart-outline" size={24} color="#4CAF50" />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => Alert.alert('Em breve', 'Exportar será implementado em breve')}
        style={styles.headerButton}
      >
        <Ionicons name="download-outline" size={24} color="#333" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={commonStyles.container} edges={['top']}>
      <HeaderBar title="Histórico" navigation={navigation} rightComponent={rightComponent} />

      <ScrollView 
        style={commonStyles.scrollContainer}
        contentContainerStyle={{ padding: 16 }}
      >
        {/* Informações do Veículo */}
        {veiculo && (
          <View style={styles.veiculoInfo}>
            <Text style={styles.veiculoPlaca}>{veiculo.placa || 'N/A'}</Text>
            <Text style={styles.veiculoProprietario}>
              {veiculo.proprietarioNome || 'Proprietário não informado'}
            </Text>
            {veiculo.renavam && (
              <Text style={styles.veiculoRenavam}>Renavam: {veiculo.renavam}</Text>
            )}
          </View>
        )}

        {/* Lista de Manutenções */}
        <Text style={commonStyles.sectionTitle}>
          {manutencoes.length} {manutencoes.length === 1 ? 'Manutenção' : 'Manutenções'}
        </Text>

        {manutencoes.length === 0 ? (
          <View style={commonStyles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#ccc" />
            <Text style={commonStyles.emptyText}>Nenhuma manutenção registrada</Text>
          </View>
        ) : (
          manutencoes.map((manutencao) => (
            <View key={manutencao.id} style={commonStyles.card}>
              <TouchableOpacity
                onPress={() => Alert.alert('Detalhes', `ID: ${manutencao.id}\nDescrição: ${manutencao.descricao || 'N/A'}`)}
              >
                <View style={styles.manutencaoCardHeader}>
                  <View style={styles.manutencaoCardHeaderLeft}>
                    <View>
                      <Text style={styles.manutencaoData}>
                        {formatarData(manutencao.data)}
                      </Text>
                      <Text style={styles.manutencaoValor}>
                        {formatarMoeda(parseFloat(manutencao.valor) || 0)}
                      </Text>
                    </View>
                    {manutencao.tipo && (
                      <View style={styles.tipoBadge}>
                        <Text style={styles.tipoText}>{manutencao.tipo}</Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => abrirModalExcluir(manutencao)}
                    style={styles.excluirButton}
                    disabled={excluindoId === manutencao.id}
                  >
                    {excluindoId === manutencao.id ? (
                      <ActivityIndicator size="small" color="#dc3545" />
                    ) : (
                      <Ionicons name="trash-outline" size={20} color="#dc3545" />
                    )}
                  </TouchableOpacity>
                </View>

                {manutencao.descricao && (
                  <Text style={styles.manutencaoDescricao} numberOfLines={2}>
                    {manutencao.descricao}
                  </Text>
                )}

                {manutencao.imagem && (
                  <Image
                    source={{ uri: `${API_URL}/uploads/${manutencao.imagem}` }}
                    style={styles.manutencaoImage}
                    onError={() => {
                      // Imagem não carregou, mas não é crítico
                    }}
                  />
                )}
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* Botões de Ação */}
      <View style={[styles.actionButtons, { paddingBottom: insets.bottom + 20 }]}>
        <ActionButton
          onPress={() => navigation.navigate('CadastroManutencao', { veiculoId })}
          label="Nova Manutenção"
          icon="construct-outline"
          color="#4CAF50"
          style={[styles.actionButton, { flex: 1 }]}
        />
        
        <ActionButton
          onPress={() => navigation.navigate('RegistrarAbastecimento', { veiculoId })}
          label="Abastecer"
          icon="water-outline"
          color="#2196F3"
          style={[styles.actionButton, { flex: 1 }]}
        />
      </View>

      {/* Modal de Confirmação de Exclusão */}
      <Modal
        visible={modalExcluir.visivel}
        transparent={true}
        animationType="fade"
        onRequestClose={fecharModalExcluir}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="warning-outline" size={32} color="#dc3545" />
              <Text style={styles.modalTitle}>Excluir Manutenção</Text>
            </View>
            
            <Text style={styles.modalMessage}>
              Tem certeza que deseja excluir esta manutenção? Esta ação não pode ser desfeita.
            </Text>

            {modalExcluir.manutencao && (
              <View style={styles.modalInfo}>
                <Text style={styles.modalInfoText}>
                  Data: {formatarData(modalExcluir.manutencao.data)}
                </Text>
                <Text style={styles.modalInfoText}>
                  Valor: {formatarMoeda(parseFloat(modalExcluir.manutencao.valor) || 0)}
                </Text>
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={fecharModalExcluir}
                disabled={excluindoId !== null}
              >
                <Text style={styles.modalButtonTextCancel}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleExcluirManutencao}
                disabled={excluindoId !== null}
              >
                {excluindoId !== null ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalButtonTextConfirm}>Excluir</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  exportButton: {
    padding: 5,
  },
  veiculoInfo: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  veiculoPlaca: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  veiculoProprietario: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  veiculoRenavam: {
    fontSize: 14,
    color: '#999',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 15,
    marginTop: 10,
    marginBottom: 15,
    color: '#333',
  },
  manutencaoCard: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 15,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  manutencaoCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  manutencaoCardHeaderLeft: {
    flex: 1,
  },
  excluirButton: {
    padding: 8,
    marginLeft: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(220, 53, 69, 0.1)',
  },
  manutencaoData: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  manutencaoValor: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  tipoBadge: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  tipoText: {
    fontSize: 12,
    color: '#1976d2',
    fontWeight: '600',
  },
  manutencaoDescricao: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
  },
  manutencaoImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 15,
    resizeMode: 'cover',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalInfo: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  modalInfoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#f0f0f0',
  },
  modalButtonConfirm: {
    backgroundColor: '#dc3545',
  },
  modalButtonTextCancel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  modalButtonTextConfirm: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 16,
    gap: 12,
    backgroundColor: commonStyles.background,
    borderTopWidth: 1,
    borderTopColor: commonStyles.borderColor,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    minHeight: 48,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  actionButtonPrimary: {
    backgroundColor: commonStyles.primaryColor,
  },
  actionButtonSecondary: {
    backgroundColor: commonStyles.secondaryColor,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});

