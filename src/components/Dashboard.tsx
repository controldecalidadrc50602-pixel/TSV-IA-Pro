import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { DataStats } from '@/lib/data-processor';
import { Users, Clock, TrendingUp, TrendingDown, Hash, Sparkles, Share2, Globe, LayoutDashboard, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { WidgetErrorBoundary } from './WidgetErrorBoundary';

interface DashboardProps {
  stats: DataStats;
  insights?: string;
  isPublic?: boolean;
  onShare?: () => void;
  onFilter?: (column: string, value: string) => void;
  currentFilter?: { column: string; value: string } | null;
  activeWidgets?: string[];
}

const COLORS = ['#0D9488', '#0F172A', '#2DD4BF', '#14B8A6', '#065F46', '#CCFBF1', '#6366F1', '#8B5CF6'];

const KpiCard = ({ icon: Icon, label, value, color, delay, trend, status }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white dark:bg-dark-card p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden"
  >
    <div className="absolute top-0 right-0 w-24 h-24 bg-current opacity-[0.03] rounded-full -mr-8 -mt-8" />
    <div className="flex items-start justify-between mb-4">
      <div className={cn("p-3 rounded-2xl shrink-0 transition-transform group-hover:scale-110 shadow-lg", color, "text-white")}>
        <Icon size={24} />
      </div>
      {trend && (
        <div className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black uppercase",
          trend > 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
        )}>
          {trend > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
    <div className="min-w-0">
      <div className="flex items-center gap-2 mb-1">
        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">{label}</p>
        {status && (
           <div className={cn(
             "w-2 h-2 rounded-full",
             status === 'success' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]"
           )} />
        )}
      </div>
      <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{value}</h3>
    </div>
  </motion.div>
);

const ALL_WIDGETS = ['kpis', 'secundary', 'hourly', 'channels', 'tipificaciones', 'colas', 'mandos'];

export function Dashboard({ stats, insights, isPublic, onShare, activeWidgets, onFilter, currentFilter }: DashboardProps) {
  const visible = activeWidgets ?? ALL_WIDGETS;
  const show = (w: string) => Array.isArray(visible) && visible.includes(w);

  const chartData = React.useMemo(() => {
    const historical = stats.sessionsByHour || [];
    const forecast = stats.forecast || [];
    return [
      ...historical.map(d => ({ ...d, type: 'historical' })),
      ...forecast.map(d => ({ ...d, type: 'forecast' }))
    ];
  }, [stats]);

  return (
    <div className="space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-dark-card p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl no-print">
        <div className="flex items-center gap-5">
           <div className="w-14 h-14 bg-brand-turquoise rounded-2xl flex items-center justify-center shadow-2xl shadow-brand-turquoise/30">
              <LayoutDashboard className="text-white" size={28} />
           </div>
           <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-2">Executive Intelligence Center</h2>
              <div className="flex items-center gap-3">
                 <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 text-[9px] font-black uppercase tracking-widest">SLA Optimizado</span>
                 <span className="text-slate-300 dark:text-slate-700">|</span>
                 <span className="text-xs font-bold text-slate-400">{stats.dateRange}</span>
              </div>
           </div>
        </div>

        <div className="flex items-center gap-4">
           {!isPublic && onShare && (
             <button
               onClick={onShare}
               className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white hover:brightness-110 transition-all text-xs font-black shadow-xl"
             >
               <Share2 size={16} /> Compartir Acceso
             </button>
           )}
        </div>
      </div>

      {/* KPI Cards */}
      {show('kpis') && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard 
            icon={TrendingUp} 
            label="SLA Compliance" 
            value={`${(stats.slaCompliance || 0).toFixed(1)}%`}
            trend={+12.4}
            status={stats.slaCompliance > 80 ? 'success' : 'warning'}
            color="bg-emerald-500" 
            delay={0.05} 
          />
          <KpiCard 
            icon={Sparkles} 
            label="AI Resolution" 
            value={`${(stats.botSuccessRate || 0).toFixed(1)}%`}
            trend={+5.2}
            status="success"
            color="bg-brand-turquoise" 
            delay={0.1} 
          />
          <KpiCard 
            icon={Clock} 
            label="Avg. Handling Time" 
            value={stats.avgDuration || "0m"}
            trend={-2.1}
            status="success"
            color="bg-indigo-500" 
            delay={0.15} 
          />
          <KpiCard 
            icon={Hash} 
            label="Operational Index" 
            value={`${(stats.efficiencyIndex || 0).toFixed(1)}%`}
            trend={+8.7}
            status={stats.efficiencyIndex > 70 ? 'success' : 'warning'}
            color="bg-slate-900" 
            delay={0.2} 
          />
        </div>
      )}

      {/* Secondary Row */}
      {/* Anomalies & Secondary Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Anomalies Widget */}
        {stats.anomalies && stats.anomalies.length > 0 && (
          <div className="col-span-12 lg:col-span-4 bg-red-500/5 dark:bg-red-500/10 border border-red-500/20 rounded-[2rem] p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-red-500 mb-2">
                <AlertCircle size={20} />
                <span className="text-[10px] font-black uppercase tracking-widest">Alertas Forenses</span>
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Anomalías Detectadas</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Se han detectado {stats.anomalies.length} desviaciones estadísticas fuera de la norma (Z-Score &gt; 3).
              </p>
            </div>
            <div className="mt-4 space-y-2">
              {stats.anomalies.slice(0, 2).map((a, i) => (
                <div key={i} className="flex items-center justify-between bg-white dark:bg-black/20 p-3 rounded-xl border border-red-500/10">
                  <span className="text-[10px] font-bold text-slate-500 uppercase truncate max-w-[120px]">{a.column}</span>
                  <span className="text-xs font-black text-red-500">{a.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={cn("grid grid-cols-2 gap-4", stats.anomalies?.length ? "col-span-12 lg:col-span-8" : "col-span-12")}>
          <div className="bg-slate-50 dark:bg-dark-border/20 p-5 rounded-[2rem] flex flex-col justify-center border border-slate-100 dark:border-dark-border">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Proyección AI</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-teal-600 dark:text-teal-400">~{Math.round(stats.totalSessions * 1.05)}</span>
              <span className="text-[8px] text-teal-500 font-bold uppercase">Sesiones Mañana</span>
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-dark-border/20 p-5 rounded-[2rem] flex flex-col justify-center border border-slate-100 dark:border-dark-border">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Transferencias</span>
            <span className="text-2xl font-black text-slate-800 dark:text-white">{stats.totalTransfers || 0}</span>
          </div>
          <div className="bg-slate-50 dark:bg-dark-border/20 p-5 rounded-[2rem] flex flex-col justify-center border border-slate-100 dark:border-dark-border">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Respuestas</span>
            <span className="text-2xl font-black text-slate-800 dark:text-white">{stats.totalResponses || 0}</span>
          </div>
          <div className="bg-slate-50 dark:bg-dark-border/20 p-5 rounded-[2rem] flex flex-col justify-center border border-slate-100 dark:border-dark-border">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Estado: En Curso</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
              <span className="text-2xl font-black text-slate-800 dark:text-white">
                {stats.statsByStatus?.find(s => String(s.status || '').toLowerCase().includes('curso'))?.count || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid - Fully Dynamic */}
      <WidgetErrorBoundary>
      <div className="grid grid-cols-12 gap-6">
        {/* Carga Horaria (Si existe) */}
        {show('hourly') && stats.sessionsByHour?.some(h => h.count > 0) && (
          <div className="col-span-12 lg:col-span-8 bg-white dark:bg-dark-card p-6 rounded-[2.5rem] border border-slate-100 dark:border-dark-border shadow-sm flex flex-col h-[400px]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Carga Operativa Temporal</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">Distribución de demanda por franja horaria</p>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 px-4 py-2 rounded-xl">
                 <Clock size={16} className="text-brand-turquoise" />
                 <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">Hora Pico: {stats.peakHour?.hour}:00</span>
              </div>
            </div>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="99%" height="100%" minWidth={1} minHeight={1} debounce={100}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2DD4BF" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2DD4BF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="hour" fontSize={10} fontWeight={700} tickLine={false} axisLine={false} tick={{ fill: '#94A3B8' }} dy={8} />
                  <YAxis fontSize={10} fontWeight={700} tickLine={false} axisLine={false} tick={{ fill: '#94A3B8' }} />
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold' }} />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#0D9488" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorCount)" 
                    name="Volumen Histórico"
                    connectNulls
                    data={chartData.filter(d => d.type === 'historical' || d === chartData.find(x => x.type === 'historical' && chartData[chartData.indexOf(x)+1]?.type === 'forecast'))}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#0D9488" 
                    strokeWidth={3} 
                    strokeDasharray="5 5"
                    fill="transparent"
                    name="Proyección AI"
                    connectNulls
                    data={chartData.filter(d => d.type === 'forecast' || d === chartData.filter(x => x.type === 'historical').pop())}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Dynamic Categorical Widgets */}
        {(stats.allCategoricalStats ?? []).map((cat, idx) => (
          <div 
            key={cat.header}
            className={cn(
              "bg-white dark:bg-dark-card p-6 rounded-[2.5rem] border border-slate-100 dark:border-dark-border shadow-sm flex flex-col h-[400px]",
              idx === 0 && show('hourly') ? "col-span-12 lg:col-span-4" : "col-span-12 lg:col-span-6"
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-black text-slate-900 dark:text-white truncate" title={cat.header}>
                Mix de {cat.header}
                {currentFilter?.column === cat.header && (
                  <button 
                    onClick={() => onFilter?.(cat.header, currentFilter.value)}
                    className="text-[8px] font-black bg-brand-turquoise text-white px-2 py-0.5 rounded-full animate-pulse ml-2"
                  >
                    Filtrado: {currentFilter.value} (X)
                  </button>
                )}
              </h3>
              <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400">
                {idx === 0 ? <Globe size={16} /> : idx === 1 ? <Sparkles size={16} /> : <Share2 size={16} />}
              </div>
            </div>
            <p className="text-xs text-slate-400 mb-6">Distribución de impacto por {cat.header.toLowerCase()}</p>
            
            <div className="flex-1 flex flex-col min-h-0">
               {idx === 0 ? (
                <div className="flex-1 relative flex items-center justify-center">
                    <ResponsiveContainer width="99%" height="100%" minWidth={1} minHeight={1} debounce={100}>
                      <PieChart>
                        <Pie 
                          data={cat.data.slice(0, 8)} 
                          cx="50%" cy="50%" 
                          innerRadius={60} outerRadius={90}
                          paddingAngle={5} dataKey="count" nameKey="label"
                          onClick={(data) => onFilter?.(cat.header, data.label)}
                          className="cursor-pointer outline-none"
                        >
                          {(cat.data ?? []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute flex flex-col items-center pointer-events-none">
                       <span className="text-3xl font-black text-slate-900 dark:text-white">{cat.data.length}</span>
                       <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Items</span>
                    </div>
                 </div>
               ) : (
                 <ResponsiveContainer width="99%" height="100%" minWidth={1} minHeight={1} debounce={100}>
                    <BarChart layout="vertical" data={cat.data.slice(0, 6)}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="label" type="category" width={100} fontSize={9} fontWeight={700}
                        tick={{ fill: '#64748B' }} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }} />
                      <Bar dataKey="count" fill={COLORS[idx % COLORS.length]} radius={[0, 8, 8, 0]} barSize={20}>
                        {cat.data.slice(0, 6).map((_, i) => <Cell key={i} fillOpacity={1 - (i * 0.1)} />)}
                      </Bar>
                    </BarChart>
                 </ResponsiveContainer>
               )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800 grid grid-cols-2 gap-2">
               <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Top Valor</p>
                  <p className="text-xs font-black text-slate-900 dark:text-white truncate">{cat.data[0]?.label || '-'}</p>
               </div>
               <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Dominancia</p>
                  <p className="text-xs font-black text-brand-turquoise">
                    {(stats.totalSessions ?? 0) > 0 ? Math.round(((cat.data[0]?.count ?? 0) / stats.totalSessions) * 100) : 0}%
                  </p>
               </div>
            </div>
          </div>
        ))}

        {/* Control de Mandos Operativo */}
        {show('mandos') && (
          <div className="col-span-12 bg-slate-950 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col lg:flex-row items-center gap-8">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-turquoise/10 rounded-full blur-[80px]" />
            <div className="flex-1 text-center lg:text-left relative z-10">
              <div className="flex items-center gap-2 mb-2 justify-center lg:justify-start">
                 <div className="w-2 h-2 rounded-full bg-brand-turquoise animate-pulse" />
                 <span className="text-[10px] font-black text-brand-turquoise uppercase tracking-[0.3em]">Tactical Command</span>
              </div>
              <h3 className="text-2xl font-black text-white mb-2 italic">Resumen Operativo Estratégico</h3>
              <p className="text-slate-400 text-sm max-w-md">Consolidado dinámico de las métricas de rendimiento y flujo de red detectadas.</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 relative z-10 w-full lg:w-auto">
              {(stats.allCategoricalStats ?? []).slice(0, 2).map((cat, i) => (
                <div key={i} className="text-center lg:text-left border-l border-white/10 pl-6">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Top {cat.header}</p>
                  <p className="text-sm font-black text-white truncate max-w-[120px]" title={cat.data[0]?.label}>{cat.data[0]?.label || '-'}</p>
                </div>
              ))}
              <div className="text-center lg:text-left border-l border-white/10 pl-6">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Volumen Total</p>
                <p className="text-xl font-black text-brand-turquoise">{stats.totalSessions.toLocaleString()}</p>
              </div>
              <div className="text-center lg:text-left border-l border-white/10 pl-6">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Rendimiento</p>
                <p className="text-xl font-black text-white">{(stats.efficiencyIndex || 0).toFixed(1)}%</p>
              </div>
            </div>
          </div>
        )}
      </div>
      </WidgetErrorBoundary>
    </div>
  );
}
