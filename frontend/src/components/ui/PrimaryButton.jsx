import React from 'react';

export default function PrimaryButton({ children, className = '', size = 'md', ...props }) {
  const sizeClasses = size === 'lg' ? 'px-8 py-4 text-lg' : size === 'sm' ? 'px-4 py-2 text-sm' : 'px-6 py-3';
  return (
    <button
      className={`btn-primary inline-flex items-center gap-2 ${sizeClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
