'use client';

import React, { useEffect, useState } from 'react';
import { Users, UserPlus, Trash2, Loader2, Mail, Info } from 'lucide-react';
import api from '../../../../utils/api';
import { useAuth } from '../../../../context/AuthContext';
import { useToast } from '../../../../context/ToastContext';

export default function MySubEditorsPage() {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const [subEditors, setSubEditors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [unassigningId, setUnassigningId] = useState(null);
  
  const [form, setForm] = useState({ name: '', email: '' });

  const roleAllowed = hasRole('super_admin') || hasRole('admin') || hasRole('editor') || hasRole('magazine_editor') || hasRole('magazine-editor');

  const fetchSubEditors = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/editor/sub-editors');
      setSubEditors(res.data?.data || []);
    } catch (err) {
      console.error(err);
      toast('Failed to load sub-editors.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (roleAllowed) {
      fetchSubEditors();
    }
  }, [roleAllowed]);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;

    setInviting(true);
    try {
      const res = await api.post('/admin/editor/sub-editors', {
        name: form.name.trim(),
        email: form.email.trim(),
      });
      toast(res.data?.message || 'Sub Editor linked successfully.', 'success');
      setForm({ name: '', email: '' });
      fetchSubEditors();
    } catch (err) {
      console.error(err);
      toast(err.response?.data?.message || 'Failed to recruit/link Sub Editor.', 'error');
    } finally {
      setInviting(false);
    }
  };

  const handleUnassign = async (subEditorId) => {
    if (!confirm('Are you sure you want to remove this Sub Editor from your recruits?')) return;
    setUnassigningId(subEditorId);
    try {
      await api.post(`/admin/editor/sub-editors/${subEditorId}/unassign`);
      toast('Sub Editor removed from your recruits.', 'success');
      fetchSubEditors();
    } catch (err) {
      console.error(err);
      toast('Failed to remove Sub Editor.', 'error');
    } finally {
      setUnassigningId(null);
    }
  };

  if (!roleAllowed) {
    return (
      <div className="rounded-xl border border-dashed border-red-200 bg-red-50 p-6 text-center text-xs text-red-700">
        Access restricted. This page is available to Editors and Administrators only.
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-300">
      <header className="border-b border-zinc-200 pb-5 dark:border-zinc-850">
        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-605">Editor Desk</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-zinc-950 dark:text-white flex items-center gap-2.5">
          <Users className="h-6 w-6 text-zinc-500" />
          My Sub Editors
        </h1>
        <p className="mt-2 text-sm text-zinc-550">
          Recruit or link Sub Editors to work under your desk. Invited accounts default to the password <span className="font-mono font-bold text-amber-600">Password123!</span>.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        {/* Recruits List */}
        <section className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
            Recruited Desk Accounts
          </h2>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-amber-605" />
            </div>
          ) : subEditors.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-200 bg-white p-8 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
              No Sub Editors have been linked to your desk yet.
            </div>
          ) : (
            <div className="space-y-3">
              {subEditors.map((sub) => (
                <div
                  key={sub.id}
                  className="rounded-xl border border-zinc-150 bg-white p-4 shadow-sm dark:border-zinc-850 dark:bg-zinc-900 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex-grow">
                    <h3 className="text-sm font-black text-zinc-950 dark:text-white truncate">{sub.name}</h3>
                    <p className="mt-1 text-xs text-zinc-450 truncate flex items-center gap-1">
                      <Mail className="h-3 w-3 inline" />
                      {sub.email}
                    </p>
                    <p className="mt-2 text-[10px] text-zinc-400">Linked on {new Date(sub.assigned_at).toLocaleDateString()}</p>
                  </div>
                  <button
                    type="button"
                    disabled={unassigningId === sub.id}
                    onClick={() => handleUnassign(sub.id)}
                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer disabled:opacity-50 shrink-0"
                    title="Remove link"
                  >
                    {unassigningId === sub.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recruitment Form */}
        <section className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
            Recruit / Link Sub Editor
          </h2>
          <form
            onSubmit={handleInvite}
            className="rounded-xl border border-zinc-150 bg-white p-5 shadow-sm dark:border-zinc-850 dark:bg-zinc-900 space-y-4"
          >
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-zinc-450 dark:text-zinc-500">Name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Full name"
                className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-xs dark:border-zinc-800 dark:bg-zinc-950 focus:outline-none focus:border-amber-500 transition-colors text-zinc-900 dark:text-zinc-100"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-zinc-450 dark:text-zinc-500">Email Address</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="email@example.com"
                className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-xs dark:border-zinc-800 dark:bg-zinc-950 focus:outline-none focus:border-amber-500 transition-colors text-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div className="rounded-xl border border-amber-500/10 bg-amber-500/[0.04] p-3 text-xs text-amber-805 dark:text-amber-400 flex items-start gap-2">
              <Info className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
              <div>
                <p className="font-bold">Account Mapping Rules</p>
                <ul className="list-disc pl-4 mt-1 space-y-1 font-medium text-zinc-550 dark:text-zinc-400">
                  <li>If the email does not exist, a new Sub Editor account is created instantly.</li>
                  <li>If the account already exists, it is upgraded to the Sub Editor role and linked.</li>
                </ul>
              </div>
            </div>

            <button
              type="submit"
              disabled={inviting || !form.name.trim() || !form.email.trim()}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50"
            >
              {inviting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              Recruit Sub Editor
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
