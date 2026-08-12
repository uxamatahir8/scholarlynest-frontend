import React from 'react';
import { Button } from './Button';

export default function IconButton({ icon, label, 'aria-label': ariaLabel, ...props }) {
  return <Button size="icon" icon={icon} aria-label={ariaLabel || label} {...props} />;
}
