import React from 'react';
import { Loader2 } from 'lucide-react';

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  isLoading = false, 
  className = '', 
  disabled,
  icon: Icon,
  ...props 
}) {
  
  const baseStyles = "inline-flex items-center justify-center font-bold uppercase tracking-wider rounded-lg transition-premium focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-[var(--accent)] text-white hover:bg-blue-800 dark:hover:bg-blue-500 shadow-[0_0_15px_rgba(30,58,138,0.5)] dark:shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:scale-[1.02] border border-blue-700 dark:border-blue-400/50",
    gold: "bg-[var(--accent-gold)] text-slate-900 hover:bg-yellow-500 shadow-[0_0_15px_rgba(205,164,52,0.4)] dark:shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:scale-[1.02] border border-yellow-600 dark:border-yellow-400/50",
    secondary: "bg-white/10 dark:bg-black/20 text-[var(--foreground)] hover:bg-white/20 dark:hover:bg-white/10 border border-[var(--muted-border)] backdrop-blur-md shadow-sm hover:scale-[1.02]",
    danger: "bg-red-500/10 text-red-600 hover:bg-red-500/20 dark:text-red-400 border border-red-500/30 shadow-sm",
    ghost: "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-black/5 dark:hover:bg-white/5",
    link: "text-[var(--accent)] dark:text-[var(--accent-gold)] underline-offset-4 hover:underline"
  };

  const sizes = {
    sm: "text-[10px] px-3 py-1.5",
    md: "text-xs px-5 py-2.5",
    lg: "text-sm px-8 py-3.5",
    icon: "p-2.5"
  };

  const combinedClassName = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

  return (
    <button 
      className={combinedClassName} 
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : Icon ? (
        <Icon className={`w-4 h-4 ${children ? 'mr-2' : ''}`} />
      ) : null}
      {children}
    </button>
  );
}
