import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Se exporta una bandera para que el resto de la app sepa si estamos en modo Cloud o Local
export const isCloudEnabled = Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl !== 'your_supabase_project_url');

// Solo creamos el cliente si las credenciales son válidas para evitar errores de ejecución
export const supabase = isCloudEnabled 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : (null as any); 

if (!isCloudEnabled) {
  console.log("TSV-IA Pro: Operando en Modo Local (Auth desactivado). Configura las variables VITE_SUPABASE_* para activar Modo Cloud.");
}
