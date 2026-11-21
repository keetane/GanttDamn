import type { Chart } from "../domain/model";
import { validateChart } from "../domain/validation";
let connection: Promise<IDBDatabase> | undefined;
function db() {
  return (connection ??= new Promise<IDBDatabase>((resolve, reject) => {
    const r = indexedDB.open("timeline-grid", 1);
    r.onupgradeneeded = () => {
      r.result.createObjectStore("charts", { keyPath: "id" });
      r.result.createObjectStore("meta");
    };
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => {
      connection = undefined;
      reject(r.error);
    };
  }));
}
async function transaction<T>(
  store: string,
  mode: IDBTransactionMode,
  action: (s: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const database = await db();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(store, mode);
    const req = action(tx.objectStore(store));
    tx.oncomplete = () => resolve(req.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error("保存が中断されました"));
  });
}
export const saveChart = (chart: Chart) =>
  transaction("charts", "readwrite", (s) => s.put(chart));
export const listCharts = async () => {
  const raw = await transaction<unknown[]>("charts", "readonly", (s) =>
    s.getAll(),
  );
  return raw
    .map(validateChart)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
};
export const deleteChart = (id: string) =>
  transaction("charts", "readwrite", (s) => s.delete(id));
export const saveLast = (id: string) =>
  transaction("meta", "readwrite", (s) => s.put(id, "lastChart"));
export const readLast = () =>
  transaction<string | undefined>("meta", "readonly", (s) =>
    s.get("lastChart"),
  );

export async function saveCharts(charts: Chart[], rowsOnly = false) {
  const database = await db();
  return new Promise<void>((resolve, reject) => {
    const tx = database.transaction("charts", "readwrite");
    try {
      const store = tx.objectStore("charts");
      charts.forEach((c) => {
        if (!rowsOnly) {
          store.put(c);
          return;
        }
        const request = store.get(c.id);
        request.onsuccess = () => {
          if (!request.result) return;
          try {
            store.put({
              ...request.result,
              rows: c.rows,
              updatedAt: c.updatedAt,
            });
          } catch (error) {
            tx.abort();
            reject(error);
          }
        };
      });
    } catch (error) {
      tx.abort();
      reject(error);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error("保存が中断されました"));
  });
}
