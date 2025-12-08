import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Chaves usadas no AsyncStorage para dados do usuário
 */
const STORAGE_KEYS = {
  USER_ID: 'userId',
  USER_TOKEN: 'userToken',
  USER_NAME: 'userName',
  USER_EMAIL: 'userEmail',
};

/**
 * Salva os dados do usuário logado no AsyncStorage
 * 
 * @param {Object} userData - Dados do usuário
 * @param {number|string} userData.userId - ID do usuário
 * @param {string} userData.token - Token JWT
 * @param {string} [userData.nome] - Nome do usuário
 * @param {string} [userData.email] - Email do usuário
 * 
 * @returns {Promise<void>}
 */
export const setLoggedUser = async (userData) => {
  try {
    if (!userData || !userData.userId) {
      throw new Error('Dados do usuário inválidos');
    }

    if (!userData.token) {
      throw new Error('Token JWT é obrigatório');
    }

    // Salvar todos os dados de forma atômica
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.USER_ID, String(userData.userId)],
      [STORAGE_KEYS.USER_TOKEN, userData.token],
      [STORAGE_KEYS.USER_NAME, userData.nome || ''],
      [STORAGE_KEYS.USER_EMAIL, userData.email || ''],
    ]);

    // Debug: Descomentar apenas para desenvolvimento
    // console.log('[AUTH] Usuário salvo com sucesso');
  } catch (error) {
    console.error('[AUTH] Erro ao salvar usuário:', error);
    throw error;
  }
};

/**
 * Obtém os dados do usuário logado do AsyncStorage
 * 
 * @returns {Promise<Object|null>} Dados do usuário ou null se não estiver logado
 * @returns {Promise<{userId: string, token: string, nome: string, email: string}>}
 */
export const getLoggedUser = async () => {
  try {
    const [userId, token, nome, email] = await AsyncStorage.multiGet([
      STORAGE_KEYS.USER_ID,
      STORAGE_KEYS.USER_TOKEN,
      STORAGE_KEYS.USER_NAME,
      STORAGE_KEYS.USER_EMAIL,
    ]);

    const userIdValue = userId[1];
    const tokenValue = token[1];

    // Verificar se tem userId E token (ambos obrigatórios)
    if (!userIdValue || !tokenValue) {
      return null;
    }

    return {
      userId: userIdValue,
      token: tokenValue,
      nome: nome[1] || '',
      email: email[1] || '',
    };
  } catch (error) {
    console.error('[AUTH] Erro ao obter usuário:', error);
    return null;
  }
};

/**
 * Verifica se o usuário está autenticado
 * Verifica se existe userId E token (ambos obrigatórios)
 * 
 * @returns {Promise<boolean>} true se estiver autenticado, false caso contrário
 */
export const isUserLoggedIn = async () => {
  try {
    const user = await getLoggedUser();
    return user !== null && !!user.userId && !!user.token;
  } catch (error) {
    console.error('[AUTH] Erro ao verificar login:', error);
    return false;
  }
};

/**
 * Remove todos os dados do usuário do AsyncStorage (logout)
 * 
 * @returns {Promise<void>}
 */
export const clearLoggedUser = async () => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.USER_ID,
      STORAGE_KEYS.USER_TOKEN,
      STORAGE_KEYS.USER_NAME,
      STORAGE_KEYS.USER_EMAIL,
    ]);

    // Debug: Descomentar apenas para desenvolvimento
    // console.log('[AUTH] Dados do usuário removidos');
  } catch (error) {
    console.error('[AUTH] Erro ao remover dados do usuário:', error);
    throw error;
  }
};

/**
 * Obtém apenas o userId (para compatibilidade)
 * 
 * @returns {Promise<string|null>}
 */
export const getUserId = async () => {
  try {
    const user = await getLoggedUser();
    return user?.userId || null;
  } catch (error) {
    console.error('[AUTH] Erro ao obter userId:', error);
    return null;
  }
};

/**
 * Obtém apenas o token JWT
 * 
 * @returns {Promise<string|null>}
 */
export const getToken = async () => {
  try {
    const user = await getLoggedUser();
    return user?.token || null;
  } catch (error) {
    console.error('[AUTH] Erro ao obter token:', error);
    return null;
  }
};

export default {
  setLoggedUser,
  getLoggedUser,
  isUserLoggedIn,
  clearLoggedUser,
  getUserId,
  getToken,
};

