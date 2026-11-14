import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'danger' | 'warning' | 'neutral' | 'purple' | 'info' | 'copper';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'sm',
  className = '',
}) => {
  const variantStyles = {
    primary: 'bg-forest-950/80 text-forest-300 border-forest-800/70',
    info: 'bg-archival-800 text-archival-300 border-archival-700',
    success: 'bg-forest-950/90 text-forest-300 border-forest-700/80',
    danger: 'bg-rose-950/80 text-rose-300 border-rose-800/70',
    warning: 'bg-amber-950/80 text-amber-300 border-amber-800/70',
    copper: 'bg-copper-950/80 text-copper-300 border-copper-800/70',
    neutral: 'bg-archival-850 text-archival-400 border-archival-750',
    purple: 'bg-purple-950/80 text-purple-300 border-purple-800/60',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2.5 py-0.5 tracking-tight',
    md: 'text-xs px-3 py-1 font-medium',
  };

  return (
    <span
      className={`inline-flex items-center font-medium border rounded-md ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
};
