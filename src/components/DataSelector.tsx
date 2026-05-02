import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Check, X, Table as TableIcon, Settings2, 
  ChevronRight, BarChart3, Clock, Type, Hash, 
  AlertCircle, ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DataSelectorProps {
  headers: string[];
  rows: string[][];
  onConfirm: (selectedHeaders: string[], filteredRows: string[][]) => void;
  onCancel: () => void;
}

export function DataSelector({ headers, rows, onConfirm, onCancel }: DataSelectorProps) {
  const [selectedIndices, setSelectedIndices] = useState<number[]>(
    headers.map((_, i) => i) // Default all selected
  );
  const [customHeaders, setCustomHeaders] = useState<string[]>(headers);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  const previewRows = rows.slice(0, 5);

  const toggleHeader = (idx: number) => {
    setSelectedIndices(prev => 
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const handleHeaderRename = (idx: number, newName: string) => {
    const updated = [...customHeaders];
    updated[idx] = newName;
    setCustomHeaders(updated);
  };

  const isGenericHeader = (header: string) => {
    const h = header.toLowerCase();
    return h.includes('columna') || h.includes('column') || h.includes('sin nombre') || 
           h.includes('untitled') || h.length < 3 || /^\d+$/.test(h);
  };

  const handleConfirm = () => {
    const finalHeaders = customHeaders.filter((_, i) => selectedIndices.includes(i));
    const filteredRows = rows.map(row => row.filter((_, i) => selectedIndices.includes(i)));
    onConfirm(finalHeaders, filteredRows);
  };

  // Helper to detect column type visually
  const getColType = (idx: number) => {
    const sample = rows[0]?.[idx] || '';
    if (sample.includes(':')) return { icon: Clock, label: 'Tiempo', color: 'text-amber-500' };
    if (!isNaN(parseFloat(sample.replace(/[,%]/g, '')))) return { icon: Hash, label: 'Numérico', color: 'text-brand-turquoise' };
    if (sample.includes('/') || sample.includes('-')) return { icon: TableIcon, label: 'Temporal', color: 'text-indigo-500' };
    return { icon: Type, label: 'Categoría', color: 'text-slate-400' };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10 bg-slate-950/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-6xl bg-white dark:bg-dark-card rounded-[2.5rem] border border-slate-200 dark:border-dark-border shadow-2xl overflow-hidden flex flex-col h-[85vh]"
      >
        {/* Header */}
        <div className="p-8 border-b border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-slate-900/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-brand-turquoise mb-2">
              <ShieldCheck size={20} />
              <span className="text-[10px] font-black uppercase tracking-widest italic">Data Curation Engine</span>
            </div>
            <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
              Curaduría de <span className="text-brand-turquoise">Métricas</span>
            </h2>
            <p className="text-sm text-slate-500 mt-1">Selecciona y renombra las columnas que deseas integrar en el análisis.</p>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={onCancel}
              className="px-6 py-3 text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold text-sm transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={handleConfirm}
              disabled={selectedIndices.length === 0}
              className="flex items-center gap-2 px-8 py-3 bg-brand-turquoise text-white rounded-2xl font-black text-sm shadow-xl shadow-brand-turquoise/20 hover:scale-105 transition-all disabled:opacity-40"
            >
              Procesar {selectedIndices.length} Columnas <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Column Toggles */}
          <div className="p-6 bg-white dark:bg-dark-card overflow-x-auto no-scrollbar border-b border-slate-100 dark:border-slate-800">
            <div className="flex gap-4">
              {headers.map((header, i) => {
                const type = getColType(i);
                const isSelected = selectedIndices.includes(i);
                const isGeneric = isGenericHeader(customHeaders[i]);
                
                return (
                  <div
                    key={i}
                    className={cn(
                      "flex flex-col gap-2 p-4 rounded-[1.5rem] border transition-all shrink-0 min-w-[200px] text-left group relative",
                      isSelected 
                        ? "bg-white dark:bg-slate-900 border-brand-turquoise shadow-lg shadow-brand-turquoise/5" 
                        : "bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 opacity-60 grayscale"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleHeader(i)}
                          className={cn(
                            "w-5 h-5 rounded-lg border flex items-center justify-center transition-all",
                            isSelected ? "bg-brand-turquoise border-brand-turquoise text-white" : "border-slate-300 dark:border-slate-700"
                          )}
                        >
                          {isSelected && <Check size={12} />}
                        </button>
                        <div className={cn("p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800", isSelected ? "text-brand-turquoise" : "text-slate-400")}>
                          <type.icon size={14} />
                        </div>
                      </div>

                      {isGeneric && isSelected && (
                        <div className="flex items-center gap-1 text-[8px] font-black bg-amber-500/10 text-amber-500 px-2 py-1 rounded-md animate-pulse">
                          <AlertCircle size={10} /> REQUERIDO
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <p className={cn("text-[9px] font-black uppercase tracking-[0.2em]", type.color)}>
                        {type.label}
                      </p>
                      
                      {editingIdx === i ? (
                        <input
                          autoFocus
                          value={customHeaders[i]}
                          onChange={(e) => handleHeaderRename(i, e.target.value)}
                          onBlur={() => setEditingIdx(null)}
                          onKeyDown={(e) => e.key === 'Enter' && setEditingIdx(null)}
                          className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-2 py-1.5 text-xs font-black text-brand-turquoise focus:ring-1 focus:ring-brand-turquoise outline-none"
                        />
                      ) : (
                        <div 
                          onClick={() => isSelected && setEditingIdx(i)}
                          className={cn(
                            "group/label flex items-center justify-between gap-2 cursor-text p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors",
                            isGeneric && isSelected && "bg-amber-500/5"
                          )}
                        >
                          <span className={cn(
                            "text-sm font-black truncate flex-1",
                            isSelected ? "text-slate-900 dark:text-white" : "text-slate-400",
                            isGeneric && isSelected && "text-amber-600 dark:text-amber-500"
                          )}>
                            {customHeaders[i]}
                          </span>
                          {isSelected && <Settings2 size={12} className="text-slate-300 group-hover/label:text-brand-turquoise transition-colors" />}
                        </div>
                      )}
                      
                      {isSelected && customHeaders[i] !== headers[i] && (
                        <p className="text-[8px] font-bold text-slate-400 italic">Orig: {headers[i]}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Table Preview */}
          <div className="flex-1 p-8 bg-slate-50 dark:bg-dark-bg overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <TableIcon size={16} className="text-slate-400" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Previsualización con Nuevos Nombres</span>
            </div>
            
            <div className="flex-1 overflow-auto rounded-[2rem] border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card shadow-sm custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-full">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-dark-border">
                    {headers.map((h, i) => (
                      <th key={i} className={cn(
                        "px-6 py-5 text-[10px] font-black uppercase tracking-widest transition-all",
                        selectedIndices.includes(i) ? "text-brand-turquoise bg-brand-turquoise/[0.02]" : "text-slate-300 dark:text-slate-700 opacity-30"
                      )}>
                        {customHeaders[i]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {previewRows.map((row, ri) => (
                    <tr key={ri} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      {row.map((cell, ci) => (
                        <td key={ci} className={cn(
                          "px-6 py-4 text-xs font-medium transition-all",
                          selectedIndices.includes(ci) ? "text-slate-600 dark:text-slate-300" : "text-slate-300 dark:text-slate-700 opacity-20"
                        )}>
                          {cell || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 flex items-center justify-between text-slate-400">
              <div className="flex items-center gap-2">
                <AlertCircle size={14} />
                <span className="text-[10px] font-bold uppercase tracking-tighter">Mostrando las primeras 5 filas para validación de esquema.</span>
              </div>
              <div className="text-[10px] font-black text-brand-turquoise bg-brand-turquoise/10 px-3 py-1 rounded-full uppercase tracking-widest">
                Total Registros: {rows.length.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
