'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MessageSquare } from 'lucide-react';
import api from '../../../utils/api';
import { articleThreadHref } from './threadUtils.mjs';

export default function ThreadUnreadSummary() {
  const [data, setData] = useState(null);
  useEffect(() => {
    let active = true;
    const load = () => api.get('/article-threads/unread-count').then((response) => { if (active) setData(response.data?.data || null); }).catch(() => {});
    load();
    const timer = window.setInterval(load, 30000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);
  if (!data?.unread_count) return null;
  const first = data.articles?.[0];
  const href = articleThreadHref(first);
  return <Link href={href} className="flex items-center justify-between gap-4 rounded-xl border border-sky-300 bg-sky-50 px-4 py-3 text-sm text-sky-950 dark:bg-sky-950/30 dark:text-sky-100"><span className="inline-flex items-center gap-2 font-bold"><MessageSquare className="h-5 w-5"/>{data.unread_count} unread article message{data.unread_count === 1 ? '' : 's'}</span><span className="text-xs font-semibold">Open communication →</span></Link>;
}
