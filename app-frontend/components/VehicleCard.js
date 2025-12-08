import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { commonStyles } from '../constants/styles';

const SPACING = 16;

export default function VehicleCard({ veiculo, onPress, formatarMoeda, formatarData }) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Header do Card */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={styles.veiculoNomeRow}>
            <Ionicons name="car-outline" size={24} color="#4CAF50" />
            <View>
              <Text style={styles.veiculoNome}>
                {veiculo.modelo || veiculo.marca || 'Veículo'} {veiculo.ano ? `(${veiculo.ano})` : ''}
              </Text>
              {veiculo.placa && (
                <Text style={styles.veiculoPlaca}>{veiculo.placa}</Text>
              )}
            </View>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#666" />
      </View>
      
      {/* Body do Card */}
      <View style={styles.cardBody}>
        {/* KM Atual */}
        {veiculo.km_atual && (
          <View style={styles.infoRow}>
            <View style={styles.infoLabelRow}>
              <Ionicons name="speedometer-outline" size={18} color="#2196F3" />
              <Text style={styles.label}>KM Atual:</Text>
            </View>
            <Text style={styles.value}>
              {veiculo.km_atual.toLocaleString('pt-BR')} km
            </Text>
          </View>
        )}
        
        {/* Total Gasto */}
        <View style={styles.infoRow}>
          <View style={styles.infoLabelRow}>
            <Ionicons name="cash-outline" size={18} color="#4CAF50" />
            <Text style={styles.label}>Total Gasto:</Text>
          </View>
          <Text style={styles.value}>
            {formatarMoeda(parseFloat(veiculo.totalGasto) || 0)}
          </Text>
        </View>
        
        {/* Última Manutenção */}
        <View style={styles.infoRow}>
          <View style={styles.infoLabelRow}>
            <Ionicons name="calendar-outline" size={18} color="#666" />
            <Text style={styles.label}>Última Manutenção:</Text>
          </View>
          <Text style={styles.value}>
            {formatarData(veiculo.ultimaData)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    marginHorizontal: SPACING,
    marginVertical: 10,
    padding: 14,
    borderRadius: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  veiculoNomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING / 2,
  },
  veiculoNome: {
    fontSize: 20,
    fontWeight: 'bold',
    color: commonStyles.textPrimary,
    marginLeft: SPACING / 2,
  },
  veiculoPlaca: {
    fontSize: 14,
    color: commonStyles.textSecondary,
    marginLeft: SPACING / 2,
    marginTop: 2,
  },
  cardBody: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: SPACING,
    marginTop: SPACING / 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  label: {
    fontSize: 14,
    color: commonStyles.textSecondary,
    marginLeft: SPACING / 2,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: commonStyles.textPrimary,
  },
});

