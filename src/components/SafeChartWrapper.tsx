import React, { useState, useEffect } from 'react';
import { ResponsiveContainer } from 'recharts';

export function SafeChartWrapper({ children, ...props }: any) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Retraso de montaje para evadir colisiones entre el Virtual DOM y el ResizeObserver de Recharts
    const timer = requestAnimationFrame(() => setIsReady(true));
    return () => {
      cancelAnimationFrame(timer);
    };
  }, []);

  if (!isReady) {
    return <div className="w-full h-full min-h-[50px] animate-pulse bg-slate-800/10 rounded-2xl" />;
  }

  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1} {...props}>
      {children}
    </ResponsiveContainer>
  );
}
