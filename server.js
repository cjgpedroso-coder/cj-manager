// ============================================================
// CJ - Express + SQLite Backend
// ============================================================

import express from 'express';
import cors from 'cors';
import db from './db.js';

const app = express();
app.use(cors());
app.use(express.json());

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT '',
    status TEXT DEFAULT 'pending',
    createdAt TEXT,
    updatedAt TEXT,
    approvedAt TEXT
  );

  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT,
    category TEXT,
    sku TEXT,
    embalagem TEXT,
    gramatura TEXT,
    currentStock INTEGER DEFAULT 0,
    minStock INTEGER DEFAULT 0,
    costPrice REAL DEFAULT 0,
    saldo INTEGER DEFAULT 0,
    createdAt TEXT,
    updatedAt TEXT
  );

  CREATE TABLE IF NOT EXISTS movements (
    id TEXT PRIMARY KEY,
    productId TEXT,
    date TEXT,
    vendedor TEXT,
    entrada INTEGER DEFAULT 0,
    saida INTEGER DEFAULT 0,
    retorno INTEGER DEFAULT 0,
    trocas INTEGER DEFAULT 0,
    estoque INTEGER DEFAULT 0,
    createdAt TEXT
  );

  CREATE TABLE IF NOT EXISTS embalagens (
    name TEXT PRIMARY KEY
  );

  CREATE TABLE IF NOT EXISTS gramaturas (
    name TEXT PRIMARY KEY
  );

  CREATE TABLE IF NOT EXISTS pending_queue (
    userId TEXT PRIMARY KEY
  );

  CREATE TABLE IF NOT EXISTS login_attempts (
    username TEXT PRIMARY KEY,
    count INTEGER DEFAULT 0,
    cooldownUntil INTEGER
  );
`);

// Seed default admin user
const existingAdmin = db.prepare('SELECT * FROM users WHERE username = ?').get('caio');
if (!existingAdmin) {
    db.prepare(`INSERT INTO users (id, username, password, role, status, createdAt) VALUES (?, ?, ?, ?, ?, ?)`)
        .run('dev_admin', 'caio', 'dev1', 'DEV', 'active', '2026-01-01T00:00:00.000Z');
} else if (existingAdmin.role !== 'DEV' || existingAdmin.status !== 'active') {
    db.prepare('UPDATE users SET role = ?, status = ? WHERE username = ?').run('DEV', 'active', 'caio');
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// ══════════════════════════════════════════════════════════════
// API ROUTES
// ══════════════════════════════════════════════════════════════

// ── Users ────────────────────────────────────────────────────

app.get('/api/users', (req, res) => {
    const users = db.prepare('SELECT * FROM users').all();
    res.json(users);
});

app.post('/api/users/register', (req, res) => {
    const { username, password } = req.body;
    const trimmed = username.trim().toLowerCase();

    if (trimmed.length < 3) return res.json({ success: false, error: 'Usuário deve ter pelo menos 3 caracteres' });
    if (password.length < 3) return res.json({ success: false, error: 'Senha deve ter pelo menos 3 caracteres' });

    const existing = db.prepare('SELECT id FROM users WHERE LOWER(username) = ?').get(trimmed);
    if (existing) return res.json({ success: false, error: 'Nome de usuário já existe' });

    const user = {
        id: generateId(),
        username: trimmed,
        password,
        role: '',
        status: 'pending',
        createdAt: new Date().toISOString(),
    };

    db.prepare('INSERT INTO users (id, username, password, role, status, createdAt) VALUES (?, ?, ?, ?, ?, ?)')
        .run(user.id, user.username, user.password, user.role, user.status, user.createdAt);

    db.prepare('INSERT OR IGNORE INTO pending_queue (userId) VALUES (?)').run(user.id);

    res.json({ success: true, user });
});

app.post('/api/users/login', (req, res) => {
    const { username, password } = req.body;
    const normalUsername = username.toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE LOWER(username) = ?').get(normalUsername);

    if (!user) return res.json({ success: false, error: 'Usuário ou senha incorretos' });

    if (user.status === 'bloqueado') {
        return res.json({ success: false, error: 'bloqueado', username: user.username });
    }

    // Check cooldown
    const attempts = db.prepare('SELECT * FROM login_attempts WHERE username = ?').get(normalUsername) || { count: 0, cooldownUntil: null };
    if (attempts.cooldownUntil && Date.now() < attempts.cooldownUntil) {
        const remaining = Math.ceil((attempts.cooldownUntil - Date.now()) / 1000);
        return res.json({ success: false, error: 'cooldown', remaining, username: user.username });
    }

    if (user.password !== password) {
        const newCount = (attempts.count || 0) + 1;

        if (newCount >= 6) {
            db.prepare('UPDATE users SET status = ? WHERE id = ?').run('bloqueado', user.id);
            db.prepare('DELETE FROM login_attempts WHERE username = ?').run(normalUsername);
            return res.json({ success: false, error: 'bloqueado', username: user.username });
        }

        if (newCount >= 3 && newCount < 6) {
            db.prepare('INSERT OR REPLACE INTO login_attempts (username, count, cooldownUntil) VALUES (?, ?, ?)')
                .run(normalUsername, newCount, Date.now() + 30000);
            return res.json({ success: false, error: 'cooldown', remaining: 30, username: user.username });
        }

        db.prepare('INSERT OR REPLACE INTO login_attempts (username, count, cooldownUntil) VALUES (?, ?, ?)')
            .run(normalUsername, newCount, null);
        return res.json({ success: false, error: `Usuário ou senha incorretos (tentativa ${newCount}/3)` });
    }

    if (user.status === 'pending') return res.json({ success: false, error: 'pending', username: user.username });
    if (user.status === 'inactive') return res.json({ success: false, error: 'Sua conta está desativada. Contate o responsável.' });

    // Success
    db.prepare('DELETE FROM login_attempts WHERE username = ?').run(normalUsername);

    const session = {
        userId: user.id,
        username: user.username,
        name: user.username,
        role: user.role,
        loginAt: new Date().toISOString(),
    };

    res.json({ success: true, session });
});

app.post('/api/users/:id/approve', (req, res) => {
    const { role } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!user) return res.json({ success: false });

    db.prepare('UPDATE users SET status = ?, role = ?, approvedAt = ? WHERE id = ?')
        .run('active', role, new Date().toISOString(), req.params.id);

    db.prepare('DELETE FROM pending_queue WHERE userId = ?').run(req.params.id);
    res.json({ success: true });
});

app.put('/api/users/:id', (req, res) => {
    const { username, password, role, status } = req.body;
    db.prepare('UPDATE users SET username = ?, password = ?, role = ?, status = ?, updatedAt = ? WHERE id = ?')
        .run(username, password, role, status, new Date().toISOString(), req.params.id);
    res.json({ success: true });
});

app.delete('/api/users/:id', (req, res) => {
    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});

app.get('/api/users/pending', (req, res) => {
    const queue = db.prepare('SELECT userId FROM pending_queue').all().map(r => r.userId);
    const users = db.prepare('SELECT * FROM users WHERE status = ?').all('pending');
    const pending = queue.map(id => users.find(u => u.id === id)).filter(Boolean);
    res.json(pending);
});

app.get('/api/users/:id/role', (req, res) => {
    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(req.params.id);
    res.json({ role: user?.role || '' });
});

// ── Products ─────────────────────────────────────────────────

app.get('/api/products', (req, res) => {
    const products = db.prepare('SELECT * FROM products').all();
    res.json(products);
});

app.get('/api/products/:id', (req, res) => {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    res.json(product || null);
});

app.post('/api/products', (req, res) => {
    const p = req.body;
    p.id = generateId();
    p.createdAt = new Date().toISOString();
    p.updatedAt = new Date().toISOString();
    p.saldo = Number(p.currentStock) || 0;

    db.prepare(`INSERT INTO products (id, name, category, sku, embalagem, gramatura, currentStock, minStock, costPrice, saldo, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(p.id, p.name || '', p.category || '', p.sku || '', p.embalagem || '', p.gramatura || '',
            Number(p.currentStock) || 0, Number(p.minStock) || 0, Number(p.costPrice) || 0, p.saldo,
            p.createdAt, p.updatedAt);

    res.json(p);
});

app.put('/api/products/:id', (req, res) => {
    const p = req.body;
    db.prepare(`UPDATE products SET name=?, category=?, sku=?, embalagem=?, gramatura=?, currentStock=?, minStock=?, costPrice=?, saldo=?, updatedAt=? WHERE id=?`)
        .run(p.name || '', p.category || '', p.sku || '', p.embalagem || '', p.gramatura || '',
            Number(p.currentStock) || 0, Number(p.minStock) || 0, Number(p.costPrice) || 0,
            Number(p.saldo) || 0, new Date().toISOString(), req.params.id);
    res.json({ success: true });
});

app.delete('/api/products/:id', (req, res) => {
    db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});

// ── Movements ────────────────────────────────────────────────

app.get('/api/movements', (req, res) => {
    const movements = db.prepare('SELECT * FROM movements').all();
    res.json(movements);
});

app.post('/api/movements', (req, res) => {
    const m = req.body;
    m.id = generateId();
    m.createdAt = new Date().toISOString();

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(m.productId);
    if (product) {
        const saldoAtual = Number(product.saldo ?? product.currentStock) || 0;
        const entrada = Number(m.entrada) || 0;
        const saida = Number(m.saida) || 0;
        const retorno = Number(m.retorno) || 0;
        const trocas = Number(m.trocas) || 0;
        const novoSaldo = saldoAtual + entrada + retorno - saida - trocas;

        m.estoque = novoSaldo;

        db.prepare('UPDATE products SET saldo = ?, updatedAt = ? WHERE id = ?')
            .run(novoSaldo, new Date().toISOString(), m.productId);
    }

    db.prepare(`INSERT INTO movements (id, productId, date, vendedor, entrada, saida, retorno, trocas, estoque, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(m.id, m.productId, m.date, m.vendedor || '', Number(m.entrada) || 0, Number(m.saida) || 0,
            Number(m.retorno) || 0, Number(m.trocas) || 0, m.estoque || 0, m.createdAt);

    res.json(m);
});

app.put('/api/movements/:id', (req, res) => {
    const old = db.prepare('SELECT * FROM movements WHERE id = ?').get(req.params.id);
    if (!old) return res.status(404).json({ error: 'Not found' });

    const m = req.body;

    // Reverse old impact on product saldo
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(old.productId);
    if (product) {
        const oldChange = (Number(old.entrada) || 0) + (Number(old.retorno) || 0) - (Number(old.saida) || 0) - (Number(old.trocas) || 0);
        const saldoReverted = (Number(product.saldo) || 0) - oldChange;

        // Apply new impact
        const newEntrada = Number(m.entrada) || 0;
        const newSaida = Number(m.saida) || 0;
        const newRetorno = Number(m.retorno) || 0;
        const newTrocas = Number(m.trocas) || 0;
        const novoSaldo = saldoReverted + newEntrada + newRetorno - newSaida - newTrocas;

        m.estoque = novoSaldo;

        db.prepare('UPDATE products SET saldo = ?, updatedAt = ? WHERE id = ?')
            .run(novoSaldo, new Date().toISOString(), old.productId);
    }

    db.prepare(`UPDATE movements SET date=?, vendedor=?, entrada=?, saida=?, retorno=?, trocas=?, estoque=?, productId=? WHERE id=?`)
        .run(m.date, m.vendedor || '', Number(m.entrada) || 0, Number(m.saida) || 0,
            Number(m.retorno) || 0, Number(m.trocas) || 0, m.estoque || 0, m.productId, req.params.id);

    res.json({ ...old, ...m, id: req.params.id });
});

app.delete('/api/movements/:id', (req, res) => {
    const movement = db.prepare('SELECT * FROM movements WHERE id = ?').get(req.params.id);

    if (movement) {
        const product = db.prepare('SELECT * FROM products WHERE id = ?').get(movement.productId);
        if (product) {
            const entrada = Number(movement.entrada) || 0;
            const saida = Number(movement.saida) || 0;
            const retorno = Number(movement.retorno) || 0;
            const trocas = Number(movement.trocas) || 0;
            const stockChange = entrada + retorno - saida - trocas;
            const newSaldo = (Number(product.saldo) || 0) - stockChange;

            db.prepare('UPDATE products SET saldo = ? WHERE id = ?').run(newSaldo, movement.productId);
        }
    }

    db.prepare('DELETE FROM movements WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});

// ── Embalagens ───────────────────────────────────────────────

app.get('/api/embalagens', (req, res) => {
    const items = db.prepare('SELECT name FROM embalagens').all().map(r => r.name);
    res.json(items);
});

app.post('/api/embalagens', (req, res) => {
    const { name } = req.body;
    const trimmed = name.trim();
    if (!trimmed) return res.json([]);
    db.prepare('INSERT OR IGNORE INTO embalagens (name) VALUES (?)').run(trimmed);
    const items = db.prepare('SELECT name FROM embalagens').all().map(r => r.name);
    res.json(items);
});

app.delete('/api/embalagens/:name', (req, res) => {
    db.prepare('DELETE FROM embalagens WHERE name = ?').run(req.params.name);
    const items = db.prepare('SELECT name FROM embalagens').all().map(r => r.name);
    res.json(items);
});

// ── Gramaturas ───────────────────────────────────────────────

app.get('/api/gramaturas', (req, res) => {
    const items = db.prepare('SELECT name FROM gramaturas').all().map(r => r.name);
    res.json(items);
});

app.post('/api/gramaturas', (req, res) => {
    const { name } = req.body;
    const trimmed = name.trim();
    if (!trimmed) return res.json([]);
    db.prepare('INSERT OR IGNORE INTO gramaturas (name) VALUES (?)').run(trimmed);
    const items = db.prepare('SELECT name FROM gramaturas').all().map(r => r.name);
    res.json(items);
});

app.delete('/api/gramaturas/:name', (req, res) => {
    db.prepare('DELETE FROM gramaturas WHERE name = ?').run(req.params.name);
    const items = db.prepare('SELECT name FROM gramaturas').all().map(r => r.name);
    res.json(items);
});

// ── Start Server ─────────────────────────────────────────────

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`CJ Backend rodando em http://localhost:${PORT}`);
});
