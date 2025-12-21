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
// OCR local desabilitado - será implementado futuramente
// import { processarOcrDocumentoLocal } from '../services/ocrLocal';
import { getMetricaPorTipo } from '../utils/tipoEquipamento';

export default function CadastroVeiculoScreen({ route, navigation }) {
  const { proprietarioId } = route?.params || {};
  
  // Estados para OCR Local (movidos para dentro do componente)
  const [imagemDocumento, setImagemDocumento] = useState(null);
  const [processandoOcr, setProcessandoOcr] = useState(false);
  const [dadosOcrExtraidos, setDadosOcrExtraidos] = useState(null);
  const [mostrarPreviewOcr, setMostrarPreviewOcr] = useState(false);
  const [origemDados, setOrigemDados] = useState('manual'); // 'manual' | 'ocr'
  const [documentoUrl, setDocumentoUrl] = useState(null);
  const [documentoPendenteOcr, setDocumentoPendenteOcr] = useState(false);
  
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

  // Carregar fabricantes quando tipo for selecionado
  useEffect(() => {
    if (tipoVeiculo && !modoManual) {
      carregarFabricantes(tipoVeiculo);
    } else {
      setFabricantes([]);
      setFabricanteSelecionado(null);
      setModelos([]);
      setModeloSelecionado(null);
      setAnos([]);
      setAnoSelecionado(null);
    }
    // Limpar seleções quando tipo muda
    if (!tipoVeiculo) {
      setFabricanteSelecionado(null);
      setModeloSelecionado(null);
      setAnoSelecionado(null);
    }
  }, [tipoVeiculo, modoManual]);

  // Carregar modelos quando fabricante for selecionado
  useEffect(() => {
    // Bloquear chamada se não tiver tipo ou fabricante
    if (!tipoVeiculo || !fabricanteSelecionado || modoManual) {
      setModelos([]);
      setModeloSelecionado(null);
      setAnos([]);
      setAnoSelecionado(null);
      return;
    }
    
    // Só chamar API se tiver ambos
    if (fabricanteSelecionado.id && tipoVeiculo) {
      carregarModelos(fabricanteSelecionado.id, tipoVeiculo);
    }
  }, [fabricanteSelecionado, tipoVeiculo, modoManual]);

  // Carregar anos quando modelo for selecionado
  useEffect(() => {
    if (modeloSelecionado && !modoManual) {
      carregarAnos(modeloSelecionado.id);
    } else {
      setAnos([]);
      setAnoSelecionado(null);
    }
  }, [modeloSelecionado, modoManual]);

  const carregarFabricantes = async (tipo) => {
    if (!tipo) return;
    try {
      setCarregandoFabricantes(true);
      const dados = await listarFabricantes(tipo);
      setFabricantes(dados || []);
    } catch (error) {
      console.error('Erro ao carregar fabricantes:', error);
      // Se não houver dados mestres, ativar modo manual
      setModoManual(true);
    } finally {
      setCarregandoFabricantes(false);
    }
  };

  const carregarModelos = async (fabricanteId, tipo) => {
    // Validação obrigatória antes de chamar API
    if (!fabricanteId || !tipo) {
      setModelos([]);
      setModeloSelecionado(null);
      return;
    }
    
    try {
      setCarregandoModelos(true);
      const dados = await listarModelos(fabricanteId, tipo);
      setModelos(dados || []);
    } catch (error) {
      console.error('Erro ao carregar modelos:', error);
      setModelos([]);
      setModeloSelecionado(null);
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
        setDocumentoUrl(result.assets[0].uri);
        setDocumentoPendenteOcr(true);
        // OCR local desabilitado - documento será processado posteriormente
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
        setDocumentoUrl(result.assets[0].uri);
        setDocumentoPendenteOcr(true);
        // OCR local desabilitado - documento será processado posteriormente
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem. Tente novamente.');
    }
  };

  // Função para selecionar documento (PDF ou foto)
  const selecionarDocumento = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'É necessário permitir o acesso à galeria para selecionar o documento.');
        return;
      }

      // Por enquanto, permite apenas imagens (PDF requer expo-document-picker)
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setImagemDocumento(asset);
        // Definir documento_url e flag de OCR pendente
        setDocumentoUrl(asset.uri);
        setDocumentoPendenteOcr(true);
        // OCR local desabilitado - documento será processado posteriormente
      }
    } catch (error) {
      console.warn('Erro ao selecionar documento:', error);
      Alert.alert('Erro', 'Não foi possível selecionar o documento. Tente novamente.');
    }
  };

  // Função para processar OCR do documento (DESABILITADA)
  // OCR local será implementado futuramente
  const processarOcrDocumento = async (imageUri) => {
    // OCR local não está implementado - apenas armazenar documento
    // O documento será processado posteriormente quando OCR estiver disponível
    console.log('[CadastroVeiculo] OCR local desabilitado. Documento será processado posteriormente.');
    setOrigemDados('manual');
    setDocumentoPendenteOcr(true);
  };

  // Funções de OCR removidas - OCR local desabilitado

  const tiposEquipamento = [
    { value: 'carro', label: 'Carro' },
    { value: 'moto', label: 'Moto' },
    { value: 'caminhao', label: 'Caminhão' },
    { value: 'onibus', label: 'Ônibus' },
    { value: 'barco', label: 'Barco' },
    { value: 'jetski', label: 'Jetski' },
    { value: 'maquina_agricola', label: 'Máquina Agrícola' },
    { value: 'maquina_industrial', label: 'Máquina Industrial' },
    { value: 'outro', label: 'Outro' },
  ];

  // Estados para validação visual
  const [erros, setErros] = useState({});

  const validarFormulario = () => {
    const novosErros = {};

    // Tipo do equipamento é obrigatório
    if (!tipoVeiculo) {
      novosErros.tipoVeiculo = 'Selecione o tipo do equipamento';
    }

    // Modelo pode vir de modelo_id (dados mestres) ou modelo (legado)
    // No modo manual, não validar modelo/ano (apenas avisar)
    if (!modoManual) {
      if (tipoVeiculo && !fabricanteSelecionado) {
        novosErros.fabricante = 'Selecione o fabricante';
      }
      if (tipoVeiculo && fabricanteSelecionado && !modeloSelecionado) {
        novosErros.modelo = 'Selecione o modelo';
      }
      if (tipoVeiculo && modeloSelecionado && !anoSelecionado) {
        novosErros.ano = 'Selecione o ano';
      }
    } else {
      // Modo manual: validar apenas se campos estiverem preenchidos
      if (!modelo.trim()) {
        novosErros.modelo = 'O modelo é obrigatório';
      }
      if (!ano.trim()) {
        novosErros.ano = 'O ano é obrigatório';
      }
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

    // Se usado, valor inicial é obrigatório
    if (origemPosse === 'usado') {
      const metricaLabel = tipoVeiculo ? getMetricaPorTipo(tipoVeiculo).labelLong : 'KM';
      if (!kmInicio || kmInicio.trim() === '') {
        novosErros.kmInicio = `${metricaLabel} inicial é obrigatório para equipamentos usados`;
      } else {
        const kmNum = parseInt(kmInicio);
        if (isNaN(kmNum) || kmNum < 0) {
          novosErros.kmInicio = `${metricaLabel} inicial deve ser um número maior ou igual a 0`;
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

    // Determinar métrica baseada no tipo de equipamento
    const metrica = tipoVeiculo ? getMetricaPorTipo(tipoVeiculo) : { key: 'km', labelLong: 'Quilometragem' };
    const valorInicial = origemPosse === 'zero_km' ? 0 : parseInt(kmInicio.replace(/\D/g, '')) || 0;
    
    // Validar valor antes do envio (exceto para tipo configuravel e zero_km)
    if (metrica.key !== 'configuravel' && origemPosse === 'usado') {
      if (!valorInicial || isNaN(Number(valorInicial)) || valorInicial < 0) {
        Alert.alert(
          'Valor inválido',
          `Informe ${metrica.labelLong.toLowerCase()} inicial válida`
        );
        return;
      }
    }
    
    setLoading(true);
    try {
      // Construir payload base
      const payload = {
        placa: placa.trim() ? placa.trim().toUpperCase() : null, 
        renavam: renavam.trim() || null,
        marca: modoManual ? (marca.trim() || null) : null,
        modelo: modoManual ? modelo.trim() : (modeloSelecionado?.nome || modelo.trim() || null),
        ano: modoManual ? ano.trim() : (anoSelecionado?.toString() || ano.trim() || null),
        tipo_veiculo: tipoVeiculo || null,
        proprietario_id: proprietarioId || null,
        origem_posse: origemPosse,
        data_aquisicao: dataAquisicao ? dataAquisicao.toISOString().split('T')[0] : null, // Converter Date para YYYY-MM-DD
        // Dados mestres (se selecionados)
        fabricante_id: !modoManual && fabricanteSelecionado ? fabricanteSelecionado.id : null,
        modelo_id: !modoManual && modeloSelecionado ? modeloSelecionado.id : null,
        ano_modelo: !modoManual && anoSelecionado ? anoSelecionado : null,
        dados_nao_padronizados: modoManual,
        // Origem dos dados (manual ou OCR)
        origem_dados: origemDados,
        // Documento do equipamento (usar URI do asset se existir, senão documentoUrl)
        documento_url: imagemDocumento?.uri || documentoUrl || null,
        documento_pendente_ocr: documentoPendenteOcr || !!imagemDocumento,
        // Inicializar campos de métrica como null
        km_inicial: null,
        horas_inicial: null
      };
      
      // Adicionar métrica correta baseada no tipo
      if (metrica.key === 'km') {
        payload.km_inicial = Number(valorInicial);
        // Backend ainda aceita km_aquisicao para compatibilidade
        payload.km_aquisicao = Number(valorInicial);
      } else if (metrica.key === 'horas') {
        payload.horas_inicial = Number(valorInicial);
        // Backend ainda aceita km_aquisicao para compatibilidade (será convertido internamente)
        payload.km_aquisicao = Number(valorInicial);
      } else if (metrica.key === 'configuravel') {
        // Para tipo "outro", não criar histórico automático
        payload.km_inicial = null;
        payload.horas_inicial = null;
        // Para tipo "outro", enviar 0 para não quebrar backend (histórico será criado manualmente depois)
        payload.km_aquisicao = 0;
      }
      
      const response = await cadastrarVeiculo(payload);
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
              <Text style={styles.infoText}>Equipamento será vinculado ao proprietário selecionado</Text>
            </View>
          )}

          {/* Tipo do Equipamento (PRIMEIRO CAMPO) */}
          <Text style={commonStyles.label}>Tipo do Equipamento *</Text>
          <View style={styles.pickerContainer}>
            <TouchableOpacity 
              style={[commonStyles.inputContainer, styles.pickerButton, (!tipoVeiculo || erros.tipoVeiculo) && styles.inputRequired]}
              onPress={() => setMostrarTipoVeiculo(true)}
            >
              <Ionicons name="car-sport-outline" size={20} color="#666" style={commonStyles.inputIcon} />
              <Text style={styles.pickerText}>
                {tipoVeiculo 
                  ? tiposEquipamento.find(t => t.value === tipoVeiculo)?.label || tipoVeiculo
                  : 'Selecione o tipo do equipamento *'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
          </View>
          {erros.tipoVeiculo && <Text style={styles.errorText}>{erros.tipoVeiculo}</Text>}
          {!tipoVeiculo && (
            <Text style={styles.helperText}>
              Selecione o tipo do equipamento primeiro para continuar
            </Text>
          )}
          {tipoVeiculo === 'outro' && (
            <View style={[styles.infoBox, styles.infoBoxNeutral]}>
              <Ionicons name="information-circle-outline" size={16} color="#666" />
              <Text style={[styles.infoText, { color: '#666' }]}>
                Este tipo permite uso livre e personalizado. Algumas comparações automáticas e métricas padrão podem não se aplicar.
              </Text>
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

          {/* Modo Guiado (Padrão) */}
          {!modoManual ? (
            <>
              <Text style={commonStyles.label}>Fabricante *</Text>
              <TouchableOpacity
                style={[
                  commonStyles.inputContainer, 
                  styles.pickerButton, 
                  erros.fabricante && styles.inputError,
                  !tipoVeiculo && styles.inputDisabled
                ]}
                onPress={() => tipoVeiculo && setMostrarFabricantes(true)}
                disabled={!tipoVeiculo}
              >
                <Ionicons name="car-sport-outline" size={20} color="#666" style={commonStyles.inputIcon} />
                <Text style={[
                  styles.pickerText, 
                  (!fabricanteSelecionado || !tipoVeiculo) && styles.pickerTextPlaceholder
                ]}>
                  {!tipoVeiculo 
                    ? 'Selecione o tipo do equipamento primeiro'
                    : fabricanteSelecionado 
                      ? fabricanteSelecionado.nome 
                      : 'Selecione o fabricante *'}
                </Text>
                {carregandoFabricantes ? (
                  <ActivityIndicator size="small" color="#666" />
                ) : (
                  <Ionicons name="chevron-down" size={20} color="#666" />
                )}
              </TouchableOpacity>
              {erros.fabricante && <Text style={styles.errorText}>{erros.fabricante}</Text>}

              {fabricanteSelecionado && tipoVeiculo && (
                <>
                  <Text style={commonStyles.label}>Modelo *</Text>
                  <TouchableOpacity
                    style={[
                      commonStyles.inputContainer, 
                      styles.pickerButton, 
                      erros.modelo && styles.inputError,
                      (!fabricanteSelecionado || !tipoVeiculo) && styles.inputDisabled
                    ]}
                    onPress={() => (fabricanteSelecionado && tipoVeiculo) && setMostrarModelos(true)}
                    disabled={!fabricanteSelecionado || !tipoVeiculo || carregandoModelos}
                  >
                    <Ionicons name="car-outline" size={20} color="#666" style={commonStyles.inputIcon} />
                    <Text style={[styles.pickerText, !modeloSelecionado && styles.pickerTextPlaceholder]}>
                      {modeloSelecionado ? modeloSelecionado.nome : 'Selecione o modelo *'}
                    </Text>
                    {carregandoModelos ? (
                      <ActivityIndicator size="small" color="#666" />
                    ) : (
                      <Ionicons name="chevron-down" size={20} color="#666" />
                    )}
                  </TouchableOpacity>
                  {erros.modelo && <Text style={styles.errorText}>{erros.modelo}</Text>}
                </>
              )}

              {modeloSelecionado && tipoVeiculo && (
                <>
                  <Text style={commonStyles.label}>Ano do Modelo *</Text>
                  <TouchableOpacity
                    style={[
                      commonStyles.inputContainer, 
                      styles.pickerButton, 
                      erros.ano && styles.inputError,
                      (!modeloSelecionado || !tipoVeiculo) && styles.inputDisabled
                    ]}
                    onPress={() => (modeloSelecionado && tipoVeiculo) && setMostrarAnos(true)}
                    disabled={!modeloSelecionado || !tipoVeiculo || carregandoAnos}
                  >
                    <Ionicons name="calendar-outline" size={20} color="#666" style={commonStyles.inputIcon} />
                    <Text style={[styles.pickerText, !anoSelecionado && styles.pickerTextPlaceholder]}>
                      {anoSelecionado ? anoSelecionado.toString() : 'Selecione o ano *'}
                    </Text>
                    {carregandoAnos ? (
                      <ActivityIndicator size="small" color="#666" />
                    ) : (
                      <Ionicons name="chevron-down" size={20} color="#666" />
                    )}
                  </TouchableOpacity>
                  {erros.ano && <Text style={styles.errorText}>{erros.ano}</Text>}
                </>
              )}

              {/* Botão para ativar modo manual */}
              {tipoVeiculo && (
                <TouchableOpacity
                  style={styles.modoManualButton}
                  onPress={() => {
                    setModoManual(true);
                    setFabricanteSelecionado(null);
                    setModeloSelecionado(null);
                    setAnoSelecionado(null);
                    setErros({ ...erros, fabricante: null, modelo: null, ano: null });
                  }}
                >
                  <Ionicons name="create-outline" size={16} color="#666" />
                  <Text style={styles.modoManualButtonText}>Não encontrei meu modelo</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <>
              {/* Modo Manual */}
              <View style={styles.modoManualHeader}>
                <Text style={styles.modoManualTitle}>Modo Manual</Text>
                <TouchableOpacity
                  onPress={() => {
                    setModoManual(false);
                    setMarca('');
                    setModelo('');
                    setAno('');
                    setErros({ ...erros, modelo: null, ano: null });
                  }}
                >
                  <Text style={styles.modoManualLink}>Voltar ao modo guiado</Text>
                </TouchableOpacity>
              </View>

              <Text style={commonStyles.label}>Fabricante / Marca *</Text>
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

              <Text style={commonStyles.label}>Modelo *</Text>
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

              {/* Aviso leve no modo manual */}
              <View style={[styles.infoBox, styles.infoBoxWarning]}>
                <Ionicons name="information-circle-outline" size={16} color="#FF9800" />
                <Text style={styles.infoTextWarning}>
                  Esses dados poderão ser ajustados depois, se necessário.
                </Text>
              </View>
            </>
          )}


          {/* Seção: Documento do Equipamento (Opcional) */}
          <View style={styles.sectionDivider} />
          <Text style={[commonStyles.label, styles.sectionTitle]}>Documento do Equipamento (Opcional)</Text>
          
          {/* Mensagem informativa sobre OCR futuro */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={18} color="#2196F3" />
            <Text style={styles.infoText}>
              Leitura automática será disponibilizada em breve. Por enquanto, você pode anexar o documento (CRLV, nota fiscal, etc.) em PDF ou foto para referência futura.
            </Text>
          </View>
          
          <View style={styles.ocrButtonsContainer}>
            <TouchableOpacity
              style={[styles.ocrButton, styles.ocrButtonSecondary]}
              onPress={capturarFotoDocumento}
            >
              <Ionicons name="camera-outline" size={20} color="#4CAF50" />
              <Text style={[styles.ocrButtonText, styles.ocrButtonTextSecondary]}>Tirar Foto</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.ocrButton, styles.ocrButtonSecondary]}
              onPress={selecionarDocumento}
            >
              <Ionicons name="document-attach-outline" size={20} color="#4CAF50" />
              <Text style={[styles.ocrButtonText, styles.ocrButtonTextSecondary]}>PDF ou Foto</Text>
            </TouchableOpacity>
          </View>

          {(imagemDocumento || documentoUrl) && (
            <View style={styles.ocrImagePreview}>
              {imagemDocumento?.uri ? (
                <Image source={{ uri: imagemDocumento.uri }} style={styles.ocrImage} />
              ) : documentoUrl ? (
                <Image source={{ uri: documentoUrl }} style={styles.ocrImage} />
              ) : (
                <View style={styles.documentPreview}>
                  <Ionicons name="document-text" size={48} color="#666" />
                  <Text style={styles.documentPreviewText}>Documento anexado</Text>
                  {documentoPendenteOcr && (
                    <Text style={styles.documentPendenteText}>OCR pendente</Text>
                  )}
                </View>
              )}
              <TouchableOpacity
                style={styles.ocrRemoveButton}
                onPress={() => {
                  setImagemDocumento(null);
                  setDocumentoUrl(null);
                  setDocumentoPendenteOcr(false);
                  setDadosOcrExtraidos(null);
                  setOrigemDados('manual');
                }}
              >
                <Ionicons name="close-circle" size={24} color="#f44336" />
              </TouchableOpacity>
            </View>
          )}

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
          
          {/* DatePicker nativo - corrigido para funcionar corretamente */}
          {mostrarDatePicker && (
            Platform.OS === 'ios' ? (
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
                      // Manter como Date object
                      setDataAquisicao(selectedDate);
                      // Formatar para DD/MM/YYYY apenas para exibição
                      const day = String(selectedDate.getDate()).padStart(2, '0');
                      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                      const year = selectedDate.getFullYear();
                      setDataAquisicaoFormatada(`${day}/${month}/${year}`);
                      if (erros.dataAquisicao) {
                        setErros({ ...erros, dataAquisicao: null });
                      }
                    } else if (event.type === 'dismissed') {
                      setMostrarDatePicker(false);
                    }
                  }}
                />
              </View>
            ) : (
              <DateTimePicker
                value={dataAquisicao || new Date()}
                mode="date"
                display="default"
                maximumDate={new Date()}
                onChange={(event, selectedDate) => {
                  setMostrarDatePicker(false);
                  if (event.type === 'set' && selectedDate) {
                    // Manter como Date object
                    setDataAquisicao(selectedDate);
                    // Formatar para DD/MM/YYYY apenas para exibição
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
              {tiposEquipamento.map(tipo => (
                <TouchableOpacity
                  key={tipo.value}
                  style={[
                    styles.modalOptionItem,
                    tipoVeiculo === tipo.value && styles.modalOptionItemSelected
                  ]}
                onPress={() => {
                  const novoTipo = tipo.value;
                  // Se tipo mudar, limpar seleções dependentes
                  if (tipoVeiculo !== novoTipo) {
                    setFabricanteSelecionado(null);
                    setModeloSelecionado(null);
                    setAnoSelecionado(null);
                    setFabricantes([]);
                    setModelos([]);
                    setAnos([]);
                    setErros({ ...erros, tipoVeiculo: null, fabricante: null, modelo: null, ano: null });
                  }
                  setTipoVeiculo(novoTipo);
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

      {/* Modal de Seleção de Fabricante */}
      <Modal
        visible={mostrarFabricantes}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMostrarFabricantes(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setMostrarFabricantes(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecione o Fabricante</Text>
              <TouchableOpacity
                onPress={() => setMostrarFabricantes(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.modalScrollView}
              showsVerticalScrollIndicator={true}
            >
              {carregandoFabricantes ? (
                <View style={styles.modalLoading}>
                  <ActivityIndicator size="large" color="#4CAF50" />
                  <Text style={styles.modalLoadingText}>Carregando fabricantes...</Text>
                </View>
              ) : fabricantes.length === 0 ? (
                <View style={styles.modalEmpty}>
                  <Text style={styles.modalEmptyText}>Nenhum fabricante disponível</Text>
                </View>
              ) : (
                fabricantes.map(fabricante => (
                  <TouchableOpacity
                    key={fabricante.id}
                    style={[
                      styles.modalOptionItem,
                      fabricanteSelecionado?.id === fabricante.id && styles.modalOptionItemSelected
                    ]}
                    onPress={() => {
                      setFabricanteSelecionado(fabricante);
                      setMostrarFabricantes(false);
                      setErros({ ...erros, fabricante: null });
                    }}
                  >
                    <Text style={[
                      styles.modalOptionText,
                      fabricanteSelecionado?.id === fabricante.id && styles.modalOptionTextSelected
                    ]}>
                      {fabricante.nome}
                    </Text>
                    {fabricanteSelecionado?.id === fabricante.id && (
                      <Ionicons name="checkmark" size={20} color="#4CAF50" />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* Modal de Seleção de Modelo */}
      <Modal
        visible={mostrarModelos}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMostrarModelos(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setMostrarModelos(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecione o Modelo</Text>
              <TouchableOpacity
                onPress={() => setMostrarModelos(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.modalScrollView}
              showsVerticalScrollIndicator={true}
            >
              {carregandoModelos ? (
                <View style={styles.modalLoading}>
                  <ActivityIndicator size="large" color="#4CAF50" />
                  <Text style={styles.modalLoadingText}>Carregando modelos...</Text>
                </View>
              ) : modelos.length === 0 ? (
                <View style={styles.modalEmpty}>
                  <Text style={styles.modalEmptyText}>Nenhum modelo disponível</Text>
                </View>
              ) : (
                modelos.map(modelo => (
                  <TouchableOpacity
                    key={modelo.id}
                    style={[
                      styles.modalOptionItem,
                      modeloSelecionado?.id === modelo.id && styles.modalOptionItemSelected
                    ]}
                    onPress={() => {
                      setModeloSelecionado(modelo);
                      setMostrarModelos(false);
                      setErros({ ...erros, modelo: null });
                    }}
                  >
                    <Text style={[
                      styles.modalOptionText,
                      modeloSelecionado?.id === modelo.id && styles.modalOptionTextSelected
                    ]}>
                      {modelo.nome}
                    </Text>
                    {modeloSelecionado?.id === modelo.id && (
                      <Ionicons name="checkmark" size={20} color="#4CAF50" />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* Modal de Seleção de Ano */}
      <Modal
        visible={mostrarAnos}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMostrarAnos(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setMostrarAnos(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecione o Ano</Text>
              <TouchableOpacity
                onPress={() => setMostrarAnos(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.modalScrollView}
              showsVerticalScrollIndicator={true}
            >
              {carregandoAnos ? (
                <View style={styles.modalLoading}>
                  <ActivityIndicator size="large" color="#4CAF50" />
                  <Text style={styles.modalLoadingText}>Carregando anos...</Text>
                </View>
              ) : anos.length === 0 ? (
                <View style={styles.modalEmpty}>
                  <Text style={styles.modalEmptyText}>Nenhum ano disponível</Text>
                </View>
              ) : (
                anos.map(ano => (
                  <TouchableOpacity
                    key={ano}
                    style={[
                      styles.modalOptionItem,
                      anoSelecionado === ano && styles.modalOptionItemSelected
                    ]}
                    onPress={() => {
                      setAnoSelecionado(ano);
                      setMostrarAnos(false);
                      setErros({ ...erros, ano: null });
                    }}
                  >
                    <Text style={[
                      styles.modalOptionText,
                      anoSelecionado === ano && styles.modalOptionTextSelected
                    ]}>
                      {ano.toString()}
                    </Text>
                    {anoSelecionado === ano && (
                      <Ionicons name="checkmark" size={20} color="#4CAF50" />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* Modal: Preview de Dados OCR */}
      {/* Modal de Preview de OCR removido - OCR local desabilitado */}

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
  pickerTextPlaceholder: {
    color: '#999',
  },
  modoManualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  modoManualButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  modoManualHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modoManualTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  modoManualLink: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  infoBoxWarning: {
    backgroundColor: '#fff3cd',
    borderLeftWidth: 3,
    borderLeftColor: '#FF9800',
  },
  infoTextWarning: {
    fontSize: 13,
    color: '#856404',
    marginLeft: 12,
    flex: 1,
    lineHeight: 18,
  },
  modalLoading: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  modalEmpty: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalEmptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
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
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
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
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  infoBoxNeutral: {
    backgroundColor: '#f5f5f5',
    borderLeftColor: '#666',
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
  sectionDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  ocrButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  ocrButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  ocrButtonPrimary: {
    backgroundColor: '#4CAF50',
  },
  ocrButtonSecondary: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  ocrButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  ocrButtonTextSecondary: {
    color: '#4CAF50',
  },
  ocrProcessingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    gap: 8,
  },
  ocrProcessingText: {
    fontSize: 14,
    color: '#666',
  },
  ocrImagePreview: {
    position: 'relative',
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  ocrImage: {
    width: '100%',
    height: 200,
    resizeMode: 'contain',
    backgroundColor: '#f5f5f5',
  },
  ocrRemoveButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 4,
  },
});
