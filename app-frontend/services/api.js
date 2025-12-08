import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { getToken, getUserId } from '../utils/authStorage';

// URL de produção do backend no Render.com
// ATUALIZE ESTA URL COM A URL DO SEU BACKEND NO RENDER
const PRODUCTION_URL = 'https://troia-backend.onrender.com';

// URL local para desenvolvimento (ajuste o IP conforme necessário)
const LOCAL_URL = 'http://192.168.1.100:3000'; // Altere para o IP da sua máquina

// Detectar se está em desenvolvimento ou produção
const isDevelopment = __DEV__ || process.env.NODE_ENV === 'development';

export const API_URL = 
  process.env.EXPO_PUBLIC_API_URL ||
  Constants.expoConfig?.extra?.apiUrl ||
  Constants.expoConfig?.extra?.expoPublicApiUrl ||
  (isDevelopment ? LOCAL_URL : PRODUCTION_URL);

// Wrapper global para fetch com timeout
const fetchWithTimeout = async (url, options = {}, timeout = 15000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Verificar se a resposta é ok
    if (!response.ok) {
      let errorMessage = `Erro HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (e) {
        // Se não conseguir parsear JSON, usar mensagem padrão
      }
      throw new Error(errorMessage);
    }

    // Sempre retornar JSON parseado
    const json = await response.json();
    return json;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error(`Requisição expirou após ${timeout}ms. Verifique sua conexão.`);
    }
    
    if (error.message) {
      throw error;
    }
    
    throw new Error(`Erro na requisição: ${error.message || 'Erro desconhecido'}`);
  }
};

// Funções getUserId e getToken agora vêm de authStorage.js
// Mantidas aqui apenas para compatibilidade, mas usando as funções centralizadas

// Função auxiliar para criar headers com JWT
const getHeaders = async (includeAuth = true, contentType = 'application/json') => {
  const headers = {};
  
  if (contentType) {
    headers['Content-Type'] = contentType;
  }
  
  if (includeAuth) {
    const token = await getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  return headers;
};

export const login = async (data) => {
  try {
    const res = await fetchWithTimeout(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: data.email?.trim(),
        senha: data.senha,
      }),
    });
    
    // Validar resposta
    if (res && res.userId) {
      return res;
    }
    
    throw new Error('Resposta inválida do servidor');
  } catch (error) {
    // Tratar erros HTTP 502, 500, etc
    if (error.message.includes('502') || error.message.includes('500')) {
      throw new Error('Servidor temporariamente indisponível. Tente novamente em alguns instantes.');
    }
    throw error;
  }
};

export const register = async (data) => {
  try {
    const res = await fetchWithTimeout(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: data.nome?.trim(),
        email: data.email?.trim(),
        senha: data.senha,
      }),
    });
    
    // Validar resposta
    if (res && res.userId) {
      return res;
    }
    
    throw new Error('Resposta inválida do servidor');
  } catch (error) {
    // Tratar erros HTTP 502, 500, etc
    if (error.message.includes('502') || error.message.includes('500')) {
      throw new Error('Servidor temporariamente indisponível. Tente novamente em alguns instantes.');
    }
    if (error.message.includes('já cadastrado') || error.message.includes('Email já')) {
      throw new Error('Este email já está cadastrado');
    }
    throw error;
  }
};

export const cadastrarProprietario = async (data) => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Usuário não autenticado. Faça login novamente.');
    }
    
    const headers = await getHeaders();
    const res = await fetchWithTimeout(`${API_URL}/proprietarios/cadastrar`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ 
        nome: data.nome?.trim(),
        cpf: data.cpf?.trim(),
        rg: data.rg?.trim(),
        cnh: data.cnh?.trim()
      }),
    });
    
    // Backend retorna { id, nome, cpf, rg, cnh, usuario_id }
    if (res && res.id) {
      return res;
    }
    
    throw new Error('Resposta inválida do servidor');
  } catch (error) {
    if (error.message.includes('502') || error.message.includes('500')) {
      throw new Error('Servidor temporariamente indisponível. Tente novamente em alguns instantes.');
    }
    throw error;
  }
};

export const listarProprietarios = async () => {
  try {
    const token = await getToken();
    if (!token) {
      return [];
    }
    
    const headers = await getHeaders();
    const res = await fetchWithTimeout(`${API_URL}/proprietarios`, {
      headers,
    });
    
    // Backend retorna array direto ou objeto com success/data
    if (Array.isArray(res)) {
      return res;
    }
    if (res && res.success && Array.isArray(res.data)) {
      return res.data;
    }
    if (res && Array.isArray(res)) {
      return res;
    }
    
    return [];
  } catch (error) {
    if (error.message.includes('502') || error.message.includes('500')) {
      throw new Error('Servidor temporariamente indisponível. Tente novamente em alguns instantes.');
    }
    console.error('Erro ao listar proprietários:', error);
    return [];
  }
};

export const cadastrarVeiculo = async (data) => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Usuário não autenticado. Faça login novamente.');
    }
    
    const headers = await getHeaders();
    const res = await fetchWithTimeout(`${API_URL}/veiculos/cadastrar`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ 
        placa: data.placa?.trim().toUpperCase(),
        renavam: data.renavam?.trim(),
        marca: data.marca?.trim(),
        modelo: data.modelo?.trim(),
        ano: data.ano?.trim(),
        proprietario_id: data.proprietario_id || null
      }),
    });
    
    // Backend retorna { id, placa, renavam, ... }
    if (res && res.id) {
      return res;
    }
    
    throw new Error('Resposta inválida do servidor');
  } catch (error) {
    if (error.message.includes('502') || error.message.includes('500')) {
      throw new Error('Servidor temporariamente indisponível. Tente novamente em alguns instantes.');
    }
    throw error;
  }
};

export const listarVeiculosPorProprietario = async (id) => {
  try {
    const token = await getToken();
    if (!token) {
      return [];
    }
    
    const headers = await getHeaders();
    const res = await fetchWithTimeout(`${API_URL}/veiculos/proprietario/${id}`, {
      headers,
    });
    
    // Backend retorna array direto
    if (Array.isArray(res)) {
      return res;
    }
    if (res && res.success && Array.isArray(res.data)) {
      return res.data;
    }
    
    return [];
  } catch (error) {
    if (error.message.includes('502') || error.message.includes('500')) {
      throw new Error('Servidor temporariamente indisponível. Tente novamente em alguns instantes.');
    }
    console.error('Erro ao listar veículos:', error);
    return [];
  }
};

export const cadastrarManutencao = async (formData) => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Usuário não autenticado. Faça login novamente.');
    }
    
    // Criar headers com JWT (sem Content-Type para FormData)
    const headers = await getHeaders(true, null);
    
    const res = await fetchWithTimeout(`${API_URL}/manutencoes/cadastrar`, {
      method: 'POST',
      headers,
      body: formData,
    });
    
    // Backend retorna { id, ... } ou { success: true, id: ... }
    if (res && (res.id || (res.success && res.id))) {
      return res;
    }
    
    throw new Error('Resposta inválida do servidor');
  } catch (error) {
    if (error.message.includes('502') || error.message.includes('500')) {
      throw new Error('Servidor temporariamente indisponível. Tente novamente em alguns instantes.');
    }
    throw error;
  }
};

export const listarManutencoesPorVeiculo = async (id) => {
  try {
    const token = await getToken();
    if (!token) {
      return [];
    }
    
    const headers = await getHeaders();
    const res = await fetchWithTimeout(`${API_URL}/manutencoes/veiculo/${id}`, {
      headers,
    });
    
    // Backend retorna array direto
    if (Array.isArray(res)) {
      return res;
    }
    if (res && res.success && Array.isArray(res.data)) {
      return res.data;
    }
    
    return [];
  } catch (error) {
    if (error.message.includes('502') || error.message.includes('500')) {
      throw new Error('Servidor temporariamente indisponível. Tente novamente em alguns instantes.');
    }
    console.error('Erro ao listar manutenções:', error);
    return [];
  }
};

export const buscarManutencoes = async (termo) => {
  try {
    const token = await getToken();
    if (!token) {
      return [];
    }
    
    const headers = await getHeaders();
    const res = await fetchWithTimeout(`${API_URL}/manutencoes/buscar?termo=${encodeURIComponent(termo)}`, {
      headers,
    });
    
    // Backend retorna { success: true, data: [...] }
    if (res && res.success && Array.isArray(res.data)) {
      return res.data;
    }
    if (Array.isArray(res)) {
      return res;
    }
    
    return [];
  } catch (error) {
    if (error.message.includes('502') || error.message.includes('500')) {
      throw new Error('Servidor temporariamente indisponível. Tente novamente em alguns instantes.');
    }
    console.error('Erro ao buscar manutenções:', error);
    return [];
  }
};

export const excluirManutencao = async (manutencaoId) => {
  try {
    const headers = await getHeaders();
    const res = await fetchWithTimeout(`${API_URL}/manutencoes/${manutencaoId}`, {
      method: 'DELETE',
      headers,
    });
    
    if (res && res.success) {
      return true;
    }
    
    throw new Error(res.error || res.message || 'Erro ao excluir manutenção');
  } catch (error) {
    if (error.message.includes('403') || error.message.includes('permissão')) {
      throw new Error('Você não tem permissão para excluir esta manutenção');
    }
    if (error.message.includes('404') || error.message.includes('não encontrada')) {
      throw new Error('Manutenção não encontrada');
    }
    if (error.message.includes('502') || error.message.includes('500')) {
      throw new Error('Servidor temporariamente indisponível. Tente novamente em alguns instantes.');
    }
    throw error;
  }
};

export const buscarVeiculoPorPlaca = async (placa) => {
  try {
    const headers = await getHeaders();
    const res = await fetchWithTimeout(`${API_URL}/veiculos/buscar-placa/${encodeURIComponent(placa)}`, {
      headers,
    });
    return res;
  } catch (error) {
    if (error.message.includes('404') || error.message.includes('não encontrado')) {
      throw new Error('Veículo não encontrado');
    }
    throw error;
  }
};

/**
 * Faz upload de imagem para análise OCR com OpenAI Vision API
 * 
 * @param {FormData} formData - FormData contendo a imagem
 * @returns {Promise<Object>} Dados extraídos da nota fiscal
 * @throws {Error} Erro com mensagem amigável
 */
export const uploadNotaParaAnalise = async (formData) => {
  try {
    // Validar FormData
    if (!formData) {
      throw new Error('Imagem não fornecida');
    }

    // Fazer requisição com timeout maior (análise de imagem pode demorar)
    const res = await fetchWithTimeout(
      `${API_URL}/analyze-note`, 
      {
        method: 'POST',
        body: formData
      }, 
      45000 // 45 segundos (OpenAI pode demorar)
    );
    
    // Verificar se resposta é válida
    if (!res || typeof res !== 'object') {
      throw new Error('Resposta inválida do servidor. Tente novamente.');
    }

    // Verificar se backend retornou erro
    if (res.success === false) {
      const errorMessage = res.message || res.error || 'Erro ao processar imagem';
      throw new Error(errorMessage);
    }

    // Validar se tem pelo menos algum dado extraído
    const temDados = res.placa || res.valor || res.data || res.descricao || res.tipo || res.modelo;
    
    if (!temDados) {
      // Não é erro crítico, apenas aviso que nenhum dado foi encontrado
      // Debug: Descomentar apenas para desenvolvimento
      // console.warn('[OCR] Nenhum dado extraído da imagem');
      return {
        placa: null,
        data: null,
        valor: null,
        descricao: null,
        tipo: null,
        modelo: null,
        tipo_manutencao: null,
        area_manutencao: null,
      };
    }

    // Normalizar e retornar dados
    return {
      placa: res.placa || null,
      data: res.data || null,
      valor: res.valor || null,
      descricao: res.descricao || null,
      tipo: res.tipo || null,
      modelo: res.modelo || null,
      // Mapear tipo para tipo_manutencao (compatibilidade com novo formato)
      tipo_manutencao: res.tipo_manutencao || (res.tipo ? mapearTipoParaManutencao(res.tipo) : null),
      area_manutencao: res.area_manutencao || null,
    };
  } catch (error) {
    console.error('[OCR] Erro ao analisar nota:', error);
    
    // Tratar erros específicos
    if (error.message?.includes('timeout') || error.message?.includes('expirou')) {
      throw new Error('A análise está demorando mais que o esperado. Tente novamente ou insira os dados manualmente.');
    }
    
    if (error.message?.includes('502') || error.message?.includes('500') || error.message?.includes('indisponível')) {
      throw new Error('Servidor temporariamente indisponível. Tente novamente em alguns instantes.');
    }
    
    if (error.message?.includes('401') || error.message?.includes('autenticado')) {
      throw new Error('Sessão expirada. Faça login novamente.');
    }
    
    if (error.message?.includes('400') || error.message?.includes('Nenhum arquivo')) {
      throw new Error('Imagem não foi enviada corretamente. Tente novamente.');
    }
    
    // Retornar mensagem de erro amigável
    const mensagemAmigavel = error.message || 'Não foi possível analisar a nota fiscal. Você pode inserir os dados manualmente.';
    throw new Error(mensagemAmigavel);
  }
};

/**
 * Mapeia tipo antigo para novo formato tipo_manutencao
 */
const mapearTipoParaManutencao = (tipo) => {
  if (!tipo) return null;
  
  const tipoLower = tipo.toLowerCase();
  
  if (tipoLower.includes('preventiva') || tipoLower.includes('preventivo')) {
    return 'preventiva';
  }
  
  if (tipoLower.includes('corretiva') || tipoLower.includes('corretivo')) {
    return 'corretiva';
  }
  
  // Se não conseguir mapear, retornar null (usuário escolherá)
  return null;
};

export const listarVeiculosComTotais = async () => {
  try {
    const token = await getToken();
    if (!token) {
      return [];
    }
    
    const headers = await getHeaders();
    const res = await fetchWithTimeout(`${API_URL}/veiculos/totais`, {
      headers,
    });
    
    // Backend retorna array direto
    if (Array.isArray(res)) {
      return res;
    }
    if (res && res.success && Array.isArray(res.data)) {
      return res.data;
    }
    
    return [];
  } catch (error) {
    if (error.message.includes('502') || error.message.includes('500')) {
      throw new Error('Servidor temporariamente indisponível. Tente novamente em alguns instantes.');
    }
    console.error('Erro ao listar veículos com totais:', error);
    return [];
  }
};

export const calcularTotalGeral = async () => {
  try {
    const veiculos = await listarVeiculosComTotais();
    if (!Array.isArray(veiculos)) {
      return 0;
    }
    const total = veiculos.reduce((sum, v) => sum + (parseFloat(v.totalGasto) || 0), 0);
    return total;
  } catch (error) {
    console.error('Erro ao calcular total geral:', error);
    return 0;
  }
};

export const listarHistoricoVeiculo = async (veiculoId) => {
  try {
    const token = await getToken();
    if (!token) {
      return [];
    }
    
    const headers = await getHeaders();
    const res = await fetchWithTimeout(`${API_URL}/veiculos/${veiculoId}/historico`, {
      headers,
    });
    
    // Backend retorna array direto
    if (Array.isArray(res)) {
      return res;
    }
    if (res && res.success && Array.isArray(res.data)) {
      return res.data;
    }
    
    return [];
  } catch (error) {
    if (error.message.includes('502') || error.message.includes('500')) {
      throw new Error('Servidor temporariamente indisponível. Tente novamente em alguns instantes.');
    }
    console.error('Erro ao listar histórico:', error);
    return [];
  }
};

export const buscarVeiculoPorId = async (veiculoId) => {
  try {
    const headers = await getHeaders();
    const res = await fetchWithTimeout(`${API_URL}/veiculos/${veiculoId}`, {
      headers,
    });
    
    // Validar se veio correto
    if (res && typeof res === 'object') {
      // Se tem propriedades de veículo, retornar o objeto
      if (res.id || res.placa) {
        return res;
      }
      // Se tem success: false ou error, tratar
      if (res.success === false || res.error) {
        if (res.error?.includes('404') || res.error?.includes('não encontrado')) {
          return null;
        }
        throw new Error(res.error || 'Erro ao buscar veículo');
      }
    }
    
    return res;
  } catch (error) {
    // Se for erro 404, retornar null
    if (error.message?.includes('404') || error.message?.includes('não encontrado')) {
      return null;
    }
    // Outros erros, lançar exception clara
    throw new Error(error.message || 'Erro ao buscar veículo. Verifique sua conexão.');
  }
};