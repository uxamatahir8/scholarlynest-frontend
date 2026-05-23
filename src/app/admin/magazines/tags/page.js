'use client';

import React, { useState, useEffect } from 'react';
import { 
  Tag as TagIcon, Plus, Edit2, Trash2, Loader2, 
  AlertCircle, BookOpen, Search, X, Check, Save 
} from 'lucide-react';
import api from '../../../../utils/api';
import { useToast } from '../../../../context/ToastContext';

export default function AdminMagazineTags() {
  const { toast } = useToast();

  const [magazines, setMagazines] = useState([]);
  const [tags, setTags] = useState([]);
  
  const [loadingMagazines, setLoadingMagazines] = useState(true);
  const [loadingTags, setLoadingTags] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [selectedMagazineId, setSelectedMagazineId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagMagazineId, setNewTagMagazineId] = useState('');
  const [submittingAdd, setSubmittingAdd] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [editingTagName, setEditingTagName] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingTag, setDeletingTag] = useState(null);
  const [submittingDelete, setSubmittingDelete] = useState(false);

  // Fetch Magazines
  const fetchMagazines = async () => {
    try {
      setLoadingMagazines(true);
      const response = await api.get('/magazines');
      setMagazines(response.data);
      if (response.data.length > 0) {
        setNewTagMagazineId(response.data[0].id.toString());
      }
    } catch (err) {
      console.error(err);
      toast('Failed to load magazines.', 'error');
    } finally {
      setLoadingMagazines(false);
    }
  };

  // Fetch Tags
  const fetchTags = async () => {
    try {
      setLoadingTags(true);
      setError(null);
      
      const queryParam = selectedMagazineId !== 'all' ? `?magazine_id=${selectedMagazineId}` : '';
      const response = await api.get(`/tags${queryParam}`);
      setTags(response.data);
    } catch (err) {
      console.error(err);
      setError('Could not retrieve tags registry.');
    } finally {
      setLoadingTags(false);
    }
  };

  useEffect(() => {
    fetchMagazines();
  }, []);

  useEffect(() => {
    fetchTags();
  }, [selectedMagazineId]);

  // Handle Add Tag
  const handleAddTag = async (e) => {
    e.preventDefault();
    if (!newTagName.trim()) {
      toast('Tag name is required.', 'error');
      return;
    }
    if (!newTagMagazineId) {
      toast('Please select a magazine.', 'error');
      return;
    }

    try {
      setSubmittingAdd(true);
      await api.post('/admin/tags', {
        magazine_id: newTagMagazineId,
        name: newTagName.trim()
      });

      toast('Tag created successfully.', 'success');
      setIsAddModalOpen(false);
      setNewTagName('');
      fetchTags();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Failed to create tag.';
      toast(msg, 'error');
    } finally {
      setSubmittingAdd(false);
    }
  };

  // Handle Edit Tag
  const handleEditTag = async (e) => {
    e.preventDefault();
    if (!editingTagName.trim()) {
      toast('Tag name is required.', 'error');
      return;
    }

    try {
      setSubmittingEdit(true);
      await api.put(`/admin/tags/${editingTag.id}`, {
        name: editingTagName.trim()
      });

      toast('Tag updated successfully.', 'success');
      setIsEditModalOpen(false);
      setEditingTag(null);
      setEditingTagName('');
      fetchTags();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Failed to update tag.';
      toast(msg, 'error');
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Handle Delete Tag
  const handleDeleteTag = async () => {
    try {
      setSubmittingDelete(true);
      await api.delete(`/admin/tags/${deletingTag.id}`);

      toast('Tag deleted successfully.', 'success');
      setIsDeleteModalOpen(false);
      setDeletingTag(null);
      fetchTags();
    } catch (err) {
      console.error(err);
      toast('Failed to delete tag.', 'error');
    } finally {
      setSubmittingDelete(false);
    }
  };

  const openEditModal = (tag) => {
    setEditingTag(tag);
    setEditingTagName(tag.name);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (tag) => {
    setDeletingTag(tag);
    setIsDeleteModalOpen(true);
  };

  const filteredTags = tags.filter(tag => 
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Title & Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950">Magazine Tags Library</h1>
          <p className="text-xs text-zinc-500 font-medium">Manage and review keywords linked to magazines to enhance article categorization.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-[var(--accent)] hover:bg-[var(--accent)]/95 shadow-sm transition-premium cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Tag</span>
        </button>
      </div>

      {/* Filters block */}
      <div className="bg-white p-4 border border-zinc-200 rounded-2xl shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Search */}
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tags..."
            className="w-full text-xs font-semibold pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-400 transition-colors"
          />
        </div>

        {/* Magazine Filter */}
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider whitespace-nowrap">Filter issue:</span>
          {loadingMagazines ? (
            <span className="text-xs text-zinc-450 font-semibold uppercase animate-pulse">Loading issues...</span>
          ) : (
            <select
              value={selectedMagazineId}
              onChange={(e) => setSelectedMagazineId(e.target.value)}
              className="text-xs font-semibold px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-400 transition-colors w-full md:w-56 cursor-pointer"
            >
              <option value="all">All Magazines</option>
              {magazines.map((m) => (
                <option key={m.id} value={m.id}>{m.title}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Tags List Workspace */}
      {loadingTags && (
        <div className="flex flex-col items-center justify-center py-20 space-y-4 bg-white/50 border border-zinc-200/50 rounded-2xl">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-mono">Loading tags index...</span>
        </div>
      )}

      {error && !loadingTags && (
        <div className="flex items-center space-x-3 p-4 bg-red-50 border border-red-150 rounded-xl text-red-700 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="font-semibold text-xs leading-none">{error}</span>
        </div>
      )}

      {!loadingTags && !error && filteredTags.length === 0 && (
        <div className="text-center py-16 bg-white/50 border border-zinc-200/50 rounded-2xl">
          <TagIcon className="w-12 h-12 mx-auto text-zinc-300 mb-3" />
          <p className="text-xs font-semibold text-zinc-500">No tags found matching the search criteria.</p>
        </div>
      )}

      {!loadingTags && !error && filteredTags.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredTags.map((tag) => (
            <div 
              key={tag.id}
              className="bg-white border border-zinc-250 hover:border-zinc-400 hover:shadow-sm p-4 rounded-xl flex items-center justify-between transition-premium"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <TagIcon className="w-4 h-4 text-[var(--accent-gold)]" />
                  <span className="text-sm font-bold text-zinc-950">{tag.name}</span>
                </div>
                <div className="flex items-center space-x-1.5 text-[10px] font-bold text-zinc-400 uppercase font-mono">
                  <BookOpen className="w-3 h-3 text-zinc-300" />
                  <span className="truncate max-w-[150px]">{tag.magazine?.title}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => openEditModal(tag)}
                  className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                  title="Edit tag"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => openDeleteModal(tag)}
                  className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title="Delete tag"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD TAG MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-250">
          <div className="bg-white rounded-2xl border border-zinc-250 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-zinc-150 flex items-center justify-between bg-zinc-50">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-800">Add Magazine Tag</h3>
              <button 
                onClick={() => setIsAddModalOpen(false)} 
                className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddTag} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono block">Target Magazine</label>
                <select
                  value={newTagMagazineId}
                  onChange={(e) => setNewTagMagazineId(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-400 transition-colors cursor-pointer"
                >
                  {magazines.map((m) => (
                    <option key={m.id} value={m.id}>{m.title}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono block">Tag Name</label>
                <input 
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="e.g. Machine Learning"
                  className="w-full text-xs font-semibold px-3 py-2 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-400 transition-colors"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-zinc-500 bg-zinc-100 hover:bg-zinc-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAdd}
                  className="inline-flex items-center space-x-1.5 px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-[var(--accent)] hover:bg-[var(--accent)]/95 shadow transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submittingAdd ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Save Tag</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT TAG MODAL */}
      {isEditModalOpen && editingTag && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-250">
          <div className="bg-white rounded-2xl border border-zinc-250 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-zinc-150 flex items-center justify-between bg-zinc-50">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-800">Rename Tag</h3>
              <button 
                onClick={() => setIsEditModalOpen(false)} 
                className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditTag} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono block">Magazine</label>
                <input 
                  type="text"
                  disabled
                  value={editingTag.magazine?.title || ''}
                  className="w-full text-xs font-semibold px-3 py-2 bg-zinc-100 border border-zinc-200 rounded-lg text-zinc-450 cursor-not-allowed"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono block">Tag Name</label>
                <input 
                  type="text"
                  value={editingTagName}
                  onChange={(e) => setEditingTagName(e.target.value)}
                  placeholder="e.g. Deep Learning"
                  className="w-full text-xs font-semibold px-3 py-2 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-400 transition-colors"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-zinc-500 bg-zinc-100 hover:bg-zinc-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="inline-flex items-center space-x-1.5 px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-[var(--accent)] hover:bg-[var(--accent)]/95 shadow transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submittingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Update</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE TAG MODAL */}
      {isDeleteModalOpen && deletingTag && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-250">
          <div className="bg-white rounded-2xl border border-zinc-250 shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-red-100 text-red-650 rounded-full flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-zinc-950">Remove tag association?</h3>
                <p className="text-xs text-zinc-500 font-medium">Are you sure you want to delete the tag <strong className="font-bold text-zinc-800">"{deletingTag.name}"</strong>? This will permanently sever its association with any published articles.</p>
              </div>
              <div className="flex items-center justify-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-zinc-500 bg-zinc-100 hover:bg-zinc-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteTag}
                  disabled={submittingDelete}
                  className="inline-flex items-center space-x-1.5 px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-red-600 hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submittingDelete ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>Delete Tag</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
