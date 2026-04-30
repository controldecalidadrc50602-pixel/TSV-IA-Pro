import { supabase, isCloudEnabled } from './supabase';
import { openDB } from 'idb';
import { DataStats } from './data-processor';

// Local DB Setup (Fallback)
const DB_NAME = 'tsv-viewer-db';
const STORE_NAME = 'files';
const SHARE_STORE = 'shares';

async function initLocalDB() {
  return openDB(DB_NAME, 2, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('by-date', 'date');
      }
      if (oldVersion < 2) {
        db.createObjectStore(SHARE_STORE, { keyPath: 'id' });
      }
    },
  });
}

export async function saveFile(name: string, headers: string[], data: any[][]) {
  if (isCloudEnabled) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No authenticated user");

    const { data: savedReport, error } = await supabase
      .from('reports')
      .insert([{
        name,
        headers,
        data,
        user_id: user.id
      }])
      .select()
      .single();

    if (error) throw error;
    return savedReport.id;
  } else {
    const db = await initLocalDB();
    const id = crypto.randomUUID();
    await db.put(STORE_NAME, {
      id,
      name,
      date: new Date(),
      headers,
      data,
    });
    return id;
  }
}

export async function getFiles() {
  if (isCloudEnabled) {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching files from Supabase", error);
      return [];
    }
    
    return data.map(report => ({
      ...report,
      date: new Date(report.created_at)
    }));
  } else {
    const db = await initLocalDB();
    return db.getAllFromIndex(STORE_NAME, 'by-date');
  }
}

export async function deleteFile(id: string) {
  if (isCloudEnabled) {
    const { error } = await supabase
      .from('reports')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } else {
    const db = await initLocalDB();
    return db.delete(STORE_NAME, id);
  }
}

// ─── Public Sharing ──────────────────────────────────────────────────────────

export async function savePublicShare(reportName: string, stats: DataStats, summary: string): Promise<string> {
  const id = crypto.randomUUID();
  const shareData = {
    id,
    reportName,
    stats,
    summary,
    createdAt: new Date(),
  };

  if (isCloudEnabled) {
    // Si usas Supabase, requerirías una tabla 'public_shares' sin RLS de lectura
    // const { error } = await supabase.from('public_shares').insert([shareData]);
    // if (error) throw error;
    // Por ahora, fallback a localStorage si no está la tabla creada:
    localStorage.setItem(`tsv_share_${id}`, JSON.stringify(shareData));
  } else {
    // Guardar en IndexedDB local
    const db = await initLocalDB();
    await db.put(SHARE_STORE, shareData);
  }

  return id;
}

export async function getPublicShare(id: string): Promise<any> {
  if (isCloudEnabled) {
    // const { data, error } = await supabase.from('public_shares').select('*').eq('id', id).single();
    // if (!error && data) return data;
    const local = localStorage.getItem(`tsv_share_${id}`);
    if (local) return JSON.parse(local);
    return null;
  } else {
    const db = await initLocalDB();
    return db.get(SHARE_STORE, id);
  }
}
