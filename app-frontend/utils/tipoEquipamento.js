/**
 * Utilitários para tipo de equipamento
 * Alinha frontend com o domínio do backend
 */

/**
 * Retorna a métrica (unidade de medida) para um tipo de equipamento
 * @param {string} tipo - Tipo do equipamento
 * @returns {Object} - Objeto com key, label e labelLong
 */
export function getMetricaPorTipo(tipo) {
  const map = {
    carro: { key: 'km', label: 'KM', labelLong: 'Quilometragem', icon: 'speedometer-outline' },
    moto: { key: 'km', label: 'KM', labelLong: 'Quilometragem', icon: 'speedometer-outline' },
    caminhao: { key: 'km', label: 'KM', labelLong: 'Quilometragem', icon: 'speedometer-outline' },
    onibus: { key: 'km', label: 'KM', labelLong: 'Quilometragem', icon: 'speedometer-outline' },
    barco: { key: 'horas', label: 'Horas', labelLong: 'Horas de uso', icon: 'time-outline' },
    jetski: { key: 'horas', label: 'Horas', labelLong: 'Horas de uso', icon: 'time-outline' },
    maquina_agricola: { key: 'horas', label: 'Horas', labelLong: 'Horas de uso', icon: 'time-outline' },
    maquina_industrial: { key: 'horas', label: 'Horas', labelLong: 'Horas de uso', icon: 'time-outline' },
    outro: { key: 'configuravel', label: 'Uso', labelLong: 'Uso inicial', icon: 'analytics-outline' }
  };

  return map[tipo] || map.outro;
}

/**
 * Valida se um tipo de equipamento é válido
 * @param {string} tipo - Tipo do equipamento
 * @returns {boolean}
 */
export function isTipoValido(tipo) {
  const tiposValidos = [
    'carro',
    'moto',
    'caminhao',
    'onibus',
    'barco',
    'jetski',
    'maquina_agricola',
    'maquina_industrial',
    'outro'
  ];
  return tiposValidos.includes(tipo);
}

/**
 * Formata valor com a unidade correta
 * @param {number|string} valor - Valor numérico
 * @param {string} tipo - Tipo do equipamento
 * @returns {string} - Valor formatado com unidade
 */
export function formatarValorComUnidade(valor, tipo) {
  const metrica = getMetricaPorTipo(tipo);
  const valorNum = typeof valor === 'string' ? parseInt(valor.replace(/\D/g, '')) : valor;
  
  if (isNaN(valorNum)) return '';
  
  // Formatar com separador de milhar
  const valorFormatado = valorNum.toLocaleString('pt-BR');
  
  return `${valorFormatado} ${metrica.label.toLowerCase()}`;
}

