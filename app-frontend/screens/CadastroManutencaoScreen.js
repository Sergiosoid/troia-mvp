import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Image, 
  ScrollView, 
  StyleSheet, 
  Alert, 
  TouchableOpacity, 
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
// DateTimePicker será usado via Modal nativo se disponível
import { cadastrarManutencao, listarProprietarios, listarVeiculosPorProprietario } from '../services/api';
import { commonStyles } from '../constants/styles';
import HeaderBar from '../components/HeaderBar';
import CameraButton from '../components/CameraButton';
import { getErrorMessage, getSuccessMessage } from '../utils/errorMessages';

export default function CadastroManutencaoScreen({ route, navigation }) {
  const { veiculoId: veiculoIdParam, dadosPreenchidos, imageUri } = route?.params || {};
  
  // Validação obrigatória: veiculoId deve vir via route.params
  const veiculoId = veiculoIdParam;
  
  // Se não tiver veiculoId, redirecionar para seleção (após renderização)
  React.useEffect(() => {
    if (!veiculoId) {
      // Usar setTimeout para evitar problemas com Alert durante renderização
      const timer = setTimeout(() => {
        Alert.alert(
          'Veículo necessário',
          'Selecione um veículo para cadastrar a manutenção.',
          [
            {
              text: 'Selecionar Veículo',
              onPress: () => navigation.replace('EscolherVeiculoParaManutencao')
            }
          ]
        );
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [veiculoId, navigation]);
  
  const [proprietarios, setProprietarios] = useState([]);
  const [proprietarioSelecionado, setProprietarioSelecionado] = useState(null);
  const [veiculos, setVeiculos] = useState([]);
  const [veiculoSelecionado, setVeiculoSelecionado] = useState(null);
  const [imagem, setImagem] = useState(imageUri ? { uri: imageUri } : null);
  const [valor, setValor] = useState('');
  const [data, setData] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tipoManutencao, setTipoManutencao] = useState('');
  const [areaManutencao, setAreaManutencao] = useState('');
  const [loading, setLoading] = useState(false);
  const [mostrarProprietarios, setMostrarProprietarios] = useState(false);
  const [mostrarVeiculos, setMostrarVeiculos] = useState(false);
  const [mostrarTipoManutencao, setMostrarTipoManutencao] = useState(false);
  const [mostrarAreaManutencao, setMostrarAreaManutencao] = useState(false);
  const [mostrarModalImagem, setMostrarModalImagem] = useState(false);

  const tiposManutencao = [
    { label: 'Preventiva', value: 'preventiva' },
    { label: 'Corretiva', value: 'corretiva' },
  ];

  const areasManutencao = [
    { label: 'Motor/Câmbio', value: 'motor_cambio' },
    { label: 'Suspensão/Freio', value: 'suspensao_freio' },
    { label: 'Funilaria/Pintura', value: 'funilaria_pintura' },
    { label: 'Higienização/Estética', value: 'higienizacao_estetica' },
  ];

  // Preencher campos com dados da IA
  useEffect(() => {
    if (dadosPreenchidos) {
      if (dadosPreenchidos.valor) setValor(dadosPreenchidos.valor.toString());
      if (dadosPreenchidos.data) {
        const dataParts = dadosPreenchidos.data.split('-');
        if (dataParts.length === 3) {
          setData(new Date(parseInt(dataParts[0]), parseInt(dataParts[1]) - 1, parseInt(dataParts[2])));
        }
      }
      if (dadosPreenchidos.tipo) {
        // Tentar mapear tipo antigo para novo formato
        const tipoLower = dadosPreenchidos.tipo.toLowerCase();
        if (tipoLower.includes('preventiva')) {
          setTipoManutencao('preventiva');
        } else if (tipoLower.includes('corretiva')) {
          setTipoManutencao('corretiva');
        }
      }
      // veiculoId já vem de route.params, não alterar aqui
      if (dadosPreenchidos.proprietarioId) {
        setProprietarioSelecionado(dadosPreenchidos.proprietarioId);
      }
    }
  }, [dadosPreenchidos]);

  // Carregar proprietários ao montar o componente
  useEffect(() => {
    const carregarProprietarios = async () => {
      try {
        const dados = await listarProprietarios();
        setProprietarios(Array.isArray(dados) ? dados : []);
      } catch (error) {
        console.error('Erro ao carregar proprietários:', error);
        setProprietarios([]);
      }
    };
    carregarProprietarios();
  }, []);

  // Carregar veículos quando proprietário for selecionado
  useEffect(() => {
    const carregarVeiculos = async () => {
      if (proprietarioSelecionado) {
        try {
          const dados = await listarVeiculosPorProprietario(proprietarioSelecionado);
          setVeiculos(Array.isArray(dados) ? dados : []);
          setVeiculoSelecionado(null);
        } catch (error) {
          console.error('Erro ao carregar veículos:', error);
          setVeiculos([]);
        }
      } else {
        setVeiculos([]);
        setVeiculoSelecionado(null);
      }
    };
    carregarVeiculos();
  }, [proprietarioSelecionado]);

  // veiculoId vem apenas de route.params, não atualizar via seleção

  const formatarData = (date) => {
    const dia = String(date.getDate()).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const ano = date.getFullYear();
    return `${dia}/${mes}/${ano}`;
  };

  const formatarDataParaBackend = (date) => {
    const ano = date.getFullYear();
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const dia = String(date.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  };

  const selecionarImagemGaleria = async () => {
    setMostrarModalImagem(false);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'Permita o acesso à galeria para continuar.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({ 
      mediaTypes: ImagePicker.MediaTypeOptions.Images, 
      quality: 0.8 
    });
    if (!result.canceled) {
      setImagem(result.assets[0]);
    }
  };

  const tirarFoto = async () => {
    setMostrarModalImagem(false);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'Permita o acesso à câmera para continuar.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({ 
      mediaTypes: ImagePicker.MediaTypeOptions.Images, 
      quality: 0.8 
    });
    if (!result.canceled) {
      setImagem(result.assets[0]);
    }
  };

  const enviarManutencao = async () => {
    // Validação obrigatória: veiculoId deve vir de route.params
    if (!veiculoId) {
      Alert.alert(
        'Veículo necessário',
        'Selecione um veículo para continuar.',
        [
          {
            text: 'Selecionar Veículo',
            onPress: () => navigation.replace('EscolherVeiculoParaManutencao')
          },
          { text: 'Cancelar', style: 'cancel' }
        ]
      );
      return;
    }
    
    // Buscar veículo antes de cadastrar para validar acesso
    try {
      const { buscarVeiculoPorId } = await import('../services/api');
      const { getUserId } = await import('../utils/authStorage');
      
      const veiculo = await buscarVeiculoPorId(veiculoId);
      
      if (!veiculo) {
        Alert.alert(
          'Erro',
          'Veículo não encontrado. Por favor, selecione outro veículo.',
          [
            {
              text: 'Selecionar Veículo',
              onPress: () => navigation.replace('EscolherVeiculoParaManutencao')
            },
            { text: 'Cancelar', style: 'cancel' }
          ]
        );
        return;
      }

      // Validar se o veículo pertence ao usuário atual
      const userId = await getUserId();
      if (veiculo.usuario_id && userId && String(veiculo.usuario_id) !== String(userId)) {
        Alert.alert(
          'Acesso Negado',
          'Você não tem permissão para cadastrar manutenção neste veículo.',
          [
            {
              text: 'Selecionar Outro Veículo',
              onPress: () => navigation.replace('EscolherVeiculoParaManutencao')
            },
            { text: 'Cancelar', style: 'cancel' }
          ]
        );
        return;
      }
    } catch (error) {
      // Se erro 404 ou não encontrado, tratar como veículo não encontrado
      if (error.message?.includes('404') || error.message?.includes('não encontrado')) {
        Alert.alert(
          'Erro',
          'Veículo não encontrado. Por favor, selecione outro veículo.',
          [
            {
              text: 'Selecionar Veículo',
              onPress: () => navigation.replace('EscolherVeiculoParaManutencao')
            },
            { text: 'Cancelar', style: 'cancel' }
          ]
        );
      } else {
        // Outros erros: mostrar mensagem genérica
        console.error('Erro ao validar acesso ao veículo:', error);
        Alert.alert(
          'Erro',
          'Não foi possível validar o acesso ao veículo. Tente novamente.',
          [{ text: 'OK' }]
        );
      }
      return;
    }
    
    // Garantir que veiculoIdFinal seja definido (já validado acima)
    const veiculoIdFinal = veiculoId;

    if (!tipoManutencao) {
      Alert.alert('Atenção', 'Selecione o tipo de manutenção');
      return;
    }

    if (!areaManutencao) {
      Alert.alert('Atenção', 'Selecione a área de manutenção');
      return;
    }

    if (!valor || parseFloat(valor) <= 0) {
      Alert.alert('Atenção', 'Informe um valor válido');
      return;
    }

    const formData = new FormData();
    if (imagem && imagem.uri) {
      formData.append('documento', { 
        uri: imagem.uri, 
        name: 'nota.jpg', 
        type: 'image/jpeg' 
      });
    }
    formData.append('veiculo_id', veiculoIdFinal);
    formData.append('valor', valor);
    formData.append('data', formatarDataParaBackend(data));
    formData.append('tipo', tipoManutencao);
    formData.append('tipo_manutencao', tipoManutencao);
    formData.append('area_manutencao', areaManutencao);
    formData.append('descricao', `${tiposManutencao.find(t => t.value === tipoManutencao)?.label || tipoManutencao} - ${areasManutencao.find(a => a.value === areaManutencao)?.label || areaManutencao}`);
    
    setLoading(true);
    try {
      const response = await cadastrarManutencao(formData);
      if (response && (response.id || (response.success && response.id))) {
        Alert.alert('Sucesso', getSuccessMessage('manutencao'), [
          {
            text: 'OK',
            onPress: () => {
              navigation.navigate('VeiculoHistorico', { 
                veiculoId: veiculoIdFinal,
                refresh: true 
              });
            },
          },
        ]);
      } else {
        throw new Error('Resposta inválida do servidor');
      }
    } catch (error) {
      console.error('Erro ao cadastrar manutenção:', error);
      Alert.alert('Ops!', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={commonStyles.container}>
        <HeaderBar title="Cadastrar Manutenção" navigation={navigation} />
        <View style={commonStyles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={commonStyles.loadingText}>Salvando manutenção...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={commonStyles.container}>
      <HeaderBar title="Cadastrar Manutenção" navigation={navigation} />

      <ScrollView 
        style={commonStyles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={commonStyles.card}>

          {/* Seleção de veículo - NÃO permitir se não vier veiculoId */}
          {!veiculoId && (
            <View style={styles.warningBox}>
              <Ionicons name="warning-outline" size={20} color="#f44336" />
              <Text style={styles.warningText}>
                É necessário selecionar um veículo para cadastrar a manutenção.
              </Text>
              <TouchableOpacity
                style={[commonStyles.button, { marginTop: 10 }]}
                onPress={() => navigation.replace('EscolherVeiculoParaManutencao')}
              >
                <Text 
                  style={commonStyles.buttonText}
                  numberOfLines={1}
                  allowFontScaling={false}
                >
                  Selecionar Veículo
                </Text>
              </TouchableOpacity>
            </View>
          )}
          
          {/* Seleção de veículo via proprietário - REMOVIDO: sempre usar veiculoId de route.params */}
          {false && !veiculoId && (
            <>
              <Text style={commonStyles.label}>Proprietário *</Text>
              <View style={styles.pickerContainer}>
                <TouchableOpacity 
                  style={[commonStyles.inputContainer, styles.pickerButton]}
                  onPress={() => {
                    if (proprietarios.length === 0) {
                      Alert.alert(
                        'Aviso', 
                        'Nenhum proprietário cadastrado. Você precisa cadastrar um proprietário primeiro.',
                        [
                          { 
                            text: 'Cadastrar', 
                            onPress: () => navigation.navigate('CadastroProprietario')
                          },
                          { text: 'Cancelar', style: 'cancel' }
                        ]
                      );
                    } else {
                      setMostrarProprietarios(!mostrarProprietarios);
                    }
                  }}
                >
                  <Ionicons name="person-outline" size={20} color="#666" style={commonStyles.inputIcon} />
                  <Text style={styles.pickerText}>
                    {proprietarioSelecionado 
                      ? proprietarios.find(p => p.id === proprietarioSelecionado)?.nome || 'Selecione...'
                      : 'Selecione um proprietário...'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>
                {mostrarProprietarios && proprietarios.length > 0 && (
                  <View style={styles.optionsList}>
                    {proprietarios.map(p => (
                      <TouchableOpacity
                        key={p.id}
                        style={[
                          styles.optionItem,
                          proprietarioSelecionado === p.id && styles.optionItemSelected
                        ]}
                        onPress={() => {
                          setProprietarioSelecionado(p.id);
                          setMostrarProprietarios(false);
                        }}
                      >
                        <Text style={styles.optionText}>{p.nome || `Proprietário ${p.id}`}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {proprietarioSelecionado && (
                <>
                  <Text style={commonStyles.label}>Veículo *</Text>
                  <View style={styles.pickerContainer}>
                    <TouchableOpacity 
                      style={[commonStyles.inputContainer, styles.pickerButton]}
                      onPress={() => {
                        if (veiculos.length === 0) {
                          Alert.alert('Aviso', 'Nenhum veículo cadastrado para este proprietário.');
                        } else {
                          setMostrarVeiculos(!mostrarVeiculos);
                        }
                      }}
                    >
                      <Ionicons name="car-outline" size={20} color="#666" style={commonStyles.inputIcon} />
                      <Text style={styles.pickerText}>
                        {veiculoSelecionado 
                          ? (() => {
                              const veiculo = veiculos.find(v => v.id === veiculoSelecionado);
                              return veiculo ? `${veiculo.placa || 'N/A'}` : 'Selecione...';
                            })()
                          : 'Selecione um veículo...'}
                      </Text>
                      <Ionicons name="chevron-down" size={20} color="#666" />
                    </TouchableOpacity>
                    {mostrarVeiculos && veiculos.length > 0 && (
                      <View style={styles.optionsList}>
                        {veiculos.map(v => (
                          <TouchableOpacity
                            key={v.id}
                            style={[
                              styles.optionItem,
                              veiculoSelecionado === v.id && styles.optionItemSelected
                            ]}
                            onPress={() => {
                              setVeiculoSelecionado(v.id);
                              setMostrarVeiculos(false);
                            }}
                          >
                            <Text style={styles.optionText}>{v.placa || 'N/A'}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                </>
              )}
            </>
          )}

          {/* Imagem da Nota Fiscal */}
          <Text style={commonStyles.label}>Imagem da Nota Fiscal</Text>
          {!imagem && (
            <CameraButton
              onPress={() => setMostrarModalImagem(true)}
              label="Enviar Imagem"
              variant="secondary"
              style={{ marginBottom: 15 }}
            />
          )}
          {imagem && (
            <>
              <Image source={{ uri: imagem.uri || imageUri }} style={styles.image} />
              <TouchableOpacity
                style={[commonStyles.button, commonStyles.buttonSecondary, { marginTop: 10 }]}
                onPress={() => setMostrarModalImagem(true)}
              >
                <Text 
                  style={[commonStyles.buttonText, commonStyles.buttonSecondaryText]}
                  numberOfLines={1}
                  allowFontScaling={false}
                >
                  Trocar Imagem
                </Text>
              </TouchableOpacity>
            </>
          )}

          {dadosPreenchidos && (
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.successText}>Dados preenchidos automaticamente pela IA</Text>
            </View>
          )}

          {/* Tipo de Manutenção */}
          <Text style={commonStyles.label}>Tipo de Manutenção *</Text>
          <View style={styles.pickerContainer}>
            <TouchableOpacity 
              style={[commonStyles.inputContainer, styles.pickerButton]}
              onPress={() => setMostrarTipoManutencao(!mostrarTipoManutencao)}
            >
              <Ionicons name="construct-outline" size={20} color="#666" style={commonStyles.inputIcon} />
              <Text style={styles.pickerText}>
                {tipoManutencao 
                  ? tiposManutencao.find(t => t.value === tipoManutencao)?.label || tipoManutencao
                  : 'Selecione o tipo...'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
            {mostrarTipoManutencao && (
              <View style={styles.optionsList}>
                {tiposManutencao.map(tipo => (
                  <TouchableOpacity
                    key={tipo.value}
                    style={[
                      styles.optionItem,
                      tipoManutencao === tipo.value && styles.optionItemSelected
                    ]}
                    onPress={() => {
                      setTipoManutencao(tipo.value);
                      setMostrarTipoManutencao(false);
                    }}
                  >
                    <Text style={styles.optionText}>{tipo.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Área de Manutenção */}
          <Text style={commonStyles.label}>Área de Manutenção *</Text>
          <View style={styles.pickerContainer}>
            <TouchableOpacity 
              style={[commonStyles.inputContainer, styles.pickerButton]}
              onPress={() => setMostrarAreaManutencao(!mostrarAreaManutencao)}
            >
              <Ionicons name="settings-outline" size={20} color="#666" style={commonStyles.inputIcon} />
              <Text style={styles.pickerText}>
                {areaManutencao 
                  ? areasManutencao.find(a => a.value === areaManutencao)?.label || areaManutencao
                  : 'Selecione a área...'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
            {mostrarAreaManutencao && (
              <View style={styles.optionsList}>
                {areasManutencao.map(area => (
                  <TouchableOpacity
                    key={area.value}
                    style={[
                      styles.optionItem,
                      areaManutencao === area.value && styles.optionItemSelected
                    ]}
                    onPress={() => {
                      setAreaManutencao(area.value);
                      setMostrarAreaManutencao(false);
                    }}
                  >
                    <Text style={styles.optionText}>{area.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Valor */}
          <Text style={commonStyles.label}>Valor *</Text>
          <View style={commonStyles.inputContainer}>
            <Ionicons name="cash-outline" size={20} color="#666" style={commonStyles.inputIcon} />
            <TextInput
              style={commonStyles.input}
              placeholder="0,00"
              placeholderTextColor="#999"
              value={valor}
              onChangeText={setValor}
              keyboardType="decimal-pad"
            />
          </View>

          {/* Data */}
          <Text style={commonStyles.label}>Data *</Text>
          <TouchableOpacity 
            style={commonStyles.inputContainer}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#666" style={commonStyles.inputIcon} />
            <Text style={[commonStyles.input, { color: '#333' }]}>
              {formatarData(data)}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>

          {/* Botão Cadastrar */}
          <TouchableOpacity
            style={[commonStyles.button, (loading || !veiculoId) && commonStyles.buttonDisabled, styles.submitButton]}
            onPress={enviarManutencao}
            disabled={loading || !veiculoId}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text 
                style={commonStyles.buttonText}
                numberOfLines={1}
                allowFontScaling={false}
              >
                Cadastrar Manutenção
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal DatePicker */}
      {showDatePicker && (
        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.datePickerOverlay}>
            <View style={styles.datePickerContainer}>
              <View style={styles.datePickerHeader}>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.datePickerCancel}>Cancelar</Text>
                </TouchableOpacity>
                <Text style={styles.datePickerTitle}>Selecionar Data</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.datePickerConfirm}>Confirmar</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.datePickerScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.datePickerSection}>
                  <Text style={styles.datePickerSectionTitle}>Dia</Text>
                  <View style={styles.datePickerRow}>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(dia => (
                      <TouchableOpacity
                        key={dia}
                        style={[
                          styles.datePickerItem,
                          data.getDate() === dia && styles.datePickerItemSelected
                        ]}
                        onPress={() => setData(new Date(data.getFullYear(), data.getMonth(), dia))}
                      >
                        <Text style={[
                          styles.datePickerItemText,
                          data.getDate() === dia && styles.datePickerItemTextSelected
                        ]}>
                          {dia}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <View style={styles.datePickerSection}>
                  <Text style={styles.datePickerSectionTitle}>Mês</Text>
                  <View style={styles.datePickerRow}>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(mes => (
                      <TouchableOpacity
                        key={mes}
                        style={[
                          styles.datePickerItem,
                          data.getMonth() + 1 === mes && styles.datePickerItemSelected
                        ]}
                        onPress={() => setData(new Date(data.getFullYear(), mes - 1, data.getDate()))}
                      >
                        <Text style={[
                          styles.datePickerItemText,
                          data.getMonth() + 1 === mes && styles.datePickerItemTextSelected
                        ]}>
                          {mes}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <View style={styles.datePickerSection}>
                  <Text style={styles.datePickerSectionTitle}>Ano</Text>
                  <View style={styles.datePickerRow}>
                    {Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - i).map(ano => (
                      <TouchableOpacity
                        key={ano}
                        style={[
                          styles.datePickerItem,
                          data.getFullYear() === ano && styles.datePickerItemSelected
                        ]}
                        onPress={() => setData(new Date(ano, data.getMonth(), data.getDate()))}
                      >
                        <Text style={[
                          styles.datePickerItemText,
                          data.getFullYear() === ano && styles.datePickerItemTextSelected
                        ]}>
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

      {/* Modal para escolher imagem */}
      <Modal
        visible={mostrarModalImagem}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setMostrarModalImagem(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecionar Imagem</Text>
            <CameraButton
              onPress={tirarFoto}
              label="Tirar Foto"
              icon="camera"
              variant="secondary"
              style={styles.modalOption}
            />
            <CameraButton
              onPress={selecionarImagemGaleria}
              label="Escolher da Galeria"
              icon="images"
              variant="secondary"
              style={styles.modalOption}
            />
            <TouchableOpacity
              style={[styles.modalOption, styles.modalCancel]}
              onPress={() => setMostrarModalImagem(false)}
            >
              <Text style={[styles.modalOptionText, { color: '#f44336' }]}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: Platform.OS === 'android' ? 40 : 20,
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
  image: {
    width: '100%',
    height: 200,
    marginVertical: 10,
    borderRadius: 12,
    resizeMode: 'cover',
    backgroundColor: '#f0f0f0',
  },
  imageButton: {
    marginBottom: 15,
    minHeight: 48,
    paddingHorizontal: 12,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 15,
  },
  successText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#4CAF50',
    flex: 1,
  },
  warningBox: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    padding: 16,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#f44336',
  },
  warningText: {
    marginTop: 10,
    fontSize: 14,
    color: '#d32f2f',
    textAlign: 'center',
    flex: 1,
  },
  submitButton: {
    marginTop: 20,
    marginBottom: Platform.OS === 'android' ? 40 : 20,
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
    padding: 20,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalOption: {
    marginBottom: 10,
    backgroundColor: '#f5f5f5',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
    fontWeight: '500',
  },
  modalCancel: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginTop: 10,
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
