const DB_NAME = 'ConstructTrackProDB';
const STORE_NAME = 'photos';
let db: IDBDatabase | null = null;

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    // If db is already initialized, resolve it
    if (db) return resolve(db);

    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = () => {
      console.error('Database error:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const dbInstance = (event.target as IDBOpenDBRequest).result;
      if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
        dbInstance.createObjectStore(STORE_NAME);
      }
    };
  });
};

const getDB = async (): Promise<IDBDatabase> => {
    if (db) return db;
    return await initDB();
}

export const setPhoto = (key: string, imageDataUrl: string): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await getDB();
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put(imageDataUrl, key);

            request.onsuccess = () => resolve();
            request.onerror = () => {
                console.error('Error saving photo:', request.error);
                reject(request.error);
            };
        } catch (error) {
            reject(error);
        }
    });
};

export const getPhoto = (key: string): Promise<string | null> => {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await getDB();
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(key);

            request.onsuccess = () => {
                resolve(request.result ? request.result : null);
            };
            request.onerror = () => {
                console.error('Error getting photo:', request.error);
                reject(request.error);
            };
        } catch (error) {
            reject(error);
        }
    });
};

export const getPhotosForProject = async (
    projectId: number, 
    photoMetas: { id: number; description: string; dateAdded: Date }[]
): Promise<{ id: number; url: string; description: string; dateAdded: Date; }[]> => {
    try {
        const photoPromises = photoMetas.map(async (meta) => {
            const key = `proj-${projectId}-${meta.id}`;
            const url = await getPhoto(key);
            if (url) {
                return { ...meta, url };
            }
            return null;
        });

        const photos = await Promise.all(photoPromises);
        return photos.filter(p => p !== null) as { id: number; url: string; description: string; dateAdded: Date; }[];
    } catch (error) {
        console.error("Error fetching photos for project report", error);
        return [];
    }
};