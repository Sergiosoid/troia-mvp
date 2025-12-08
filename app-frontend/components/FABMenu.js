import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const FAB_SIZE = 56;
const MENU_ITEM_SIZE = 50;
const MENU_RADIUS = 80;

export default function FABMenu({ navigation, veiculos = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const insets = useSafeAreaInsets();
  
  const scaleAnim = useState(new Animated.Value(0))[0];
  const rotateAnim = useState(new Animated.Value(0))[0];

  const toggleMenu = () => {
    const toValue = isOpen ? 0 : 1;
    
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
      Animated.spring(rotateAnim, {
        toValue,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
    ]).start();
    
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    if (isOpen) {
      toggleMenu();
    }
  };

  const handleAction = (action) => {
    closeMenu();
    
    switch (action) {
      case 'manutencao':
        navigation.navigate('EscolherVeiculoParaManutencao');
        break;
      case 'abastecimento':
        if (veiculos.length === 0) {
          Alert.alert('Atenção', 'Cadastre um veículo primeiro');
          return;
        }
        if (veiculos.length === 1) {
          navigation.navigate('RegistrarAbastecimento', { veiculoId: veiculos[0].id });
        } else {
          navigation.navigate('EscolherVeiculoParaAbastecimento');
        }
        break;
      case 'km':
        // Navegar para tela de atualizar KM
        if (veiculos.length === 0) {
          Alert.alert('Atenção', 'Cadastre um veículo primeiro');
          return;
        }
        if (veiculos.length === 1) {
          // Navegar para histórico do veículo (onde pode atualizar KM)
          navigation.navigate('VeiculoHistorico', { veiculoId: veiculos[0].id });
        } else {
          // Navegar para escolher veículo
          navigation.navigate('EscolherVeiculoParaManutencao');
        }
        break;
      default:
        break;
    }
  };

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  const menuItems = [
    {
      id: 'manutencao',
      icon: 'construct-outline',
      label: 'Nova manutenção',
      color: '#4CAF50',
    },
    {
      id: 'abastecimento',
      icon: 'water-outline',
      label: 'Registrar abastecimento',
      color: '#2196F3',
    },
    {
      id: 'km',
      icon: 'camera-outline',
      label: 'Atualizar KM',
      color: '#FF9800',
    },
  ];

  return (
    <>
      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={closeMenu}
        />
      </Modal>

      <View
        style={[
          styles.container,
          {
            bottom: insets.bottom + 20,
            right: 20,
          },
        ]}
      >
        {/* Menu Items */}
        {menuItems.map((item, index) => {
          const angle = (index * 90 - 45) * (Math.PI / 180);
          const x = Math.cos(angle) * MENU_RADIUS;
          const y = Math.sin(angle) * MENU_RADIUS;

          const translateX = scaleAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, x],
          });

          const translateY = scaleAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, y],
          });

          const opacity = scaleAnim.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, 0, 1],
          });

          return (
            <Animated.View
              key={item.id}
              style={[
                styles.menuItemContainer,
                {
                  transform: [{ translateX }, { translateY }],
                  opacity,
                },
              ]}
            >
              <TouchableOpacity
                style={[styles.menuItem, { backgroundColor: item.color }]}
                onPress={() => handleAction(item.id)}
                activeOpacity={0.8}
              >
                <Ionicons name={item.icon} size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.menuItemLabel}>{item.label}</Text>
            </Animated.View>
          );
        })}

        {/* Main FAB Button */}
        <TouchableOpacity
          style={styles.fab}
          onPress={toggleMenu}
          activeOpacity={0.8}
        >
          <Animated.View
            style={{
              transform: [{ rotate: rotateInterpolate }],
            }}
          >
            <Ionicons name="add" size={28} color="#fff" />
          </Animated.View>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  menuItemContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  menuItem: {
    width: MENU_ITEM_SIZE,
    height: MENU_ITEM_SIZE,
    borderRadius: MENU_ITEM_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  menuItemLabel: {
    position: 'absolute',
    right: MENU_ITEM_SIZE + 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    fontSize: 12,
    fontWeight: '600',
    overflow: 'hidden',
  },
});

