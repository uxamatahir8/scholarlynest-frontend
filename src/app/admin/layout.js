import React from 'react';
import AdminLayoutClient from './AdminLayoutClient';

export const metadata = {
  title: {
    default: 'Dashboard',
    template: '%s | ScholarlyNest',
  },
};

export default function AdminLayout({ children }) {
  return (
    <AdminLayoutClient>
      {children}
    </AdminLayoutClient>
  );
}
