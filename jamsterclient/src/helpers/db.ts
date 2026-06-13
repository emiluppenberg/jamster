import { stockSamples, stockPresetDnB, stockPresetFunky } from "../stock";
import type { StoredPreset, StoredSampleArrayBuffer, StoredSampleMcpDescription } from "../types";
import { getUrlFilename } from '../utils';

const store_samplesArrayBuffers = "samplesArrayBuffers";
const store_samplesMcpDescriptions = "samplesMcpDescriptions";
const store_presets = "presets";

const key_samplesArrayBuffers = "sampleFilename";
const key_samplesMcpDescriptions = "sampleFilename";
const key_presets = "name";

const seedStockSamplesArrayBuffers = async (db: IDBDatabase): Promise<void> => {
    const samplesArrayBuffers: StoredSampleArrayBuffer[] = await Promise.all(stockSamples.map(async (sample) => {
        const response = await fetch(sample.url);
        const arrayBuffer = await response.arrayBuffer();

        return {
            sampleFilename: getUrlFilename(sample.url),
            arrayBuffer,
        };
    }));

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(store_samplesArrayBuffers, "readwrite");
        const store = transaction.objectStore(store_samplesArrayBuffers);

        samplesArrayBuffers.forEach((sample) => store.put(sample));

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
}

const seedStockSamplesMcpDescriptions = async (db: IDBDatabase): Promise<void> => {
    const samplesMcpDescriptions: StoredSampleMcpDescription[] = await Promise.all(stockSamples.map(async (sample) => ({
        sampleFilename: getUrlFilename(sample.url),
        mcpDescription: sample.mcpDescription
    })));

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(store_samplesMcpDescriptions, "readwrite");
        const store = transaction.objectStore(store_samplesMcpDescriptions);

        samplesMcpDescriptions.forEach((sample) => store.put(sample));

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
}

const seedStockPresets = async (db: IDBDatabase): Promise<void> => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(store_presets, "readwrite");
        const store = transaction.objectStore(store_presets);

        store.put(stockPresetDnB)
        store.put(stockPresetFunky)
        
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
}

export const openJamsterDB = async (): Promise<IDBDatabase> => (
    new Promise((resolve, reject) => {
        const request = indexedDB.open("jamster", 1);
        let seedArrayBuffers = false;
        let seedMcpDescriptions = false;
        let seedPresets = false;

        request.onupgradeneeded = () => {
            const db = request.result;

            if (!db.objectStoreNames.contains(store_samplesArrayBuffers)) {
                db.createObjectStore(store_samplesArrayBuffers, { keyPath: key_samplesArrayBuffers });
                seedArrayBuffers = true;
            }

            if (!db.objectStoreNames.contains(store_samplesMcpDescriptions)) {
                db.createObjectStore(store_samplesMcpDescriptions, { keyPath: key_samplesMcpDescriptions });
                seedMcpDescriptions = true;
            }

            if (!db.objectStoreNames.contains(store_presets)) {
                db.createObjectStore(store_presets, { keyPath: key_presets });
                seedPresets = true;
            }
        }

        request.onsuccess = async () => {
            const db = request.result;
            if (seedArrayBuffers) await seedStockSamplesArrayBuffers(db);
            if (seedMcpDescriptions) await seedStockSamplesMcpDescriptions(db);
            if (seedPresets) await seedStockPresets(db);
            resolve(db);
        }

        request.onerror = () => reject(request.error);
    })
)

export const getAllSamplesArrayBuffers = async (): Promise<StoredSampleArrayBuffer[]> => {
    const db = await openJamsterDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(store_samplesArrayBuffers, "readonly");
        const store = transaction.objectStore(store_samplesArrayBuffers);

        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    })
}

export const getAllSamplesMcpDescriptions = async (): Promise<StoredSampleMcpDescription[]> => {
    const db = await openJamsterDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(store_samplesMcpDescriptions, "readonly");
        const store = transaction.objectStore(store_samplesMcpDescriptions);

        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    })
}

export const saveSampleArrayBuffer = async (sample: StoredSampleArrayBuffer): Promise<void> => {
    const db = await openJamsterDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction("samplesArrayBuffers", "readwrite");
        const store = transaction.objectStore("samplesArrayBuffers");

        store.put(sample);

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    })
}

export const saveSampleMcpDescription = async (sample: StoredSampleMcpDescription): Promise<void> => {
    const db = await openJamsterDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(store_samplesMcpDescriptions, "readwrite");
        const store = transaction.objectStore(store_samplesMcpDescriptions);

        store.put(sample);

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    })
}

export const deleteSampleArrayBuffer = async (sampleFilename: string): Promise<void> => {
    const db = await openJamsterDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(store_samplesArrayBuffers, "readwrite");
        const store = transaction.objectStore(store_samplesArrayBuffers);

        store.delete(sampleFilename);

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    })
}

export const deleteSampleMcpDescription = async (sampleFilename: string): Promise<void> => {
    const db = await openJamsterDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(store_samplesMcpDescriptions, "readwrite");
        const store = transaction.objectStore(store_samplesMcpDescriptions);

        store.delete(sampleFilename);

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    })
}

export const getPresets = async (): Promise<StoredPreset[]> => {
    const db = await openJamsterDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(store_presets, "readwrite");
        const store = transaction.objectStore(store_presets);

        const request = store.getAll();

        transaction.oncomplete = () => resolve(request.result);
        transaction.onerror = () => reject(transaction.error);
    })
}

export const savePreset = async (preset: StoredPreset): Promise<void> => {
    const db = await openJamsterDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(store_presets, "readwrite");
        const store = transaction.objectStore(store_presets);

        store.put(preset);

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    })
}

export const deletePreset = async (presetName: string): Promise<void> => {
    const db = await openJamsterDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(store_presets, "readwrite");
        const store = transaction.objectStore(store_presets);

        store.delete(presetName);

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    })
}
