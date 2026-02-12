// ============================================================
// CJ - Centralized SQLite Connection (better-sqlite3)
// ============================================================
// This module initializes the SQLite database with performance
// and safety PRAGMAs, and exports the instance for use by all
// other modules. Designed for 2-3 concurrent LAN users via API.
// ============================================================

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure /data directory exists
const dataDir = join(__dirname, 'data');
try {
    mkdirSync(dataDir, { recursive: true });
} catch (err) {
    // Directory already exists — ignore
}

const DB_PATH = join(dataDir, 'cj.db');

let db;

try {
    db = new Database(DB_PATH);

    // ── Performance & Safety PRAGMAs ─────────────────────────
    // WAL mode: allows concurrent reads while writing (critical for LAN multi-user)
    db.pragma('journal_mode = WAL');

    // 5 second busy timeout: wait instead of failing on lock contention
    db.pragma('busy_timeout = 5000');

    // NORMAL sync: good balance between safety and speed with WAL
    db.pragma('synchronous = NORMAL');

    // Enforce foreign key constraints
    db.pragma('foreign_keys = ON');

    // 20MB page cache (~20000 pages × 1KB) for better read performance
    db.pragma('cache_size = -20000');

    // Verify PRAGMAs were applied
    const journalMode = db.pragma('journal_mode', { simple: true });
    const busyTimeout = db.pragma('busy_timeout', { simple: true });
    const synchronous = db.pragma('synchronous', { simple: true });
    const foreignKeys = db.pragma('foreign_keys', { simple: true });
    const cacheSize = db.pragma('cache_size', { simple: true });

    console.log('✅ SQLite conectado:', DB_PATH);
    console.log('   PRAGMAs ativos:');
    console.log(`   • journal_mode  = ${journalMode}`);
    console.log(`   • busy_timeout  = ${busyTimeout}ms`);
    console.log(`   • synchronous   = ${synchronous} (1=NORMAL)`);
    console.log(`   • foreign_keys  = ${foreignKeys === 1 ? 'ON' : 'OFF'}`);
    console.log(`   • cache_size    = ${cacheSize}`);
} catch (err) {
    console.error('❌ Falha ao conectar ao SQLite:', err.message);
    process.exit(1);
}

export default db;
