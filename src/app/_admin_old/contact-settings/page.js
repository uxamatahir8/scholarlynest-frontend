'use client';

import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Save, Loader2, ShieldCheck, ArrowLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import api from '../../../utils/api';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';

export default function AdminContactSettings() {
  const { toast } = useToast();
  const { user, hasPermission, loading: authLoading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    const fetchContactSettings = async () => {
      if (!hasPermission('settings.view-any') && !hasPermission('settings.manage')) return;
      try {
        setLoading(true);
        const res = await api.get('/contact-settings');
        setEmail(res.data.email || '');
        setPhone(res.data.phone || '');
        setAddress(res.data.address || '');
      } catch (err) {
        console.error('Failed to load contact settings:', err);
        toast('Failed to load contact settings.', 'error');
      } finally {
        setLoading(false);
      }
    };
    if (!authLoading && user) {
      fetchContactSettings();
    }
  }, [user, authLoading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});

    const errors = {};
    if (!email) {
      errors.email = 'Contact email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please provide a valid email address.';
    }

    if (!phone.trim()) {
      errors.phone = 'Contact telephone is required.';
    }

    if (!address.trim()) {
      errors.address = 'Mailing address is required.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast('Please correct the validation errors.', 'error');
      return;
    }

    try {
      setSaving(true);
      await api.put('/admin/contact-settings', { email, phone, address });
      toast('Contact settings updated successfully.', 'success');
    } catch (err) {
      console.error('Failed to update contact settings:', err);
      toast(err.response?.data?.message || 'Failed to save contact settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-[var(--accent)]" />
        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-mono">Authenticating Privileges...</span>
      </div>
    );
  }

  if (!user || (!hasPermission('settings.view-any') && !hasPermission('settings.manage'))) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl flex items-start space-x-4 animate-in fade-in slide-in-from-bottom-4">
        <ShieldCheck className="w-6 h-6 text-red-500 shrink-0" />
        <div>
          <h3 className="text-sm font-bold text-red-700 dark:text-red-400">Access Restricted</h3>
          <p className="text-xs text-red-600 dark:text-red-300 mt-1">
            You must possess settings management privileges to configure contact details.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-[var(--accent)]" />
        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-mono">Loading Contact Profile...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Navigation Headers */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800/60">
        <Link href="/admin" className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-[var(--accent)] transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Overview
        </Link>
        <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
          <span>Console</span>
          <ChevronRight className="w-3 h-3 text-[var(--accent-gold)]" />
          <span className="text-zinc-650 dark:text-zinc-300">Contact Settings</span>
        </div>
      </div>

      {/* Hero card details */}
      <div className="bg-white dark:bg-[#121211] p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/60 shadow-sm space-y-2 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[var(--accent)]/5 to-transparent pointer-events-none" />
        <h1 className="text-xl font-bold text-zinc-950 dark:text-white font-serif">Contact Details Manager</h1>
        <p className="text-xs text-zinc-555 dark:text-zinc-400 font-medium leading-relaxed max-w-xl">
          Modify the published mailing address, contact email address, and office telephone details. Any updates will immediately override the settings in the application configuration profile.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-[#121211] p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/60 shadow-sm space-y-5">
          
          {/* Contact Email */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Contact Email Address
            </label>
            <div className="relative flex items-center">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@scholarlynest.com"
                className="w-full text-xs font-semibold pl-8 pr-3 py-2.5 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 rounded-md focus:outline-none placeholder-zinc-400 transition-all"
              />
              <Mail className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5" />
            </div>
            {fieldErrors.email && (
              <span className="text-[10px] text-red-550 dark:text-red-400 font-semibold mt-1 block">{fieldErrors.email}</span>
            )}
          </div>

          {/* Contact Phone */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Communications Phone
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (617) 555-0198"
                className="w-full text-xs font-semibold pl-8 pr-3 py-2.5 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 rounded-md focus:outline-none placeholder-zinc-400 transition-all"
              />
              <Phone className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5" />
            </div>
            {fieldErrors.phone && (
              <span className="text-[10px] text-red-550 dark:text-red-400 font-semibold mt-1 block">{fieldErrors.phone}</span>
            )}
          </div>

          {/* Mailing Address */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Mailing Address / Headquarters location
            </label>
            <div className="relative flex items-start">
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="ScholarlyNest Press&#10;750 University Research Boulevard, Suite 400&#10;Cambridge, MA 02138, United States"
                rows={4}
                className="w-full text-xs font-semibold pl-8 pr-3 py-2.5 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 rounded-md focus:outline-none placeholder-zinc-400 transition-all leading-relaxed"
              />
              <MapPin className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-3" />
            </div>
            {fieldErrors.address && (
              <span className="text-[10px] text-red-550 dark:text-red-400 font-semibold mt-1 block">{fieldErrors.address}</span>
            )}
          </div>

        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3">
          <Link 
            href="/admin"
            className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-zinc-500 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-400 transition-colors cursor-pointer"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-[var(--accent)] hover:opacity-90 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Details...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Contact Details</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
