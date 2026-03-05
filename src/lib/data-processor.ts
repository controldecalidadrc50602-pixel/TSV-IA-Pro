import { parse, format, isValid } from 'date-fns';

export interface ProcessedRow {
  [key: string]: string | number;
  id: string; // Internal ID for React keys
}

export interface DataStats {
  totalSessions: number;
  uniqueUsers: number;
  dateRange: string;
  sessionsByHour: { hour: string; count: number }[];
  sessionsByChannel: { channel: string; count: number }[];
  numericStats: Record<string, { min: number; max: number; mean: number; sum: number }>;
  columnTotals: Record<string, number | string>;
}

// Helper to format seconds to HHh MMm SSs
export function formatDuration(seconds: number): string {
  if (isNaN(seconds)) return '';
  
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
  }
  return `${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
}

export function processData(headers: string[], rows: string[][]): { processedRows: ProcessedRow[], stats: DataStats, formattedHeaders: string[] } {
  const processedRows: ProcessedRow[] = [];
  
  // Indices for specific columns
  const dateIdx = headers.findIndex(h => h.toLowerCase().includes('fecha') || h.toLowerCase().includes('date'));
  const timeIdx = headers.findIndex(h => h.toLowerCase().includes('hora') || h.toLowerCase().includes('time') && !h.toLowerCase().includes('duración') && !h.toLowerCase().includes('espera') && !h.toLowerCase().includes('respuesta'));
  const userIdx = headers.findIndex(h => h.toLowerCase().includes('usuario') || h.toLowerCase().includes('user') || h.toLowerCase().includes('id_usuario'));
  const channelIdx = headers.findIndex(h => h.toLowerCase().includes('canal') || h.toLowerCase().includes('channel'));
  const closeTimeIdx = headers.findIndex(h => h.toLowerCase().includes('cierre') || h.toLowerCase().includes('close'));

  // Identify Duration Columns (Time vs Count Logic)
  const durationIndices = headers.map((h, i) => {
    const lower = h.toLowerCase();
    // Explicitly include 'total de conversación' and exclude count columns
    const isTime = (lower.includes('tiempo') || lower.includes('espera') || lower.includes('duración') || lower.includes('duration') || lower.includes('total de conversación'));
    const isCount = (lower.startsWith('cantidad') || lower.startsWith('total de mensajes') || lower.includes('transferencias'));
    
    // STRICT RULE: Date and Time columns are NOT duration columns
    const isDateOrTime = i === dateIdx || i === timeIdx || i === closeTimeIdx;

    return (isTime && !isCount && !isDateOrTime) ? i : -1;
  }).filter(i => i !== -1);

  // Identify Count/Numeric Columns for Totals
  const numericIndices = headers.map((h, i) => {
      const lower = h.toLowerCase();
      // Include duration columns here too to sum them up in seconds first
      // STRICT RULE: Date, Time, and ID columns are NOT numeric columns for summing
      const isDateOrTimeOrUser = i === dateIdx || i === timeIdx || i === userIdx || i === closeTimeIdx;
      
      const isCount = lower.startsWith('cantidad') || lower.startsWith('total') || lower.includes('transferencias');
      
      return (!isDateOrTimeOrUser && (durationIndices.includes(i) || isCount)) ? i : -1;
  }).filter(i => i !== -1);

  // Stats aggregators
  const users = new Set<string>();
  const dates: Date[] = [];
  const hoursMap = new Map<string, number>();
  const channelMap = new Map<string, number>();
  const numericValues: Record<string, number[]> = {};

  // Initialize hours map 00-23
  for (let i = 0; i < 24; i++) {
      hoursMap.set(String(i).padStart(2, '0'), 0);
  }

  rows.forEach((row, rowIndex) => {
    const rowObj: ProcessedRow = { id: `row-${rowIndex}` };
    
    headers.forEach((header, colIndex) => {
      let value = row[colIndex];
      let displayValue = value; // Value to show in table
      
      // Handle undefined/null/dash
      if (value === undefined || value === null || value === '-') {
        displayValue = '-'; // Show '-' in table
        value = '0'; // Use '0' for calculations
      } else {
        value = String(value).trim();
        displayValue = value;
      }

      // Date Formatting (DD/MM/YYYY)
      if (colIndex === dateIdx && value && value !== '0') {
        const date = new Date(value);
        if (isValid(date)) {
          displayValue = format(date, 'dd/MM/yyyy');
          dates.push(date);
        }
      }

      // Time Formatting (HH:mm) - Extract Hour for Stats
      // Logic: Try 'Hora Sesión' first, then 'Fecha/tiempo Cierre' if needed for stats
      let hourExtracted = false;
      
      if (colIndex === timeIdx && value && value !== '0') {
        // Try to parse HH:mm or HH
        let hour = '';
        if (value.includes(':')) {
           const parts = value.split(':');
           if (parts.length >= 2) {
             hour = parts[0].padStart(2, '0');
             const minute = parts[1].padStart(2, '0');
             displayValue = `${hour}:${minute}`;
           }
        } else if (!isNaN(Number(value)) && value.length <= 2) {
            // Just the hour number
            hour = value.padStart(2, '0');
            displayValue = `${hour}:00`;
        }

        if (hour && !isNaN(Number(hour))) {
            hoursMap.set(hour, (hoursMap.get(hour) || 0) + 1);
            hourExtracted = true;
        }
      }

      // Fallback for Hour Stats: Use Close Time if Time column didn't yield an hour
      // This is a bit tricky because we iterate columns. 
      // Instead, let's check closeTimeIdx if we haven't found an hour yet for this row?
      // Actually, simpler: just check closeTimeIdx independently if timeIdx didn't work.
      // But we are inside the loop. Let's just process closeTimeIdx for stats if timeIdx is missing or empty.
      
      if (colIndex === closeTimeIdx && value && value !== '0') {
          // If we haven't extracted hour from timeIdx (or timeIdx doesn't exist), try here
          // But we don't know if timeIdx exists/works yet.
          // Let's just collect hours from here if timeIdx is -1.
          if (timeIdx === -1) {
              let hour = '';
              if (value.includes(' ')) {
                  const parts = value.split(' ')[1]?.split(':');
                  if (parts && parts.length >= 1) hour = parts[0].padStart(2, '0');
              } else if (value.includes(':')) {
                   const parts = value.split(':');
                   if (parts.length >= 1) hour = parts[0].padStart(2, '0');
              }
              
              if (hour && !isNaN(Number(hour))) {
                  hoursMap.set(hour, (hoursMap.get(hour) || 0) + 1);
              }
          }
      }

      // Smart Time Conversion
      if (durationIndices.includes(colIndex)) {
        // Try to parse as number
        const numVal = parseFloat(value);
        if (!isNaN(numVal)) {
          rowObj[`${header}_RAW`] = numVal; // Store raw for calculations
          displayValue = formatDuration(numVal);
          
          // Add to numeric stats
          if (!numericValues[header]) numericValues[header] = [];
          numericValues[header].push(numVal);
        } else {
            displayValue = '-'; // Invalid number
        }
      } else if (numericIndices.includes(colIndex)) {
        // Other numeric columns (Counts)
        const numVal = parseFloat(value);
        if (!isNaN(numVal)) {
           if (!numericValues[header]) numericValues[header] = [];
           numericValues[header].push(numVal);
           // Format as integer if it's a count
           if (String(numVal).includes('.')) {
               displayValue = String(Math.round(numVal));
           }
        }
      }

      // Track Unique Users
      if (colIndex === userIdx && value && value !== '0') {
        users.add(value);
      }

      // Track Channels (Ignore empty or '-')
      if (colIndex === channelIdx && value && value !== '-' && value !== '0') {
        channelMap.set(value, (channelMap.get(value) || 0) + 1);
      }

      rowObj[header] = displayValue;
    });

    processedRows.push(rowObj);
  });

  // Calculate Stats
  const sortedDates = dates.sort((a, b) => a.getTime() - b.getTime());
  const dateRange = sortedDates.length > 0 
    ? `${format(sortedDates[0], 'dd/MM/yyyy')} - ${format(sortedDates[sortedDates.length - 1], 'dd/MM/yyyy')}`
    : 'N/A';

  const sessionsByHour = Array.from(hoursMap.entries())
    .map(([hour, count]) => ({ hour, count }))
    .sort((a, b) => a.hour.localeCompare(b.hour));

  const sessionsByChannel = Array.from(channelMap.entries())
    .map(([channel, count]) => ({ channel, count }))
    .sort((a, b) => b.count - a.count);

  const numericStats: Record<string, { min: number; max: number; mean: number; sum: number }> = {};
  const columnTotals: Record<string, number | string> = {};

  Object.entries(numericValues).forEach(([key, values]) => {
    if (values.length > 0) {
      const min = Math.min(...values);
      const max = Math.max(...values);
      const sum = values.reduce((a, b) => a + b, 0);
      const mean = sum / values.length;
      numericStats[key] = { min, max, mean, sum };
      
      // Check if this key corresponds to a duration column to format the total
      const isDuration = headers.some((h, i) => h === key && durationIndices.includes(i));
      if (isDuration) {
          columnTotals[key] = formatDuration(sum);
      } else {
          columnTotals[key] = Math.round(sum); // Integers for counts
      }
    }
  });

  return {
    processedRows,
    stats: {
      totalSessions: rows.length,
      uniqueUsers: users.size,
      dateRange,
      sessionsByHour,
      sessionsByChannel,
      numericStats,
      columnTotals
    },
    formattedHeaders: headers
  };
}

export function generateDataSummary(headers: string[], rows: string[][], stats: DataStats): string {
  const sampleRows = rows.slice(0, 3).map(r => r.join(' | ')).join('\n');
  
  let numericSummary = '';
  Object.entries(stats.numericStats).forEach(([key, stat]) => {
    numericSummary += `- ${key}: Min ${stat.min.toFixed(2)}, Max ${stat.max.toFixed(2)}, Avg ${stat.mean.toFixed(2)}, Sum ${stat.sum.toFixed(2)}\n`;
  });

  return `
Data Summary:
- Total Rows: ${stats.totalSessions}
- Columns: ${headers.join(', ')}
- Date Range: ${stats.dateRange}
- Unique Users: ${stats.uniqueUsers}

Top Channels:
${stats.sessionsByChannel.slice(0, 5).map(c => `- ${c.channel}: ${c.count}`).join('\n')}

Numeric Statistics:
${numericSummary}

Sample Data (First 3 rows):
${sampleRows}
  `.trim();
}
