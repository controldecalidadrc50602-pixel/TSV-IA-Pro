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

  const previewRows = rows.slice(0, 5);

  const toggleHeader = (idx: number) => {
    setSelectedIndices(prev => 
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const handleConfirm = () => {
    const selectedHeaders = headers.filter((_, i) => selectedIndices.includes(i));
    const filteredRows = rows.map(row => row.filter((_, i) => selectedIndices.includes(i)));
    onConfirm(selectedHeaders, filteredRows);
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
            <p className="text-sm text-slate-500 mt-1">Selecciona las columnas que deseas integrar en el análisis de inteligencia.</p>
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
          <div className="p-6 bg-white dark:bg-dark-card overflow-x-auto no-scrollbar">
            <div className="flex gap-3">
              {headers.map((header, i) => {
                const type = getColType(i);
                const isSelected = selectedIndices.includes(i);
                return (
                  <button
                    key={i}
                    onClick={() => toggleHeader(i)}
                    className={cn(
                      "flex flex-col gap-2 p-4 rounded-2xl border transition-all shrink-0 min-w-[140px] text-left group",
                      isSelected 
                        ? "bg-brand-turquoise/5 border-brand-turquoise shadow-sm" 
                        : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60 grayscale hover:opacity-100 hover:grayscale-0"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className={cn("p-1.5 rounded-lg bg-white dark:bg-slate-800 shadow-sm", isSelected ? "text-brand-turquoise" : "text-slate-400")}>
                        <type.icon size={14} />
                      </div>
                      <div className={cn(
                        "w-5 h-5 rounded-full border flex items-center justify-center transition-all",
                        isSelected ? "bg-brand-turquoise border-brand-turquoise text-white" : "border-slate-300 dark:border-slate-700"
                      )}>
                        {isSelected && <Check size={12} />}
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className={cn("text-[10px] font-bold uppercase tracking-widest mb-0.5", type.color)}>
                        {type.label}
                      </p>
                      <p className="text-xs font-black text-slate-800 dark:text-white truncate w-full" title={header}>
                        {header}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Table Preview */}
          <div className="flex-1 p-6 bg-slate-50 dark:bg-dark-bg overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <TableIcon size={16} className="text-slate-400" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Previsualización de Estructura</span>
            </div>
            
            <div className="flex-1 overflow-auto rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card shadow-sm custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-full">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-dark-border">
                    {headers.map((h, i) => (
                      <th key={i} className={cn(
                        "px-6 py-4 text-[10px] font-bold uppercase tracking-widest transition-opacity duration-300",
                        selectedIndices.includes(i) ? "text-slate-800 dark:text-slate-200" : "text-slate-300 dark:text-slate-700 opacity-30"
                      )}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {previewRows.map((row, ri) => (
                    <tr key={ri} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      {row.map((cell, ci) => (
                        <td key={ci} className={cn(
                          "px-6 py-4 text-xs font-medium transition-opacity duration-300",
                          selectedIndices.includes(ci) ? "text-slate-600 dark:text-slate-400" : "text-slate-300 dark:text-slate-700 opacity-20"
                        )}>
                          {cell || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 flex items-center gap-2 text-slate-400">
              <AlertCircle size={14} />
              <span className="text-[10px] font-bold uppercase">Mostrando las primeras 5 filas de un total de {rows.length} registros detectados.</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
