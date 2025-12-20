/**
 * Tela para Atualizar Quilometragem do Veículo
 * Permite atualizar KM via foto (OCR), galeria ou entrada manual
 */

import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import ActionButton from '../components/ActionButton';
import CameraButton from '../components/CameraButton';
import HeaderBar from '../components/HeaderBar';
import ModalPeriodoPosseInvalido from '../components/ModalPeriodoPosseInvalido';
import { commonStyles } from '../constants/styles';
import { buscarVeiculoPorId, processarOcrKm, atualizarKm, buscarDiagnosticoVeiculo, listarHistoricoKm } from '../services/api';
import { getErrorMessage, getSuccessMessage } from '../utils/errorMessages';
import { getMetricaPorTipo, formatarValorComUnidade } from '../utils/tipoEquipamento';

export default function AtualizarKmScreen({ navigation, route }) {
  const { veiculoId: veiculoIdParam } = route?.params || {};
  const [veiculoId, setVeiculoId] = useState(veiculoIdParam || null);
  const [veiculo, setVeiculo] = useState(null);
  const [kmAtual, setKmAtual] = useState('');
  const [imagem, setImagem] = useState(null);
  const [processandoOcr, setProcessandoOcr] = useState(false);
  const [mostrarModalImagem, setMostrarModalImagem] = useState(false);
  const [loading, setLoading] = useState(false);
  const [carregandoVeiculo, setCarregandoVeiculo] = useState(false);
  const [kmVeioDoOcr, setKmVeioDoOcr] = useState(false);
  const [mostrarModalPeriodoInvalido, setMostrarModalPeriodoInvalido] = useState(false);
  const [ultimoRegistro, setUltimoRegistro] = useState(null);
  const [dataRegistro, setDataRegistro] = useState(new Date());
  const [observacao, setObservacao] = useState('');

  useEffect(() => {
    if (veiculoId) {
      carregarVeiculo();
    }
  }, [veiculoId]);

  const carregarVeiculo = async () => {
    if (!veiculoId) return;
    
    try {
      setCarregandoVeiculo(true);
      const dados = await buscarVeiculoPorId(veiculoId);
      if (dados) {
        setVeiculo(dados);
        if (dados.km_atual) {
          setKmAtual(dados.km_atual.toString());
        }
      }
      
      // Buscar histórico para pegar o último registro
      try {
        const historico = await listarHistoricoKm(veiculoId);
        if (historico && historico.length > 0) {
          // Ordenar por data_registro (mais recente primeiro)
          const historicoOrdenado = [...historico].sort((a, b) => {
            const dataA = new Date(a.data_registro || a.criado_em);
            const dataB = new Date(b.data_registro || b.criado_em);
            return dataB - dataA;
          });
          setUltimoRegistro(historicoOrdenado[0]);
        }
      } catch (histError) {
        console.warn('Erro ao carregar histórico (não crítico):', histError);
        // Não bloquear a tela se não conseguir carregar histórico
      }
    } catch (error) {
      console.error('Erro ao carregar veículo:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados do veículo');
    } finally {
      setCarregandoVeiculo(false);
    }
  };

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

      // Chamar API de OCR para KM
      const res = await processarOcrKm(formData);

      if (res && res.success && res.km) {
        setKmAtual(res.km.toString());
        setKmVeioDoOcr(true); // Marcar que o valor veio do OCR
        const metrica = getMetricaPorTipo(veiculo?.tipo_veiculo || 'carro');
        Alert.alert('Sucesso', `${metrica.label} detectado: ${res.km}`);
      } else {
        const metrica = getMetricaPorTipo(veiculo?.tipo_veiculo || 'carro');
        Alert.alert(
          'Aviso',
          res?.error || `Não foi possível detectar o ${metrica.labelLong.toLowerCase()} na imagem. Você pode inserir manualmente.`
        );
      }
    } catch (error) {
      console.error('Erro ao processar OCR:', error);
      const metrica = getMetricaPorTipo(veiculo?.tipo_veiculo || 'carro');
      Alert.alert(
        'Aviso',
        `Não foi possível extrair o ${metrica.labelLong.toLowerCase()} da imagem automaticamente. Você pode preencher manualmente.`
      );
    } finally {
      setProcessandoOcr(false);
    }
  };

  const escolherImagem = () => {
    Alert.alert(
      'Escolher Imagem',
      'Selecione a origem da imagem',
      [
        {
          text: 'Tirar Foto',
          onPress: () => tirarFoto(),
        },
        {
          text: 'Escolher da Galeria',
          onPress: () => selecionarImagemGaleria(),
        },
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ]
    );
  };

  const tirarFoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'É necessário permitir o acesso à câmera');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setImagem(result.assets[0]);
        await processarImagemComOcr(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erro ao tirar foto:', error);
      Alert.alert('Erro', 'Não foi possível tirar a foto');
    }
  };

  const selecionarImagemGaleria = async () => {
    try {
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

      if (!result.canceled && result.assets && result.assets[0]) {
        setImagem(result.assets[0]);
        await processarImagemComOcr(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem');
    }
  };

  const confirmarAtualizacao = async () => {
    if (!veiculoId) {
      Alert.alert('Atenção', 'Selecione um veículo primeiro');
      return;
    }

    const novoValor = parseInt(kmAtual.replace(/\D/g, ''));
    const metrica = getMetricaPorTipo(veiculo?.tipo_veiculo || 'carro');
    if (!novoValor || novoValor <= 0) {
      Alert.alert('Atenção', `Informe um ${metrica.labelLong.toLowerCase()} válido`);
      return;
    }

    // Validar que novo valor seja maior que o último registro
    if (ultimoRegistro && ultimoRegistro.km) {
      const ultimoValor = parseInt(ultimoRegistro.km);
      if (novoValor <= ultimoValor) {
        Alert.alert(
          'Valor inválido',
          `O novo valor deve ser maior que o último registro (${formatarValorComUnidade(ultimoValor, veiculo?.tipo_veiculo || 'carro')}).`
        );
        return;
      }
    }

    setLoading(true);
    try {
      // Usar origem 'ocr' se o KM veio do OCR, senão 'manual'
      const origem = kmVeioDoOcr ? 'ocr' : 'manual';
      const res = await atualizarKm(veiculoId, novoValor, origem);
      
      // Resetar flag após salvar
      setKmVeioDoOcr(false);

      if (res && res.success) {
        const metrica = getMetricaPorTipo(veiculo?.tipo_veiculo || 'carro');
        Alert.alert('Sucesso', res.mensagem || `${metrica.labelLong} atualizado com sucesso!`, [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        throw new Error(res.error || 'Erro ao atualizar KM');
      }
    } catch (error) {
      console.error('Erro ao atualizar KM:', error);
      
      // Verificar se é erro de período de posse inválido
      if (error.code === 'PERIODO_POSSE_INVALIDO' || error.message?.includes('período de posse')) {
        setMostrarModalPeriodoInvalido(true);
        return;
      }
      
      Alert.alert('Erro', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  // Obter métrica baseada no tipo do equipamento (fallback para 'carro' se não houver tipo)
  const getMetrica = () => {
    const tipo = veiculo?.tipo_veiculo || 'carro';
    return getMetricaPorTipo(tipo);
  };

  // Se não tem veículo selecionado, mostrar tela de escolha
  if (!veiculoId) {
    return (
      <View style={commonStyles.container}>
        <HeaderBar title={`Atualizar ${getMetrica().labelLong}`} navigation={navigation} />
        <ScrollView style={commonStyles.scrollContainer} contentContainerStyle={styles.content}>
          <Text style={commonStyles.label}>Selecione o veículo</Text>
          <ActionButton
            onPress={() => navigation.navigate('EscolherVeiculoParaKm')}
            label="Escolher Veículo"
            icon="car-outline"
            color="#4CAF50"
          />
        </ScrollView>
      </View>
    );
  }


  if (carregandoVeiculo) {
    return (
      <View style={commonStyles.container}>
        <HeaderBar title={`Atualizar ${getMetrica().labelLong}`} navigation={navigation} />
        <View style={commonStyles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={commonStyles.loadingText}>Carregando veículo...</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={commonStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <HeaderBar title={`Atualizar ${getMetrica().labelLong}`} navigation={navigation} />
      <ScrollView
        style={commonStyles.scrollContainer}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Informações do Veículo */}
        {veiculo && (
          <View style={commonStyles.card}>
            <Text style={commonStyles.label}>Veículo</Text>
            <Text style={styles.veiculoInfo}>
              {veiculo.placa} - {veiculo.modelo || 'Sem modelo'}
            </Text>
          </View>
        )}

        {/* Último Registro do Histórico */}
        {ultimoRegistro && (
          <View style={[commonStyles.card, styles.ultimoRegistroCard]}>
            <Text style={commonStyles.label}>Último registro</Text>
            <View style={styles.ultimoRegistroInfo}>
              <Text style={styles.ultimoRegistroText}>
                • Valor: {formatarValorComUnidade(ultimoRegistro.km, veiculo?.tipo_veiculo || 'carro')}
              </Text>
              {ultimoRegistro.data_registro && (
                <Text style={styles.ultimoRegistroText}>
                  • Data: {new Date(ultimoRegistro.data_registro).toLocaleDateString('pt-BR')}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Seção: Imagem */}
        <View style={commonStyles.card}>
          <Text style={commonStyles.label}>Foto do Painel (Opcional)</Text>
          <Text style={styles.hint}>
            Tire uma foto do painel do veículo ou escolha uma imagem da galeria para detectar o KM automaticamente
          </Text>

          {imagem ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: imagem.uri }} style={styles.image} resizeMode="contain" />
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
                  setKmAtual('');
                }}
              >
                <Ionicons name="close-circle" size={24} color="#f44336" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.imageButtonsContainer}>
              <CameraButton
                onPress={tirarFoto}
                label="Tirar Foto"
                icon="camera-outline"
                variant="primary"
                style={styles.imageButton}
              />
              <CameraButton
                onPress={selecionarImagemGaleria}
                label="Escolher da Galeria"
                icon="images"
                variant="secondary"
                style={styles.imageButton}
              />
            </View>
          )}
        </View>

        {/* Seção: Valor (KM ou Horas) */}
        <View style={commonStyles.card}>
          <Text style={commonStyles.label}>{getMetrica().labelLong} *</Text>
          <View style={commonStyles.inputContainer}>
            <Ionicons name={getMetrica().icon} size={20} color="#666" style={commonStyles.inputIcon} />
            <TextInput
              style={commonStyles.input}
              placeholder={`Ex: ${getMetrica().key === 'horas' ? '320' : '50000'}`}
              placeholderTextColor="#999"
              value={kmAtual}
              onChangeText={(text) => setKmAtual(text.replace(/\D/g, ''))}
              keyboardType="numeric"
              editable={!processandoOcr}
            />
          </View>
          <Text style={styles.hint}>
            {processandoOcr
              ? 'Processando imagem...'
              : `Insira o ${getMetrica().labelLong.toLowerCase()} manualmente ou tire uma foto do painel`}
          </Text>
        </View>

        {/* Botão Confirmar */}
        <ActionButton
          onPress={confirmarAtualizacao}
          label="Confirmar Atualização"
          icon="checkmark-circle"
          color="#4CAF50"
          loading={loading}
          disabled={loading || processandoOcr || !kmAtual}
          style={styles.confirmButton}
        />
      </ScrollView>

      {/* Modal de Preview da Imagem */}
      {imagem && (
        <Modal
          visible={mostrarModalImagem}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setMostrarModalImagem(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Preview da Imagem</Text>
                <TouchableOpacity onPress={() => setMostrarModalImagem(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              <Image source={{ uri: imagem.uri }} style={styles.imageModal} resizeMode="contain" />
            </View>
          </View>
        </Modal>
      )}

      {/* Modal bloqueante para período de posse inválido */}
      <ModalPeriodoPosseInvalido
        visible={mostrarModalPeriodoInvalido}
        veiculoId={veiculoId}
        onConfigurar={() => {
          setMostrarModalPeriodoInvalido(false);
          navigation.navigate('EditarVeiculo', { veiculoId });
        }}
        onClose={() => {}} // Não permite fechar
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  veiculoInfo: {
    fontSize: 18,
    fontWeight: '600',
    color: commonStyles.textPrimary,
    marginTop: 8,
  },
  kmAtualInfo: {
    fontSize: 14,
    color: commonStyles.textSecondary,
    marginTop: 4,
  },
  hint: {
    fontSize: 12,
    color: commonStyles.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  imageContainer: {
    position: 'relative',
    marginTop: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
    minHeight: 200,
  },
  image: {
    width: '100%',
    height: 300,
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
  },
  ocrText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 4,
  },
  imageButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  imageButton: {
    flex: 1,
  },
  confirmButton: {
    marginTop: 24,
  },
  ultimoRegistroCard: {
    backgroundColor: '#f0f7ff',
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  ultimoRegistroInfo: {
    marginTop: 8,
  },
  ultimoRegistroText: {
    fontSize: 14,
    color: commonStyles.textSecondary,
    marginTop: 4,
  },
  textArea: {
    minHeight: 80,
    paddingTop: 12,
  },
  ultimoRegistroCard: {
    backgroundColor: '#f0f7ff',
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  ultimoRegistroInfo: {
    marginTop: 8,
  },
  ultimoRegistroText: {
    fontSize: 14,
    color: commonStyles.textSecondary,
    marginTop: 4,
  },
  textArea: {
    minHeight: 80,
    paddingTop: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '90%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: commonStyles.textPrimary,
  },
  imageModal: {
    width: '100%',
    height: 400,
  },
});

