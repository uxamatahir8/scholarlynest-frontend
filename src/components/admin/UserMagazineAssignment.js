import { logError } from '../../utils/safeLogger';
import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import {
  normalizeRoleName,
  roleRequiresMagazineAssignment,
} from './articleWorkflow';

export default function UserMagazineAssignment({ selectedRoleId, roles, value, onChange }) {
  const [magazines, setMagazines] = useState([]);
  const [loading, setLoading] = useState(false);

  const assignmentRole = React.useMemo(() => {
    const role = roles.find(r => r.id === Number(selectedRoleId));
    const normalizedName = normalizeRoleName(role?.name);
    return roleRequiresMagazineAssignment(normalizedName)
      ? normalizedName
      : null;
  }, [selectedRoleId, roles]);

  useEffect(() => {
    if (!assignmentRole) {
      return;
    }

    const fetchMagazines = async () => {
      setLoading(true);
      try {
        const res = await api.get('/public/magazines');
        const data = res.data?.data || res.data || [];
        setMagazines(data);
      } catch (err) {
        logError('Failed to fetch magazines for assignment', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMagazines();
  }, [assignmentRole]);

  if (!assignmentRole) {
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
        Assigned Magazine Scope
      </span>
      <p className="text-[11px] text-[var(--muted)] leading-relaxed">
        Scope this {assignmentRole.replaceAll('_', ' ')} account to the selected magazines.
      </p>
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
