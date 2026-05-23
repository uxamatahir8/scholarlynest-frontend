'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext({
  user: null,
  loading: true,
  login: async () => { },
  register: async () => { },
  logout: async () => { },
  hasRole: () => false,
  hasPermission: () => false,
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize and check current authentication state
  useEffect(() => {
    const initAuth = async () => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('auth_token');
        if (token) {
          try {
            const res = await api.get('/me');
            setUser(res.data.user);
            localStorage.setItem('user', JSON.stringify(res.data.user));
          } catch (err) {
            console.error('Failed to restore session:', err);
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            setUser(null);
          }
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Login handler
  const login = async (email, password) => {
    try {
      const res = await api.post('/login', { email, password });
      if (res.status === 202 && res.data.message === '2fa_required') {
        return { success: false, twoFactorRequired: true, email: res.data.email };
      }
      const { user: userData, access_token } = res.data;

      localStorage.setItem('auth_token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return { success: true };
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.message === 'verification_required') {
        return { success: false, verificationRequired: true, email };
      }
      const message = err.response?.data?.message || 'Login failed. Please check your credentials.';
      const errors = err.response?.data?.errors || null;
      return { success: false, message, errors };
    }
  };

  // Registration handler
  const register = async (name, email, password, passwordConfirmation, subscribeNewsletter = false) => {
    try {
      const res = await api.post('/register', {
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
        subscribe_newsletter: subscribeNewsletter
      });
      return { success: true, verificationRequired: true, email };
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed.';
      const errors = err.response?.data?.errors || null;
      return { success: false, message, errors };
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      await api.post('/logout');
    } catch (err) {
      console.error('Failed to revoke session on API:', err);
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  // Helper check for specific roles
  const hasRole = (roles) => {
    if (!user || !user.roles) return false;
    const normalize = (name) => name?.toLowerCase().replace('_', '-');
    const roleList = (Array.isArray(roles) ? roles : [roles]).map(normalize);
    return user.roles.some((r) => roleList.includes(normalize(r.name)));
  };

  // Helper check for specific permissions
  const hasPermission = (permissionName) => {
    if (!user) return false;

    // Check if user is super_admin
    if (user.roles && user.roles.some((r) => r.name.toLowerCase().replace('_', '-') === 'super_admin')) {
      return true;
    }

    const anyPermission = permissionName.endsWith('-own')
      ? permissionName.replace('-own', '-any')
      : null;

    const check = (pName) => {
      // Check direct permissions
      if (user.permissions && user.permissions.some((p) => p.name === pName)) {
        return true;
      }
      // Check inherited role permissions
      if (user.roles) {
        return user.roles.some((role) =>
          role.permissions && role.permissions.some((p) => p.name === pName)
        );
      }
      return false;
    };

    if (check(permissionName)) return true;
    if (anyPermission && check(anyPermission)) return true;

    return false;
  };

  // Set session payload directly (e.g. for Social Logins)
  const loginWithPayload = (userData, access_token) => {
    localStorage.setItem('auth_token', access_token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  // Refresh current user session from API
  const refreshUser = async () => {
    try {
      const res = await api.get('/me');
      setUser(res.data.user);
      localStorage.setItem('user', JSON.stringify(res.data.user));
    } catch (err) {
      console.error('Failed to refresh user profile:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, hasRole, hasPermission, loginWithPayload, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
