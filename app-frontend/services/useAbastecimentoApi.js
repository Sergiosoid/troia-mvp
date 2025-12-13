/**
 * Hook para API de Abastecimentos
 * Centraliza todas as chamadas relacionadas a abastecimentos
 */

import { useState } from 'react';
import { getToken } from '../utils/authStorage';

// Função interna para fetch com timeout (não exportada)
const API_URL = 'https://troia-mvp.onrender.com';

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

/**
 * Faz upload de imagem para análise OCR de abastecimento
 * @param {FormData} formData - FormData contendo a imagem
 * @returns {Promise<Object>} Dados extraídos (litros, valor_total, preco_por_litro, etc)
 */
export const processarOcrAbastecimento = async (formData) => {
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
      `${API_URL}/abastecimentos/ocr`,
      {
        method: 'POST',
        headers,
        body: formData
      },
      45000 // 45 segundos (OpenAI pode demorar)
    );

    if (!res || !res.success) {
      throw new Error(res.error || 'Erro ao processar imagem');
    }

    return res.dados || {};
  } catch (error) {
    console.error('[OCR Abastecimento] Erro:', error);
    
    if (error.message?.includes('timeout') || error.message?.includes('expirou')) {
      throw new Error('A análise está demorando mais que o esperado. Tente novamente ou insira os dados manualmente.');
    }
    
    if (error.message?.includes('502') || error.message?.includes('500')) {
      throw new Error('Servidor temporariamente indisponível. Tente novamente em alguns instantes.');
    }
    
    throw error;
  }
};

/**
 * Registra um novo abastecimento
 * @param {Object} dados - Dados do abastecimento
 * @param {string} imagemUri - URI da imagem (opcional)
 * @returns {Promise<Object>} Abastecimento criado
 */
export const registrarAbastecimento = async (dados, imagemUri = null) => {
  try {
    const formData = new FormData();
    
    // Adicionar campos do abastecimento
    if (dados.veiculo_id) formData.append('veiculo_id', String(dados.veiculo_id));
    if (dados.litros) formData.append('litros', String(dados.litros));
    if (dados.valor_total) formData.append('valor_total', String(dados.valor_total));
    if (dados.preco_por_litro) formData.append('preco_por_litro', String(dados.preco_por_litro));
    if (dados.tipo_combustivel) formData.append('tipo_combustivel', dados.tipo_combustivel);
    if (dados.posto) formData.append('posto', dados.posto);
    if (dados.km_antes) formData.append('km_antes', String(dados.km_antes));
    if (dados.km_depois) formData.append('km_depois', String(dados.km_depois));
    if (dados.data) formData.append('data', dados.data);

    // Adicionar imagem se fornecida
    if (imagemUri) {
      const filename = imagemUri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const fileType = match ? `image/${match[1]}` : 'image/jpeg';
      
      formData.append('imagem', {
        uri: imagemUri,
        name: filename,
        type: fileType,
      });
    }

    // Criar headers diretamente (sem Content-Type para FormData, com Authorization)
    const token = await getToken();
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    // Não definir Content-Type - o browser/React Native define automaticamente para FormData
    
    const res = await fetchWithTimeout(
      `${API_URL}/abastecimentos`,
      {
        method: 'POST',
        headers,
        body: formData
      },
      30000
    );

    if (!res || !res.success) {
      throw new Error(res.error || 'Erro ao registrar abastecimento');
    }

    return res.data || res;
  } catch (error) {
    console.error('[Abastecimento] Erro ao registrar:', error);
    throw error;
  }
};

/**
 * Lista abastecimentos de um veículo
 * @param {number} veiculoId - ID do veículo
 * @returns {Promise<Array>} Lista de abastecimentos
 */
export const listarAbastecimentos = async (veiculoId) => {
  try {
    // Criar headers diretamente
    const token = await getToken();
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const res = await fetchWithTimeout(
      `${API_URL}/abastecimentos/${veiculoId}`,
      {
        headers
      }
    );

    if (res && res.success && Array.isArray(res.data)) {
      return res.data;
    }
    
    if (Array.isArray(res)) {
      return res;
    }

    return [];
  } catch (error) {
    console.error('[Abastecimento] Erro ao listar:', error);
    return [];
  }
};

/**
 * Busca estatísticas de abastecimentos de um veículo
 * @param {number} veiculoId - ID do veículo
 * @returns {Promise<Object>} Estatísticas agregadas
 */
export const buscarEstatisticas = async (veiculoId) => {
  try {
    // Criar headers diretamente
    const token = await getToken();
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const res = await fetchWithTimeout(
      `${API_URL}/abastecimentos/estatisticas/${veiculoId}`,
      {
        headers
      }
    );

    if (res && res.success && res.data) {
      return res.data;
    }

    return null;
  } catch (error) {
    console.error('[Abastecimento] Erro ao buscar estatísticas:', error);
    return null;
  }
};

/**
 * Hook customizado para gerenciar estado de abastecimentos
 */
export const useAbastecimentoApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const processarOcr = async (formData) => {
    setLoading(true);
    setError(null);
    try {
      const dados = await processarOcrAbastecimento(formData);
      return dados;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const registrar = async (dados, imagemUri) => {
    setLoading(true);
    setError(null);
    try {
      const resultado = await registrarAbastecimento(dados, imagemUri);
      return resultado;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const listar = async (veiculoId) => {
    setLoading(true);
    setError(null);
    try {
      const lista = await listarAbastecimentos(veiculoId);
      return lista;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const estatisticas = async (veiculoId) => {
    setLoading(true);
    setError(null);
    try {
      const stats = await buscarEstatisticas(veiculoId);
      return stats;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    processarOcr,
    registrar,
    listar,
    estatisticas
  };
};

export default useAbastecimentoApi;

