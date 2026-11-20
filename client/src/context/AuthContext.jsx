import { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser, getCurrentUser } from '../services/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('restro_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('restro_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('restro_token');
      if (savedToken) {
        try {
          const data = await getCurrentUser();
          setUser(data.user);
          localStorage.setItem('restro_user', JSON.stringify(data.user));
        } catch (err) {
          console.error('Session expired or invalid token', err);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const data = await loginUser({ email, password });
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('restro_token', data.token);
    localStorage.setItem('restro_user', JSON.stringify(data.user));
    return data.user;
  };

  const register = async (name, email, password, role) => {
    const data = await registerUser({ name, email, password, role });
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('restro_token', data.token);
    localStorage.setItem('restro_user', JSON.stringify(data.user));
    return data.user;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('restro_token');
    localStorage.removeItem('restro_user');
  };

  // Quick 1-click login helper for testing and convenience
  const quickDemoLogin = async (role) => {
    const credentials = {
      waiter: { email: 'waiter@restaurant.com', password: 'password123' },
      kitchen: { email: 'kitchen@restaurant.com', password: 'password123' },
      admin: { email: 'admin@restaurant.com', password: 'password123' },
    };

    const target = credentials[role] || credentials.waiter;
    return await login(target.email, target.password);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        quickDemoLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

