const FONT_DB = 'tpg-fonts';
const FONT_STORE = 'font';

function openFontDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(FONT_DB, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(FONT_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveCustomFont(buf: ArrayBuffer, name: string): Promise<void> {
  const db = await openFontDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FONT_STORE, 'readwrite');
    tx.objectStore(FONT_STORE).put({ buf, name }, 'urdu');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadSavedFont(): Promise<{ buf: ArrayBuffer; name: string } | null> {
  try {
    const db = await openFontDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(FONT_STORE, 'readonly');
      const req = tx.objectStore(FONT_STORE).get('urdu');
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function registerFontBuffer(buf: ArrayBuffer): Promise<void> {
  const face = new FontFace('UserUrdu', buf);
  await face.load();
  document.fonts.add(face);
}
