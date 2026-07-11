'use client';

import { safeApiMessage } from '../../../../utils/safeErrors';
import { logError } from '../../../../utils/safeLogger';
import React, { useEffect, useState } from 'react';
import { Users, UserPlus, Trash2, Loader2, Mail, Info } from 'lucide-react';
import api from '../../../../utils/api';
import { useAuth } from '../../../../context/AuthContext';
import { useToast } from '../../../../context/ToastContext';
import { useRouter } from 'next/navigation';
import { subEditorInviteSchema, validateWithZod } from '../../../../lib/validation';

export default function MySubEditorsPage() {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [subEditors, setSubEditors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [unassigningId, setUnassigningId] = useState(null);
  
  const [form, setForm] = useState({ name: '', email: '' });
  const [formErrors, setFormErrors] = useState({});

  const isEditor = hasRole('editor');
  const roleAllowed = isEditor;

  useEffect(() => {
    if (user) {
      if (hasRole('super_admin') || hasRole('admin')) {
        router.push('/admin/rbac');
      }
    }
  }, [user, router, hasRole]);

  const fetchSubEditors = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/editor/sub-editors');
      setSubEditors(res.data?.data || []);
    } catch (err) {
      logError(err);
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
    const validation = validateWithZod(subEditorInviteSchema, form);
    setFormErrors(validation.errors);
    if (!validation.success) {
      toast(Object.values(validation.errors)[0] || validation.message, 'error');
      return;
    }

    setInviting(true);
    try {
      const res = await api.post('/admin/editor/sub-editors', {
        name: form.name.trim(),
        email: form.email.trim(),
      });
      toast(res.data?.message || 'Sub Editor linked successfully.', 'success');
      setForm({ name: '', email: '' });
      setFormErrors({});
      fetchSubEditors();
    } catch (err) {
      logError(err);
      toast(safeApiMessage(err, 'Failed to recruit/link Sub Editor.'), 'error');
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
      logError(err);
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
          Recruit or link Sub Editors to work under your desk. New accounts receive a secure email link to set their own password.
        </p>
        <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-400 rounded-xl text-xs flex items-center gap-2">
          <Info className="h-4 w-4 text-blue-500 shrink-0" />
          <span>New Sub Editors are automatically linked to your editor account.</span>
        </div>
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
              {subEditors.map((sub) => {
                const isFinalLink = sub.editors_count <= 1;
                return (
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
                      <p className="mt-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        ✓ Assigned to your editor desk
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={unassigningId === sub.id || isFinalLink}
                      onClick={() => handleUnassign(sub.id)}
                      className={`p-2 rounded-xl transition-all shrink-0 ${isFinalLink ? 'text-zinc-300 dark:text-zinc-700 cursor-not-allowed' : 'text-red-500 hover:bg-red-500/10 cursor-pointer disabled:opacity-50'}`}
                      title={isFinalLink ? "Automatically assigned to your desk. A Sub Editor must retain at least one Editor." : "Remove link"}
                    >
                      {unassigningId === sub.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                );
              })}
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
                value={form.name}
                onChange={(e) => {
                  setForm({ ...form, name: e.target.value });
                  if (formErrors.name) setFormErrors((current) => ({ ...current, name: '' }));
                }}
                placeholder="Full name"
                aria-invalid={Boolean(formErrors.name)}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-xs dark:border-zinc-800 dark:bg-zinc-950 focus:outline-none focus:border-amber-500 transition-colors text-zinc-900 dark:text-zinc-100"
              />
              {formErrors.name && <p className="text-[10px] font-semibold text-red-600 dark:text-red-400">{formErrors.name}</p>}
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-zinc-450 dark:text-zinc-500">Email Address</label>
              <input
                type="text"
                value={form.email}
                onChange={(e) => {
                  setForm({ ...form, email: e.target.value });
                  if (formErrors.email) setFormErrors((current) => ({ ...current, email: '' }));
                }}
                placeholder="email@example.com"
                aria-invalid={Boolean(formErrors.email)}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-xs dark:border-zinc-800 dark:bg-zinc-950 focus:outline-none focus:border-amber-500 transition-colors text-zinc-900 dark:text-zinc-100"
              />
              {formErrors.email && <p className="text-[10px] font-semibold text-red-600 dark:text-red-400">{formErrors.email}</p>}
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
