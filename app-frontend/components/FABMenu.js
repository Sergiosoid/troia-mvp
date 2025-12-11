import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const FAB_SIZE = 56;
const BUTTON_HEIGHT = 56;
const BUTTON_SPACING = 10;
const BUTTON_WIDTH = 200;

export default function FABMenu({ navigation, veiculos = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const insets = useSafeAreaInsets();
  
  const fadeAnim = useState(new Animated.Value(0))[0];
  const translateYAnim = useState(new Animated.Value(0))[0];
  const rotateAnim = useState(new Animated.Value(0))[0];

  const toggleMenu = () => {
    const toValue = isOpen ? 0 : 1;
    
    Animated.parallel([
      Animated.spring(fadeAnim, {
        toValue,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
      Animated.spring(translateYAnim, {
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
        if (veiculos.length === 0) {
          Alert.alert('Atenção', 'Cadastre um veículo primeiro');
          return;
        }
        if (veiculos.length === 1) {
          navigation.navigate('VeiculoHistorico', { veiculoId: veiculos[0].id });
        } else {
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
      label: 'Nova Manutenção',
      color: '#4CAF50',
    },
    {
      id: 'abastecimento',
      icon: 'water-outline',
      label: 'Abastecimento',
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
        pointerEvents="box-none"
      >
        {/* Menu Items - Empilhados verticalmente acima do FAB */}
        {menuItems.map((item, index) => {
          const translateY = translateYAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [10, 0],
          });

          const opacity = fadeAnim.interpolate({
            inputRange: [0, 0.3, 1],
            outputRange: [0, 0, 1],
          });

          // Posição do botão: acima do FAB, empilhado
          // O primeiro item (index 0) fica mais longe do FAB
          // O último item (index maior) fica mais perto do FAB
          const buttonBottom = FAB_SIZE + BUTTON_SPACING + (BUTTON_HEIGHT + BUTTON_SPACING) * (menuItems.length - 1 - index);

          return (
            <Animated.View
              key={item.id}
              style={[
                styles.menuItemContainer,
                {
                  bottom: buttonBottom,
                  right: 0,
                  opacity,
                  transform: [{ translateY }],
                },
              ]}
            >
              <TouchableOpacity
                style={[styles.menuItem, { backgroundColor: item.color }]}
                onPress={() => handleAction(item.id)}
                activeOpacity={0.8}
              >
                <Ionicons name={item.icon} size={22} color="#fff" />
                <Text style={styles.menuItemLabel}>{item.label}</Text>
              </TouchableOpacity>
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
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    width: '100%',
    height: '100%',
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
    width: BUTTON_WIDTH,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    height: BUTTON_HEIGHT,
    paddingHorizontal: 16,
    borderRadius: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  menuItemLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
});
