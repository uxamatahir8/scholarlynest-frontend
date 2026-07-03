import React from 'react';
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react';

const tones = {
  info: ['border-blue-500/20 bg-blue-500/[0.06] text-blue-800 dark:text-blue-200', Info],
  success: ['border-emerald-500/20 bg-emerald-500/[0.07] text-emerald-800 dark:text-emerald-200', CheckCircle2],
  warning: ['border-amber-500/25 bg-amber-500/[0.08] text-amber-850 dark:text-amber-200', TriangleAlert],
  danger: ['border-red-500/20 bg-red-500/[0.07] text-red-800 dark:text-red-200', AlertCircle],
};

export default function Alert({ tone = 'info', title, children, className = '', ...props }) {
  const [classes, Icon] = tones[tone] || tones.info;
  return (
    <div className={`flex items-start gap-3 rounded-lg border p-4 ${classes} ${className}`} {...props}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0">
        {title && <h3 className="text-sm font-bold">{title}</h3>}
        {children && <div className="text-sm leading-relaxed">{children}</div>}
      </div>
    </div>
  );
}
