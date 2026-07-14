'use client';

import { safeApiMessage } from '../utils/safeErrors';
import { logError } from '../utils/safeLogger';
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
  impersonationStatus: { active: false, impersonated_user: null },
  checkImpersonationStatus: async () => { },
  startImpersonationSession: () => { },
  stopImpersonationSession: () => { },
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [impersonationStatus, setImpersonationStatus] = useState({ active: false, impersonated_user: null });

  // Fetch current impersonation status from API
  const checkImpersonationStatus = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setImpersonationStatus({ active: false, impersonated_user: null });
      return;
    }
    try {
      const res = await api.get('/admin/impersonation/status');
      setImpersonationStatus(res.data);
    } catch (err) {
      setImpersonationStatus({ active: false, impersonated_user: null });
    }
  };

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
            await checkImpersonationStatus();
          } catch (err) {
            logError('Failed to restore session:', err);
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            setUser(null);
            setImpersonationStatus({ active: false, impersonated_user: null });
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
        return {
          success: false,
          twoFactorRequired: true,
          challengeToken: res.data.mfa_challenge_token,
          availableMethods: res.data.available_methods,
          defaultMethod: res.data.default_method,
        };
      }
      const { user: userData, access_token } = res.data;

      localStorage.setItem('auth_token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return { success: true, user: userData };
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.message === 'verification_required') {
        return { success: false, verificationRequired: true, email };
      }
      const message = safeApiMessage(err, 'Login failed. Please check your credentials.');
      const errors = err.response?.data?.errors || null;
      return { success: false, message, errors };
    }
  };

  // Registration handler
  const register = async (name, email, password, passwordConfirmation, subscribeNewsletter = false, universityName) => {
    try {
      const res = await api.post('/register', {
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
        subscribe_newsletter: subscribeNewsletter,
        university_name: universityName
      });
      return { success: true, verificationRequired: true, email };
    } catch (err) {
      const message = safeApiMessage(err, 'Registration failed.');
      const errors = err.response?.data?.errors || null;
      return { success: false, message, errors };
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      await api.post('/logout');
    } catch (err) {
      logError('Failed to revoke session on API:', err);
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      setUser(null);
      setImpersonationStatus({ active: false, impersonated_user: null });
    }
  };

  // Helper check for specific roles
  const hasRole = (roles) => {
    if (!user || !user.roles) return false;
    const normalize = (name) => name?.toLowerCase().replace('_', '-');
    const roleList = (Array.isArray(roles) ? roles : [roles]).map(normalize);
    const editorialRoles = ['editor', 'super-editor', 'magazine-editor', 'journal-editor'];
    return user.roles.some((r) => {
      const actualRole = normalize(r.name);
      return roleList.includes(actualRole) || (roleList.includes('editor') && editorialRoles.includes(actualRole));
    });
  };

  // Helper check for specific permissions
  const hasPermission = (permissionName) => {
    if (!user) return false;

    // Check if user is super_admin
    if (user.roles && user.roles.some((r) => r.name.toLowerCase().replace('_', '-') === 'super-admin' || r.name.toLowerCase() === 'super_admin')) {
      return true;
    }

    const anyPermission = permissionName.endsWith('-own')
      ? permissionName.replace('-own', '-any')
      : null;

    const check = (pName) => {
      if (user.capabilities && user.capabilities[pName]) {
        return true;
      }
      if (user.permissions && user.permissions.some((p) => p.name === pName)) {
        return true;
      }
      return false;
    };

    if (check(permissionName)) return true;
    if (anyPermission && check(anyPermission)) return true;

    return false;
  };

  // Impersonation helpers
  const startImpersonationSession = (userData, token) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setImpersonationStatus({
      active: true,
      impersonated_user: {
        id: userData.id,
        name: userData.name
      }
    });
  };

  const stopImpersonationSession = (superAdminData, token) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user', JSON.stringify(superAdminData));
    setUser(superAdminData);
    setImpersonationStatus({ active: false, impersonated_user: null });
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
      logError('Failed to refresh user profile:', err);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      hasRole,
      hasPermission,
      loginWithPayload,
      refreshUser,
      impersonationStatus,
      checkImpersonationStatus,
      startImpersonationSession,
      stopImpersonationSession
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
