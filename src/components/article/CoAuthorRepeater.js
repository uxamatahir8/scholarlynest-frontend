'use client';

import React from 'react';
import { Plus, Trash2, Shield, UserPlus, AlertCircle, Star, MailCheck } from 'lucide-react';
import { createEmptyAuthor, normalizeAuthorRows } from './academicArticleForm';

export default function CoAuthorRepeater({ coAuthors, setCoAuthors, currentUserEmail, required = false, allowOwnerControl = true }) {
  
  const addCoAuthor = () => {
    setCoAuthors([
      ...coAuthors,
      createEmptyAuthor(coAuthors.length + 1)
    ]);
  };

  const removeCoAuthor = (index) => {
    const author = coAuthors[index];
    if ((author?.is_owner || author?.is_corresponding) && !window.confirm('Remove this author from the manuscript? You may need to choose a new owner or corresponding author before submission.')) {
      return;
    }
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
    <div className="space-y-5 font-sans text-left">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-zinc-900 dark:text-zinc-100">Author list</span>
            {required && (
              <span className="inline-flex items-center px-2 py-1 text-xs font-bold rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                Required
              </span>
            )}
          </div>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            {required
              ? 'Super admins must specify the complete author list and choose one article owner.'
              : 'The submitting author is the article owner. Add additional contributors and corresponding authors here.'}
          </p>
        </div>
        <button
          type="button"
          onClick={addCoAuthor}
          disabled={!canAddRow}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          <span>Add Author</span>
        </button>
      </div>

      {coAuthors.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-250 bg-zinc-50/70 p-8 text-center dark:border-zinc-800 dark:bg-zinc-900/20">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-white text-amber-700 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-950 dark:text-amber-300 dark:ring-zinc-800">
            <Plus className="h-5 w-5" aria-hidden="true" />
          </div>
          <span className="text-base font-bold text-zinc-900 dark:text-zinc-100">{required ? 'Add the manuscript authors' : 'No additional authors yet'}</span>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            {required
              ? 'Add the authors who contributed to this manuscript. At least one valid article author is required before submission.'
              : 'This manuscript will list you as the submitting author unless secondary collaborators are added.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {coAuthors.map((author, index) => {
            const isSelfEmail = author.email.trim().toLowerCase() === currentUserEmail?.trim().toLowerCase();
            return (
              <div
                key={index}
                className="rounded-xl border border-zinc-200/80 bg-white p-5 shadow-sm transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 dark:border-zinc-850 dark:bg-zinc-950/20"
              >
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Author {index + 1}</span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {author.is_owner && allowOwnerControl && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-700 dark:text-amber-300">
                          <Star className="h-3.5 w-3.5" /> Owner
                        </span>
                      )}
                      {author.is_corresponding && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                          <MailCheck className="h-3.5 w-3.5" /> Corresponding
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCoAuthor(index)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-red-500/10 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                    title="Remove Author"
                    aria-label={`Remove author ${index + 1}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-800 dark:text-zinc-200 block">Full name</label>
                    <input
                      type="text"
                      required
                      value={author.name}
                      onChange={(e) => updateCoAuthor(index, 'name', e.target.value)}
                      placeholder="e.g. Prof. Alice Smith"
                      className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-3 text-sm font-semibold text-zinc-900 transition-colors focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-800 dark:text-zinc-200 block">Email address</label>
                    <input
                      type="email"
                      required
                      value={author.email}
                      onChange={(e) => updateCoAuthor(index, 'email', e.target.value)}
                      placeholder="e.g. alice.smith@university.edu"
                      className={`w-full rounded-lg border bg-white px-3 py-3 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/20 dark:bg-zinc-950 ${
                        isSelfEmail ? 'border-red-450 focus:border-red-500 text-zinc-900 dark:text-zinc-200' : 'border-zinc-200 dark:border-zinc-800 focus:border-amber-500 text-zinc-900 dark:text-zinc-200'
                      }`}
                    />
                    {isSelfEmail && (
                      <p className="text-xs font-bold text-red-600 flex items-center mt-1">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        You cannot list yourself as a co-author.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-800 dark:text-zinc-200 block">Affiliation / university</label>
                    <input
                      type="text"
                      value={author.affiliation || author.university_name || ''}
                      onChange={(e) => updateCoAuthor(index, 'affiliation', e.target.value)}
                      placeholder="e.g. Stanford University"
                      className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-3 text-sm font-semibold text-zinc-900 transition-colors focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-800 dark:text-zinc-200 block">Department</label>
                    <input
                      type="text"
                      value={author.department || ''}
                      onChange={(e) => updateCoAuthor(index, 'department', e.target.value)}
                      placeholder="e.g. Computer Science"
                      className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-3 text-sm font-semibold text-zinc-900 transition-colors focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-800 dark:text-zinc-200 block">Country</label>
                    <input
                      type="text"
                      value={author.country || ''}
                      onChange={(e) => updateCoAuthor(index, 'country', e.target.value)}
                      placeholder="e.g. United States"
                      className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-3 text-sm font-semibold text-zinc-900 transition-colors focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-800 dark:text-zinc-200 block">ORCID ID</label>
                    <input
                      type="text"
                      value={author.orcid || ''}
                      onChange={(e) => updateCoAuthor(index, 'orcid', e.target.value)}
                      placeholder="0000-0000-0000-0000"
                      className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-3 text-sm font-semibold text-zinc-900 transition-colors focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                    />
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <label className="text-sm font-bold text-zinc-800 dark:text-zinc-200 block">Contribution statement</label>
                  <textarea
                    value={author.contribution_statement || ''}
                    onChange={(e) => updateCoAuthor(index, 'contribution_statement', e.target.value)}
                    rows={2}
                    placeholder="Describe this author's contribution..."
                    className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-3 text-sm font-semibold text-zinc-900 transition-colors focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                  />
                </div>

                {/* Checkboxes Wrapper */}
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {allowOwnerControl && (
                    <label className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-semibold text-zinc-700 select-none cursor-pointer dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-300">
                      <input
                        type="checkbox"
                        checked={!!author.is_owner}
                        onChange={(e) => updateCoAuthor(index, 'is_owner', e.target.checked)}
                        className="w-4 h-4 rounded border-zinc-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                      />
                      <span className="flex items-center">
                        <Star className="w-3.5 h-3.5 mr-1 text-zinc-400" />
                        Article Owner
                      </span>
                    </label>
                  )}

                  <label className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-semibold text-zinc-700 select-none cursor-pointer dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-300">
                    <input
                      type="checkbox"
                      checked={!!author.is_corresponding}
                      onChange={(e) => updateCoAuthor(index, 'is_corresponding', e.target.checked)}
                      className="w-4 h-4 rounded border-zinc-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                    />
                    <span className="flex items-center">
                      <MailCheck className="w-3.5 h-3.5 mr-1 text-zinc-400" />
                      Corresponding
                    </span>
                  </label>

                  {/* Grant Edit Privileges */}
                  <label className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-semibold text-zinc-700 select-none cursor-pointer dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-300">
                    <input
                      type="checkbox"
                      checked={author.can_edit}
                      onChange={(e) => updateCoAuthor(index, 'can_edit', e.target.checked)}
                      className="w-4 h-4 rounded border-zinc-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                    />
                    <span className="flex items-center">
                      <Shield className="w-3.5 h-3.5 mr-1 text-zinc-400" />
                      Grant Edit
                    </span>
                  </label>

                  {/* Create Account Gate */}
                  <label className={`inline-flex min-h-10 items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-semibold text-zinc-700 select-none cursor-pointer dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-300 ${author.can_edit ? 'opacity-70 cursor-not-allowed' : ''}`}>
                    <input
                      type="checkbox"
                      checked={author.create_account}
                      disabled={author.can_edit}
                      onChange={(e) => updateCoAuthor(index, 'create_account', e.target.checked)}
                      className="w-4 h-4 rounded border-zinc-300 text-amber-600 focus:ring-amber-500 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <span className="flex items-center">
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
