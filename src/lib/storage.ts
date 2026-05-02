import { supabase, isCloudEnabled } from './supabase';
import { openDB } from 'idb';
import { DataStats } from './data-processor';

// Local DB Setup (Fallback)
const DB_NAME = 'tsv-viewer-db';
const STORE_NAME = 'files';
const SHARE_STORE = 'shares';
const SCHEMA_STORE = 'schemas';

async function initLocalDB() {
  return openDB(DB_NAME, 3, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('by-date', 'date');
      }
      if (oldVersion < 2) {
        db.createObjectStore(SHARE_STORE, { keyPath: 'id' });
      }
      if (oldVersion < 3) {
        db.createObjectStore(SCHEMA_STORE, { keyPath: 'hash' });
      }
    },
  });
}

export async function saveSchemaMapping(hash: string, mapping: Record<string, string>) {
  const db = await initLocalDB();
  await db.put(SCHEMA_STORE, { hash, mapping, lastUsed: new Date() });
}

export async function getSchemaMapping(hash: string) {
  const db = await initLocalDB();
  return db.get(SCHEMA_STORE, hash);
}

export async function saveFile(name: string, headers: string[], data: any[][], projectId?: string) {
  if (isCloudEnabled) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No authenticated user");

    const { data: savedReport, error } = await supabase
      .from('reports')
      .insert([{
        name,
        headers,
        data,
        user_id: user.id,
        project_id: projectId
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
      project_id: projectId
    });
    return id;
  }
}

export async function getFiles(projectId?: string) {
  if (isCloudEnabled) {
    let query = supabase
      .from('reports')
      .select('*');
    
    if (projectId) {
      query = query.eq('project_id', projectId);
    } else {
      query = query.is('project_id', null);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

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
    const all = await db.getAllFromIndex(STORE_NAME, 'by-date');
    if (projectId) {
      return all.filter((f: any) => f.project_id === projectId);
    }
    return all.filter((f: any) => !f.project_id);
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

export async function savePublicShare(reportName: string, stats: DataStats, summary: string, brandColor?: string): Promise<string> {
  const id = crypto.randomUUID();
  const shareData = {
    id,
    reportName,
    stats,
    summary,
    brandColor,
    createdAt: new Date(),
  };

  if (isCloudEnabled) {
    const { error } = await supabase.from('public_shares').insert([shareData]);
    if (error) {
      console.warn("Error saving to public_shares table, falling back to localStorage", error);
      localStorage.setItem(`tsv_share_${id}`, JSON.stringify(shareData));
    }
  } else {
    // Guardar en IndexedDB local
    const db = await initLocalDB();
    await db.put(SHARE_STORE, shareData);
  }

  return id;
}

export async function getPublicShare(id: string): Promise<any> {
  if (isCloudEnabled) {
    const { data, error } = await supabase.from('public_shares').select('*').eq('id', id).single();
    if (!error && data) return data;
    const local = localStorage.getItem(`tsv_share_${id}`);
    if (local) return JSON.parse(local);
    return null;
  } else {
    const db = await initLocalDB();
    return db.get(SHARE_STORE, id);
  }
}
