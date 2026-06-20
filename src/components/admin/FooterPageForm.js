'use client';

import { safeApiMessage } from '../../utils/safeErrors';
import { logError } from '../../utils/safeLogger';
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useToast } from '../../context/ToastContext';
import api from '../../utils/api';
import { Loader2, Save, X, Edit3, Code } from 'lucide-react';

const RichEditor = dynamic(() => import('../ui/RichEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-12 bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-200 dark:border-zinc-800 rounded-xl">
      <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
      <span className="ml-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Loading Editor Workspace...</span>
    </div>
  )
});

export default function FooterPageForm({ categories, initialData, onSave, onCancel }) {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [content, setContent] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editorMode, setEditorMode] = useState('visual'); // 'visual' | 'html'
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setSlug(initialData.slug || '');
      setCategoryId(initialData.footer_category_id || '');
      setContent(initialData.content || '');
      setIsVisible(initialData.is_visible !== false);
      setSortOrder(initialData.sort_order || 0);
    } else {
      setTitle('');
      setSlug('');
      setCategoryId(categories[0]?.id || '');
      setContent('');
      setIsVisible(true);
      setSortOrder(0);
    }
    setErrors({});
  }, [initialData, categories]);

  // Auto-generate slug from title if it's a new page
  const handleTitleChange = (e) => {
    const val = e.target.value;
    setTitle(val);
    if (!initialData) {
      const generatedSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setSlug(generatedSlug);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!title.trim()) newErrors.title = 'Title is required';
    if (!slug.trim()) {
      newErrors.slug = 'Slug is required';
    } else if (!/^[a-z0-9-]+$/.test(slug)) {
      newErrors.slug = 'Slug must only contain lowercase alphanumeric characters and hyphens';
    }
    if (!categoryId) newErrors.footer_category_id = 'Category assignment is required';
    if (!content.trim() || content === '<p><br></p>') {
      newErrors.content = 'Page content is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    const payload = {
      footer_category_id: Number(categoryId),
      title: title.trim(),
      slug: slug.trim(),
      content: content.trim(),
      is_visible: isVisible,
      sort_order: Number(sortOrder)
    };

    try {
      if (initialData?.id) {
        await api.put(`/admin/footer/pages/${initialData.id}`, payload);
        toast(`Page "${title}" updated successfully!`, 'success');
      } else {
        await api.post('/admin/footer/pages', payload);
        toast(`Page "${title}" created successfully!`, 'success');
      }
      onSave();
    } catch (err) {
      logError(err);
      const msg = safeApiMessage(err, 'Failed to save footer page.');
      toast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-left font-sans">
      <div className="bg-white/80 dark:bg-zinc-900/35 border border-zinc-200/60 dark:border-zinc-850 p-6 rounded-2xl shadow-sm space-y-5 animate-in fade-in">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-850/80">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white">
            {initialData ? 'Edit Footer Page' : 'Create Custom Page'}
          </h2>
          <button type="button" onClick={onCancel} className="p-1 rounded-md text-zinc-400 hover:text-zinc-655 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-500 mb-1.5 font-mono">Page Title</label>
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              placeholder="e.g. Editorial Board"
              className={`w-full px-3.5 py-2.5 bg-zinc-50/50 dark:bg-zinc-950 border ${errors.title ? 'border-red-500 focus:border-red-500' : 'border-zinc-200 dark:border-zinc-800 focus:border-amber-500'} rounded-xl text-xs font-semibold focus:outline-none transition-colors text-zinc-900 dark:text-zinc-100`}
            />
            {errors.title && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.title}</p>}
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-500 mb-1.5 font-mono">URL Slug</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. editorial-board"
              className={`w-full px-3.5 py-2.5 bg-zinc-50/50 dark:bg-zinc-950 border ${errors.slug ? 'border-red-500 focus:border-red-500' : 'border-zinc-200 dark:border-zinc-800 focus:border-amber-500'} rounded-xl text-xs font-semibold focus:outline-none transition-colors text-zinc-900 dark:text-zinc-100`}
            />
            {errors.slug && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.slug}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-500 mb-1.5 font-mono">Column Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-zinc-50/50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500 transition-colors text-zinc-905 dark:text-zinc-200 cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {errors.footer_category_id && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.footer_category_id}</p>}
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-455 dark:text-zinc-500 mb-1.5 font-mono">Sort Order</label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-zinc-50/50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500 transition-colors text-zinc-900 dark:text-zinc-100"
            />
          </div>

          <div className="flex items-center pt-5">
            <label className="flex items-center space-x-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isVisible}
                onChange={(e) => setIsVisible(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
              <span className="text-xs font-semibold text-zinc-705 dark:text-zinc-300">Visible in Footer</span>
            </label>
          </div>
        </div>

        {/* Editor Toolbar with visual toggles */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-500 font-mono">Page Content Markup</label>
          <div className="inline-flex rounded-xl p-1 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-850 self-start sm:self-auto text-[10px] font-bold uppercase tracking-wider">
            <button
              type="button"
              onClick={() => setEditorMode('visual')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                editorMode === 'visual'
                  ? 'bg-white shadow text-amber-600 dark:bg-zinc-900 dark:text-amber-400'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Visual Editor</span>
            </button>
            <button
              type="button"
              onClick={() => setEditorMode('html')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                editorMode === 'html'
                  ? 'bg-white shadow text-amber-600 dark:bg-zinc-900 dark:text-amber-400'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Raw HTML</span>
            </button>
          </div>
        </div>

        {/* Editor workspace */}
        <div>
          {editorMode === 'visual' ? (
            <div className="animate-in fade-in duration-200 bg-white border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
              <RichEditor
                value={content}
                onChange={(contentVal) => {
                  setContent(contentVal);
                  if (errors.content) {
                    setErrors(prev => ({ ...prev, content: '' }));
                  }
                }}
                placeholder="Start drafting page content..."
              />
            </div>
          ) : (
            <div className="animate-in fade-in duration-200">
              <textarea
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  if (errors.content) {
                    setErrors(prev => ({ ...prev, content: '' }));
                  }
                }}
                placeholder="<!-- Add custom HTML blocks here -->"
                rows={12}
                style={{ color: '#ffffff' }}
                className={`w-full p-4 bg-zinc-900 border ${errors.content ? 'border-red-500 focus:border-red-500' : 'border-zinc-800 focus:border-amber-500'} rounded-xl font-mono text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors`}
              />
            </div>
          )}
          <p className="text-[9px] text-zinc-450 dark:text-zinc-500 mt-1.5 font-semibold text-left font-mono uppercase tracking-wider">
            * Note: Script tags are stripped on output for execution security.
          </p>
          {errors.content && <p className="text-[10px] text-red-550 mt-1 font-semibold">{errors.content}</p>}
        </div>

        {/* Submit triggers */}
        <div className="flex justify-end space-x-2 pt-3 border-t border-zinc-100 dark:border-zinc-850/80">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-350 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center space-x-2 px-5 py-2 bg-zinc-950 hover:bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-250 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
