import React from 'react';
import EmptyState from '../../ui/EmptyState';

export default function DashboardEmptyState({ title = 'Nothing needs attention right now', children, action }) {
  return (
    <EmptyState title={title} action={action}>
      {children}
    </EmptyState>
  );
}
