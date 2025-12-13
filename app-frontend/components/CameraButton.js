import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function CameraButton({
  onPress,
  label = 'Tirar Foto',
  icon = 'camera-outline',
  loading = false,
  disabled = false,
  variant = 'primary', // 'primary' | 'secondary'
  style,
}) {
  const backgroundColor = variant === 'primary' ? '#4CAF50' : '#fff';
  const borderColor = variant === 'secondary' ? '#4CAF50' : 'transparent';
  const borderWidth = variant === 'secondary' ? 2 : 0;
  const textColor = variant === 'primary' ? '#fff' : '#4CAF50';
  const iconColor = variant === 'primary' ? '#fff' : '#4CAF50';

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor,
          borderColor,
          borderWidth,
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
          <Ionicons name={icon} size={22} color={iconColor} />
          {label && (
            <Text 
              style={[styles.label, { color: textColor }]}
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
    minHeight: 48,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    minWidth: 48,
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
    marginLeft: 8,
    flexShrink: 1,
  },
});

