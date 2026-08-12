'use client';

import { useEffect, useRef, useState } from 'react';
import api from '../../utils/api';

const resolutionRequests = new Map();

function resolveAdvertisements(context, contextKey) {
  if (!resolutionRequests.has(contextKey)) {
    resolutionRequests.set(contextKey, api.get('/advertisements/resolve', { params: context }).then(({ data }) => data?.advertisements || {}).catch((error) => {
      resolutionRequests.delete(contextKey);
      throw error;
    }));
  }
  return resolutionRequests.get(contextKey);
}

export default function AdvertisementSlot({ placement, ads, context, className = '', sticky = false }) {
  const [resolved, setResolved] = useState(ads || []);
  const contextKey = JSON.stringify(context || {});
  const viewed = useRef(new Set());

  const track = (adId, eventType) => {
    if (!context?.article_id || typeof window === 'undefined') return;
    const key = `${eventType}:${adId}`;
    if (viewed.current.has(key)) return;
    viewed.current.add(key);
    let sessionToken = sessionStorage.getItem('scholarlynest_ad_session');
    if (!sessionToken) { sessionToken = crypto.randomUUID(); sessionStorage.setItem('scholarlynest_ad_session', sessionToken); }
    api.post(`/advertisements/${adId}/events`, { article_id: context.article_id, event_type: eventType, placement, session_token: sessionToken }).catch(() => viewed.current.delete(key));
  };

  useEffect(() => {
    if (ads || !context) return;
    let active = true;
    resolveAdvertisements(context, contextKey)
      .then((placements) => { if (active) setResolved(placements?.[placement] || []); })
      .catch(() => { if (active) setResolved([]); });
    return () => { active = false; };
  }, [ads, contextKey, placement]);

  if (!resolved.length) return null;
  return (
    <aside className={`${sticky ? 'lg:sticky lg:top-24' : ''} ${className}`} aria-label="Advertisements">
      <p className="mb-2 text-center text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-400">Advertisement</p>
      <div className="flex flex-col items-center gap-4">
        {Array.from(new Map(resolved.map((ad) => [ad.id, ad])).values()).map((ad) => {
          const image = <img src={ad.image_url} alt={ad.alt_text || ad.title || 'Advertisement'} width={ad.width || 300} height={ad.height || 250} className="h-auto max-h-[280px] w-full max-w-[970px] rounded-lg object-contain" loading="lazy" decoding="async" />;
          return ad.redirect_url ? (
            <TrackedAdvertisement key={ad.id} ad={ad} onVisible={() => track(ad.id, 'impression')} onClick={() => track(ad.id, 'click')}>{image}</TrackedAdvertisement>
          ) : <TrackedAdvertisement key={ad.id} ad={ad} onVisible={() => track(ad.id, 'impression')}>{image}</TrackedAdvertisement>;
        })}
      </div>
    </aside>
  );
}

function TrackedAdvertisement({ ad, onVisible, onClick, children }) {
  const elementRef = useRef(null);
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return undefined;
    const observer = new IntersectionObserver(([entry]) => { if (entry?.isIntersecting && entry.intersectionRatio >= 0.5) { onVisible(); observer.disconnect(); } }, { threshold: 0.5 });
    observer.observe(element);
    return () => observer.disconnect();
  }, [onVisible]);
  if (!ad.redirect_url) return <div ref={elementRef} className="w-full">{children}</div>;
  return <a ref={elementRef} href={ad.redirect_url} onClick={onClick} target={ad.open_in_new_tab ? '_blank' : undefined} rel="noopener noreferrer sponsored" className="block w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500">{children}</a>;
}
