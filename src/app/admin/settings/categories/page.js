'use client';

import { safeApiMessage } from '../../../../utils/safeErrors';
import { logError } from '../../../../utils/safeLogger';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { useToast } from '../../../../context/ToastContext';
import api from '../../../../utils/api';
import {
  Plus, Trash2, Edit3, X, Loader2, AlertCircle, HelpCircle, ArrowLeft, BookOpen
} from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { ConfirmationModal } from '../../../../components/ui/ConfirmationModal';
import Link from 'next/link';

export default function ArticleCategoryManagement() {
  const { user, hasRole, hasPermission, loading: authLoading } = useAuth();
  const canDeleteRecords = hasRole('super_admin');
  const { toast } = useToast();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Deletion states
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const response = await api.get('/article-categories');
      setCategories(response.data || []);
    } catch (err) {
      logError('Failed to load categories', err);
      setErrorMsg('Failed to fetch article categories from the server.');
      toast('Failed to load categories.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchCategories();
    }
  }, [user, authLoading]);

  const handleEdit = (category) => {
    setEditingId(category.id);
    setName(category.name);
    setDescription(category.description || '');
    setIsActive(category.is_active);
    setIsFormOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setIsActive(true);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast('Name is required.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: name.trim(),
        description: description.trim(),
        is_active: isActive
      };

      if (editingId) {
        await api.put(`/admin/article-categories/${editingId}`, payload);
        toast('Category updated successfully!', 'success');
      } else {
        await api.post('/admin/article-categories', payload);
        toast('Category created successfully!', 'success');
      }

      setIsFormOpen(false);
      fetchCategories();
    } catch (err) {
      logError('Failed to save category', err);
      toast(safeApiMessage(err, 'Error occurred while saving.'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setDeletingId(id);
      await api.delete(`/admin/article-categories/${id}`);
      toast('Category deleted successfully.', 'success');
      fetchCategories();
    } catch (err) {
      logError('Failed to delete category', err);
      toast(safeApiMessage(err, 'Failed to delete category.'), 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (category) => {
    try {
      await api.put(`/admin/article-categories/${category.id}`, {
        is_active: !category.is_active
      });
      toast(`Category status updated.`, 'success');
      fetchCategories();
    } catch (err) {
      logError('Failed to toggle status', err);
      toast('Failed to update status.', 'error');
    }
  };

  if (authLoading || (loading && categories.length === 0)) {
    return (
      <div className="flex-grow flex items-center justify-center p-12 min-h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
          <span className="text-xs text-[var(--muted)] font-mono uppercase tracking-widest font-bold animate-pulse">
            Acquiring Categories...
          </span>
        </div>
      </div>
    );
  }

  if (!user || (!hasRole('super_admin') && !hasRole('admin') && !hasPermission('settings.manage'))) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl flex items-start space-x-4">
        <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />
        <div>
          <h3 className="text-sm font-bold text-red-700 dark:text-red-400">Access Restricted</h3>
          <p className="text-xs text-red-600 dark:text-red-300 mt-1">
            You must possess administrative privileges to manage metadata settings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 w-full space-y-6 animate-in fade-in duration-300 text-left">
      <title>Manage Categories - ScholarlyNest</title>

      <div className="flex items-center justify-between pb-4 border-b border-zinc-200/80 dark:border-zinc-800">
        <Link href="/admin" className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-[var(--muted)] hover:text-[var(--accent)] transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Overview
        </Link>
        <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
          <span>Console</span>
          <span>/</span>
          <span>Settings</span>
          <span>/</span>
          <span className="text-[var(--accent-gold)]">Categories</span>
        </div>
      </div>

      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-zinc-250/80 dark:border-zinc-800 shadow-md relative overflow-hidden bg-white/70 dark:bg-black/20">
        <div className="absolute top-0 left-0 w-2 h-full bg-[var(--accent-gold)]" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent-gold)] flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" /> Categories System
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 mt-2">
              Manage Article Categories
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-medium mt-1">
              Add and update administrative categories for manuscripts.
            </p>
          </div>
          <div>
            {!isFormOpen && (
              <Button variant="primary" onClick={handleOpenCreate} icon={Plus}>
                Add Category
              </Button>
            )}
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-start space-x-3 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-350 rounded-xl">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wide">Sync Failure</h4>
            <p className="text-xs mt-1 font-medium">{errorMsg}</p>
          </div>
        </div>
      )}

      {isFormOpen && (
        <div className="glass-panel p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-lg bg-zinc-50/50 dark:bg-zinc-900/30 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200/60 dark:border-zinc-800/80 mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--foreground)]">
              {editingId ? 'Edit Category' : 'New Category'}
            </h3>
            <button onClick={() => setIsFormOpen(false)} className="text-zinc-400 hover:text-zinc-655 transition-colors p-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Original Research"
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-semibold focus:ring-2 focus:ring-[var(--accent)]/20 transition-all outline-none"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe this category..."
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-955 text-xs font-semibold focus:ring-2 focus:ring-[var(--accent)]/20 transition-all outline-none"
              />
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4.5 h-4.5 rounded border-zinc-300 text-[var(--accent)] focus:ring-[var(--accent)] cursor-pointer"
              />
              <label htmlFor="isActive" className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 cursor-pointer select-none">
                Mark as Active
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-zinc-150 dark:border-zinc-800">
              <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={submitting}>
                Save Details
              </Button>
            </div>
          </form>
        </div>
      )}

      {categories.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-zinc-350 dark:border-zinc-850 p-8 glass-panel">
          <HelpCircle className="w-12 h-12 text-zinc-355 mx-auto mb-3" />
          <h3 className="font-serif text-lg font-bold text-zinc-700 dark:text-zinc-300">No Categories Configured</h3>
          <p className="text-xs text-[var(--muted)] mt-1 font-medium max-w-sm mx-auto">
            Get started by adding your first article category classification.
          </p>
        </div>
      ) : (
        <div className="glass-panel overflow-hidden border border-zinc-200/80 dark:border-zinc-800 rounded-2xl bg-white/70 dark:bg-black/10 shadow-sm">
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800 text-left">
            <thead className="bg-zinc-50 dark:bg-zinc-950/40">
              <tr>
                <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-zinc-500">Name</th>
                <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-zinc-500">Description</th>
                <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-zinc-500">Status</th>
                <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-zinc-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-medium text-xs">
              {categories.map((category) => (
                <tr key={category.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 transition-colors">
                  <td className="px-6 py-4 font-bold text-zinc-900 dark:text-white">{category.name}</td>
                  <td className="px-6 py-4 text-zinc-550 dark:text-zinc-400 max-w-xs truncate">{category.description || <em className="text-zinc-400">None</em>}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleActive(category)}
                      className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border cursor-pointer transition-colors ${
                        category.is_active
                          ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30 hover:bg-emerald-100/60'
                          : 'bg-zinc-50 dark:bg-zinc-900/60 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100/60'
                      }`}
                    >
                      {category.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Button variant="secondary" size="sm" onClick={() => handleEdit(category)} icon={Edit3}>
                      Edit
                    </Button>
                    {canDeleteRecords && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          setConfirmId(category.id);
                          setIsConfirmOpen(true);
                        }}
                        isLoading={deletingId === category.id}
                        icon={Trash2}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmationModal
        isOpen={canDeleteRecords && isConfirmOpen}
        title="Delete Category?"
        message="Are you sure you want to delete this category? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={() => {
          if (confirmId) {
            handleDelete(confirmId);
          }
          setIsConfirmOpen(false);
        }}
        onCancel={() => {
          setIsConfirmOpen(false);
          setConfirmId(null);
        }}
        variant="danger"
        isLoading={deletingId !== null}
      />
    </div>
  );
}
