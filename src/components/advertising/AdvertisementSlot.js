'use client';

import { useEffect, useState } from 'react';
import api from '../../utils/api';

export default function AdvertisementSlot({ placement, ads, context, className = '', sticky = false }) {
  const [resolved, setResolved] = useState(ads || []);
  const contextKey = JSON.stringify(context || {});

  useEffect(() => {
    if (ads || !context) return;
    let active = true;
    api.get('/advertisements/resolve', { params: context })
      .then(({ data }) => { if (active) setResolved(data?.advertisements?.[placement] || []); })
      .catch(() => { if (active) setResolved([]); });
    return () => { active = false; };
  }, [ads, contextKey, placement]);

  if (!resolved.length) return null;
  return (
    <aside className={`${sticky ? 'lg:sticky lg:top-24' : ''} ${className}`} aria-label="Advertisements">
      <p className="mb-2 text-center text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-400">Advertisement</p>
      <div className="flex flex-col items-center gap-4">
        {resolved.map((ad) => {
          const image = <img src={ad.image_url} alt={ad.alt_text || ad.title || 'Advertisement'} className="h-auto max-h-[280px] w-full max-w-[970px] rounded-lg object-contain" loading="lazy" />;
          return ad.redirect_url ? (
            <a key={ad.id} href={ad.redirect_url} target={ad.open_in_new_tab ? '_blank' : undefined} rel={ad.open_in_new_tab ? 'noopener noreferrer' : undefined} className="block w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500">{image}</a>
          ) : <div key={ad.id} className="w-full">{image}</div>;
        })}
      </div>
    </aside>
  );
}
