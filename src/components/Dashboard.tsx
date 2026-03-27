import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { DataStats } from '@/lib/data-processor';
import { Users, Calendar, MessageSquare, TrendingUp, Clock, Hash, Globe, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardProps {
  stats: DataStats;
  insights?: string;
}

const COLORS = ['#0D9488', '#0F172A', '#2DD4BF', '#14B8A6', '#065F46', '#CCFBF1'];

const KpiCard = ({ icon: Icon, label, value, color, delay }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white dark:bg-dark-card p-6 rounded-3xl border border-slate-100 dark:border-dark-border shadow-sm hover:shadow-md transition-all group"
  >
    <div className="flex items-center gap-4">
      <div className={`p-4 rounded-2xl ${color} bg-opacity-10 text-brand-dark group-hover:scale-110 transition-transform`}>
        <Icon size={24} className={color.replace('bg-', 'text-')} />
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">{label}</p>
        <h3 className="text-2xl font-black text-slate-800 dark:text-white">{value}</h3>
      </div>
    </div>
  </motion.div>
);

export function Dashboard({ stats, insights }: DashboardProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 text-[10px] font-bold uppercase tracking-wider">Live Analytics</span>
            <span className="text-slate-300 text-xs">|</span>
            <span className="text-slate-400 text-xs font-medium">{stats.dateRange}</span>
          </div>
          <h2 className="text-3xl font-black text-brand-dark dark:text-white tracking-tight italic">Executive Insight Dashboard</h2>
        </div>
        
        {insights && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-start gap-4 bg-teal-900 text-white p-4 rounded-[1.5rem] shadow-xl max-w-md border border-teal-400/20"
          >
            <Sparkles className="text-teal-400 shrink-0" size={20} />
            <div className="text-xs leading-relaxed opacity-90 italic">
                {insights}
            </div>
          </motion.div>
        )}
      </div>

      {/* KPI Rejilla Superior */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard 
          icon={MessageSquare} 
          label="Total Interacciones" 
          value={stats.totalSessions.toLocaleString()} 
          color="bg-brand-turquoise"
          delay={0.1}
        />
        <KpiCard 
          icon={Users} 
          label="Agentes/Usuarios" 
          value={stats.uniqueUsers.toLocaleString()} 
          color="bg-slate-900"
          delay={0.2}
        />
        <KpiCard 
          icon={Clock} 
          label="AHT Promedio" 
          value={stats.avgDuration || "00:00"} 
          color="bg-teal-500"
          delay={0.3}
        />
        <KpiCard 
          icon={Globe} 
          label="Canales Activos" 
          value={stats.sessionsByChannel.length} 
          color="bg-emerald-500"
          delay={0.4}
        />
      </div>

      {/* Main Content Grid (12 Columns) */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Gráfico Principal de Tendencia (8 col) */}
        <div className="col-span-12 lg:col-span-8 bg-white dark:bg-dark-card p-8 rounded-[2rem] border border-slate-100 dark:border-dark-border shadow-sm flex flex-col h-[450px]">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-black text-slate-800 dark:text-white">Carga Operativa por Hora</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">Distribución de sesiones en el ciclo de 24h</p>
            </div>
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-brand-turquoise"></div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Volumen</span>
                </div>
            </div>
          </div>
          
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.sessionsByHour}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2DD4BF" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2DD4BF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis 
                  dataKey="hour" 
                  fontSize={10} 
                  fontWeight={700}
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: '#94A3B8' }}
                  dy={10}
                />
                <YAxis 
                  fontSize={10} 
                  fontWeight={700}
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: '#94A3B8' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                    padding: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#0D9488" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorCount)" 
                  name="Sesiones"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribución por Canal (4 col) */}
        <div className="col-span-12 lg:col-span-4 bg-white dark:bg-dark-card p-8 rounded-[2rem] border border-slate-100 dark:border-dark-border shadow-sm flex flex-col h-[450px]">
          <h3 className="text-lg font-black text-slate-800 dark:text-white mb-2">Mix de Canales</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-8">Preferencia de contacto</p>
          
          <div className="flex-1 flex flex-col justify-center items-center">
            <div className="h-[250px] w-full relative">
               <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.sessionsByChannel}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={8}
                    dataKey="count"
                    nameKey="channel"
                  >
                    {stats.sessionsByChannel.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={4} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-black text-slate-800 dark:text-white">{stats.totalSessions}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Total</span>
              </div>
            </div>
            
            <div className="w-full mt-6 space-y-2">
                {stats.sessionsByChannel.slice(0, 3).map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-xs px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                            <span className="font-bold text-slate-600">{item.channel}</span>
                        </div>
                        <span className="font-black text-slate-900">{Math.round((item.count / stats.totalSessions) * 100)}%</span>
                    </div>
                ))}
            </div>
          </div>
        </div>

        {/* Tabla Detalle KPI (12 col) */}
        <div className="col-span-12 bg-slate-900 p-8 rounded-[2rem] shadow-2xl shadow-brand-dark/20 flex flex-col lg:flex-row items-center gap-8">
            <div className="flex-1 text-center lg:text-left">
                <h3 className="text-xl font-black text-white mb-2">Resumen de Métricas Calculadas</h3>
                <p className="text-teal-400/70 text-sm">Insights automáticos generados por el motor TSV-IA Pro</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {Object.entries(stats.numericStats).slice(0, 4).map(([key, stat], i) => (
                    <div key={i} className="text-center lg:text-left border-l border-white/10 pl-6">
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">{key}</p>
                        <p className="text-2xl font-black text-white">{(stat.mean || 0).toFixed(1)}</p>
                        <p className="text-[10px] text-teal-400 font-bold">PROM. GLOBAL</p>
                    </div>
                ))}
            </div>
        </div>

      </div>
    </div>
  );
}
