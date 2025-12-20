/**
 * Tela de diagnóstico de veículo (apenas para desenvolvimento/debug)
 * Exibe informações sobre estado do veículo, proprietário atual, KM e histórico
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import HeaderBar from '../components/HeaderBar';
import { buscarDiagnosticoVeiculo } from '../services/api';
import { commonStyles } from '../constants/styles';

export default function DiagnosticoVeiculoScreen({ route, navigation }) {
  const { veiculoId } = route?.params || {};
  const [diagnostico, setDiagnostico] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (veiculoId) {
      carregarDiagnostico();
    } else {
      setError('ID do veículo não fornecido');
      setLoading(false);
    }
  }, [veiculoId]);

  const carregarDiagnostico = async () => {
    try {
      setLoading(true);
      setError(null);
      const dados = await buscarDiagnosticoVeiculo(veiculoId);
      setDiagnostico(dados);
    } catch (err) {
      console.error('Erro ao carregar diagnóstico:', err);
      setError(err.message || 'Erro ao carregar diagnóstico');
      Alert.alert('Erro', err.message || 'Não foi possível carregar o diagnóstico');
    } finally {
      setLoading(false);
    }
  };

  const renderStatus = (valor, label) => {
    const isOk = valor === true || valor !== null;
    return (
      <View style={styles.statusRow}>
        <Ionicons
          name={isOk ? 'checkmark-circle' : 'close-circle'}
          size={20}
          color={isOk ? '#4CAF50' : '#F44336'}
        />
        <Text style={styles.statusLabel}>{label}:</Text>
        <Text style={[styles.statusValue, !isOk && styles.statusError]}>
          {valor === true ? 'Sim' : valor === false ? 'Não' : valor !== null ? String(valor) : 'N/A'}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <HeaderBar title="Diagnóstico do Veículo" />
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Carregando diagnóstico...</Text>
        </View>
      </View>
    );
  }

  if (error && !diagnostico) {
    return (
      <View style={styles.container}>
        <HeaderBar title="Diagnóstico do Veículo" />
        <View style={styles.centerContent}>
          <Ionicons name="alert-circle" size={48} color="#F44336" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={commonStyles.button}
            onPress={carregarDiagnostico}
          >
            <Text style={commonStyles.buttonText}>Tentar Novamente</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const periodoValido = diagnostico?.periodo_valido === true;

  return (
    <View style={styles.container}>
      <HeaderBar title="Diagnóstico do Veículo" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>

        {/* Status geral */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status Geral</Text>
          {renderStatus(diagnostico?.veiculo_existe, 'Veículo existe')}
          {renderStatus(diagnostico?.veiculo_pertence_ao_usuario, 'Veículo pertence ao usuário')}
          {renderStatus(diagnostico?.proprietario_atual_existe, 'Proprietário atual existe')}
          {renderStatus(diagnostico?.periodo_valido, 'Período válido')}
        </View>

        {/* Histórico de KM */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Histórico de KM</Text>
          {renderStatus(diagnostico?.possui_km_historico, 'Possui histórico de KM')}
          {renderStatus(diagnostico?.km_atual, 'KM atual')}
        </View>

        {/* Histórico */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Histórico</Text>
          {renderStatus(diagnostico?.possui_km_historico, 'Possui KM histórico')}
          {renderStatus(diagnostico?.possui_abastecimentos, 'Possui abastecimentos')}
          {renderStatus(diagnostico?.possui_manutencoes, 'Possui manutenções')}
        </View>

        {/* Debug (apenas em desenvolvimento) */}
        {diagnostico?._debug && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Debug (Desenvolvimento)</Text>
            <Text style={styles.debugText}>
              {JSON.stringify(diagnostico._debug, null, 2)}
            </Text>
          </View>
        )}

        {/* Botão de atualizar */}
        <TouchableOpacity
          style={[commonStyles.button, styles.refreshButton]}
          onPress={carregarDiagnostico}
        >
          <Ionicons name="refresh" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={commonStyles.buttonText}>Atualizar Diagnóstico</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
  },
  alertBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  alertText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#E65100',
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  statusError: {
    color: '#F44336',
  },
  debugText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#666',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 4,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
});

