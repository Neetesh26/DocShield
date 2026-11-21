import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('docushield_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('docushield_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyUser = async () => {
      if (token) {
        try {
          const res = await authService.getMe();
          if (res.success && res.data?.user) {
            setUser(res.data.user);
            localStorage.setItem('docushield_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.warn('Session verification failed, signing out', err);
          logout();
        }
      }
      setLoading(false);
    };

    verifyUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await authService.login(email, password);
    if (res.success && res.data) {
      setUser(res.data.user);
      setToken(res.data.token);
      localStorage.setItem('docushield_token', res.data.token);
      localStorage.setItem('docushield_user', JSON.stringify(res.data.user));
      return { success: true };
    }
    return { success: false, message: res.message || 'Login failed' };
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (e) {
      // ignore
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('docushield_token');
      localStorage.removeItem('docushield_user');
    }
  };

  const hasRole = (...roles) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        login,
        logout,
        hasRole
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

