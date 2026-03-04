import { openDB, DBSchema } from 'idb';

interface FileHistoryDB extends DBSchema {
  files: {
    key: string;
    value: {
      id: string;
      name: string;
      date: Date;
      data: string[][]; // Raw parsed data
      headers: string[];
    };
    indexes: { 'by-date': Date };
  };
}

const DB_NAME = 'tsv-viewer-db';
const STORE_NAME = 'files';

export async function initDB() {
  return openDB<FileHistoryDB>(DB_NAME, 1, {
    upgrade(db) {
      const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      store.createIndex('by-date', 'date');
    },
  });
}

export async function saveFile(name: string, headers: string[], data: string[][]) {
  const db = await initDB();
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

export async function getFiles() {
  const db = await initDB();
  return db.getAllFromIndex(STORE_NAME, 'by-date');
}

export async function deleteFile(id: string) {
  const db = await initDB();
  return db.delete(STORE_NAME, id);
}
