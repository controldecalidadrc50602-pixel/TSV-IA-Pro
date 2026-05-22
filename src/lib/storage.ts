import { db, auth, isCloudEnabled } from './firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, orderBy, getDoc, setDoc } from 'firebase/firestore';
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
  const localDb = await initLocalDB();
  await localDb.put(SCHEMA_STORE, { hash, mapping, lastUsed: new Date() });
}

export async function getSchemaMapping(hash: string) {
  const localDb = await initLocalDB();
  return localDb.get(SCHEMA_STORE, hash);
}

export async function saveFile(name: string, headers: string[], data: any[][], projectId?: string) {
  if (isCloudEnabled) {
    const user = auth.currentUser;
    if (!user) throw new Error("No authenticated user");

    const docRef = await addDoc(collection(db, 'reports'), {
      name,
      headers,
      data,
      user_id: user.uid,
      project_id: projectId || null,
      created_at: new Date().toISOString()
    });

    return docRef.id;
  } else {
    const localDb = await initLocalDB();
    const id = crypto.randomUUID();
    await localDb.put(STORE_NAME, {
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
    const user = auth.currentUser;
    if (!user) return [];

    let q = query(
      collection(db, 'reports'),
      where('user_id', '==', user.uid)
    );
    
    if (projectId) {
      q = query(q, where('project_id', '==', projectId));
    } else {
      q = query(q, where('project_id', '==', null));
    }

    try {
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: new Date(doc.data().created_at)
      }));
      // Sort in JS to avoid complex Firestore composite indexes during setup
      return data.sort((a: any, b: any) => b.date.getTime() - a.date.getTime());
    } catch (error) {
      console.error("Error fetching files from Firebase", error);
      return [];
    }
  } else {
    const localDb = await initLocalDB();
    const all = await localDb.getAllFromIndex(STORE_NAME, 'by-date');
    if (projectId) {
      return all.filter((f: any) => f.project_id === projectId);
    }
    return all.filter((f: any) => !f.project_id);
  }
}

export async function deleteFile(id: string) {
  if (isCloudEnabled) {
    await deleteDoc(doc(db, 'reports', id));
  } else {
    const localDb = await initLocalDB();
    return localDb.delete(STORE_NAME, id);
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
    createdAt: new Date().toISOString(),
  };

  if (isCloudEnabled) {
    try {
      await setDoc(doc(db, 'public_shares', id), shareData);
    } catch (error) {
      console.warn("Error saving to public_shares table, falling back to localStorage", error);
      localStorage.setItem(`tsv_share_${id}`, JSON.stringify(shareData));
    }
  } else {
    // Guardar en IndexedDB local
    const localDb = await initLocalDB();
    await localDb.put(SHARE_STORE, shareData);
  }

  return id;
}

export async function getPublicShare(id: string): Promise<any> {
  if (isCloudEnabled) {
    try {
      const docSnap = await getDoc(doc(db, 'public_shares', id));
      if (docSnap.exists()) return docSnap.data();
    } catch (err) {}
    
    const local = localStorage.getItem(`tsv_share_${id}`);
    if (local) return JSON.parse(local);
    return null;
  } else {
    const localDb = await initLocalDB();
    return localDb.get(SHARE_STORE, id);
  }
}
