'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import api from '../../../utils/api';
import FooterPageForm from '../../../components/admin/FooterPageForm';
import { 
  ArrowLeft, ChevronRight, Loader2, ShieldAlert,
  FolderOpen, FileText, Plus, Edit, Trash2,
  RefreshCw, Eye, EyeOff
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';

export default function FooterCmsAdmin() {
  const { user: authUser, hasPermission, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [pages, setPages] = useState([]);

  // Category Form State
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [categorySortOrder, setCategorySortOrder] = useState(0);
  const [isCategorySubmitting, setIsCategorySubmitting] = useState(false);

  // Page Form State
  const [isEditingPage, setIsEditingPage] = useState(false);
  const [activeEditingPageData, setActiveEditingPageData] = useState(null);

  // Delete Confirmation States
  const [deleteType, setDeleteType] = useState(null); // 'category' | 'page'
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleteTargetName, setDeleteTargetName] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [categoriesRes, pagesRes] = await Promise.all([
        api.get('/admin/footer/categories'),
        api.get('/admin/footer/pages')
      ]);
      setCategories(categoriesRes.data || []);
      setPages(pagesRes.data || []);
    } catch (err) {
      console.error(err);
      toast('Failed to retrieve footer management data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && authUser && (hasPermission('footer.manage') || hasPermission('settings.manage'))) {
      fetchData();
    }
  }, [authLoading]);

  // CATEGORY ACTIONS
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      toast('Category name is required.', 'error');
      return;
    }

    setIsCategorySubmitting(true);
    const payload = {
      name: categoryName.trim(),
      sort_order: Number(categorySortOrder)
    };

    try {
      if (editingCategory) {
        await api.put(`/admin/footer/categories/${editingCategory.id}`, payload);
        toast(`Category "${categoryName}" updated.`, 'success');
      } else {
        await api.post('/admin/footer/categories', payload);
        toast(`Category "${categoryName}" created.`, 'success');
      }
      setCategoryName('');
      setCategorySortOrder(0);
      setEditingCategory(null);
      setShowCategoryForm(false);
      await fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save category.';
      toast(msg, 'error');
    } finally {
      setIsCategorySubmitting(false);
    }
  };

  const handleEditCategoryClick = (cat) => {
    setEditingCategory(cat);
    setCategoryName(cat.name);
    setCategorySortOrder(cat.sort_order);
    setShowCategoryForm(true);
  };

  const handleCancelCategoryEdit = () => {
    setCategoryName('');
    setCategorySortOrder(0);
    setEditingCategory(null);
    setShowCategoryForm(false);
  };

  // DELETE TRIGGERS
  const triggerDelete = (type, id, name) => {
    setDeleteType(type);
    setDeleteTargetId(id);
    setDeleteTargetName(name);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;

    try {
      if (deleteType === 'category') {
        await api.delete(`/admin/footer/categories/${deleteTargetId}`);
        toast(`Category "${deleteTargetName}" and its linked pages deleted.`, 'success');
      } else {
        await api.delete(`/admin/footer/pages/${deleteTargetId}`);
        toast(`Page "${deleteTargetName}" deleted successfully.`, 'success');
      }
      setIsDeleteModalOpen(false);
      setDeleteTargetId(null);
      setDeleteTargetName('');
      await fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete target.';
      toast(msg, 'error');
    }
  };

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-amber-605" />
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono">Authenticating Privileges...</span>
      </div>
    );
  }

  if (!authUser || (!hasPermission('footer.manage') && !hasPermission('settings.manage'))) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-2xl flex items-start space-x-4 animate-in fade-in">
        <ShieldAlert className="w-6 h-6 text-red-500 shrink-0" />
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-red-750">Access Restricted</h3>
          <p className="text-xs text-red-600 dark:text-red-350 mt-1">
            You must possess footer management privileges to access the global footer builder.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600 dark:text-amber-400" />
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono">Loading Footer Menu Structure...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300 text-left font-sans">
      <title>Footer CMS - ScholarlyNest</title>

      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-900">
        <Link href="/admin" className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-zinc-405 hover:text-amber-655 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
          Back to Overview
        </Link>
        <div className="flex items-center space-x-2 text-[9px] font-bold uppercase tracking-widest text-zinc-400">
          <span>Console</span>
          <ChevronRight className="w-3 h-3 text-amber-500" />
          <span className="text-zinc-800 dark:text-zinc-205">Footer CMS</span>
        </div>
      </div>

      {/* Header and Action row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white font-serif">
            Footer Menu & Pages CMS
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            Configure dynamic footer menus. Group links into columns and manage customized static page layouts.
          </p>
        </div>
        {!isEditingPage && (
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 font-sans">
            <button
              onClick={fetchData}
              className="inline-flex items-center gap-1.5 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-xs font-bold uppercase tracking-wider px-3.5 py-2.5 rounded-xl transition-all cursor-pointer text-zinc-700 dark:text-zinc-300"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => {
                setActiveEditingPageData(null);
                setIsEditingPage(true);
              }}
              disabled={categories.length === 0}
              className="inline-flex items-center gap-1.5 bg-zinc-950 hover:bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom Page</span>
            </button>
          </div>
        )}
      </div>

      {/* Forms Panel */}
      {isEditingPage ? (
        <div className="w-full">
          <FooterPageForm
            categories={categories}
            initialData={activeEditingPageData}
            onSave={() => {
              setIsEditingPage(false);
              setActiveEditingPageData(null);
              fetchData();
            }}
            onCancel={() => {
              setIsEditingPage(false);
              setActiveEditingPageData(null);
            }}
          />
        </div>
      ) : (
        /* Double Column workspace */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start font-sans">
          
          {/* Categories Manager (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white/80 dark:bg-zinc-900/20 backdrop-blur-md border border-zinc-200/60 dark:border-zinc-850 rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-850 pb-3">
                <div className="space-y-0.5 text-left">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white flex items-center">
                    <FolderOpen className="w-4 h-4 mr-1.5 text-zinc-400" />
                    Categories
                  </h3>
                  <p className="text-[9px] text-zinc-405 font-bold uppercase font-mono">Footer columns index</p>
                </div>
                {!showCategoryForm && (
                  <button
                    onClick={() => {
                      setEditingCategory(null);
                      setCategoryName('');
                      setCategorySortOrder(0);
                      setShowCategoryForm(true);
                    }}
                    className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2.5 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-105 transition-colors cursor-pointer text-zinc-700 dark:text-zinc-300"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add</span>
                  </button>
                )}
              </div>

              {/* Form inside sidebar */}
              {showCategoryForm && (
                <form onSubmit={handleSaveCategory} className="bg-zinc-50/50 dark:bg-zinc-950/40 border border-zinc-200/60 dark:border-zinc-850 p-4 rounded-xl space-y-3.5 text-left">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 font-mono">
                    {editingCategory ? 'Edit Category' : 'Create Category'}
                  </span>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-1 font-mono">Category Name</label>
                      <input
                        type="text"
                        required
                        value={categoryName}
                        onChange={(e) => setCategoryName(e.target.value)}
                        placeholder="e.g. Resources"
                        className="w-full px-3 py-1.5 bg-white dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold focus:outline-none focus:border-amber-505 text-zinc-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-1 font-mono">Sort Order</label>
                      <input
                        type="number"
                        value={categorySortOrder}
                        onChange={(e) => setCategorySortOrder(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold focus:outline-none focus:border-amber-505 text-zinc-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-1.5 pt-2">
                    <button
                      type="button"
                      onClick={handleCancelCategoryEdit}
                      className="px-2.5 py-1.5 border border-zinc-200 dark:border-zinc-805 rounded-lg text-[9px] font-bold uppercase tracking-wider text-zinc-550 hover:bg-zinc-105 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isCategorySubmitting}
                      className="px-3 py-1.5 bg-zinc-900 dark:bg-zinc-100 hover:opacity-90 text-white dark:text-zinc-950 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                </form>
              )}

              {/* Listings queue */}
              <div className="space-y-2">
                {categories.length > 0 ? (
                  categories.map((cat) => (
                    <div key={cat.id} className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-150 dark:border-zinc-850/60 bg-white/70 dark:bg-zinc-950/20 text-left">
                      <div>
                        <span className="text-xs font-bold text-zinc-805 dark:text-zinc-200">{cat.name}</span>
                        <span className="block text-[9px] text-zinc-400 font-bold font-mono uppercase mt-0.5">Order: {cat.sort_order}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleEditCategoryClick(cat)}
                          className="p-1.5 text-zinc-400 hover:text-amber-600 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => triggerDelete('category', cat.id, cat.name)}
                          className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-zinc-450 italic py-6 text-center">No categories created yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* Pages Manager (8 cols) */}
          <div className="lg:col-span-8">
            <div className="bg-white/80 dark:bg-zinc-900/20 backdrop-blur-md border border-zinc-200/60 dark:border-zinc-850 rounded-2xl shadow-sm overflow-hidden text-left">
              <div className="p-5 border-b border-zinc-100 dark:border-zinc-850/80">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white flex items-center">
                  <FileText className="w-4 h-4 mr-1.5 text-zinc-400" />
                  Custom Footer Pages
                </h3>
                <p className="text-[9px] text-zinc-450 font-bold uppercase font-mono mt-0.5">Manage HTML pages dynamic routes link index</p>
              </div>

              <div className="overflow-x-auto">
                {pages.length > 0 ? (
                  <table className="w-full text-left border-collapse min-w-[550px]">
                    <thead>
                      <tr className="border-b border-zinc-100 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-900/10 text-[10px] font-bold uppercase tracking-wider text-zinc-455">
                        <th className="px-5 py-3.5">Page Title & Path</th>
                        <th className="px-5 py-3.5">Category Assigned</th>
                        <th className="px-5 py-3.5">Visibility Status</th>
                        <th className="px-5 py-3.5 font-mono">Order</th>
                        <th className="px-5 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850/60 text-xs font-semibold text-zinc-705 dark:text-zinc-300">
                      {pages.map((page) => (
                        <tr key={page.id} className="hover:bg-amber-500/[0.01] transition-colors">
                          <td className="px-5 py-4">
                            <span className="font-bold text-zinc-900 dark:text-zinc-150 block">{page.title}</span>
                            <span className="block text-[10px] text-zinc-400 font-mono mt-0.5">/{page.slug}</span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="inline-flex items-center text-[10px] bg-zinc-50 dark:bg-zinc-950 border border-zinc-155 dark:border-zinc-800 px-2 py-0.5 rounded-md text-zinc-700 dark:text-zinc-300">
                              {page.category?.name || 'Unassigned'}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            {page.is_visible ? (
                              <span className="inline-flex items-center space-x-1 text-[9px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-500/[0.04] px-2 py-0.5 rounded border border-emerald-500/10 font-mono">
                                <Eye className="w-3 h-3 mr-1" />
                                Visible
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 text-[9px] font-bold uppercase tracking-wider text-zinc-400 bg-zinc-500/[0.04] px-2 py-0.5 rounded border border-zinc-500/10 font-mono">
                                <EyeOff className="w-3 h-3 mr-1" />
                                Hidden
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4 font-mono font-bold text-zinc-450 dark:text-zinc-500">
                            {page.sort_order}
                          </td>
                          <td className="px-5 py-4 text-right space-x-3.5">
                            <button
                              onClick={() => {
                                setActiveEditingPageData(page);
                                setIsEditingPage(true);
                              }}
                              className="inline-flex items-center text-[10px] font-bold uppercase text-amber-600 hover:underline cursor-pointer"
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Edit
                            </button>
                            <button
                              onClick={() => triggerDelete('page', page.id, page.title)}
                              className="inline-flex items-center text-[10px] font-bold uppercase text-red-500 hover:underline cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-16 text-zinc-405">
                    <FileText className="w-10 h-10 mx-auto text-zinc-350 mb-2 opacity-50" />
                    <p className="text-xs font-bold uppercase tracking-wider">No Pages Indexed</p>
                    <p className="text-[10px] text-zinc-400 mt-1 max-w-xs mx-auto">Click "Add Custom Page" above to build a footer menu entry.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Delete confirmation modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            onClick={() => setIsDeleteModalOpen(false)}
            className="absolute inset-0 bg-zinc-950/40 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"
          />
          <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200 text-left font-sans">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white">Delete confirmation</h3>
            <p className="text-xs text-zinc-555 dark:text-zinc-400 mt-2 leading-relaxed">
              Are you sure you want to permanently delete the {deleteType} <strong className="text-zinc-900 dark:text-white">"{deleteTargetName}"</strong>? 
              {deleteType === 'category' && " This action will also delete all footer pages associated with this category."} This action is irreversible.
            </p>
            <div className="flex justify-end space-x-2.5 mt-5">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 border border-zinc-200 dark:border-zinc-805 rounded-xl text-xs font-bold uppercase tracking-wider text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-650 hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Delete Target
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
