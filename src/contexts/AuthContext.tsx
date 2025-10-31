// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import secureStorage, { StorageType } from '../utils/secureStorage';
import { AuthService } from '../services/AuthService';
import { STORAGE_KEYS, ERROR_MESSAGES } from '../constants';
import { User as TypesUser } from '../types'; // Importar o tipo do arquivo de tipos

// Usar o tipo User do arquivo types/index.ts
export type User = TypesUser & {
  updatedAt: string; // Adicionar apenas o campo que falta
};

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string; // Adicionado para compatibilidade
}

// Estado inicial
const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
};

// Actions
type AuthAction =
  | { type: 'AUTH_LOADING' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'UPDATE_USER'; payload: User };

// Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_LOADING':
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isLoading: false,
        isAuthenticated: true,
        error: null,
      };

    case 'AUTH_ERROR':
      return {
        ...state,
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
        error: action.payload,
      };

    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
        error: null,
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };

    default:
      return state;
  }
};

// Interface do Context
interface AuthContextType extends AuthState {
  login: (credentials: LoginFormData) => Promise<void>;
  register: (userData: RegisterFormData) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  clearError: () => void;
}

// Context - EXPORTADO CORRETAMENTE
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook para usar o context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};

// Provider
interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Inicializar auth ao carregar o app
  useEffect(() => {
    initializeAuth();
  }, []);

  // Função para inicializar autenticação
  const initializeAuth = async (): Promise<void> => {
    try {
      const [storedToken, storedUser] = await Promise.all([
        secureStorage.getItem(STORAGE_KEYS.TOKEN, StorageType.SECURE),
        secureStorage.getObject<User>(STORAGE_KEYS.USER, StorageType.REGULAR),
      ]);

      if (storedToken && storedUser) {
        const user = storedUser;
        
        // Verificar se o token ainda é válido
        try {
          const isValid = await AuthService.validateToken(storedToken);
          if (isValid) {
            // Adicionar updatedAt ao usuário se não existir
            const userWithUpdatedAt: User = {
              ...user,
              updatedAt: user.updatedAt || new Date().toISOString(),
            };
            
            dispatch({
              type: 'AUTH_SUCCESS',
              payload: { user: userWithUpdatedAt, token: storedToken },
            });
          } else {
            // Token inválido, limpar dados
            await clearStoredAuth();
            dispatch({ type: 'AUTH_LOGOUT' });
          }
        } catch (error) {
          // Erro ao validar token, limpar dados
          await clearStoredAuth();
          dispatch({ type: 'AUTH_LOGOUT' });
        }
      } else {
        dispatch({ type: 'AUTH_LOGOUT' });
      }
    } catch (error) {
      console.error('Erro ao inicializar auth:', error);
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  };

  // Função para limpar dados armazenados
  const clearStoredAuth = async (): Promise<void> => {
    try {
      await Promise.all([
        secureStorage.removeItem(STORAGE_KEYS.TOKEN, StorageType.SECURE),
        secureStorage.removeItem(STORAGE_KEYS.USER, StorageType.REGULAR),
      ]);
    } catch (error) {
      console.error('Erro ao limpar dados de auth:', error);
    }
  };

  // Login
  const login = async (credentials: LoginFormData): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_LOADING' });

      const response = await AuthService.login(credentials);

      // Garantir que o usuário tenha updatedAt
      const userWithUpdatedAt: User = {
        ...response.user,
        updatedAt: response.user.updatedAt || new Date().toISOString(),
      };

      // Salvar de forma segura
      await Promise.all([
        secureStorage.setItem(STORAGE_KEYS.TOKEN, response.token, StorageType.SECURE),
        secureStorage.setObject(STORAGE_KEYS.USER, userWithUpdatedAt, StorageType.REGULAR),
      ]);

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user: userWithUpdatedAt, token: response.token },
      });
    } catch (error: any) {
      const errorMessage = error.message || ERROR_MESSAGES.UNKNOWN_ERROR;
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
      throw error;
    }
  };

  // Registro
  const register = async (userData: RegisterFormData): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_LOADING' });

      const response = await AuthService.register(userData);

      // Garantir que o usuário tenha updatedAt
      const userWithUpdatedAt: User = {
        ...response.user,
        updatedAt: response.user.updatedAt || new Date().toISOString(),
      };

      // Salvar de forma segura
      await Promise.all([
        secureStorage.setItem(STORAGE_KEYS.TOKEN, response.token, StorageType.SECURE),
        secureStorage.setObject(STORAGE_KEYS.USER, userWithUpdatedAt, StorageType.REGULAR),
      ]);

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user: userWithUpdatedAt, token: response.token },
      });
    } catch (error: any) {
      const errorMessage = error.message || ERROR_MESSAGES.UNKNOWN_ERROR;
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
      throw error;
    }
  };

  // Logout
  const logout = async (): Promise<void> => {
    try {
      // Chamar logout no servidor (se necessário)
      if (state.token) {
        await AuthService.logout();
      }
    } catch (error) {
      console.error('Erro ao fazer logout no servidor:', error);
    } finally {
      // Limpar dados locais sempre
      await clearStoredAuth();
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  };

  // Esqueci a senha
  const forgotPassword = async (email: string): Promise<void> => {
    try {
      await AuthService.forgotPassword(email);
    } catch (error: any) {
      const errorMessage = error.message || ERROR_MESSAGES.UNKNOWN_ERROR;
      throw new Error(errorMessage);
    }
  };

  // Atualizar perfil
  const updateProfile = async (userData: Partial<User>): Promise<void> => {
    try {
      if (!state.user) {
        throw new Error('Usuário não autenticado');
      }

      const response = await AuthService.updateProfile(userData);
      
      // Verificar se a resposta contém o usuário atualizado
      let updatedUser: User;
      if (response && typeof response === 'object' && 'user' in response) {
        // Se a resposta tem a propriedade user
        updatedUser = {
          ...response.user,
          updatedAt: new Date().toISOString(), // Garantir que tenha updatedAt
        } as User;
      } else if (response && typeof response === 'object') {
        // Se a resposta é o próprio usuário ou dados de update - CORREÇÃO DO SPREAD
        updatedUser = {
          ...state.user,
          ...(response as Partial<User>), // Cast explícito para evitar erro de spread
          updatedAt: new Date().toISOString(), // Garantir que tenha updatedAt
        };
      } else {
        // Fallback: apenas atualizar o timestamp
        updatedUser = {
          ...state.user,
          updatedAt: new Date().toISOString(),
        };
      }

      // Atualizar de forma segura
      await secureStorage.setObject(STORAGE_KEYS.USER, updatedUser, StorageType.REGULAR);

      dispatch({ type: 'UPDATE_USER', payload: updatedUser });
    } catch (error: any) {
      const errorMessage = error.message || ERROR_MESSAGES.UNKNOWN_ERROR;
      throw new Error(errorMessage);
    }
  };

  // Limpar erro
  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Value do context
  const contextValue: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    forgotPassword,
    updateProfile,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};