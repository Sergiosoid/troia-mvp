import React, { useState, useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { registerRootComponent } from 'expo';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { isUserLoggedIn } from './utils/authStorage';

import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeDashboardScreen from './screens/HomeDashboardScreen';
import VeiculoHistoricoScreen from './screens/VeiculoHistoricoScreen';
import EscolherVeiculoParaManutencaoScreen from './screens/EscolherVeiculoParaManutencaoScreen';
import EscolherVeiculoParaAbastecimentoScreen from './screens/EscolherVeiculoParaAbastecimentoScreen';
import CadastroProprietarioScreen from './screens/CadastroProprietarioScreen';
import CadastroVeiculoScreen from './screens/CadastroVeiculoScreen';
import CadastroManutencaoScreen from './screens/CadastroManutencaoScreen';
import ListaManutencoesScreen from './screens/ListaManutencoesScreen';
import PesquisaScreen from './screens/PesquisaScreen';
import CameraCaptureScreen from './screens/CameraCaptureScreen';
import PreviewParsedScreen from './screens/PreviewParsedScreen';
import ConfiguracoesScreen from './screens/ConfiguracoesScreen';
import EditarPerfilScreen from './screens/EditarPerfilScreen';
import SobreScreen from './screens/SobreScreen';
import GerenciarProprietariosScreen from './screens/GerenciarProprietariosScreen';
import GerenciarVeiculosScreen from './screens/GerenciarVeiculosScreen';
import RegistrarAbastecimentoScreen from './screens/RegistrarAbastecimentoScreen';
import CameraAbastecimento from './components/CameraAbastecimento';

const Stack = createNativeStackNavigator();

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      // Verificar se usuário está logado (userId E token JWT)
      const loggedIn = await isUserLoggedIn();
      setIsLoggedIn(loggedIn);
    } catch (error) {
      console.error('Erro ao verificar login:', error);
      setIsLoggedIn(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={isLoggedIn ? "HomeDashboard" : "Login"}>
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Register" 
          component={RegisterScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="HomeDashboard" 
          component={HomeDashboardScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="VeiculoHistorico" 
          component={VeiculoHistoricoScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="EscolherVeiculoParaManutencao" 
          component={EscolherVeiculoParaManutencaoScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="EscolherVeiculoParaAbastecimento" 
          component={EscolherVeiculoParaAbastecimentoScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="CadastroProprietario" component={CadastroProprietarioScreen} />
        <Stack.Screen name="CadastroVeiculo" component={CadastroVeiculoScreen} />
        <Stack.Screen name="CadastroManutencao" component={CadastroManutencaoScreen} />
        <Stack.Screen name="ListaManutencoes" component={ListaManutencoesScreen} />
        <Stack.Screen name="Pesquisa" component={PesquisaScreen} />
        <Stack.Screen 
          name="CameraCapture" 
          component={CameraCaptureScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="PreviewParsed" 
          component={PreviewParsedScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Configuracoes" 
          component={ConfiguracoesScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="EditarPerfil" 
          component={EditarPerfilScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Sobre" 
          component={SobreScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="GerenciarProprietarios" 
          component={GerenciarProprietariosScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="GerenciarVeiculos" 
          component={GerenciarVeiculosScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="RegistrarAbastecimento" 
          component={RegistrarAbastecimentoScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="CameraAbastecimento" 
          component={CameraAbastecimento}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Register the root component with Expo
registerRootComponent(App);
