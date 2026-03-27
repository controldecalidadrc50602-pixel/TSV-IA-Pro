import React, { useCallback } from 'react';
import { Upload, FileText, FileSpreadsheet } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  className?: string;
}

export function FileUpload({ onFileUpload, className }: FileUploadProps) {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        const file = files[0];
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (['tsv', 'csv', 'xlsx', 'xls'].includes(ext || '')) {
            onFileUpload(file);
        } else {
            alert('Please upload a valid .tsv, .csv, or .xlsx file');
        }
      }
    },
    [onFileUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        onFileUpload(e.target.files[0]);
      }
    },
    [onFileUpload]
  );

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className={cn(
        "border-2 border-dashed border-slate-300 dark:border-dark-border rounded-2xl p-12 text-center hover:border-brand-turquoise transition-all cursor-pointer bg-white dark:bg-dark-card hover:bg-slate-50 dark:hover:bg-slate-800/50 group",
        className
      )}
    >
      <input
        type="file"
        accept=".tsv,.csv,.xlsx,.xls,text/tab-separated-values,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        onChange={handleFileChange}
        className="hidden"
        id="file-upload"
      />
      <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-4">
        <div className="p-5 bg-brand-turquoise/10 rounded-full text-brand-turquoise group-hover:scale-110 transition-transform">
          <Upload size={36} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-brand-dark dark:text-white">Cargar Reporte</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Arrastra o selecciona tu archivo</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500 mt-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full transition-colors">
          <FileText size={14} />
          <span>TSV</span>
          <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
          <span>CSV</span>
          <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
          <FileSpreadsheet size={14} />
          <span>Excel</span>
        </div>
      </label>
    </div>
  );
}
