/**
 * Serviço de OCR Local para documentos de veículos
 * 
 * ⚠️ STATUS: PONTO DE EXTENSÃO FUTURA
 * 
 * Este arquivo contém a estrutura para processamento de OCR local,
 * mas atualmente não está implementado (retorna string vazia).
 * 
 * DECISÃO ARQUITETURAL:
 * - Estrutura mantida para facilitar implementação futura
 * - OCR atual é feito via backend (OpenAI GPT-4o Vision API)
 * - Frontend não processa OCR localmente por enquanto
 * 
 * PARA IMPLEMENTAR NO FUTURO:
 * - Usar ML Kit Text Recognition (React Native)
 * - Ou Tesseract.js (mais pesado, mas funciona)
 * - Ou expo-ml-kit (se disponível)
 * 
 * NOTA: Esta implementação placeholder não gera expectativas falsas
 * na UX - o OCR local foi removido da interface do usuário.
 */

import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Processa imagem do CRLV e extrai dados do veículo
 * @param {string} imageUri - URI da imagem
 * @returns {Promise<Object>} Dados extraídos (placa, renavam, chassi, ano, marca, modelo)
 */
export const processarOcrDocumentoLocal = async (imageUri) => {
  try {
    // 1. Processar imagem: redimensionar e melhorar contraste
    const processedImage = await ImageManipulator.manipulateAsync(
      imageUri,
      [
        { resize: { width: 2000 } }, // Redimensionar para melhor performance
        { rotate: 0 }, // Pode adicionar detecção de rotação futuramente
      ],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );

    // 2. Extrair texto da imagem
    // NOTA: Esta é uma implementação placeholder
    // Para produção, use uma biblioteca de OCR real como:
    // - react-native-text-recognition (ML Kit)
    // - tesseract.js (mais pesado, mas funciona)
    // - expo-ml-kit (se disponível)
    
    const textoExtraido = await extrairTextoDaImagem(processedImage.uri);
    
    // 3. Parsear dados do texto extraído
    const dadosExtraidos = parsearDadosDocumento(textoExtraido);
    
    return {
      success: true,
      dados: dadosExtraidos,
      texto_bruto: textoExtraido, // Para debug
      origem: 'ocr_local'
    };
  } catch (error) {
    console.error('[OCR Local] Erro ao processar documento:', error);
    return {
      success: false,
      error: error.message || 'Erro ao processar OCR local',
      dados: {}
    };
  }
};

/**
 * Extrai texto da imagem
 * 
 * ⚠️ IMPLEMENTAÇÃO FUTURA
 * 
 * Esta função atualmente retorna string vazia.
 * Para implementar:
 * 1. Instalar biblioteca de OCR (ML Kit, Tesseract, etc)
 * 2. Processar imagem e extrair texto
 * 3. Retornar texto extraído
 * 
 * Exemplo com ML Kit:
 * ```javascript
 * const result = await TextRecognition.recognize(imageUri);
 * return result.text;
 * ```
 */
const extrairTextoDaImagem = async (imageUri) => {
  // IMPLEMENTAÇÃO FUTURA: Processar OCR localmente
  // Por enquanto, retorna string vazia (não usado na UX atual)
  return '';
};

/**
 * Parseia dados do documento a partir do texto extraído
 * Busca padrões comuns em CRLV brasileiro
 */
const parsearDadosDocumento = (texto) => {
  const dados = {
    placa: null,
    renavam: null,
    chassi: null,
    ano: null,
    marca: null,
    modelo: null
  };

  if (!texto || texto.trim() === '') {
    return dados;
  }

  // Normalizar texto: remover acentos e converter para maiúsculas
  const textoNormalizado = texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();

  // Extrair PLACA (formato ABC1234 ou ABC1D23)
  const placaRegex = /[A-Z]{3}[0-9][A-Z0-9][0-9]{2}/g;
  const placaMatch = textoNormalizado.match(placaRegex);
  if (placaMatch && placaMatch.length > 0) {
    dados.placa = placaMatch[0];
  }

  // Extrair RENAVAM (11 dígitos)
  const renavamRegex = /\b\d{11}\b/g;
  const renavamMatch = textoNormalizado.match(renavamRegex);
  if (renavamMatch && renavamMatch.length > 0) {
    dados.renavam = renavamMatch[0];
  }

  // Extrair CHASSI (17 caracteres alfanuméricos)
  const chassiRegex = /[A-HJ-NPR-Z0-9]{17}/g;
  const chassiMatch = textoNormalizado.match(chassiRegex);
  if (chassiMatch && chassiMatch.length > 0) {
    dados.chassi = chassiMatch[0];
  }

  // Extrair ANO (4 dígitos entre 1950 e ano atual + 1)
  const anoAtual = new Date().getFullYear();
  const anoRegex = /\b(19[5-9]\d|20[0-9]\d|20[0-9]{2})\b/g;
  const anoMatch = textoNormalizado.match(anoRegex);
  if (anoMatch && anoMatch.length > 0) {
    const anosValidos = anoMatch
      .map(a => parseInt(a))
      .filter(a => a >= 1950 && a <= anoAtual + 1);
    if (anosValidos.length > 0) {
      dados.ano = Math.max(...anosValidos).toString();
    }
  }

  // Extrair MARCA e MODELO (buscar padrões comuns)
  const marcasComuns = [
    'FIAT', 'VOLKSWAGEN', 'VW', 'CHEVROLET', 'GM', 'FORD', 'TOYOTA',
    'HONDA', 'HYUNDAI', 'RENAULT', 'NISSAN', 'PEUGEOT', 'CITROEN',
    'JEEP', 'MITSUBISHI', 'SUZUKI', 'KIA', 'AUDI', 'BMW', 'MERCEDES'
  ];

  for (const marca of marcasComuns) {
    if (textoNormalizado.includes(marca)) {
      dados.marca = marca;
      break;
    }
  }

  // MODELO é mais difícil de extrair automaticamente
  // Por enquanto, deixamos null e o usuário preenche manualmente

  return dados;
};

/**
 * Valida se os dados extraídos são válidos
 */
export const validarDadosOcr = (dados) => {
  const erros = [];

  if (dados.placa && !/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(dados.placa)) {
    erros.push('Placa inválida');
  }

  if (dados.renavam && dados.renavam.length !== 11) {
    erros.push('RENAVAM deve ter 11 dígitos');
  }

  if (dados.chassi && dados.chassi.length !== 17) {
    erros.push('Chassi deve ter 17 caracteres');
  }

  if (dados.ano) {
    const anoNum = parseInt(dados.ano);
    const anoAtual = new Date().getFullYear();
    if (isNaN(anoNum) || anoNum < 1950 || anoNum > anoAtual + 1) {
      erros.push('Ano inválido');
    }
  }

  return {
    valido: erros.length === 0,
    erros
  };
};

