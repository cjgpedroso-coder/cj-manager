// ============================================================
// CJ - API Data Layer (fetch-based, talks to Express backend)
// ============================================================

const API = '/api';

// ── Products ─────────────────────────────────────────────────

export async function getProducts() {
  const res = await fetch(`${API}/products`);
  return res.json();
}

export async function getProductById(id) {
  const res = await fetch(`${API}/products/${id}`);
  return res.json();
}

export async function saveProduct(product) {
  if (product.id) {
    const res = await fetch(`${API}/products/${product.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    return res.json();
  } else {
    const res = await fetch(`${API}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    return res.json();
  }
}

export async function deleteProduct(id) {
  await fetch(`${API}/products/${id}`, { method: 'DELETE' });
}

// ── Stock Movements ──────────────────────────────────────────

export async function getMovements() {
  const res = await fetch(`${API}/movements`);
  return res.json();
}

export async function saveMovement(movement) {
  const res = await fetch(`${API}/movements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(movement),
  });
  return res.json();
}

export async function deleteMovement(id) {
  await fetch(`${API}/movements/${id}`, { method: 'DELETE' });
}

export async function updateMovement(id, movement) {
  const res = await fetch(`${API}/movements/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(movement),
  });
  return res.json();
}

// ── Embalagens ──────────────────────────────────────────────

export async function getEmbalagens() {
  const res = await fetch(`${API}/embalagens`);
  return res.json();
}

export async function saveEmbalagem(name) {
  const res = await fetch(`${API}/embalagens`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  return res.json();
}

export async function deleteEmbalagem(name) {
  const res = await fetch(`${API}/embalagens/${encodeURIComponent(name)}`, { method: 'DELETE' });
  return res.json();
}

// ── Gramaturas ──────────────────────────────────────────────

export async function getGramaturas() {
  const res = await fetch(`${API}/gramaturas`);
  return res.json();
}

export async function saveGramatura(name) {
  const res = await fetch(`${API}/gramaturas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  return res.json();
}

export async function deleteGramatura(name) {
  const res = await fetch(`${API}/gramaturas/${encodeURIComponent(name)}`, { method: 'DELETE' });
  return res.json();
}

// ── Raw Materials (Matérias Primas) ──────────────────────────

export async function getRawMaterials() {
  const res = await fetch(`${API}/raw-materials`);
  return res.json();
}

export async function saveRawMaterial(material) {
  if (material.id) {
    const res = await fetch(`${API}/raw-materials/${material.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(material),
    });
    return res.json();
  } else {
    const res = await fetch(`${API}/raw-materials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(material),
    });
    return res.json();
  }
}

export async function deleteRawMaterial(id) {
  await fetch(`${API}/raw-materials/${id}`, { method: 'DELETE' });
}

// ── Raw Material Movements ───────────────────────────────────

export async function getRawMaterialMovements() {
  const res = await fetch(`${API}/raw-material-movements`);
  return res.json();
}

export async function saveRawMaterialMovement(movement) {
  const res = await fetch(`${API}/raw-material-movements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(movement),
  });
  return res.json();
}

export async function updateRawMaterialMovement(id, movement) {
  const res = await fetch(`${API}/raw-material-movements/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(movement),
  });
  return res.json();
}

export async function deleteRawMaterialMovement(id) {
  await fetch(`${API}/raw-material-movements/${id}`, { method: 'DELETE' });
}
