import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { registerRootComponent } from 'expo';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { isUserLoggedIn } from './utils/authStorage';

import CameraAbastecimento from './components/CameraAbastecimento';
import AlertasScreen from './screens/AlertasScreen';
import BuscarScreen from './screens/BuscarScreen';
import CadastroManutencaoScreen from './screens/CadastroManutencaoScreen';
import CadastroProprietarioScreen from './screens/CadastroProprietarioScreen';
import CadastroVeiculoScreen from './screens/CadastroVeiculoScreen';
import CameraCaptureScreen from './screens/CameraCaptureScreen';
import ConfiguracoesScreen from './screens/ConfiguracoesScreen';
import EditarPerfilScreen from './screens/EditarPerfilScreen';
import EditarVeiculoScreen from './screens/EditarVeiculoScreen';
import EscolherVeiculoParaAbastecimentoScreen from './screens/EscolherVeiculoParaAbastecimentoScreen';
import EscolherVeiculoParaKmScreen from './screens/EscolherVeiculoParaKmScreen';
import EscolherVeiculoParaManutencaoScreen from './screens/EscolherVeiculoParaManutencaoScreen';
import AtualizarKmScreen from './screens/AtualizarKmScreen';
import GerenciarProprietariosScreen from './screens/GerenciarProprietariosScreen';
import GerenciarVeiculosScreen from './screens/GerenciarVeiculosScreen';
import HomeDashboardScreen from './screens/HomeDashboardScreen';
import ListaManutencoesScreen from './screens/ListaManutencoesScreen';
import LoginScreen from './screens/LoginScreen';
import PesquisaScreen from './screens/PesquisaScreen';
import PreviewParsedScreen from './screens/PreviewParsedScreen';
import RegisterScreen from './screens/RegisterScreen';
import RegistrarAbastecimentoScreen from './screens/RegistrarAbastecimentoScreen';
import SobreScreen from './screens/SobreScreen';
import VeiculoHistoricoScreen from './screens/VeiculoHistoricoScreen';
import PublicVehicleScreen from './screens/PublicVehicleScreen';

const Stack = createNativeStackNavigator();

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      // Verificar se usuário está logado e token é válido no backend
      // isUserLoggedIn() agora valida o token no servidor
      const loggedIn = await isUserLoggedIn();
      setIsLoggedIn(loggedIn);
    } catch (error) {
      console.error('Erro ao verificar login:', error);
      // Em caso de erro, forçar login
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
        <Stack.Screen 
          name="EscolherVeiculoParaKm" 
          component={EscolherVeiculoParaKmScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="AtualizarKm" 
          component={AtualizarKmScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="HistoricoKm" 
          component={HistoricoKmScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="CadastroProprietario" 
          component={CadastroProprietarioScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="CadastroVeiculo" 
          component={CadastroVeiculoScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="CadastroManutencao" 
          component={CadastroManutencaoScreen}
          options={{ headerShown: false }}
        />
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
        <Stack.Screen 
          name="EditarVeiculo" 
          component={EditarVeiculoScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Alertas" 
          component={AlertasScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Buscar" 
          component={BuscarScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Register the root component with Expo
registerRootComponent(App);
