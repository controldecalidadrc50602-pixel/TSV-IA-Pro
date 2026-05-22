import React, { useState, useEffect } from 'react';
import { ResponsiveContainer } from 'recharts';

export function SafeChartWrapper({ children, ...props }: any) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Un pequeño setTimeout asegura que el contenedor padre del DOM ya tiene dimensiones calculadas
    // Evita el error "The width(-1) and height(-1) of chart should be greater than 0"
    const timer = setTimeout(() => setIsReady(true), 50);
    return () => clearTimeout(timer);
  }, []);

  if (!isReady) {
    return <div className="w-full h-full min-h-[100px] animate-pulse bg-slate-800/5 dark:bg-slate-800/20 rounded-2xl" />;
  }

  // Envolver en un div con position relative previene el error "Failed to execute 'insertBefore' on 'Node'"
  // y usar 99% en width/height previene bucles infinitos en el ResizeObserver de Recharts
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', minHeight: '1px', minWidth: '1px' }}>
      <ResponsiveContainer width="99%" height="99%" minWidth={1} minHeight={1} {...props}>
        {children}
      </ResponsiveContainer>
    </div>
  );
}
