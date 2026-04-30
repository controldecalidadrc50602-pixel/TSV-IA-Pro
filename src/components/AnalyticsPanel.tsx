import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, Legend, ReferenceLine
} from 'recharts';
import {
  TrendingUp, TrendingDown, AlertTriangle, Activity,
  Filter, BarChart2, Sigma, Zap, ChevronDown, Info
} from 'lucide-react';
import { DataStats, formatDuration } from '@/lib/data-processor';
import { cn } from '@/lib/utils';

interface AnalyticsPanelProps {
  stats: DataStats;
}

const COLORS = ['#2DD4BF', '#6366F1', '#F59E0B', '#EF4444', '#10B981', '#8B5CF6', '#EC4899', '#14B8A6'];

const tooltipStyle = {
  borderRadius: '12px',
  border: '1px solid rgba(255,255,255,0.08)',
  boxShadow: '0 10px 40px -5px rgba(0,0,0,0.4)',
  fontSize: '12px',
  fontWeight: 700,
  backgroundColor: '#0F172A',
  color: '#F1F5F9',
};

// ─── KPI Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 flex items-start gap-4 hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 shadow-sm group">
      <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg transition-transform group-hover:rotate-6', color)}>
        <Icon size={22} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-1.5">{label}</p>
        <p className="text-3xl font-extrabold text-slate-900 dark:text-white leading-none tracking-tight">{value}</p>
        {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 font-medium">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Section Wrapper ─────────────────────────────────────────────────────────
function Section({ title, icon: Icon, children, className }: {
  title: string; icon: React.ElementType; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn('bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-all duration-500', className)}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-xl bg-brand-turquoise/10 flex items-center justify-center">
            <Icon size={18} className="text-brand-turquoise" />
        </div>
        <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-[0.2em]">{title}</h3>
      </div>
      {children}
    </div>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={tooltipStyle} className="px-4 py-3">
      <p className="text-slate-400 text-[11px] mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-black text-sm">
          {p.name}: {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
        </p>
      ))}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export function AnalyticsPanel({ stats }: AnalyticsPanelProps) {
  const [topN, setTopN] = useState(5);
  const [selectedView, setSelectedView] = useState<'tipificaciones' | 'canales' | 'colas' | 'horas'>('tipificaciones');

  // ── Anomaly Detection ──────────────────────────────────────────────────────
  const hourlyAnomaly = useMemo(() => {
    const hours = stats.sessionsByHour.filter(h => h.count > 0);
    if (hours.length < 3) return null;
    const values = hours.map(h => h.count);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    const std = Math.sqrt(variance);
    const threshold = mean + 1.5 * std;
    const anomalies = hours.filter(h => h.count > threshold);
    return { mean: Math.round(mean), std: Math.round(std), threshold: Math.round(threshold), anomalies };
  }, [stats.sessionsByHour]);

  // ── Numeric Summary Table ──────────────────────────────────────────────────
  const numericSummary = useMemo(() => {
    return Object.entries(stats.numericStats).map(([key, s]) => {
      return {
        key,
        min: s.min,
        max: s.max,
        mean: s.mean,
        sum: s.sum,
        cv: s.cv.toFixed(1),
      };
    });
  }, [stats.numericStats]);

  // Helper to format numeric values (remove .0 for integers)
  const formatNum = (val: number) => {
      if (val % 1 === 0) return val.toLocaleString();
      return val.toFixed(1);
  };

  // ── Dynamic Top-N Data ─────────────────────────────────────────────────────
  const topNData = useMemo(() => {
    switch (selectedView) {
      case 'tipificaciones':
        return stats.statsByTipificacion.slice(0, topN).map(d => ({ name: d.category, value: d.count }));
      case 'canales':
        return stats.sessionsByChannel.slice(0, topN).map(d => ({ name: d.channel, value: d.count }));
      case 'colas':
        return stats.statsByCola.slice(0, topN).map(d => ({ name: d.cola, value: d.count }));
      case 'horas':
        return stats.sessionsByHour.filter(h => h.count > 0).slice(0, topN).map(d => ({ name: `${d.hour}:00`, value: d.count }));
    }
  }, [selectedView, topN, stats]);

  // ── Channel vs Hour Heatmap Data ───────────────────────────────────────────
  const channelShare = useMemo(() => {
    const total = stats.sessionsByChannel.reduce((a, b) => a + b.count, 0);
    return stats.sessionsByChannel.slice(0, 6).map((c, i) => ({
      name: c.channel.length > 15 ? c.channel.slice(0, 13) + '…' : c.channel,
      value: c.count,
      pct: total > 0 ? ((c.count / total) * 100).toFixed(1) : '0',
      fill: COLORS[i % COLORS.length],
    }));
  }, [stats.sessionsByChannel]);

  // ── Efficiency Breakdown ───────────────────────────────────────────────────
  const efficiencyData = [
    { name: 'SLA', value: Math.round(stats.slaCompliance ?? 0), fill: (stats.slaCompliance ?? 0) >= 80 ? '#10B981' : '#EF4444' },
    { name: 'Bot Success', value: Math.round(stats.botSuccessRate ?? 0), fill: '#6366F1' },
    { name: 'Eficiencia', value: Math.round(stats.efficiencyIndex ?? 0), fill: '#2DD4BF' },
  ];

  const views = [
    { id: 'tipificaciones', label: 'Tipificaciones' },
    { id: 'canales', label: 'Canales' },
    { id: 'colas', label: 'Colas' },
    { id: 'horas', label: 'Por Hora' },
  ] as const;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Sesiones"
          value={stats.totalSessions.toLocaleString()}
          sub={`Período: ${stats.dateRange}`}
          icon={Activity}
          color="bg-brand-turquoise/10 text-brand-turquoise"
        />
        <StatCard
          label="SLA Compliance"
          value={`${(stats.slaCompliance ?? 0).toFixed(1)}%`}
          sub={(stats.slaCompliance ?? 0) >= 80 ? '✅ Dentro del objetivo' : '⚠ Por debajo del objetivo'}
          icon={(stats.slaCompliance ?? 0) >= 80 ? TrendingUp : TrendingDown}
          color={(stats.slaCompliance ?? 0) >= 80 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}
        />
        <StatCard
          label="AHT Promedio"
          value={stats.avgDuration ?? '-'}
          sub="Handle Time Promedio"
          icon={Sigma}
          color="bg-indigo-500/10 text-indigo-500"
        />
        <StatCard
          label="Índice de Eficiencia"
          value={`${(stats.efficiencyIndex ?? 0).toFixed(1)}%`}
          sub="Talk / (Talk + Wait)"
          icon={Zap}
          color="bg-amber-500/10 text-amber-500"
        />
      </div>

      {/* Row 2: Top-N Dynamic + Efficiency */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Top-N Selector */}
        <Section title="Análisis Top-N Dinámico" icon={Filter} className="lg:col-span-2">
          <div className="flex flex-wrap items-center gap-3 mb-5">
            {/* View Tabs */}
            <div className="flex bg-slate-100 dark:bg-slate-900 rounded-xl p-1 gap-1">
              {views.map(v => (
                <button
                  key={v.id}
                  onClick={() => setSelectedView(v.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                    selectedView === v.id
                      ? 'bg-brand-turquoise text-white shadow-md shadow-brand-turquoise/30'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                  )}
                >
                  {v.label}
                </button>
              ))}
            </div>

            {/* Top-N Selector */}
            <div className="relative ml-auto">
              <select
                value={topN}
                onChange={(e) => setTopN(Number(e.target.value))}
                className="appearance-none pl-3 pr-8 py-1.5 text-xs font-bold text-slate-600 dark:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-turquoise cursor-pointer"
              >
                {[3, 5, 8, 10, 15].map(n => (
                  <option key={n} value={n}>Top {n}</option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topNData} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(148,163,184,0.15)" />
                <XAxis type="number" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#94A3B8', fontWeight: 700 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={130}
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#94A3B8', fontWeight: 700 }}
                  tickFormatter={(v) => v.length > 18 ? v.slice(0, 16) + '…' : v}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Sesiones" radius={[0, 6, 6, 0]} barSize={18}>
                  {topNData?.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>

        {/* Efficiency Gauges */}
        <Section title="KPIs de Eficiencia" icon={Zap}>
          <div className="space-y-4">
            {efficiencyData.map((item) => (
              <div key={item.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{item.name}</span>
                  <span className="text-sm font-black" style={{ color: item.fill }}>{item.value}%</span>
                </div>
                <div className="h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(item.value, 100)}%`, backgroundColor: item.fill }}
                  />
                </div>
              </div>
            ))}

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 space-y-3">
              <div className="flex justify-between">
                <span className="text-xs text-slate-400">Transferencias</span>
                <span className="text-xs font-black text-slate-700 dark:text-white">{stats.totalTransfers.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-400">Respuestas Totales</span>
                <span className="text-xs font-black text-slate-700 dark:text-white">{stats.totalResponses.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-400">Hora Pico</span>
                <span className="text-xs font-black text-brand-turquoise">
                  {stats.peakHour ? `${stats.peakHour.hour}:00 (${stats.peakHour.count} ses.)` : '-'}
                </span>
              </div>
            </div>
          </div>
        </Section>
      </div>

      {/* Row 3: Anomaly Detection + Channel Share */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Anomaly Detection */}
        <Section title="Detector de Anomalías — Volumen Horario" icon={AlertTriangle}>
          {hourlyAnomaly ? (
            <>
              <div className="flex flex-wrap gap-3 mb-4">
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 rounded-xl px-3 py-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Media</span>
                  <span className="text-sm font-black text-slate-700 dark:text-white">{hourlyAnomaly.mean}</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 rounded-xl px-3 py-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Umbral</span>
                  <span className="text-sm font-black text-amber-500">{hourlyAnomaly.threshold}</span>
                </div>
                <div className="flex items-center gap-2 bg-amber-500/10 rounded-xl px-3 py-2">
                  <AlertTriangle size={12} className="text-amber-500" />
                  <span className="text-[10px] font-black text-amber-500">
                    {hourlyAnomaly.anomalies.length} Hora(s) Anómalas
                  </span>
                </div>
              </div>

              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.sessionsByHour} margin={{ top: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.15)" />
                    <XAxis dataKey="hour" fontSize={9} tickLine={false} axisLine={false} tick={{ fill: '#94A3B8', fontWeight: 700 }}
                      tickFormatter={(v) => `${v}h`} interval={3} />
                    <YAxis fontSize={9} tickLine={false} axisLine={false} tick={{ fill: '#94A3B8', fontWeight: 700 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={hourlyAnomaly.threshold} stroke="#F59E0B" strokeDasharray="6 3" strokeWidth={2} />
                    <ReferenceLine y={hourlyAnomaly.mean} stroke="#2DD4BF" strokeDasharray="6 3" strokeWidth={1.5} />
                    <Bar dataKey="count" name="Sesiones" radius={[4, 4, 0, 0]} barSize={14}>
                      {stats.sessionsByHour.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={entry.count > hourlyAnomaly.threshold ? '#F59E0B' : '#2DD4BF'}
                          opacity={entry.count === 0 ? 0.2 : 1}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {hourlyAnomaly.anomalies.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {hourlyAnomaly.anomalies.map((a, i) => (
                    <span key={i} className="bg-amber-500/15 text-amber-500 text-[10px] font-black px-2.5 py-1 rounded-lg">
                      ⚡ {a.hour}:00 — {a.count} sesiones
                    </span>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
              Datos insuficientes para detección de anomalías
            </div>
          )}
        </Section>

        {/* Channel Distribution */}
        <Section title="Distribución por Canal" icon={BarChart2}>
          <div className="space-y-3">
            {channelShare.map((c, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.fill }} />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 flex-1 truncate" title={c.name}>{c.name}</span>
                <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden max-w-[120px]">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${c.pct}%`, backgroundColor: c.fill, transition: 'width 0.6s ease' }}
                  />
                </div>
                <span className="text-xs font-black text-slate-700 dark:text-white w-12 text-right">{c.value.toLocaleString()}</span>
                <span className="text-[10px] font-black w-10 text-right" style={{ color: c.fill }}>{c.pct}%</span>
              </div>
            ))}
          </div>

          {/* Status breakdown */}
          {stats.statsByStatus.length > 0 && (
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Estados de Sesión</p>
              <div className="flex flex-wrap gap-2">
                {stats.statsByStatus.slice(0, 6).map((s, i) => (
                  <div key={i} className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-xl">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 max-w-[80px] truncate" title={s.status}>{s.status}</span>
                    <span className="text-[10px] font-black text-slate-700 dark:text-white">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Section>
      </div>

      {/* Row 4: Numeric Stats Table */}
      {numericSummary.length > 0 && (
        <Section title="Tabla de Estadísticas Numéricas" icon={Sigma}>
          <div className="flex items-center gap-2 mb-4 p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
            <Info size={13} className="text-blue-400 shrink-0" />
            <p className="text-xs text-blue-400 font-medium">
              Métricas calculadas sobre columnas numéricas detectadas automáticamente en el dataset.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700">
                  <th className="text-left py-3 px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest first:pl-0">Columna</th>
                  <th className="text-right py-3 px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mínimo</th>
                  <th className="text-right py-3 px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Máximo</th>
                  <th className="text-right py-3 px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Media</th>
                  <th className="text-right py-3 px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Suma Total</th>
                  <th className="text-right py-3 px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">CV%</th>
                </tr>
              </thead>
              <tbody>
                {numericSummary.map((row, i) => (
                  <tr key={i} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="py-3 pl-0 pr-3 font-bold text-slate-700 dark:text-white max-w-[160px] truncate" title={row.key}>
                      {row.key}
                    </td>
                    <td className="py-3 px-3 text-slate-500 dark:text-slate-400 text-right">{formatNum(row.min)}</td>
                    <td className="py-3 px-3 text-slate-500 dark:text-slate-400 text-right">{formatNum(row.max)}</td>
                    <td className="py-3 px-3 font-bold text-brand-turquoise text-right">{formatNum(row.mean)}</td>
                    <td className="py-3 px-3 text-slate-500 dark:text-slate-400 text-right">{formatNum(row.sum)}</td>
                    <td className="py-3 px-3 text-right">
                      <span className={cn(
                        'px-2 py-0.5 rounded-md font-black inline-block min-w-[50px]',
                        parseFloat(row.cv) > 50
                          ? 'bg-red-500/10 text-red-500'
                          : parseFloat(row.cv) > 25
                          ? 'bg-amber-500/10 text-amber-500'
                          : 'bg-emerald-500/10 text-emerald-500'
                      )}>
                        {row.cv}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* Row 5: Trend Line — Sesiones por Hora */}
      <Section title="Curva de Demanda Horaria" icon={TrendingUp}>
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.sessionsByHour} margin={{ top: 4, right: 16 }}>
              <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2DD4BF" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2DD4BF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.15)" />
              <XAxis dataKey="hour" fontSize={10} tickLine={false} axisLine={false}
                tick={{ fill: '#94A3B8', fontWeight: 700 }} tickFormatter={(v) => `${v}h`} interval={3} />
              <YAxis fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#94A3B8', fontWeight: 700 }} />
              <Tooltip content={<CustomTooltip />} />
              {hourlyAnomaly && (
                <ReferenceLine y={hourlyAnomaly.mean} stroke="#2DD4BF" strokeDasharray="6 3"
                  label={{ value: 'Media', fill: '#2DD4BF', fontSize: 10, fontWeight: 700 }} />
              )}
              <Line
                type="monotone"
                dataKey="count"
                name="Sesiones"
                stroke="#2DD4BF"
                strokeWidth={2.5}
                dot={{ fill: '#2DD4BF', r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#2DD4BF', strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Section>

    </div>
  );
}
