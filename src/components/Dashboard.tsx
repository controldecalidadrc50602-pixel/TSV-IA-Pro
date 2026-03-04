import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { DataStats } from '@/lib/data-processor';
import { Users, Calendar, MessageSquare, TrendingUp } from 'lucide-react';

interface DashboardProps {
  stats: DataStats;
}

// Turquoise Palette
const COLORS = ['#40E0D0', '#2F4F4F', '#48D1CC', '#5F9EA0', '#20B2AA', '#B0E0E6'];

export function Dashboard({ stats }: DashboardProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Quick KPIs Header */}
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp className="text-brand-turquoise" size={24} />
        <h2 className="text-xl font-bold text-brand-dark">KPIs Rápidos</h2>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100 hover:border-brand-turquoise/30 flex items-center gap-6 hover:scale-[1.02] transition-all duration-300">
          <div className="p-5 bg-brand-turquoise text-white rounded-2xl shadow-lg shadow-brand-turquoise/30">
            <MessageSquare size={32} />
          </div>
          <div>
            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mb-1">Total Sesiones</p>
            <h3 className="text-4xl font-extrabold text-brand-dark">{stats.totalSessions.toLocaleString()}</h3>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100 hover:border-brand-turquoise/30 flex items-center gap-6 hover:scale-[1.02] transition-all duration-300">
          <div className="p-5 bg-brand-dark text-white rounded-2xl shadow-lg shadow-brand-dark/30">
            <Users size={32} />
          </div>
          <div>
            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mb-1">Usuarios Únicos</p>
            <h3 className="text-4xl font-extrabold text-brand-dark">{stats.uniqueUsers.toLocaleString()}</h3>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100 hover:border-brand-turquoise/30 flex items-center gap-6 hover:scale-[1.02] transition-all duration-300">
          <div className="p-5 bg-slate-100 text-slate-500 rounded-2xl">
            <Calendar size={32} />
          </div>
          <div>
            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mb-1">Rango de Fechas</p>
            <h3 className="text-xl font-bold text-brand-dark">{stats.dateRange}</h3>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sessions by Hour */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-brand-dark mb-6">Sesiones por Hora</h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.sessionsByHour}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="hour" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: '#64748b' }}
                  dy={10}
                />
                <YAxis 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: '#64748b' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    padding: '12px'
                  }}
                  cursor={{ fill: '#F5F5F5' }}
                />
                <Bar 
                  dataKey="count" 
                  fill="#40E0D0" 
                  radius={[6, 6, 0, 0]} 
                  name="Sesiones" 
                  barSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sessions by Channel */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-brand-dark mb-6">Distribución por Canal</h3>
          <div className="h-[350px] flex items-center justify-center">
            {stats.sessionsByChannel.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.sessionsByChannel}
                    cx="50%"
                    cy="50%"
                    innerRadius={80} // Donut Chart
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="channel"
                  >
                    {stats.sessionsByChannel.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip 
                     contentStyle={{ 
                      borderRadius: '12px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      padding: '12px'
                    }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    formatter={(value) => <span className="text-slate-600 font-medium ml-1">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-slate-400">
                <p>No se encontraron canales</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
