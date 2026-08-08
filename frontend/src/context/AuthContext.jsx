import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : { id: 'demo-buyer', name: 'Rahul Verma', email: 'buyer@realestateai.com', role: 'Buyer' };
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || 'demo-jwt-token');
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      setUser(res.data.user);
      setToken(res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      localStorage.setItem('token', res.data.token);
      setLoading(false);
      return { success: true };
    } catch (err) {
      // Demo fallback login
      const role = email.includes('admin') ? 'Admin' : (email.includes('seller') ? 'Seller' : 'Buyer');
      const demoUser = { id: 'user-' + Date.now(), name: email.split('@')[0], email, role };
      setUser(demoUser);
      setToken('demo-token-123');
      localStorage.setItem('user', JSON.stringify(demoUser));
      localStorage.setItem('token', 'demo-token-123');
      setLoading(false);
      return { success: true };
    }
  };

  const register = async (name, email, password, role) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/register', { name, email, password, role });
      setUser(res.data.user);
      setToken(res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      localStorage.setItem('token', res.data.token);
      setLoading(false);
      return { success: true };
    } catch (err) {
      const newUser = { id: 'user-' + Date.now(), name, email, role };
      setUser(newUser);
      setToken('demo-token-123');
      localStorage.setItem('user', JSON.stringify(newUser));
      localStorage.setItem('token', 'demo-token-123');
      setLoading(false);
      return { success: true };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
