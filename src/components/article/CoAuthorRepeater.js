'use client';

import React from 'react';
import { Plus, Trash2, Shield, UserPlus, AlertCircle, Star, MailCheck } from 'lucide-react';
import { createEmptyAuthor, normalizeAuthorRows } from './academicArticleForm';

export default function CoAuthorRepeater({ coAuthors, setCoAuthors, currentUserEmail, required = false }) {
  
  const addCoAuthor = () => {
    setCoAuthors([
      ...coAuthors,
      createEmptyAuthor(coAuthors.length + 1)
    ]);
  };

  const removeCoAuthor = (index) => {
    setCoAuthors(normalizeAuthorRows(coAuthors.filter((_, idx) => idx !== index)));
  };

  const updateCoAuthor = (index, field, value) => {
    const updated = coAuthors.map((author, idx) => {
      if (idx === index) {
        const newAuthor = { ...author, [field]: value };
        if (field === 'affiliation') {
          newAuthor.university_name = value;
        }
        if (field === 'can_edit' && value === true) {
          newAuthor.create_account = true;
        }
        if (field === 'is_owner' && value === true) {
          newAuthor.can_edit = true;
          newAuthor.create_account = true;
        }
        return newAuthor;
      }
      if (field === 'is_owner' && value === true) {
        return { ...author, is_owner: false };
      }
      return author;
    });
    setCoAuthors(normalizeAuthorRows(updated));
  };
  const canAddRow = coAuthors.every(
    (author) => author.name?.trim() && author.email?.trim()
  );
  return (
    <div className="space-y-4 font-sans text-left">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block font-mono">Co-Authors & Collaborators</span>
            {required && (
              <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                Required
              </span>
            )}
          </div>
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
            {required
              ? 'Super admins must specify the complete author list and choose one article owner.'
              : 'The submitting author is the article owner. Add additional contributors and corresponding authors here.'}
          </span>
        </div>
        <button
          type="button"
          onClick={addCoAuthor}
          disabled={!canAddRow}
          className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white bg-zinc-950 hover:bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Author</span>
        </button>
      </div>

      {coAuthors.length === 0 ? (
        <div className={`flex flex-col items-center justify-center p-8 border border-dashed rounded-2xl text-center ${
          required
            ? 'bg-red-500/5 border-red-500/20'
            : 'bg-zinc-50/50 dark:bg-zinc-900/10 border-zinc-200 dark:border-zinc-800'
        }`}>
          {required ? (
            <>
              <AlertCircle className="w-5 h-5 text-red-500 mb-2 animate-pulse" />
              <span className="text-xs font-bold text-red-600 dark:text-red-450 uppercase tracking-widest font-mono">Author Required</span>
              <p className="text-[10px] text-red-500/80 font-medium mt-1">Super admins must assign at least one author. Click "Add Author" above to add one.</p>
            </>
          ) : (
            <>
              <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-mono">No Co-Authors Added</span>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium mt-1 leading-relaxed">This article will list only you as the sole author unless secondary collaborators are specified.</p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {coAuthors.map((author, index) => {
            const isSelfEmail = author.email.trim().toLowerCase() === currentUserEmail?.trim().toLowerCase();
            return (
              <div
                key={index}
                className="p-4 bg-zinc-50/50 dark:bg-zinc-950/20 rounded-xl border border-zinc-200/60 dark:border-zinc-850 shadow-sm space-y-4 transition-all duration-200 animate-in fade-in slide-in-from-bottom-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono">Author {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeCoAuthor(index)}
                    className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-500/10 dark:hover:bg-red-500/20 rounded-lg transition-colors cursor-pointer"
                    title="Remove Author"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 font-mono block">Full Name</label>
                    <input
                      type="text"
                      required
                      value={author.name}
                      onChange={(e) => updateCoAuthor(index, 'name', e.target.value)}
                      placeholder="e.g. Prof. Alice Smith"
                      className="w-full text-xs font-semibold px-3 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-amber-500 transition-colors text-zinc-900 dark:text-zinc-200"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 font-mono block">Email Address</label>
                    <input
                      type="email"
                      required
                      value={author.email}
                      onChange={(e) => updateCoAuthor(index, 'email', e.target.value)}
                      placeholder="e.g. alice.smith@university.edu"
                      className={`w-full text-xs font-semibold px-3 py-2.5 bg-white dark:bg-zinc-955 border rounded-xl focus:outline-none transition-colors ${
                        isSelfEmail ? 'border-red-450 focus:border-red-500 text-zinc-900 dark:text-zinc-200' : 'border-zinc-200 dark:border-zinc-800 focus:border-amber-500 text-zinc-900 dark:text-zinc-200'
                      }`}
                    />
                    {isSelfEmail && (
                      <p className="text-[9px] font-bold text-red-500 flex items-center mt-1">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        You cannot list yourself as a co-author.
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 font-mono block">Affiliation</label>
                    <input
                      type="text"
                      value={author.affiliation || author.university_name || ''}
                      onChange={(e) => updateCoAuthor(index, 'affiliation', e.target.value)}
                      placeholder="e.g. Stanford University"
                      className="w-full text-xs font-semibold px-3 py-2.5 bg-white dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-amber-500 transition-colors text-zinc-900 dark:text-zinc-200"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 font-mono block">Department</label>
                    <input
                      type="text"
                      value={author.department || ''}
                      onChange={(e) => updateCoAuthor(index, 'department', e.target.value)}
                      placeholder="e.g. Computer Science"
                      className="w-full text-xs font-semibold px-3 py-2.5 bg-white dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-amber-500 transition-colors text-zinc-900 dark:text-zinc-200"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 font-mono block">Country</label>
                    <input
                      type="text"
                      value={author.country || ''}
                      onChange={(e) => updateCoAuthor(index, 'country', e.target.value)}
                      placeholder="e.g. United States"
                      className="w-full text-xs font-semibold px-3 py-2.5 bg-white dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-amber-500 transition-colors text-zinc-900 dark:text-zinc-200"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 font-mono block">ORCID ID</label>
                    <input
                      type="text"
                      value={author.orcid || ''}
                      onChange={(e) => updateCoAuthor(index, 'orcid', e.target.value)}
                      placeholder="0000-0000-0000-0000"
                      className="w-full text-xs font-semibold px-3 py-2.5 bg-white dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-amber-500 transition-colors text-zinc-900 dark:text-zinc-200"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 font-mono block">Contribution Statement</label>
                  <textarea
                    value={author.contribution_statement || ''}
                    onChange={(e) => updateCoAuthor(index, 'contribution_statement', e.target.value)}
                    rows={2}
                    placeholder="Describe this author's contribution..."
                    className="w-full text-xs font-semibold px-3 py-2.5 bg-white dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-amber-500 transition-colors text-zinc-900 dark:text-zinc-200"
                  />
                </div>

                {/* Checkboxes Wrapper */}
                <div className="flex flex-wrap items-center gap-4">
                  <label className="inline-flex items-center space-x-2 select-none cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!author.is_owner}
                      onChange={(e) => updateCoAuthor(index, 'is_owner', e.target.checked)}
                      className="w-4 h-4 rounded border-zinc-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                    />
                    <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center">
                      <Star className="w-3.5 h-3.5 mr-1 text-zinc-400" />
                      Article Owner
                    </span>
                  </label>

                  <label className="inline-flex items-center space-x-2 select-none cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!author.is_corresponding}
                      onChange={(e) => updateCoAuthor(index, 'is_corresponding', e.target.checked)}
                      className="w-4 h-4 rounded border-zinc-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                    />
                    <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center">
                      <MailCheck className="w-3.5 h-3.5 mr-1 text-zinc-400" />
                      Corresponding
                    </span>
                  </label>

                  {/* Grant Edit Privileges */}
                  <label className="inline-flex items-center space-x-2 select-none cursor-pointer">
                    <input
                      type="checkbox"
                      checked={author.can_edit}
                      onChange={(e) => updateCoAuthor(index, 'can_edit', e.target.checked)}
                      className="w-4 h-4 rounded border-zinc-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                    />
                    <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center">
                      <Shield className="w-3.5 h-3.5 mr-1 text-zinc-400" />
                      Grant Edit
                    </span>
                  </label>

                  {/* Create Account Gate */}
                  <label className={`inline-flex items-center space-x-2 select-none cursor-pointer ${author.can_edit ? 'opacity-70 cursor-not-allowed' : ''}`}>
                    <input
                      type="checkbox"
                      checked={author.create_account}
                      disabled={author.can_edit}
                      onChange={(e) => updateCoAuthor(index, 'create_account', e.target.checked)}
                      className="w-4 h-4 rounded border-zinc-300 text-amber-600 focus:ring-amber-500 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center">
                      <UserPlus className="w-3.5 h-3.5 mr-1 text-zinc-400" />
                      Create Account
                    </span>
                  </label>

                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
