import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState, useEffect } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import HeaderBar from '../components/HeaderBar';
import CameraButton from '../components/CameraButton';
import { commonStyles } from '../constants/styles';
import { cadastrarVeiculo, listarFabricantes, listarModelos, buscarAnosModelo } from '../services/api';
import { getErrorMessage, getSuccessMessage } from '../utils/errorMessages';
import { processarOcrDocumentoLocal } from '../services/ocrLocal';

// Estados para OCR Local
const [imagemDocumento, setImagemDocumento] = useState(null);
const [processandoOcr, setProcessandoOcr] = useState(false);
const [dadosOcrExtraidos, setDadosOcrExtraidos] = useState(null);
const [mostrarPreviewOcr, setMostrarPreviewOcr] = useState(false);
const [origemDados, setOrigemDados] = useState('manual'); // 'manual' | 'ocr'

export default function CadastroVeiculoScreen({ route, navigation }) {
  const { proprietarioId } = route?.params || {};
  const [placa, setPlaca] = useState('');
  const [renavam, setRenavam] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [ano, setAno] = useState('');
  const [tipoVeiculo, setTipoVeiculo] = useState('');
  const [mostrarTipoVeiculo, setMostrarTipoVeiculo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mostrarModalVeiculoExistente, setMostrarModalVeiculoExistente] = useState(false);
  
  // Dados da Aquisição (OBRIGATÓRIOS)
  const [origemPosse, setOrigemPosse] = useState(''); // 'zero_km' ou 'usado'
  const [mostrarOrigemPosse, setMostrarOrigemPosse] = useState(false);
  const [dataAquisicao, setDataAquisicao] = useState(null); // Date object
  const [dataAquisicaoFormatada, setDataAquisicaoFormatada] = useState(''); // DD/MM/YYYY para exibição
  const [mostrarDatePicker, setMostrarDatePicker] = useState(false);
  const [kmInicio, setKmInicio] = useState('');

  // Dados mestres (fabricantes/modelos/anos)
  const [fabricantes, setFabricantes] = useState([]);
  const [fabricanteSelecionado, setFabricanteSelecionado] = useState(null);
  const [modelos, setModelos] = useState([]);
  const [modeloSelecionado, setModeloSelecionado] = useState(null);
  const [anos, setAnos] = useState([]);
  const [anoSelecionado, setAnoSelecionado] = useState(null);
  const [carregandoFabricantes, setCarregandoFabricantes] = useState(false);
  const [carregandoModelos, setCarregandoModelos] = useState(false);
  const [carregandoAnos, setCarregandoAnos] = useState(false);
  const [mostrarFabricantes, setMostrarFabricantes] = useState(false);
  const [mostrarModelos, setMostrarModelos] = useState(false);
  const [mostrarAnos, setMostrarAnos] = useState(false);
  const [modoManual, setModoManual] = useState(false); // Fallback para dados não padronizados

  // Carregar fabricantes ao montar
  useEffect(() => {
    carregarFabricantes();
  }, []);

  // Carregar modelos quando fabricante for selecionado
  useEffect(() => {
    if (fabricanteSelecionado && !modoManual) {
      carregarModelos(fabricanteSelecionado.id);
    } else {
      setModelos([]);
      setModeloSelecionado(null);
      setAnos([]);
      setAnoSelecionado(null);
    }
  }, [fabricanteSelecionado, modoManual]);

  // Carregar anos quando modelo for selecionado
  useEffect(() => {
    if (modeloSelecionado && !modoManual) {
      carregarAnos(modeloSelecionado.id);
    } else {
      setAnos([]);
      setAnoSelecionado(null);
    }
  }, [modeloSelecionado, modoManual]);

  const carregarFabricantes = async () => {
    try {
      setCarregandoFabricantes(true);
      const dados = await listarFabricantes();
      setFabricantes(dados || []);
    } catch (error) {
      console.error('Erro ao carregar fabricantes:', error);
      // Se não houver dados mestres, ativar modo manual
      setModoManual(true);
    } finally {
      setCarregandoFabricantes(false);
    }
  };

  const carregarModelos = async (fabricanteId) => {
    try {
      setCarregandoModelos(true);
      const dados = await listarModelos(fabricanteId);
      setModelos(dados || []);
    } catch (error) {
      console.error('Erro ao carregar modelos:', error);
      setModelos([]);
    } finally {
      setCarregandoModelos(false);
    }
  };

  const carregarAnos = async (modeloId) => {
    try {
      setCarregandoAnos(true);
      const dados = await buscarAnosModelo(modeloId);
      setAnos(dados || []);
    } catch (error) {
      console.error('Erro ao carregar anos:', error);
      setAnos([]);
    } finally {
      setCarregandoAnos(false);
    }
  };

  // Função para formatar KM com separador de milhar
  const formatarKm = (valor) => {
    const apenasNumeros = valor.replace(/\D/g, '');
    if (!apenasNumeros) return '';
    return parseInt(apenasNumeros, 10).toLocaleString('pt-BR');
  };

  // Função para capturar foto do documento
  const capturarFotoDocumento = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'É necessário permitir o acesso à câmera para tirar foto do documento.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImagemDocumento(result.assets[0]);
        processarOcrDocumento(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erro ao capturar foto:', error);
      Alert.alert('Erro', 'Não foi possível capturar a foto. Tente novamente.');
    }
  };

  // Função para selecionar imagem da galeria
  const selecionarImagemGaleria = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'É necessário permitir o acesso à galeria para selecionar a imagem.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImagemDocumento(result.assets[0]);
        processarOcrDocumento(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem. Tente novamente.');
    }
  };

  // Função para processar OCR do documento
  const processarOcrDocumento = async (imageUri) => {
    try {
      setProcessandoOcr(true);
      setDadosOcrExtraidos(null);

      const resultado = await processarOcrDocumentoLocal(imageUri);

      if (resultado.success && resultado.dados) {
        setDadosOcrExtraidos(resultado.dados);
        setMostrarPreviewOcr(true);
        setOrigemDados('ocr');
      } else {
        Alert.alert(
          'OCR não disponível',
          'Não foi possível extrair dados automaticamente. Por favor, preencha os dados manualmente.',
          [{ text: 'OK' }]
        );
        setOrigemDados('manual');
      }
    } catch (error) {
      console.error('Erro ao processar OCR:', error);
      Alert.alert(
        'Erro no OCR',
        'Não foi possível processar a imagem. Você pode preencher os dados manualmente.',
        [{ text: 'OK' }]
      );
      setOrigemDados('manual');
    } finally {
      setProcessandoOcr(false);
    }
  };

  // Função para confirmar dados do OCR
  const confirmarDadosOcr = () => {
    if (!dadosOcrExtraidos) return;

    // Preencher campos com dados extraídos
    if (dadosOcrExtraidos.placa) {
      setPlaca(dadosOcrExtraidos.placa);
    }
    if (dadosOcrExtraidos.renavam) {
      setRenavam(dadosOcrExtraidos.renavam);
    }
    if (dadosOcrExtraidos.ano) {
      setAno(dadosOcrExtraidos.ano);
      setAnoSelecionado(parseInt(dadosOcrExtraidos.ano));
    }
    if (dadosOcrExtraidos.marca) {
      setMarca(dadosOcrExtraidos.marca);
    }
    if (dadosOcrExtraidos.modelo) {
      setModelo(dadosOcrExtraidos.modelo);
    }

    setMostrarPreviewOcr(false);
    Alert.alert('Sucesso', 'Dados extraídos foram preenchidos. Revise e confirme antes de salvar.');
  };

  // Função para descartar dados do OCR
  const descartarDadosOcr = () => {
    setDadosOcrExtraidos(null);
    setImagemDocumento(null);
    setMostrarPreviewOcr(false);
    setOrigemDados('manual');
  };

  const tiposVeiculo = [
    { value: 'carro', label: 'Carro' },
    { value: 'moto', label: 'Moto' },
    { value: 'caminhao', label: 'Caminhão' },
    { value: 'van', label: 'Van' },
    { value: 'caminhonete', label: 'Caminhonete' },
    { value: 'onibus', label: 'Ônibus' },
    { value: 'barco', label: 'Barco' },
  ];

  // Estados para validação visual
  const [erros, setErros] = useState({});

  const validarFormulario = () => {
    const novosErros = {};

    // Modelo pode vir de modelo_id (dados mestres) ou modelo (legado)
    if (!modoManual && !modeloSelecionado) {
      novosErros.modelo = 'Selecione o modelo';
    } else if (modoManual && !modelo.trim()) {
      novosErros.modelo = 'O modelo é obrigatório';
    }
    
    // Ano pode vir de ano_modelo (dados mestres) ou ano (legado)
    if (!modoManual && !anoSelecionado) {
      novosErros.ano = 'Selecione o ano';
    } else if (modoManual && !ano.trim()) {
      novosErros.ano = 'O ano é obrigatório';
    }

    // Validações de Dados da Aquisição (OBRIGATÓRIAS)
    if (!origemPosse || !['zero_km', 'usado'].includes(origemPosse)) {
      novosErros.origemPosse = 'Selecione o tipo de aquisição';
    }

    if (!dataAquisicao) {
      novosErros.dataAquisicao = 'Data de aquisição é obrigatória';
    } else {
      const hoje = new Date();
      hoje.setHours(23, 59, 59, 999);
      if (dataAquisicao > hoje) {
        novosErros.dataAquisicao = 'A data não pode ser futura';
      }
    }

    // Se usado, KM inicial é obrigatório
    if (origemPosse === 'usado') {
      if (!kmInicio || kmInicio.trim() === '') {
        novosErros.kmInicio = 'KM inicial é obrigatório para veículos usados';
      } else {
        const kmNum = parseInt(kmInicio);
        if (isNaN(kmNum) || kmNum < 0) {
          novosErros.kmInicio = 'KM inicial deve ser um número maior ou igual a 0';
        }
      }
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const enviarVeiculo = async () => {
    // Validações obrigatórias
    if (!validarFormulario()) {
      Alert.alert('Atenção', 'Por favor, corrija os erros no formulário');
      return;
    }

    setLoading(true);
    try {
      const response = await cadastrarVeiculo({ 
        placa: placa.trim() ? placa.trim().toUpperCase() : null, 
        renavam: renavam.trim() || null,
        marca: modoManual ? (marca.trim() || null) : null,
        modelo: modoManual ? modelo.trim() : (modeloSelecionado?.nome || modelo.trim() || null),
        ano: modoManual ? ano.trim() : (anoSelecionado?.toString() || ano.trim() || null),
        tipo_veiculo: tipoVeiculo || null,
        proprietario_id: proprietarioId || null,
        origem_posse: origemPosse,
        data_aquisicao: dataAquisicao ? dataAquisicao.toISOString().split('T')[0] : null, // Converter Date para YYYY-MM-DD
        km_aquisicao: origemPosse === 'zero_km' ? 0 : parseInt(kmInicio.replace(/\D/g, '')) || 0,
        // Dados mestres (se selecionados)
        fabricante_id: !modoManual && fabricanteSelecionado ? fabricanteSelecionado.id : null,
        modelo_id: !modoManual && modeloSelecionado ? modeloSelecionado.id : null,
        ano_modelo: !modoManual && anoSelecionado ? anoSelecionado : null,
        dados_nao_padronizados: modoManual,
        // Origem dos dados (manual ou OCR)
        origem_dados: origemDados
      });
      if (response && response.id) {
        const returnTo = route?.params?.returnTo;
        Alert.alert('Sucesso', getSuccessMessage('veiculo'), [
          {
            text: 'OK',
            onPress: () => {
              setPlaca(''); setRenavam(''); setMarca(''); setModelo(''); setAno(''); setTipoVeiculo('');
              setOrigemPosse(''); setDataAquisicao(null); setDataAquisicaoFormatada(''); setKmInicio('');
              // Navegar conforme contexto
              if (returnTo === 'GerenciarVeiculos') {
                navigation.navigate('GerenciarVeiculos', { refresh: true });
              } else {
                // Navegar para HomeDashboard com refresh
                navigation.navigate('HomeDashboard', { refresh: true });
              }
            }
          }
        ]);
      } else {
        throw new Error('Resposta inválida do servidor');
      }
    } catch (error) {
      console.error('Erro ao cadastrar veículo:', error);
      
      // Tratar erro de veículo já existente
      if (error.codigo === 'VEICULO_JA_EXISTE') {
        setMostrarModalVeiculoExistente(true);
        return;
      }
      
      // Tratar erro de aquisição obrigatória
      if (error.code === 'AQUISICAO_OBRIGATORIA') {
        Alert.alert(
          'Dados de Aquisição Obrigatórios',
          error.message || 'Por favor, preencha todos os dados de aquisição do veículo.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      Alert.alert('Ops!', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={commonStyles.container}>
        <HeaderBar title="Cadastrar Veículo" navigation={navigation} />
        <View style={commonStyles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={commonStyles.loadingText}>Salvando veículo...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={commonStyles.container}>
      <HeaderBar title="Cadastrar Veículo" navigation={navigation} />

      <ScrollView style={commonStyles.scrollContainer}>
        <View style={commonStyles.card}>
          {proprietarioId && (
            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={20} color="#2196F3" />
              <Text style={styles.infoText}>Veículo será vinculado ao proprietário selecionado</Text>
            </View>
          )}

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
              style={[commonStyles.input, erros.modelo && styles.inputError]}
              placeholder="Ex: Corolla, Civic, Uno..."
              placeholderTextColor="#999"
              value={modelo}
              onChangeText={(text) => {
                setModelo(text);
                if (erros.modelo) {
                  setErros({ ...erros, modelo: null });
                }
              }}
              autoCapitalize="words"
            />
          </View>
          {erros.modelo && <Text style={styles.errorText}>{erros.modelo}</Text>}

          {/* Ano - apenas se modo manual ou não selecionado via dados mestres */}
          {(modoManual || !anoSelecionado) && (
            <>
              <Text style={commonStyles.label}>Ano *</Text>
              <View style={commonStyles.inputContainer}>
                <Ionicons name="calendar-outline" size={20} color="#666" style={commonStyles.inputIcon} />
                <TextInput
                  style={[commonStyles.input, erros.ano && styles.inputError]}
                  placeholder="Ano do veículo *"
                  placeholderTextColor="#999"
                  value={ano}
                  onChangeText={(text) => {
                    setAno(text);
                    if (erros.ano) {
                      setErros({ ...erros, ano: null });
                    }
                  }}
                  keyboardType="numeric"
                  maxLength={4}
                />
              </View>
              {erros.ano && <Text style={styles.errorText}>{erros.ano}</Text>}
            </>
          )}

          <Text style={commonStyles.label}>Tipo de Veículo</Text>
          <View style={styles.pickerContainer}>
            <TouchableOpacity 
              style={[commonStyles.inputContainer, styles.pickerButton]}
              onPress={() => setMostrarTipoVeiculo(true)}
            >
              <Ionicons name="car-sport-outline" size={20} color="#666" style={commonStyles.inputIcon} />
              <Text style={styles.pickerText}>
                {tipoVeiculo 
                  ? tiposVeiculo.find(t => t.value === tipoVeiculo)?.label || tipoVeiculo
                  : 'Selecione o tipo (opcional)'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Seção: Dados da Aquisição (OBRIGATÓRIA) */}
          <View style={styles.sectionDivider} />
          <Text style={[commonStyles.label, styles.sectionTitle]}>Dados da Aquisição *</Text>
          
          <Text style={commonStyles.label}>Tipo de Aquisição *</Text>
          <View style={styles.pickerContainer}>
            <TouchableOpacity 
              style={[commonStyles.inputContainer, styles.pickerButton, (!origemPosse || erros.origemPosse) && styles.inputRequired]}
              onPress={() => setMostrarOrigemPosse(true)}
            >
              <Ionicons name="document-text-outline" size={20} color="#666" style={commonStyles.inputIcon} />
              <Text style={styles.pickerText}>
                {origemPosse === 'zero_km' ? 'Zero KM' : origemPosse === 'usado' ? 'Usado' : 'Selecione o tipo *'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
          </View>
          {erros.origemPosse && <Text style={styles.errorText}>{erros.origemPosse}</Text>}

          <Text style={commonStyles.label}>Data de Aquisição *</Text>
          <TouchableOpacity
            style={[commonStyles.inputContainer, erros.dataAquisicao && styles.inputError]}
            onPress={() => setMostrarDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#666" style={commonStyles.inputIcon} />
            <Text style={[commonStyles.input, { color: dataAquisicaoFormatada ? '#333' : '#999', paddingVertical: 12 }]}>
              {dataAquisicaoFormatada || 'Selecione a data de aquisição'}
            </Text>
          </TouchableOpacity>
          {erros.dataAquisicao && <Text style={styles.errorText}>{erros.dataAquisicao}</Text>}
          
          {/* DatePicker nativo - sempre renderizar no iOS, controlar visibilidade via estado */}
          {Platform.OS === 'ios' ? (
            mostrarDatePicker && (
              <View style={styles.datePickerContainer}>
                <View style={styles.datePickerHeader}>
                  <TouchableOpacity
                    onPress={() => setMostrarDatePicker(false)}
                    style={styles.datePickerButton}
                  >
                    <Text style={styles.datePickerButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <Text style={styles.datePickerTitle}>Selecione a data</Text>
                  <TouchableOpacity
                    onPress={() => {
                      if (dataAquisicao) {
                        setMostrarDatePicker(false);
                      }
                    }}
                    style={styles.datePickerButton}
                  >
                    <Text style={[styles.datePickerButtonText, styles.datePickerButtonConfirm]}>
                      Confirmar
                    </Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={dataAquisicao || new Date()}
                  mode="date"
                  display="spinner"
                  maximumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    if (event.type === 'set' && selectedDate) {
                      setDataAquisicao(selectedDate);
                      // Formatar para DD/MM/YYYY para exibição
                      const day = String(selectedDate.getDate()).padStart(2, '0');
                      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                      const year = selectedDate.getFullYear();
                      setDataAquisicaoFormatada(`${day}/${month}/${year}`);
                      if (erros.dataAquisicao) {
                        setErros({ ...erros, dataAquisicao: null });
                      }
                    }
                  }}
                />
              </View>
            )
          ) : (
            mostrarDatePicker && (
              <DateTimePicker
                value={dataAquisicao || new Date()}
                mode="date"
                display="default"
                maximumDate={new Date()}
                onChange={(event, selectedDate) => {
                  setMostrarDatePicker(false);
                  if (event.type === 'set' && selectedDate) {
                    setDataAquisicao(selectedDate);
                    // Formatar para DD/MM/YYYY para exibição
                    const day = String(selectedDate.getDate()).padStart(2, '0');
                    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                    const year = selectedDate.getFullYear();
                    setDataAquisicaoFormatada(`${day}/${month}/${year}`);
                    if (erros.dataAquisicao) {
                      setErros({ ...erros, dataAquisicao: null });
                    }
                  }
                }}
              />
            )
          )}

          {origemPosse === 'zero_km' && (
            <>
              <Text style={commonStyles.label}>KM Inicial</Text>
              <View style={[commonStyles.inputContainer, styles.inputDisabled]}>
                <Ionicons name="speedometer-outline" size={20} color="#999" style={commonStyles.inputIcon} />
                <TextInput
                  style={[commonStyles.input, styles.inputDisabledText]}
                  placeholder="0 (automático para Zero KM)"
                  placeholderTextColor="#999"
                  value="0"
                  editable={false}
                />
              </View>
            </>
          )}

          {origemPosse === 'usado' && (
            <>
              <Text style={commonStyles.label}>KM Inicial *</Text>
              <View style={commonStyles.inputContainer}>
                <Ionicons name="speedometer-outline" size={20} color="#666" style={commonStyles.inputIcon} />
                <TextInput
                  style={[commonStyles.input, erros.kmInicio && styles.inputError]}
                  placeholder="KM inicial no momento da aquisição *"
                  placeholderTextColor="#999"
                  value={formatarKm(kmInicio)}
                  onChangeText={(text) => {
                    // Remover formatação para armazenar apenas números
                    const apenasNumeros = text.replace(/\D/g, '');
                    setKmInicio(apenasNumeros);
                    if (erros.kmInicio) {
                      setErros({ ...erros, kmInicio: null });
                    }
                  }}
                  keyboardType="numeric"
                />
              </View>
              {erros.kmInicio && <Text style={styles.errorText}>{erros.kmInicio}</Text>}
            </>
          )}

          {/* Microcopy informativo */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={16} color="#666" />
            <Text style={styles.infoText}>
              Essas informações garantem a rastreabilidade do histórico do veículo e não podem ser removidas posteriormente.
            </Text>
          </View>
          
          {/* Microcopy de confiança */}
          <View style={styles.infoBox}>
            <Ionicons name="shield-checkmark-outline" size={16} color="#4CAF50" />
            <Text style={styles.infoText}>
              Esses dados garantem a rastreabilidade do histórico e evitam duplicidade de veículos.
            </Text>
          </View>

          <TouchableOpacity
            style={[commonStyles.button, loading && commonStyles.buttonDisabled]}
            onPress={enviarVeiculo}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text 
                style={commonStyles.buttonText}
                numberOfLines={1}
                allowFontScaling={false}
              >
                Cadastrar Veículo
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal de Seleção de Tipo de Veículo */}
      <Modal
        visible={mostrarTipoVeiculo}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMostrarTipoVeiculo(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setMostrarTipoVeiculo(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecione o Tipo de Veículo</Text>
              <TouchableOpacity
                onPress={() => setMostrarTipoVeiculo(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.modalScrollView}
              showsVerticalScrollIndicator={true}
            >
              {tiposVeiculo.map(tipo => (
                <TouchableOpacity
                  key={tipo.value}
                  style={[
                    styles.modalOptionItem,
                    tipoVeiculo === tipo.value && styles.modalOptionItemSelected
                  ]}
                  onPress={() => {
                    setTipoVeiculo(tipo.value);
                    setMostrarTipoVeiculo(false);
                  }}
                >
                  <Text style={[
                    styles.modalOptionText,
                    tipoVeiculo === tipo.value && styles.modalOptionTextSelected
                  ]}>
                    {tipo.label}
                  </Text>
                  {tipoVeiculo === tipo.value && (
                    <Ionicons name="checkmark" size={20} color="#4CAF50" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Pressable>
        </Modal>

      {/* Modal de Seleção de Tipo de Aquisição */}
      <Modal
        visible={mostrarOrigemPosse}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMostrarOrigemPosse(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setMostrarOrigemPosse(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tipo de Aquisição</Text>
              <TouchableOpacity
                onPress={() => setMostrarOrigemPosse(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.modalScrollView}
              showsVerticalScrollIndicator={true}
            >
              <TouchableOpacity
                style={[
                  styles.modalOptionItem,
                  origemPosse === 'zero_km' && styles.modalOptionItemSelected
                ]}
                onPress={() => {
                  setOrigemPosse('zero_km');
                  setKmInicio('0'); // Auto-preencher KM inicial como 0
                  setErros({ ...erros, origemPosse: null });
                  setMostrarOrigemPosse(false);
                }}
              >
                <Text style={[
                  styles.modalOptionText,
                  origemPosse === 'zero_km' && styles.modalOptionTextSelected
                ]}>
                  Zero KM
                </Text>
                {origemPosse === 'zero_km' && (
                  <Ionicons name="checkmark" size={20} color="#4CAF50" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalOptionItem,
                  origemPosse === 'usado' && styles.modalOptionItemSelected
                ]}
                onPress={() => {
                  setOrigemPosse('usado');
                  setKmInicio(''); // Limpar KM inicial para o usuário preencher
                  setErros({ ...erros, origemPosse: null, kmInicio: null });
                  setMostrarOrigemPosse(false);
                }}
              >
                <Text style={[
                  styles.modalOptionText,
                  origemPosse === 'usado' && styles.modalOptionTextSelected
                ]}>
                  Usado
                </Text>
                {origemPosse === 'usado' && (
                  <Ionicons name="checkmark" size={20} color="#4CAF50" />
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* Modal: Veículo já existe */}
      <Modal
        visible={mostrarModalVeiculoExistente}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMostrarModalVeiculoExistente(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setMostrarModalVeiculoExistente(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Veículo já cadastrado</Text>
              <TouchableOpacity
                onPress={() => setMostrarModalVeiculoExistente(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <View style={styles.modalIconContainer}>
                <Ionicons name="information-circle" size={64} color="#FF9800" />
              </View>
              <Text style={styles.modalText}>
                Este veículo já existe no sistema TROIA.
              </Text>
              <Text style={styles.modalSubtext}>
                Para acessar o histórico, solicite o link ao proprietário atual.
              </Text>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setMostrarModalVeiculoExistente(false)}
              >
                <Text style={styles.modalButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
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
    maxHeight: Dimensions.get('window').height * 0.6,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
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
  modalCloseButton: {
    padding: 4,
  },
  modalScrollView: {
    maxHeight: Dimensions.get('window').height * 0.5,
  },
  modalOptionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalOptionItemSelected: {
    backgroundColor: '#e8f5e9',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333',
  },
  modalOptionTextSelected: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#1976d2',
    flex: 1,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  inputRequired: {
    borderColor: '#FF9800',
    borderWidth: 1,
  },
  inputError: {
    borderColor: '#F44336',
    borderWidth: 1,
  },
  inputDisabled: {
    backgroundColor: '#f5f5f5',
    opacity: 0.7,
  },
  inputDisabledText: {
    color: '#999',
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 8,
    marginLeft: 4,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#666',
    flex: 1,
    lineHeight: 18,
  },
  datePickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 15,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: 10,
  },
  datePickerButton: {
    padding: 8,
  },
  datePickerButtonText: {
    fontSize: 16,
    color: '#666',
  },
  datePickerButtonConfirm: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  datePickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  fallbackButton: {
    marginTop: 10,
    marginBottom: 15,
    padding: 12,
    alignItems: 'center',
  },
  fallbackText: {
    fontSize: 14,
    color: '#2196F3',
    textDecorationLine: 'underline',
  },
  modalBody: {
    padding: 20,
    alignItems: 'center',
  },
  modalIconContainer: {
    marginBottom: 16,
  },
  modalText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '500',
  },
  modalSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    minWidth: 120,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  ocrBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  ocrBannerText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#1976D2',
    fontWeight: '500',
  },
  ocrButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  ocrButton: {
    flex: 1,
  },
  ocrPreviewContainer: {
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
    position: 'relative',
  },
  ocrPreviewImage: {
    width: '100%',
    height: 200,
  },
  ocrProcessingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ocrProcessingText: {
    marginTop: 12,
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  ocrDataPreview: {
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 16,
  },
  ocrDataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  ocrDataLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  ocrDataValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  ocrBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  ocrBadgeText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#f5f5f5',
  },
  modalButtonConfirm: {
    backgroundColor: '#4CAF50',
  },
  modalButtonTextCancel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  modalButtonTextConfirm: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});
