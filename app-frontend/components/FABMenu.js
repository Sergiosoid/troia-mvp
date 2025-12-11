import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity
} from 'react-native';
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

  // Calcular posição do FAB
  const fabBottom = insets.bottom + 20;
  const fabRight = 20;

  return (
    <>
      {/* FAB sempre visível (fora do Modal) */}
      <TouchableOpacity
        style={[
          styles.fabButton,
          {
            bottom: fabBottom,
            right: fabRight,
          },
        ]}
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

      {/* Modal apenas quando aberto */}
      <Modal
        visible={isOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={closeMenu}
      >
        {/* 1. Overlay (sempre abaixo) */}
        <Pressable
          style={styles.overlay}
          onPress={closeMenu}
          pointerEvents="box-only"
        />

        {/* 2. Menu Items */}
        <Animated.View
          style={[
            styles.menuContainer,
            {
              bottom: fabBottom + FAB_SIZE + BUTTON_SPACING,
              right: fabRight,
              opacity: fadeAnim,
              transform: [{ translateY: translateYAnim }],
            },
          ]}
        >
          {menuItems.map((item, index) => {
            // Posição do botão: acima do FAB, empilhado
            const buttonBottom = (BUTTON_HEIGHT + BUTTON_SPACING) * (menuItems.length - 1 - index);

            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.menuItem,
                  {
                    backgroundColor: item.color,
                    marginBottom: index < menuItems.length - 1 ? BUTTON_SPACING : 0,
                    position: 'relative',
                    bottom: buttonBottom,
                  },
                ]}
                onPress={() => handleAction(item.id)}
                activeOpacity={0.8}
              >
                <Ionicons name={item.icon} size={22} color="#fff" />
                <Text style={styles.menuItemLabel}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </Animated.View>

        {/* 3. FAB dentro do Modal (sempre acima de tudo quando modal aberto) */}
        <TouchableOpacity
          style={[
            styles.fabButton,
            {
              bottom: fabBottom,
              right: fabRight,
            },
          ]}
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
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 10,
  },
  menuContainer: {
    position: 'absolute',
    zIndex: 20,
    alignItems: 'flex-end',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: BUTTON_WIDTH,
    height: BUTTON_HEIGHT,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
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
  fabButton: {
    position: 'absolute',
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
});
