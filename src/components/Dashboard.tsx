import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { DataStats } from '@/lib/data-processor';
import { Users, Clock, TrendingUp, Hash, Sparkles, Share2, Globe } from 'lucide-react';
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

const KpiCard = ({ icon: Icon, label, value, color, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white dark:bg-dark-card p-4 rounded-2xl border border-slate-100 dark:border-dark-border shadow-sm hover:shadow-md transition-all group"
  >
    <div className="flex items-center gap-3">
      <div className={`p-3 rounded-xl ${color} bg-opacity-10 group-hover:scale-110 transition-transform shrink-0`}>
        <Icon size={20} className={color.replace('bg-', 'text-')} />
      </div>
      <div>
        <div className="flex items-center gap-1.5 mb-0.5">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</p>
          {label.includes('SLA') && (
            <div className={cn("w-1.5 h-1.5 rounded-full", parseFloat(value) > 80 ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" : "bg-red-500 animate-pulse")} />
          )}
        </div>
        <h3 className="text-xl font-black text-slate-800 dark:text-white">{value}</h3>
      </div>
    </div>
  </motion.div>
);

const ALL_WIDGETS = ['kpis', 'secundary', 'hourly', 'channels', 'tipificaciones', 'colas', 'mandos'];

export function Dashboard({ stats, insights, isPublic, onShare, activeWidgets }: DashboardProps) {
  const visible = activeWidgets ?? ALL_WIDGETS;
  const show = (w: string) => visible.includes(w);

  return (
    <div className="space-y-5 pb-10">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 text-[10px] font-bold uppercase tracking-wider">Live Analytics</span>
            <span className="text-slate-300 text-xs">|</span>
            <span className="text-slate-400 text-xs font-medium">{stats.dateRange}</span>
            {isPublic && (
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-600 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <Globe size={10} /> Solo Lectura
              </span>
            )}
          </div>
          <h2 className="text-xl font-black text-brand-dark dark:text-white tracking-tight italic">Executive Insight Dashboard</h2>
          {stats.peakHour && (
            <p className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest mt-0.5">
              🔥 Hora Pico: {stats.peakHour.hour}:00 ({stats.peakHour.count} sesiones)
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {insights && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-start gap-3 bg-teal-900 text-white p-3 rounded-2xl shadow-xl max-w-sm border border-teal-400/20"
            >
              <Sparkles className="text-teal-400 shrink-0 mt-0.5" size={16} />
              <div className="text-xs leading-relaxed opacity-90 italic">{insights}</div>
            </motion.div>
          )}
          {!isPublic && onShare && (
            <button
              onClick={onShare}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 transition-all text-xs font-bold"
            >
              <Share2 size={14} /> Compartir
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      {show('kpis') && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard icon={TrendingUp} label="SLA Compliance" value={`${(stats.slaCompliance || 0).toFixed(1)}%`}
            color={stats.slaCompliance && stats.slaCompliance > 80 ? "bg-emerald-500" : "bg-amber-500"} delay={0.05} />
          <KpiCard icon={Sparkles} label="Resolución Directa" value={`${(stats.botSuccessRate || 0).toFixed(1)}%`}
            color="bg-brand-turquoise" delay={0.1} />
          <KpiCard icon={Clock} label="AHT Promedio" value={stats.avgDuration || "-"}
            color="bg-teal-500" delay={0.15} />
          <KpiCard icon={Hash} label="Índice Eficiencia" value={`${(stats.efficiencyIndex || 0).toFixed(1)}%`}
            color="bg-slate-900" delay={0.2} />
        </div>
      )}

      {/* Secondary Row */}
      {show('secundary') && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 dark:bg-dark-border/20 p-3 rounded-xl flex items-center justify-between border border-slate-100 dark:border-dark-border">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Proyección AI</span>
              <span className="text-[8px] text-teal-500 font-bold uppercase">Mañana (Est.)</span>
            </div>
            <span className="text-lg font-black text-teal-600 dark:text-teal-400">~{Math.round(stats.totalSessions * 1.05)}</span>
          </div>
          <div className="bg-slate-50 dark:bg-dark-border/20 p-3 rounded-xl flex items-center justify-between border border-slate-100 dark:border-dark-border">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Transferencias</span>
            <span className="text-lg font-black text-slate-800 dark:text-white">{stats.totalTransfers || 0}</span>
          </div>
          <div className="bg-slate-50 dark:bg-dark-border/20 p-3 rounded-xl flex items-center justify-between border border-slate-100 dark:border-dark-border">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Total Respuestas</span>
            <span className="text-lg font-black text-slate-800 dark:text-white">{stats.totalResponses || 0}</span>
          </div>
          <div className="bg-slate-50 dark:bg-dark-border/20 p-3 rounded-xl flex items-center justify-between border border-slate-100 dark:border-dark-border">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">En Curso</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
              <span className="text-lg font-black text-slate-800 dark:text-white">
                {stats.statsByStatus?.find(s => s.status.toLowerCase().includes('curso'))?.count || 0}
              </span>
            </div>
          </div>
        </div>
      )}

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
