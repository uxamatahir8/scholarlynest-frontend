'use client';

import React, { forwardRef, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Loader2, Search, X } from 'lucide-react';

const baseControlStyles = 'w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] shadow-sm transition-all duration-200 placeholder:text-zinc-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-60';

const textLabel = (label) => {
  if (typeof label === 'string' || typeof label === 'number') return String(label);
  if (Array.isArray(label)) return label.map(textLabel).join('');
  return '';
};

export const optionsFromChildren = (children) => {
  const options = [];
  const visit = (nodes) => React.Children.forEach(nodes, (child) => {
    if (!React.isValidElement(child)) return;
    if (child.type === React.Fragment || child.type === 'optgroup') {
      visit(child.props.children);
      return;
    }
    if (child.type !== 'option') return;
    options.push({
      value: String(child.props.value ?? textLabel(child.props.children)),
      label: textLabel(child.props.children),
      disabled: Boolean(child.props.disabled),
    });
  });
  visit(children);
  return options;
};

const SearchableSelect = forwardRef(function SearchableSelect({
  options = [],
  value,
  onChange,
  placeholder = 'Select an option',
  searchPlaceholder = 'Search options...',
  emptyMessage = 'No matching options.',
  loading = false,
  disabled = false,
  clearable = false,
  multiple = false,
  required = false,
  error,
  helperText,
  id,
  name,
  className = '',
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': describedBy,
  'aria-invalid': ariaInvalid,
}, forwardedRef) {
  const generatedId = useId();
  const selectId = id || generatedId;
  const rootRef = useRef(null);
  const searchRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlighted, setHighlighted] = useState(0);
  const selectedValues = useMemo(() => new Set((multiple ? (Array.isArray(value) ? value : []) : [value]).filter((item) => item !== undefined && item !== null).map(String)), [multiple, value]);
  const normalizedOptions = useMemo(() => options.map((option) => Array.isArray(option)
    ? { value: String(option[0]), label: String(option[1]), disabled: false }
    : { ...option, value: String(option.value), label: textLabel(option.label) }), [options]);
  const visibleOptions = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return needle ? normalizedOptions.filter((option) => option.label.toLowerCase().includes(needle)) : normalizedOptions;
  }, [normalizedOptions, query]);
  const selectedOptions = normalizedOptions.filter((option) => selectedValues.has(option.value));
  const displayLabel = multiple
    ? selectedOptions.map((option) => option.label).join(', ')
    : selectedOptions[0]?.label;
  const errorId = error ? `${selectId}-error` : undefined;
  const helperId = helperText ? `${selectId}-helper` : undefined;
  const description = [describedBy, helperId, errorId].filter(Boolean).join(' ') || undefined;

  useEffect(() => {
    if (!open) return undefined;
    const closeOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', closeOutside);
    return () => document.removeEventListener('mousedown', closeOutside);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setHighlighted(0);
    window.requestAnimationFrame(() => searchRef.current?.focus());
  }, [open]);

  const choose = (option) => {
    if (!option || option.disabled) return;
    if (multiple) {
      const next = selectedValues.has(option.value)
        ? [...selectedValues].filter((item) => item !== option.value)
        : [...selectedValues, option.value];
      onChange?.(next);
      return;
    }
    onChange?.(option.value);
    setOpen(false);
  };

  const clear = (event) => {
    event.stopPropagation();
    onChange?.(multiple ? [] : '');
  };

  const handleKeys = (event) => {
    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      setHighlighted((current) => Math.max(0, Math.min(visibleOptions.length - 1, current + direction)));
      return;
    }
    if (event.key === 'Enter' && open) {
      event.preventDefault();
      choose(visibleOptions[highlighted]);
    }
  };

  return (
    <div ref={rootRef} className="relative w-full">
      {name && !multiple && <input type="hidden" name={name} value={value ?? ''} />}
      {name && multiple && [...selectedValues].map((item) => <input key={item} type="hidden" name={`${name}[]`} value={item} />)}
      <button
        ref={forwardedRef}
        id={selectId}
        type="button"
        role="combobox"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={description}
        aria-expanded={open}
        aria-controls={`${selectId}-listbox`}
        aria-required={required || undefined}
        aria-invalid={error ? 'true' : ariaInvalid}
        disabled={disabled || loading}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={handleKeys}
        className={`${baseControlStyles} flex min-h-10 items-center justify-between gap-2 pr-3 text-left ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30' : ''} ${className}`}
      >
        <span className={`min-w-0 flex-1 truncate ${displayLabel ? '' : 'text-zinc-400'}`}>{displayLabel || placeholder}</span>
        <span className="flex shrink-0 items-center gap-1">
          {loading && <Loader2 className="h-4 w-4 animate-spin text-[var(--muted)]" aria-hidden="true" />}
          {clearable && selectedOptions.length > 0 && !disabled && <span role="button" tabIndex={-1} onClick={clear} aria-label="Clear selection" className="rounded p-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"><X className="h-3.5 w-3.5" /></span>}
          <ChevronDown className={`h-4 w-4 text-[var(--muted)] transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
        </span>
      </button>

      {open && (
        <div className="absolute z-[120] mt-1 w-full min-w-[14rem] overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] shadow-lg backdrop-blur">
          <div className="relative border-b border-[var(--border)] p-2">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" aria-hidden="true" />
            <input ref={searchRef} value={query} onChange={(event) => { setQuery(event.target.value); setHighlighted(0); }} onKeyDown={handleKeys} placeholder={searchPlaceholder} className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-[var(--focus-ring)]" />
          </div>
          <div id={`${selectId}-listbox`} role="listbox" aria-multiselectable={multiple || undefined} className="max-h-64 overflow-y-auto p-1">
            {visibleOptions.length === 0 ? <p className="px-3 py-6 text-center text-sm text-[var(--muted)]">{emptyMessage}</p> : visibleOptions.map((option, index) => {
              const selected = selectedValues.has(option.value);
              return (
                <button key={`${option.value}-${index}`} type="button" role="option" aria-selected={selected} disabled={option.disabled} onMouseEnter={() => setHighlighted(index)} onClick={() => choose(option)} className={`flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm ${highlighted === index ? 'bg-amber-500/10 text-[var(--foreground)]' : 'text-[var(--foreground)] hover:bg-[var(--surface-muted)]'} disabled:opacity-40`}>
                  <span>{option.label}</span>{selected && <Check className="h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
      {helperText && <span id={helperId} className="mt-1.5 block text-xs text-[var(--muted)]">{helperText}</span>}
      {error && <span id={errorId} className="mt-1.5 block text-xs font-semibold text-red-600 dark:text-red-400">{error}</span>}
    </div>
  );
});

export default SearchableSelect;
