'use client';

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Plus, Edit2, Trash2, FileText, Settings, Loader2, 
  AlertCircle, X, Check, ArrowRight, Image as ImageIcon, Upload, Save,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import api from '../../../utils/api';
import { useToast } from '../../../context/ToastContext';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
import { useAuth } from '../../../context/AuthContext';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const QuillEditor = dynamic(() => import('../../../components/ui/QuillEditor'), { 
  ssr: false,
  loading: () => (
    <div className="h-32 w-full bg-[var(--background)] animate-pulse border border-[var(--muted-border)] rounded-lg flex items-center justify-center text-[var(--muted)] font-mono uppercase tracking-widest text-[10px] font-bold">
      Loading editor...
    </div>
  )
});

export default function AdminMagazines() {
  const { toast } = useToast();
  const { user, hasPermission, loading: authLoading } = useAuth();
  
  const [magazines, setMagazines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Form States (for Create & Edit modals)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [selectedMagazineId, setSelectedMagazineId] = useState(null);
  
  const [title, setTitle] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [coverImageFileName, setCoverImageFileName] = useState('');
  const [description, setDescription] = useState('');
  const [aboutText, setAboutText] = useState('');
  const [saving, setSaving] = useState(false);

  // Fetch all magazines
  const fetchMagazines = async () => {
    if (!hasPermission('magazines.view-any') && !hasPermission('magazines.view-own')) return;
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/magazines', {
        params: { page, per_page: 8 }
      });
      setMagazines(response.data.data || []);
      setTotalPages(response.data.last_page || 1);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch the registered magazines database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchMagazines();
    }
  }, [user, authLoading, page]);

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedMagazineId(null);
    setTitle('');
    setCoverImage('');
    setCoverImageFile(null);
    setCoverImageFileName('');
    setDescription('');
    setAboutText('');
    setIsModalOpen(true);
  };

  const openEditModal = (mag) => {
    setModalMode('edit');
    setSelectedMagazineId(mag.id);
    setTitle(mag.title || '');
    setCoverImage(mag.cover_image || '');
    setCoverImageFile(null);
    setCoverImageFileName('');
    setDescription(mag.description || '');
    setAboutText(mag.about_text || '');
    setIsModalOpen(true);
  };

  // Submit create or edit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast('Title is required to index the magazine.', 'error');
      return;
    }

    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description || '');
      formData.append('about_text', aboutText || '');

      if (coverImageFile) {
        formData.append('cover_image', coverImageFile);
      } else {
        formData.append('cover_image', coverImage || '');
      }

      if (modalMode === 'create') {
        await api.post('/admin/magazines', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast('New scientific magazine cataloged successfully.', 'success');
      } else {
        formData.append('_method', 'PUT');
        await api.post(`/admin/magazines/${selectedMagazineId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast('Magazine metadata updated successfully.', 'success');
      }

      setIsModalOpen(false);
      setCoverImageFile(null);
      setCoverImageFileName('');
      fetchMagazines();
    } catch (err) {
      console.error(err);
      toast('Failed to save magazine modifications.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Delete magazine
  const handleDelete = async (id) => {
    if (!window.confirm('Are you absolutely sure you want to delete this magazine? This will delete all associated pages, articles, and documents permanently.')) {
      return;
    }

    try {
      await api.delete(`/admin/magazines/${id}`);
      toast('Magazine and all associated content deleted successfully.', 'success');
      fetchMagazines();
    } catch (err) {
      console.error(err);
      toast('Failed to delete magazine catalog.', 'error');
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

  if (!user || (!hasPermission('magazines.view-any') && !hasPermission('magazines.view-own'))) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl flex items-start space-x-4 animate-in fade-in slide-in-from-bottom-4">
        <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />
        <div>
          <h3 className="text-sm font-bold text-red-700 dark:text-red-400">Access Restricted</h3>
          <p className="text-xs text-red-600 dark:text-red-300 mt-1">
            You must possess magazine directory viewing privileges to list publications.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <title>Magazines Manager - ScholarlyNest</title>
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]">Magazines Directory Manager</h1>
          <p className="text-xs text-[var(--muted)] font-medium mt-1">Create, update, and manage ScholarlyNest publication issues, covers, and layouts.</p>
        </div>
        {hasPermission('magazines.create') && (
          <Button
            onClick={openCreateModal}
            variant="primary"
            size="sm"
            className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white shadow-md cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Magazine</span>
          </Button>
        )}
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 space-y-4 glass-panel border border-[var(--muted-border)]/60 rounded-2xl">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)] dark:text-blue-400" />
          <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest font-mono">Querying Magazines Registry...</span>
        </div>
      )}

      {error && (
        <div className="flex items-center space-x-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="font-semibold text-xs leading-none">{error}</span>
        </div>
      )}

      {!loading && !error && magazines.length === 0 && (
        <div className="text-center py-20 glass-panel border border-[var(--muted-border)]/60 rounded-2xl">
          <BookOpen className="w-12 h-12 mx-auto text-[var(--muted)] mb-3" />
          <p className="text-sm font-semibold text-[var(--muted)]">No magazines are currently cataloged.</p>
          {hasPermission('magazines.create') && (
            <button onClick={openCreateModal} className="mt-3 text-xs font-bold uppercase tracking-wider text-[var(--accent-gold)] hover:underline cursor-pointer">Register One Now</button>
          )}
        </div>
      )}

      {!loading && !error && magazines.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-in fade-in duration-300">
            {magazines.map((mag) => (
              <div 
                key={mag.id}
                className="glass-panel border border-[var(--muted-border)]/60 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 hover-glow transition-all duration-300 flex flex-col justify-between overflow-hidden bg-[var(--card-bg)]"
              >
                {/* Header image cover preview */}
                <Link 
                  href={`/admin/magazines/${mag.slug}/pages`}
                  className="block h-40 w-full relative bg-[var(--background)] border-b border-[var(--muted-border)]/60 overflow-hidden cursor-pointer"
                >
                  {mag.cover_image ? (
                    <img src={mag.cover_image} alt={mag.title} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--muted)]">
                      <ImageIcon className="w-10 h-10 opacity-50" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-zinc-950/85 backdrop-blur-md text-[9px] font-bold text-white uppercase tracking-widest border border-white/10 z-10">
                    {mag.articles_count} Papers
                  </div>
                </Link>

                {/* Body */}
                <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                  <div className="space-y-1">
                    <Link href={`/admin/magazines/${mag.slug}/pages`} className="block hover:underline">
                      <h3 className="text-base font-bold text-[var(--foreground)] leading-snug line-clamp-1 cursor-pointer">{mag.title}</h3>
                    </Link>
                    <p className="text-xs text-[var(--muted)] line-clamp-2 leading-relaxed font-medium">{mag.description || 'No description summary drafted.'}</p>
                  </div>

                  <div className="flex items-center space-x-2 pt-2 border-t border-[var(--muted-border)]/50">
                    <Link 
                      href={`/admin/magazines/${mag.slug}/pages`}
                      className="flex-1 inline-flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg bg-[var(--background)] hover:bg-[var(--foreground)]/5 text-[var(--foreground)] text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer border border-[var(--muted-border)]"
                    >
                      <Settings className="w-3.5 h-3.5 text-[var(--accent-gold)]" />
                      <span>Pages</span>
                    </Link>
                    <Link 
                      href={`/magazines/${mag.slug}`}
                      target="_blank"
                      className="inline-flex items-center justify-center p-2 rounded-lg bg-[var(--background)] hover:bg-[var(--foreground)]/5 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors border border-[var(--muted-border)]"
                      title="View Public Page"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                {/* Footer controls */}
                {(hasPermission('magazines.edit') || hasPermission('magazines.delete')) && (
                  <div className="px-5 py-3.5 bg-black/5 dark:bg-white/5 border-t border-[var(--muted-border)]/60 flex items-center justify-between">
                    {hasPermission('magazines.edit') ? (
                      <button
                        onClick={() => openEditModal(mag)}
                        className="inline-flex items-center space-x-1 text-[10px] font-bold uppercase tracking-wider text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    ) : <div />}
                    
                    {hasPermission('magazines.delete') && (
                      <button
                        onClick={() => handleDelete(mag.id)}
                        className="inline-flex items-center space-x-1 text-[10px] font-bold uppercase tracking-wider text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Centered Pagination Controls with appropriate spacing */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 pt-12 pb-6 animate-in fade-in duration-300">
              <button
                type="button"
                onClick={() => {
                  setPage((prev) => Math.max(prev - 1, 1));
                  if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={page === 1}
                className="inline-flex items-center justify-center p-2.5 rounded-xl border border-[var(--muted-border)] bg-[var(--card-bg)] hover:bg-[var(--foreground)]/5 disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer text-[var(--foreground)]"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setPage(p);
                    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`inline-flex items-center justify-center w-10 h-10 rounded-xl border font-mono text-xs font-bold transition-all cursor-pointer ${
                    page === p
                      ? 'bg-[var(--accent)] border-[var(--accent)] text-white shadow-md'
                      : 'border-[var(--muted-border)] bg-[var(--card-bg)] hover:bg-[var(--foreground)]/5 text-[var(--foreground)]'
                  }`}
                >
                  {p}
                </button>
              ))}

              <button
                type="button"
                onClick={() => {
                  setPage((prev) => Math.min(prev + 1, totalPages));
                  if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={page === totalPages}
                className="inline-flex items-center justify-center p-2.5 rounded-xl border border-[var(--muted-border)] bg-[var(--card-bg)] hover:bg-[var(--foreground)]/5 disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer text-[var(--foreground)]"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}

      {/* CREATE & EDIT MODAL OVERLAY */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="glass-panel bg-[var(--card-bg)] text-[var(--foreground)] rounded-2xl border border-[var(--muted-border)] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[var(--muted-border)]/60 flex items-center justify-between bg-black/5 dark:bg-white/5">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--foreground)]">
                {modalMode === 'create' ? 'Create New Magazine' : 'Edit Magazine Metadata'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-1.5 rounded-lg text-[var(--muted)] hover:bg-[var(--foreground)]/5 hover:text-[var(--foreground)] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-grow text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] font-mono">Magazine Title *</label>
                <input 
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Journal of Computing Telemetry"
                  className="w-full text-xs font-semibold px-3 py-2.5 bg-[var(--background)] border border-[var(--muted-border)] rounded-lg focus:outline-none focus:border-[var(--accent)] transition-colors"
                />
              </div>

              <div className="space-y-3 p-3 bg-black/5 dark:bg-white/5 border border-[var(--muted-border)]/50 rounded-xl">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] font-mono block">Upload Cover Image</label>
                  <div className="flex items-center space-x-3">
                    <label className="inline-flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider text-[var(--foreground)] bg-[var(--background)] hover:bg-[var(--foreground)]/5 transition-colors cursor-pointer border border-[var(--muted-border)]">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Choose File</span>
                      <input 
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setCoverImageFile(e.target.files[0]);
                            setCoverImageFileName(e.target.files[0].name);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                    <span className="text-[11px] text-[var(--muted)] font-mono font-medium truncate max-w-[200px]">{coverImageFileName || 'No file chosen'}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] font-mono block">Or Cover Image URL</label>
                  <input 
                    type="text"
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    placeholder="/images/nature_computing.png"
                    className="w-full text-xs font-semibold px-3 py-2.5 bg-[var(--background)] border border-[var(--muted-border)] rounded-lg focus:outline-none focus:border-[var(--accent)] transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] font-mono">Short Description (Grid Summary)</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="A short overview describing target science sectors..."
                  rows={2}
                  className="w-full text-xs font-semibold px-3 py-2.5 bg-[var(--background)] border border-[var(--muted-border)] rounded-lg focus:outline-none focus:border-[var(--accent)] transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] font-mono block">Comprehensive About Section (Rich Text / Detail Page)</label>
                <div className="quill-premium-wrapper quill-magazine-wrapper border border-[var(--muted-border)] rounded-lg overflow-hidden bg-[var(--background)]">
                  <QuillEditor 
                    value={aboutText} 
                    onChange={setAboutText} 
                    placeholder="Details regarding editorial governance, board directory members, scope, history, etc..."
                  />
                </div>
              </div>

              {/* Submit panel */}
              <div className="pt-4 border-t border-[var(--muted-border)]/65 flex items-center justify-end space-x-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs border border-[var(--muted-border)] hover:bg-[var(--foreground)]/5 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  variant="primary"
                  size="sm"
                  className="inline-flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{modalMode === 'create' ? 'Catalog Issue' : 'Save Changes'}</span>
                </Button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
