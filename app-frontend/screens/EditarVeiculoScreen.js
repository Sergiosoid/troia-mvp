import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  buscarVeiculoPorId,
  atualizarVeiculo,
  listarHistoricoProprietarios,
  adicionarHistoricoProprietario,
  removerHistoricoProprietario,
} from '../services/api';
import { commonStyles } from '../constants/styles';
import HeaderBar from '../components/HeaderBar';
import ActionButton from '../components/ActionButton';

const tiposVeiculo = [
  { value: 'carro', label: 'Carro' },
  { value: 'moto', label: 'Moto' },
  { value: 'caminhao', label: 'Caminhão' },
  { value: 'van', label: 'Van' },
  { value: 'caminhonete', label: 'Caminhonete' },
  { value: 'onibus', label: 'Ônibus' },
  { value: 'barco', label: 'Barco' },
];

export default function EditarVeiculoScreen({ route, navigation }) {
  const { veiculoId } = route?.params || {};
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [veiculo, setVeiculo] = useState(null);

  // Campos editáveis
  const [placa, setPlaca] = useState('');
  const [renavam, setRenavam] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [ano, setAno] = useState('');
  const [tipoVeiculo, setTipoVeiculo] = useState('');
  const [mostrarTipoVeiculo, setMostrarTipoVeiculo] = useState(false);

  // Histórico de proprietários
  const [historico, setHistorico] = useState([]);
  const [loadingHistorico, setLoadingHistorico] = useState(false);

  // Modal de adicionar proprietário
  const [mostrarModalProprietario, setMostrarModalProprietario] = useState(false);
  const [nomeProprietario, setNomeProprietario] = useState('');
  const [dataAquisicao, setDataAquisicao] = useState(new Date());
  const [dataVenda, setDataVenda] = useState(null);
  const [kmAquisicao, setKmAquisicao] = useState('');
  const [kmVenda, setKmVenda] = useState('');
  const [mostrarDatePickerAquisicao, setMostrarDatePickerAquisicao] = useState(false);
  const [mostrarDatePickerVenda, setMostrarDatePickerVenda] = useState(false);
  const [salvandoProprietario, setSalvandoProprietario] = useState(false);

  useEffect(() => {
    if (veiculoId) {
      carregarVeiculo();
      carregarHistorico();
    }
  }, [veiculoId]);

  const carregarVeiculo = async () => {
    try {
      setLoading(true);
      const data = await buscarVeiculoPorId(veiculoId);
      if (data) {
        setVeiculo(data);
        setPlaca(data.placa || '');
        setRenavam(data.renavam || '');
        setMarca(data.marca || '');
        setModelo(data.modelo || '');
        setAno(data.ano || '');
        setTipoVeiculo(data.tipo_veiculo || '');
      } else {
        Alert.alert('Erro', 'Veículo não encontrado');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Erro ao carregar veículo:', error);
      Alert.alert('Erro', error.message || 'Não foi possível carregar o veículo');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const carregarHistorico = async () => {
    try {
      setLoadingHistorico(true);
      const data = await listarHistoricoProprietarios(veiculoId);
      setHistorico(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      setHistorico([]);
    } finally {
      setLoadingHistorico(false);
    }
  };

  const handleSalvar = async () => {
    if (!modelo.trim()) {
      Alert.alert('Atenção', 'Modelo é obrigatório');
      return;
    }

    if (!ano.trim()) {
      Alert.alert('Atenção', 'Ano é obrigatório');
      return;
    }

    setSaving(true);
    try {
      await atualizarVeiculo(veiculoId, {
        placa,
        renavam,
        marca,
        modelo,
        ano,
        tipo_veiculo: tipoVeiculo,
      });

      Alert.alert('Sucesso', 'Veículo atualizado com sucesso!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Erro ao atualizar veículo:', error);
      Alert.alert('Erro', error.message || 'Não foi possível atualizar o veículo');
    } finally {
      setSaving(false);
    }
  };

  const handleAdicionarProprietario = async () => {
    if (!nomeProprietario.trim()) {
      Alert.alert('Atenção', 'Nome do proprietário é obrigatório');
      return;
    }

    if (!dataAquisicao) {
      Alert.alert('Atenção', 'Data de aquisição é obrigatória');
      return;
    }

    setSalvandoProprietario(true);
    try {
      await adicionarHistoricoProprietario(veiculoId, {
        nome: nomeProprietario,
        data_aquisicao: formatarDataParaApi(dataAquisicao),
        data_venda: dataVenda ? formatarDataParaApi(dataVenda) : null,
        km_aquisicao: kmAquisicao ? parseInt(kmAquisicao) : null,
        km_venda: kmVenda ? parseInt(kmVenda) : null,
      });

      Alert.alert('Sucesso', 'Proprietário adicionado ao histórico!');
      setMostrarModalProprietario(false);
      limparFormularioProprietario();
      carregarHistorico();
    } catch (error) {
      console.error('Erro ao adicionar proprietário:', error);
      Alert.alert('Erro', error.message || 'Não foi possível adicionar o proprietário');
    } finally {
      setSalvandoProprietario(false);
    }
  };

  const handleRemoverProprietario = async (historicoId) => {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja remover este registro do histórico?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await removerHistoricoProprietario(veiculoId, historicoId);
              Alert.alert('Sucesso', 'Registro removido com sucesso!');
              carregarHistorico();
            } catch (error) {
              console.error('Erro ao remover proprietário:', error);
              Alert.alert('Erro', error.message || 'Não foi possível remover o registro');
            }
          },
        },
      ]
    );
  };

  const limparFormularioProprietario = () => {
    setNomeProprietario('');
    setDataAquisicao(new Date());
    setDataVenda(null);
    setKmAquisicao('');
    setKmVenda('');
  };

  const formatarData = (date) => {
    if (!date) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatarDataParaApi = (date) => {
    if (!date) return null;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={commonStyles.container} edges={['top']}>
        <HeaderBar title="Editar Veículo" navigation={navigation} />
        <View style={commonStyles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={commonStyles.loadingText}>Carregando veículo...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={commonStyles.container} edges={['top']}>
      <HeaderBar title="Editar Veículo" navigation={navigation} />

      <ScrollView
        style={commonStyles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 20 },
        ]}
      >
        {/* Seção: Dados do Veículo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dados do Veículo</Text>

          <View style={commonStyles.card}>
            <View style={commonStyles.inputContainer}>
              <Ionicons name="car-outline" size={20} color="#666" style={commonStyles.inputIcon} />
              <TextInput
                style={commonStyles.input}
                placeholder="Placa (opcional)"
                placeholderTextColor="#999"
                value={placa}
                onChangeText={(text) => setPlaca(text.toUpperCase())}
                autoCapitalize="characters"
                maxLength={7}
              />
            </View>

            <View style={commonStyles.inputContainer}>
              <Ionicons name="barcode-outline" size={20} color="#666" style={commonStyles.inputIcon} />
              <TextInput
                style={commonStyles.input}
                placeholder="Renavam (opcional)"
                placeholderTextColor="#999"
                value={renavam}
                onChangeText={setRenavam}
                keyboardType="numeric"
              />
            </View>

            <Text style={commonStyles.label}>Fabricante</Text>
            <View style={commonStyles.inputContainer}>
              <Ionicons name="car-sport-outline" size={20} color="#666" style={commonStyles.inputIcon} />
              <TextInput
                style={commonStyles.input}
                placeholder="Ex: Toyota, Honda, Fiat..."
                placeholderTextColor="#999"
                value={marca}
                onChangeText={setMarca}
                autoCapitalize="words"
              />
            </View>

            <Text style={commonStyles.label}>Modelo / Identificação *</Text>
            <View style={commonStyles.inputContainer}>
              <Ionicons name="car-outline" size={20} color="#666" style={commonStyles.inputIcon} />
              <TextInput
                style={commonStyles.input}
                placeholder="Ex: Corolla, Civic, Uno..."
                placeholderTextColor="#999"
                value={modelo}
                onChangeText={setModelo}
                autoCapitalize="words"
              />
            </View>

            <View style={commonStyles.inputContainer}>
              <Ionicons name="calendar-outline" size={20} color="#666" style={commonStyles.inputIcon} />
              <TextInput
                style={commonStyles.input}
                placeholder="Ano *"
                placeholderTextColor="#999"
                value={ano}
                onChangeText={setAno}
                keyboardType="numeric"
                maxLength={4}
              />
            </View>

            <Text style={commonStyles.label}>Tipo de Veículo</Text>
            <View style={styles.pickerContainer}>
              <TouchableOpacity
                style={[commonStyles.inputContainer, styles.pickerButton]}
                onPress={() => setMostrarTipoVeiculo(!mostrarTipoVeiculo)}
              >
                <Ionicons name="car-sport-outline" size={20} color="#666" style={commonStyles.inputIcon} />
                <Text style={styles.pickerText}>
                  {tipoVeiculo
                    ? tiposVeiculo.find((t) => t.value === tipoVeiculo)?.label || tipoVeiculo
                    : 'Selecione o tipo (opcional)'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#666" />
              </TouchableOpacity>
              {mostrarTipoVeiculo && (
                <View style={styles.optionsList}>
                  {tiposVeiculo.map((tipo) => (
                    <TouchableOpacity
                      key={tipo.value}
                      style={[
                        styles.optionItem,
                        tipoVeiculo === tipo.value && styles.optionItemSelected,
                      ]}
                      onPress={() => {
                        setTipoVeiculo(tipo.value);
                        setMostrarTipoVeiculo(false);
                      }}
                    >
                      <Text style={styles.optionText}>{tipo.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <ActionButton
              onPress={handleSalvar}
              label="Salvar Alterações"
              icon="checkmark-circle"
              color="#4CAF50"
              loading={saving}
              disabled={saving}
              style={styles.saveButton}
            />
          </View>
        </View>

        {/* Seção: Histórico de Proprietários */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Histórico de Proprietários</Text>
            <ActionButton
              onPress={() => setMostrarModalProprietario(true)}
              label="Adicionar"
              icon="add-circle"
              color="#2196F3"
              style={styles.addButton}
            />
          </View>

          {loadingHistorico ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#4CAF50" />
            </View>
          ) : historico.length === 0 ? (
            <View style={commonStyles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color="#ccc" />
              <Text style={commonStyles.emptyText}>
                Nenhum proprietário cadastrado ainda.
              </Text>
            </View>
          ) : (
            historico.map((item) => (
              <View key={item.id} style={commonStyles.card}>
                <View style={styles.historicoHeader}>
                  <Text style={styles.historicoNome}>{item.nome}</Text>
                  <TouchableOpacity
                    onPress={() => handleRemoverProprietario(item.id)}
                    style={styles.removeButton}
                  >
                    <Ionicons name="trash-outline" size={20} color="#f44336" />
                  </TouchableOpacity>
                </View>

                <View style={styles.historicoInfo}>
                  <View style={styles.historicoRow}>
                    <Ionicons name="calendar-outline" size={16} color="#666" />
                    <Text style={styles.historicoText}>
                      Comprou em {formatarData(new Date(item.data_aquisicao))}
                    </Text>
                  </View>
                  {item.km_aquisicao && (
                    <Text style={styles.historicoKm}>KM: {item.km_aquisicao.toLocaleString('pt-BR')}</Text>
                  )}
                </View>

                {item.data_venda && (
                  <View style={styles.historicoInfo}>
                    <View style={styles.historicoRow}>
                      <Ionicons name="calendar-outline" size={16} color="#666" />
                      <Text style={styles.historicoText}>
                        Vendeu em {formatarData(new Date(item.data_venda))}
                      </Text>
                    </View>
                    {item.km_venda && (
                      <Text style={styles.historicoKm}>KM: {item.km_venda.toLocaleString('pt-BR')}</Text>
                    )}
                  </View>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Modal: Adicionar Proprietário */}
      <Modal
        visible={mostrarModalProprietario}
        transparent
        animationType="slide"
        onRequestClose={() => setMostrarModalProprietario(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Adicionar Proprietário Anterior</Text>
              <TouchableOpacity onPress={() => setMostrarModalProprietario(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <Text style={commonStyles.label}>Nome do Proprietário *</Text>
              <View style={commonStyles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#666" style={commonStyles.inputIcon} />
                <TextInput
                  style={commonStyles.input}
                  placeholder="Nome completo"
                  placeholderTextColor="#999"
                  value={nomeProprietario}
                  onChangeText={setNomeProprietario}
                  autoCapitalize="words"
                />
              </View>

              <Text style={commonStyles.label}>Data de Aquisição *</Text>
              <TouchableOpacity
                style={commonStyles.inputContainer}
                onPress={() => setMostrarDatePickerAquisicao(true)}
              >
                <Ionicons name="calendar-outline" size={20} color="#666" style={commonStyles.inputIcon} />
                <Text style={[commonStyles.input, { color: '#333' }]}>
                  {formatarData(dataAquisicao)}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#666" />
              </TouchableOpacity>

              <Text style={commonStyles.label}>KM na Aquisição (Opcional)</Text>
              <View style={commonStyles.inputContainer}>
                <Ionicons name="speedometer-outline" size={20} color="#666" style={commonStyles.inputIcon} />
                <TextInput
                  style={commonStyles.input}
                  placeholder="Ex: 50000"
                  placeholderTextColor="#999"
                  value={kmAquisicao}
                  onChangeText={setKmAquisicao}
                  keyboardType="numeric"
                />
              </View>

              <Text style={commonStyles.label}>Data de Venda (Opcional)</Text>
              <TouchableOpacity
                style={commonStyles.inputContainer}
                onPress={() => setMostrarDatePickerVenda(true)}
              >
                <Ionicons name="calendar-outline" size={20} color="#666" style={commonStyles.inputIcon} />
                <Text style={[commonStyles.input, { color: dataVenda ? '#333' : '#999' }]}>
                  {dataVenda ? formatarData(dataVenda) : 'Selecione a data'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#666" />
              </TouchableOpacity>

              <Text style={commonStyles.label}>KM na Venda (Opcional)</Text>
              <View style={commonStyles.inputContainer}>
                <Ionicons name="speedometer-outline" size={20} color="#666" style={commonStyles.inputIcon} />
                <TextInput
                  style={commonStyles.input}
                  placeholder="Ex: 120000"
                  placeholderTextColor="#999"
                  value={kmVenda}
                  onChangeText={setKmVenda}
                  keyboardType="numeric"
                />
              </View>

              <ActionButton
                onPress={handleAdicionarProprietario}
                label="Adicionar ao Histórico"
                icon="checkmark-circle"
                color="#4CAF50"
                loading={salvandoProprietario}
                disabled={salvandoProprietario}
                style={styles.modalSaveButton}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* DatePicker Modal - Aquisição */}
      {mostrarDatePickerAquisicao && (
        <Modal
          visible={mostrarDatePickerAquisicao}
          transparent
          animationType="fade"
          onRequestClose={() => setMostrarDatePickerAquisicao(false)}
        >
          <View style={styles.datePickerOverlay}>
            <View style={styles.datePickerContainer}>
              <View style={styles.datePickerHeader}>
                <TouchableOpacity onPress={() => setMostrarDatePickerAquisicao(false)}>
                  <Text style={styles.datePickerCancel}>Cancelar</Text>
                </TouchableOpacity>
                <Text style={styles.datePickerTitle}>Selecionar Data</Text>
                <TouchableOpacity
                  onPress={() => {
                    setMostrarDatePickerAquisicao(false);
                  }}
                >
                  <Text style={styles.datePickerConfirm}>Confirmar</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.datePickerScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.datePickerSection}>
                  <Text style={styles.datePickerSectionTitle}>Dia</Text>
                  <View style={styles.datePickerRow}>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((dia) => (
                      <TouchableOpacity
                        key={dia}
                        style={[
                          styles.datePickerItem,
                          dataAquisicao.getDate() === dia && styles.datePickerItemSelected,
                        ]}
                        onPress={() =>
                          setDataAquisicao(
                            new Date(dataAquisicao.getFullYear(), dataAquisicao.getMonth(), dia)
                          )
                        }
                      >
                        <Text
                          style={[
                            styles.datePickerItemText,
                            dataAquisicao.getDate() === dia && styles.datePickerItemTextSelected,
                          ]}
                        >
                          {dia}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <View style={styles.datePickerSection}>
                  <Text style={styles.datePickerSectionTitle}>Mês</Text>
                  <View style={styles.datePickerRow}>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((mes) => (
                      <TouchableOpacity
                        key={mes}
                        style={[
                          styles.datePickerItem,
                          dataAquisicao.getMonth() + 1 === mes && styles.datePickerItemSelected,
                        ]}
                        onPress={() =>
                          setDataAquisicao(
                            new Date(dataAquisicao.getFullYear(), mes - 1, dataAquisicao.getDate())
                          )
                        }
                      >
                        <Text
                          style={[
                            styles.datePickerItemText,
                            dataAquisicao.getMonth() + 1 === mes && styles.datePickerItemTextSelected,
                          ]}
                        >
                          {mes}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <View style={styles.datePickerSection}>
                  <Text style={styles.datePickerSectionTitle}>Ano</Text>
                  <View style={styles.datePickerRow}>
                    {Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - i).map((ano) => (
                      <TouchableOpacity
                        key={ano}
                        style={[
                          styles.datePickerItem,
                          dataAquisicao.getFullYear() === ano && styles.datePickerItemSelected,
                        ]}
                        onPress={() =>
                          setDataAquisicao(
                            new Date(ano, dataAquisicao.getMonth(), dataAquisicao.getDate())
                          )
                        }
                      >
                        <Text
                          style={[
                            styles.datePickerItemText,
                            dataAquisicao.getFullYear() === ano && styles.datePickerItemTextSelected,
                          ]}
                        >
                          {ano}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* DatePicker Modal - Venda */}
      {mostrarDatePickerVenda && (
        <Modal
          visible={mostrarDatePickerVenda}
          transparent
          animationType="fade"
          onRequestClose={() => setMostrarDatePickerVenda(false)}
        >
          <View style={styles.datePickerOverlay}>
            <View style={styles.datePickerContainer}>
              <View style={styles.datePickerHeader}>
                <TouchableOpacity onPress={() => setMostrarDatePickerVenda(false)}>
                  <Text style={styles.datePickerCancel}>Cancelar</Text>
                </TouchableOpacity>
                <Text style={styles.datePickerTitle}>Selecionar Data</Text>
                <TouchableOpacity
                  onPress={() => {
                    setMostrarDatePickerVenda(false);
                  }}
                >
                  <Text style={styles.datePickerConfirm}>Confirmar</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.datePickerScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.datePickerSection}>
                  <Text style={styles.datePickerSectionTitle}>Dia</Text>
                  <View style={styles.datePickerRow}>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((dia) => (
                      <TouchableOpacity
                        key={dia}
                        style={[
                          styles.datePickerItem,
                          dataVenda && dataVenda.getDate() === dia && styles.datePickerItemSelected,
                        ]}
                        onPress={() => {
                          const newDate = dataVenda || new Date();
                          setDataVenda(new Date(newDate.getFullYear(), newDate.getMonth(), dia));
                        }}
                      >
                        <Text
                          style={[
                            styles.datePickerItemText,
                            dataVenda && dataVenda.getDate() === dia && styles.datePickerItemTextSelected,
                          ]}
                        >
                          {dia}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <View style={styles.datePickerSection}>
                  <Text style={styles.datePickerSectionTitle}>Mês</Text>
                  <View style={styles.datePickerRow}>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((mes) => (
                      <TouchableOpacity
                        key={mes}
                        style={[
                          styles.datePickerItem,
                          dataVenda && dataVenda.getMonth() + 1 === mes && styles.datePickerItemSelected,
                        ]}
                        onPress={() => {
                          const newDate = dataVenda || new Date();
                          setDataVenda(new Date(newDate.getFullYear(), mes - 1, newDate.getDate()));
                        }}
                      >
                        <Text
                          style={[
                            styles.datePickerItemText,
                            dataVenda && dataVenda.getMonth() + 1 === mes && styles.datePickerItemTextSelected,
                          ]}
                        >
                          {mes}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <View style={styles.datePickerSection}>
                  <Text style={styles.datePickerSectionTitle}>Ano</Text>
                  <View style={styles.datePickerRow}>
                    {Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - i).map((ano) => (
                      <TouchableOpacity
                        key={ano}
                        style={[
                          styles.datePickerItem,
                          dataVenda && dataVenda.getFullYear() === ano && styles.datePickerItemSelected,
                        ]}
                        onPress={() => {
                          const newDate = dataVenda || new Date();
                          setDataVenda(new Date(ano, newDate.getMonth(), newDate.getDate()));
                        }}
                      >
                        <Text
                          style={[
                            styles.datePickerItemText,
                            dataVenda && dataVenda.getFullYear() === ano && styles.datePickerItemTextSelected,
                          ]}
                        >
                          {ano}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: commonStyles.textPrimary,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addButton: {
    minHeight: 40,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  saveButton: {
    marginTop: 20,
  },
  pickerContainer: {
    marginBottom: 15,
  },
  pickerButton: {
    justifyContent: 'space-between',
  },
  pickerText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  optionsList: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    marginTop: 5,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  optionItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  optionItemSelected: {
    backgroundColor: '#e3f2fd',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  historicoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historicoNome: {
    fontSize: 18,
    fontWeight: 'bold',
    color: commonStyles.textPrimary,
    flex: 1,
  },
  removeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
  historicoInfo: {
    marginBottom: 8,
  },
  historicoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  historicoText: {
    fontSize: 14,
    color: commonStyles.textSecondary,
    marginLeft: 8,
  },
  historicoKm: {
    fontSize: 14,
    color: commonStyles.textSecondary,
    marginLeft: 24,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: commonStyles.borderColor,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: commonStyles.textPrimary,
  },
  modalScroll: {
    padding: 16,
  },
  modalSaveButton: {
    marginTop: 20,
  },
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxHeight: '70%',
    padding: 20,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  datePickerCancel: {
    fontSize: 16,
    color: '#666',
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  datePickerConfirm: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
  },
  datePickerSection: {
    marginBottom: 20,
  },
  datePickerSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  datePickerScroll: {
    maxHeight: 300,
  },
  datePickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 10,
  },
  datePickerItem: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 5,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  datePickerItemSelected: {
    backgroundColor: '#4CAF50',
  },
  datePickerItemText: {
    fontSize: 16,
    color: '#333',
  },
  datePickerItemTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

