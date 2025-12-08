import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { listarVeiculosComTotais } from '../services/api';
import { commonStyles } from '../constants/styles';

export default function EscolherVeiculoParaManutencaoScreen({ navigation, route }) {
  const [veiculos, setVeiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [veiculoSelecionado, setVeiculoSelecionado] = useState(null);

  const carregarVeiculos = async () => {
    try {
      setLoading(true);
      const dados = await listarVeiculosComTotais();
      setVeiculos(Array.isArray(dados) ? dados : []);
    } catch (error) {
      console.error('Erro ao carregar veículos:', error);
      const errorMessage = error.message?.includes('indisponível')
        ? error.message
        : error.message?.includes('autenticado')
        ? 'Sessão expirada. Faça login novamente.'
        : 'Não foi possível carregar os veículos. Verifique sua conexão.';
      Alert.alert('Erro', errorMessage);
      setVeiculos([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      carregarVeiculos();
    }, [])
  );

  const handleSelecionarVeiculo = (veiculo) => {
    setVeiculoSelecionado(veiculo);
    setModalVisible(true);
  };

  const handleTirarFoto = () => {
    setModalVisible(false);
    navigation.navigate('CameraCapture', { veiculoId: veiculoSelecionado.id });
  };

  const handleInserirManual = () => {
    setModalVisible(false);
    navigation.navigate('CadastroManutencao', { veiculoId: veiculoSelecionado.id });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Carregando veículos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Escolher Veículo</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        <Text style={styles.sectionTitle}>
          Para qual veículo deseja cadastrar a manutenção?
        </Text>

        {veiculos.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="car-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Nenhum veículo cadastrado</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                Alert.alert(
                  'Cadastrar Veículo',
                  'Para cadastrar um veículo, você precisa primeiro cadastrar um proprietário.',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    { 
                      text: 'Cadastrar Proprietário', 
                      onPress: () => navigation.navigate('CadastroProprietario', {
                        continuarFluxo: true
                      })
                    }
                  ]
                );
              }}
            >
              <Text style={styles.addButtonText}>Cadastrar Veículo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          veiculos.map((veiculo) => (
            <TouchableOpacity
              key={veiculo.id}
              style={styles.veiculoCard}
              onPress={() => handleSelecionarVeiculo(veiculo)}
            >
              <View style={styles.veiculoCardContent}>
                <View style={styles.veiculoIcon}>
                  <Ionicons name="car" size={32} color="#4CAF50" />
                </View>
                <View style={styles.veiculoInfo}>
                  <Text style={styles.veiculoPlaca}>{veiculo.placa || 'N/A'}</Text>
                  <Text style={styles.veiculoProprietario}>
                    {veiculo.proprietarioNome || 'Proprietário não informado'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#666" />
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Modal de Opções */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Nova Manutenção - {veiculoSelecionado?.placa}
            </Text>
            <Text style={styles.modalSubtitle}>
              Como deseja cadastrar?
            </Text>

            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonPrimary]}
              onPress={handleTirarFoto}
            >
              <Ionicons name="camera" size={24} color="#fff" />
              <Text style={styles.modalButtonText}>Tirar Foto da Nota</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonSecondary]}
              onPress={handleInserirManual}
            >
              <Ionicons name="create-outline" size={24} color="#4CAF50" />
              <Text style={[styles.modalButtonText, styles.modalButtonTextSecondary]}>
                Inserir Manualmente
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    margin: 15,
    color: '#333',
  },
  veiculoCard: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  veiculoCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  veiculoIcon: {
    marginRight: 15,
  },
  veiculoInfo: {
    flex: 1,
  },
  veiculoPlaca: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  veiculoProprietario: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 20,
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  modalButtonPrimary: {
    backgroundColor: '#4CAF50',
  },
  modalButtonSecondary: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  modalButtonTextSecondary: {
    color: '#4CAF50',
  },
  modalCancelButton: {
    padding: 15,
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#666',
    fontSize: 16,
  },
});

