import { parse, format, isValid } from 'date-fns';

export interface ProcessedRow {
  [key: string]: string | number;
  id: string; 
}

export interface DataStats {
  totalSessions: number;
  uniqueUsers: number;
  dateRange: string;
  sessionsByHour: { hour: string; count: number }[];
  sessionsByChannel: { channel: string; count: number }[];
  numericStats: Record<string, { min: number; max: number; mean: number; sum: number; cv: number }>;
  columnTotals: Record<string, number | string>;
  avgDuration?: string;
  totalDuration?: string;
  slaCompliance?: number;
  botSuccessRate?: number;
  efficiencyIndex?: number;
  peakHour?: { hour: string; count: number };
  statsByTipificacion: { category: string; count: number }[];
  statsByCola: { cola: string; count: number }[];
  statsByStatus: { status: string; count: number }[];
  totalTransfers: number;
  totalResponses: number;
  anomalies?: { column: string; row_index: number; value: number; severity: 'high' | 'medium' }[];
  // Metadata for schema-agnostic UI
  detectedSchema?: {
    categorical: string[];
    numeric: string[];
    temporal?: string;
  };
}

export function parseTimeToSeconds(value: string): number {
  if (!value || value === '-') return 0;
  value = String(value).trim();
  
  if (value.includes(':')) {
    const parts = value.split(':').map(Number);
    if (parts.length === 3) return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
    if (parts.length === 2) return (parts[0] * 60) + parts[1];
  }
  
  if (value.includes('h') || value.includes('m') || value.includes('s')) {
      const h = parseInt(value.match(/(\d+)h/)?.[1] || '0');
      const m = parseInt(value.match(/(\d+)m/)?.[1] || '0');
      const s = parseInt(value.match(/(\d+)s/)?.[1] || '0');
      return (h * 3600) + (m * 60) + s;
  }

  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
}

export function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds <= 0) return '-';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
  if (m > 0 || s > 0) return `${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
  return '00s';
}

const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export function processData(headersRaw: string[], rows: string[][]): { processedRows: ProcessedRow[], stats: DataStats, formattedHeaders: string[] } {
  const headers = headersRaw.map(h => h.trim());
  const processedRows: ProcessedRow[] = [];
  
  // 1. Schema Discovery Phase
  const columnProfiles = headers.map((header, idx) => {
    const sampleValues = rows.slice(0, 50).map(r => r[idx]).filter(v => v && v !== '-');
    const uniqueValues = new Set(sampleValues);
    
    // Check for Date
    const isDate = sampleValues.every(v => isValid(new Date(v)) && v.includes('/') || v.includes('-'));
    // Check for Numeric
    const isNumeric = sampleValues.length > 0 && sampleValues.every(v => {
        const n = v.replace(/[,%]/g, '');
        return !isNaN(parseFloat(n)) && isFinite(Number(n));
    });
    
    // Check for ID-like column (numbers that shouldn't be averaged)
    const looksLikeId = isNumeric && (
        normalize(header).includes('id') || 
        normalize(header).includes('num') || 
        normalize(header).includes('folio') || 
        normalize(header).includes('contacto') ||
        normalize(header).includes('sesion') ||
        sampleValues.some(v => v.length > 10) // Large numbers are usually IDs
    );
    
    // Check for Time (HH:mm)
    const isTime = sampleValues.every(v => v.includes(':') && v.split(':').length >= 2);
    
    return {
      index: idx,
      header,
      normHeader: normalize(header),
      isDate,
      isNumeric: isNumeric && !looksLikeId, // Exclude IDs from numeric processing
      isTime,
      uniqueCount: uniqueValues.size,
      categoryScore: uniqueValues.size > 0 && uniqueValues.size < 25 ? (1 - (uniqueValues.size / Math.max(1, sampleValues.length))) : 0
    };
  });

  // Assign roles based on discovery and keywords
  const dateIdx = columnProfiles.find(p => p.isDate || p.normHeader.includes('fecha') || p.normHeader.includes('date'))?.index ?? -1;
  const timeIdx = columnProfiles.find(p => (p.isTime && !p.normHeader.includes('duracion')) || p.normHeader.includes('hora') || p.normHeader.includes('time'))?.index ?? -1;
  
  const categoricalProfiles = columnProfiles
    .filter(p => p.index !== dateIdx && p.index !== timeIdx)
    .sort((a, b) => b.categoryScore - a.categoryScore)
    .slice(0, 5);

  const numericProfiles = columnProfiles.filter(p => p.isNumeric && !p.isDate && !p.isTime);

  // Stats aggregators
  const hoursMap = new Map<string, number>();
  for (let i = 0; i < 24; i++) hoursMap.set(String(i).padStart(2, '0'), 0);
  
  const categoricalMaps = categoricalProfiles.map(() => new Map<string, number>());
  const numericValues: Record<string, number[]> = {};
  const dates: Date[] = [];

  rows.forEach((row, rowIndex) => {
    const rowObj: ProcessedRow = { id: `row-${rowIndex}` };
    
    headers.forEach((header, colIndex) => {
      let value = row[colIndex];
      let displayValue = value || '-';

      // Date Processing
      if (colIndex === dateIdx && value) {
        const d = new Date(value);
        if (isValid(d)) {
          dates.push(d);
          displayValue = format(d, 'dd/MM/yyyy');
        }
      }

      // Time/Hour Processing
      if (colIndex === timeIdx && value) {
        let hour = '';
        if (value.includes(':')) hour = value.split(':')[0].padStart(2, '0');
        else if (!isNaN(Number(value)) && value.length <= 2) hour = value.padStart(2, '0');
        
        if (hour && hoursMap.has(hour)) {
          hoursMap.set(hour, (hoursMap.get(hour) || 0) + 1);
        }
      }

      // Categorical Mapping
      const catIdx = categoricalProfiles.findIndex(p => p.index === colIndex);
      if (catIdx !== -1 && value && value !== '-') {
        categoricalMaps[catIdx].set(value, (categoricalMaps[catIdx].get(value) || 0) + 1);
      }

      // Numeric Mapping
      if (columnProfiles[colIndex].isNumeric) {
        const num = parseFloat(String(value).replace(/[,%]/g, ''));
        if (!isNaN(num)) {
          if (!numericValues[header]) numericValues[header] = [];
          numericValues[header].push(num);
        }
      }

      rowObj[header] = displayValue;
    });
    processedRows.push(rowObj);
  });

  // Compile Final Stats
  const sortedDates = dates.sort((a, b) => a.getTime() - b.getTime());
  const dateRange = sortedDates.length > 0 
    ? `${format(sortedDates[0], 'dd/MM/yyyy')} - ${format(sortedDates[sortedDates.length - 1], 'dd/MM/yyyy')}`
    : 'Rango no detectado';

  const sessionsByHour = Array.from(hoursMap.entries()).map(([hour, count]) => ({ hour, count }));
  
  const categoricalStats = categoricalMaps.map((map, i) => {
    return Array.from(map.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
  });

  const numericStats: Record<string, { min: number; max: number; mean: number; sum: number }> = {};
  const columnTotals: Record<string, number | string> = {};

  Object.entries(numericValues).forEach(([key, values]) => {
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const cv = mean > 0 ? (stdDev / mean) * 100 : 0;

    numericStats[key] = { min: Math.min(...values), max: Math.max(...values), sum, mean, cv };
    
    const prof = columnProfiles.find(p => p.header === key);
    if (prof?.normHeader.includes('duracion') || prof?.normHeader.includes('tiempo')) {
      columnTotals[key] = formatDuration(sum);
    } else {
      columnTotals[key] = Math.round(sum);
    }
  });

  // Metrics (Schema-Agnostic approximations)
  const slaIdx = columnProfiles.find(p => p.normHeader.includes('sla') || p.normHeader.includes('cumplimiento'))?.index ?? -1;
  const slaCompliance = slaIdx !== -1 ? (numericStats[headers[slaIdx]]?.mean || 0) : 0; 
  
  const botIdx = columnProfiles.find(p => p.normHeader.includes('bot') || p.normHeader.includes('autoconsulta'))?.index ?? -1;
  const botSuccessRate = botIdx !== -1 ? (numericStats[headers[botIdx]]?.mean || 0) : 0;

  // Efficiency Index (Talk Time / Total Time approximation)
  const talkIdx = columnProfiles.find(p => p.normHeader.includes('conversacion') || p.normHeader.includes('habla') || p.normHeader.includes('talk'))?.index ?? -1;
  const totalTimeIdx = columnProfiles.find(p => p.normHeader.includes('duracion total') || p.normHeader.includes('total time'))?.index ?? -1;
  
  let efficiencyIndex = 0;
  if (talkIdx !== -1 && totalTimeIdx !== -1) {
      const talkSum = numericStats[headers[talkIdx]]?.sum || 0;
      const totalSum = numericStats[headers[totalTimeIdx]]?.sum || 0;
      efficiencyIndex = totalSum > 0 ? (talkSum / totalSum) * 100 : 0;
  } else if (slaIdx !== -1) {
      efficiencyIndex = slaCompliance * 0.9; // Proxy if no duration data
  }

  // Transfer and Response counts (Strict detection)
  const transferIdx = columnProfiles.find(p => p.normHeader.includes('transf') || p.normHeader.includes('desvio'))?.index ?? -1;
  const totalTransfers = transferIdx !== -1 ? (numericStats[headers[transferIdx]]?.sum || 0) : 0;

  const responseIdx = columnProfiles.find(p => p.normHeader.includes('respuesta') || p.normHeader.includes('mensaje') || p.normHeader.includes('response'))?.index ?? -1;
  const totalResponses = responseIdx !== -1 ? (numericStats[headers[responseIdx]]?.sum || 0) : 0;

  const userIdx = columnProfiles.find(p => p.normHeader.includes('user') || p.normHeader.includes('usuario') || p.normHeader.includes('cliente') || (p.isId && p.normHeader.includes('id')))?.index ?? 0;

  // ─── Anomaly Detection Engine ──────────────────────────────────────────────
  const numericalCols = columnProfiles.filter(p => p.isNumeric);
  const anomalies: { column: string; row_index: number; value: number; severity: 'high' | 'medium' }[] = [];

  numericalCols.forEach(col => {
    const values = rows.map(r => Number(r[col.index])).filter(v => !isNaN(v));
    if (values.length < 5) return;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(values.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / values.length);

    if (stdDev === 0) return;

    rows.forEach((row, idx) => {
      const val = Number(row[col.index]);
      const zScore = Math.abs((val - mean) / stdDev);
      
      if (zScore > 3) {
        anomalies.push({ column: col.header, row_index: idx, value: val, severity: 'high' });
      } else if (zScore > 2) {
        anomalies.push({ column: col.header, row_index: idx, value: val, severity: 'medium' });
      }
    });
  });

  // ─── Data Auto-Sanitization ───────────────────────────────────────────────
  const sanitizedRows = rows.map(row => {
    const newRow = [...row];
    newRow.forEach((val, i) => {
      let sVal = String(val).trim();
      if (sVal.startsWith('$') || sVal.includes(',')) {
        sVal = sVal.replace(/[$,]/g, '');
        if (!isNaN(Number(sVal))) newRow[i] = sVal;
      }
    });
    return newRow;
  });

  return {
    processedRows,
    stats: {
      totalSessions: rows.length,
      uniqueUsers: new Set(rows.map(r => r[userIdx])).size,
      dateRange,
      sessionsByHour,
      sessionsByChannel: categoricalStats[0]?.map(s => ({ channel: s.label, count: s.count })) || [],
      statsByTipificacion: categoricalStats[1]?.map(s => ({ category: s.label, count: s.count })) || [],
      statsByCola: categoricalStats[2]?.map(s => ({ cola: s.label, count: s.count })) || [],
      statsByStatus: categoricalStats[3]?.map(s => ({ status: s.label, count: s.count })) || [],
      numericStats,
      columnTotals,
      slaCompliance,
      botSuccessRate,
      efficiencyIndex,
      totalTransfers,
      totalResponses,
      anomalies,
      peakHour: sessionsByHour.reduce((p, c) => (p.count > c.count) ? p : c, sessionsByHour[0]),
      detectedSchema: {
        categorical: categoricalProfiles.map(p => p.header),
        numeric: numericProfiles.map(p => p.header),
        temporal: dateIdx !== -1 ? headers[dateIdx] : undefined
      }
    },
    formattedHeaders: headers
  };
}

export function generateDataSummary(headers: string[], rows: string[][], stats: DataStats): string {
  return `
Análisis Forense de Datos:
- Total Registros: ${stats.totalSessions}
- Rango: ${stats.dateRange}
- Esquema Detectado:
  * Categorías principales: ${stats.detectedSchema?.categorical.join(', ')}
  * Métricas clave: ${stats.detectedSchema?.numeric.join(', ')}

Distribución Principal (${stats.detectedSchema?.categorical[0] || 'N/A'}):
${stats.sessionsByChannel.slice(0, 5).map(c => `- ${c.channel}: ${c.count}`).join('\n')}

Estadísticas de Rendimiento:
- SLA Promedio: ${stats.slaCompliance?.toFixed(1)}%
- Éxito Automatización: ${stats.botSuccessRate?.toFixed(1)}%
  `.trim();
}
