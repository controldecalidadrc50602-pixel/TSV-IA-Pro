import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary';

// Registramos el Service Worker para habilitar PWA
registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(
  <GlobalErrorBoundary>
    <App />
  </GlobalErrorBoundary>
);
