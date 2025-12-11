import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import CameraControlButton from '../components/CameraControlButton';

export default function CameraCaptureScreen({ navigation, route }) {
  const [facing, setFacing] = useState('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef(null);
  const insets = useSafeAreaInsets();

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
        // Extrair informações do arquivo
        const filename = photo.uri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const fileType = match ? `image/${match[1]}` : `image/jpeg`;
        const fileName = filename || 'nota.jpg';

        // Navegar para PreviewParsedScreen com informações serializáveis
        const { veiculoId } = route?.params || {};
        navigation.navigate('PreviewParsed', { 
          imageUri: photo.uri,
          fileName: fileName,
          fileType: fileType,
          veiculoId: veiculoId 
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
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Verificando permissões...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Precisamos de permissão para usar a câmera</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Conceder permissão</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.permissionButton, styles.permissionButtonSecondary]} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.permissionButtonSecondaryText}>Voltar</Text>
        </TouchableOpacity>
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
        <View style={styles.overlay}>
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
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  permissionButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    minWidth: 200,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  permissionButtonSecondary: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  permissionButtonSecondaryText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
  },
});
