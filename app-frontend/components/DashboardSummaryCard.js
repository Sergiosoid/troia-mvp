/**
 * Componente DashboardSummaryCard
 * Exibe métricas resumidas do dashboard em cards horizontais
 */

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { commonStyles } from '../constants/styles';

const SPACING = 16;

export default function DashboardSummaryCard({ 
  kmTotal, 
  gasto30dias, 
  consumoMedio, 
  litrosMes, 
  manutencaoProxima,
  loading = false 
}) {
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.cardRow}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={[styles.card, styles.skeletonCard]}>
              <ActivityIndicator size="small" color="#ccc" />
            </View>
          ))}
        </View>
      </View>
    );
  }

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
  };

  const formatarNumero = (valor) => {
    return new Intl.NumberFormat('pt-BR').format(valor || 0);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Resumo da Frota</Text>
      
      <View style={styles.cardRow}>
        {/* Card: KM Total */}
        <View style={[styles.card, styles.cardVerde]}>
          <Ionicons name="speedometer-outline" size={24} color="#fff" />
          <Text style={styles.cardLabel}>KM Total</Text>
          <Text style={styles.cardValue}>{formatarNumero(kmTotal || 0)}</Text>
        </View>

        {/* Card: Gasto 30 Dias */}
        <View style={[styles.card, styles.cardAzul]}>
          <Ionicons name="cash-outline" size={24} color="#fff" />
          <Text style={styles.cardLabel}>Gasto 30 dias</Text>
          <Text style={styles.cardValue}>{formatarMoeda(gasto30dias || 0)}</Text>
        </View>
      </View>

      <View style={styles.cardRow}>
        {/* Card: Consumo Médio */}
        <View style={[styles.card, styles.cardAmarelo]}>
          <Ionicons name="flame-outline" size={24} color="#fff" />
          <Text style={styles.cardLabel}>Consumo Médio</Text>
          <Text style={styles.cardValue}>
            {consumoMedio ? `${parseFloat(consumoMedio).toFixed(1)} km/l` : 'N/A'}
          </Text>
        </View>

        {/* Card: Litros no Mês */}
        <View style={[styles.card, styles.cardLaranja]}>
          <Ionicons name="water-outline" size={24} color="#fff" />
          <Text style={styles.cardLabel}>Litros no Mês</Text>
          <Text style={styles.cardValue}>
            {litrosMes ? `${parseFloat(litrosMes).toFixed(1)} L` : '0 L'}
          </Text>
        </View>
      </View>

      {/* Card: Previsão de Manutenção */}
      {manutencaoProxima && (
        <View style={[styles.cardFull, styles.cardAlerta]}>
          <View style={styles.cardFullHeader}>
            <Ionicons name="warning-outline" size={24} color="#fff" />
            <Text style={styles.cardFullTitle}>Manutenção Próxima</Text>
          </View>
          <Text style={styles.cardFullValue}>{manutencaoProxima.tipo}</Text>
          <Text style={styles.cardFullSubtitle}>
            Falta {formatarNumero(manutencaoProxima.faltaKm)} km
            {manutencaoProxima.faltaMeses && ` ou ${manutencaoProxima.faltaMeses} meses`}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: SPACING,
    marginBottom: SPACING / 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: commonStyles.textPrimary,
    marginBottom: SPACING,
  },
  cardRow: {
    flexDirection: 'row',
    gap: SPACING,
    marginBottom: SPACING,
  },
  card: {
    flex: 1,
    backgroundColor: '#4CAF50',
    padding: SPACING,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  cardVerde: {
    backgroundColor: '#4CAF50',
  },
  cardAzul: {
    backgroundColor: '#2196F3',
  },
  cardAmarelo: {
    backgroundColor: '#FFC107',
  },
  cardLaranja: {
    backgroundColor: '#FF9800',
  },
  cardAlerta: {
    backgroundColor: '#F44336',
  },
  cardLabel: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
    marginTop: SPACING / 2,
    textAlign: 'center',
    fontWeight: '600',
  },
  cardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: SPACING / 4,
    textAlign: 'center',
  },
  cardFull: {
    backgroundColor: '#F44336',
    padding: SPACING,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginTop: SPACING / 2,
  },
  cardFullHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING / 2,
  },
  cardFullTitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginLeft: SPACING / 2,
    fontWeight: '600',
  },
  cardFullValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: SPACING / 4,
  },
  cardFullSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  skeletonCard: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

