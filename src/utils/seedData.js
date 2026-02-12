// ============================================================
// CJ - Seed Data (runs once if products are empty)
// ============================================================

const PRODUCTS_KEY = 'cj_products';
const EMBALAGENS_KEY = 'cj_embalagens';
const GRAMATURAS_KEY = 'cj_gramaturas';

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

const SEED_EMBALAGENS = ['Saquinho', 'TetraPak', 'Garrafa', 'Rolo'];

const SEED_GRAMATURAS = ['1Kg', '500g', 'Litro', '250g', '2,2Kg', '2Kg', '4Kg'];

const SEED_PRODUCTS = [
    { name: 'Litros', embalagem: 'Saquinho', gramatura: '1Kg', category: 'Produção', currentStock: 516, minStock: 52 },
    { name: 'Mini', embalagem: 'Saquinho', gramatura: '500g', category: 'Produção', currentStock: 28, minStock: 3 },
    { name: 'Molho', embalagem: 'Saquinho', gramatura: '1Kg', category: 'Produção', currentStock: 836, minStock: 84 },
    { name: 'Tetra Pak', embalagem: 'TetraPak', gramatura: 'Litro', category: 'Tercerizado', currentStock: 100, minStock: 10 },
    { name: 'TP Culinário', embalagem: 'TetraPak', gramatura: 'Litro', category: 'Tercerizado', currentStock: 0, minStock: 0 },
    { name: 'Coco Fresco 250g', embalagem: 'Saquinho', gramatura: '250g', category: 'Tercerizado', currentStock: 226, minStock: 23 },
    { name: 'Coco Fresco 500g', embalagem: 'Saquinho', gramatura: '500g', category: 'Tercerizado', currentStock: 373, minStock: 37 },
    { name: 'Coco Fresco 1kg', embalagem: 'Saquinho', gramatura: '1Kg', category: 'Tercerizado', currentStock: 119, minStock: 12 },
    { name: 'Coco Fresco Fino 500g', embalagem: 'Saquinho', gramatura: '500g', category: 'Tercerizado', currentStock: 162, minStock: 16 },
    { name: 'Coco Fresco Puro 1kg', embalagem: 'Saquinho', gramatura: '1Kg', category: 'Tercerizado', currentStock: 0, minStock: 0 },
    { name: 'Coco Seco Fino 500g', embalagem: 'Saquinho', gramatura: '500g', category: 'Tercerizado', currentStock: 435, minStock: 44 },
    { name: 'Coco Seco Flocos 500g', embalagem: 'Saquinho', gramatura: '500g', category: 'Tercerizado', currentStock: 305, minStock: 31 },
    { name: 'Marshmallow 1Kg', embalagem: 'Garrafa', gramatura: '1Kg', category: 'Tercerizado', currentStock: 114, minStock: 11 },
    { name: 'Marshmallow 500g', embalagem: 'Garrafa', gramatura: '500g', category: 'Tercerizado', currentStock: 142, minStock: 14 },
    { name: 'Massa Folhada 1Kg', embalagem: 'Rolo', gramatura: '1Kg', category: 'Tercerizado', currentStock: 703, minStock: 70 },
    { name: 'Massa Folhada 2,2Kg', embalagem: 'Rolo', gramatura: '2,2Kg', category: 'Tercerizado', currentStock: 236, minStock: 24 },
    { name: 'Massa Semi-Folhada 2Kg', embalagem: 'Rolo', gramatura: '2Kg', category: 'Tercerizado', currentStock: 26, minStock: 3 },
    { name: 'Ovo 1 L', embalagem: 'TetraPak', gramatura: 'Litro', category: 'Tercerizado', currentStock: 451, minStock: 45 },
    { name: 'Gema 1 L', embalagem: 'TetraPak', gramatura: 'Litro', category: 'Tercerizado', currentStock: 293, minStock: 29 },
    { name: 'Clara 1L', embalagem: 'TetraPak', gramatura: 'Litro', category: 'Tercerizado', currentStock: 101, minStock: 10 },
    { name: 'Pão de Queijo 1 Kg', embalagem: 'Saquinho', gramatura: '1Kg', category: 'Tercerizado', currentStock: 11, minStock: 1 },
    { name: 'Pão de Queijo 2 Kg', embalagem: 'Saquinho', gramatura: '1Kg', category: 'Tercerizado', currentStock: 0, minStock: 0 },
    { name: 'PQ Requeijão', embalagem: 'Saquinho', gramatura: '1Kg', category: 'Tercerizado', currentStock: 42, minStock: 4 },
    { name: 'PQ Requeijão 4kg', embalagem: 'Saquinho', gramatura: '4Kg', category: 'Tercerizado', currentStock: 0, minStock: 0 },
    { name: 'PQ Frango', embalagem: 'Saquinho', gramatura: '1Kg', category: 'Tercerizado', currentStock: 23, minStock: 2 },
    { name: 'PQ Calabresa', embalagem: 'Saquinho', gramatura: '1Kg', category: 'Tercerizado', currentStock: 26, minStock: 3 },
    { name: 'PQ Goiabada', embalagem: 'Saquinho', gramatura: '1Kg', category: 'Tercerizado', currentStock: 3, minStock: 0 },
    { name: 'PQ Doce de Leite', embalagem: 'Saquinho', gramatura: '1Kg', category: 'Tercerizado', currentStock: 6, minStock: 1 },
    { name: 'PQ Pizza', embalagem: 'Saquinho', gramatura: '1Kg', category: 'Tercerizado', currentStock: 0, minStock: 0 },
    { name: 'TP MM BRANCO', embalagem: 'TetraPak', gramatura: 'Litro', category: 'Tercerizado', currentStock: 0, minStock: 0 },
    { name: 'TP MM ROSA', embalagem: 'TetraPak', gramatura: 'Litro', category: 'Tercerizado', currentStock: 0, minStock: 0 },
    { name: 'TPC MM', embalagem: 'TetraPak', gramatura: 'Litro', category: 'Tercerizado', currentStock: 261, minStock: 26 },
    { name: 'Melo Dito', embalagem: 'Garrafa', gramatura: 'Litro', category: 'Tercerizado', currentStock: 0, minStock: 0 },
];

export function seedDatabase() {
    // Only seed if products are empty
    const existing = localStorage.getItem(PRODUCTS_KEY);
    if (existing && JSON.parse(existing).length > 0) return;

    // Seed embalagens
    localStorage.setItem(EMBALAGENS_KEY, JSON.stringify(SEED_EMBALAGENS));

    // Seed gramaturas
    localStorage.setItem(GRAMATURAS_KEY, JSON.stringify(SEED_GRAMATURAS));

    // Seed products
    const now = new Date().toISOString();
    const products = SEED_PRODUCTS.map((p) => ({
        ...p,
        id: generateId(),
        sku: 'CJ-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
        saldo: p.currentStock,
        createdAt: now,
        updatedAt: now,
    }));

    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));

    console.log(`[CJ Seed] ${products.length} produtos, ${SEED_EMBALAGENS.length} embalagens, ${SEED_GRAMATURAS.length} gramaturas cadastrados.`);
}
