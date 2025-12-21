/**
 * Tela de Registro de Abastecimento
 * Permite registrar abastecimento via foto (OCR), entrada manual ou ambos
 */

import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import ActionButton from '../components/ActionButton';
import CameraButton from '../components/CameraButton';
import HeaderBar from '../components/HeaderBar';
import { commonStyles } from '../constants/styles';
import { buscarVeiculoPorId, listarVeiculosComTotais, listarHistoricoKm } from '../services/api';
import { useAbastecimentoApi } from '../services/useAbastecimentoApi';
import { getErrorMessage, getSuccessMessage } from '../utils/errorMessages';

export default function RegistrarAbastecimentoScreen({ route, navigation }) {
  const { veiculoId: veiculoIdParam, imagemUri } = route?.params || {};
  const insets = useSafeAreaInsets();
  
  // Estados
  const [veiculoId, setVeiculoId] = useState(veiculoIdParam || null);
  const [veiculos, setVeiculos] = useState([]);
  const [veiculoSelecionado, setVeiculoSelecionado] = useState(null);
  const [mostrarVeiculos, setMostrarVeiculos] = useState(false);
  
  const [litros, setLitros] = useState('');
  const [valorTotal, setValorTotal] = useState('');
  const [precoPorLitro, setPrecoPorLitro] = useState('');
  const [tipoCombustivel, setTipoCombustivel] = useState('');
  const [posto, setPosto] = useState('');
  const [kmAntes, setKmAntes] = useState('');
  const [kmDepois, setKmDepois] = useState('');
  const [data, setData] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const [imagem, setImagem] = useState(imagemUri ? { uri: imagemUri } : null);
  const [mostrarModalImagem, setMostrarModalImagem] = useState(false);
  const [processandoOcr, setProcessandoOcr] = useState(false);
  const [dadosOcrExtraidos, setDadosOcrExtraidos] = useState(false);
  const [ultimoKmHistorico, setUltimoKmHistorico] = useState(null);
  const [mostrarFeedback, setMostrarFeedback] = useState(false);
  const [feedbackData, setFeedbackData] = useState(null);
  
  const { loading, error, processarOcr, registrar } = useAbastecimentoApi();

  const tiposCombustivel = [
    { label: 'Gasolina', value: 'gasolina' },
    { label: 'Etanol', value: 'etanol' },
    { label: 'Diesel', value: 'diesel' },
    { label: 'GNV', value: 'gnv' },
    { label: 'Flex', value: 'flex' },
  ];

  // Carregar veículos
  useEffect(() => {
    const carregarVeiculos = async () => {
      try {
        const dados = await listarVeiculosComTotais();
        setVeiculos(Array.isArray(dados) ? dados : []);
      } catch (error) {
        console.error('Erro ao carregar veículos:', error);
        setVeiculos([]);
      }
    };
    carregarVeiculos();
  }, []);

  // Carregar dados do veículo selecionado e último KM do histórico
  useEffect(() => {
    const carregarVeiculo = async () => {
      if (veiculoId) {
        try {
          const veiculo = await buscarVeiculoPorId(veiculoId);
          if (veiculo) {
            setVeiculoSelecionado(veiculo);
          }
          
          // Buscar último KM do histórico (fonte única de verdade)
          try {
            const historico = await listarHistoricoKm(veiculoId);
            if (historico && Array.isArray(historico) && historico.length > 0) {
              // Ordenar por data (mais recente primeiro) e pegar o primeiro
              const historicoOrdenado = [...historico].sort((a, b) => {
                const dataA = new Date(a.data_registro || a.criado_em || 0);
                const dataB = new Date(b.data_registro || b.criado_em || 0);
                return dataB - dataA;
              });
              
              const ultimoRegistro = historicoOrdenado[0];
              if (ultimoRegistro && ultimoRegistro.km !== null && ultimoRegistro.km !== undefined) {
                const ultimoKm = parseInt(ultimoRegistro.km) || 0;
                setUltimoKmHistorico(ultimoKm);
                // Preencher KM antes com o último KM do histórico
                setKmAntes(ultimoKm.toString());
              }
            }
          } catch (historicoError) {
            console.warn('[RegistrarAbastecimento] Erro ao buscar histórico de KM:', historicoError);
            // Não bloquear se falhar (backend validará)
          }
        } catch (error) {
          console.error('Erro ao carregar veículo:', error);
        }
      }
    };
    if (veiculoId) {
      carregarVeiculo();
    }
  }, [veiculoId]);

  // Processar OCR quando imagem for selecionada
  useEffect(() => {
    if (imagem?.uri && !processandoOcr) {
      processarImagemComOcr(imagem.uri);
    }
  }, [imagem]);

  // Calcular preço por litro automaticamente
  useEffect(() => {
    if (litros && valorTotal) {
      const litrosNum = parseFloat(litros);
      const valorNum = parseFloat(valorTotal);
      if (litrosNum > 0 && valorNum > 0) {
        const preco = valorNum / litrosNum;
        setPrecoPorLitro(preco.toFixed(3));
      }
    }
  }, [litros, valorTotal]);

  const processarImagemComOcr = async (uri) => {
    setProcessandoOcr(true);
    try {
      const formData = new FormData();
      const filename = uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const fileType = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('imagem', {
        uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
        name: filename,
        type: fileType,
      });

      const dados = await processarOcr(formData);

      // Preencher campos com dados extraídos
      if (dados.litros) setLitros(dados.litros.toString());
      if (dados.valor_total) setValorTotal(dados.valor_total.toString());
      if (dados.preco_por_litro) setPrecoPorLitro(dados.preco_por_litro.toString());
      if (dados.tipo_combustivel) setTipoCombustivel(dados.tipo_combustivel);
      if (dados.posto) setPosto(dados.posto);
      if (dados.data) {
        const dataParts = dados.data.split('-');
        if (dataParts.length === 3) {
          setData(new Date(parseInt(dataParts[0]), parseInt(dataParts[1]) - 1, parseInt(dataParts[2])));
        }
      }

      setDadosOcrExtraidos(true);
    } catch (error) {
      console.error('Erro ao processar OCR:', error);
      Alert.alert(
        'Aviso',
        'Não foi possível extrair dados da imagem automaticamente. Você pode preencher manualmente.'
      );
    } finally {
      setProcessandoOcr(false);
    }
  };

  const escolherImagem = () => {
    setDadosOcrExtraidos(false);
    Alert.alert(
      'Escolher Imagem',
      'De onde você deseja obter a imagem?',
      [
        {
          text: 'Câmera (Bomba)',
          onPress: () => navigation.navigate('CameraAbastecimento', { tipo: 'bomba' }),
        },
        {
          text: 'Câmera (Comprovante)',
          onPress: () => navigation.navigate('CameraAbastecimento', { tipo: 'comprovante' }),
        },
        {
          text: 'Galeria',
          onPress: escolherDaGaleria,
        },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const formatarMoeda = (valor) => {
    if (!valor) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(parseFloat(valor));
  };

  const escolherDaGaleria = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'É necessário permitir o acesso à galeria');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImagem({ uri: result.assets[0].uri });
    }
  };

  const formatarData = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatarDataParaApi = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
  };

  const validarFormulario = () => {
    if (!veiculoId) {
      Alert.alert('Atenção', 'Selecione um veículo para continuar');
      return false;
    }
    if (!litros || parseFloat(litros) <= 0) {
      Alert.alert('Atenção', 'Informe a quantidade de litros');
      return false;
    }
    if (!valorTotal || parseFloat(valorTotal) <= 0) {
      Alert.alert('Atenção', 'Informe o valor total do abastecimento');
      return false;
    }
    
    // Validar KM: km_depois deve ser >= último KM do histórico
    if (kmDepois && ultimoKmHistorico !== null) {
      const kmDepoisNum = parseInt(kmDepois);
      if (kmDepoisNum < ultimoKmHistorico) {
        Alert.alert(
          'KM inválido',
          `O KM do abastecimento (${kmDepoisNum.toLocaleString('pt-BR')}) deve ser maior ou igual ao último registro (${ultimoKmHistorico.toLocaleString('pt-BR')} km).`
        );
        return false;
      }
    }
    
    // Validar KM: km_depois deve ser >= km_antes
    if (kmAntes && kmDepois && parseFloat(kmDepois) < parseFloat(kmAntes)) {
      Alert.alert('Atenção', 'KM depois não pode ser menor que KM antes');
      return false;
    }
    return true;
  };

  const handleSalvar = async () => {
    if (!validarFormulario()) return;

    try {
      const dados = {
        veiculo_id: veiculoId,
        litros: parseFloat(litros),
        valor_total: parseFloat(valorTotal),
        preco_por_litro: precoPorLitro ? parseFloat(precoPorLitro) : null,
        tipo_combustivel: tipoCombustivel || null,
        posto: posto || null,
        km_antes: kmAntes ? parseInt(kmAntes) : null,
        km_depois: kmDepois ? parseInt(kmDepois) : null,
        data: formatarDataParaApi(data),
      };

      const resultado = await registrar(dados, imagem?.uri);

      // Se houver km_depois, atualizar KM via endpoint correto com origem 'abastecimento'
      if (kmDepois && veiculoId) {
        try {
          const { atualizarKm } = await import('../services/api');
          await atualizarKm(veiculoId, parseInt(kmDepois), 'abastecimento');
        } catch (kmError) {
          console.warn('Erro ao atualizar KM após abastecimento:', kmError);
          // Não bloquear o sucesso do abastecimento se falhar atualização de KM
        }
      }

      // Capturar feedback da resposta (se disponível)
      if (resultado && resultado.feedback) {
        setFeedbackData(resultado.feedback);
        setMostrarFeedback(true);
      } else {
        // Fallback: se não houver feedback, usar Alert tradicional
        Alert.alert(
          'Sucesso',
          getSuccessMessage('abastecimento'),
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('HomeDashboard', { refresh: true }),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Erro ao registrar abastecimento:', error);
      
      // IMPORTANTE: Abastecimento NUNCA é bloqueado - sempre permitir cadastro manual
      // Se houver erro técnico (histórico, cálculo, etc), informar mas não bloquear
      if (error.code === 'HISTORICO_INICIAL_INVALIDO' || error.message?.includes('histórico inicial')) {
        // Erro técnico não bloqueia - abastecimento pode ser salvo manualmente
        Alert.alert(
          'Atenção',
          'Não foi possível calcular algumas métricas, mas o abastecimento foi salvo. Você pode continuar registrando normalmente.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('HomeDashboard', { refresh: true }),
            },
          ]
        );
        return;
      }
      
      // Outros erros: tentar mensagem amigável, mas sempre permitir continuar
      const mensagemAmigavel = error.message?.includes('métricas') || error.message?.includes('calcular')
        ? 'Não foi possível calcular algumas métricas, mas o abastecimento foi salvo.'
        : getErrorMessage(error);
      
      Alert.alert(
        'Atenção',
        mensagemAmigavel,
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('HomeDashboard', { refresh: true }),
          },
        ]
      );
    }
  };

  return (
    <View style={commonStyles.container}>
      <HeaderBar title="Registrar Abastecimento" navigation={navigation} />

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 20 }
        ]}
      >
        {/* Seleção de Veículo */}
        <Text style={commonStyles.label}>Veículo *</Text>
        <TouchableOpacity
          style={commonStyles.inputContainer}
          onPress={() => setMostrarVeiculos(true)}
        >
          <Ionicons name="car-outline" size={20} color={commonStyles.textSecondary} style={commonStyles.inputIcon} />
          <Text style={[commonStyles.input, !veiculoSelecionado && { color: commonStyles.textLight }]}>
            {veiculoSelecionado ? `${veiculoSelecionado.placa} - ${veiculoSelecionado.modelo || ''}` : 'Selecione um veículo'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={commonStyles.textSecondary} />
        </TouchableOpacity>

        {/* (A) Seção: Imagem Capturada */}
        {imagem && (
          <View style={styles.imageSection}>
            <Text style={commonStyles.label}>Imagem Capturada</Text>
            <TouchableOpacity
              style={styles.imageContainer}
              onPress={() => setMostrarModalImagem(true)}
            >
              <Image source={imagem} style={styles.imagePreview} />
              {processandoOcr && (
                <View style={styles.ocrOverlay}>
                  <ActivityIndicator size="large" color="#fff" />
                  <Text style={styles.ocrText}>Processando imagem...</Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => {
                  setImagem(null);
                  setDadosOcrExtraidos(false);
                }}
              >
                <Ionicons name="close-circle" size={24} color={commonStyles.dangerColor} />
              </TouchableOpacity>
            </TouchableOpacity>
          </View>
        )}

        {/* (B) Seção: Dados Extraídos (OCR) */}
        {dadosOcrExtraidos && imagem && !processandoOcr && (
          <View style={styles.ocrDataCard}>
            <View style={styles.ocrDataHeader}>
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              <Text style={styles.ocrDataTitle}>Dados Extraídos</Text>
            </View>
            
            <View style={styles.ocrDataContent}>
              {posto && (
                <View style={styles.ocrDataItem}>
                  <Text style={styles.ocrDataLabel}>Posto</Text>
                  <Text style={styles.ocrDataValue}>{posto}</Text>
                </View>
              )}
              
              {litros && (
                <View style={styles.ocrDataItem}>
                  <Text style={styles.ocrDataLabel}>Litros</Text>
                  <Text style={styles.ocrDataValue}>{litros} L</Text>
                </View>
              )}
              
              {valorTotal && (
                <View style={styles.ocrDataItem}>
                  <Text style={styles.ocrDataLabel}>Valor Total</Text>
                  <Text style={styles.ocrDataValue}>{formatarMoeda(valorTotal)}</Text>
                </View>
              )}
              
              {precoPorLitro && (
                <View style={styles.ocrDataItem}>
                  <Text style={styles.ocrDataLabel}>Preço por Litro</Text>
                  <Text style={styles.ocrDataValue}>{formatarMoeda(precoPorLitro)}</Text>
                </View>
              )}
              
              {tipoCombustivel && (
                <View style={styles.ocrDataItem}>
                  <Text style={styles.ocrDataLabel}>Tipo de Combustível</Text>
                  <Text style={styles.ocrDataValue}>
                    {tiposCombustivel.find(t => t.value === tipoCombustivel)?.label || tipoCombustivel}
                  </Text>
                </View>
              )}
              
              {data && (
                <View style={styles.ocrDataItem}>
                  <Text style={styles.ocrDataLabel}>Data</Text>
                  <Text style={styles.ocrDataValue}>{formatarData(data)}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Botão para adicionar/trocar imagem */}
        {!imagem && (
          <View style={styles.imageSection}>
            <Text style={commonStyles.label}>Foto (Opcional)</Text>
            <CameraButton
              onPress={escolherImagem}
              label="Tirar Foto ou Escolher da Galeria"
              variant="secondary"
              style={styles.imageButton}
            />
          </View>
        )}

        {/* Contexto: Último KM registrado */}
        {veiculoId && ultimoKmHistorico !== null && (
          <View style={styles.contextCard}>
            <View style={styles.contextHeader}>
              <Ionicons name="information-circle-outline" size={20} color="#2196F3" />
              <Text style={styles.contextTitle}>Último KM registrado</Text>
            </View>
            <Text style={styles.contextValue}>
              {ultimoKmHistorico.toLocaleString('pt-BR')} km
            </Text>
          </View>
        )}

        {/* Dados do Abastecimento - Edição Manual */}
        <View style={styles.sectionDivider} />
        <Text style={styles.sectionTitle}>Dados do Abastecimento</Text>
        
        <Text style={commonStyles.label}>Litros *</Text>
        <View style={commonStyles.inputContainer}>
          <Ionicons name="water-outline" size={20} color={commonStyles.textSecondary} style={commonStyles.inputIcon} />
          <TextInput
            style={commonStyles.input}
            value={litros}
            onChangeText={setLitros}
            placeholder="Ex: 45.5"
            keyboardType="decimal-pad"
          />
        </View>

        <Text style={commonStyles.label}>Valor Total (R$) *</Text>
        <View style={commonStyles.inputContainer}>
          <Ionicons name="cash-outline" size={20} color={commonStyles.textSecondary} style={commonStyles.inputIcon} />
          <TextInput
            style={commonStyles.input}
            value={valorTotal}
            onChangeText={setValorTotal}
            placeholder="Ex: 250.00"
            keyboardType="decimal-pad"
          />
        </View>

        <Text style={commonStyles.label}>Preço por Litro (R$)</Text>
        <View style={commonStyles.inputContainer}>
          <Ionicons name="pricetag-outline" size={20} color={commonStyles.textSecondary} style={commonStyles.inputIcon} />
          <TextInput
            style={commonStyles.input}
            value={precoPorLitro}
            onChangeText={setPrecoPorLitro}
            placeholder="Calculado automaticamente"
            keyboardType="decimal-pad"
            editable={false}
          />
        </View>

        <Text style={commonStyles.label}>Tipo de Combustível</Text>
        <TouchableOpacity
          style={commonStyles.inputContainer}
          onPress={() => {
            // Implementar modal de seleção
            Alert.alert('Selecione', 'Tipo de combustível', tiposCombustivel.map(t => ({
              text: t.label,
              onPress: () => setTipoCombustivel(t.value),
            })));
          }}
        >
          <Ionicons name="flame-outline" size={20} color={commonStyles.textSecondary} style={commonStyles.inputIcon} />
          <Text style={[commonStyles.input, !tipoCombustivel && { color: commonStyles.textLight }]}>
            {tipoCombustivel ? tiposCombustivel.find(t => t.value === tipoCombustivel)?.label : 'Selecione'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={commonStyles.textSecondary} />
        </TouchableOpacity>

        <Text style={commonStyles.label}>Posto</Text>
        <View style={commonStyles.inputContainer}>
          <Ionicons name="storefront-outline" size={20} color={commonStyles.textSecondary} style={commonStyles.inputIcon} />
          <TextInput
            style={commonStyles.input}
            value={posto}
            onChangeText={setPosto}
            placeholder="Ex: Shell, Petrobras"
          />
        </View>

        <Text style={commonStyles.label}>KM Antes</Text>
        <View style={commonStyles.inputContainer}>
          <Ionicons name="speedometer-outline" size={20} color={commonStyles.textSecondary} style={commonStyles.inputIcon} />
          <TextInput
            style={commonStyles.input}
            value={kmAntes}
            onChangeText={setKmAntes}
            placeholder="Preenchido automaticamente"
            keyboardType="numeric"
          />
        </View>

        <Text style={commonStyles.label}>KM Depois</Text>
        <View style={commonStyles.inputContainer}>
          <Ionicons name="speedometer-outline" size={20} color={commonStyles.textSecondary} style={commonStyles.inputIcon} />
          <TextInput
            style={commonStyles.input}
            value={kmDepois}
            onChangeText={setKmDepois}
            placeholder="Ex: 50000"
            keyboardType="numeric"
          />
        </View>

        <Text style={commonStyles.label}>Data</Text>
        <TouchableOpacity
          style={commonStyles.inputContainer}
          onPress={() => setShowDatePicker(true)}
        >
          <Ionicons name="calendar-outline" size={20} color={commonStyles.textSecondary} style={commonStyles.inputIcon} />
          <Text style={commonStyles.input}>{formatarData(data)}</Text>
        </TouchableOpacity>

        {/* (C) Seção: Botões de Ação */}
        <View style={styles.actionButtonsSection}>
          <ActionButton
            onPress={handleSalvar}
            label="Confirmar Abastecimento"
            icon="checkmark-circle"
            color="#4CAF50"
            loading={loading}
            disabled={loading}
            style={styles.actionButton}
          />
          
          {imagem && (
            <ActionButton
              onPress={escolherImagem}
              label="Tentar Novamente"
              icon="camera-outline"
              color="#2196F3"
              disabled={loading || processandoOcr}
              style={styles.actionButton}
            />
          )}
        </View>
      </ScrollView>

      {/* Modal de Seleção de Veículos */}
      <Modal
        visible={mostrarVeiculos}
        transparent
        animationType="slide"
        onRequestClose={() => setMostrarVeiculos(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecione o Veículo</Text>
              <TouchableOpacity onPress={() => setMostrarVeiculos(false)}>
                <Ionicons name="close" size={24} color={commonStyles.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {veiculos.map((v) => (
                <TouchableOpacity
                  key={v.id}
                  style={[styles.veiculoItem, veiculoId === v.id && styles.veiculoItemSelected]}
                  onPress={() => {
                    setVeiculoId(v.id);
                    setVeiculoSelecionado(v);
                    setMostrarVeiculos(false);
                  }}
                >
                  <Text style={styles.veiculoText}>{v.placa} - {v.modelo || ''}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal de Visualização de Imagem */}
      <Modal
        visible={mostrarModalImagem}
        transparent
        animationType="fade"
        onRequestClose={() => setMostrarModalImagem(false)}
      >
        <View style={styles.imageModalOverlay}>
          <TouchableOpacity
            style={styles.imageModalClose}
            onPress={() => setMostrarModalImagem(false)}
          >
            <Ionicons name="close" size={32} color="#fff" />
          </TouchableOpacity>
          <Image source={imagem} style={styles.imageModal} resizeMode="contain" />
        </View>
      </Modal>

      {/* Modal de Feedback pós-abastecimento */}
      <Modal
        visible={mostrarFeedback}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setMostrarFeedback(false);
          navigation.navigate('HomeDashboard', { refresh: true });
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.feedbackModalContent}>
            <View style={styles.feedbackModalHeader}>
              <Ionicons name="checkmark-circle" size={32} color="#4CAF50" />
              <Text style={styles.feedbackModalTitle}>Abastecimento registrado!</Text>
            </View>

            <View style={styles.feedbackCard}>
              {feedbackData?.consumo_medio ? (
                <View style={styles.feedbackItem}>
                  <Ionicons name="speedometer-outline" size={20} color="#2196F3" />
                  <View style={styles.feedbackItemContent}>
                    <Text style={styles.feedbackLabel}>Consumo médio estimado</Text>
                    <Text style={styles.feedbackValue}>
                      {feedbackData.consumo_medio.toFixed(2)} km/l
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.feedbackItem}>
                  <Ionicons name="information-circle-outline" size={20} color="#999" />
                  <View style={styles.feedbackItemContent}>
                    <Text style={styles.feedbackLabel}>Consumo médio</Text>
                    <Text style={styles.feedbackValueInsufficient}>Dados insuficientes</Text>
                  </View>
                </View>
              )}

              {feedbackData?.gasto_mes_atual !== null && feedbackData?.gasto_mes_atual !== undefined && feedbackData.gasto_mes_atual > 0 ? (
                <View style={styles.feedbackItem}>
                  <Ionicons name="cash-outline" size={20} color="#FF9800" />
                  <View style={styles.feedbackItemContent}>
                    <Text style={styles.feedbackLabel}>Gasto no mês</Text>
                    <Text style={styles.feedbackValue}>
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(feedbackData.gasto_mes_atual)}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.feedbackItem}>
                  <Ionicons name="information-circle-outline" size={20} color="#999" />
                  <View style={styles.feedbackItemContent}>
                    <Text style={styles.feedbackLabel}>Gasto no mês</Text>
                    <Text style={styles.feedbackValueInsufficient}>Ainda sem histórico no mês</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Texto informativo sobre valor dos dados */}
            <View style={styles.feedbackInfoBox}>
              <Ionicons name="information-circle-outline" size={16} color="#666" />
              <Text style={styles.feedbackInfoText}>
                Esses dados ajudam você a entender seu consumo ao longo do tempo.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.feedbackButton}
              onPress={() => {
                setMostrarFeedback(false);
                navigation.navigate('HomeDashboard', { refresh: true });
              }}
            >
              <Text style={styles.feedbackButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  imageSection: {
    marginBottom: 16,
  },
  // Header removido - usando HeaderBar component
  imageContainer: {
    position: 'relative',
    marginBottom: 0,
    borderRadius: 10,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    backgroundColor: commonStyles.borderColor,
  },
  ocrOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  ocrText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
  },
  imageButton: {
    height: 120,
    borderWidth: 2,
    borderColor: commonStyles.borderColor,
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: commonStyles.backgroundWhite,
  },
  imageButtonText: {
    marginTop: 8,
    fontSize: 14,
    color: commonStyles.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: commonStyles.backgroundWhite,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
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
  veiculoItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: commonStyles.borderColor,
  },
  veiculoItemSelected: {
    backgroundColor: commonStyles.background,
  },
  veiculoText: {
    fontSize: 16,
    color: commonStyles.textPrimary,
  },
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
  },
  imageModal: {
    width: '100%',
    height: '100%',
  },
  ocrDataCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  ocrDataHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  ocrDataTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: commonStyles.textPrimary,
    marginLeft: 8,
  },
  ocrDataContent: {
    gap: 16,
  },
  ocrDataItem: {
    marginBottom: 0,
  },
  ocrDataLabel: {
    fontSize: 12,
    color: commonStyles.textSecondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  ocrDataValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: commonStyles.textPrimary,
  },
  actionButtonsSection: {
    marginTop: 8,
    gap: 12,
  },
  actionButton: {
    minHeight: 50,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: commonStyles.borderColor,
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: commonStyles.textPrimary,
    marginBottom: 16,
  },
  contextCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  contextHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contextTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
    marginLeft: 8,
  },
  contextValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  feedbackModalContent: {
    backgroundColor: commonStyles.backgroundWhite,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '80%',
  },
  feedbackModalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  feedbackModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: commonStyles.textPrimary,
    marginTop: 12,
  },
  feedbackCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 16,
  },
  feedbackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  feedbackItemContent: {
    flex: 1,
  },
  feedbackLabel: {
    fontSize: 14,
    color: commonStyles.textSecondary,
    marginBottom: 4,
  },
  feedbackValue: {
    fontSize: 18,
    fontWeight: '600',
    color: commonStyles.textPrimary,
  },
  feedbackValueInsufficient: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  feedbackButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  feedbackButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  feedbackInfoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f0f7ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  feedbackInfoText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
});

