import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthService } from '../services/AuthService';
import { User, LoginFormData, RegisterFormData } from '../types';

// Estados do Auth
interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

// Ações do Auth
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'AUTH_CLEAR_ERROR' }
  | { type: 'AUTH_INIT' }
  | { type: 'AUTH_UPDATE_USER'; payload: User };

// Estado inicial
const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
};

// Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
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

    case 'AUTH_FAILURE':
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

    case 'AUTH_CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    case 'AUTH_INIT':
      return {
        ...state,
        isLoading: false,
      };

    case 'AUTH_UPDATE_USER':
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

// Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook para usar o context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};

// Chaves do AsyncStorage
const STORAGE_KEYS = {
  TOKEN: '@FinanceApp:token',
  USER: '@FinanceApp:user',
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
        AsyncStorage.getItem(STORAGE_KEYS.TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.USER),
      ]);

      if (storedToken && storedUser) {
        const user = JSON.parse(storedUser);
        
        // Verificar se o token ainda é válido
        try {
          const isValid = await AuthService.validateToken(storedToken);
          if (isValid) {
            dispatch({
              type: 'AUTH_SUCCESS',
              payload: { user, token: storedToken },
            });
          } else {
            // Token inválido, limpar dados
            await clearStoredData();
            dispatch({ type: 'AUTH_INIT' });
          }
        } catch (error) {
          // Erro na validação, limpar dados
          await clearStoredData();
          dispatch({ type: 'AUTH_INIT' });
        }
      } else {
        dispatch({ type: 'AUTH_INIT' });
      }
    } catch (error) {
      console.error('Erro ao inicializar auth:', error);
      dispatch({ type: 'AUTH_INIT' });
    }
  };

  // Função para limpar dados armazenados
  const clearStoredData = async (): Promise<void> => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.USER),
      ]);
    } catch (error) {
      console.error('Erro ao limpar dados:', error);
    }
  };

  // Função para armazenar dados
  const storeAuthData = async (user: User, token: string): Promise<void> => {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token),
        AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user)),
      ]);
    } catch (error) {
      console.error('Erro ao armazenar dados:', error);
      throw new Error('Erro ao salvar dados de autenticação');
    }
  };

  // Login
  const login = async (credentials: LoginFormData): Promise<void> => {
    dispatch({ type: 'AUTH_START' });
    
    try {
      const response = await AuthService.login(credentials);
      
      if (response.success) {
        await storeAuthData(response.user, response.token);
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user: response.user, token: response.token },
        });
      } else {
        dispatch({
          type: 'AUTH_FAILURE',
          payload: response.message || 'Erro no login',
        });
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          'Erro de conexão. Tente novamente.';
      
      dispatch({
        type: 'AUTH_FAILURE',
        payload: errorMessage,
      });
    }
  };

  // Registro
  const register = async (userData: RegisterFormData): Promise<void> => {
    dispatch({ type: 'AUTH_START' });
    
    try {
      const response = await AuthService.register(userData);
      
      if (response.success) {
        await storeAuthData(response.user, response.token);
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user: response.user, token: response.token },
        });
      } else {
        dispatch({
          type: 'AUTH_FAILURE',
          payload: response.message || 'Erro no registro',
        });
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          'Erro de conexão. Tente novamente.';
      
      dispatch({
        type: 'AUTH_FAILURE',
        payload: errorMessage,
      });
    }
  };

  // Logout
  const logout = async (): Promise<void> => {
    try {
      // Tentar fazer logout no servidor (opcional)
      if (state.token) {
        try {
          await AuthService.logout();
        } catch (error) {
          // Ignorar erro do servidor no logout
          console.warn('Erro no logout do servidor:', error);
        }
      }
      
      // Limpar dados locais
      await clearStoredData();
      dispatch({ type: 'AUTH_LOGOUT' });
    } catch (error) {
      console.error('Erro no logout:', error);
      // Mesmo com erro, fazer logout local
      await clearStoredData();
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  };

  // Esqueci a senha
  const forgotPassword = async (email: string): Promise<void> => {
    dispatch({ type: 'AUTH_START' });
    
    try {
      await AuthService.forgotPassword(email);
      dispatch({ type: 'AUTH_INIT' });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          'Erro ao enviar email de recuperação';
      
      dispatch({
        type: 'AUTH_FAILURE',
        payload: errorMessage,
      });
    }
  };

  // Atualizar perfil
  const updateProfile = async (userData: Partial<User>): Promise<void> => {
    try {
      const response = await AuthService.updateProfile(userData);
      
      if (response.success) {
        const updatedUser = { ...state.user!, ...response.user };
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
        dispatch({
          type: 'AUTH_UPDATE_USER',
          payload: updatedUser,
        });
      } else {
        throw new Error(response.message || 'Erro ao atualizar perfil');
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          'Erro ao atualizar perfil';
      throw new Error(errorMessage);
    }
  };

  // Limpar erro
  const clearError = (): void => {
    dispatch({ type: 'AUTH_CLEAR_ERROR' });
  };

  // Valor do context
  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    forgotPassword,
    updateProfile,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
