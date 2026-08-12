'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Loading from '../app/loading';

export default function TransitionWrapper({ children }) {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [delayedPathname, setDelayedPathname] = useState(pathname);

  // Path change route loader interceptor
  useEffect(() => {
    if (pathname !== delayedPathname) {
      setLoading(true);
      const timer = setTimeout(() => {
        setDelayedPathname(pathname);
        setLoading(false);
      }, 800); // Premium 800ms intentional showcase delay
      return () => clearTimeout(timer);
    }
  }, [pathname, delayedPathname]);

  // Initial site access load trigger
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {loading && <Loading />}
      <div className={`flex-grow flex flex-col w-full transition-opacity duration-300 ${loading ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        {children}
      </div>
    </>
  );
}
