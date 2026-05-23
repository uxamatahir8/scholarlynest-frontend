'use client';

import React from 'react';
import Image from 'next/image';
import Breadcrumbs from './Breadcrumbs';

export default function PageBanner({ title, description, customLabels }) {
  return (
    <div className="relative w-full h-[360px] md:h-[400px] flex flex-col justify-end overflow-hidden mb-12">
      {/* Dynamic Background */}
      <div className="absolute inset-0">
        <Image
          src="/page-banner.jpg"
          alt="Page Banner Background"
          fill
          priority
          className="object-cover object-center"
        />
        {/* Exact matching homepage contrast gradient mask & radial mesh overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--background)]/85 via-[var(--background)]/75 to-[var(--background)] pointer-events-none" />
        <div className="absolute inset-0 bg-mesh opacity-55 mix-blend-screen pointer-events-none" />
        {/* Deep dark fade overlay at bottom */}
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[var(--background)] to-transparent pointer-events-none" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-12">
        <div className="mb-6 inline-flex">
          <Breadcrumbs customLabels={customLabels} />
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[var(--foreground)] leading-tight mb-4">
          {title}
        </h1>
        {description && (
          <p className="text-sm sm:text-base text-[var(--muted)] max-w-2xl font-medium leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
