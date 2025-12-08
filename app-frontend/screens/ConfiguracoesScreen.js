import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { clearLoggedUser, getLoggedUser } from '../utils/authStorage';

export default function ConfiguracoesScreen({ navigation }) {
  const [userInfo, setUserInfo] = React.useState({ nome: 'Usuário', email: 'usuario@exemplo.com' });

  React.useEffect(() => {
    // Carregar informações do usuário
    const loadUserInfo = async () => {
      try {
        const user = await getLoggedUser();
        if (user) {
          setUserInfo({
            nome: user.nome || 'Usuário',
            email: user.email || 'usuario@exemplo.com',
          });
        }
      } catch (error) {
        console.error('Erro ao carregar informações do usuário:', error);
      }
    };
    loadUserInfo();
  }, []);

  const handleEditarPerfil = () => {
    Alert.alert('Em breve', 'Edição de perfil será implementada em breve');
  };

  const handleSair = async () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sair', 
          onPress: async () => {
            try {
              // Limpar dados do usuário usando função centralizada
              await clearLoggedUser();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              console.error('Erro ao fazer logout:', error);
              Alert.alert('Erro', 'Não foi possível fazer logout');
            }
          }
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configurações</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Seção de Perfil */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Perfil</Text>
          
          <View style={styles.profileCard}>
            <View style={styles.profileIcon}>
              <Ionicons name="person" size={32} color="#4CAF50" />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{userInfo.nome}</Text>
              <Text style={styles.profileEmail}>{userInfo.email}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleEditarPerfil}
          >
            <Ionicons name="create-outline" size={24} color="#333" />
            <Text style={styles.menuItemText}>Editar Perfil</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Seção de Ajuda */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ajuda</Text>
          
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Alert.alert('Em breve', 'Sobre será implementado')}
          >
            <Ionicons name="information-circle-outline" size={24} color="#333" />
            <Text style={styles.menuItemText}>Sobre o App</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Alert.alert('Em breve', 'Suporte será implementado')}
          >
            <Ionicons name="help-circle-outline" size={24} color="#333" />
            <Text style={styles.menuItemText}>Suporte</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Seção de Conta */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.menuItem, styles.menuItemDanger]}
            onPress={handleSair}
          >
            <Ionicons name="log-out-outline" size={24} color="#f44336" />
            <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>Sair</Text>
          </TouchableOpacity>
        </View>

        {/* Versão */}
        <Text style={styles.versionText}>Versão 1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginHorizontal: 20,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  profileCard: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  profileIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
  },
  menuItem: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 1,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
  },
  menuItemDanger: {
    borderBottomWidth: 0,
  },
  menuItemTextDanger: {
    color: '#f44336',
  },
  versionText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    marginTop: 30,
    marginBottom: 20,
  },
});

