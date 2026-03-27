import React, { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, FileText, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DataTableProps {
  data: string[][];
  headers: string[];
  fileName: string;
  onReset: () => void;
  columnTotals?: Record<string, number | string>;
}

type SortDirection = 'asc' | 'desc' | null;

export function DataTable({ data, headers, fileName, onReset, columnTotals }: DataTableProps) {
  const [filters, setFilters] = useState<Record<number, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [sortConfig, setSortConfig] = useState<{ colIndex: number; direction: SortDirection }>({
    colIndex: -1,
    direction: null,
  });

  // Identify Link Column (case insensitive check for 'link')
  const linkColIndex = useMemo(() => {
    return headers.findIndex(h => h.toLowerCase().includes('link') || h.toLowerCase().includes('url'));
  }, [headers]);

  // Filter data
  const filteredData = useMemo(() => {
    return data.filter((row) => {
      return Object.entries(filters).every(([colIndex, filterValue]) => {
        const cellValue = String(row[parseInt(colIndex)] || '');
        return cellValue.toLowerCase().includes(filterValue.toLowerCase());
      });
    });
  }, [data, filters]);

  // Sort data
  const sortedData = useMemo(() => {
    if (sortConfig.direction === null || sortConfig.colIndex === -1) {
      return filteredData;
    }

    return [...filteredData].sort((a, b) => {
      const valA = String(a[sortConfig.colIndex] || '');
      const valB = String(b[sortConfig.colIndex] || '');

      // Try numeric sort if both look like numbers
      const numA = parseFloat(valA);
      const numB = parseFloat(valB);

      if (!isNaN(numA) && !isNaN(numB)) {
        return sortConfig.direction === 'asc' ? numA - numB : numB - numA;
      }

      return sortConfig.direction === 'asc'
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    });
  }, [filteredData, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / rowsPerPage);
  const paginatedData = sortedData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleFilterChange = (colIndex: number, value: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev };
      if (value === '') {
        delete newFilters[colIndex];
      } else {
        newFilters[colIndex] = value;
      }
      return newFilters;
    });
    setCurrentPage(1); // Reset to first page on filter
  };

  const handleSort = (colIndex: number) => {
    setSortConfig((prev) => {
      if (prev.colIndex === colIndex) {
        if (prev.direction === 'asc') return { colIndex, direction: 'desc' };
        if (prev.direction === 'desc') return { colIndex: -1, direction: null };
      }
      return { colIndex, direction: 'asc' };
    });
  };

  return (
    <div className="flex flex-col h-full gap-4 animate-in fade-in duration-500">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-dark-card p-4 rounded-xl shadow-sm border border-slate-200 dark:border-dark-border transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-turquoise/10 text-brand-turquoise rounded-lg">
            <FileText size={20} />
          </div>
          <div>
            <h2 className="font-semibold text-brand-dark dark:text-white">{fileName}</h2>
            <p className="text-sm text-slate-500">
              {filteredData.length.toLocaleString()} rows {filteredData.length !== data.length && `(filtered from ${data.length.toLocaleString()})`}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={onReset}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Upload New File
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-hidden rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card shadow-sm flex flex-col transition-colors">
        <div className="overflow-auto flex-1 relative">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-900 sticky top-0 z-20 shadow-sm transition-colors">
              <tr>
                {headers.map((header, index) => (
                  <th key={index} className="p-4 font-semibold text-brand-dark dark:text-slate-200 border-b border-slate-200 dark:border-dark-border min-w-[220px] bg-slate-50 dark:bg-slate-900 transition-colors">
                    <div className="flex flex-col gap-2">
                      <div 
                        className="flex items-center justify-between cursor-pointer hover:text-brand-turquoise transition-colors select-none group"
                        onClick={() => handleSort(index)}
                      >
                        <span className="truncate" title={header}>{header}</span>
                        <span className="text-slate-400 group-hover:text-brand-turquoise">
                          {sortConfig.colIndex === index ? (
                            sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                          ) : (
                            <ArrowUpDown size={14} className="opacity-0 group-hover:opacity-50" />
                          )}
                        </span>
                      </div>
                      <div className="relative">
                        <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Filtrar..."
                          value={filters[index] || ''}
                          onChange={(e) => handleFilterChange(index, e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-brand-turquoise focus:ring-2 focus:ring-brand-turquoise/20 bg-white dark:bg-slate-800 text-brand-dark dark:text-white transition-all"
                        />
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
              {/* Totals Row */}
              {columnTotals && (
                <tr className="bg-brand-turquoise/5 dark:bg-brand-turquoise/10 border-b-2 border-brand-turquoise/20 font-bold text-brand-dark dark:text-white sticky top-[105px] z-10 transition-colors">
                  {headers.map((header, index) => (
                    <td key={index} className="p-3 text-xs uppercase tracking-wider">
                      {columnTotals[header] ? (
                        <div className="flex flex-col">
                          <span className="text-[10px] text-brand-turquoise font-extrabold opacity-70">TOTAL</span>
                          <span>{columnTotals[header]}</span>
                        </div>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                  ))}
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData.length > 0 ? (
                paginatedData.map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-brand-turquoise/5 dark:hover:bg-brand-turquoise/10 transition-colors even:bg-slate-50/50 dark:even:bg-slate-800/30">
                    {headers.map((_, colIndex) => {
                      const cellValue = row[colIndex];
                      const isLink = colIndex === linkColIndex && cellValue && (cellValue.startsWith('http') || cellValue.startsWith('www'));
                      const isTime = cellValue && String(cellValue).includes('h ') && String(cellValue).includes('m ') && String(cellValue).includes('s');
                      
                      return (
                        <td key={colIndex} className={cn(
                            "p-4 text-slate-700 dark:text-slate-300 whitespace-nowrap max-w-xs truncate",
                            isTime && "text-brand-turquoise font-medium"
                        )} title={String(cellValue)}>
                          {isLink ? (
                            <a 
                              href={cellValue} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-brand-turquoise hover:text-teal-600 hover:underline font-medium"
                            >
                              Abrir Chat <ExternalLink size={14} />
                            </a>
                          ) : (
                            cellValue
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={headers.length} className="p-12 text-center text-slate-500">
                    No se encontraron registros coincidentes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="border-t border-slate-200 dark:border-dark-border p-3 bg-slate-50 dark:bg-slate-900 flex items-center justify-between transition-colors">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <span>Rows per page:</span>
                <select 
                    value={rowsPerPage}
                    onChange={(e) => {
                        setRowsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                    }}
                    className="border border-slate-300 dark:border-slate-700 rounded px-2 py-1 bg-white dark:bg-slate-800 text-brand-dark dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-turquoise transition-all"
                >
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={500}>500</option>
                </select>
            </div>

            <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600 dark:text-slate-400 mr-2 transition-colors">
                    Page {currentPage} of {totalPages || 1}
                </span>
                <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 dark:text-slate-400"
                >
                    <ChevronLeft size={20} />
                </button>
                <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 dark:text-slate-400"
                >
                    <ChevronRight size={20} />
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}
