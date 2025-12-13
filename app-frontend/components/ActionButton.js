import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Componente reutilizável para botões de ação (usado no FAB e outras telas)
 * 
 * @param {Function} onPress - Função chamada ao pressionar
 * @param {String} label - Texto do botão
 * @param {String} icon - Nome do ícone (Ionicons)
 * @param {String} color - Cor de fundo do botão
 * @param {Boolean} loading - Mostra loading spinner
 * @param {Boolean} disabled - Desabilita o botão
 * @param {Object} style - Estilos adicionais
 */
export default function ActionButton({
  onPress,
  label,
  icon,
  color = '#4CAF50',
  loading = false,
  disabled = false,
  style,
  iconSize = 22,
  textColor = '#fff',
}) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: color,
          opacity: disabled || loading ? 0.6 : 1,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={iconSize} color={textColor} />}
          {label && (
            <Text 
              style={[styles.label, { color: textColor, marginLeft: icon ? 8 : 0 }]}
              numberOfLines={1}
              allowFontScaling={false}
            >
              {label}
            </Text>
          )}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    minHeight: 48,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
    textAlign: 'center',
    flexShrink: 1,
  },
});

