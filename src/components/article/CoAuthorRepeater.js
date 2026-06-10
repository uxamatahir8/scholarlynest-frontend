'use client';

import React from 'react';
import { Plus, Trash2, Shield, UserPlus, AlertCircle } from 'lucide-react';

export default function CoAuthorRepeater({ coAuthors, setCoAuthors, currentUserEmail, required = false }) {
  
  const addCoAuthor = () => {
    setCoAuthors([
      ...coAuthors,
      { name: '', email: '', university_name: '', can_edit: false, create_account: false }
    ]);
  };

  const removeCoAuthor = (index) => {
    setCoAuthors(coAuthors.filter((_, idx) => idx !== index));
  };

  const updateCoAuthor = (index, field, value) => {
    const updated = coAuthors.map((author, idx) => {
      if (idx === index) {
        const newAuthor = { ...author, [field]: value };
        if (field === 'can_edit' && value === true) {
          newAuthor.create_account = true;
        }
        return newAuthor;
      }
      return author;
    });
    setCoAuthors(updated);
  };
  const canAddRow = coAuthors.every(
    (author) => author.name?.trim() && author.email?.trim() && author.university_name?.trim()
  );
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider block font-mono">Co-Authors & Collaborators</span>
            {required && (
              <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full bg-red-100 text-red-600 border border-red-200">
                Required
              </span>
            )}
          </div>
          <span className="text-[10px] text-zinc-400 font-medium">
            {required
              ? 'As a super admin, you must specify at least one author for this article.'
              : 'Add secondary contributors with customizable edit permissions and account provisioning gates.'}
          </span>
        </div>
        <button
          type="button"
          onClick={addCoAuthor}
          disabled={!canAddRow}
          className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white bg-[var(--accent)] hover:bg-[var(--accent)]/90 rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[var(--accent)]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Author</span>
        </button>
      </div>

      {coAuthors.length === 0 ? (
        <div className={`flex flex-col items-center justify-center p-8 border border-dashed rounded-xl text-center ${
          required
            ? 'bg-red-50/60 border-red-300'
            : 'bg-zinc-50 border-zinc-200'
        }`}>
          {required ? (
            <>
              <AlertCircle className="w-5 h-5 text-red-500 mb-2" />
              <span className="text-xs font-bold text-red-600 uppercase tracking-widest font-mono">Author Required</span>
              <p className="text-[10px] text-red-500/80 font-medium mt-1">Super admins must assign at least one author. Click "Add Author" above to add one.</p>
            </>
          ) : (
            <>
              <span className="text-xs font-bold text-zinc-450 uppercase tracking-widest font-mono">No Co-Authors Added</span>
              <p className="text-[10px] text-zinc-400 font-medium mt-1">This article will list only you as the sole author unless secondary collaborators are specified.</p>
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
                className="p-4 bg-zinc-50 rounded-xl border border-zinc-200/60 shadow-sm flex flex-col md:flex-row md:items-center gap-4 transition-all duration-200 animate-in fade-in slide-in-from-bottom-2"
              >
                {/* Inputs Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-grow">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 font-mono">Full Name</label>
                    <input
                      type="text"
                      required
                      value={author.name}
                      onChange={(e) => updateCoAuthor(index, 'name', e.target.value)}
                      placeholder="e.g. Prof. Alice Smith"
                      className="w-full text-xs font-semibold px-3 py-2 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-400 transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 font-mono">Email Address</label>
                    <input
                      type="email"
                      required
                      value={author.email}
                      onChange={(e) => updateCoAuthor(index, 'email', e.target.value)}
                      placeholder="e.g. alice.smith@university.edu"
                      className={`w-full text-xs font-semibold px-3 py-2 bg-white border rounded-lg focus:outline-none transition-colors ${
                        isSelfEmail ? 'border-red-400 focus:border-red-500' : 'border-zinc-200 focus:border-zinc-400'
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
                    <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 font-mono">University / Affiliation Name</label>
                    <input
                      type="text"
                      value={author.university_name || ''}
                      onChange={(e) => updateCoAuthor(index, 'university_name', e.target.value)}
                      placeholder="e.g. Stanford University"
                      className="w-full text-xs font-semibold px-3 py-2 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-400 transition-colors"
                    />
                  </div>
                </div>

                {/* Checkboxes Wrapper */}
                <div className="flex flex-wrap items-center gap-4 md:mt-4">
                  {/* Grant Edit Privileges */}
                  <label className="inline-flex items-center space-x-2 select-none cursor-pointer">
                    <input
                      type="checkbox"
                      checked={author.can_edit}
                      onChange={(e) => updateCoAuthor(index, 'can_edit', e.target.checked)}
                      className="w-4 h-4 rounded border-zinc-300 text-[var(--accent)] focus:ring-[var(--accent)] cursor-pointer"
                    />
                    <span className="text-[10px] font-bold text-zinc-650 uppercase tracking-wider flex items-center">
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
                      className="w-4 h-4 rounded border-zinc-300 text-[var(--accent)] focus:ring-[var(--accent)] cursor-pointer disabled:cursor-not-allowed"
                    />
                    <span className="text-[10px] font-bold text-zinc-650 uppercase tracking-wider flex items-center">
                      <UserPlus className="w-3.5 h-3.5 mr-1 text-zinc-400" />
                      Create Account
                    </span>
                  </label>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => removeCoAuthor(index)}
                    className="p-2 text-zinc-450 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer md:self-end md:ml-auto"
                    title="Remove Author"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
