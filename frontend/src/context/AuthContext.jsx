import React, { createContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

/**
 * Real auth state. There is no demo default user and no fallback that grants
 * access when the API fails — identity comes only from the server via /auth/me.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | authenticated | anonymous
  const [loading, setLoading] = useState(false);

  const hydrate = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.user);
      setStatus('authenticated');
    } catch {
      setUser(null);
      setStatus('anonymous');
    }
  }, []);

  useEffect(() => { hydrate(); }, [hydrate]);

  // The api interceptor fires this when refresh fails or token reuse is detected.
  useEffect(() => {
    const onExpired = () => { setUser(null); setStatus('anonymous'); };
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, []);

  /**
   * Returns one of:
   *   { success: true }
   *   { success: true, mfaEnrollmentRequired: true }
   *   { mfaRequired: true, mfaTicket }   -> caller shows the code challenge
   *   { success: false, message, code }
   */
  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });

      if (res.data.mfaRequired) {
        return { mfaRequired: true, mfaTicket: res.data.mfaTicket };
      }

      setUser(res.data.user);
      setStatus('authenticated');
      return { success: true, mfaEnrollmentRequired: !!res.data.mfaEnrollmentRequired };
    } catch (err) {
      const d = err.response?.data || {};
      return { success: false, message: d.message || 'Login failed', code: d.code };
    } finally {
      setLoading(false);
    }
  };

  const verifyMfa = async (mfaTicket, code) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/mfa/verify', { mfaTicket, code });
      setUser(res.data.user);
      setStatus('authenticated');
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Invalid code' };
    } finally {
      setLoading(false);
    }
  };

  const register = async ({ name, email, password, role, phone }) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/register', { name, email, password, role, phone });
      return { success: true, message: res.data.message };
    } catch (err) {
      const d = err.response?.data || {};
      return { success: false, message: d.message || 'Registration failed', errors: d.errors, breached: d.breached };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch { /* clear locally regardless */ }
    setUser(null);
    setStatus('anonymous');
  };

  return (
    <AuthContext.Provider value={{
      user, status, loading,
      isAuthenticated: status === 'authenticated',
      login, verifyMfa, register, logout, refreshUser: hydrate,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
