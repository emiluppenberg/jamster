import hihat1Url from '../assets/hihat1.wav';
import kick1Url from '../assets/kick1.wav';
import snare1Url from '../assets/snare1.wav';
import hihat2Url from '../assets/hihat2.wav';
import kick2Url from '../assets/kick2.wav';
import snare2Url from '../assets/snare2.wav';
import type { StoredData, StoredSample } from "../types";
import { exampleData } from '../utils';

const seedExampleSamples = async (db: IDBDatabase): Promise<void> => {
    const stockSamples = [
        { url: hihat1Url, description: "Basic hihat" },
        {url: kick1Url, description: "Basic kick"},
        {url: snare1Url, description: "Basic snare"},
        {url: hihat2Url, description: "Basic hihat"},
        {url: kick2Url, description: "Basic kick"},
        {url: snare2Url, description: "Basic snare"},
    ];

    const samples: StoredSample[] = await Promise.all(stockSamples.map(async (sample) => {
        const response = await fetch(sample.url);
        const arrayBuffer = await response.arrayBuffer();

        return {
            sampleFilename: sample.url,
            mcpDescription: sample.description,
            arrayBuffer,
        };
    }));

    return new Promise((resolve, reject) => {
        const transaction = db.transaction("samples", "readwrite");
        const store = transaction.objectStore("samples");

        samples.forEach((sample) => store.put(sample));

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
}

const seedExampleData = async (db: IDBDatabase): Promise<void> => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("data", "readwrite");
        const store = transaction.objectStore("data");

        store.put(exampleData)

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
}

export const openJamsterDB = async (): Promise<IDBDatabase> => (
    new Promise((resolve, reject) => {
        const request = indexedDB.open("jamster", 1);
        let shouldSeed = false;

        request.onupgradeneeded = () => {
            const db = request.result;

            if (!db.objectStoreNames.contains("samples")) {
                db.createObjectStore("samples", { keyPath: "sampleFilename" });
                shouldSeed = true;
            }

            if (!db.objectStoreNames.contains("data")) {
                db.createObjectStore("data", { keyPath: "name" });
                shouldSeed = true;
            }
        }

        request.onsuccess = async () => {
            const db = request.result;
            shouldSeed && await seedExampleSamples(db);
            shouldSeed && await seedExampleData(db);
            resolve(db);
        }

        request.onerror = () => reject(request.error);
    })
)
export const getSample = async (sampleFileName: string): Promise<StoredSample> => {
    const db = await openJamsterDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction("samples", "readonly");
        const store = transaction.objectStore("samples");

        const request = store.get(sampleFileName);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    })
}

export const getAllSamples = async (): Promise<StoredSample[]> => {
    const db = await openJamsterDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction("samples", "readonly");
        const store = transaction.objectStore("samples");

        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    })
}

export const saveSample = async (sample: StoredSample): Promise<void> => {
    const db = await openJamsterDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction("samples", "readwrite");
        const store = transaction.objectStore("samples");
        store.put(sample);

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    })
}

export const deleteSample = async (sampleFilename: string): Promise<void> => {
    const db = await openJamsterDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction("samples", "readwrite");
        const store = transaction.objectStore("samples");

        store.delete(sampleFilename);

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    })
}

export const getData = async (): Promise<StoredData[]> => {
    const db = await openJamsterDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction("data", "readwrite");
        const store = transaction.objectStore("data");

        const request = store.getAll();

        transaction.oncomplete = () => resolve(request.result);
        transaction.onerror = () => reject(transaction.error);
    })
}

export const saveData = async (data: StoredData): Promise<void> => {
    const db = await openJamsterDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction("data", "readwrite");
        const store = transaction.objectStore("data");

        store.put(data);

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    })
}

export const deleteData = async (dataName: string): Promise<void> => {
    const db = await openJamsterDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction("data", "readwrite");
        const store = transaction.objectStore("data");

        store.delete(dataName);

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    })
}
