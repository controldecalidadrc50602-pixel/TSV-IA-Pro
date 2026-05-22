import React from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend
} from 'recharts';
import { SafeChartWrapper as ResponsiveContainer } from './SafeChartWrapper';
import { WidgetErrorBoundary } from './WidgetErrorBoundary';

export interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'area';
  title: string;
  data: Record<string, any>[];
  dataKey: string;
  nameKey: string;
  color?: string;
}

interface ChartRendererProps {
  config: ChartConfig;
}

const COLORS = ['#2DD4BF', '#0D9488', '#14B8A6', '#6366F1', '#8B5CF6', '#F59E0B', '#EF4444', '#10B981'];

const tooltipStyle = {
  borderRadius: '12px',
  border: 'none',
  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
  fontSize: '12px',
  fontWeight: 'bold',
  backgroundColor: '#1E293B',
  color: '#F1F5F9',
};

export function ChartRenderer({ config }: ChartRendererProps) {
  const { type, title, data, dataKey, nameKey, color = '#2DD4BF' } = config;

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B" />
            <XAxis dataKey={nameKey} fontSize={10} fontWeight={700} tickLine={false} axisLine={false} tick={{ fill: '#94A3B8' }} />
            <YAxis fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#94A3B8' }} />
            <Tooltip isAnimationActive={false} contentStyle={tooltipStyle} itemStyle={{ color: '#F1F5F9' }} />
            <Bar isAnimationActive={false} dataKey={dataKey} fill={color} radius={[6, 6, 0, 0]} barSize={32} />
          </BarChart>
        );

      case 'line':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B" />
            <XAxis dataKey={nameKey} fontSize={10} fontWeight={700} tickLine={false} axisLine={false} tick={{ fill: '#94A3B8' }} />
            <YAxis fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#94A3B8' }} />
            <Tooltip isAnimationActive={false} contentStyle={tooltipStyle} itemStyle={{ color: '#F1F5F9' }} />
            <Line isAnimationActive={false} type="monotone" dataKey={dataKey} stroke={color} strokeWidth={3} dot={{ fill: color, r: 4 }} />
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B" />
            <XAxis dataKey={nameKey} fontSize={10} fontWeight={700} tickLine={false} axisLine={false} tick={{ fill: '#94A3B8' }} />
            <YAxis fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#94A3B8' }} />
            <Tooltip isAnimationActive={false} contentStyle={tooltipStyle} itemStyle={{ color: '#F1F5F9' }} />
            <Area isAnimationActive={false} type="monotone" dataKey={dataKey} stroke={color} strokeWidth={3} fill="url(#colorArea)" />
          </AreaChart>
        );

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={4}
              dataKey={dataKey}
              nameKey={nameKey}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: '#F1F5F9' }} />
            <Legend
              formatter={(value) => <span style={{ color: '#94A3B8', fontSize: '11px', fontWeight: 700 }}>{value}</span>}
            />
          </PieChart>
        );

      default:
        return null;
    }
  };

  return (
    <WidgetErrorBoundary>
      <div className="mt-3 bg-slate-800/60 rounded-2xl p-4 border border-slate-700/50">
        {title && (
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{title}</p>
        )}
        <div className="h-[200px] w-full min-w-[10px] min-h-[10px]">
          <ResponsiveContainer key={`chart-${title}-${data?.length || 0}`} width="100%" height="100%">
            {renderChart() as React.ReactElement}
          </ResponsiveContainer>
        </div>
      </div>
    </WidgetErrorBoundary>
  );
}
