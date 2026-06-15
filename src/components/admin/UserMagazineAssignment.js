import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

export default function UserMagazineAssignment({ selectedRoleId, roles, value, onChange }) {
  const [magazines, setMagazines] = useState([]);
  const [loading, setLoading] = useState(false);

  // Find if selectedRoleId corresponds to the magazine_editor role
  const isMagazineEditor = React.useMemo(() => {
    const role = roles.find(r => r.id === Number(selectedRoleId));
    return role && (role.name === 'magazine_editor' || role.name === 'magazine-editor');
  }, [selectedRoleId, roles]);

  useEffect(() => {
    if (!isMagazineEditor) {
      return;
    }

    const fetchMagazines = async () => {
      setLoading(true);
      try {
        const res = await api.get('/public/magazines');
        const data = res.data?.data || res.data || [];
        setMagazines(data);
      } catch (err) {
        console.error('Failed to fetch magazines for assignment', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMagazines();
  }, [isMagazineEditor]);

  if (!isMagazineEditor) {
    return null;
  }

  const handleCheckboxChange = (magazineId, checked) => {
    const currentValues = Array.isArray(value) ? value : [];
    let nextValues;
    if (checked) {
      nextValues = [...currentValues, magazineId];
    } else {
      nextValues = currentValues.filter(id => id !== magazineId);
    }
    onChange(nextValues);
  };

  return (
    <div className="space-y-2 mt-4 font-roboto">
      <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] block">
        Assigned Editorial Jurisdictions
      </span>
      {loading ? (
        <div className="text-[11px] text-[var(--muted)] animate-pulse py-2">
          Loading magazines...
        </div>
      ) : magazines.length === 0 ? (
        <div className="text-[11px] text-[var(--muted)] py-2">
          No magazines available.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 border border-[var(--muted-border)] rounded-xl bg-black/5 dark:bg-white/5">
          {magazines.map((mag) => {
            const isChecked = Array.isArray(value) && value.includes(mag.id);
            return (
              <label key={mag.id} className="flex items-center space-x-2.5 cursor-pointer hover:bg-[var(--foreground)]/5 p-1 rounded transition-colors">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => handleCheckboxChange(mag.id, e.target.checked)}
                  className="w-4 h-4 rounded border-[var(--muted-border)] text-[var(--accent)] focus:ring-[var(--accent)] cursor-pointer"
                />
                <span className="text-xs font-semibold text-[var(--foreground)] truncate">
                  {mag.title}
                </span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
