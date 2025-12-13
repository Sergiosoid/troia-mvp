/**
 * Utilitário para mensagens de erro humanizadas
 * Converte erros técnicos em mensagens amigáveis para o usuário
 */

export const getErrorMessage = (error) => {
  if (!error) {
    return 'Algo deu errado. Tente novamente.';
  }

  const errorMessage = error.message || error.toString() || '';

  // Erros de conexão
  if (
    errorMessage.includes('Network') ||
    errorMessage.includes('network') ||
    errorMessage.includes('fetch') ||
    errorMessage.includes('conexão') ||
    errorMessage.includes('conexao') ||
    errorMessage.includes('indisponível') ||
    errorMessage.includes('indisponivel') ||
    errorMessage.includes('502') ||
    errorMessage.includes('503') ||
    errorMessage.includes('504')
  ) {
    return 'Não conseguimos conectar ao servidor.\nVerifique sua conexão com a internet e tente novamente.';
  }

  // Erros de autenticação
  if (
    errorMessage.includes('autenticado') ||
    errorMessage.includes('token') ||
    errorMessage.includes('401') ||
    errorMessage.includes('403') ||
    errorMessage.includes('sessão') ||
    errorMessage.includes('sessao') ||
    errorMessage.includes('login')
  ) {
    return 'Sua sessão expirou.\nPor favor, faça login novamente.';
  }

  // Erros de timeout
  if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
    return 'A operação demorou muito para responder.\nTente novamente em alguns instantes.';
  }

  // Erros de servidor
  if (errorMessage.includes('500') || errorMessage.includes('Erro ao')) {
    return 'Ocorreu um erro no servidor.\nNossa equipe foi notificada. Tente novamente mais tarde.';
  }

  // Erros de validação
  if (errorMessage.includes('obrigatório') || errorMessage.includes('obrigatorio')) {
    return errorMessage; // Manter mensagem de validação original
  }

  // Erros genéricos
  if (errorMessage.length > 0 && errorMessage.length < 100) {
    // Se a mensagem for curta e clara, usar ela
    return errorMessage;
  }

  // Mensagem padrão
  return 'Não conseguimos concluir esta ação.\nVerifique sua conexão ou tente novamente.';
};

export const getSuccessMessage = (action) => {
  const messages = {
    veiculo: 'Veículo salvo com sucesso!',
    manutencao: 'Manutenção registrada com sucesso!',
    abastecimento: 'Abastecimento registrado com sucesso!',
    km: 'KM atualizado com sucesso!',
    exclusao: 'Registro excluído com sucesso!',
    edicao: 'Alterações salvas com sucesso!',
  };

  return messages[action] || 'Operação concluída com sucesso!';
};

