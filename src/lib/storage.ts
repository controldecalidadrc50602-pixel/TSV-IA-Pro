import { supabase, isCloudEnabled } from './supabase';
import { openDB } from 'idb';

// Local DB Setup (Fallback)
const DB_NAME = 'tsv-viewer-db';
const STORE_NAME = 'files';

async function initLocalDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      store.createIndex('by-date', 'date');
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
