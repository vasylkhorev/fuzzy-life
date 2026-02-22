import Dexie from 'dexie';

export const db = new Dexie('FuzzyLifeDatabase');

db.version(1).stores({
    patterns: '++id, hash, mode, type, period, is1D' // Primary key and indexed props
});
