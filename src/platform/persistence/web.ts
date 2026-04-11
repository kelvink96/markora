import type { RecentDocumentEntry, WorkspaceProject } from "../../store/document";

export interface WorkspaceSnapshot {
  version: 1;
  projects: WorkspaceProject[];
  activeProjectId: string;
  recentDocuments: RecentDocumentEntry[];
}

const DB_NAME = "markora-web";
const STORE_NAME = "workspace";
const SNAPSHOT_KEY = "snapshot";

let memorySnapshot: WorkspaceSnapshot | null = null;

function hasIndexedDbSupport() {
  return typeof indexedDB !== "undefined";
}

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Failed to open IndexedDB."));
  });
}

async function withStore<T>(mode: IDBTransactionMode, handler: (store: IDBObjectStore) => IDBRequest<T>) {
  const database = await openDatabase();

  return new Promise<T>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    const request = handler(store);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed."));
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB transaction failed."));
  });
}

export async function loadWorkspaceSnapshot() {
  if (!hasIndexedDbSupport()) {
    return memorySnapshot;
  }

  const result = await withStore<WorkspaceSnapshot | undefined>("readonly", (store) =>
    store.get(SNAPSHOT_KEY),
  );

  return result ?? null;
}

export async function saveWorkspaceSnapshot(snapshot: WorkspaceSnapshot) {
  if (!hasIndexedDbSupport()) {
    memorySnapshot = structuredClone(snapshot);
    return;
  }

  await withStore("readwrite", (store) => store.put(snapshot, SNAPSHOT_KEY));
}

export function __resetWorkspacePersistenceForTests() {
  memorySnapshot = null;
}
