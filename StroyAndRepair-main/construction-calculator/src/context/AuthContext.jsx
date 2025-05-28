import { createContext, useContext, useState, useEffect } from 'react';
import API from '../api';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Полная очистка аутентификации
  const clearAuth = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    setIsAuthenticated(false);
  };

  // Обновление токена
  const refreshToken = async () => {
    try {
      const refresh = localStorage.getItem('refresh_token');
      if (!refresh) throw new Error('No refresh token');
      
      const { data } = await API.post('auth/refresh/', { refresh });
      localStorage.setItem('access_token', data.access);
      return data.access;
    } catch (error) {
      clearAuth();
      throw error;
    }
  };

  // Проверка аутентификации при загрузке
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          setLoading(false);
          return;
        }

        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 < Date.now()) {
          try {
            await refreshToken();
          } catch (error) {
            setLoading(false);
            return;
          }
        }

        // Проверяем валидность токена на сервере
        const { data } = await API.get('auth/me/');
        setUser(data);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Auth check error:', error);
        clearAuth();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Интерцептор для запросов
  useEffect(() => {
    const requestInterceptor = API.interceptors.request.use(async config => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const decoded = jwtDecode(token);
          if (decoded.exp * 1000 < Date.now()) {
            const newToken = await refreshToken();
            config.headers.Authorization = `Bearer ${newToken}`;
          } else {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          clearAuth();
          throw error;
        }
      }
      return config;
    });

    // Интерцептор для обработки 401 ошибок
    const responseInterceptor = API.interceptors.response.use(
      response => response,
      async error => {
        if (error.response?.status === 401 && !error.config._retry) {
          error.config._retry = true;
          try {
            await refreshToken();
            return API(error.config);
          } catch (refreshError) {
            clearAuth();
            return Promise.reject(error);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      API.interceptors.request.eject(requestInterceptor);
      API.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  // Вход
  const login = async (credentials) => {
    try {
      const { data } = await API.post('auth/login/', {
        email: credentials.email,
        password: credentials.password
      });
      
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      
      const { data: userData } = await API.get('auth/me/');
      setUser(userData);
      setIsAuthenticated(true);
      
      return true;
    } catch (error) {
      console.error('Login error:', error.response?.data);
      return false;
    }
  };

  // Регистрация
  const register = async (userData) => {
    try {
      const { data } = await API.post('auth/register/', {
        email: userData.email,
        password: userData.password,
        password2: userData.password2
      });
      
      if (data.access && data.refresh) {
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        
        const { data: userData } = await API.get('auth/me/');
        setUser(userData);
        setIsAuthenticated(true);
      }
      
      return true;
    } catch (error) {
      console.error('Registration error:', error.response?.data);
      return false;
    }
  };

  // Выход
  const logout = () => {
    clearAuth();
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user,
        isAuthenticated,
        loading,
        login,
        logout,
        register,
        refreshToken
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);