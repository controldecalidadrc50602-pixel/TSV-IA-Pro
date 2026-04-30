import React, { useState, useEffect } from 'react';
import { Dashboard } from './Dashboard';
import { AnalyticsPanel } from './AnalyticsPanel';
import { DataStats } from '@/lib/data-processor';
import { getPublicShare } from '@/lib/storage';
import { Loader2, AlertCircle, LayoutDashboard, Settings2, Share2, Check, FlaskConical, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface PublicDashboardProps {
  shareId: string;
}

const WIDGETS = [
    { id: 'kpis', label: 'Tarjetas KPI (SLA, AHT, Eficiencia)' },
    { id: 'secundary', label: 'Métricas Secundarias (Proyecciones, Transf.)' },
    { id: 'hourly', label: 'Gráfico: Carga Operativa por Hora' },
    { id: 'channels', label: 'Gráfico: Mix de Canales' },
    { id: 'tipificaciones', label: 'Gráfico: Tipificaciones Críticas' },
    { id: 'colas', label: 'Gráfico: Flujo por Colas' },
    { id: 'mandos', label: 'Tabla: Control de Mandos Operativo' },
];

export function PublicDashboard({ shareId }: PublicDashboardProps) {
  const [data, setData] = useState<{ stats: DataStats, reportName: string, summary: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics'>('dashboard');
  const [showConfig, setShowConfig] = useState(false);
  const [activeWidgets, setActiveWidgets] = useState<string[]>(WIDGETS.map(w => w.id));
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadShare = async () => {
      try {
        const shareData = await getPublicShare(shareId);
        if (!shareData) {
          setError("Este dashboard público no existe o ha expirado.");
        } else {
          setData(shareData);
        }
      } catch (err) {
        setError("Error al cargar los datos compartidos.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadShare();
  }, [shareId]);

  // Apply Brand Color from Share
  useEffect(() => {
    if (data?.brandColor) {
      const root = window.document.documentElement;
      root.style.setProperty('--color-brand-turquoise', data.brandColor);
    }
  }, [data]);

  const handleCopyLink = () => {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  const toggleWidget = (id: string) => {
      setActiveWidgets(prev => 
          prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id]
      );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <Loader2 className="text-brand-turquoise animate-spin mb-4" size={40} />
        <p className="font-bold text-slate-400 tracking-widest uppercase text-xs">Cargando Dashboard Público...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-red-500">
                <AlertCircle size={32} />
            </div>
            <h2 className="text-xl font-black text-white mb-2">Enlace no válido</h2>
            <p className="text-slate-400 text-sm mb-6">{error}</p>
            <button 
                onClick={() => window.location.href = '/'}
                className="px-6 py-3 bg-brand-turquoise text-white rounded-xl font-bold w-full"
            >
                Ir a la App Principal
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-bg transition-colors duration-300 flex flex-col">
      {/* Header Público */}
      <header className="h-16 bg-white dark:bg-dark-card border-b border-slate-200 dark:border-dark-border flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-brand-turquoise/20 rounded-lg flex items-center justify-center text-brand-turquoise">
                <Globe size={16} />
            </div>
            <div>
                <h1 className="font-black text-brand-dark dark:text-white text-lg leading-tight">
                    {data.reportName || 'Reporte Compartido'}
                </h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">TSV Intelligence Pro</p>
            </div>
        </div>

        <div className="flex items-center gap-3">
            <button
                onClick={() => setShowConfig(!showConfig)}
                className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all",
                    showConfig 
                        ? "bg-brand-dark text-white border-brand-dark dark:bg-white dark:text-slate-900 dark:border-white" 
                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                )}
            >
                <Settings2 size={14} /> Configurar Vista
            </button>
            <button
                onClick={handleCopyLink}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-turquoise/10 border border-brand-turquoise/30 text-brand-turquoise hover:bg-brand-turquoise/20 transition-all text-xs font-bold"
            >
                {copied ? <Check size={14} /> : <Share2 size={14} />}
                {copied ? 'Copiado!' : 'Copiar Link'}
            </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex justify-center border-b border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card">
          <div className="flex gap-8">
              <button
                  onClick={() => setActiveTab('dashboard')}
                  className={cn(
                      "px-4 py-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2",
                      activeTab === 'dashboard' ? "border-brand-turquoise text-brand-turquoise" : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  )}
              >
                  <LayoutDashboard size={16} /> Dashboard Ejecutivo
              </button>
              <button
                  onClick={() => setActiveTab('analytics')}
                  className={cn(
                      "px-4 py-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2",
                      activeTab === 'analytics' ? "border-brand-turquoise text-brand-turquoise" : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  )}
              >
                  <FlaskConical size={16} /> Estadísticas Avanzadas
              </button>
          </div>
      </div>

      <div className="flex-1 overflow-auto flex relative">
        {/* Contenido Principal */}
        <div className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full">
            <AnimatePresence mode="wait">
                {activeTab === 'dashboard' ? (
                    <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <Dashboard stats={data.stats} isPublic={true} activeWidgets={activeWidgets} />
                    </motion.div>
                ) : (
                    <motion.div key="analytics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <AnalyticsPanel stats={data.stats} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        {/* Panel lateral de configuración */}
        <AnimatePresence>
            {showConfig && (
                <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 320, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className="border-l border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card h-full overflow-hidden shrink-0 shadow-[-10px_0_30px_rgba(0,0,0,0.05)]"
                >
                    <div className="p-6 w-[320px]">
                        <h3 className="font-black text-slate-800 dark:text-white mb-1">Visibilidad de Widgets</h3>
                        <p className="text-xs text-slate-500 mb-6">Selecciona qué gráficos mostrar en la vista del Dashboard.</p>

                        <div className="space-y-2">
                            {WIDGETS.map(w => (
                                <button
                                    key={w.id}
                                    onClick={() => toggleWidget(w.id)}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left"
                                >
                                    <div className={cn(
                                        "w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors",
                                        activeWidgets.includes(w.id) 
                                            ? "bg-brand-turquoise border-brand-turquoise text-white" 
                                            : "border-slate-300 dark:border-slate-600"
                                    )}>
                                        {activeWidgets.includes(w.id) && <Check size={14} />}
                                    </div>
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{w.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
}
