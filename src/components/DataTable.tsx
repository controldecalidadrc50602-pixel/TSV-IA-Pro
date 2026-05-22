import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  FileText, 
  Download, 
  Filter, 
  RotateCcw,
  SlidersHorizontal 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';

interface DataTableProps {
  data: string[][];
  headers: string[];
  fileName: string;
  onReset: () => void;
  columnTotals?: Record<string, number | string>;
}

type SortDirection = 'asc' | 'desc' | null;

export function DataTable({ data, headers, fileName, onReset, columnTotals }: DataTableProps) {
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState<Record<number, string>>({});
  const [showColumnFilters, setShowColumnFilters] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [sortConfig, setSortConfig] = useState<{ colIndex: number; direction: SortDirection }>({
    colIndex: -1,
    direction: null,
  });

  // Identificar columna de enlaces/URLs
  const linkColIndex = useMemo(() => {
    return headers.findIndex(h => {
      const sh = String(h || '').toLowerCase();
      return sh.includes('link') || sh.includes('url') || sh.includes('enlace');
    });
  }, [headers]);

  // Filtrado de datos (Global + Por Columna)
  const filteredData = useMemo(() => {
    return data.filter((row) => {
      // 1. Filtro global
      if (globalFilter.trim() !== '') {
        const matchesGlobal = row.some(cell => 
          String(cell || '').toLowerCase().includes(globalFilter.toLowerCase())
        );
        if (!matchesGlobal) return false;
      }

      // 2. Filtros específicos por columna
      return Object.entries(columnFilters).every(([colIdxStr, filterValue]) => {
        if (!filterValue || filterValue.trim() === '') return true;
        const colIdx = parseInt(colIdxStr);
        const cellValue = String(row[colIdx] || '');
        return cellValue.toLowerCase().includes(filterValue.toLowerCase());
      });
    });
  }, [data, globalFilter, columnFilters]);

  // Ordenamiento de datos
  const sortedData = useMemo(() => {
    if (sortConfig.direction === null || sortConfig.colIndex === -1) {
      return filteredData;
    }

    const { colIndex, direction } = sortConfig;

    return [...filteredData].sort((a, b) => {
      const valA = String(a[colIndex] || '').trim();
      const valB = String(b[colIndex] || '').trim();

      // Intento de ordenación numérica
      const cleanA = valA.replace(/[$,%]/g, '');
      const cleanB = valB.replace(/[$,%]/g, '');
      const numA = parseFloat(cleanA);
      const numB = parseFloat(cleanB);

      if (!isNaN(numA) && !isNaN(numB)) {
        return direction === 'asc' ? numA - numB : numB - numA;
      }

      // Fallback a strings ordinarios
      return direction === 'asc'
        ? valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' })
        : valB.localeCompare(valA, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [filteredData, sortConfig]);

  // Paginación dinámica
  const totalRows = sortedData.length;
  const isAllRowsSelected = rowsPerPage === -1;
  const totalPages = isAllRowsSelected ? 1 : Math.ceil(totalRows / rowsPerPage);
  
  const paginatedData = useMemo(() => {
    if (isAllRowsSelected) return sortedData;
    const start = (currentPage - 1) * rowsPerPage;
    return sortedData.slice(start, start + rowsPerPage);
  }, [sortedData, currentPage, rowsPerPage, isAllRowsSelected]);

  // Manejo de cambios en filtros de columna
  const handleColumnFilterChange = (colIndex: number, value: string) => {
    setColumnFilters((prev) => {
      const updated = { ...prev };
      if (value === '') {
        delete updated[colIndex];
      } else {
        updated[colIndex] = value;
      }
      return updated;
    });
    setCurrentPage(1); // Reiniciar a página 1 al filtrar
  };

  // Manejo de limpieza de filtros
  const handleClearFilters = () => {
    setGlobalFilter('');
    setColumnFilters({});
    setCurrentPage(1);
  };

  // Manejo de ordenamiento por columna
  const handleSort = (colIndex: number) => {
    setSortConfig((prev) => {
      if (prev.colIndex === colIndex) {
        if (prev.direction === 'asc') return { colIndex, direction: 'desc' };
        return { colIndex: -1, direction: null };
      }
      return { colIndex, direction: 'asc' };
    });
    setCurrentPage(1);
  };

  // Exportar a Excel la vista exacta filtrada y ordenada
  const handleExportFiltered = () => {
    const wb = XLSX.utils.book_new();
    
    // Estructurar filas y cabeceras de metadatos premium
    const title = [["TSV Intelligence Pro - Exportación Premium Filtrada"]];
    const meta = [
      [`Archivo Origen: ${fileName}`, `Fecha de Exportación: ${new Date().toLocaleDateString()}`],
      [`Filtro de Búsqueda: ${globalFilter || 'Ninguno'}`, `Registros Exportados: ${totalRows} de ${data.length}`]
    ];
    const emptyRow = [[]];
    const exportHeaders = [headers];
    
    // Obtener los datos formateados del estado actual de ordenación y filtrado
    const exportRows = sortedData;
    
    // Totales calculados en caliente para las columnas numéricas que queden visibles
    const calculatedTotals = headers.map((h, colIndex) => {
      let sum = 0;
      let isNumericCol = true;
      let hasData = false;
      
      exportRows.forEach(row => {
        const val = row[colIndex];
        if (val !== undefined && val !== null && String(val).trim() !== '') {
          hasData = true;
          const cleanVal = String(val).replace(/[$,%]/g, '');
          const num = parseFloat(cleanVal);
          if (!isNaN(num)) {
            sum += num;
          } else {
            isNumericCol = false;
          }
        }
      });
      
      if (hasData && isNumericCol && sum > 0) {
        // Si corresponde a una duración o formato de hora (detectado heurísticamente)
        const lowerH = h.toLowerCase();
        if (lowerH.includes('duracion') || lowerH.includes('tiempo') || lowerH.includes('espera') || lowerH.includes('cola')) {
          // Si el total original venía formateado, lo convertimos
          const hOriginalTotal = columnTotals?.[h];
          if (typeof hOriginalTotal === 'string' && hOriginalTotal.includes('m')) {
            // Re-calcular formato en segundos/minutos
            const hrs = Math.floor(sum / 3600);
            const mins = Math.floor((sum % 3600) / 60);
            const secs = Math.floor(sum % 60);
            if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
            return `${mins}m ${secs}s`;
          }
        }
        return Math.round(sum * 100) / 100;
      }
      return '-';
    });
    
    const totalsLabel = ["TOTALES FILTRADOS", ...calculatedTotals.slice(1)];
    
    const wsData = [
      ...title,
      ...meta,
      ...emptyRow,
      ...exportHeaders,
      ...exportRows,
      ...emptyRow,
      totalsLabel
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Configuración estética de las columnas
    if (!ws['!cols']) ws['!cols'] = [];
    headers.forEach((_, i) => ws['!cols']![i] = { wch: 22 });
    
    // Unir la celda de título
    if (!ws['!merges']) ws['!merges'] = [];
    ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } });
    
    XLSX.utils.book_append_sheet(wb, ws, "Data Filtrada");
    XLSX.writeFile(wb, `${fileName.split('.')[0]}_filtrado.xlsx`);
  };

  const getSortIcon = (colIndex: number) => {
    if (sortConfig.colIndex !== colIndex) {
      return <ArrowUpDown className="w-3.5 h-3.5 opacity-40 hover:opacity-100 transition-opacity" />;
    }
    if (sortConfig.direction === 'asc') {
      return <ArrowUp className="w-3.5 h-3.5 text-brand-turquoise" />;
    }
    return <ArrowDown className="w-3.5 h-3.5 text-brand-turquoise" />;
  };

  return (
    <div className="w-full h-full overflow-auto p-6 space-y-6">
      {/* Panel Superior de Controles y Acciones */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-black text-brand-turquoise uppercase tracking-[0.2em]">Visor Interactivo</span>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white mt-1">{fileName}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
            Visualiza, filtra, ordena y exporta en tiempo real tus datos estructurados.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => setShowColumnFilters(!showColumnFilters)}
            className={cn(
              "px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 border transition-all cursor-pointer",
              showColumnFilters 
                ? "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white border-slate-300 dark:border-slate-700" 
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50"
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filtros por Columna
          </button>

          {(globalFilter || Object.keys(columnFilters).length > 0) && (
            <button 
              onClick={handleClearFilters}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Limpiar Filtros
            </button>
          )}

          <button 
            onClick={handleExportFiltered}
            className="px-4 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-sm font-bold flex items-center gap-2 hover:scale-105 transition-transform shadow-md cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Exportar Filtrado
          </button>

          <button 
            onClick={onReset} 
            className="px-4 py-2.5 bg-brand-turquoise text-white rounded-xl font-bold text-sm shadow-lg shadow-brand-turquoise/20 hover:scale-105 transition-transform cursor-pointer"
          >
            Cargar otro archivo
          </button>
        </div>
      </div>

      {/* Controles de Búsqueda Global y Resumen Rápido */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar en cualquier celda..."
            value={globalFilter}
            onChange={(e) => {
              setGlobalFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-turquoise text-sm text-slate-700 dark:text-slate-200 shadow-sm"
          />
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-around text-center shadow-sm">
          <div>
            <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Total Filas</span>
            <p className="text-xl font-black text-slate-800 dark:text-white mt-1">{data.length}</p>
          </div>
          <div className="w-px h-8 bg-slate-200 dark:bg-slate-800" />
          <div>
            <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Filtradas</span>
            <p className="text-xl font-black text-brand-turquoise mt-1">{totalRows}</p>
          </div>
          <div className="w-px h-8 bg-slate-200 dark:bg-slate-800" />
          <div>
            <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Columnas</span>
            <p className="text-xl font-black text-slate-800 dark:text-white mt-1">{headers.length}</p>
          </div>
        </div>
      </div>

      {/* Contenedor Principal de la Tabla */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse table-auto">
            <thead>
              {/* Fila Principal de Cabeceras */}
              <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                {headers.map((h, i) => (
                  <th 
                    key={i} 
                    onClick={() => handleSort(i)}
                    className="p-4 text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest whitespace-nowrap cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span>{h}</span>
                      {getSortIcon(i)}
                    </div>
                  </th>
                ))}
              </tr>

              {/* Fila de Filtros por Columna */}
              {showColumnFilters && (
                <tr className="bg-slate-50/50 dark:bg-slate-950/30 border-b border-slate-200 dark:border-slate-800 animate-in fade-in duration-200">
                  {headers.map((_, i) => (
                    <td key={i} className="p-2 border-r border-slate-100 dark:border-slate-800/30 last:border-0">
                      <div className="relative">
                        <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-3 h-3" />
                        <input
                          type="text"
                          placeholder="Filtrar..."
                          value={columnFilters[i] || ''}
                          onChange={(e) => handleColumnFilterChange(i, e.target.value)}
                          className="w-full pl-7 pr-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-brand-turquoise text-slate-700 dark:text-slate-200"
                        />
                      </div>
                    </td>
                  ))}
                </tr>
              )}

              {/* Fila de Totales de Columnas */}
              {columnTotals && (
                <tr className="bg-brand-turquoise/5 dark:bg-brand-turquoise/10 border-b border-slate-200 dark:border-slate-800">
                  {headers.map((h, i) => (
                    <td key={i} className="p-4 text-xs font-black text-brand-turquoise whitespace-nowrap">
                      {columnTotals[h] !== undefined ? columnTotals[h] : '-'}
                    </td>
                  ))}
                </tr>
              )}
            </thead>
            
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedData.length > 0 ? (
                paginatedData.map((row, rIdx) => (
                  <tr key={row.length ? rIdx : Math.random()} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="p-4 text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {cIdx === linkColIndex && String(cell).startsWith('http') ? (
                          <a 
                            href={String(cell)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-brand-turquoise hover:underline flex items-center gap-1 font-bold text-xs"
                          >
                            Ver Enlace
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          String(cell || '-')
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={headers.length} className="p-12 text-center text-slate-400 dark:text-slate-500 font-medium">
                    No se encontraron registros que coincidan con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Panel de Paginación Avanzada */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Filas por página:
            </span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(parseInt(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-turquoise"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={-1}>Todos</option>
            </select>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              {totalRows > 0 ? (
                <>
                  Mostrando{' '}
                  <span className="text-slate-800 dark:text-white font-bold">
                    {isAllRowsSelected ? 1 : (currentPage - 1) * rowsPerPage + 1}
                  </span>{' '}
                  a{' '}
                  <span className="text-slate-800 dark:text-white font-bold">
                    {isAllRowsSelected ? totalRows : Math.min(currentPage * rowsPerPage, totalRows)}
                  </span>{' '}
                  de <span className="text-brand-turquoise font-black">{totalRows}</span> registros
                </>
              ) : (
                '0 registros'
              )}
            </span>

            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-600 dark:text-slate-400 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors cursor-pointer"
                  title="Primera página"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-600 dark:text-slate-400 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors cursor-pointer"
                  title="Página anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 px-3">
                  Página {currentPage} de {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-600 dark:text-slate-400 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors cursor-pointer"
                  title="Página siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-600 dark:text-slate-400 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors cursor-pointer"
                  title="Última página"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
