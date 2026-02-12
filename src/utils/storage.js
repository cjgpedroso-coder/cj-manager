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

// ── Recipes ─────────────────────────────────────────────────

export async function getRecipes() {
  const res = await fetch(`${API}/recipes`);
  return res.json();
}

export async function saveRecipe(recipe) {
  if (recipe.id) {
    const res = await fetch(`${API}/recipes/${recipe.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(recipe),
    });
    return res.json();
  } else {
    const res = await fetch(`${API}/recipes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(recipe),
    });
    return res.json();
  }
}

export async function deleteRecipe(id) {
  await fetch(`${API}/recipes/${id}`, { method: 'DELETE' });
}

// ── Recipe Ingredients ──────────────────────────────────────

export async function getRecipeIngredients(recipeId) {
  const res = await fetch(`${API}/recipes/${recipeId}/ingredients`);
  return res.json();
}

export async function saveRecipeIngredient(recipeId, ingredient) {
  const res = await fetch(`${API}/recipes/${recipeId}/ingredients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ingredient),
  });
  return res.json();
}

export async function updateRecipeIngredient(id, ingredient) {
  const res = await fetch(`${API}/recipe-ingredients/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ingredient),
  });
  return res.json();
}

export async function deleteRecipeIngredient(id) {
  await fetch(`${API}/recipe-ingredients/${id}`, { method: 'DELETE' });
}

// ── Costs ────────────────────────────────────────────────────

export async function getCosts() {
  const res = await fetch(`${API}/costs`);
  return res.json();
}

export async function saveCost(cost) {
  if (cost.id) {
    const res = await fetch(`${API}/costs/${cost.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cost),
    });
    return res.json();
  } else {
    const res = await fetch(`${API}/costs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cost),
    });
    return res.json();
  }
}

export async function deleteCost(id) {
  await fetch(`${API}/costs/${id}`, { method: 'DELETE' });
}

// ── Product vendasMes ────────────────────────────────────────

export async function updateVendasMes(productId, vendasMes) {
  const res = await fetch(`${API}/products/${productId}/vendas-mes`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vendasMes }),
  });
  return res.json();
}
