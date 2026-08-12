'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import api from '../utils/api';

const NotificationContext = createContext(null);

export function NotificationProvider({ children, enabled }) {
  const [counts, setCounts] = useState({ unread_count: 0, action_required_count: 0 });
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const requestRef = useRef(0);

  const refreshCounts = useCallback(async ({ silent = true } = {}) => {
    if (!enabled) return;
    const requestId = ++requestRef.current;
    if (!silent) setLoading(true);
    try {
      const response = await api.get('/notifications/counts');
      if (requestId === requestRef.current) {
        setCounts(response.data?.data || { unread_count: 0, action_required_count: 0 });
        setError(null);
      }
    } catch (err) {
      if (requestId === requestRef.current) setError(err);
    } finally {
      if (requestId === requestRef.current && !silent) setLoading(false);
    }
  }, [enabled]);

  const refreshRecent = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const [response, actionsResponse] = await Promise.all([
        api.get('/notifications', { params: { limit: 8 } }),
        api.get('/notifications', { params: { tab: 'action_required', limit: 5 } }),
      ]);
      const combined = [...(actionsResponse.data?.data || []), ...(response.data?.data || [])]
        .filter((item, index, items) => items.findIndex((candidate) => candidate.id === item.id) === index)
        .slice(0, 10);
      setRecent(combined);
      setCounts((current) => ({
        unread_count: response.data?.meta?.unread_count ?? current.unread_count,
        action_required_count: response.data?.meta?.action_required_count ?? current.action_required_count,
      }));
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setCounts({ unread_count: 0, action_required_count: 0 });
      setRecent([]);
      return undefined;
    }
    refreshCounts({ silent: false });
    const onFocus = () => refreshCounts();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refreshCounts();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') refreshCounts();
    }, 60000);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
      window.clearInterval(interval);
    };
  }, [enabled, refreshCounts]);

  const markRead = useCallback(async (id, read = true) => {
    const response = await api.patch(`/notifications/${id}/read`, { read });
    setRecent((items) => items.map((item) => item.id === id ? response.data.data : item));
    if (response.data?.meta) setCounts(response.data.meta);
    return response.data.data;
  }, []);

  const value = useMemo(() => ({ counts, recent, loading, error, refreshCounts, refreshRecent, markRead }), [counts, recent, loading, error, refreshCounts, refreshRecent, markRead]);

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used inside NotificationProvider.');
  return context;
}
