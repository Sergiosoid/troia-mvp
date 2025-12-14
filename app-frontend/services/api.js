import { getToken } from '../utils/authStorage';

/**
 * 🔥 FIX ABSOLUTO DO API_URL
 * Remove qualquer tentativa de usar variáveis do Expo, local ou auto-detecção.
 * Sempre utilizar apenas a URL pública do backend em produção.
 */

export const API_URL = 'https://troia-mvp.onrender.com';

// Logs úteis para debug (apenas desenvolvimento)
console.log("[TROIA] API_URL carregada:", API_URL);

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
    
    // Backend retorna: { usuario: { id, nome, email, role }, token }
    if (res && res.usuario && res.token) {
      return {
        userId: res.usuario.id,
        token: res.token,
        nome: res.usuario.nome || '',
        email: res.usuario.email || '',
        role: res.usuario.role || 'cliente',
      };
    }
    
    throw new Error('Resposta inválida do servidor');
  } catch (error) {
    // Tratar erros HTTP 502, 500, etc
    if (error.message.includes('502') || error.message.includes('500')) {
      throw new Error('Servidor temporariamente indisponível. Tente novamente em alguns instantes.');
    }
    if (error.message.includes('401') || error.message.includes('Credenciais inválidas')) {
      throw new Error('Email ou senha incorretos');
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
    
    // Backend retorna apenas { success: true } no registro
    // Após registro bem-sucedido, fazer login automático
    if (res && res.success) {
      // Fazer login automático após registro
      try {
        const loginRes = await login({
          email: data.email?.trim(),
          senha: data.senha,
        });
        return loginRes;
      } catch (loginError) {
        // Se login automático falhar, retornar sucesso mas sem token
        // Usuário precisará fazer login manual
        return {
          success: true,
          message: 'Conta criada com sucesso. Faça login para continuar.',
        };
      }
    }
    
    throw new Error('Resposta inválida do servidor');
  } catch (error) {
    // Tratar erros HTTP 502, 500, etc
    if (error.message.includes('502') || error.message.includes('500')) {
      throw new Error('Servidor temporariamente indisponível. Tente novamente em alguns instantes.');
    }
    if (error.message.includes('já cadastrado') || error.message.includes('Email já') || error.message.includes('409')) {
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
    // Usar POST /proprietarios (não requer role específica, apenas authRequired)
    const res = await fetchWithTimeout(`${API_URL}/proprietarios`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ 
        nome: data.nome?.trim(),
        cpf: data.cpf?.trim() || null,
        rg: data.rg?.trim() || null,
        cnh: data.cnh?.trim() || null,
        telefone: data.telefone?.trim() || null
      }),
    });
    
    // Backend retorna { id, nome, cpf, rg, cnh, telefone, usuario_id }
    if (res && res.id) {
      return res;
    }
    
    throw new Error('Resposta inválida do servidor');
  } catch (error) {
    if (error.message.includes('502') || error.message.includes('500')) {
      throw new Error('Servidor temporariamente indisponível. Tente novamente em alguns instantes.');
    }
    if (error.message.includes('403') || error.message.includes('Acesso negado')) {
      throw new Error('Você não tem permissão para cadastrar proprietários');
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
    // Usar POST /veiculos (não requer role específica, apenas authRequired)
    const res = await fetchWithTimeout(`${API_URL}/veiculos`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ 
        placa: data.placa?.trim().toUpperCase(),
        renavam: data.renavam?.trim() || null,
        marca: data.marca?.trim() || null,
        modelo: data.modelo?.trim() || null,
        ano: data.ano?.trim() || null,
        tipo_veiculo: data.tipo_veiculo || null,
        proprietario_id: data.proprietario_id || null
      }),
    });
    
    // Backend retorna { success: true, id, mensagem } ou { id, ... }
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

    // Criar headers diretamente (sem Content-Type para FormData, com Authorization)
    const token = await getToken();
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    // Não definir Content-Type - o browser/React Native define automaticamente para FormData

    // Fazer requisição com timeout maior (análise de imagem pode demorar)
    const res = await fetchWithTimeout(
      `${API_URL}/analyze-note`, 
      {
        method: 'POST',
        headers,
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

/**
 * Lista o histórico de KM de um veículo
 * @param {number} veiculoId - ID do veículo
 * @returns {Promise<Array>} Array com histórico de KM
 */
export const listarHistoricoKm = async (veiculoId) => {
  try {
    const token = await getToken();
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetchWithTimeout(
      `${API_URL}/veiculos/${veiculoId}/km-historico`,
      {
        method: 'GET',
        headers,
      },
      30000
    );

    return Array.isArray(res) ? res : [];
  } catch (error) {
    console.error('[listarHistoricoKm] Erro:', error);
    throw error;
  }
};

/**
 * Compartilhar veículo gerando link público
 * @param {number} veiculoId - ID do veículo
 * @param {string} expira_em - Data de expiração opcional (YYYY-MM-DD)
 * @returns {Promise<Object>} Objeto com { success, token, link, expira_em }
 */
export const compartilharVeiculo = async (veiculoId, expira_em = null) => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Usuário não autenticado');
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    const body = {};
    if (expira_em) {
      body.expira_em = expira_em;
    }

    const res = await fetchWithTimeout(
      `${API_URL}/veiculos/${veiculoId}/compartilhar`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      },
      30000
    );

    if (res && res.success) {
      return {
        success: true,
        token: res.token,
        link: res.link,
        expira_em: res.expira_em,
      };
    }

    throw new Error(res.error || 'Erro ao criar link de compartilhamento');
  } catch (error) {
    console.error('[compartilharVeiculo] Erro:', error);
    throw error;
  }
};

/**
 * Buscar dados públicos de veículo compartilhado
 * @param {string} token - Token de compartilhamento
 * @returns {Promise<Object>} Dados públicos do veículo
 */
export const buscarVeiculoCompartilhado = async (token) => {
  try {
    const res = await fetchWithTimeout(
      `${API_URL}/compartilhamento/${token}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
      30000
    );

    return res;
  } catch (error) {
    console.error('[buscarVeiculoCompartilhado] Erro:', error);
    throw error;
  }
};

/**
 * Aceita um veículo compartilhado e transfere para o usuário autenticado
 * @param {string} token - Token de compartilhamento
 * @returns {Promise<Object>} Dados do veículo aceito
 */
export const aceitarVeiculoCompartilhado = async (token) => {
  try {
    const headers = await getHeaders();
    const res = await fetchWithTimeout(`${API_URL}/compartilhamento/${token}/aceitar`, {
      method: 'POST',
      headers,
    });
    return res;
  } catch (error) {
    console.error('[aceitarVeiculoCompartilhado] Erro:', error);
    throw error;
  }
};

/**
 * Transferir veículo para outro usuário
 * @param {number} veiculoId - ID do veículo
 * @param {number} novoUsuarioId - ID do novo proprietário
 * @param {number} kmAtual - KM atual do veículo (opcional)
 * @returns {Promise<Object>} Resultado da transferência
 */
export const transferirVeiculo = async (veiculoId, novoUsuarioId, kmAtual = null) => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Usuário não autenticado');
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    const body = {
      novo_usuario_id: novoUsuarioId,
    };

    if (kmAtual !== null && kmAtual !== undefined) {
      body.km_atual = kmAtual;
    }

    const res = await fetchWithTimeout(
      `${API_URL}/veiculos/${veiculoId}/transferir`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      },
      30000
    );

    if (res && res.success) {
      return res;
    }

    throw new Error(res.error || 'Erro ao transferir veículo');
  } catch (error) {
    console.error('[transferirVeiculo] Erro:', error);
    throw error;
  }
};

/**
 * Buscar usuários para transferência (lista de usuários do sistema)
 * @returns {Promise<Array>} Lista de usuários
 */
export const listarUsuarios = async () => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Usuário não autenticado');
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    const res = await fetchWithTimeout(
      `${API_URL}/usuarios`,
      {
        method: 'GET',
        headers,
      },
      30000
    );

    return Array.isArray(res) ? res : [];
  } catch (error) {
    console.error('[listarUsuarios] Erro:', error);
    throw error;
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

export const atualizarVeiculo = async (veiculoId, data) => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Usuário não autenticado. Faça login novamente.');
    }
    
    const headers = await getHeaders();
    const res = await fetchWithTimeout(`${API_URL}/veiculos/${veiculoId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        placa: data.placa?.trim().toUpperCase() || null,
        renavam: data.renavam?.trim() || null,
        marca: data.marca?.trim() || null,
        modelo: data.modelo?.trim(),
        ano: data.ano?.trim(),
        tipo_veiculo: data.tipo_veiculo || null,
      }),
    });
    
    if (res && res.success) {
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

export const listarHistoricoProprietarios = async (veiculoId) => {
  try {
    const token = await getToken();
    if (!token) {
      return [];
    }
    
    const headers = await getHeaders();
    const res = await fetchWithTimeout(`${API_URL}/veiculos/${veiculoId}/proprietarios-historico`, {
      headers,
    });
    
    if (Array.isArray(res)) {
      return res;
    }
    
    return [];
  } catch (error) {
    console.error('Erro ao listar histórico de proprietários:', error);
    return [];
  }
};

export const adicionarHistoricoProprietario = async (veiculoId, data) => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Usuário não autenticado. Faça login novamente.');
    }
    
    const headers = await getHeaders();
    const res = await fetchWithTimeout(`${API_URL}/veiculos/${veiculoId}/proprietarios-historico`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        nome: data.nome?.trim(),
        data_aquisicao: data.data_aquisicao,
        data_venda: data.data_venda || null,
        km_aquisicao: data.km_aquisicao || null,
        km_venda: data.km_venda || null,
      }),
    });
    
    if (res && res.success) {
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

export const buscarGlobal = async (termo = '', filtros = {}) => {
  try {
    const token = await getToken();
    if (!token) {
      return { veiculos: [], manutencoes: [], abastecimentos: [] };
    }

    const headers = await getHeaders();
    
    // Construir query string
    const params = new URLSearchParams();
    if (termo) params.append('termo', termo);
    if (filtros.tipo) params.append('tipo', filtros.tipo);
    if (filtros.dataInicial) params.append('dataInicial', filtros.dataInicial);
    if (filtros.dataFinal) params.append('dataFinal', filtros.dataFinal);
    if (filtros.valorMin) params.append('valorMin', filtros.valorMin);
    if (filtros.valorMax) params.append('valorMax', filtros.valorMax);
    if (filtros.tipo_veiculo) params.append('tipo_veiculo', filtros.tipo_veiculo);
    if (filtros.tipo_manutencao) params.append('tipo_manutencao', filtros.tipo_manutencao);
    if (filtros.kmMin) params.append('kmMin', filtros.kmMin);
    if (filtros.kmMax) params.append('kmMax', filtros.kmMax);
    if (filtros.pagina) params.append('pagina', filtros.pagina);
    if (filtros.limite) params.append('limite', filtros.limite);

    const res = await fetchWithTimeout(`${API_URL}/buscar?${params.toString()}`, {
      headers,
    });

    if (res && typeof res === 'object') {
      return {
        veiculos: Array.isArray(res.veiculos) ? res.veiculos : [],
        manutencoes: Array.isArray(res.manutencoes) ? res.manutencoes : [],
        abastecimentos: Array.isArray(res.abastecimentos) ? res.abastecimentos : [],
      };
    }

    return { veiculos: [], manutencoes: [], abastecimentos: [] };
  } catch (error) {
    console.error('Erro ao buscar:', error);
    return { veiculos: [], manutencoes: [], abastecimentos: [] };
  }
};

export const buscarEstatisticas = async (veiculoId) => {
  try {
    const token = await getToken();
    if (!token) {
      return null;
    }
    
    const headers = await getHeaders();
    const res = await fetchWithTimeout(`${API_URL}/estatisticas/${veiculoId}`, {
      headers,
    });
    
    if (res && typeof res === 'object') {
      return res;
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return null;
  }
};

export const buscarAlertas = async () => {
  try {
    const token = await getToken();
    if (!token) {
      return [];
    }
    
    const headers = await getHeaders();
    const res = await fetchWithTimeout(`${API_URL}/alertas`, {
      headers,
    });
    
    if (Array.isArray(res)) {
      return res;
    }
    
    return [];
  } catch (error) {
    console.error('Erro ao buscar alertas:', error);
    return [];
  }
};

export const buscarResumoDashboard = async () => {
  try {
    const token = await getToken();
    if (!token) {
      return null;
    }
    
    const headers = await getHeaders();
    const res = await fetchWithTimeout(`${API_URL}/dashboard/resumo`, {
      headers,
    });
    
    if (res && typeof res === 'object') {
      return res;
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao buscar resumo do dashboard:', error);
    return null;
  }
};

export const removerHistoricoProprietario = async (veiculoId, historicoId) => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Usuário não autenticado. Faça login novamente.');
    }
    
    const headers = await getHeaders();
    const res = await fetchWithTimeout(`${API_URL}/veiculos/${veiculoId}/proprietarios-historico/${historicoId}`, {
      method: 'DELETE',
      headers,
    });
    
    if (res && res.success) {
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

/**
 * Processa OCR de KM a partir de uma imagem do painel
 * @param {FormData} formData - FormData contendo a imagem do painel
 * @returns {Promise<Object>} Objeto com { success: boolean, km: number }
 */
export const processarOcrKm = async (formData) => {
  try {
    if (!formData) {
      throw new Error('Imagem não fornecida');
    }

    // Criar headers diretamente (sem Content-Type para FormData, com Authorization)
    const token = await getToken();
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    // Não definir Content-Type - o browser/React Native define automaticamente para FormData

    const res = await fetchWithTimeout(
      `${API_URL}/veiculos/ocr-km`,
      {
        method: 'POST',
        headers,
        body: formData,
      },
      45000 // 45 segundos (OpenAI pode demorar)
    );

    if (res && res.success && res.km) {
      return { success: true, km: res.km };
    }

    return { success: false, error: res.error || 'Não foi possível detectar o KM na imagem' };
  } catch (error) {
    console.error('[OCR KM] Erro:', error);
    
    if (error.message?.includes('timeout') || error.message?.includes('expirou')) {
      throw new Error('A análise está demorando mais que o esperado. Tente novamente ou insira o KM manualmente.');
    }
    
    if (error.message?.includes('502') || error.message?.includes('500')) {
      throw new Error('Servidor temporariamente indisponível. Tente novamente em alguns instantes.');
    }
    
    if (error.message?.includes('401') || error.message?.includes('autenticado')) {
      throw new Error('Sessão expirada. Faça login novamente.');
    }
    
    throw new Error(error.message || 'Não foi possível extrair o KM da imagem automaticamente.');
  }
};

/**
 * Atualiza o KM de um veículo
 * @param {number} veiculoId - ID do veículo
 * @param {number} km - Novo valor de KM
 * @returns {Promise<Object>} Objeto com { success: boolean, mensagem: string }
 */
export const atualizarKm = async (veiculoId, km) => {
  try {
    if (!veiculoId) {
      throw new Error('ID do veículo não fornecido');
    }

    const kmNum = parseInt(km.toString().replace(/\D/g, ''), 10);
    if (!kmNum || kmNum <= 0) {
      throw new Error('KM inválido');
    }

    // Criar headers diretamente
    const token = await getToken();
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetchWithTimeout(
      `${API_URL}/veiculos/${veiculoId}/km`,
      {
        method: 'PUT',
        headers,
        body: JSON.stringify({ km_atual: kmNum }),
      },
      30000
    );

    if (res && res.success) {
      return { success: true, mensagem: 'KM atualizado com sucesso!' };
    }

    throw new Error(res.error || 'Erro ao atualizar KM');
  } catch (error) {
    console.error('[Atualizar KM] Erro:', error);
    
    if (error.message?.includes('502') || error.message?.includes('500')) {
      throw new Error('Servidor temporariamente indisponível. Tente novamente em alguns instantes.');
    }
    
    if (error.message?.includes('401') || error.message?.includes('autenticado')) {
      throw new Error('Sessão expirada. Faça login novamente.');
    }
    
    throw error;
  }
};