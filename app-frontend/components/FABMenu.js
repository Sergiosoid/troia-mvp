import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const FAB_SIZE = 56;
const BUTTON_MIN_HEIGHT = 52;
const BUTTON_SPACING = 10;
const BUTTON_MIN_WIDTH = 180;
const BUTTON_MAX_WIDTH = 220;
const BUTTON_PADDING_HORIZONTAL = 16;

export default function FABMenu({ navigation, veiculos = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const insets = useSafeAreaInsets();
  
  // Animação do FAB (rotação)
  const rotateAnim = useRef(new Animated.Value(0)).current;
  
  // Animação individual para cada botão
  const buttonAnimations = useRef({
    manutencao: new Animated.Value(0),
    abastecimento: new Animated.Value(0),
    km: new Animated.Value(0),
  }).current;

  const toggleMenu = () => {
    const toValue = isOpen ? 0 : 1;
    
    // Animar rotação do FAB
    Animated.spring(rotateAnim, {
      toValue,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
    
    // Animar cada botão individualmente com delay escalonado
    const menuItems = ['manutencao', 'abastecimento', 'km'];
    menuItems.forEach((itemId, index) => {
      Animated.spring(buttonAnimations[itemId], {
        toValue,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
        delay: index * 30, // Delay escalonado para efeito cascata
      }).start();
    });
    
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
          navigation.navigate('AtualizarKm', { veiculoId: veiculos[0].id });
        } else {
          navigation.navigate('EscolherVeiculoParaKm');
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
      {/* FAB principal - sempre visível, único renderizado */}
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

      {/* Modal apenas quando aberto - contém SOMENTE os botões secundários */}
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

        {/* 2. Menu Items - cada um com sua própria animação */}
        <View
          style={[
            styles.menuContainer,
            {
              bottom: fabBottom + FAB_SIZE + BUTTON_SPACING,
              right: fabRight,
            },
          ]}
        >
          {menuItems.map((item, index) => {
            const buttonAnim = buttonAnimations[item.id];
            
            // Interpolação para cada botão individual
            const opacity = buttonAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 1],
            });
            
            const translateY = buttonAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            });

            return (
              <Animated.View
                key={item.id}
                style={[
                  {
                    opacity,
                    transform: [{ translateY }],
                    marginBottom: index < menuItems.length - 1 ? BUTTON_SPACING : 0,
                  },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.menuItem,
                    {
                      backgroundColor: item.color,
                    },
                  ]}
                  onPress={() => handleAction(item.id)}
                  activeOpacity={0.8}
                >
                  <Ionicons name={item.icon} size={22} color="#fff" />
                  <Text 
                    style={styles.menuItemLabel}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    allowFontScaling={false}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
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
    minWidth: BUTTON_MIN_WIDTH,
    maxWidth: BUTTON_MAX_WIDTH,
    minHeight: BUTTON_MIN_HEIGHT,
    paddingVertical: 12,
    paddingHorizontal: BUTTON_PADDING_HORIZONTAL,
    borderRadius: 8,
    ...Platform.select({
      android: {
        elevation: 4,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
    }),
  },
  menuItemLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 12,
    flexShrink: 1,
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
    ...Platform.select({
      android: {
        elevation: 8,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
    }),
  },
});
