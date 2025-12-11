/**
 * Componente de Câmera para Abastecimentos
 * Com moldura para orientar o usuário a fotografar bomba ou comprovante
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { commonStyles } from '../constants/styles';
import CameraControlButton from './CameraControlButton';

export default function CameraAbastecimento({ navigation, route }) {
  const [facing, setFacing] = useState('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef(null);
  const insets = useSafeAreaInsets();
  const tipoFoto = route?.params?.tipo || 'bomba'; // 'bomba' ou 'comprovante'

  useEffect(() => {
    if (permission && !permission.granted && !permission.canAskAgain) {
      Alert.alert(
        'Permissão Negada',
        'Para usar a câmera, você precisa permitir o acesso nas configurações do dispositivo.',
        [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]
      );
    } else if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission]);

  const takePicture = async () => {
    if (!cameraRef.current) {
      Alert.alert('Erro', 'Câmera não está pronta');
      return;
    }

    if (!permission?.granted) {
      Alert.alert('Permissão necessária', 'É necessário permitir o acesso à câmera');
      return;
    }

    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      if (photo && photo.uri) {
        // Retornar para a tela anterior com a foto
        navigation.navigate('RegistrarAbastecimento', {
          imagemUri: photo.uri,
          tipoFoto: tipoFoto
        });
      }
    } catch (error) {
      console.error('Erro ao capturar foto:', error);
      Alert.alert('Erro', 'Não foi possível capturar a foto. Tente novamente.');
    } finally {
      setIsCapturing(false);
    }
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={commonStyles.primaryColor} />
        <Text style={styles.loadingText}>Carregando câmera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color={commonStyles.primaryColor} />
          <Text style={styles.permissionText}>
            Precisamos de acesso à câmera para fotografar o abastecimento
          </Text>
          <TouchableOpacity
            style={[commonStyles.button, { marginTop: 20 }]}
            onPress={requestPermission}
          >
            <Text style={commonStyles.buttonText}>Permitir Câmera</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
      >
        {/* Overlay com moldura */}
        <View style={styles.overlay}>
          {/* Moldura centralizada */}
          <View style={styles.frame}>
            <View style={styles.frameBorder} />
            <View style={styles.frameContent}>
              <Text style={styles.frameTitle}>
                {tipoFoto === 'bomba' ? 'Fotografe a Bomba' : 'Fotografe o Comprovante'}
              </Text>
              <Text style={styles.frameSubtitle}>
                {tipoFoto === 'bomba' 
                  ? 'Enquadre a bomba mostrando litros, valor e tipo de combustível'
                  : 'Enquadre o comprovante completo do abastecimento'}
              </Text>
            </View>
          </View>

          {/* Botão Cancelar - Esquerda */}
          <CameraControlButton
            onPress={() => navigation.goBack()}
            icon="close"
            label="Cancelar"
            disabled={isCapturing}
            style={[
              styles.controlButtonLeft,
              { bottom: insets.bottom + 30 }
            ]}
          />

          {/* Botão de Captura - Centralizado */}
          <TouchableOpacity
            style={[
              styles.captureButton,
              { bottom: insets.bottom + 20 }
            ]}
            onPress={takePicture}
            disabled={isCapturing}
            activeOpacity={0.8}
          >
            {isCapturing ? (
              <ActivityIndicator size="small" color="#4CAF50" />
            ) : (
              <View style={styles.captureButtonInner} />
            )}
          </TouchableOpacity>

          {/* Botão Alternar Câmera - Direita */}
          <CameraControlButton
            onPress={toggleCameraFacing}
            icon="camera-reverse"
            label="Virar"
            disabled={isCapturing}
            style={[
              styles.controlButtonRight,
              { bottom: insets.bottom + 30 }
            ]}
          />
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  frame: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 40,
    marginVertical: 100,
  },
  frameBorder: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderWidth: 3,
    borderColor: commonStyles.primaryColor,
    borderRadius: 20,
    borderStyle: 'dashed',
  },
  frameContent: {
    position: 'absolute',
    bottom: -60,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  frameTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  frameSubtitle: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  controlButtonLeft: {
    position: 'absolute',
    left: 20,
    zIndex: 3,
    elevation: 10,
  },
  controlButtonRight: {
    position: 'absolute',
    right: 20,
    zIndex: 3,
    elevation: 10,
  },
  captureButton: {
    position: 'absolute',
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#4CAF50',
    zIndex: 3,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4CAF50',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: commonStyles.backgroundWhite,
  },
  permissionText: {
    fontSize: 16,
    color: commonStyles.textSecondary,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: commonStyles.textSecondary,
  },
});
