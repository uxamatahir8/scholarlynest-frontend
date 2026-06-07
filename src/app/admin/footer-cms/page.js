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
        <Loader2 className="w-10 h-10 animate-spin text-[var(--accent)]" />
        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-mono">Authenticating Privileges...</span>
      </div>
    );
  }

  if (!authUser || (!hasPermission('footer.manage') && !hasPermission('settings.manage'))) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl flex items-start space-x-4 animate-in fade-in">
        <ShieldAlert className="w-6 h-6 text-red-500 shrink-0" />
        <div>
          <h3 className="text-sm font-bold text-red-700 dark:text-red-400">Access Restricted</h3>
          <p className="text-xs text-red-600 dark:text-red-300 mt-1">
            You must possess footer management privileges to access the global footer builder.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-[var(--accent)]" />
        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-mono">Loading Footer Menu Structure...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300 text-left">
      <title>Footer CMS - ScholarlyNest</title>

      {/* Navigation Headers */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800/60">
        <Link href="/admin" className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-[var(--accent)] transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Overview
        </Link>
        <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-zinc-450">
          <span>Console</span>
          <ChevronRight className="w-3 h-3 text-[var(--accent-gold)]" />
          <span className="text-zinc-650 dark:text-zinc-300">Footer Configuration</span>
        </div>
      </div>

      {/* Main Title & Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)] font-serif">
            Footer Menu & Pages CMS
          </h1>
          <p className="text-xs text-[var(--muted)] mt-1.5 font-medium max-w-2xl">
            Control the application's global footer. Organize custom columns, categorize footer items, and design HTML pages dynamic router catches.
          </p>
        </div>
        {!isEditingPage && (
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              onClick={fetchData}
              className="inline-flex items-center gap-1.5 border border-zinc-200 dark:border-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-xs font-bold uppercase tracking-wider px-3.5 py-2.5 rounded-xl transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh data</span>
            </button>
            <button
              onClick={() => {
                setActiveEditingPageData(null);
                setIsEditingPage(true);
              }}
              disabled={categories.length === 0}
              className="inline-flex items-center gap-1.5 bg-[var(--accent)] text-white hover:opacity-90 disabled:opacity-50 text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all shadow-md cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom Page</span>
            </button>
          </div>
        )}
      </div>

      {/* Page Form Editor View */}
      {isEditingPage ? (
        <div className="max-w-4xl mx-auto">
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
        /* Dynamic Dual Column Split Screen */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Manage categories */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="border border-zinc-200/80 dark:border-zinc-800/60 bg-[var(--card-bg)] shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <FolderOpen className="w-4 h-4 text-zinc-400" />
                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-[var(--foreground)]">Footer Categories</CardTitle>
                  </div>
                  <CardDescription className="text-[10px] mt-0.5">Define category groups or columns.</CardDescription>
                </div>
                {!showCategoryForm && (
                  <button
                    onClick={() => {
                      setEditingCategory(null);
                      setCategoryName('');
                      setCategorySortOrder(0);
                      setShowCategoryForm(true);
                    }}
                    className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1.5 border border-zinc-200 dark:border-zinc-800/60 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer text-zinc-700 dark:text-zinc-300"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add</span>
                  </button>
                )}
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {/* Category Form Drawer */}
                {showCategoryForm && (
                  <form onSubmit={handleSaveCategory} className="bg-zinc-50 dark:bg-zinc-900/35 border border-zinc-200/60 dark:border-zinc-800/50 p-4 rounded-xl space-y-3.5">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-450">
                      {editingCategory ? 'Edit Category' : 'Create Category'}
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-450 mb-1">Name</label>
                        <input
                          type="text"
                          required
                          value={categoryName}
                          onChange={(e) => setCategoryName(e.target.value)}
                          placeholder="e.g., Resources"
                          className="w-full px-3 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold focus:outline-none focus:border-[var(--accent)] transition-colors text-zinc-850 dark:text-zinc-200"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-450 mb-1">Sort Order</label>
                        <input
                          type="number"
                          value={categorySortOrder}
                          onChange={(e) => setCategorySortOrder(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/60 rounded-lg text-xs font-semibold focus:outline-none focus:border-[var(--accent)] transition-colors text-zinc-800 dark:text-zinc-250"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-1.5 pt-2">
                      <button
                        type="button"
                        onClick={handleCancelCategoryEdit}
                        className="px-2.5 py-1.5 border border-zinc-200 dark:border-zinc-800/60 rounded-lg text-[10px] font-bold uppercase tracking-wider text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isCategorySubmitting}
                        className="px-3 py-1.5 bg-[var(--accent)] text-white hover:opacity-90 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Save
                      </button>
                    </div>
                  </form>
                )}

                {/* Categories List */}
                <div className="space-y-2">
                  {categories.length > 0 ? (
                    categories.map((cat) => (
                      <div key={cat.id} className="flex items-center justify-between p-3 rounded-xl border border-zinc-200/50 dark:border-zinc-800/40 bg-white dark:bg-zinc-950">
                        <div>
                          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{cat.name}</span>
                          <span className="block text-[9px] text-zinc-400 font-semibold font-mono">Order: {cat.sort_order}</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() => handleEditCategoryClick(cat)}
                            className="p-1.5 text-zinc-400 hover:text-[var(--accent)] hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => triggerDelete('category', cat.id, cat.name)}
                            className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-zinc-455">
                      <p className="text-xs">No columns created yet.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN: Pages Data Table */}
          <div className="lg:col-span-8">
            <Card className="border border-zinc-200/80 dark:border-zinc-800/60 bg-[var(--card-bg)] shadow-sm">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-zinc-400" />
                  <CardTitle className="text-xs font-bold uppercase tracking-widest text-[var(--foreground)]">Footer Pages</CardTitle>
                </div>
                <CardDescription className="text-xs">
                  Manage active footer links. Re-link dynamic columns and edit raw HTML page content templates.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                {pages.length > 0 ? (
                  <table className="w-full text-left border-collapse min-w-[550px]">
                    <thead>
                      <tr className="border-b border-zinc-200/60 dark:border-zinc-800/40 bg-zinc-50 dark:bg-zinc-950 text-[10px] font-bold uppercase tracking-widest text-zinc-450 dark:text-zinc-550">
                        <th className="px-5 py-3.5">Page Title & Path</th>
                        <th className="px-5 py-3.5">Assigned Category</th>
                        <th className="px-5 py-3.5">Visibility</th>
                        <th className="px-5 py-3.5">Sorting</th>
                        <th className="px-5 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200/45 dark:divide-zinc-800/40 text-xs font-medium">
                      {pages.map((page) => (
                        <tr key={page.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-950/20 transition-colors">
                          <td className="px-5 py-4">
                            <span className="font-bold text-zinc-800 dark:text-zinc-200">{page.title}</span>
                            <span className="block text-[10px] text-zinc-450 font-mono mt-0.5">/{page.slug}</span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="inline-flex items-center text-[10px] bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-2 py-0.5 rounded-md text-zinc-700 dark:text-zinc-300">
                              {page.category?.name || 'Unassigned'}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            {page.is_visible ? (
                              <span className="inline-flex items-center space-x-1 text-[9px] font-bold uppercase tracking-wider text-emerald-650 dark:text-emerald-450 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-semibold">
                                <Eye className="w-3 h-3 mr-1" />
                                Visible
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 text-[9px] font-bold uppercase tracking-wider text-zinc-400 bg-zinc-500/10 px-2 py-0.5 rounded border border-zinc-500/20 font-semibold">
                                <EyeOff className="w-3 h-3 mr-1" />
                                Hidden
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4 font-mono font-bold text-zinc-500 dark:text-zinc-400">
                            {page.sort_order}
                          </td>
                          <td className="px-5 py-4 text-right space-x-3">
                            <button
                              onClick={() => {
                                setActiveEditingPageData(page);
                                setIsEditingPage(true);
                              }}
                              className="inline-flex items-center text-[11px] font-bold text-[var(--accent)] dark:text-blue-400 hover:underline cursor-pointer"
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Edit
                            </button>
                            <button
                              onClick={() => triggerDelete('page', page.id, page.title)}
                              className="inline-flex items-center text-[11px] font-bold text-red-500 hover:underline cursor-pointer"
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
                  <div className="text-center py-16 text-zinc-450 dark:text-zinc-550">
                    <FileText className="w-10 h-10 mx-auto text-zinc-300 dark:text-zinc-650 mb-2" />
                    <p className="text-xs font-bold uppercase tracking-wider">No Pages Found</p>
                    <p className="text-[10px] mt-1 max-w-xs mx-auto">Create a footer page or migration link above to populate table elements.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-all duration-300">
          <div className="bg-white dark:bg-[#121211] border border-zinc-250 dark:border-zinc-800 p-6 rounded-2xl max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">Confirm Deletion</h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-2 leading-relaxed">
              Are you sure you want to permanently delete the {deleteType} <strong className="text-zinc-950 dark:text-white">"{deleteTargetName}"</strong>? 
              {deleteType === 'category' && " This action will also delete all footer pages associated with this category."} This action is irreversible.
            </p>
            <div className="flex justify-end space-x-2.5 mt-5">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-350 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
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
