import React from 'react';

export default function DataTable({ columns, data, className = '', onRowClick, emptyMessage = 'Sin datos', selectedRowId = '' }) {
  if (columns.length === 0) {
    return (
      <div className={`glass-card p-8 text-center text-sm opacity-60 ${className}`}>
        Sin columnas visibles para tu rol.
      </div>
    );
  }

  const prioritizedMobileColumns = [...columns]
    .filter((column) => column.mobilePriority !== 'hidden')
    .sort((first, second) => (first.mobilePriority ?? 99) - (second.mobilePriority ?? 99));
  const mobileColumns = prioritizedMobileColumns.length > 0 ? prioritizedMobileColumns : [columns[0]];

  function selectRow(row) {
    onRowClick?.(row);
  }

  function handleRowKeyDown(event, row) {
    if (!onRowClick || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    selectRow(row);
  }

  function renderValue(column, row) {
    return column.render ? column.render(row) : row[column.field];
  }

  return (
    <div className={`glass-card overflow-hidden p-0 ${className}`}>
      <div className="hidden overflow-x-auto md:block">
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
            data.map((row, ri) => {
              const rowProps = onRowClick ? {
                onClick: () => selectRow(row),
                onKeyDown: (event) => handleRowKeyDown(event, row),
                tabIndex: 0,
                'aria-selected': selectedRowId === row.id,
              } : {};
              return (
                <tr
                  key={row.id || ri}
                  className={`border-b border-white/5 transition-colors ${selectedRowId === row.id ? 'bg-white/40' : ''} ${onRowClick ? 'cursor-pointer hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-400' : ''}`}
                  {...rowProps}
                >
                  {columns.map((col, ci) => (
                    <td key={ci} className="max-w-xs break-words px-4 py-3 text-sm">{renderValue(col, row)}</td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
      </div>
      <div className="divide-y divide-white/10 md:hidden">
        {data.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm opacity-50">{emptyMessage}</p>
        ) : (
          data.map((row, index) => {
            const Row = onRowClick ? 'button' : 'div';
            const rowProps = onRowClick ? {
              type: 'button',
              onClick: () => selectRow(row),
              'aria-pressed': selectedRowId === row.id,
            } : {};
            return (
              <Row
                key={row.id || index}
                className={`block w-full p-4 text-left transition-colors ${selectedRowId === row.id ? 'bg-white/40' : ''} ${onRowClick ? 'cursor-pointer hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-400' : ''}`}
                {...rowProps}
              >
                <dl className="space-y-2">
                  {mobileColumns.map((column) => (
                    <div key={column.field || column.header} className="grid grid-cols-[minmax(5.5rem,0.45fr)_minmax(0,1fr)] gap-3 text-sm">
                      <dt className="text-xs font-semibold uppercase tracking-wide opacity-60">{column.header}</dt>
                      <dd className="min-w-0 break-words text-right">{renderValue(column, row) ?? '—'}</dd>
                    </div>
                  ))}
                </dl>
              </Row>
            );
          })
        )}
      </div>
    </div>
  );
}
