import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import HeaderBar from '../components/HeaderBar';
import { commonStyles } from '../constants/styles';
import ActionButton from '../components/ActionButton';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_CONTEXT_KEY = 'onboarding_context';

export default function OnboardingContextualScreen({ navigation, route }) {
  const { contexto, veiculoId, token } = route?.params || {};
  const [contextoDetectado, setContextoDetectado] = useState(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    detectarContexto();
  }, []);

  const detectarContexto = async () => {
    try {
      // Priorizar contexto passado via route.params
      if (contexto) {
        setContextoDetectado(contexto);
        return;
      }

      // Tentar obter do AsyncStorage
      const contextoSalvo = await AsyncStorage.getItem(ONBOARDING_CONTEXT_KEY);
      if (contextoSalvo) {
        setContextoDetectado(contextoSalvo);
        // Limpar após ler
        await AsyncStorage.removeItem(ONBOARDING_CONTEXT_KEY);
      } else {
        // Se não houver contexto, assumir conta sem veículo
        setContextoDetectado('conta_sem_veiculo');
      }
    } catch (error) {
      console.error('Erro ao detectar contexto:', error);
      setContextoDetectado('conta_sem_veiculo');
    }
  };

  const handleContinuar = () => {
    switch (contextoDetectado) {
      case 'link_compartilhado':
        // Se veio de link compartilhado, navegar para PublicVehicle
        if (token) {
          navigation.replace('PublicVehicle', { token });
        } else {
          navigation.replace('HomeDashboard');
        }
        break;
      
      case 'veiculo_aceito':
        // Se aceitou veículo, navegar para histórico
        if (veiculoId) {
          navigation.replace('VeiculoHistorico', { veiculoId });
        } else {
          navigation.replace('HomeDashboard');
        }
        break;
      
      case 'conta_sem_veiculo':
      default:
        // Se criou conta sem veículo, navegar para cadastro de veículo
        navigation.replace('CadastroVeiculo', { 
          returnTo: 'HomeDashboard',
          skipOnboarding: true 
        });
        break;
    }
  };

  const handlePular = () => {
    navigation.replace('HomeDashboard');
  };

  const getConteudoContexto = () => {
    switch (contextoDetectado) {
      case 'link_compartilhado':
        return {
          icone: 'link-outline',
          cor: '#2196F3',
          titulo: 'Link Compartilhado',
          mensagem: 'Você acessou um veículo compartilhado!',
          descricao: 'Este veículo foi compartilhado com você. Você pode visualizar o histórico técnico completo, mas não verá valores privados do proprietário anterior.',
          acao: 'Visualizar Veículo',
          acaoSecundaria: 'Ir para Dashboard',
        };
      
      case 'veiculo_aceito':
        return {
          icone: 'checkmark-circle',
          cor: '#4CAF50',
          titulo: 'Veículo Aceito!',
          mensagem: 'Parabéns! Você agora é o proprietário deste veículo.',
          descricao: 'Um novo período de posse foi iniciado para você. O histórico técnico foi preservado, mas você começará com um período limpo de gastos.',
          acao: 'Ver Histórico do Veículo',
          acaoSecundaria: 'Ir para Dashboard',
        };
      
      case 'conta_sem_veiculo':
      default:
        return {
          icone: 'car-outline',
          cor: '#4CAF50',
          titulo: 'Bem-vindo',
          mensagem: 'Vamos começar cadastrando seu primeiro veículo.',
          descricao: 'Para começar a usar o TROIA, você precisa cadastrar pelo menos um veículo. Você poderá adicionar mais veículos depois.',
          acao: 'Cadastrar Primeiro Veículo',
          acaoSecundaria: 'Pular por enquanto',
        };
    }
  };

  if (!contextoDetectado) {
    return (
      <View style={commonStyles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      </View>
    );
  }

  const conteudo = getConteudoContexto();
  const mostrarHeader = contextoDetectado !== 'conta_sem_veiculo';

  return (
    <View style={commonStyles.container}>
      {mostrarHeader && <HeaderBar title="Bem-vindo" navigation={navigation} />}

      <ScrollView
        style={commonStyles.scrollContainer}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
      >
        <View style={styles.content}>
          {/* Ícone */}
          <View style={[styles.iconContainer, { backgroundColor: `${conteudo.cor}20` }]}>
            <Ionicons name={conteudo.icone} size={80} color={conteudo.cor} />
          </View>

          {/* Título */}
          <Text style={styles.titulo}>{conteudo.titulo}</Text>

          {/* Mensagem */}
          <Text style={styles.mensagem}>{conteudo.mensagem}</Text>

          {/* Descrição */}
          <View style={styles.descricaoContainer}>
            <Text style={styles.descricao}>{conteudo.descricao}</Text>
          </View>

          {/* Informações adicionais baseadas no contexto */}
          {contextoDetectado === 'veiculo_aceito' && (
            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={20} color="#2196F3" />
              <Text style={styles.infoText}>
                Você pode visualizar todo o histórico técnico do veículo, incluindo manutenções e KM anteriores.
              </Text>
            </View>
          )}

          {contextoDetectado === 'link_compartilhado' && (
            <View style={styles.infoBox}>
              <Ionicons name="lock-closed-outline" size={20} color="#FF9800" />
              <Text style={styles.infoText}>
                Para aceitar este veículo e se tornar o proprietário, faça login e use o botão "Aceitar este veículo".
              </Text>
            </View>
          )}

          {contextoDetectado === 'conta_sem_veiculo' && (
            <View style={styles.infoBox}>
              <Ionicons name="bulb-outline" size={20} color="#FF9800" />
              <Text style={styles.infoText}>
                Você também pode aceitar veículos compartilhados ou importar dados de outros sistemas depois.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Botões de ação */}
      <View style={[styles.actionsContainer, { paddingBottom: insets.bottom + 16 }]}>
        <ActionButton
          onPress={handleContinuar}
          label={conteudo.acao}
          icon={contextoDetectado === 'veiculo_aceito' ? 'checkmark-circle' : 'arrow-forward'}
          color={conteudo.cor}
          style={styles.actionButton}
        />
        
        {contextoDetectado !== 'conta_sem_veiculo' && (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handlePular}
          >
            <Text style={styles.skipButtonText}>{conteudo.acaoSecundaria}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  mensagem: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 26,
  },
  descricaoContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    width: '100%',
  },
  descricao: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    width: '100%',
    alignItems: 'flex-start',
  },
  infoText: {
    fontSize: 14,
    color: '#1976d2',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  actionsContainer: {
    padding: 20,
    paddingTop: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  actionButton: {
    width: '100%',
    marginBottom: 12,
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
});

