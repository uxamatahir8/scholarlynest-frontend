'use client';

import { useEffect, useState } from 'react';

export default function ArticleTableOfContents({ items }) {
  const [activeId, setActiveId] = useState(items[0]?.id || '');

  useEffect(() => {
    const elements = items.map(({ id }) => document.getElementById(id)).filter(Boolean);
    if (!elements.length) return undefined;
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]) setActiveId(visible[0].target.id);
    }, { rootMargin: '-112px 0px -65% 0px', threshold: [0, 0.1] });
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [items]);

  const navigate = (event, id) => {
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    window.history.replaceState(null, '', `#${id}`);
    setActiveId(id);
  };

  return (
    <nav className="rounded-2xl bg-white/90 p-4 shadow-sm ring-1 ring-zinc-200/70 dark:bg-zinc-900/80 dark:ring-zinc-800" aria-label="Article sections">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">Sections</p>
      <ul className="space-y-1">
        {items.map((item) => <li key={item.id}><a href={`#${item.id}`} aria-current={activeId === item.id ? 'location' : undefined} onClick={(event) => navigate(event, item.id)} className={`block rounded-lg border-l-2 px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${activeId === item.id ? 'border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300' : 'border-transparent text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'}`}>{item.label}</a></li>)}
      </ul>
    </nav>
  );
}
