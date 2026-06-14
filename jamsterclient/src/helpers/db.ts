import { stockSamples, stockBeatDnB, stockBeatChillHop } from "../stock";
import type { StoredBeat, StoredSampleArrayBuffer, StoredSampleMcpDescription } from "../types";
import { getUrlFilename } from '../utils';

const store_samplesArrayBuffers = "samplesArrayBuffers";
const store_samplesMcpDescriptions = "samplesMcpDescriptions";
const store_beats = "beats";

const key_samplesArrayBuffers = "sampleFilename";
const key_samplesMcpDescriptions = "sampleFilename";
const key_beats = "name";

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

const seedStockBeats = async (db: IDBDatabase): Promise<void> => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(store_beats, "readwrite");
        const store = transaction.objectStore(store_beats);

        store.put(stockBeatDnB)
        store.put(stockBeatChillHop)
        
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
}

export const openBeatDocDB = async (): Promise<IDBDatabase> => (
    new Promise((resolve, reject) => {
        const request = indexedDB.open("beatdoc", 1);
        let seedArrayBuffers = false;
        let seedMcpDescriptions = false;
        let seedBeats = false;

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

            if (!db.objectStoreNames.contains(store_beats)) {
                db.createObjectStore(store_beats, { keyPath: key_beats });
                seedBeats = true;
            }
        }

        request.onsuccess = async () => {
            const db = request.result;
            if (seedArrayBuffers) await seedStockSamplesArrayBuffers(db);
            if (seedMcpDescriptions) await seedStockSamplesMcpDescriptions(db);
            if (seedBeats) await seedStockBeats(db);
            resolve(db);
        }

        request.onerror = () => reject(request.error);
    })
)

export const getAllSamplesArrayBuffers = async (): Promise<StoredSampleArrayBuffer[]> => {
    const db = await openBeatDocDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(store_samplesArrayBuffers, "readonly");
        const store = transaction.objectStore(store_samplesArrayBuffers);

        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    })
}

export const getAllSamplesMcpDescriptions = async (): Promise<StoredSampleMcpDescription[]> => {
    const db = await openBeatDocDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(store_samplesMcpDescriptions, "readonly");
        const store = transaction.objectStore(store_samplesMcpDescriptions);

        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    })
}

export const saveSampleArrayBuffer = async (sample: StoredSampleArrayBuffer): Promise<void> => {
    const db = await openBeatDocDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction("samplesArrayBuffers", "readwrite");
        const store = transaction.objectStore("samplesArrayBuffers");

        store.put(sample);

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    })
}

export const saveSampleMcpDescription = async (sample: StoredSampleMcpDescription): Promise<void> => {
    const db = await openBeatDocDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(store_samplesMcpDescriptions, "readwrite");
        const store = transaction.objectStore(store_samplesMcpDescriptions);

        store.put(sample);

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    })
}

export const deleteSampleArrayBuffer = async (sampleFilename: string): Promise<void> => {
    const db = await openBeatDocDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(store_samplesArrayBuffers, "readwrite");
        const store = transaction.objectStore(store_samplesArrayBuffers);

        store.delete(sampleFilename);

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    })
}

export const deleteSampleMcpDescription = async (sampleFilename: string): Promise<void> => {
    const db = await openBeatDocDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(store_samplesMcpDescriptions, "readwrite");
        const store = transaction.objectStore(store_samplesMcpDescriptions);

        store.delete(sampleFilename);

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    })
}

export const getAllBeats = async (): Promise<StoredBeat[]> => {
    const db = await openBeatDocDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(store_beats, "readwrite");
        const store = transaction.objectStore(store_beats);

        const request = store.getAll();

        transaction.oncomplete = () => resolve(request.result);
        transaction.onerror = () => reject(transaction.error);
    })
}

export const saveBeat = async (beat: StoredBeat): Promise<void> => {
    const db = await openBeatDocDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(store_beats, "readwrite");
        const store = transaction.objectStore(store_beats);

        store.put(beat);

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    })
}

export const deleteBeat = async (beatName: string): Promise<void> => {
    const db = await openBeatDocDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(store_beats, "readwrite");
        const store = transaction.objectStore(store_beats);

        store.delete(beatName);

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    })
}
