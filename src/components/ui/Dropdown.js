import React, { useEffect, useRef, useState } from 'react';

export default function Dropdown({ trigger, children, align = 'right', className = '' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  return (
    <div ref={ref} className="relative inline-block text-left">
      <div className="cursor-pointer" onClick={() => setOpen((value) => !value)}>
        {trigger}
      </div>
      {open && (
        <div className={`absolute z-50 mt-2 min-w-44 rounded-xl border border-zinc-200 bg-white/95 p-1.5 shadow-xl shadow-zinc-950/10 dark:border-zinc-800 dark:bg-zinc-900/95 backdrop-blur-md animate-in fade-in slide-in-from-top-1 duration-200 ${align === 'left' ? 'left-0' : 'right-0'} ${className}`}>
          {typeof children === 'function' ? children({ close: () => setOpen(false) }) : children}
        </div>
      )}
    </div>
  );
}
