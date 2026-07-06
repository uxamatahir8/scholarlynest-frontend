import React from 'react';
import Alert from './Alert';

export default function ErrorState({ title = 'Something went wrong', children, className = '' }) {
  return <Alert tone="danger" title={title} className={className}>{children}</Alert>;
}
