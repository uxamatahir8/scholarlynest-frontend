import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

export default function MagazineFormFields({ value, onChange, disabled = false }) {
  const [editors, setEditors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEditors = async () => {
      try {
        const res = await api.get('/admin/users?role=magazine_editor');
        setEditors(res.data || []);
      } catch (err) {
        console.error('Failed to fetch magazine editors', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEditors();
  }, []);

  return (
    <div className="space-y-1 font-roboto">
      <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] font-mono block">
        Designated Magazine Editor
      </label>
      {loading ? (
        <div className="text-[11px] text-[var(--muted)] animate-pulse py-2">
          Loading eligible editors...
        </div>
      ) : (
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full text-xs font-semibold px-3 py-2.5 bg-[var(--background)] border border-[var(--muted-border)] rounded-lg focus:outline-none focus:border-[var(--accent)] transition-colors text-[var(--foreground)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >

          <option value="">No Editor Assigned</option>
          {editors.map((editor) => (
            <option key={editor.id} value={editor.id}>
              {editor.name} ({editor.email})
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
