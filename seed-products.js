// Seed script — run once then delete
import db from './db.js';

// Clear existing products
db.prepare('DELETE FROM products').run();
db.prepare('DELETE FROM embalagens').run();
db.prepare('DELETE FROM gramaturas').run();

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

const now = new Date().toISOString();

const products = [
    { name: 'Litros', embalagem: 'Saquinho', gramatura: '1Kg', category: 'Produção', currentStock: 516, saldo: 52 },
    { name: 'Mini', embalagem: 'Saquinho', gramatura: '500g', category: 'Produção', currentStock: 28, saldo: 3 },
    { name: 'Molho', embalagem: 'Saquinho', gramatura: '1Kg', category: 'Produção', currentStock: 836, saldo: 84 },
    { name: 'Tetra Pak', embalagem: 'TetraPak', gramatura: 'Litro', category: 'Tercerizado', currentStock: 100, saldo: 10 },
    { name: 'TP Culinário', embalagem: 'TetraPak', gramatura: 'Litro', category: 'Tercerizado', currentStock: 0, saldo: 0 },
    { name: 'Coco Fresco 250g', embalagem: 'Saquinho', gramatura: '250g', category: 'Tercerizado', currentStock: 226, saldo: 23 },
    { name: 'Coco Fresco 500g', embalagem: 'Saquinho', gramatura: '500g', category: 'Tercerizado', currentStock: 373, saldo: 37 },
    { name: 'Coco Fresco 1kg', embalagem: 'Saquinho', gramatura: '1Kg', category: 'Tercerizado', currentStock: 119, saldo: 12 },
    { name: 'Coco Fresco Fino 500g', embalagem: 'Saquinho', gramatura: '500g', category: 'Tercerizado', currentStock: 162, saldo: 16 },
    { name: 'Coco Fresco Puro 1kg', embalagem: 'Saquinho', gramatura: '1Kg', category: 'Tercerizado', currentStock: 0, saldo: 0 },
    { name: 'Coco Seco Fino 500g', embalagem: 'Saquinho', gramatura: '500g', category: 'Tercerizado', currentStock: 435, saldo: 44 },
    { name: 'Coco Seco Flocos 500g', embalagem: 'Saquinho', gramatura: '500g', category: 'Tercerizado', currentStock: 305, saldo: 31 },
    { name: 'Marshmallow 1Kg', embalagem: 'Garrafa', gramatura: '1Kg', category: 'Tercerizado', currentStock: 114, saldo: 11 },
    { name: 'Marshmallow 500g', embalagem: 'Garrafa', gramatura: '500g', category: 'Tercerizado', currentStock: 142, saldo: 14 },
    { name: 'Massa Folhada 1Kg', embalagem: 'Rolo', gramatura: '1Kg', category: 'Tercerizado', currentStock: 703, saldo: 70 },
    { name: 'Massa Folhada 2,2Kg', embalagem: 'Rolo', gramatura: '2,2Kg', category: 'Tercerizado', currentStock: 236, saldo: 24 },
    { name: 'Massa Semi-Folhada 2Kg', embalagem: 'Rolo', gramatura: '2Kg', category: 'Tercerizado', currentStock: 26, saldo: 3 },
    { name: 'Ovo 1 L', embalagem: 'TetraPak', gramatura: 'Litro', category: 'Tercerizado', currentStock: 451, saldo: 45 },
    { name: 'Gema 1 L', embalagem: 'TetraPak', gramatura: 'Litro', category: 'Tercerizado', currentStock: 293, saldo: 29 },
    { name: 'Clara 1L', embalagem: 'TetraPak', gramatura: 'Litro', category: 'Tercerizado', currentStock: 101, saldo: 10 },
    { name: 'Pão de Queijo 1 Kg', embalagem: 'Saquinho', gramatura: '1Kg', category: 'Tercerizado', currentStock: 11, saldo: 1 },
    { name: 'Pão de Queijo 2 Kg', embalagem: 'Saquinho', gramatura: '2Kg', category: 'Tercerizado', currentStock: 0, saldo: 0 },
    { name: 'PQ Requeijão', embalagem: 'Saquinho', gramatura: '1Kg', category: 'Tercerizado', currentStock: 42, saldo: 4 },
    { name: 'PQ Requeijão 4kg', embalagem: 'Saquinho', gramatura: '4Kg', category: 'Tercerizado', currentStock: 0, saldo: 0 },
    { name: 'PQ Frango', embalagem: 'Saquinho', gramatura: '1Kg', category: 'Tercerizado', currentStock: 23, saldo: 2 },
    { name: 'PQ Calabresa', embalagem: 'Saquinho', gramatura: '1Kg', category: 'Tercerizado', currentStock: 26, saldo: 3 },
    { name: 'PQ Goiabada', embalagem: 'Saquinho', gramatura: '1Kg', category: 'Tercerizado', currentStock: 0, saldo: 0 },
    { name: 'PQ Doce de Leite', embalagem: 'Saquinho', gramatura: '1Kg', category: 'Tercerizado', currentStock: 6, saldo: 1 },
    { name: 'PQ Pizza', embalagem: 'Saquinho', gramatura: '1Kg', category: 'Tercerizado', currentStock: 0, saldo: 0 },
    { name: 'TP MM BRANCO', embalagem: 'TetraPak', gramatura: 'Litro', category: 'Tercerizado', currentStock: 0, saldo: 0 },
    { name: 'TP MM ROSA', embalagem: 'TetraPak', gramatura: 'Litro', category: 'Tercerizado', currentStock: 0, saldo: 0 },
    { name: 'TPC MM', embalagem: 'TetraPak', gramatura: 'Litro', category: 'Tercerizado', currentStock: 261, saldo: 26 },
    { name: 'DESMOLDANTE 1L', embalagem: 'Garrafa', gramatura: 'Litro', category: 'Tercerizado', currentStock: 34, saldo: 3 },
    { name: 'Melo Dito', embalagem: 'Garrafa', gramatura: 'Litro', category: 'Tercerizado', currentStock: 0, saldo: 0 },
];

const insertProduct = db.prepare(
    `INSERT INTO products (id, name, category, sku, embalagem, gramatura, currentStock, minStock, costPrice, saldo, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
);

for (const p of products) {
    const sku = 'CJ-' + Math.random().toString(36).substr(2, 6).toUpperCase();
    insertProduct.run(generateId(), p.name, p.category, sku, p.embalagem, p.gramatura, p.currentStock, 0, 0, p.saldo, now, now);
}

// Seed embalagens
for (const e of ['Saquinho', 'TetraPak', 'Garrafa', 'Rolo']) {
    db.prepare('INSERT OR IGNORE INTO embalagens (name) VALUES (?)').run(e);
}

// Seed gramaturas
for (const g of ['250g', '500g', '1Kg', '2Kg', '2,2Kg', '4Kg', 'Litro']) {
    db.prepare('INSERT OR IGNORE INTO gramaturas (name) VALUES (?)').run(g);
}

console.log(`✅ Seeded ${products.length} products, 4 embalagens, 7 gramaturas`);
