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
  allCategoricalStats: { header: string; data: { label: string; count: number }[] }[];
  numericStats: Record<string, { 
    min: number; 
    max: number; 
    mean: number; 
    sum: number; 
    cv: number;
    anomalies: { rowIdx: number; value: number; severity: 'high' | 'medium' }[];
  }>;
  columnTotals: Record<string, number | string>;
  avgDuration?: string;
  totalDuration?: string;
  slaCompliance?: number;
  botSuccessRate?: number;
  efficiencyIndex?: number;
  peakHour?: { hour: string; count: number };
  totalTransfers: number;
  totalResponses: number;
  anomalies?: { column: string; row_index: number; value: number; severity: 'high' | 'medium' }[];
  forecast?: { hour: string; count: number }[];
  rootCauseAnalysis?: Record<string, string>;
  statsByStatus?: { status: string; count: number }[];
  detectedSchema: {
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
  // 0. Preliminary Header Cleaning (Blindaje contra archivos corruptos o mal formateados)
  const headers = headersRaw.map(h => {
    let clean = String(h || '').replace(/\n/g, ' ').trim();
    // Manual mapping for broken characters commonly found in CSVs
    clean = clean.replace(/Ã³/g, 'ó')
                 .replace(/Ã¡/g, 'á')
                 .replace(/Ã©/g, 'é')
                 .replace(/Ã­/g, 'í')
                 .replace(/Ãº/g, 'ú')
                 .replace(/Ã±/g, 'ñ')
                 .replace(/Ã /g, 'Á')
                 .replace(/Ã‰/g, 'É')
                 .replace(/Ã /g, 'Í')
                 .replace(/Ã“/g, 'Ó')
                 .replace(/Ãš/g, 'Ú')
                 .replace(/Ã‘/g, 'Ñ');

    // Eliminar repeticiones de puntuación excesiva como :::: o ;;;;
    clean = clean.replace(/[:;,\.]{2,}/g, '');
    // Si la cabecera quedó vacía tras la limpieza, darle un nombre genérico
    return clean || 'Columna_Sin_Nombre';
  });

  const processedRows: ProcessedRow[] = [];
  
  // 1. Schema Discovery Phase
  const columnProfiles = headers.map((header, index) => {
    const normHeader = normalize(header);
    const sampleValues = rows.slice(0, 50).map(r => String(r[index] || '')).filter(v => v && v !== '-' && v.trim() !== '');
    const uniqueValues = new Set(sampleValues);
    
    // Check for Date
    const isDate = sampleValues.length > 0 && sampleValues.every(v => isValid(new Date(v)) && (v.includes('/') || v.includes('-')));
    
    // Check for Numeric
    const isNumeric = sampleValues.length > 0 && sampleValues.every(v => {
        const n = v.replace(/[,%$]/g, '');
        return !isNaN(parseFloat(n)) && isFinite(Number(n));
    }) && !sampleValues.every(v => v.includes(':'));
    
    const looksLikeId = 
        normHeader.includes('id') || 
        normHeader.includes('uuid') ||
        normHeader.includes('hash') ||
        normHeader.includes('token') ||
        (isNumeric && (
            normHeader.includes('num') || 
            normHeader.includes('folio') || 
            normHeader.includes('contacto') ||
            normHeader.includes('sesion')
        )) ||
        sampleValues.some(v => v.length > 30) || 
        uniqueValues.size === sampleValues.length && sampleValues.length > 10;
    
    // Check for Time (HH:mm)
    const isTime = sampleValues.length > 0 && sampleValues.every(v => v.includes(':') && v.split(':').length >= 2);
    
    // Category Score: Ignorar si solo hay 1 valor único o demasiados valores únicos (ID)
    const categoryScore = (uniqueValues.size > 1 && uniqueValues.size < 35) 
        ? (1 - (uniqueValues.size / Math.max(1, sampleValues.length))) 
        : 0;
    
    return {
      index,
      header,
      normHeader,
      isDate,
      isNumeric: isNumeric && !looksLikeId,
      isTime,
      uniqueCount: uniqueValues.size,
      categoryScore
    };
  });

  // Assign roles based on discovery and keywords
  const dateIdx = columnProfiles.find(p => p.isDate || p.normHeader.includes('fecha') || p.normHeader.includes('date'))?.index ?? -1;
  const timeIdx = columnProfiles.find(p => (p.isTime && !p.normHeader.includes('duracion')) || p.normHeader.includes('hora') || p.normHeader.includes('time'))?.index ?? -1;
  
  const categoricalProfiles = columnProfiles
    .filter(p => p.index !== dateIdx && p.index !== timeIdx && !p.isNumeric)
    // Filtramos IDs: Si todos o casi todos los valores son únicos, no es categoría
    .filter(p => p.uniqueCount === 1 || p.uniqueCount < Math.min(30, rows.length * 0.5))
    .sort((a, b) => b.categoryScore - a.categoryScore);

  const numericProfiles = columnProfiles.filter(p => p.isNumeric && !p.isDate && !p.isTime);
  
  // Identify duration columns specifically
  const durationIdx = columnProfiles.find(p => 
    p.normHeader.includes('duracion') || 
    p.normHeader.includes('duration') || 
    p.normHeader.includes('aht') || 
    p.normHeader.includes('talking') ||
    p.normHeader.includes('tiempo') ||
    p.normHeader.includes('minutos') ||
    p.normHeader.includes('segundos') ||
    p.normHeader.includes('handling') ||
    p.normHeader.includes('espera')
  )?.index ?? -1;

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

      // Numeric Mapping & Normalization
      const lowerHeader = header.toLowerCase();
      const isTimeCol = lowerHeader.includes('total de conversación') || 
                        lowerHeader.includes('espera en cola') || 
                        lowerHeader.includes('espera agente') || 
                        lowerHeader.includes('tiempo medio de respuesta') ||
                        columnProfiles[colIndex].normHeader.includes('duracion') || 
                        columnProfiles[colIndex].normHeader.includes('tiempo');

      if (columnProfiles[colIndex].isNumeric || isTimeCol) {
        let num = 0;
        if (String(value).includes(':')) {
           num = parseTimeToSeconds(String(value));
        } else {
           num = parseFloat(String(value).replace(/[,%$]/g, ''));
        }
        
        if (!isNaN(num)) {
          if (!numericValues[header]) numericValues[header] = [];
          numericValues[header].push(num);
        }
      }

      if (isTimeCol) {
          if (!value || value === '-' || String(value).trim() === '') {
              displayValue = '-';
          } else {
              const num = String(value).includes(':') ? parseTimeToSeconds(String(value)) : parseFloat(String(value));
              displayValue = isNaN(num) ? '-' : formatDuration(num);
          }
      } else if (!value || value === '-' || String(value).trim() === '') {
          displayValue = '-';
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
  
  const allCategoricalStats = categoricalProfiles.map((prof, i) => {
    return {
      header: prof.header,
      data: Array.from(categoricalMaps[i].entries())
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 15)
    };
  });

  const numericStats: DataStats['numericStats'] = {};
  const columnTotals: Record<string, number | string> = {};

  Object.entries(numericValues).forEach(([key, values]) => {
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const cv = mean > 0 ? (stdDev / mean) * 100 : 0;

    const colAnomalies: { rowIdx: number; value: number; severity: 'high' | 'medium' }[] = [];
    if (stdDev > 0) {
      values.forEach((v, i) => {
        const z = Math.abs((v - mean) / stdDev);
        if (z > 3) colAnomalies.push({ rowIdx: i, value: v, severity: 'high' });
        else if (z > 2) colAnomalies.push({ rowIdx: i, value: v, severity: 'medium' });
      });
    }

    numericStats[key] = {
      min: values.length > 0 ? Math.min(...values) : 0,
      max: values.length > 0 ? Math.max(...values) : 0,
      sum,
      mean: values.length > 0 ? mean : 0,
      cv,
      anomalies: colAnomalies
    };
    
    const prof = columnProfiles.find(p => p.header === key);
    const lowerKey = key.toLowerCase();
    if (prof?.normHeader.includes('duracion') || prof?.normHeader.includes('tiempo') || 
        lowerKey.includes('total de conversación') || lowerKey.includes('espera en cola') || 
        lowerKey.includes('espera agente') || lowerKey.includes('tiempo medio de respuesta')) {
      columnTotals[key] = formatDuration(sum);
    } else {
      columnTotals[key] = Math.round(sum);
    }
  });

  // ─── Status & Specific Metric Extraction ──────────────────────────────────
  const statusIdx = columnProfiles.find(p => p.normHeader.includes('estado') || p.normHeader.includes('status'))?.index ?? -1;
  const inProgressIdx = columnProfiles.find(p => p.normHeader.includes('en curso') || p.normHeader.includes('progreso'))?.index ?? -1;
  const closedIdx = columnProfiles.find(p => p.normHeader.includes('cerrada') || p.normHeader.includes('finalizada'))?.index ?? -1;

  const statsByStatus: { status: string; count: number }[] = [];
  if (statusIdx !== -1) {
    const statusMap = categoricalMaps[categoricalProfiles.findIndex(p => p.index === statusIdx)];
    if (statusMap) {
      statusMap.forEach((count, status) => statsByStatus.push({ status, count }));
    }
  } else if (inProgressIdx !== -1 || closedIdx !== -1) {
    // If separate columns for In Progress / Closed (Numeric columns usually)
    if (inProgressIdx !== -1) {
      const sum = numericStats[headers[inProgressIdx]]?.sum || 0;
      statsByStatus.push({ status: 'En curso', count: sum });
    }
    if (closedIdx !== -1) {
      const sum = numericStats[headers[closedIdx]]?.sum || 0;
      statsByStatus.push({ status: 'Cerradas', count: sum });
    }
  }

  // Final Bot Rate logic
  const botIdx = columnProfiles.find(p => p.normHeader.includes('bot') || p.normHeader.includes('autoconsulta'))?.index ?? -1;
  const botSuccessRate = botIdx !== -1 ? (numericStats[headers[botIdx]]?.mean || 0) : 0;

  // Metrics
  const slaIdx = columnProfiles.find(p => p.normHeader.includes('sla') || p.normHeader.includes('cumplimiento'))?.index ?? -1;
  const slaCompliance = slaIdx !== -1 ? (numericStats[headers[slaIdx]]?.mean || 0) : 0;

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
      allCategoricalStats,
      numericStats,
      columnTotals,
      slaCompliance,
      botSuccessRate,
      efficiencyIndex,
      totalTransfers,
      totalResponses,
      anomalies,
      statsByStatus,
      forecast: generateForecast(sessionsByHour),
      rootCauseAnalysis: analyzeRootCauses(anomalies, rows, categoricalProfiles, headers),
      peakHour: sessionsByHour.length > 0
        ? sessionsByHour.reduce((p, c) => (p.count > c.count) ? p : c, sessionsByHour[0])
        : { hour: '00', count: 0 },
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
  const categoricalSummary = stats.allCategoricalStats.map(c => 
    `* ${c.header}: Top 3: ${c.data.slice(0, 3).map(d => `${d.label} (${d.count})`).join(', ')}`
  ).join('\n');

  const anomalySummary = Object.entries(stats.numericStats)
    .filter(([_, s]) => s.anomalies.length > 0)
    .map(([header, s]) => `* ${header}: ${s.anomalies.length} valores fuera de rango (Z > 2.5).`)
    .join('\n');

  const rootCauseBrief = stats.rootCauseAnalysis 
    ? `\nAnálisis de Causa Raíz Probable:\n${Object.entries(stats.rootCauseAnalysis).map(([k, v]) => `- ${k}: Relacionado con ${v}`).join('\n')}`
    : '';

  return `
Análisis Forense de Datos:
- Total Registros: ${stats.totalSessions}
- Usuarios Únicos: ${stats.uniqueUsers}
- Rango Temporal: ${stats.dateRange}
- Esquema Detectado:
  * Categorías: ${stats.detectedSchema?.categorical.join(', ')}
  * Métricas: ${stats.detectedSchema?.numeric.join(', ')}

Distribución de Categorías:
${categoricalSummary}

Detección de Anomalías:
${anomalySummary || 'No se detectaron valores atípicos significativos en métricas.'}
${rootCauseBrief}

Estadísticas de Rendimiento:
- SLA Promedio: ${stats.slaCompliance?.toFixed(1)}%
- Éxito Automatización: ${stats.botSuccessRate?.toFixed(1)}%
- Eficiencia Operativa: ${stats.efficiencyIndex?.toFixed(1)}%
- AHT Promedio: ${stats.avgDuration || 'N/A'}
- Total Transferencias: ${stats.totalTransfers}
- Respuestas Generadas: ${stats.totalResponses}
  `.trim();
}

/**
 * Generates a simple forecast based on linear regression of historical session counts
 */
function generateForecast(sessionsByHour: { hour: string; count: number }[]) {
  const data = sessionsByHour.map((s, i) => ({ x: i, y: s.count }));
  if (data.length < 2) return [];

  const n = data.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  data.forEach(p => {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumXX += p.x * p.x;
  });

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Forecast next 6 hours
  const lastHourStr = sessionsByHour[sessionsByHour.length - 1]?.hour || "0";
  const lastHour = parseInt(lastHourStr);
  
  return Array.from({ length: 6 }).map((_, i) => {
    const nextIdx = n + i;
    const nextHour = (lastHour + i + 1) % 24;
    return {
      hour: String(nextHour).padStart(2, '0'),
      count: Math.max(0, Math.round(slope * nextIdx + intercept))
    };
  });
}

/**
 * Identifies correlations between anomalies and categorical values
 */
function analyzeRootCauses(anomalies: any[], rows: string[][], categoricalProfiles: any[], headers: string[]) {
  if (!anomalies || !anomalies.length || !categoricalProfiles.length) return {};
  
  const causeAnalysis: Record<string, string> = {};
  const anomalyByCol = new Map<string, number[]>();
  
  anomalies.forEach(a => {
    if (!anomalyByCol.has(a.column)) anomalyByCol.set(a.column, []);
    anomalyByCol.get(a.column)!.push(a.row_index);
  });

  anomalyByCol.forEach((rowIndices, colName) => {
    // For each column with anomalies, find which category value is most common in those rows
    categoricalProfiles.forEach(prof => {
      const counts = new Map<string, number>();
      rowIndices.forEach(idx => {
        const val = rows[idx]?.[prof.index];
        if (val) counts.set(val, (counts.get(val) || 0) + 1);
      });

      // Find the winner
      let winner = '';
      let maxCount = 0;
      counts.forEach((count, val) => {
        if (count > maxCount) {
          maxCount = count;
          winner = val;
        }
      });

      if (winner && maxCount > rowIndices.length * 0.3) { // Reduced threshold to 30% for better detection
        causeAnalysis[colName] = `${headers[prof.index]}: ${winner}`;
      }
    });
  });

  return causeAnalysis;
}
