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
    <div style={{ width: '100%', height: '100%', overflow: 'auto' }}>
      <div style={{ padding: '16px', backgroundColor: '#1E293B', color: 'white', marginBottom: '16px' }}>
        <h2>{fileName}</h2>
        <button onClick={onReset} style={{ padding: '8px 16px', cursor: 'pointer' }}>
          Volver a Cargar
        </button>
      </div>
      <table border={1} cellPadding={8} style={{ width: '100%', borderCollapse: 'collapse', color: 'white' }}>
        <thead>
          <tr>
            {headers.map((h, i) => <th key={i}>{h}</th>)}
          </tr>
          {columnTotals && (
            <tr style={{ backgroundColor: '#0f172a' }}>
              {headers.map((h, i) => <td key={i}><strong>{columnTotals[h] || '-'}</strong></td>)}
            </tr>
          )}
        </thead>
        <tbody>
          {data.slice(0, 50).map((row, rIdx) => (
            <tr key={rIdx}>
              {row.map((cell, cIdx) => <td key={cIdx}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ color: '#94a3b8', padding: '16px' }}>Mostrando los primeros 50 registros por simplicidad y rendimiento.</p>
    </div>
  );
}
