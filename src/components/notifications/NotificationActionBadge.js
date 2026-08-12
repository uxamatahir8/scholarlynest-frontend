import React from 'react';
import { Badge } from '../ui/Badge';

export default function NotificationActionBadge({ action }) {
  if (!action || action.status === 'none') return null;
  const tone = action.status === 'pending' ? 'warning' : action.status === 'completed' ? 'success' : 'neutral';
  const label = action.status === 'pending' ? 'Action required' : action.status.replace('_', ' ');
  return <Badge tone={tone}>{label}</Badge>;
}
