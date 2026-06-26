import React from 'react';

export default function GlassCard({ children, className = '', hover = true, padding = true, ...props }) {
  return (
    <div
      className={`
        glass-card
        ${padding ? 'p-6' : ''}
        ${hover ? 'hover:shadow-lg hover:-translate-y-0.5 transition-[box-shadow,transform] duration-300' : ''}
        ${className}
      `.trim()}
      {...props}
    >
      {children}
    </div>
  );
}
