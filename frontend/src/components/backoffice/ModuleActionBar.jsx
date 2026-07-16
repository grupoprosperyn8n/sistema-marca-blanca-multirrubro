/* eslint-disable react/prop-types */
import { getModuleActions, useAuth } from "../../context/AuthContext";
import Badge from "../ui/Badge";

function csvEscape(value) {
  if (value === null || value === undefined) return "";
  const text = Array.isArray(value) ? value.join(", ") : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function exportCsv(filename, rows, columns) {
  const visibleColumns = columns.filter((column) => column.field);
  const header = visibleColumns.map((column) => csvEscape(column.header)).join(",");
  const body = rows.map((row) => (
    visibleColumns.map((column) => csvEscape(row[column.field])).join(",")
  ));
  const blob = new Blob([[header, ...body].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function ActionButton({ children, allowed, implemented = true, onClick, title, unavailableReason }) {
  if (!allowed) return null;
  const enabled = allowed && implemented;
  const reason = unavailableReason || "Acción pendiente de conectar a endpoint";
  return (
    <button
      type="button"
      onClick={enabled ? onClick : undefined}
      disabled={!enabled}
      title={title || (enabled ? "" : reason)}
      className="min-h-10 rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-xs font-semibold transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:cursor-not-allowed disabled:opacity-45"
      style={{ color: "var(--brand-text)" }}
    >
      {children}
    </button>
  );
}

export default function ModuleActionBar({
  moduleKey,
  count = 0,
  rows = [],
  columns = [],
  filename = "export.csv",
  onCreate,
  onEdit,
  onDelete,
  className = "",
}) {
  const { role, access } = useAuth();
  const actions = getModuleActions(role, moduleKey, access);

  return (
    <div className={`flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end ${className}`}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge>{count} registros</Badge>
        {actions.scope && <Badge variant="info">{actions.scope}</Badge>}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <ActionButton allowed={actions.create} implemented={!!onCreate} onClick={onCreate}>
          + Crear
        </ActionButton>
        <ActionButton allowed={actions.edit} implemented={!!onEdit} onClick={onEdit}>
          Editar
        </ActionButton>
        <ActionButton allowed={actions.delete} implemented={!!onDelete} onClick={onDelete}>
          Eliminar
        </ActionButton>
        <ActionButton
          allowed={actions.export}
          implemented={rows.length > 0 && columns.length > 0}
          onClick={() => exportCsv(filename, rows, columns)}
          title={actions.export && rows.length > 0 && columns.length > 0 ? "Exportar datos visibles a CSV" : undefined}
          unavailableReason="No hay datos visibles para exportar"
        >
          Exportar CSV
        </ActionButton>
      </div>
    </div>
  );
}
