'use client';

import React, { useMemo, useState } from 'react';
import { Link2, X } from 'lucide-react';
import Alert from '../../ui/Alert';
import Field from '../../ui/Field';
import { Input } from '../../ui/Input';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/Card';

export default function SubEditorAssignmentSection({ visible, editors, selectedEditorIds, onChange, error }) {
  const [query, setQuery] = useState('');

  const selectedEditors = useMemo(() => (
    selectedEditorIds.map((id) => editors.find((editor) => Number(editor.id) === Number(id))).filter(Boolean)
  ), [editors, selectedEditorIds]);

  const filteredEditors = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return editors
      .filter((editor) => !selectedEditorIds.includes(editor.id))
      .filter((editor) => !normalizedQuery || editor.name.toLowerCase().includes(normalizedQuery) || editor.email.toLowerCase().includes(normalizedQuery));
  }, [editors, query, selectedEditorIds]);

  const toggleEditor = (editorId) => {
    onChange(selectedEditorIds.includes(editorId)
      ? selectedEditorIds.filter((id) => id !== editorId)
      : [...selectedEditorIds, editorId]);
  };

  if (!visible) return null;

  return (
    <Card className="border border-[var(--border)] bg-[var(--surface)]">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-[var(--muted)]" aria-hidden="true" />
          <CardTitle>Work Assignment</CardTitle>
        </div>
        <CardDescription>
          Sub Editors must stay linked to at least one real Editor before they can receive workflow assignments.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {editors.length === 0 ? (
          <Alert tone="warning" title="No Editor accounts available">
            Create or activate an Editor account before creating a Sub Editor.
          </Alert>
        ) : (
          <>
            <Field
              label="Assigned Editor(s)"
              required
              error={error}
              helperText="Select at least one Editor. Backend validation remains the source of truth."
            >
              <Input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search Editors by name or email"
              />
            </Field>

            {selectedEditors.length > 0 && (
              <div className="flex flex-wrap gap-2" aria-label="Selected editors">
                {selectedEditors.map((editor) => (
                  <Badge key={editor.id} variant="info" className="gap-1">
                    {editor.name}
                    <button
                      type="button"
                      onClick={() => toggleEditor(editor.id)}
                      className="ml-1 rounded-full p-0.5 hover:bg-blue-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                      aria-label={`Remove ${editor.name}`}
                    >
                      <X className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            <div className="grid max-h-60 gap-2 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-2">
              {filteredEditors.length === 0 ? (
                <p className="p-3 text-sm text-[var(--muted)]">No matching Editors are available.</p>
              ) : filteredEditors.map((editor) => (
                <button
                  key={editor.id}
                  type="button"
                  onClick={() => toggleEditor(editor.id)}
                  className="rounded-lg border border-transparent bg-[var(--surface)] p-3 text-left transition-colors hover:border-[var(--border)] hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                >
                  <span className="block text-sm font-bold text-[var(--foreground)]">{editor.name}</span>
                  <span className="block text-xs text-[var(--muted)]">{editor.email}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
