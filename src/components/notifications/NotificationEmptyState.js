import React from 'react';
import { Bell } from 'lucide-react';
import EmptyState from '../ui/EmptyState';

export default function NotificationEmptyState({ archived = false }) {
  return (
    <EmptyState icon={Bell} title={archived ? 'No archived notifications' : "You're all caught up"} className="m-4">
      {archived ? 'Notifications you archive will remain available here.' : 'New assignments and workflow updates will appear here.'}
    </EmptyState>
  );
}
