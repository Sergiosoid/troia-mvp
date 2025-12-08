/**
 * Tela de Registro de Abastecimento
 * Permite registrar abastecimento via foto (OCR), entrada manual ou ambos
 */

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
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAbastecimentoApi } from '../services/useAbastecimentoApi';
import { listarVeiculosComTotais, buscarVeiculoPorId } from '../services/api';
import { commonStyles } from '../constants/styles';
import HeaderBar from '../components/HeaderBar';

export default function RegistrarAbastecimentoScreen({ route, navigation }) {
  const { veiculoId: veiculoIdParam, imagemUri } = route?.params || {};
  
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

  // Carregar dados do veículo selecionado
  useEffect(() => {
    const carregarVeiculo = async () => {
      if (veiculoId) {
        try {
          const veiculo = await buscarVeiculoPorId(veiculoId);
          if (veiculo) {
            setVeiculoSelecionado(veiculo);
            if (veiculo.km_atual) {
              setKmAntes(veiculo.km_atual.toString());
            }
          }
        } catch (error) {
          console.error('Erro ao carregar veículo:', error);
        }
      }
    };
    carregarVeiculo();
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

      Alert.alert('Sucesso', 'Dados extraídos da imagem com sucesso! Revise e ajuste se necessário.');
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
      Alert.alert('Atenção', 'Selecione um veículo');
      return false;
    }
    if (!litros || parseFloat(litros) <= 0) {
      Alert.alert('Atenção', 'Informe a quantidade de litros');
      return false;
    }
    if (!valorTotal || parseFloat(valorTotal) <= 0) {
      Alert.alert('Atenção', 'Informe o valor total');
      return false;
    }
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

      await registrar(dados, imagem?.uri);

      Alert.alert(
        'Sucesso',
        'Abastecimento registrado com sucesso!',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('HomeDashboard', { refresh: true }),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Erro', error.message || 'Erro ao registrar abastecimento');
    }
  };

  return (
    <SafeAreaView style={commonStyles.container} edges={['top']}>
      <HeaderBar title="Registrar Abastecimento" navigation={navigation} />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
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

        {/* Imagem */}
        <Text style={commonStyles.label}>Foto (Opcional)</Text>
        {imagem ? (
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
              onPress={() => setImagem(null)}
            >
              <Ionicons name="close-circle" size={24} color={commonStyles.dangerColor} />
            </TouchableOpacity>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.imageButton}
            onPress={escolherImagem}
          >
            <Ionicons name="camera-outline" size={32} color={commonStyles.primaryColor} />
            <Text style={styles.imageButtonText}>Tirar Foto ou Escolher da Galeria</Text>
          </TouchableOpacity>
        )}

        {/* Dados do Abastecimento */}
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

        {/* Botão Salvar */}
        <TouchableOpacity
          style={[commonStyles.button, loading && commonStyles.buttonDisabled]}
          onPress={handleSalvar}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={commonStyles.buttonText}>Registrar Abastecimento</Text>
          )}
        </TouchableOpacity>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  // Header removido - usando HeaderBar component
  imageContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
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
});

