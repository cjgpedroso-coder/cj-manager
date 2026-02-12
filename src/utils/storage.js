// ============================================================
// CJ - Local Storage Data Layer
// ============================================================

const PRODUCTS_KEY = 'cj_products';
const MOVEMENTS_KEY = 'cj_movements';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// ── Products ─────────────────────────────────────────────────

export function getProducts() {
  const data = localStorage.getItem(PRODUCTS_KEY);
  return data ? JSON.parse(data) : [];
}

export function getProductById(id) {
  return getProducts().find((p) => p.id === id) || null;
}

export function saveProduct(product) {
  const products = getProducts();
  if (product.id) {
    const index = products.findIndex((p) => p.id === product.id);
    if (index !== -1) {
      products[index] = { ...products[index], ...product, updatedAt: new Date().toISOString() };
    }
  } else {
    product.id = generateId();
    product.createdAt = new Date().toISOString();
    product.updatedAt = new Date().toISOString();
    products.push(product);
  }
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  return product;
}

export function deleteProduct(id) {
  const products = getProducts().filter((p) => p.id !== id);
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
}

// ── Stock Movements ──────────────────────────────────────────

export function getMovements() {
  const data = localStorage.getItem(MOVEMENTS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveMovement(movement) {
  const movements = getMovements();
  movement.id = generateId();
  movement.createdAt = new Date().toISOString();
  movements.push(movement);
  localStorage.setItem(MOVEMENTS_KEY, JSON.stringify(movements));

  // Update product stock
  const products = getProducts();
  const index = products.findIndex((p) => p.id === movement.productId);
  if (index !== -1) {
    const qty = Number(movement.quantity);
    if (movement.type === 'entrada') {
      products[index].currentStock = (Number(products[index].currentStock) || 0) + qty;
    } else {
      products[index].currentStock = (Number(products[index].currentStock) || 0) - qty;
    }
    products[index].updatedAt = new Date().toISOString();
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  }

  return movement;
}

export function deleteMovement(id) {
  const movements = getMovements();
  const movement = movements.find((m) => m.id === id);

  if (movement) {
    // Reverse stock impact
    const products = getProducts();
    const pIndex = products.findIndex((p) => p.id === movement.productId);
    if (pIndex !== -1) {
      const qty = Number(movement.quantity);
      if (movement.type === 'entrada') {
        products[pIndex].currentStock = (Number(products[pIndex].currentStock) || 0) - qty;
      } else {
        products[pIndex].currentStock = (Number(products[pIndex].currentStock) || 0) + qty;
      }
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
    }
  }

  const filtered = movements.filter((m) => m.id !== id);
  localStorage.setItem(MOVEMENTS_KEY, JSON.stringify(filtered));
}
