'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { 
  ArrowLeft, Plus, Edit3, Trash2, BookOpen, Settings, Loader2, 
  AlertCircle, X, Check, Code, Save, FileText, ChevronRight 
} from 'lucide-react';
import api from '../../../../../utils/api';
import { useToast } from '../../../../../context/ToastContext';

const RichEditor = dynamic(() => import('../../../../../components/ui/RichEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-8 bg-zinc-50 border border-zinc-200 rounded-xl">
      <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
      <span className="ml-3 text-xs font-bold text-zinc-500 uppercase tracking-widest font-mono">Loading Editor Workspace...</span>
    </div>
  )
});

export default function AdminMagazinePages() {
  const params = useParams();
  const router = useRouter();
  const slug = params ? params.slug : null;
  const { toast } = useToast();

  const [magazine, setMagazine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form States (for creating/updating page content)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [selectedPageId, setSelectedPageId] = useState(null);
  
  const [pageTitle, setPageTitle] = useState('');
  const [pageContent, setPageContent] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [editorMode, setEditorMode] = useState('visual'); // 'visual' | 'html'
  const [saving, setSaving] = useState(false);

  const fetchMagazineDetails = async () => {
    if (!slug) return;
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/magazines/${slug}`);
      setMagazine(response.data);
    } catch (err) {
      console.error(err);
      setError('Could not locate the selected magazine issues or related subpages.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMagazineDetails();
  }, [slug]);

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedPageId(null);
    setPageTitle('');
    setPageContent('');
    setSortOrder(magazine?.pages?.length ? magazine.pages.length + 1 : 1);
    setEditorMode('visual');
    setIsModalOpen(true);
  };

  const openEditModal = (pageObj) => {
    setModalMode('edit');
    setSelectedPageId(pageObj.id);
    setPageTitle(pageObj.title || '');
    setPageContent(pageObj.content || '');
    setSortOrder(pageObj.sort_order || 0);
    setEditorMode('visual');
    setIsModalOpen(true);
  };

  // Submit page creation/update
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pageTitle.trim()) {
      toast('Page title is required.', 'error');
      return;
    }
    if (!pageContent.trim() || pageContent === '<p><br></p>') {
      toast('Page content cannot be empty.', 'error');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        title: pageTitle,
        content: pageContent,
        sort_order: sortOrder
      };

      if (modalMode === 'create') {
        await api.post(`/admin/magazines/${magazine.id}/pages`, payload);
        toast('New subpage created and ordered successfully.', 'success');
      } else {
        await api.put(`/admin/magazines/${magazine.id}/pages/${selectedPageId}`, payload);
        toast('Subpage updated successfully.', 'success');
      }

      setIsModalOpen(false);
      fetchMagazineDetails();
    } catch (err) {
      console.error(err);
      toast('Failed to save page changes.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Delete page
  const handleDeletePage = async (pageId) => {
    if (!window.confirm('Are you sure you want to delete this custom page? This cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/admin/magazines/${magazine.id}/pages/${pageId}`);
      toast('Custom subpage deleted successfully.', 'success');
      fetchMagazineDetails();
    } catch (err) {
      console.error(err);
      toast('Failed to delete custom subpage.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-mono">Resolving Magazine Pages...</span>
      </div>
    );
  }

  if (error || !magazine) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="text-sm font-semibold text-zinc-650">{error || 'Magazine not found.'}</p>
        <Link href="/admin/magazines" className="text-xs font-bold text-[var(--accent)] uppercase tracking-wider hover:underline">
          Return to Registry Manager
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation Headers */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
        <Link href="/admin/magazines" className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-[var(--accent)] transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Magazines
        </Link>
        <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
          <span>Console</span>
          <ChevronRight className="w-3 h-3 text-[var(--accent-gold)]" />
          <span>Magazines</span>
          <ChevronRight className="w-3 h-3 text-[var(--accent-gold)]" />
          <span className="text-zinc-600 truncate max-w-[150px]">{magazine.title}</span>
        </div>
      </div>

      {/* Hero card details */}
      <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent-gold)] px-2 py-0.5 rounded bg-[var(--accent-gold)]/5 border border-[var(--accent-gold)]/10 inline-block">
          Active Layout Profile
        </span>
        <h1 className="text-xl font-bold text-zinc-950">{magazine.title}</h1>
        <p className="text-xs text-zinc-500 font-medium leading-relaxed max-w-2xl">{magazine.description}</p>
      </div>

      {/* Pages Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-800">Custom Sorted Sidebar Pages</h2>
            <p className="text-[11px] text-zinc-500 font-medium mt-0.5">Control pages appearing in the magazine's public directory menu.</p>
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-[var(--accent)] hover:bg-[var(--accent)]/95 shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Custom Page</span>
          </button>
        </div>

        {/* Page Table/List */}
        {!magazine.pages || magazine.pages.length === 0 ? (
          <div className="text-center py-16 bg-white border border-zinc-200 rounded-2xl shadow-sm">
            <BookOpen className="w-10 h-10 mx-auto text-zinc-300 mb-2.5" />
            <p className="text-xs font-semibold text-zinc-500">No custom pages have been configured for this magazine.</p>
            <button onClick={openCreateModal} className="mt-2.5 text-xs font-bold uppercase tracking-wider text-[var(--accent)] hover:underline cursor-pointer">Add First Page</button>
          </div>
        ) : (
          <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    <th className="px-6 py-4">Sort Order</th>
                    <th className="px-6 py-4">Page Title</th>
                    <th className="px-6 py-4">URL Slug</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-150 text-xs font-semibold text-zinc-700">
                  {magazine.pages.map((p) => (
                    <tr key={p.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded bg-zinc-100 border border-zinc-200 text-[10px] font-bold font-mono">
                          {p.sort_order}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-zinc-950">{p.title}</td>
                      <td className="px-6 py-4 font-mono text-[11px] text-zinc-500">/{p.slug}</td>
                      <td className="px-6 py-4 text-right space-x-3">
                        <button
                          onClick={() => openEditModal(p)}
                          className="inline-flex items-center space-x-1 text-[10px] font-bold uppercase text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeletePage(p.id)}
                          className="inline-flex items-center space-x-1 text-[10px] font-bold uppercase text-red-600 hover:text-red-800 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* CREATE & EDIT MODAL OVERLAY */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-zinc-250 shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[95vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-zinc-150 flex items-center justify-between bg-zinc-50">
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-900">
                {modalMode === 'create' ? 'Create Custom Subpage' : 'Edit Subpage Content'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-grow flex flex-col min-h-[400px]">
              
              {/* Row Grid: Title & Sort Order */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="sm:col-span-3 space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono">Page Title *</label>
                  <input 
                    type="text"
                    value={pageTitle}
                    onChange={(e) => setPageTitle(e.target.value)}
                    placeholder="e.g. Editorial Board & Advisory Committee"
                    className="w-full text-xs font-semibold px-3 py-2.5 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-400 transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono">Sort Order *</label>
                  <input 
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                    placeholder="e.g. 1"
                    className="w-full text-xs font-semibold px-3 py-2.5 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-400 transition-colors font-mono"
                  />
                </div>
              </div>

              {/* Editor Workspace Controls */}
              <div className="flex items-center justify-between pt-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  Page Markup Content *
                </label>

                {/* Toggler */}
                <div className="inline-flex rounded-xl p-1 bg-zinc-100 border border-zinc-200/50">
                  <button
                    type="button"
                    onClick={() => setEditorMode('visual')}
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer ${
                      editorMode === 'visual'
                        ? 'bg-white shadow text-[var(--accent)]'
                        : 'text-zinc-500 hover:text-zinc-800'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Visual Editor</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorMode('html')}
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer ${
                      editorMode === 'html'
                        ? 'bg-white shadow text-[var(--accent)]'
                        : 'text-zinc-500 hover:text-zinc-800'
                    }`}
                  >
                    <Code className="w-3.5 h-3.5" />
                    <span>Raw HTML Markup</span>
                  </button>
                </div>
              </div>

              {/* Content Panel */}
              <div className="flex-grow min-h-[300px] flex flex-col relative">
                {editorMode === 'visual' ? (
                  <div className="flex-grow flex flex-col relative">
                    <RichEditor
                      value={pageContent}
                      onChange={(content) => setPageContent(content)}
                      placeholder="Start writing guidelines, resources, or policies..."
                    />
                  </div>
                ) : (
                  <div className="flex-grow flex flex-col relative">
                    <textarea
                      value={pageContent}
                      onChange={(e) => setPageContent(e.target.value)}
                      placeholder="<!-- Custom HTML content goes here -->"
                      rows={12}
                      style={{ color: '#ffffff' }}
                      className="w-full flex-grow font-mono text-xs p-4 bg-zinc-900 text-white border border-zinc-850 rounded-xl focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                    />
                  </div>
                )}
              </div>

              {/* Form buttons */}
              <div className="pt-4 border-t border-zinc-150 flex items-center justify-end space-x-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-zinc-500 bg-zinc-100 hover:bg-zinc-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-[var(--accent)] hover:bg-[var(--accent)]/95 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>Publish Subpage</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
