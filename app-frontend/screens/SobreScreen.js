/**
 * Tela Sobre o App
 * Informações sobre o aplicativo TROIA
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { commonStyles } from '../constants/styles';

export default function SobreScreen({ navigation }) {
  const abrirLink = (url) => {
    Linking.openURL(url).catch((err) => {
      console.error('Erro ao abrir link:', err);
    });
  };

  return (
    <SafeAreaView style={commonStyles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={commonStyles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={commonStyles.textPrimary} />
        </TouchableOpacity>
        <Text style={commonStyles.headerTitle}>Sobre o App</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoContainer}>
          <Ionicons name="car-sport" size={80} color={commonStyles.primaryColor} />
          <Text style={styles.appName}>TROIA</Text>
          <Text style={styles.appVersion}>Versão 1.0.0</Text>
        </View>

        <View style={commonStyles.card}>
          <Text style={styles.sectionTitle}>Sobre</Text>
          <Text style={styles.text}>
            TROIA é um aplicativo completo para gestão de manutenções e abastecimentos de veículos.
            Com recursos de OCR e IA, facilite o registro e acompanhamento das despesas do seu veículo.
          </Text>
        </View>

        <View style={commonStyles.card}>
          <Text style={styles.sectionTitle}>Recursos</Text>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color={commonStyles.primaryColor} />
            <Text style={styles.featureText}>Registro de manutenções com OCR</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color={commonStyles.primaryColor} />
            <Text style={styles.featureText}>Controle de abastecimentos</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color={commonStyles.primaryColor} />
            <Text style={styles.featureText}>Cálculo automático de consumo</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color={commonStyles.primaryColor} />
            <Text style={styles.featureText}>Histórico completo</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color={commonStyles.primaryColor} />
            <Text style={styles.featureText}>Estatísticas e relatórios</Text>
          </View>
        </View>

        <View style={commonStyles.card}>
          <Text style={styles.sectionTitle}>Política de Privacidade</Text>
          <Text style={styles.text}>
            Seus dados são armazenados de forma segura e não são compartilhados com terceiros.
            Todas as informações são criptografadas e protegidas.
          </Text>
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => abrirLink('https://example.com/privacy')}
          >
            <Text style={styles.linkText}>Ler política completa</Text>
            <Ionicons name="open-outline" size={16} color={commonStyles.primaryColor} />
          </TouchableOpacity>
        </View>

        <View style={commonStyles.card}>
          <Text style={styles.sectionTitle}>Termos de Uso</Text>
          <Text style={styles.text}>
            Ao usar o TROIA, você concorda com nossos termos de uso e políticas.
          </Text>
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => abrirLink('https://example.com/terms')}
          >
            <Text style={styles.linkText}>Ler termos completos</Text>
            <Ionicons name="open-outline" size={16} color={commonStyles.primaryColor} />
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2025 TROIA</Text>
          <Text style={styles.footerText}>Todos os direitos reservados</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    ...commonStyles.header,
    paddingTop: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: commonStyles.textPrimary,
    marginTop: 10,
  },
  appVersion: {
    fontSize: 14,
    color: commonStyles.textSecondary,
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: commonStyles.textPrimary,
    marginBottom: 10,
  },
  text: {
    fontSize: 14,
    color: commonStyles.textSecondary,
    lineHeight: 20,
    marginBottom: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureText: {
    fontSize: 14,
    color: commonStyles.textSecondary,
    marginLeft: 10,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  linkText: {
    fontSize: 14,
    color: commonStyles.primaryColor,
    marginRight: 5,
  },
  footer: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 12,
    color: commonStyles.textLight,
    marginBottom: 5,
  },
});

