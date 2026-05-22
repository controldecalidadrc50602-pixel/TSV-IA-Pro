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
    return headers.findIndex(h => {
      const sh = String(h || '').toLowerCase();
      return sh.includes('link') || sh.includes('url');
    });
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
    <div className="w-full h-full overflow-auto p-6">
      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">{fileName}</h2>
        <button 
          onClick={onReset} 
          className="px-4 py-2 bg-brand-turquoise text-white rounded-xl font-bold text-sm shadow-lg shadow-brand-turquoise/20 hover:scale-105 transition-transform"
        >
          Volver a Cargar
        </button>
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
                {headers.map((h, i) => (
                  <th key={i} className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
              {columnTotals && (
                <tr className="bg-brand-turquoise/5 border-b border-slate-200 dark:border-slate-800">
                  {headers.map((h, i) => (
                    <td key={i} className="p-4 text-sm font-black text-brand-turquoise whitespace-nowrap">
                      {columnTotals[h] || '-'}
                    </td>
                  ))}
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.slice(0, 50).map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="p-4 text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-slate-500 dark:text-slate-400 text-sm mt-4 italic">
        Mostrando los primeros 50 registros por simplicidad y rendimiento.
      </p>
    </div>
  );
}
