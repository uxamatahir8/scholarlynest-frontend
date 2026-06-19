'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { useToast } from '../../../../context/ToastContext';
import api from '../../../../utils/api';
import {
  Plus, Trash2, Edit3, Save, X, ChevronDown, ChevronUp,
  Loader2, CheckCircle2, AlertCircle, Eye, EyeOff, HelpCircle, ArrowLeft
} from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { ConfirmationModal } from '../../../../components/ui/ConfirmationModal';
import Link from 'next/link';

export default function FaqManagementWorkspace() {
  const { user, hasRole, hasPermission, loading: authLoading } = useAuth();
  const canDeleteRecords = hasRole('super_admin');
  const { toast } = useToast();

  // Data states
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Creation panel states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [newSortOrder, setNewSortOrder] = useState(0);
  const [newIsActive, setNewIsActive] = useState(true);
  const [creating, setCreating] = useState(false);

  // Editing states
  const [editingId, setEditingId] = useState(null);
  const [editQuestion, setEditQuestion] = useState('');
  const [editAnswer, setEditAnswer] = useState('');
  const [editSortOrder, setEditSortOrder] = useState(0);
  const [editIsActive, setEditIsActive] = useState(true);
  const [savingId, setSavingId] = useState(null);

  // Deleting state
  const [deletingId, setDeletingId] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmFaqId, setConfirmFaqId] = useState(null);

  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    setValidationErrors({});
  }, [isCreateOpen, editingId]);

  // Fetch FAQs
  const fetchFaqs = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const response = await api.get('/admin/faqs');
      setFaqs(response.data || []);
    } catch (err) {
      console.error('Failed to load FAQs', err);
      setErrorMsg('Failed to download the FAQ list from the database.');
      toast('Failed to load FAQs.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchFaqs();
    }
  }, [user, authLoading]);

  // Form validations
  const validateFaq = (question, answer) => {
    if (!question.trim()) {
      toast('Question is required.', 'error');
      return false;
    }
    if (question.length > 500) {
      toast('Question must be under 500 characters.', 'error');
      return false;
    }
    if (!answer.trim()) {
      toast('Answer is required.', 'error');
      return false;
    }
    return true;
  };

  // Handle Create
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setValidationErrors({});
    const errors = {};
    if (!newQuestion.trim()) {
      errors.newQuestion = 'Question is required.';
    } else if (newQuestion.length > 500) {
      errors.newQuestion = 'Question must be under 500 characters.';
    }
    if (!newAnswer.trim()) {
      errors.newAnswer = 'Answer is required.';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      setCreating(true);
      const response = await api.post('/admin/faqs', {
        question: newQuestion,
        answer: newAnswer,
        sort_order: parseInt(newSortOrder) || 0,
        is_active: newIsActive,
      });

      toast('FAQ created successfully!', 'success');
      setNewQuestion('');
      setNewAnswer('');
      setNewSortOrder(0);
      setNewIsActive(true);
      setIsCreateOpen(false);
      
      // Refresh list
      fetchFaqs();
    } catch (err) {
      console.error('Failed to create FAQ', err);
      toast(err.response?.data?.message || 'Error occurred while saving FAQ.', 'error');
    } finally {
      setCreating(false);
    }
  };

  // Start Edit Mode
  const startEdit = (faq) => {
    setEditingId(faq.id);
    setEditQuestion(faq.question);
    setEditAnswer(faq.answer);
    setEditSortOrder(faq.sort_order);
    setEditIsActive(faq.is_active);
  };

  // Cancel Edit Mode
  const cancelEdit = () => {
    setEditingId(null);
  };

  // Handle Update
  const handleUpdateSubmit = async (e, id) => {
    e.preventDefault();
    setValidationErrors({});
    const errors = {};
    if (!editQuestion.trim()) {
      errors.editQuestion = 'Question is required.';
    } else if (editQuestion.length > 500) {
      errors.editQuestion = 'Question must be under 500 characters.';
    }
    if (!editAnswer.trim()) {
      errors.editAnswer = 'Answer is required.';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      setSavingId(id);
      await api.put(`/admin/faqs/${id}`, {
        question: editQuestion,
        answer: editAnswer,
        sort_order: parseInt(editSortOrder) || 0,
        is_active: editIsActive,
      });

      toast('FAQ updated successfully!', 'success');
      setEditingId(null);
      
      // Refresh list
      fetchFaqs();
    } catch (err) {
      console.error('Failed to update FAQ', err);
      toast(err.response?.data?.message || 'Error occurred while updating FAQ.', 'error');
    } finally {
      setSavingId(null);
    }
  };

  // Handle Delete
  const handleDelete = async (id) => {
    if (!canDeleteRecords) return;
    try {
      setDeletingId(id);
      await api.delete(`/admin/faqs/${id}`);
      toast('FAQ deleted successfully.', 'success');
      fetchFaqs();
    } catch (err) {
      console.error('Failed to delete FAQ', err);
      toast('Failed to delete FAQ.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  // Toggle Is Active directly
  const handleToggleActive = async (faq) => {
    try {
      await api.put(`/admin/faqs/${faq.id}`, {
        is_active: !faq.is_active
      });
      toast(`FAQ is now ${!faq.is_active ? 'visible' : 'hidden'} on homepage.`, 'success');
      fetchFaqs();
    } catch (err) {
      console.error('Failed to toggle FAQ status', err);
      toast('Failed to update FAQ status.', 'error');
    }
  };

  if (authLoading || (loading && faqs.length === 0)) {
    return (
      <div className="flex-grow flex items-center justify-center p-12 min-h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
          <span className="text-xs text-[var(--muted)] font-mono uppercase tracking-widest font-bold">
            Acquiring FAQ Schema...
          </span>
        </div>
      </div>
    );
  }

  // Auth Guard
  if (!user || (!hasRole('super_admin') && !hasRole('admin') && !hasPermission('settings.manage'))) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl flex items-start space-x-4 animate-in fade-in slide-in-from-bottom-4">
        <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />
        <div>
          <h3 className="text-sm font-bold text-red-700 dark:text-red-400">Access Restricted</h3>
          <p className="text-xs text-red-600 dark:text-red-300 mt-1">
            You must possess administrative or settings manager privileges to update official platform FAQs.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 w-full space-y-6 animate-in fade-in duration-300 text-left">
      <title>Manage FAQs - ScholarlyNest</title>

      {/* Workspace Navigation Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-200/80 dark:border-zinc-800">
        <Link href="/admin" className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-[var(--muted)] hover:text-[var(--accent)] transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Overview
        </Link>
        <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
          <span>Console</span>
          <span>/</span>
          <span>CMS</span>
          <span>/</span>
          <span className="text-[var(--accent-gold)]">FAQs</span>
        </div>
      </div>

      {/* Hero Header */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-zinc-250/80 dark:border-zinc-800 shadow-md relative overflow-hidden bg-white/70 dark:bg-black/20">
        <div className="absolute top-0 left-0 w-2 h-full bg-[var(--accent-gold)]" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent-gold)] flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" /> CMS Inquiries Controller
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 mt-2">
              Frequently Asked Questions
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-medium mt-1">
              Configure, order, and deploy items to the public homepage FAQ accordion.
            </p>
          </div>
          <div>
            {!isCreateOpen && (
              <Button
                variant="primary"
                onClick={() => setIsCreateOpen(true)}
                icon={Plus}
              >
                Add New FAQ
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ERROR ALERT */}
      {errorMsg && (
        <div className="flex items-start space-x-3 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-350 rounded-xl">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wide">Sync Failure</h4>
            <p className="text-xs mt-1 font-medium">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* 1. CREATION CARD (EXPANDABLE) */}
      {isCreateOpen && (
        <div className="glass-panel p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-lg bg-zinc-50/50 dark:bg-zinc-900/30 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200/60 dark:border-zinc-800/80 mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--foreground)]">New FAQ Entry</h3>
            <button
              onClick={() => setIsCreateOpen(false)}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-250 transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Question Text</label>
              <input
                type="text"
                value={newQuestion}
                onChange={(e) => {
                  setNewQuestion(e.target.value);
                  if (validationErrors.newQuestion) {
                    setValidationErrors(prev => {
                      const copy = { ...prev };
                      delete copy.newQuestion;
                      return copy;
                    });
                  }
                }}
                placeholder="e.g. How can I submit a peer review report?"
                className={`w-full px-4 py-3 rounded-xl border bg-white dark:bg-zinc-950 text-sm font-medium focus:ring-2 focus:ring-[var(--accent)]/20 transition-all outline-none ${
                  validationErrors.newQuestion ? 'border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-500' : 'border-zinc-200/80 dark:border-zinc-800'
                }`}
              />
              {validationErrors.newQuestion && (
                <span className="text-red-500 text-[10px] font-bold mt-1 block">{validationErrors.newQuestion}</span>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Answer Explanation</label>
              <textarea
                rows={4}
                value={newAnswer}
                onChange={(e) => {
                  setNewAnswer(e.target.value);
                  if (validationErrors.newAnswer) {
                    setValidationErrors(prev => {
                      const copy = { ...prev };
                      delete copy.newAnswer;
                      return copy;
                    });
                  }
                }}
                placeholder="Provide a clear, detailed answer..."
                className={`w-full px-4 py-3 rounded-xl border bg-white dark:bg-zinc-950 text-sm font-medium focus:ring-2 focus:ring-[var(--accent)]/20 transition-all outline-none ${
                  validationErrors.newAnswer ? 'border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-500' : 'border-zinc-200/80 dark:border-zinc-800'
                }`}
              />
              {validationErrors.newAnswer && (
                <span className="text-red-500 text-[10px] font-bold mt-1 block">{validationErrors.newAnswer}</span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Sort Priority Order</label>
                <input
                  type="number"
                  value={newSortOrder}
                  onChange={(e) => setNewSortOrder(e.target.value)}
                  placeholder="e.g. 10 (Lower value displays first)"
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm font-medium focus:ring-2 focus:ring-[var(--accent)]/20 transition-all outline-none"
                />
              </div>

              <div className="flex items-center space-x-3 pt-6 sm:pt-7">
                <input
                  type="checkbox"
                  id="newIsActive"
                  checked={newIsActive}
                  onChange={(e) => setNewIsActive(e.target.checked)}
                  className="w-4.5 h-4.5 rounded border-zinc-300 text-[var(--accent)] focus:ring-[var(--accent)] cursor-pointer"
                />
                <label htmlFor="newIsActive" className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 cursor-pointer select-none">
                  Display live on Homepage immediately
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-zinc-150 dark:border-zinc-800">
              <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={creating}>
                Save FAQ
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* 2. FAQ CARDS LIST */}
      {loading ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" />
        </div>
      ) : faqs.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-zinc-350 dark:border-zinc-850 p-8 glass-panel">
          <HelpCircle className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
          <h3 className="font-serif text-lg font-bold text-zinc-700 dark:text-zinc-300">No FAQ Entries Exist</h3>
          <p className="text-xs text-[var(--muted)] mt-1 font-medium max-w-sm mx-auto">
            Get started by creating your first question and answer pair above.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {faqs.map((faq) => {
            const isEditing = editingId === faq.id;

            return (
              <div
                key={faq.id}
                className={`glass-panel rounded-2xl border transition-all duration-300 p-6 ${
                  isEditing 
                    ? 'border-[var(--accent)] bg-zinc-50/70 dark:bg-zinc-900/40 shadow-lg' 
                    : 'border-zinc-200/80 dark:border-zinc-850 bg-white/40 dark:bg-black/10 hover:border-zinc-300/80 dark:hover:border-zinc-700'
                }`}
              >
                {isEditing ? (
                  // EDITING MODE CARD FORM
                  <form onSubmit={(e) => handleUpdateSubmit(e, faq.id)} className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-200/50 dark:border-zinc-800">
                      <span className="text-[9px] font-bold text-[var(--accent-gold)] uppercase tracking-wider font-mono">Editing FAQ ID: {faq.id}</span>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="text-zinc-400 hover:text-zinc-600 transition-colors p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">Question text</label>
                      <input
                        type="text"
                        value={editQuestion}
                        onChange={(e) => {
                          setEditQuestion(e.target.value);
                          if (validationErrors.editQuestion) {
                            setValidationErrors(prev => {
                              const copy = { ...prev };
                              delete copy.editQuestion;
                              return copy;
                            });
                          }
                        }}
                        className={`w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-zinc-950 text-xs font-semibold outline-none ${
                          validationErrors.editQuestion ? 'border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-500' : 'border-zinc-200 dark:border-zinc-800'
                        }`}
                      />
                      {validationErrors.editQuestion && (
                        <span className="text-red-500 text-[10px] font-bold mt-1 block">{validationErrors.editQuestion}</span>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">Answer text</label>
                      <textarea
                        rows={4}
                        value={editAnswer}
                        onChange={(e) => {
                          setEditAnswer(e.target.value);
                          if (validationErrors.editAnswer) {
                            setValidationErrors(prev => {
                              const copy = { ...prev };
                              delete copy.editAnswer;
                              return copy;
                            });
                          }
                        }}
                        className={`w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-zinc-950 text-xs font-medium outline-none ${
                          validationErrors.editAnswer ? 'border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-500' : 'border-zinc-200 dark:border-zinc-800'
                        }`}
                      />
                      {validationErrors.editAnswer && (
                        <span className="text-red-500 text-[10px] font-bold mt-1 block">{validationErrors.editAnswer}</span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">Sort Order</label>
                        <input
                          type="number"
                          value={editSortOrder}
                          onChange={(e) => setEditSortOrder(e.target.value)}
                          className="w-full px-4 py-2 rounded-xl border border-zinc-200 bg-white dark:bg-zinc-950 text-xs font-semibold outline-none"
                        />
                      </div>

                      <div className="flex items-center space-x-3 pt-5">
                        <input
                          type="checkbox"
                          id={`editIsActive-${faq.id}`}
                          checked={editIsActive}
                          onChange={(e) => setEditIsActive(e.target.checked)}
                          className="w-4 h-4 rounded border-zinc-300 text-[var(--accent)] cursor-pointer"
                        />
                        <label htmlFor={`editIsActive-${faq.id}`} className="text-xs font-bold uppercase tracking-wider text-zinc-500 cursor-pointer">
                          Live Active
                        </label>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-2">
                      <Button type="button" variant="ghost" size="sm" onClick={cancelEdit}>
                        Discard
                      </Button>
                      <Button type="submit" variant="primary" size="sm" isLoading={savingId === faq.id}>
                        Save changes
                      </Button>
                    </div>
                  </form>
                ) : (
                  // STATIC READ MODE CARD
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-center space-x-3">
                        {/* Sort Order Badge */}
                        <span className="text-[10px] font-mono font-bold bg-[var(--accent)]/10 dark:bg-blue-500/10 text-[var(--accent)] dark:text-blue-400 px-2 py-0.5 rounded">
                          Order #{faq.sort_order}
                        </span>

                        {/* Visibility Badge */}
                        <button
                          onClick={() => handleToggleActive(faq)}
                          className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border cursor-pointer transition-colors ${
                            faq.is_active
                              ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30 hover:bg-emerald-100/60'
                              : 'bg-zinc-50 dark:bg-zinc-900/60 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100/60'
                          }`}
                        >
                          {faq.is_active ? (
                            <>
                              <Eye className="w-3 h-3 mr-0.5" />
                              <span>Live</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3 mr-0.5" />
                              <span>Hidden</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="flex items-center space-x-2">
                        {/* Edit Button */}
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => startEdit(faq)}
                          icon={Edit3}
                        >
                          Edit
                        </Button>

                        {/* Delete Button */}
                        {canDeleteRecords && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => {
                              setConfirmFaqId(faq.id);
                              setIsConfirmOpen(true);
                            }}
                            isLoading={deletingId === faq.id}
                            icon={Trash2}
                          />
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-serif font-bold text-base text-zinc-850 dark:text-zinc-150 leading-snug">
                        {faq.question}
                      </h4>
                      <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium pt-1 whitespace-pre-line">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={canDeleteRecords && isConfirmOpen}
        title="Delete FAQ?"
        message="Are you absolutely sure you want to delete this FAQ entry? This will permanently remove it from the platform."
        confirmText="Delete FAQ"
        cancelText="Cancel"
        onConfirm={() => {
          if (confirmFaqId) {
            handleDelete(confirmFaqId);
          }
          setIsConfirmOpen(false);
        }}
        onCancel={() => {
          setIsConfirmOpen(false);
          setConfirmFaqId(null);
        }}
        variant="danger"
        isLoading={deletingId !== null}
      />
    </div>
  );
}
