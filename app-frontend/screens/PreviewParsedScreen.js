import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, Alert, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { uploadNotaParaAnalise } from '../services/api';
import { commonStyles } from '../constants/styles';

export default function PreviewParsedScreen({ route, navigation }) {
  const { imageUri, fileName, fileType, veiculoId } = route?.params || {};
  const [loading, setLoading] = useState(false);
  const [dadosExtraidos, setDadosExtraidos] = useState(null);
  const [erro, setErro] = useState(null);
  const [processando, setProcessando] = useState(true);

  useEffect(() => {
    if (imageUri && fileName && fileType) {
      analisarNota();
    } else {
      Alert.alert(
        'Erro',
        'Imagem não encontrada. Por favor, tente novamente.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  }, []);

  const analisarNota = async () => {
    setLoading(true);
    setProcessando(true);
    setErro(null);
    setDadosExtraidos(null);
    
    try {
      // Validar parâmetros
      if (!imageUri) {
        throw new Error('URI da imagem não fornecida');
      }

      if (!fileName || !fileType) {
        throw new Error('Informações do arquivo incompletas');
      }

      // Criar FormData
      const formData = new FormData();
      formData.append('documento', {
        uri: imageUri,
        name: fileName,
        type: fileType,
      });

      // Fazer upload e análise
      const dados = await uploadNotaParaAnalise(formData);
      
      // Validar resposta
      if (dados && typeof dados === 'object') {
        setDadosExtraidos(dados);
      } else {
        throw new Error('Resposta inválida do servidor');
      }
    } catch (error) {
      console.error('[PreviewParsed] Erro ao analisar nota:', error);
      
      // Mensagem de erro amigável
      const mensagemErro = error.message || 'Não foi possível analisar a nota fiscal.';
      setErro(mensagemErro);
      
      // Mostrar alerta apenas se for erro crítico
      if (!error.message?.includes('Nenhum dado') && !error.message?.includes('não foi possível analisar')) {
        Alert.alert(
          'Erro na Análise',
          mensagemErro + '\n\nVocê pode inserir os dados manualmente.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setLoading(false);
      setProcessando(false);
    }
  };

  const handleConfirmar = () => {
    if (!dadosExtraidos) {
      Alert.alert('Atenção', 'Nenhum dado foi extraído. Você pode inserir os dados manualmente.');
      return;
    }
    
    // Preparar dados para CadastroManutencaoScreen
    const dadosParaEnvio = {
      ...dadosExtraidos,
      // Garantir que tipo_manutencao e area_manutencao estejam presentes
      tipo_manutencao: dadosExtraidos.tipo_manutencao || null,
      area_manutencao: dadosExtraidos.area_manutencao || null,
    };
    
    // Navegar para CadastroManutencaoScreen com dados pre-preenchidos
    navigation.navigate('CadastroManutencao', {
      dadosPreenchidos: dadosParaEnvio,
      imageUri: imageUri,
      veiculoId: veiculoId,
    });
  };

  const handleEditarManual = () => {
    // Navegar para CadastroManutencaoScreen sem dados (modo manual)
    navigation.navigate('CadastroManutencao', {
      imageUri: imageUri,
      veiculoId: veiculoId,
    });
  };

  const handleTirarOutraFoto = () => {
    navigation.navigate('CameraCapture', { veiculoId });
  };

  const handleTentarNovamente = () => {
    analisarNota();
  };

  // Tela de loading durante processamento
  if (processando && loading) {
    return (
      <SafeAreaView style={commonStyles.container} edges={['top']}>
        <View style={[commonStyles.header, { paddingTop: Platform.OS === 'ios' ? 0 : 16 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={commonStyles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={commonStyles.headerTitle}>Análise da Nota</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={commonStyles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={commonStyles.loadingText}>Analisando nota fiscal...</Text>
          <Text style={styles.loadingSubtext}>Aguarde enquanto extraímos os dados da imagem</Text>
          <Text style={styles.loadingSubtextSmall}>Isso pode levar alguns segundos</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={commonStyles.container} edges={['top']}>
      {/* Header */}
      <View style={[commonStyles.header, { paddingTop: Platform.OS === 'ios' ? 0 : 16 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={commonStyles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={commonStyles.headerTitle}>
          {erro && !dadosExtraidos ? 'Erro na Análise' : 'Dados Extraídos'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={commonStyles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Imagem */}
        {imageUri && (
          <Image source={{ uri: imageUri }} style={styles.image} />
        )}

        {/* Erro sem dados extraídos */}
        {erro && !dadosExtraidos && (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle" size={48} color="#f44336" />
            <Text style={styles.errorTitle}>Não foi possível analisar a nota</Text>
            <Text style={styles.errorText}>{erro}</Text>
            
            <TouchableOpacity
              style={[commonStyles.button, { marginTop: 20 }]}
              onPress={handleTentarNovamente}
            >
              <Ionicons name="refresh" size={20} color="#fff" style={{ marginRight: 10 }} />
              <Text style={commonStyles.buttonText}>Tentar Novamente</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[commonStyles.button, commonStyles.buttonSecondary, { marginTop: 10 }]}
              onPress={handleEditarManual}
            >
              <Text style={[commonStyles.buttonText, commonStyles.buttonSecondaryText]}>
                Inserir Manualmente
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[commonStyles.button, commonStyles.buttonSecondary, { marginTop: 10 }]}
              onPress={handleTirarOutraFoto}
            >
              <Text style={[commonStyles.buttonText, commonStyles.buttonSecondaryText]}>
                Tirar Outra Foto
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Dados extraídos com sucesso */}
        {dadosExtraidos && !erro && (
          <View style={commonStyles.card}>
            <View style={styles.successHeader}>
              <Ionicons name="checkmark-circle" size={32} color="#4CAF50" />
              <Text style={styles.successTitle}>Dados Detectados</Text>
            </View>
            
            <View style={styles.dataContainer}>
              {/* Tipo de Manutenção */}
              {dadosExtraidos.tipo_manutencao && (
                <View style={styles.dataRow}>
                  <View style={styles.dataRowLeft}>
                    <Ionicons name="construct-outline" size={20} color="#666" />
                    <Text style={styles.label}>Tipo de Manutenção:</Text>
                  </View>
                  <Text style={styles.value}>
                    {dadosExtraidos.tipo_manutencao === 'preventiva' ? 'Preventiva' : 
                     dadosExtraidos.tipo_manutencao === 'corretiva' ? 'Corretiva' : 
                     dadosExtraidos.tipo_manutencao}
                  </Text>
                </View>
              )}

              {/* Área de Manutenção */}
              {dadosExtraidos.area_manutencao && (
                <View style={styles.dataRow}>
                  <View style={styles.dataRowLeft}>
                    <Ionicons name="settings-outline" size={20} color="#666" />
                    <Text style={styles.label}>Área:</Text>
                  </View>
                  <Text style={styles.value}>
                    {dadosExtraidos.area_manutencao === 'motor_cambio' ? 'Motor/Câmbio' :
                     dadosExtraidos.area_manutencao === 'suspensao_freio' ? 'Suspensão/Freio' :
                     dadosExtraidos.area_manutencao === 'funilaria_pintura' ? 'Funilaria/Pintura' :
                     dadosExtraidos.area_manutencao === 'higienizacao_estetica' ? 'Higienização/Estética' :
                     dadosExtraidos.area_manutencao}
                  </Text>
                </View>
              )}

              {/* Data */}
              {dadosExtraidos.data && (
                <View style={styles.dataRow}>
                  <View style={styles.dataRowLeft}>
                    <Ionicons name="calendar-outline" size={20} color="#666" />
                    <Text style={styles.label}>Data:</Text>
                  </View>
                  <Text style={styles.value}>{dadosExtraidos.data}</Text>
                </View>
              )}

              {/* Valor */}
              {dadosExtraidos.valor && (
                <View style={styles.dataRow}>
                  <View style={styles.dataRowLeft}>
                    <Ionicons name="cash-outline" size={20} color="#666" />
                    <Text style={styles.label}>Valor:</Text>
                  </View>
                  <Text style={[styles.value, styles.valueMoney]}>
                    R$ {typeof dadosExtraidos.valor === 'number' 
                      ? dadosExtraidos.valor.toFixed(2).replace('.', ',')
                      : dadosExtraidos.valor}
                  </Text>
                </View>
              )}

              {/* Placa */}
              {dadosExtraidos.placa && (
                <View style={styles.dataRow}>
                  <View style={styles.dataRowLeft}>
                    <Ionicons name="car-outline" size={20} color="#666" />
                    <Text style={styles.label}>Placa:</Text>
                  </View>
                  <Text style={styles.value}>{dadosExtraidos.placa}</Text>
                </View>
              )}

              {/* Modelo */}
              {dadosExtraidos.modelo && (
                <View style={styles.dataRow}>
                  <View style={styles.dataRowLeft}>
                    <Ionicons name="car-sport-outline" size={20} color="#666" />
                    <Text style={styles.label}>Modelo:</Text>
                  </View>
                  <Text style={styles.value}>{dadosExtraidos.modelo}</Text>
                </View>
              )}

              {/* Descrição */}
              {dadosExtraidos.descricao && (
                <View style={styles.dataRow}>
                  <View style={styles.dataRowLeft}>
                    <Ionicons name="document-text-outline" size={20} color="#666" />
                    <Text style={styles.label}>Descrição:</Text>
                  </View>
                  <Text style={[styles.value, styles.valueMultiline]}>{dadosExtraidos.descricao}</Text>
                </View>
              )}

              {/* Tipo (legado - se não tiver tipo_manutencao) */}
              {dadosExtraidos.tipo && !dadosExtraidos.tipo_manutencao && (
                <View style={styles.dataRow}>
                  <View style={styles.dataRowLeft}>
                    <Ionicons name="information-circle-outline" size={20} color="#666" />
                    <Text style={styles.label}>Tipo:</Text>
                  </View>
                  <Text style={styles.value}>{dadosExtraidos.tipo}</Text>
                </View>
              )}

              {/* Aviso se não houver dados */}
              {!dadosExtraidos.tipo_manutencao && 
               !dadosExtraidos.data && 
               !dadosExtraidos.valor && 
               !dadosExtraidos.placa && 
               !dadosExtraidos.modelo && 
               !dadosExtraidos.descricao && (
                <View style={styles.warningBox}>
                  <Ionicons name="information-circle" size={20} color="#ff9800" />
                  <Text style={styles.warningText}>
                    Nenhum dado foi extraído da imagem. Você pode preencher manualmente.
                  </Text>
                </View>
              )}
            </View>

            {/* Botões de ação */}
            <TouchableOpacity
              style={[commonStyles.button, { marginTop: 20 }]}
              onPress={handleConfirmar}
            >
              <Text style={commonStyles.buttonText}>Confirmar e Continuar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[commonStyles.button, commonStyles.buttonSecondary, { marginTop: 10 }]}
              onPress={handleEditarManual}
            >
              <Text style={[commonStyles.buttonText, commonStyles.buttonSecondaryText]}>
                Editar Manualmente
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[commonStyles.button, commonStyles.buttonSecondary, { marginTop: 10 }]}
              onPress={handleTirarOutraFoto}
            >
              <Text style={[commonStyles.buttonText, commonStyles.buttonSecondaryText]}>
                Tirar Outra Foto
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Erro mas com alguns dados extraídos */}
        {erro && dadosExtraidos && (
          <View style={styles.warningCard}>
            <Ionicons name="warning" size={32} color="#ff9800" />
            <Text style={styles.warningTitle}>Análise parcial</Text>
            <Text style={styles.warningText}>
              Alguns dados foram extraídos, mas houve um problema: {erro}
            </Text>
            <Text style={styles.warningSubtext}>
              Você pode revisar e completar os dados manualmente.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    marginBottom: 20,
    resizeMode: 'cover',
    backgroundColor: '#f0f0f0',
  },
  dataContainer: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 12,
    marginTop: 15,
    marginBottom: 20,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dataRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginLeft: 8,
  },
  value: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    textAlign: 'right',
    fontWeight: '500',
  },
  valueMoney: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  valueMultiline: {
    textAlign: 'left',
    marginTop: 5,
  },
  loadingSubtext: {
    fontSize: 14,
    marginTop: 10,
    color: '#999',
    textAlign: 'center',
  },
  loadingSubtextSmall: {
    fontSize: 12,
    marginTop: 5,
    color: '#bbb',
    textAlign: 'center',
  },
  errorCard: {
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 16,
    marginTop: 20,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f44336',
    marginTop: 15,
    marginBottom: 10,
  },
  errorText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  successHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginLeft: 10,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  warningText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#856404',
    flex: 1,
    lineHeight: 20,
  },
  warningCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginTop: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ff9800',
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff9800',
    marginTop: 15,
    marginBottom: 10,
  },
  warningSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
});
