import React from 'react';

export default function DataTable({ columns, data, className = '', onRowClick, emptyMessage = 'Sin datos' }) {
  if (columns.length === 0) {
    return (
      <div className={`glass-card p-8 text-center text-sm opacity-60 ${className}`}>
        Sin columnas visibles para tu rol.
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto glass-card p-0 ${className}`}>
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-white/10">
            {columns.map((col, i) => (
              <th key={i} className="px-4 py-3 text-xs font-semibold uppercase tracking-wider opacity-60" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="zebra-glass">
          {data.length === 0 ? (
            <tr><td colSpan={columns.length} className="px-4 py-8 text-center opacity-50">{emptyMessage}</td></tr>
          ) : (
            data.map((row, ri) => (
              <tr key={row.id || ri} className={`border-b border-white/5 transition-colors ${onRowClick ? 'cursor-pointer hover:bg-white/5' : ''}`} onClick={() => onRowClick?.(row)}>
                {columns.map((col, ci) => (
                  <td key={ci} className="px-4 py-3 text-sm">{col.render ? col.render(row) : row[col.field]}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
