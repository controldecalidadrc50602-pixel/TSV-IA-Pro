import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { FileUpload } from '@/components/FileUpload';
import { DataTable } from '@/components/DataTable';
import { Dashboard } from '@/components/Dashboard';
import { PresentationMode } from '@/components/PresentationMode';
import { ChatAssistant } from '@/components/ChatAssistant';
import { Login } from '@/components/Login';
import { processData, generateDataSummary, DataStats } from '@/lib/data-processor';
import { saveFile, getFiles, deleteFile } from '@/lib/storage';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Loader2, AlertCircle, LayoutDashboard, Table as TableIcon, 
  History, UploadCloud, Download, Menu, X, MessageSquare,
  LogOut, Save, CheckCircle, Database, Vault, Presentation
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ParsedData {
  headers: string[];
  rows: string[][];
  fileName: string;
  stats: DataStats;
  summary: string;
  insights?: string; // New field for AI insights
}

type Tab = 'upload' | 'viewer' | 'dashboard' | 'history' | 'presentation';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('upload');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [data, setData] = useState<ParsedData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyFiles, setHistoryFiles] = useState<any[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['workspace', 'analytics']);
  const [reportName, setReportName] = useState('');

  // Handle Theme
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Load history on mount
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const files = await getFiles();
      const sorted = files.reverse();
      setHistoryFiles(sorted); // Newest first
      
      // Auto-load last file if none loaded
      if (!data && sorted.length > 0 && activeTab === 'upload') {
        loadFromHistory(sorted[0]);
      }
    } catch (err) {
      console.error("Failed to load history", err);
    }
  };

  const processFileContent = async (headers: string[], rawRows: any[][], fileName: string) => {
      // Ensure all cells are strings for initial processing
      const stringRows = rawRows.map(row => row.map(cell => {
          if (cell === null || cell === undefined) return '';
          return String(cell);
      }));

      // Process Data (Clean, Format Dates, Stats)
      const { processedRows, stats } = processData(headers, stringRows);
      
      // Convert back to string[][] for DataTable (keeping formatting)
      const rows = processedRows.map(r => headers.map(h => String(r[h])));
      
      const summary = generateDataSummary(headers, rows, stats);

      setData({
        headers,
        rows,
        fileName,
        stats,
        summary
      });
      
      setReportName(fileName.split('.')[0]); // Default report name
      setActiveTab('dashboard'); // Auto switch to dashboard
      setIsLoading(false);

      // Trigger Auto-Insights in background
      generateAutoInsights(summary);
  };

  const generateAutoInsights = async (summary: string) => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: "Genera un análisis ejecutivo rápido de estos datos en 3 bullet points." }],
          systemPrompt: `Eres un analista experto. Analiza este resumen y extrae 3 hallazgos clave o anomalías:\n${summary}`
        })
      });
      if (response.ok) {
        const data = await response.json();
        setData(prev => prev ? { ...prev, insights: data.text } : null);
      }
    } catch (err) {
      console.error("Auto-insights error", err);
    }
  };

  const handleFileUpload = (file: File) => {
    setIsLoading(true);
    setError(null);

    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'tsv' || ext === 'csv' || ext === 'txt') {
        Papa.parse(file, {
          delimiter: ext === 'csv' ? ',' : '\t',
          skipEmptyLines: true,
          complete: async (results) => {
            const rawData = results.data as string[][];
            if (!rawData || rawData.length === 0) {
                setError("The file appears to be empty.");
                setIsLoading(false);
                return;
            }
            const headers = rawData[0];
            const rawRows = rawData.slice(1);
            await processFileContent(headers, rawRows, file.name);
          },
          error: (err) => {
            setError(`Error parsing file: ${err.message}`);
            setIsLoading(false);
          }
        });
    } else if (ext === 'xlsx' || ext === 'xls') {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                if (!jsonData || jsonData.length === 0) {
                    setError("The file appears to be empty.");
                    setIsLoading(false);
                    return;
                }

                const headers = jsonData[0] as string[];
                const rawRows = jsonData.slice(1) as any[][];
                await processFileContent(headers, rawRows, file.name);
            } catch (err) {
                setError(`Error parsing Excel file: ${err}`);
                setIsLoading(false);
            }
        };
        reader.readAsArrayBuffer(file);
    } else {
        setError("Unsupported file format.");
        setIsLoading(false);
    }
  };

  const handleFinishAndSave = async () => {
    if (!data) return;
    if (!reportName.trim()) {
        alert("Por favor ingresa un nombre para el reporte.");
        return;
    }

    setIsLoading(true);
    try {
      await saveFile(reportName, data.headers, data.rows);
      await loadHistory();
      
      // Clear screen and reset
      setData(null);
      setReportName('');
      setActiveTab('upload');
    } catch (err) {
      console.error("Error saving file", err);
      setError("Error al guardar el archivo.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadFromHistory = (file: any, targetTab: Tab = 'dashboard') => {
    const { processedRows, stats } = processData(file.headers, file.data);
    const summary = generateDataSummary(file.headers, file.data, stats);
    
    setData({
      headers: file.headers,
      rows: file.data,
      fileName: file.name,
      stats,
      summary
    });
    setReportName(file.name);
    setActiveTab(targetTab);
  };

  const handleDeleteHistory = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteFile(id);
    await loadHistory();
  };

  const handleExportExcel = () => {
    if (!data) return;

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    
    // Add Title Row
    const title = [["TSV Intelligence Pro - Reporte Premium"]];
    const meta = [[`Reporte: ${reportName}`, `Fecha: ${new Date().toLocaleDateString()}`]];
    const emptyRow = [[]];
    const headers = [data.headers];
    const rows = data.rows; // These rows already have the formatted time strings from processData

    // Add Totals Row at the end
    const totalsRow = data.headers.map(h => data.stats.columnTotals[h] || '');
    const totalsLabel = ["TOTALES", ...totalsRow.slice(1)]; // Add label to first column if empty, or just append

    const wsData = [...title, ...meta, ...emptyRow, ...headers, ...rows, ...emptyRow, totalsLabel];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Styling (Column Widths)
    if (!ws['!cols']) ws['!cols'] = [];
    data.headers.forEach((_, i) => ws['!cols']![i] = { wch: 25 });

    // Merge title cells
    if (!ws['!merges']) ws['!merges'] = [];
    ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: data.headers.length - 1 } });

    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, `${reportName || 'report'}_premium_export.xlsx`);
  };

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => 
      prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]
    );
  };

  const NavItem = ({ tab, icon: Icon, label, active }: { tab: Tab; icon: any; label: string; active: boolean }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm font-medium group relative",
        active 
          ? "bg-brand-turquoise/10 text-brand-turquoise" 
          : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-brand-dark dark:hover:text-white"
      )}
    >
      <Icon size={18} className={cn(active ? "text-brand-turquoise" : "text-slate-400 group-hover:text-brand-dark dark:group-hover:text-white")} />
      {isSidebarOpen && <span>{label}</span>}
      {active && <motion.div layoutId="active-pill" className="absolute left-0 w-1 h-6 bg-brand-turquoise rounded-r-full" />}
    </button>
  );

  const SidebarGroup = ({ label, id, icon: Icon, children }: any) => {
    const isExpanded = expandedGroups.includes(id);
    return (
      <div className="space-y-1">
        <button 
          onClick={() => toggleGroup(id)}
          className="w-full flex items-center justify-between px-4 py-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest hover:text-brand-dark dark:hover:text-slate-300 transition-colors"
        >
          <div className="flex items-center gap-2">
            {isSidebarOpen && <span>{label}</span>}
          </div>
          {isSidebarOpen && (
            <motion.span animate={{ rotate: isExpanded ? 0 : -90 }}>
               <Menu size={12} className="rotate-90" />
            </motion.span>
          )}
        </button>
        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden space-y-1"
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  if (!isLoggedIn) {
    return (
      <div className="h-screen w-full bg-brand-gray dark:bg-dark-bg transition-colors duration-300">
        <Login onLogin={() => setIsLoggedIn(true)} />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-brand-gray dark:bg-dark-bg overflow-hidden font-sans transition-colors duration-300">
      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-white dark:bg-dark-card border-r border-slate-200 dark:border-dark-border flex flex-col transition-all duration-300 z-20 shadow-xl shadow-slate-200/50 dark:shadow-none",
          isSidebarOpen ? "w-72" : "w-20"
        )}
      >
        <div className="p-6 flex items-center justify-between h-20">
          {isSidebarOpen && (
            <div className="flex flex-col">
              <span className="font-bold text-lg text-brand-dark dark:text-white tracking-tight leading-none">TSV Intelligence</span>
              <span className="text-xs text-brand-turquoise font-bold tracking-widest uppercase">PRO EDITION</span>
            </div>
          )}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-brand-dark dark:hover:text-white transition-colors">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-6 mt-4 overflow-y-auto no-scrollbar">
          <SidebarGroup label="Workspace" id="workspace" icon={Database}>
            <NavItem tab="upload" icon={UploadCloud} label="Carga de Datos" active={activeTab === 'upload'} />
            <NavItem tab="viewer" icon={TableIcon} label="Visor Interactivo" active={activeTab === 'viewer'} />
          </SidebarGroup>

          <SidebarGroup label="Analytics" id="analytics" icon={LayoutDashboard}>
            <NavItem tab="dashboard" icon={LayoutDashboard} label="Live Dashboard" active={activeTab === 'dashboard'} />
            <NavItem tab="presentation" icon={Presentation} label="Modo Presentación" active={activeTab === 'presentation'} />
            <NavItem tab="history" icon={Vault} label="Bóveda de Datos" active={activeTab === 'history'} />
          </SidebarGroup>

          <SidebarGroup label="System" id="system" icon={MessageSquare}>
             <button
                onClick={() => setIsChatOpen(!isChatOpen)}
                className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm font-medium group",
                    isChatOpen ? "bg-brand-turquoise/10 text-brand-turquoise" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                )}
                >
                <MessageSquare size={18} />
                {isSidebarOpen && <span>Asistente IA</span>}
            </button>
          </SidebarGroup>
        </nav>

        <div className="p-4 border-t border-slate-100 space-y-3">
          {isSidebarOpen && (
            <div className="flex items-center gap-3 px-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-brand-dark dark:bg-brand-turquoise text-white flex items-center justify-center text-xs font-bold">
                AD
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-brand-dark dark:text-white">Admin User</span>
                <span className="text-xs text-slate-400">Empresa S.A.</span>
              </div>
            </div>
          )}
          
          <div className="flex flex-col gap-1">
            <button
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className={cn(
                "w-full flex items-center gap-3 px-4 py-2 rounded-lg text-slate-400 dark:text-slate-500 hover:bg-teal-50 dark:hover:bg-teal-900/20 hover:text-brand-turquoise transition-colors text-sm font-medium",
                !isSidebarOpen && "justify-center px-0"
                )}
            >
                {theme === 'light' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
                {isSidebarOpen && (theme === 'light' ? "Modo Oscuro" : "Modo Claro")}
            </button>
            
            <button
                onClick={() => setIsLoggedIn(false)}
                className={cn(
                "w-full flex items-center gap-3 px-4 py-2 rounded-lg text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-colors text-sm font-medium",
                !isSidebarOpen && "justify-center px-0"
                )}
            >
                <LogOut size={18} />
                {isSidebarOpen && "Cerrar Sesión"}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        {/* Top Bar */}
        <header className="h-20 bg-white/80 dark:bg-dark-card/80 backdrop-blur-md border-b border-slate-200 dark:border-dark-border flex items-center justify-between px-8 z-10 sticky top-0 transition-colors">
          <div>
            <h2 className="text-xl font-bold text-brand-dark dark:text-white">
              {activeTab === 'upload' && 'Nueva Lectura'}
              {activeTab === 'viewer' && 'Explorador de Datos'}
              {activeTab === 'dashboard' && 'Dashboard Ejecutivo'}
              {activeTab === 'history' && 'Bóveda de Reportes'}
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Gestión Inteligente de Datos TSV</p>
          </div>
          
          <div className="flex items-center gap-3">
            {data && (
              <>
                <button 
                  onClick={handleExportExcel}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-brand-turquoise hover:text-brand-turquoise transition-all text-sm font-medium shadow-sm"
                >
                  <Download size={18} />
                  <span className="hidden md:inline">Exportar Premium</span>
                </button>

                <button 
                  onClick={() => setIsChatOpen(!isChatOpen)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-sm font-medium shadow-sm",
                    isChatOpen 
                      ? "bg-brand-turquoise/10 border-brand-turquoise text-brand-turquoise" 
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-brand-turquoise/50"
                  )}
                >
                  <MessageSquare size={18} />
                  <span className="hidden md:inline">Asistente IA</span>
                </button>

                <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-2"></div>

                <div className="flex items-center gap-2">
                    <input 
                        type="text" 
                        value={reportName}
                        onChange={(e) => setReportName(e.target.value)}
                        placeholder="Nombre del Reporte"
                        className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:border-brand-turquoise dark:text-white"
                    />
                    <button 
                    onClick={handleFinishAndSave}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-brand-turquoise text-white hover:brightness-105 transition-all text-sm font-bold shadow-lg shadow-brand-turquoise/20"
                    >
                    <Save size={18} />
                    <span className="hidden md:inline">Guardar</span>
                    </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-8 relative">
          <AnimatePresence mode="wait">
            {activeTab === 'upload' && (
              <motion.div 
                key="upload"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="max-w-2xl mx-auto mt-12"
              >
                <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 text-center">
                  <div className="w-16 h-16 bg-brand-turquoise/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-brand-turquoise">
                    <Database size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-brand-dark mb-2">Carga de Reportes</h3>
                  <p className="text-slate-500 mb-8 max-w-md mx-auto">Sube tus archivos .tsv, .csv o .xlsx para un análisis empresarial instantáneo. Procesamiento 100% local y seguro.</p>
                  
                  <FileUpload onFileUpload={handleFileUpload} className="border-brand-turquoise/30 hover:border-brand-turquoise bg-slate-50/50" />
                  
                  {isLoading && (
                    <div className="mt-8 flex flex-col items-center gap-3 text-brand-turquoise">
                      <Loader2 className="animate-spin" size={32} />
                      <span className="font-medium text-brand-dark">Analizando datos...</span>
                    </div>
                  )}
                  {error && (
                    <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-3 border border-red-100 text-sm font-medium text-left">
                      <AlertCircle size={20} className="flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'viewer' && data && (
              <motion.div 
                key="viewer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full"
              >
                <DataTable 
                  data={data.rows} 
                  headers={data.headers} 
                  fileName={data.fileName}
                  onReset={() => setActiveTab('upload')}
                  columnTotals={data.stats.columnTotals}
                />
              </motion.div>
            )}

            {activeTab === 'dashboard' && data && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Dashboard stats={data.stats} insights={data.insights} />
              </motion.div>
            )}

            {activeTab === 'presentation' && data && (
              <motion.div 
                key="presentation"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full"
              >
                <PresentationMode 
                  stats={data.stats} 
                  insights={data.insights} 
                  onBack={() => setActiveTab('dashboard')} 
                />
              </motion.div>
            )}

            {activeTab === 'history' && (
              <motion.div 
                key="history"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="max-w-5xl mx-auto"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {historyFiles.length > 0 ? (
                    historyFiles.map((file) => (
                      <div 
                        key={file.id}
                        className="bg-white dark:bg-dark-card p-5 rounded-3xl border border-slate-100 dark:border-dark-border hover:border-brand-turquoise hover:shadow-xl hover:shadow-brand-turquoise/5 transition-all group relative flex flex-col h-full"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="p-3 bg-brand-gray dark:bg-slate-800 text-slate-500 rounded-2xl group-hover:bg-brand-turquoise group-hover:text-white transition-colors">
                            <TableIcon size={24} />
                          </div>
                          <button 
                            onClick={(e) => handleDeleteHistory(file.id, e)}
                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <X size={18} />
                          </button>
                        </div>
                        
                        <h3 className="font-bold text-brand-dark dark:text-white text-lg mb-1 truncate" title={file.name}>{file.name}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Reporte ID: {file.id.slice(0, 8)}</p>
                        
                        <div className="mt-auto space-y-2 pt-4 border-t border-slate-50 dark:border-dark-border/50">
                           <div className="flex items-center justify-between mb-4">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">{new Date(file.date).toLocaleDateString()}</span>
                              <span className="text-[10px] font-bold text-brand-turquoise uppercase">{file.data.length} Filas</span>
                           </div>
                           
                           <div className="grid grid-cols-2 gap-2">
                               <button 
                                onClick={() => loadFromHistory(file, 'dashboard')}
                                className="flex items-center justify-center gap-2 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-brand-turquoise hover:text-white text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition-all"
                               >
                                  <LayoutDashboard size={14} /> Dashboard
                               </button>
                               <button 
                                onClick={() => loadFromHistory(file, 'presentation')}
                                className="flex items-center justify-center gap-2 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-brand-turquoise hover:text-white text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition-all"
                               >
                                  <Presentation size={14} /> Presentar
                               </button>
                           </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-20 text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200">
                      <History size={64} className="mx-auto mb-4 opacity-20" />
                      <p className="text-lg font-medium">La bóveda está vacía</p>
                      <p className="text-sm opacity-70">Los reportes guardados aparecerán aquí.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
            
            {/* Empty States for Viewer/Dashboard if no data */}
            {(!data && (activeTab === 'viewer' || activeTab === 'dashboard')) && (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                  <UploadCloud size={40} className="opacity-40" />
                </div>
                <h3 className="text-xl font-bold text-slate-700 mb-2">Sin datos para mostrar</h3>
                <p className="max-w-xs text-center mb-8">Carga un archivo o selecciona uno de la bóveda para visualizar esta sección.</p>
                <button 
                  onClick={() => setActiveTab('upload')}
                  className="px-6 py-3 bg-brand-dark text-white rounded-xl font-medium hover:bg-black transition-colors shadow-lg shadow-slate-200"
                >
                  Ir a Carga de Datos
                </button>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Chat Overlay */}
        <AnimatePresence>
          {isChatOpen && data && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute top-0 right-0 bottom-0 z-30 shadow-2xl"
            >
              <ChatAssistant dataSummary={data.summary} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
