import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { AlertTriangle, RefreshCw } from 'lucide-react';

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="min-h-screen w-full bg-slate-900 flex items-center justify-center p-6">
      <div className="bg-slate-800 p-8 rounded-3xl shadow-2xl max-w-xl w-full border border-red-500/20 text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle size={40} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-black text-white mb-2">Fallo Crítico Interceptado</h2>
        <p className="text-sm text-slate-400 mb-6">
          El escudo de seguridad ha prevenido el colapso de la aplicación. Se detectó un error estructural en la capa de renderizado.
        </p>
        
        <div className="bg-black/50 rounded-xl p-4 mb-8 text-left overflow-auto max-h-32 border border-slate-700">
          <p className="text-xs font-mono text-red-400 whitespace-pre-wrap">{error.message}</p>
        </div>

        <button
          onClick={resetErrorBoundary}
          className="flex items-center gap-2 px-8 py-3 bg-brand-turquoise text-white rounded-xl mx-auto font-bold shadow-lg shadow-brand-turquoise/20 hover:scale-105 transition-transform"
        >
          <RefreshCw size={18} />
          Reiniciar Sesión Segura
        </button>
      </div>
    </div>
  );
}

export function GlobalErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      {children}
    </ErrorBoundary>
  );
}
