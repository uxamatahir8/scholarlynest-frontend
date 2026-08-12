'use client';

import React, { useEffect } from 'react';
import { formatPageTitle } from '../utils/pageTitle';

export default function PageTitle({ title, fallback = 'Home' }) {
  const resolvedTitle = formatPageTitle(title, fallback);

  useEffect(() => {
    document.title = resolvedTitle;
  }, [resolvedTitle]);

  return null;
}
