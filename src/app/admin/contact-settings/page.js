'use client';

import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Save, Loader2, ShieldCheck, ArrowLeft, ChevronRight, Plus, Edit, Trash2, Tag, X } from 'lucide-react';
import Link from 'next/link';
import api from '../../../utils/api';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';

export default function AdminContactSettings() {
  const { toast } = useToast();
  const { user, hasRole, hasPermission, loading: authLoading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  // Contact Subjects State
  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [subjectLabel, setSubjectLabel] = useState('');
  const [subjectValue, setSubjectValue] = useState('');
  const [subjectSortOrder, setSubjectSortOrder] = useState(0);
  const [subjectSaving, setSubjectSaving] = useState(false);
  const [deletingSubjectId, setDeletingSubjectId] = useState(null);
  const canDeleteRecords = hasRole('super_admin');

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
      fetchSubjects();
    }
  }, [user, authLoading]);

  const fetchSubjects = async () => {
    setSubjectsLoading(true);
    try {
      const res = await api.get('/contact-subjects');
      setSubjects(res.data || []);
    } catch (err) {
      console.error('Failed to load contact subjects:', err);
    } finally {
      setSubjectsLoading(false);
    }
  };

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

  const handleSaveSubject = async (e) => {
    e.preventDefault();
    if (!subjectLabel.trim() || !subjectValue.trim()) {
      toast('Label and value are both required.', 'error');
      return;
    }

    setSubjectSaving(true);
    const payload = {
      label: subjectLabel.trim(),
      value: subjectValue.trim().toLowerCase().replace(/\s+/g, '_'),
      sort_order: Number(subjectSortOrder),
    };

    try {
      if (editingSubject) {
        await api.put(`/admin/contact-subjects/${editingSubject.id}`, payload);
        toast(`Subject "${subjectLabel}" updated.`, 'success');
      } else {
        await api.post('/admin/contact-subjects', payload);
        toast(`Subject "${subjectLabel}" created.`, 'success');
      }
      resetSubjectForm();
      await fetchSubjects();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save subject.';
      toast(msg, 'error');
    } finally {
      setSubjectSaving(false);
    }
  };

  const handleDeleteSubject = async (id, label) => {
    if (!canDeleteRecords) return;
    setDeletingSubjectId(id);
    try {
      await api.delete(`/admin/contact-subjects/${id}`);
      toast(`Subject "${label}" deleted.`, 'success');
      await fetchSubjects();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to delete subject.', 'error');
    } finally {
      setDeletingSubjectId(null);
    }
  };

  const handleEditSubjectClick = (subject) => {
    setEditingSubject(subject);
    setSubjectLabel(subject.label);
    setSubjectValue(subject.value);
    setSubjectSortOrder(subject.sort_order);
    setShowSubjectForm(true);
  };

  const resetSubjectForm = () => {
    setShowSubjectForm(false);
    setEditingSubject(null);
    setSubjectLabel('');
    setSubjectValue('');
    setSubjectSortOrder(0);
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
    <div className="space-y-6 w-full">
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: General Details Form (5 columns) */}
        <div className="lg:col-span-5">
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
                    placeholder={"ScholarlyNest Press\n750 University Research Boulevard, Suite 400\nCambridge, MA 02138, United States"}
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

        {/* Right Side: Contact Subject Options (7 columns) */}
        <div className="lg:col-span-7">
          {/* Contact Subject Matter Management */}
          <div className="bg-white dark:bg-[#121211] p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/60 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Contact Subject Options</h3>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500">Manage the subject matter dropdown options displayed on the public contact form.</p>
                </div>
              </div>
              {!showSubjectForm && (
                <button
                  onClick={() => {
                    resetSubjectForm();
                    setShowSubjectForm(true);
                  }}
                  className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-2 border border-zinc-200 dark:border-zinc-800/60 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer text-zinc-700 dark:text-zinc-300"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Subject</span>
                </button>
              )}
            </div>

            {/* Subject Form */}
            {showSubjectForm && (
              <form onSubmit={handleSaveSubject} className="bg-zinc-50 dark:bg-zinc-900/35 border border-zinc-200/60 dark:border-zinc-800/50 p-4 rounded-xl space-y-3.5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-450">
                    {editingSubject ? 'Edit Subject' : 'Create Subject'}
                  </h4>
                  <button type="button" onClick={resetSubjectForm} className="p-1 text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 cursor-pointer">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-450 mb-1">Display Label</label>
                    <input
                      type="text"
                      required
                      value={subjectLabel}
                      onChange={(e) => {
                        setSubjectLabel(e.target.value);
                        if (!editingSubject) {
                          setSubjectValue(e.target.value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''));
                        }
                      }}
                      placeholder="e.g., Technical Support"
                      className="w-full px-3 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold focus:outline-none focus:border-[var(--accent)] transition-colors text-zinc-850 dark:text-zinc-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-450 mb-1">Value Key</label>
                    <input
                      type="text"
                      required
                      value={subjectValue}
                      onChange={(e) => setSubjectValue(e.target.value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''))}
                      placeholder="e.g., technical_support"
                      className="w-full px-3 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-mono font-semibold focus:outline-none focus:border-[var(--accent)] transition-colors text-zinc-850 dark:text-zinc-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-450 mb-1">Sort Order</label>
                    <input
                      type="number"
                      value={subjectSortOrder}
                      onChange={(e) => setSubjectSortOrder(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/60 rounded-lg text-xs font-semibold focus:outline-none focus:border-[var(--accent)] transition-colors text-zinc-800 dark:text-zinc-250"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-1.5 pt-2">
                  <button
                    type="button"
                    onClick={resetSubjectForm}
                    className="px-2.5 py-1.5 border border-zinc-200 dark:border-zinc-800/60 rounded-lg text-[10px] font-bold uppercase tracking-wider text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={subjectSaving}
                    className="px-3 py-1.5 bg-[var(--accent)] text-white hover:opacity-90 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {subjectSaving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            )}

            {/* Subjects List */}
            <div className="space-y-2">
              {subjectsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
                </div>
              ) : subjects.length > 0 ? (
                subjects.map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-xl border border-zinc-200/50 dark:border-zinc-800/40 bg-zinc-50/50 dark:bg-zinc-950">
                    <div>
                      <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{s.label}</span>
                      <span className="block text-[9px] text-zinc-400 font-semibold font-mono">value: {s.value} · order: {s.sort_order}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => handleEditSubjectClick(s)}
                        className="p-1.5 text-zinc-400 hover:text-[var(--accent)] hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      {canDeleteRecords && (
                        <button
                          onClick={() => handleDeleteSubject(s.id, s.label)}
                          disabled={deletingSubjectId === s.id}
                          className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {deletingSubjectId === s.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-zinc-455">
                  <p className="text-xs">No contact subjects configured yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
