"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Table } from "@/components/ui/table";
import { RefreshCw, Trash2 } from "lucide-react";
import React, { useMemo, useState } from "react";

export interface SubABMRow {
  id: number;
  toDelete?: boolean;
  pending?: boolean;
  deleted?: boolean;
  isActive?: boolean;
  [key: string]: any;
}

export interface AddFieldDef {
  key: string;
  label: string;
  placeholder: string;
  type?: 'text' | 'select';
  options?: { value: string; label: string }[];
  required?: boolean;
}

export interface InlineSubABMProps<T extends SubABMRow> {
  title: string;
  columns: { key: keyof T | string; label: string; render?: (row: T) => React.ReactNode }[];
  rows: T[];
  onStageAdd: (draft: Partial<T>) => void;
  onStageDelete: (id: number) => void;
  onStageRestore?: (id: number) => void;
  onStageUpdate?: (id: number, partial: Partial<T>) => void;
  pendingAdds: T[];
  pendingDeletes: number[];
  pendingUpdates?: Record<number, Partial<T>>;
  addFields: AddFieldDef[];
  customChangeCounter?: React.ReactNode;
}

export function InlineSubABM<T extends SubABMRow>({
  title,
  columns,
  rows,
  onStageAdd,
  onStageDelete,
  onStageRestore,
  onStageUpdate,
  pendingAdds,
  pendingDeletes,
  pendingUpdates,
  addFields,
  customChangeCounter,
}: InlineSubABMProps<T>) {
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Record<string, any>>({});
  const [triedAdd, setTriedAdd] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<Record<string, any>>({});

  // Defensive copy so external references are never mutated from inside
  const stableRows = useMemo<T[]>(() => rows.map((r) => ({ ...(r as any) })), [rows]);
  const allRows = useMemo(() => [...stableRows, ...pendingAdds], [stableRows, pendingAdds]);

  return (
    <div className="border rounded-md p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">{title}</h3>
        {!creating ? (
          <Button type="button" size="sm" onClick={() => setCreating(true)}>+ Agregar</Button>
        ) : (
          <div className="flex items-end gap-3 flex-wrap">
            {addFields.map((f) => {
              const missing = f.required && (!draft[f.key] || String(draft[f.key]).trim() === "");
              return (
                f.type === 'select' ? (
                  <div key={f.key} className="flex flex-col min-w-[220px] space-y-2">
                    <Label className={`${triedAdd && missing ? 'text-red-600' : ''}`}>
                      {f.label}{f.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    <Select
                      value={String(draft[f.key] ?? '')}
                      onValueChange={(val) => { setDraft({ ...draft, [f.key]: val }); setTriedAdd(false); }}
                    >
                      <SelectTrigger className={`${triedAdd && missing ? 'border-red-500' : ''}`}>
                        <span>{(f.options || []).find((o) => o.value === draft[f.key])?.label || f.placeholder}</span>
                      </SelectTrigger>
                      <SelectContent>
                        {(f.options || []).map((o) => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {triedAdd && missing && <span className="text-xs text-red-600 mt-1">Requerido</span>}
                  </div>
                ) : (
                  <div key={f.key} className="flex flex-col min-w-[220px] space-y-2">
                    <Label className={`${triedAdd && missing ? 'text-red-600' : ''}`}>
                      {f.label}{f.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    <Input
                      placeholder={f.placeholder}
                      value={draft[f.key] || ""}
                      onChange={(e) => { setDraft({ ...draft, [f.key]: e.target.value }); setTriedAdd(false); }}
                      className={triedAdd && missing ? 'border-red-500' : ''}
                    />
                    {triedAdd && missing && <span className="text-xs text-red-600 mt-1">Requerido</span>}
                  </div>
                )
              );
            })}
            <Button type="button" size="sm" onClick={() => {
              const hasMissing = addFields.some((f) => f.required && (!draft[f.key] || String(draft[f.key]).trim() === ""));
              if (hasMissing) { setTriedAdd(true); return; }
              onStageAdd(draft as Partial<T>);
              setDraft({});
              setTriedAdd(false);
              setCreating(false);
            }}>Agregar</Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => { setDraft({}); setTriedAdd(false); setCreating(false); }}>Cancelar</Button>
          </div>
        )}
      </div>

      <Table>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={String(c.key)} className="text-left p-2">{c.label}</th>
            ))}
            <th className="text-left p-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {allRows.map((r) => {
            const isDeleted = r.deleted || r.toDelete;
            const isActive = r.isActive !== false; // Por defecto activo si no se especifica
            const isInactive = r.isActive === false; // Explícitamente inactivo
            const shouldShowRestore = isDeleted || isInactive; // Mostrar restaurar si está eliminado o inactivo

            return (
              <tr key={r.id} className={`border-t transition-colors ${r.pending ? 'opacity-70' : ''
                } ${shouldShowRestore ? 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 opacity-75' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}>
                {columns.map((c) => (
                  <td key={String(c.key)} className="p-2">
                    {editingId === r.id ? (
                      (() => {
                        const fieldDef = addFields.find((f) => f.key === c.key);
                        if (!fieldDef) return c.render ? c.render(r) : String((r as any)[c.key]);
                        const value = editDraft[c.key as string] ?? (r as any)[c.key as string] ?? '';
                        const onChange = (val: any) => setEditDraft({ ...editDraft, [c.key as string]: val });
                        if (fieldDef.type === 'select') {
                          return (
                            <Select value={String(value)} onValueChange={(v) => onChange(v)}>
                              <SelectTrigger className="min-w-[180px]">
                                <span>{(fieldDef.options || []).find((o) => o.value === value)?.label || 'Seleccionar'}</span>
                              </SelectTrigger>
                              <SelectContent>
                                {(fieldDef.options || []).map((o) => (
                                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          );
                        }
                        return (
                          <Input value={String(value)} onChange={(e) => onChange(e.target.value)} />
                        );
                      })()
                    ) : (
                      c.render ? c.render(r) : String((r as any)[c.key])
                    )}
                  </td>
                ))}
                <td className="p-2">
                  {editingId === r.id ? (
                    <div className="flex gap-2">
                      <Button type="button" size="sm" onClick={() => { onStageUpdate && onStageUpdate(r.id, editDraft as Partial<T>); setEditingId(null); setEditDraft({}); }}>OK</Button>
                      <Button type="button" size="sm" variant="secondary" onClick={() => { setEditingId(null); setEditDraft({}); }}>Cancelar</Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      {!shouldShowRestore && (
                        <Button type="button" size="sm" variant="outline" onClick={() => { setEditingId(r.id); setEditDraft({}); }}>
                          Editar
                        </Button>
                      )}
                      {shouldShowRestore ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => onStageRestore && onStageRestore(r.id)}
                          className="flex items-center gap-1"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Restaurar
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => onStageDelete(r.id)}
                          className="flex items-center gap-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          Eliminar
                        </Button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
          {allRows.length === 0 && (
            <tr><td className="p-2 text-sm text-gray-500" colSpan={columns.length + 1}>Sin elementos</td></tr>
          )}
        </tbody>
      </Table>
      {(pendingAdds.length > 0 || pendingDeletes.length > 0 || customChangeCounter) && (
        customChangeCounter || (
          <div className="mt-2 text-xs text-gray-500">Cambios pendientes: +{pendingAdds.length} / -{pendingDeletes.length}. Se guardarán al presionar &quot;Guardar&quot;.</div>
        )
      )}
    </div>
  );
}
