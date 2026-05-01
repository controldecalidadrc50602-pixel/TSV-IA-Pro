import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { DataStats } from '@/lib/data-processor';
import { Users, Clock, TrendingUp, Hash, Sparkles, Share2, Globe, LayoutDashboard, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface DashboardProps {
  stats: DataStats;
  insights?: string;
  isPublic?: boolean;
  onShare?: () => void;
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

export function Dashboard({ stats, insights, isPublic, onShare, activeWidgets }: DashboardProps) {
  const visible = activeWidgets ?? ALL_WIDGETS;
  const show = (w: string) => visible.includes(w);

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
                {stats.statsByStatus?.find(s => s.status.toLowerCase().includes('curso'))?.count || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-12 gap-4">

        {/* Carga Horaria */}
        {show('hourly') && (
          <div className="col-span-12 lg:col-span-8 bg-white dark:bg-dark-card p-5 rounded-2xl border border-slate-100 dark:border-dark-border shadow-sm flex flex-col h-[320px]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-black text-slate-800 dark:text-white">Carga Operativa por Hora</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">Distribución de sesiones en el ciclo de 24h</p>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-brand-turquoise" />
                <span className="text-[10px] font-bold text-slate-500 uppercase">Volumen</span>
              </div>
            </div>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.sessionsByHour}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2DD4BF" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2DD4BF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="hour" fontSize={10} fontWeight={700} tickLine={false} axisLine={false} tick={{ fill: '#94A3B8' }} dy={8} />
                  <YAxis fontSize={10} fontWeight={700} tickLine={false} axisLine={false} tick={{ fill: '#94A3B8' }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', fontSize: '12px', fontWeight: 'bold' }} />
                  <Area type="monotone" dataKey="count" stroke="#0D9488" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCount)" name="Sesiones" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Mix de Canales */}
        {show('channels') && (
          <div className={cn(
            "bg-white dark:bg-dark-card p-5 rounded-2xl border border-slate-100 dark:border-dark-border shadow-sm flex flex-col",
            show('hourly') ? "col-span-12 lg:col-span-4 h-[360px]" : "col-span-12 lg:col-span-6 h-[320px]"
          )}>
            <h3 className="text-base font-black text-slate-800 dark:text-white mb-1">Mix de Canales</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">Preferencia de contacto</p>
            <div className="flex-1 flex flex-col justify-center items-center">
              <div className="h-[180px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stats.sessionsByChannel} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                      paddingAngle={6} dataKey="count" nameKey="channel">
                      {stats.sessionsByChannel.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black text-slate-800 dark:text-white">{stats.totalSessions}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Total</span>
                </div>
              </div>
              <div className="w-full mt-3 space-y-1.5">
                {stats.sessionsByChannel.slice(0, 5).map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs px-2 py-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="font-bold text-slate-600 dark:text-slate-400 truncate max-w-[160px]" title={item.channel}>{item.channel}</span>
                    </div>
                    <span className="font-black text-slate-900 dark:text-white ml-2">{Math.round((item.count / stats.totalSessions) * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tipificaciones */}
        {show('tipificaciones') && (
          <div className={cn(
            "bg-white dark:bg-dark-card p-5 rounded-2xl border border-slate-100 dark:border-dark-border shadow-sm flex flex-col h-[280px]",
            show('colas') ? "col-span-12 lg:col-span-6" : "col-span-12"
          )}>
            <h3 className="text-base font-black text-slate-800 dark:text-white mb-1">Tipificaciones Críticas</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">Distribución por categoría de atención</p>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={stats.statsByTipificacion?.slice(0, 6)}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="category" type="category" width={115} fontSize={9} fontWeight={700}
                    tick={{ fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="count" fill="#2DD4BF" radius={[0, 4, 4, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Colas */}
        {show('colas') && (
          <div className={cn(
            "bg-white dark:bg-dark-card p-5 rounded-2xl border border-slate-100 dark:border-dark-border shadow-sm flex flex-col h-[280px]",
            show('tipificaciones') ? "col-span-12 lg:col-span-6" : "col-span-12"
          )}>
            <h3 className="text-base font-black text-slate-800 dark:text-white mb-1">Flujo por Cola</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">Departamentos con mayor volumen</p>
            <div className="flex-1 flex items-center min-h-0">
              <div className="w-1/2 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stats.statsByCola?.slice(0, 5)} cx="50%" cy="50%"
                      innerRadius={35} outerRadius={58} paddingAngle={4} dataKey="count" nameKey="cola">
                      {stats.statsByCola?.slice(0, 5).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-1/2 space-y-2.5 pl-2">
                {stats.statsByCola?.slice(0, 4).map((item, i) => (
                  <div key={i} className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-[9px] font-bold text-slate-700 dark:text-slate-300 truncate tracking-tighter uppercase">{item.cola}</span>
                    </div>
                    <div className="flex items-baseline gap-1 ml-3.5">
                      <span className="text-sm font-black text-slate-900 dark:text-white">{item.count}</span>
                      <span className="text-[8px] text-slate-400 font-bold">SESIONES</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Control de Mandos */}
        {show('mandos') && (
          <div className="col-span-12 bg-slate-900 p-5 rounded-2xl shadow-xl shadow-brand-dark/20 flex flex-col lg:flex-row items-center gap-5">
            <div className="flex-1 text-center lg:text-left">
              <h3 className="text-base font-black text-white mb-1">Control de Mandos Operativo</h3>
              <p className="text-teal-400/70 text-xs">Resumen táctico de tipificaciones y flujos de red</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              <div className="text-center lg:text-left border-l border-white/10 pl-5">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Top Tipificación</p>
                <p className="text-sm font-black text-white truncate max-w-[120px]">{stats.statsByTipificacion?.[0]?.category || '-'}</p>
              </div>
              <div className="text-center lg:text-left border-l border-white/10 pl-5">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Cola Principal</p>
                <p className="text-sm font-black text-white truncate max-w-[120px]">{stats.statsByCola?.[0]?.cola || '-'}</p>
              </div>
              <div className="text-center lg:text-left border-l border-white/10 pl-5">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Transfer Rate</p>
                <p className="text-base font-black text-white">
                  {stats.totalSessions > 0 ? ((stats.totalTransfers / stats.totalSessions) * 100).toFixed(1) : 0}%
                </p>
              </div>
              <div className="text-center lg:text-left border-l border-white/10 pl-5">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Estado: Cerradas</p>
                <p className="text-base font-black text-white">
                  {stats.statsByStatus?.find(s => s.status.toLowerCase().includes('cerrada'))?.count || 0}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
