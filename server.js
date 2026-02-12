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

  CREATE TABLE IF NOT EXISTS raw_materials (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    embalagem TEXT,
    gramatura TEXT,
    currentStock INTEGER DEFAULT 0,
    minStock INTEGER DEFAULT 0,
    createdAt TEXT,
    updatedAt TEXT
  );

  CREATE TABLE IF NOT EXISTS raw_material_movements (
    id TEXT PRIMARY KEY,
    rawMaterialId TEXT,
    date TEXT,
    entrada INTEGER DEFAULT 0,
    saida INTEGER DEFAULT 0,
    createdAt TEXT
  );

  CREATE TABLE IF NOT EXISTS recipes (
    id TEXT PRIMARY KEY,
    productId TEXT NOT NULL,
    qtyGeralMes REAL DEFAULT 0,
    qtyProdutoMes REAL DEFAULT 0,
    producaoReceita REAL DEFAULT 0,
    createdAt TEXT,
    updatedAt TEXT
  );

  CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id TEXT PRIMARY KEY,
    recipeId TEXT NOT NULL,
    rawMaterialId TEXT NOT NULL,
    quantidade REAL DEFAULT 0,
    precoKg REAL DEFAULT 0,
    qtyGeral REAL DEFAULT 0,
    qtyProduto REAL DEFAULT 0,
    createdAt TEXT
  );

  CREATE TABLE IF NOT EXISTS costs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'Operacional',
    mes1 REAL DEFAULT 0,
    mes2 REAL DEFAULT 0,
    mes3 REAL DEFAULT 0,
    valorMedio REAL DEFAULT 0,
    nomeVeiculo TEXT DEFAULT '',
    placa TEXT DEFAULT '',
    kmPorLitro REAL DEFAULT 0,
    kmRodadoMes REAL DEFAULT 0,
    seguroMes REAL DEFAULT 0,
    ipvaLicenciamento REAL DEFAULT 0,
    manutencaoAnual REAL DEFAULT 0,
    valorLitro REAL DEFAULT 0,
    createdAt TEXT,
    updatedAt TEXT
  );
`);

// Migration: add producaoReceita column if missing
try { db.exec('ALTER TABLE recipes ADD COLUMN producaoReceita REAL DEFAULT 0'); } catch (e) { /* column already exists */ }

// Migration: add tax columns to products
const productTaxCols = [
    'compraPreco REAL DEFAULT 0',
    'compraIcms REAL DEFAULT 0',
    'vendaIcms REAL DEFAULT 0',
    'vendaPis REAL DEFAULT 0',
    'vendaCofins REAL DEFAULT 0',
    'vendaIr REAL DEFAULT 0',
    'vendaCs REAL DEFAULT 0',
    'vendaIbs REAL DEFAULT 0',
    'vendaCbs REAL DEFAULT 0',
];
for (const col of productTaxCols) {
    try { db.exec(`ALTER TABLE products ADD COLUMN ${col}`); } catch (e) { /* already exists */ }
}

// Migration: add tax columns to raw_materials
const rawMatTaxCols = [
    'compraPreco REAL DEFAULT 0',
    'compraIcms REAL DEFAULT 0',
    'vendaIcms REAL DEFAULT 0',
    'vendaPis REAL DEFAULT 0',
    'vendaCofins REAL DEFAULT 0',
    'vendaIr REAL DEFAULT 0',
    'vendaCs REAL DEFAULT 0',
    'vendaIbs REAL DEFAULT 0',
    'vendaCbs REAL DEFAULT 0',
];
for (const col of rawMatTaxCols) {
    try { db.exec(`ALTER TABLE raw_materials ADD COLUMN ${col}`); } catch (e) { /* already exists */ }
}

// Migration: add vendasMes column to products
try { db.exec('ALTER TABLE products ADD COLUMN vendasMes REAL DEFAULT 0'); } catch (e) { /* already exists */ }

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
    const products = db.prepare('SELECT * FROM products ORDER BY name').all();
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

// ── Tax fields update (used by Regras Tributárias) ──────────

app.put('/api/tax/:table/:id', (req, res) => {
    const validTables = ['products', 'raw_materials'];
    const table = req.params.table;
    if (!validTables.includes(table)) return res.status(400).json({ error: 'Invalid table' });

    const { compraPreco, compraIcms, vendaIcms, vendaPis, vendaCofins, vendaIr, vendaCs, vendaIbs, vendaCbs } = req.body;
    db.prepare(`UPDATE "${table}" SET compraPreco=?, compraIcms=?, vendaIcms=?, vendaPis=?, vendaCofins=?, vendaIr=?, vendaCs=?, vendaIbs=?, vendaCbs=?, updatedAt=? WHERE id=?`)
        .run(
            Number(compraPreco) || 0, Number(compraIcms) || 0,
            Number(vendaIcms) || 0, Number(vendaPis) || 0, Number(vendaCofins) || 0,
            Number(vendaIr) || 0, Number(vendaCs) || 0, Number(vendaIbs) || 0, Number(vendaCbs) || 0,
            new Date().toISOString(), req.params.id
        );
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

// ── Raw Materials ─────────────────────────────────────────────

app.get('/api/raw-materials', (req, res) => {
    const items = db.prepare('SELECT * FROM raw_materials ORDER BY name').all();
    res.json(items);
});

app.post('/api/raw-materials', (req, res) => {
    const m = req.body;
    m.id = generateId();
    m.createdAt = new Date().toISOString();
    m.updatedAt = new Date().toISOString();

    db.prepare(`INSERT INTO raw_materials (id, name, embalagem, gramatura, currentStock, minStock, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(m.id, m.name || '', m.embalagem || '', m.gramatura || '',
            Number(m.currentStock) || 0, Number(m.minStock) || 0,
            m.createdAt, m.updatedAt);

    res.json(m);
});

app.put('/api/raw-materials/:id', (req, res) => {
    const m = req.body;
    db.prepare(`UPDATE raw_materials SET name=?, embalagem=?, gramatura=?, currentStock=?, minStock=?, updatedAt=? WHERE id=?`)
        .run(m.name || '', m.embalagem || '', m.gramatura || '',
            Number(m.currentStock) || 0, Number(m.minStock) || 0,
            new Date().toISOString(), req.params.id);
    res.json({ success: true });
});

app.delete('/api/raw-materials/:id', (req, res) => {
    db.prepare('DELETE FROM raw_materials WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});

// ── Raw Material Movements ───────────────────────────────────

app.get('/api/raw-material-movements', (req, res) => {
    const items = db.prepare('SELECT * FROM raw_material_movements ORDER BY createdAt DESC').all();
    res.json(items);
});

app.post('/api/raw-material-movements', (req, res) => {
    const m = req.body;
    m.id = generateId();
    m.createdAt = new Date().toISOString();

    const entrada = Number(m.entrada) || 0;
    const saida = Number(m.saida) || 0;

    db.prepare(`INSERT INTO raw_material_movements (id, rawMaterialId, date, entrada, saida, createdAt)
    VALUES (?, ?, ?, ?, ?, ?)`)
        .run(m.id, m.rawMaterialId, m.date, entrada, saida, m.createdAt);

    // Update raw material currentStock
    const mat = db.prepare('SELECT * FROM raw_materials WHERE id = ?').get(m.rawMaterialId);
    if (mat) {
        const newStock = (Number(mat.currentStock) || 0) + entrada - saida;
        db.prepare('UPDATE raw_materials SET currentStock = ?, updatedAt = ? WHERE id = ?')
            .run(newStock, new Date().toISOString(), m.rawMaterialId);
    }

    res.json(m);
});

app.put('/api/raw-material-movements/:id', (req, res) => {
    const old = db.prepare('SELECT * FROM raw_material_movements WHERE id = ?').get(req.params.id);
    if (!old) return res.status(404).json({ error: 'Not found' });

    const m = req.body;
    const newEntrada = Number(m.entrada) || 0;
    const newSaida = Number(m.saida) || 0;

    // Reverse old impact, apply new
    const mat = db.prepare('SELECT * FROM raw_materials WHERE id = ?').get(old.rawMaterialId);
    if (mat) {
        const oldChange = (Number(old.entrada) || 0) - (Number(old.saida) || 0);
        const reverted = (Number(mat.currentStock) || 0) - oldChange;
        const newStock = reverted + newEntrada - newSaida;
        db.prepare('UPDATE raw_materials SET currentStock = ?, updatedAt = ? WHERE id = ?')
            .run(newStock, new Date().toISOString(), old.rawMaterialId);
    }

    db.prepare(`UPDATE raw_material_movements SET rawMaterialId=?, date=?, entrada=?, saida=? WHERE id=?`)
        .run(m.rawMaterialId || old.rawMaterialId, m.date, newEntrada, newSaida, req.params.id);

    res.json({ ...old, ...m, id: req.params.id });
});

app.delete('/api/raw-material-movements/:id', (req, res) => {
    const old = db.prepare('SELECT * FROM raw_material_movements WHERE id = ?').get(req.params.id);
    if (old) {
        // Reverse impact on currentStock
        const mat = db.prepare('SELECT * FROM raw_materials WHERE id = ?').get(old.rawMaterialId);
        if (mat) {
            const oldChange = (Number(old.entrada) || 0) - (Number(old.saida) || 0);
            const newStock = (Number(mat.currentStock) || 0) - oldChange;
            db.prepare('UPDATE raw_materials SET currentStock = ?, updatedAt = ? WHERE id = ?')
                .run(newStock, new Date().toISOString(), old.rawMaterialId);
        }
        db.prepare('DELETE FROM raw_material_movements WHERE id = ?').run(req.params.id);
    }
    res.json({ success: true });
});

// ── Recipes ──────────────────────────────────────────────────

app.get('/api/recipes', (req, res) => {
    const recipes = db.prepare(`
        SELECT r.*, p.name as productName
        FROM recipes r
        LEFT JOIN products p ON r.productId = p.id
        ORDER BY p.name
    `).all();
    res.json(recipes);
});

app.post('/api/recipes', (req, res) => {
    const { productId, qtyGeralMes, qtyProdutoMes, producaoReceita } = req.body;
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    db.prepare(`INSERT INTO recipes (id, productId, qtyGeralMes, qtyProdutoMes, producaoReceita, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)`)
        .run(id, productId, qtyGeralMes || 0, qtyProdutoMes || 0, producaoReceita || 0, new Date().toISOString(), new Date().toISOString());
    const recipe = db.prepare(`SELECT r.*, p.name as productName FROM recipes r LEFT JOIN products p ON r.productId = p.id WHERE r.id = ?`).get(id);
    res.json(recipe);
});

app.put('/api/recipes/:id', (req, res) => {
    const { productId, qtyGeralMes, qtyProdutoMes, producaoReceita } = req.body;
    db.prepare(`UPDATE recipes SET productId = ?, qtyGeralMes = ?, qtyProdutoMes = ?, producaoReceita = ?, updatedAt = ? WHERE id = ?`)
        .run(productId, qtyGeralMes || 0, qtyProdutoMes || 0, producaoReceita || 0, new Date().toISOString(), req.params.id);
    const recipe = db.prepare(`SELECT r.*, p.name as productName FROM recipes r LEFT JOIN products p ON r.productId = p.id WHERE r.id = ?`).get(req.params.id);
    res.json(recipe);
});

app.delete('/api/recipes/:id', (req, res) => {
    db.prepare('DELETE FROM recipe_ingredients WHERE recipeId = ?').run(req.params.id);
    db.prepare('DELETE FROM recipes WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});

// ── Recipe Ingredients ───────────────────────────────────────

app.get('/api/recipes/:id/ingredients', (req, res) => {
    const items = db.prepare(`
        SELECT ri.*, rm.name as rawMaterialName
        FROM recipe_ingredients ri
        LEFT JOIN raw_materials rm ON ri.rawMaterialId = rm.id
        WHERE ri.recipeId = ?
        ORDER BY rm.name
    `).all(req.params.id);
    res.json(items);
});

app.post('/api/recipes/:id/ingredients', (req, res) => {
    const { rawMaterialId, quantidade, precoKg, qtyGeral, qtyProduto } = req.body;
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    db.prepare(`INSERT INTO recipe_ingredients (id, recipeId, rawMaterialId, quantidade, precoKg, qtyGeral, qtyProduto, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(id, req.params.id, rawMaterialId, quantidade || 0, precoKg || 0, qtyGeral || 0, qtyProduto || 0, new Date().toISOString());
    const item = db.prepare(`SELECT ri.*, rm.name as rawMaterialName FROM recipe_ingredients ri LEFT JOIN raw_materials rm ON ri.rawMaterialId = rm.id WHERE ri.id = ?`).get(id);
    res.json(item);
});

app.put('/api/recipe-ingredients/:id', (req, res) => {
    const { rawMaterialId, quantidade, precoKg, qtyGeral, qtyProduto } = req.body;
    db.prepare(`UPDATE recipe_ingredients SET rawMaterialId = ?, quantidade = ?, precoKg = ?, qtyGeral = ?, qtyProduto = ? WHERE id = ?`)
        .run(rawMaterialId, quantidade || 0, precoKg || 0, qtyGeral || 0, qtyProduto || 0, req.params.id);
    const item = db.prepare(`SELECT ri.*, rm.name as rawMaterialName FROM recipe_ingredients ri LEFT JOIN raw_materials rm ON ri.rawMaterialId = rm.id WHERE ri.id = ?`).get(req.params.id);
    res.json(item);
});

app.delete('/api/recipe-ingredients/:id', (req, res) => {
    db.prepare('DELETE FROM recipe_ingredients WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});

// ── Developer Database Routes ────────────────────────────────

// List all tables
app.get('/api/dev/tables', (req, res) => {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all();
    const result = tables.map((t) => {
        const count = db.prepare(`SELECT COUNT(*) as count FROM "${t.name}"`).get();
        return { name: t.name, rowCount: count.count };
    });
    res.json(result);
});

// Get table schema + all rows
app.get('/api/dev/tables/:name', (req, res) => {
    const tableName = req.params.name;
    // Validate table exists
    const exists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(tableName);
    if (!exists) return res.status(404).json({ error: 'Table not found' });

    const columns = db.prepare(`PRAGMA table_info("${tableName}")`).all();
    const rows = db.prepare(`SELECT * FROM "${tableName}" ORDER BY rowid DESC`).all();
    res.json({ columns, rows });
});

// Insert row
app.post('/api/dev/tables/:name', (req, res) => {
    const tableName = req.params.name;
    const exists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(tableName);
    if (!exists) return res.status(404).json({ error: 'Table not found' });

    const data = req.body;
    const keys = Object.keys(data);
    if (keys.length === 0) return res.status(400).json({ error: 'No data provided' });

    const placeholders = keys.map(() => '?').join(', ');
    const sql = `INSERT INTO "${tableName}" (${keys.map(k => `"${k}"`).join(', ')}) VALUES (${placeholders})`;
    db.prepare(sql).run(...keys.map(k => data[k]));
    res.json({ success: true });
});

// Update row (by primary key or rowid)
app.put('/api/dev/tables/:name/:id', (req, res) => {
    const tableName = req.params.name;
    const exists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(tableName);
    if (!exists) return res.status(404).json({ error: 'Table not found' });

    const columns = db.prepare(`PRAGMA table_info("${tableName}")`).all();
    const pkCol = columns.find(c => c.pk === 1);
    const pkName = pkCol ? pkCol.name : 'rowid';

    const data = req.body;
    const keys = Object.keys(data).filter(k => k !== pkName);
    if (keys.length === 0) return res.status(400).json({ error: 'No data to update' });

    const setClause = keys.map(k => `"${k}" = ?`).join(', ');
    const sql = `UPDATE "${tableName}" SET ${setClause} WHERE "${pkName}" = ?`;
    db.prepare(sql).run(...keys.map(k => data[k]), req.params.id);
    res.json({ success: true });
});

// Delete row
app.delete('/api/dev/tables/:name/:id', (req, res) => {
    const tableName = req.params.name;
    const exists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(tableName);
    if (!exists) return res.status(404).json({ error: 'Table not found' });

    const columns = db.prepare(`PRAGMA table_info("${tableName}")`).all();
    const pkCol = columns.find(c => c.pk === 1);
    const pkName = pkCol ? pkCol.name : 'rowid';

    db.prepare(`DELETE FROM "${tableName}" WHERE "${pkName}" = ?`).run(req.params.id);
    res.json({ success: true });
});

// ── Costs CRUD ───────────────────────────────────────────────

app.get('/api/costs', (req, res) => {
    const costs = db.prepare('SELECT * FROM costs ORDER BY name').all();
    res.json(costs);
});

app.post('/api/costs', (req, res) => {
    const c = req.body;
    c.id = generateId();
    c.createdAt = new Date().toISOString();
    c.updatedAt = c.createdAt;
    db.prepare(`INSERT INTO costs (id, name, type, mes1, mes2, mes3, valorMedio, nomeVeiculo, placa, kmPorLitro, kmRodadoMes, seguroMes, ipvaLicenciamento, manutencaoAnual, valorLitro, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(c.id, c.name || '', c.type || 'Operacional',
            Number(c.mes1) || 0, Number(c.mes2) || 0, Number(c.mes3) || 0, Number(c.valorMedio) || 0,
            c.nomeVeiculo || '', c.placa || '',
            Number(c.kmPorLitro) || 0, Number(c.kmRodadoMes) || 0,
            Number(c.seguroMes) || 0, Number(c.ipvaLicenciamento) || 0, Number(c.manutencaoAnual) || 0,
            Number(c.valorLitro) || 0,
            c.createdAt, c.updatedAt);
    res.json(c);
});

app.put('/api/costs/:id', (req, res) => {
    const c = req.body;
    db.prepare(`UPDATE costs SET name=?, type=?, mes1=?, mes2=?, mes3=?, valorMedio=?, nomeVeiculo=?, placa=?, kmPorLitro=?, kmRodadoMes=?, seguroMes=?, ipvaLicenciamento=?, manutencaoAnual=?, valorLitro=?, updatedAt=? WHERE id=?`)
        .run(c.name || '', c.type || 'Operacional',
            Number(c.mes1) || 0, Number(c.mes2) || 0, Number(c.mes3) || 0, Number(c.valorMedio) || 0,
            c.nomeVeiculo || '', c.placa || '',
            Number(c.kmPorLitro) || 0, Number(c.kmRodadoMes) || 0,
            Number(c.seguroMes) || 0, Number(c.ipvaLicenciamento) || 0, Number(c.manutencaoAnual) || 0,
            Number(c.valorLitro) || 0,
            new Date().toISOString(), req.params.id);
    res.json({ success: true });
});

app.delete('/api/costs/:id', (req, res) => {
    db.prepare('DELETE FROM costs WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});

// Update vendasMes for a product
app.put('/api/products/:id/vendas-mes', (req, res) => {
    const { vendasMes } = req.body;
    db.prepare('UPDATE products SET vendasMes = ?, updatedAt = ? WHERE id = ?')
        .run(Number(vendasMes) || 0, new Date().toISOString(), req.params.id);
    res.json({ success: true });
});

// ── Start Server ─────────────────────────────────────────────

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`CJ Backend rodando em http://localhost:${PORT}`);
});
