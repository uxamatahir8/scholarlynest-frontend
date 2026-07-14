'use client';

import { forwardRef, useEffect, useId, useImperativeHandle, useRef } from 'react';
import flatpickr from 'flatpickr';
import { CalendarDays } from 'lucide-react';

const formats = {
  date: { storage: 'Y-m-d', display: 'd-M-Y', enableTime: false, noCalendar: false },
  datetime: { storage: 'Y-m-d H:i:S', display: 'd-M-Y H:i', enableTime: true, noCalendar: false },
  time: { storage: 'H:i:S', display: 'H:i', enableTime: true, noCalendar: true },
};

const FlatpickrInput = forwardRef(function FlatpickrInput({
  mode = 'date', value = '', onChange, minDate, maxDate, disabled = false,
  required = false, placeholder, error, helperText, id, name, className = '',
  'aria-label': ariaLabel, 'aria-describedby': describedBy,
}, forwardedRef) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const inputRef = useRef(null);
  const pickerRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const config = formats[mode] || formats.date;
  const errorId = error ? `${inputId}-error` : undefined;
  const helperId = helperText ? `${inputId}-helper` : undefined;
  const description = [describedBy, helperId, errorId].filter(Boolean).join(' ') || undefined;

  onChangeRef.current = onChange;
  useImperativeHandle(forwardedRef, () => inputRef.current);

  useEffect(() => {
    if (!inputRef.current) return undefined;
    pickerRef.current = flatpickr(inputRef.current, {
      altInput: true,
      altFormat: config.display,
      dateFormat: config.storage,
      enableTime: config.enableTime,
      noCalendar: config.noCalendar,
      time_24hr: true,
      allowInput: true,
      clickOpens: !disabled,
      defaultDate: value || undefined,
      minDate: minDate || undefined,
      maxDate: maxDate || undefined,
      onChange: (_dates, dateString) => onChangeRef.current?.(dateString),
      onClose: (_dates, dateString) => onChangeRef.current?.(dateString),
    });
    pickerRef.current.altInput?.setAttribute('aria-label', ariaLabel || placeholder || (mode === 'datetime' ? 'Choose date and time' : mode === 'time' ? 'Choose time' : 'Choose date'));
    pickerRef.current.altInput?.setAttribute('aria-describedby', description || '');
    pickerRef.current.altInput?.setAttribute('aria-invalid', error ? 'true' : 'false');
    if (required) pickerRef.current.altInput?.setAttribute('aria-required', 'true');
    if (disabled) pickerRef.current.altInput?.setAttribute('disabled', 'disabled');
    return () => {
      pickerRef.current?.destroy();
      pickerRef.current = null;
    };
  }, [mode, config.display, config.enableTime, config.noCalendar, config.storage, disabled, minDate, maxDate, required, ariaLabel, placeholder, description, error]);

  useEffect(() => {
    if (!pickerRef.current) return;
    const current = pickerRef.current.input.value;
    if ((value || '') !== current) pickerRef.current.setDate(value || null, false, config.storage);
  }, [value, config.storage]);

  return (
    <div className="relative w-full">
      <input
        ref={inputRef}
        id={inputId}
        name={name}
        type="hidden"
        disabled={disabled}
        required={required}
        placeholder={placeholder || (mode === 'datetime' ? 'dd-Mmm-yyyy hh:mm' : mode === 'time' ? 'hh:mm' : 'dd-Mmm-yyyy')}
        aria-label={ariaLabel}
        aria-describedby={description}
        className={`w-full rounded-lg border bg-[var(--surface)] px-4 py-2.5 pr-10 text-sm font-medium text-[var(--foreground)] shadow-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-[var(--focus-ring)] disabled:opacity-60 ${error ? 'border-red-500' : 'border-[var(--border)]'} ${className}`}
      />
      <CalendarDays className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-[var(--muted)]" aria-hidden="true" />
      {helperText && <span id={helperId} className="mt-1.5 block text-xs text-[var(--muted)]">{helperText}</span>}
      {error && <span id={errorId} className="mt-1.5 block text-xs font-semibold text-red-600 dark:text-red-400">{error}</span>}
    </div>
  );
});

export default FlatpickrInput;
