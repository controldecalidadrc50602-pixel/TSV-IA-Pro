import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { AlertCircle } from 'lucide-react';

function WidgetFallback({ error }: { error: Error }) {
  return (
    <div className="w-full h-full min-h-[150px] bg-red-500/5 border border-red-500/20 rounded-2xl flex flex-col items-center justify-center p-4 text-center">
      <AlertCircle size={24} className="text-red-500 mb-2 opacity-50" />
      <span className="text-xs font-bold text-red-500/80">Widget Desconectado</span>
      <span className="text-[10px] text-red-400/60 mt-1 max-w-[80%] truncate" title={error.message}>
        {error.message}
      </span>
    </div>
  );
}

export function WidgetErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary FallbackComponent={WidgetFallback}>
      {children}
    </ErrorBoundary>
  );
}
