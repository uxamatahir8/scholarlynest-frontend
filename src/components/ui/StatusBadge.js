import React from 'react';
import { Badge } from './Badge';
import { getStatusLabel, getStatusTone } from '../../utils/status';

export default function StatusBadge({ status, className = '' }) {
  return <Badge variant={getStatusTone(status)} className={className}>{getStatusLabel(status)}</Badge>;
}
