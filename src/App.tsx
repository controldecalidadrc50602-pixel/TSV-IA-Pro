import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { FileUpload } from '@/components/FileUpload';
import { DataTable } from '@/components/DataTable';
import { Dashboard } from '@/components/Dashboard';
import { PresentationMode } from '@/components/PresentationMode';
import { AnalyticsPanel } from '@/components/AnalyticsPanel';
import { ChatAssistant } from '@/components/ChatAssistant';
import { InsightsBar, Finding } from '@/components/InsightsBar';
import { PublicDashboard } from '@/components/PublicDashboard';
import { processData, generateDataSummary, DataStats, extractStructuredData } from '@/lib/data-processor';
import { saveFile, getFiles, deleteFile, savePublicShare } from '@/lib/storage';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Loader2, AlertCircle, LayoutDashboard as DashboardIcon, Table as TableIcon, 
  History, UploadCloud, Download, Menu, X, MessageSquare,
  LogOut, Save, Database, Vault, Presentation,
  Settings as SettingsIcon, Image as ImageIcon,
  Sparkles, ShieldCheck, FlaskConical, Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { isCloudEnabled } from '@/lib/firebase';
import { Auth } from '@/components/Auth';
import { ProjectManager, Project } from '@/components/ProjectManager';
import { ExecutiveBriefing } from '@/components/ExecutiveBriefing';
import { DataSelector } from '@/components/DataSelector';
import { useAuth } from '@/contexts/AuthContext';

interface ParsedData {
  headers: string[];
  rows: string[][];
  fileName: string;
  stats: DataStats;
  summary: string;
  insights?: string; // New field for AI insights
}

type Tab = 'upload' | 'viewer' | 'dashboard' | 'analytics' | 'history' | 'presentation' | 'settings';

export default function App() {
  const { user, loading: authLoading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('upload');
  const [data, setData] = useState<ParsedData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyFiles, setHistoryFiles] = useState<any[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['workspace', 'analytics']);
  const [reportName, setReportName] = useState('');
  const [insightsFindings, setInsightsFindings] = useState<Finding[]>([]);
  const [insightsSummary, setInsightsSummary] = useState<string>('');
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [logo, setLogo] = useState<string | null>(localStorage.getItem('tsv_logo'));
  const [publicShareId, setPublicShareId] = useState<string | null>(null);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [isBriefingOpen, setIsBriefingOpen] = useState(false);
  const [pendingData, setPendingData] = useState<{headers: string[], rows: any[][], fileName: string} | null>(null);
  const [globalFilter, setGlobalFilter] = useState<{ column: string; value: string } | null>(null);
  const [rawFileContent, setRawFileContent] = useState<{ headers: string[]; rows: any[][]; fileName: string } | null>(null);

  const handleSignOut = async () => {
    try {
      if (isCloudEnabled) {
        await logout();
      }
    } catch (err) {
      console.error("Error during sign out", err);
    }
    // Deep Clean All States
    localStorage.removeItem('tsv_mock_session');
    localStorage.removeItem('tsv_session_active');
    setData(null);
    setActiveProject(null);
    setHistoryFiles([]);
    window.location.reload();
  };

  // Hash Routing para Public Dashboard
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#/share/')) {
        setPublicShareId(hash.replace('#/share/', ''));
    }
    
    const handleHashChange = () => {
        const h = window.location.hash;
        if (h.startsWith('#/share/')) setPublicShareId(h.replace('#/share/', ''));
        else setPublicShareId(null);
    }
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (logo) localStorage.setItem('tsv_logo', logo);
  }, [logo]);



  // Handle Mock Session for Local Mode directly in App since it's UI state
  const isMock = localStorage.getItem('tsv_mock_session') === 'true';
  const effectiveUser = (!isCloudEnabled && isMock) 
    ? { email: 'admin@local.pro', id: 'local-admin-uuid' } 
    : user;

  // Apply Brand Color from Project
  useEffect(() => {
    const root = window.document.documentElement;
    const brandColor = activeProject?.settings?.brand_color || '#06b6d4';
    root.style.setProperty('--brand-turquoise', brandColor);
    
    // Generar variante oscura del color de marca para sombras y efectos
    try {
      const r = parseInt(brandColor.slice(1, 3), 16);
      const g = parseInt(brandColor.slice(3, 5), 16);
      const b = parseInt(brandColor.slice(5, 7), 16);
      root.style.setProperty('--brand-rgb', `${r}, ${g}, ${b}`);
    } catch (e) {
      root.style.setProperty('--brand-rgb', '6, 182, 212');
    }
  }, [activeProject]);

  // Load history and sync data when session or project changes
  useEffect(() => {
    if (effectiveUser) {
      loadHistory();
      // If we change project, we should reset current view to latest report of that project
      if (activeProject) {
          setData(null); // Clear previous project data briefly
      }
    }
  }, [effectiveUser, activeProject?.id]);

  const loadHistory = async () => {
    try {
      const files = await getFiles(activeProject?.id);
      const sorted = files.reverse();
      setHistoryFiles(sorted); // Newest first
      
      // Auto-load last file of the selected project
      if (sorted.length > 0) {
        loadFromHistory(sorted[0]);
      } else {
        setData(null);
        setReportName('');
      }
    } catch (err) {
      console.error("Failed to load history", err);
    }
  };

  const processFileContent = async (headers: string[], rawRows: any[][], fileName: string, filter: {column: string, value: string} | null = null) => {
      // Data sterilization as mandated
      const stringRows = rawRows.map(row => row.map(cell => String(cell || '').replace(/[^\x20-\x7E]/g, '')));
      setRawFileContent({ headers, rows: rawRows, fileName });
      
      // Filter rows if applicable
      let filteredRawRows = rawRows;
      if (filter) {
        const colIdx = headers.indexOf(filter.column);
        if (colIdx !== -1) {
          filteredRawRows = rawRows.filter(r => String(r[colIdx]) === filter.value);
        }
      }

      // Ensure all cells are strings for initial processing
      const cleanStringRows = filteredRawRows.map(row => row.map(cell => {
          if (cell === null || cell === undefined) return '';
          return String(cell).replace(/[^\x20-\x7E]/g, '');
      }));

      // Process Data (Clean, Format Dates, Stats)
      const { processedRows, stats, formattedHeaders } = processData(headers, cleanStringRows);
      
      // Convert back to string[][] for DataTable (keeping formatting)
      const rows = processedRows.map(r => formattedHeaders.map(h => String(r[h])));
      
      const summary = generateDataSummary(formattedHeaders, rows, stats);

      setData({
        headers: formattedHeaders,
        rows,
        fileName,
        stats,
        summary
      });
      
      if (!filter) setReportName(fileName.split('.')[0]); 
      setActiveTab('dashboard'); 
      setIsLoading(false);
      if (!filter) setIsBriefingOpen(true); 

      // Trigger Auto-Insights if not in filter mode
      if (!filter) {
        setInsightsFindings([]);
        setInsightsSummary('');
        generateAutoInsights(summary, stats);
      }
  };

  const handleApplyFilter = (column: string, value: string) => {
    if (globalFilter?.column === column && globalFilter?.value === value) {
      setGlobalFilter(null);
      if (rawFileContent) processFileContent(rawFileContent.headers, rawFileContent.rows, rawFileContent.fileName, null);
    } else {
      setGlobalFilter({ column, value });
      if (rawFileContent) processFileContent(rawFileContent.headers, rawFileContent.rows, rawFileContent.fileName, { column, value });
    }
  };

  const generateAutoInsights = async (summary: string, stats: DataStats) => {
    setInsightsLoading(true);
    try {
      // Local fallback logic only. No external server calls to guarantee Local Mode stability.
      setInsightsFindings([
        { type: 'trend', title: 'Dataset Procesado', description: 'El sistema ha analizado las sesiones locales correctamente.', value: `${stats.totalSessions}`, action: 'Análisis local activo.' },
        { type: 'achievement', title: 'SLA Detectado', description: 'Nivel de cumplimiento basado en métricas locales.', value: `${stats.slaCompliance?.toFixed(1)}%`, action: 'Monitorear picos horários.' }
      ]);
      setInsightsSummary("Análisis local completado exitosamente sin peticiones de red.");
    } finally {
      setInsightsLoading(false);
    }
  };

  const handleFileUpload = (file: File) => {
    setIsLoading(true);
    setError(null);

    const ext = file.name.split('.').pop()?.toLowerCase();

    // Detección automática del motor de parseo: Excel para .xlsx/.xls, PapaParse autodetectado para cualquier otro
    if (ext === 'xlsx' || ext === 'xls') {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
                
                if (!jsonData || jsonData.length === 0) {
                    setError("El archivo de Excel parece estar vacío.");
                    setIsLoading(false);
                    return;
                }

                // Curaduría inteligente de metadatos/encabezados basura
                const { headers, rows: rawRows } = extractStructuredData(jsonData);
                
                if (headers.length === 0) {
                    setError("No se pudieron identificar columnas estructuradas en el archivo de Excel.");
                    setIsLoading(false);
                    return;
                }

                setPendingData({ headers, rows: rawRows, fileName: file.name });
                setIsLoading(false);
            } catch (err) {
                setError(`Error al procesar el archivo Excel: ${err}`);
                setIsLoading(false);
            }
        };
        reader.readAsArrayBuffer(file);
    } else {
      // Intentar procesar como archivo delimitado (CSV, TSV, TXT, LOG, etc.) con autodetección dinámica
      try {
        Papa.parse(file, {
          encoding: 'UTF-8',
          skipEmptyLines: true,
          complete: async (results) => {
            const rawData = results.data as string[][];
            if (!rawData || rawData.length === 0) {
                setError("El archivo parece estar vacío o no es legible.");
                setIsLoading(false);
                return;
            }
            
            // Curaduría inteligente de metadatos/encabezados basura
            const { headers, rows: rawRows } = extractStructuredData(rawData);
            
            if (headers.length === 0) {
                setError("No se pudieron identificar columnas estructuradas en el archivo.");
                setIsLoading(false);
                return;
            }

            setPendingData({ headers, rows: rawRows, fileName: file.name });
            setIsLoading(false);
          },
          error: (err) => {
            setError(`Error al analizar el archivo estructurado: ${err.message}`);
            setIsLoading(false);
          }
        });
      } catch (err: any) {
        setError(`Error crítico al procesar el archivo: ${err.message}`);
        setIsLoading(false);
      }
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
      await saveFile(reportName, data.headers, data.rows, activeProject?.id);
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
    try {
      if (!file?.headers?.length || !file?.data?.length) {
        console.warn('Archivo de historial inválido o corrupto, ignorando.', file?.name);
        setError('El archivo seleccionado parece estar corrupto.');
        return;
      }
      // We re-process even from history to ensure latest formatting/logic applies
      const { processedRows, stats, formattedHeaders } = processData(file.headers, file.data);
      
      // Re-map rows to ensure they catch any new formatting logic (like smart time)
      const rows = processedRows.map(r => formattedHeaders.map(h => String(r[h] ?? '')));
      const summary = generateDataSummary(formattedHeaders, rows, stats);
      
      setData({
        headers: formattedHeaders,
        rows,
        fileName: file.name,
        stats,
        summary
      });
      setReportName(file.name);
      setActiveTab(targetTab);
    } catch (err) {
      console.error('Error procesando archivo de historial:', err);
      setError('Error al procesar el archivo seleccionado. El formato podría haber cambiado.');
    }
  };

  const generateAISlides = async (config?: any): Promise<any[]> => {
    if (!data) return [];
    return []; // No external calls allowed in pure local mode
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
        "w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all text-sm font-semibold group relative",
        active 
          ? "bg-brand-turquoise text-white shadow-lg shadow-brand-turquoise/30" 
          : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-brand-dark dark:hover:text-white"
      )}
    >
      <Icon size={18} className={cn("icon-shadow", active ? "text-white" : "text-slate-400 group-hover:text-brand-dark dark:group-hover:text-white")} />
      {isSidebarOpen && <span>{label}</span>}
      {active && <div className="absolute left-0 w-1 h-6 bg-white/20 rounded-r-full" />}
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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="text-brand-turquoise animate-spin shadow-lg" size={48} />
      </div>
    );
  }

  if (!effectiveUser && !publicShareId) {
    return <Auth />;
  }

  if (publicShareId) {
    return <PublicDashboard shareId={publicShareId} />;
  }

  return (
    <>
      {data && (
        <ExecutiveBriefing 
          isOpen={isBriefingOpen}
          onClose={() => setIsBriefingOpen(false)}
          stats={data.stats}
          insights={data.insights}
        />
      )}

      <div 
         className="flex h-screen overflow-hidden font-sans dark"
         style={{ backgroundColor: '#0E1117', color: '#FFFFFF' }}
      >
      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-white dark:bg-dark-card border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-500 z-20 shadow-2xl shadow-slate-200/20 dark:shadow-none",
          isSidebarOpen ? "w-72" : "w-20"
        )}
      >
        <div className="p-6 flex items-center justify-between h-20">
          {isSidebarOpen ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-turquoise rounded-xl flex items-center justify-center shadow-lg shadow-brand-turquoise/30">
                <ShieldCheck className="text-white" size={24} />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg text-brand-dark dark:text-white tracking-tight leading-none">TSV Intelligence</span>
                <span className="text-[10px] text-brand-turquoise font-black tracking-widest uppercase mt-1">PRO EDITION</span>
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 bg-brand-turquoise rounded-xl flex items-center justify-center mx-auto">
              <ShieldCheck className="text-white" size={20} />
            </div>
          )}
        </div>

        {isSidebarOpen && isCloudEnabled && (
          <div className="px-6 mb-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-turquoise/5 border border-brand-turquoise/10 rounded-full w-fit">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-turquoise animate-pulse" />
              <span className="text-[8px] font-black text-brand-turquoise uppercase tracking-widest">Enterprise Cloud Active</span>
            </div>
          </div>
        )}

        <nav className="flex-1 px-4 space-y-6 mt-4 overflow-y-auto no-scrollbar">
          <div className="px-2 mb-4">
             <ProjectManager 
                activeProjectId={activeProject?.id} 
                onProjectSelect={setActiveProject} 
             />
          </div>

          <SidebarGroup label="Workspace" id="workspace" icon={Database}>
            <NavItem tab="upload" icon={UploadCloud} label="Carga de Datos" active={activeTab === 'upload'} />
            <NavItem tab="viewer" icon={TableIcon} label="Visor Interactivo" active={activeTab === 'viewer'} />
          </SidebarGroup>

          <SidebarGroup label="Analytics" id="analytics" icon={DashboardIcon}>
            <NavItem tab="dashboard" icon={DashboardIcon} label="Live Dashboard" active={activeTab === 'dashboard'} />
            <NavItem tab="analytics" icon={FlaskConical} label="Estadísticas" active={activeTab === 'analytics'} />
            <NavItem tab="presentation" icon={Presentation} label="Modo Presentación" active={activeTab === 'presentation'} />
            <NavItem tab="history" icon={Vault} label="Bóveda de Datos" active={activeTab === 'history'} />
          </SidebarGroup>

          <SidebarGroup label="System" id="system" icon={SettingsIcon}>
             <button
                onClick={() => setIsChatOpen(!isChatOpen)}
                className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm font-medium group",
                    isChatOpen ? "bg-brand-turquoise/10 text-brand-turquoise" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                )}
                >
                <MessageSquare size={18} className="icon-shadow" />
                {isSidebarOpen && <span>Asistente IA</span>}
            </button>
            <NavItem tab="settings" icon={SettingsIcon} label="Configuración" active={activeTab === 'settings'} />
          </SidebarGroup>
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-dark-border space-y-3">
          {isSidebarOpen && (
            <div className="flex items-center gap-3 px-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center text-[10px] font-bold">
                {effectiveUser?.email?.substring(0, 2).toUpperCase() || 'AD'}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                  {effectiveUser?.email || 'Admin User'}
                </span>
                <span className="text-[10px] text-brand-turquoise font-bold uppercase tracking-tighter truncate">
                  {activeProject?.name || 'Personal Workspace'}
                </span>
              </div>
            </div>
          )}
          
          <div className="flex flex-col gap-1">

            
             <button
                 onClick={handleSignOut}
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
      <main className="flex-1 flex flex-col min-w-0 relative bg-brand-gray dark:bg-dark-bg transition-colors duration-300">
        {/* Top Bar */}
        <header className="h-20 bg-white dark:bg-dark-card border-b border-slate-200 dark:border-dark-border flex items-center justify-between px-8 z-10 sticky top-0 transition-colors duration-300">
          <div>
            <h2 className="text-xl font-bold text-brand-dark dark:text-white">
              {{ upload: 'Nueva Lectura', viewer: 'Explorador de Datos', dashboard: 'Dashboard Ejecutivo', analytics: 'Estadísticas Avanzadas', history: 'Bóveda de Reportes', presentation: 'Modo Presentación', settings: 'Configuración' }[activeTab]}
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Gestión Inteligente de Datos TSV</p>
          </div>
          
          <div className="flex items-center gap-3">
            {data && (
              <>
                <button 
                  onClick={() => setIsBriefingOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-turquoise/10 border border-brand-turquoise/20 text-brand-turquoise hover:bg-brand-turquoise hover:text-white transition-all text-sm font-bold shadow-sm"
                >
                  <Sparkles size={18} />
                  <span className="hidden md:inline">AI Briefing</span>
                </button>

                <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

                <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

                <button 
                  onClick={handleExportExcel}
                  className="px-4 py-2 bg-slate-100 text-slate-800 font-bold rounded-md hover:bg-slate-200 border-none cursor-pointer text-sm"
                  style={{ minWidth: '120px' }}
                >
                  EXPORTAR PREMIUM
                </button>

                <button 
                  onClick={() => setIsChatOpen(!isChatOpen)}
                  className="px-4 py-2 bg-[#40E0D0] text-white font-bold rounded-md hover:opacity-90 border-none cursor-pointer text-sm"
                  style={{ minWidth: '120px' }}
                >
                  ASISTENTE IA
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

        {/* Insights Bar */}
        {data && (insightsFindings.length > 0 || insightsLoading) && (
          <InsightsBar
            findings={insightsFindings}
            executiveSummary={insightsSummary}
            isLoading={insightsLoading}
            onDismiss={() => { setInsightsFindings([]); setInsightsSummary(''); }}
          />
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-8 relative">
          {/* Data Selection Hub Overlay */}
          <AnimatePresence>
              {pendingData && (
                  <DataSelector 
                      headers={pendingData.headers}
                      rows={pendingData.rows}
                      onConfirm={async (selectedHeaders, filteredRows) => {
                          const fileName = pendingData.fileName;
                          setPendingData(null);
                          setIsLoading(true);
                          await processFileContent(selectedHeaders, filteredRows, fileName);
                      }}
                      onCancel={() => {
                          setPendingData(null);
                      }}
                  />
              )}
          </AnimatePresence>

          <div style={{ display: activeTab === 'upload' ? 'block' : 'none', height: '100%' }}>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto h-full flex flex-col justify-center animate-in fade-in zoom-in-95 duration-700"
              >
                <div className="text-center mb-10">
                  <h1 className="text-5xl font-black text-brand-dark dark:text-white mb-6 tracking-tight flex items-center justify-center gap-4 drop-shadow-sm">
                    TSV <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-turquoise to-blue-500">Intelligence</span> Pro
                  </h1>
                  <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto text-lg leading-relaxed">
                    Sube tu archivo TSV/CSV. La red local analizará las métricas instantáneamente.
                  </p>
                  
                  <div className="relative p-1 bg-slate-50 dark:bg-slate-950/50 rounded-[2.5rem] border border-slate-100 dark:border-white/5">
                    <FileUpload onFileUpload={handleFileUpload} className="border-brand-turquoise/20 hover:border-brand-turquoise bg-white dark:bg-slate-900 shadow-sm" />
                  </div>
                  
                  {isLoading && (
                    <div className="mt-10 flex flex-col items-center gap-4 text-brand-turquoise">
                      <div className="relative">
                        <Loader2 className="animate-spin" size={40} />
                        <Sparkles className="absolute -top-1 -right-1 text-brand-turquoise/50 animate-pulse" size={16} />
                      </div>
                      <span className="font-black text-xs uppercase tracking-[0.3em] text-slate-400">Analizando Red Neuronal...</span>
                    </div>
                  )}
                  {error && (
                    <div className="mt-8 p-5 bg-red-500/5 text-red-600 dark:text-red-400 rounded-2xl flex items-center gap-4 border border-red-500/10 text-sm font-bold text-left animate-in fade-in slide-in-from-top-4">
                      <AlertCircle size={24} className="flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {data && (
              <>
                <div style={{ display: activeTab === 'viewer' ? 'block' : 'none', height: '100%' }}>
                  <DataTable 
                    data={data.rows} 
                    headers={data.headers} 
                    fileName={data.fileName}
                    onReset={() => setActiveTab('upload')}
                    columnTotals={data.stats.columnTotals}
                  />
                </div>

                {activeTab === 'dashboard' && (
                  <Dashboard 
                      stats={data.stats} 
                      insights={data.insights} 
                      currentFilter={globalFilter}
                      onFilter={handleApplyFilter}
                      onShare={async () => {
                          setIsLoading(true);
                          try {
                              const name = reportName || data.fileName.split('.')[0] || 'Reporte';
                              const id = await savePublicShare(name, data.stats, data.summary, activeProject?.brand_color);
                              window.open(`${window.location.origin}${window.location.pathname}#/share/${id}`, '_blank');
                          } catch (e) {
                              console.error("Error sharing", e);
                              alert("No se pudo generar el enlace público.");
                          } finally {
                              setIsLoading(false);
                          }
                      }}
                  />
                )}

                {activeTab === 'analytics' && (
                  <AnalyticsPanel stats={data.stats} />
                )}

                {activeTab === 'presentation' && (
                  <PresentationMode 
                    stats={data.stats} 
                    insights={data.insights} 
                    onBack={() => setActiveTab('dashboard')}
                    logo={logo}
                    onGenerateSlides={generateAISlides}
                  />
                )}
              </>
            )}

            {!data && (
              <div style={{ display: activeTab === 'analytics' ? 'flex' : 'none', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                  <FlaskConical size={40} className="opacity-40" />
                </div>
                <h3 className="text-xl font-bold text-slate-700 mb-2">Sin datos para analizar</h3>
                <p className="max-w-xs text-center mb-8">Carga un archivo o selecciona uno de la bóveda para usar el panel de estadísticas.</p>
                <button
                  onClick={() => setActiveTab('upload')}
                  className="px-6 py-3 bg-brand-dark text-white rounded-xl font-medium hover:bg-black transition-colors shadow-lg shadow-slate-200"
                >
                  Ir a Carga de Datos
                </button>
              </div>
            )}

            <div style={{ display: activeTab === 'settings' ? 'block' : 'none', height: '100%' }}>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="max-w-4xl mx-auto w-full p-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
              >
                <div className="bg-white dark:bg-dark-card rounded-[2.5rem] border border-slate-100 dark:border-dark-border p-10 shadow-xl">
                  <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-8">Configuración de Marca</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-6">
                      <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Logo Corporativo</label>
                      <div className="flex flex-col items-center gap-6 p-8 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-700">
                        {logo ? (
                          <div className="relative group">
                            <img src={logo} alt="Logo" className="max-h-24 object-contain" />
                            <button 
                              onClick={() => setLogo(null)}
                              className="absolute -top-4 -right-4 p-2 bg-red-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <div className="text-center">
                            <ImageIcon size={48} className="mx-auto text-slate-300 mb-4" />
                            <p className="text-sm text-slate-500 mb-4">Formatos sugeridos: PNG, SVG (Máx 2MB)</p>
                          </div>
                        )}
                        <input 
                          type="file" 
                          id="logo-upload" 
                          className="hidden" 
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => setLogo(reader.result as string);
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <button 
                          onClick={() => document.getElementById('logo-upload')?.click()}
                          className="px-6 py-2.5 bg-brand-turquoise text-white rounded-xl font-bold text-sm shadow-lg shadow-brand-turquoise/20 hover:scale-105 transition-transform"
                        >
                          Seleccionar Logo
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                       <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Previsualización en Reportes</label>
                       <div className="aspect-video glass-startup rounded-[2rem] flex items-center justify-center p-4">
                          <div className="text-center">
                             {logo ? (
                               <img src={logo} alt="Preview" className="max-h-12 mx-auto mb-4 opacity-80" />
                             ) : (
                               <div className="h-8 w-24 bg-slate-700/20 rounded-md mx-auto mb-4" />
                             )}
                             <div className="h-2 w-32 bg-slate-700/20 rounded-full mx-auto mb-2" />
                             <div className="h-2 w-20 bg-slate-700/10 rounded-full mx-auto" />
                          </div>
                       </div>
                       <p className="text-xs text-slate-500 italic">Este logo aparecerá en el encabezado de tus dashboards y en cada slide de tus presentaciones.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            <div style={{ display: activeTab === 'history' ? 'block' : 'none', height: '100%' }}>
              <motion.div 
                key="history"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="max-w-6xl mx-auto px-4"
              >
                <div className="flex items-center justify-between mb-10">
                   <div>
                      <h2 className="text-3xl font-black text-slate-800 dark:text-white">Bóveda de Inteligencia</h2>
                      <p className="text-sm text-slate-500 mt-1">
                        {activeProject ? `Archivos aislados para ${activeProject.name}` : 'Reportes en tu espacio personal'}
                      </p>
                   </div>
                   <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                      <Vault size={16} className="text-brand-turquoise" />
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{historyFiles.length} Archivos</span>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {historyFiles.length > 0 ? (
                    historyFiles.map((file) => (
                      <div 
                        key={file.id}
                        className="premium-card p-6 flex flex-col h-full relative group overflow-hidden"
                      >
                        {/* Project Badge */}
                        <div className="absolute top-0 right-0 px-4 py-1.5 rounded-bl-2xl bg-brand-turquoise/10 text-brand-turquoise text-[9px] font-black uppercase tracking-widest border-l border-b border-brand-turquoise/20">
                           {activeProject?.name || 'Personal'}
                        </div>

                        <div className="flex items-start justify-between mb-6">
                          <div className={cn(
                             "w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-6 shadow-lg",
                             activeProject ? "bg-brand-turquoise text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                          )}>
                            <Database size={28} />
                          </div>
                          <button 
                            onClick={(e) => handleDeleteHistory(file.id, e)}
                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                        
                        <h3 className="font-extrabold text-slate-900 dark:text-white text-xl mb-1 truncate leading-tight" title={file.name}>
                          {file.name}
                        </h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">UUID: {file.id.slice(0, 8)}</p>
                        
                        <div className="mt-auto space-y-4">
                           <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                              <div className="flex flex-col">
                                 <span className="text-[9px] font-black text-slate-400 uppercase">Fecha</span>
                                 <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{new Date(file.date).toLocaleDateString()}</span>
                              </div>
                              <div className="flex flex-col text-right">
                                 <span className="text-[9px] font-black text-slate-400 uppercase">Registros</span>
                                 <span className="text-xs font-bold text-brand-turquoise">{file.data.length.toLocaleString()}</span>
                              </div>
                           </div>
                           
                           <div className="grid grid-cols-2 gap-3">
                               <button 
                                onClick={() => loadFromHistory(file, 'dashboard')}
                                className="flex items-center justify-center gap-2 py-3 bg-slate-900 dark:bg-slate-800 hover:bg-brand-turquoise text-white rounded-2xl text-xs font-black transition-all shadow-lg hover:shadow-brand-turquoise/20"
                               >
                                  <DashboardIcon size={14} /> Dashboard
                               </button>
                               <button 
                                onClick={() => loadFromHistory(file, 'viewer')}
                                className="flex items-center justify-center gap-2 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-brand-turquoise hover:text-brand-turquoise text-slate-600 dark:text-slate-200 rounded-2xl text-xs font-bold transition-all"
                               >
                                  <TableIcon size={14} /> Visor
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
            </div>
            
            {/* Empty States for Viewer/Dashboard if no data */}
            {!data && (
              <div style={{ display: (activeTab === 'viewer' || activeTab === 'dashboard') ? 'flex' : 'none', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
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
              <ChatAssistant 
                dataSummary={data?.summary || ''} 
                rawStats={data?.stats}
                onClose={() => setIsChatOpen(false)} 
                projectId={activeProject?.id}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
    </>
  );
}
