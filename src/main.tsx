import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary';

// ═══════════════════════════════════════════════════════════════════════════════
// PARCHE DEFENSIVO: Protege contra errores "removeChild" de React 19
// 
// React 19 usa un algoritmo de reconciliación agresivo. Cuando librerías como
// Recharts o Motion manipulan el DOM directamente (ResizeObserver, portales),
// puede ocurrir que React intente remover un nodo que ya fue movido/eliminado
// por la librería externa. Este parche convierte ese error fatal en un warning.
// 
// Ref: https://github.com/facebook/react/issues/11538
// ═══════════════════════════════════════════════════════════════════════════════
const originalRemoveChild = Node.prototype.removeChild;
Node.prototype.removeChild = function<T extends Node>(child: T): T {
  if (child.parentNode !== this) {
    console.warn(
      '[DOM Safety] Prevented removeChild on non-child node. This is typically caused by a React/third-party library race condition and is safely ignored.'
    );
    return child;
  }
  return originalRemoveChild.call(this, child) as T;
};

const originalInsertBefore = Node.prototype.insertBefore;
Node.prototype.insertBefore = function<T extends Node>(newNode: T, referenceNode: Node | null): T {
  if (referenceNode && referenceNode.parentNode !== this) {
    console.warn(
      '[DOM Safety] Prevented insertBefore with invalid reference node. Safely ignored.'
    );
    return newNode;
  }
  return originalInsertBefore.call(this, newNode, referenceNode) as T;
};

// Registramos el Service Worker para habilitar PWA
registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(
  <GlobalErrorBoundary>
    <App />
  </GlobalErrorBoundary>
);
