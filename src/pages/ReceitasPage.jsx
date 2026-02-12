import { useState, useCallback, useEffect } from 'react';
import {
    getProducts,
    getRawMaterials,
    getRecipes,
    saveRecipe,
    deleteRecipe,
    getRecipeIngredients,
    saveRecipeIngredient,
    updateRecipeIngredient,
    deleteRecipeIngredient,
} from '../utils/storage';

export default function ReceitasPage() {
    const [recipes, setRecipes] = useState([]);
    const [products, setProducts] = useState([]);
    const [rawMaterials, setRawMaterials] = useState([]);
    const [expanded, setExpanded] = useState({}); // recipeId -> ingredients[]
    const [loading, setLoading] = useState({});   // recipeId -> bool
    const [allIngredients, setAllIngredients] = useState({}); // recipeId -> ingredients[] (preloaded for totals)

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingRecipe, setEditingRecipe] = useState(null);
    const [form, setForm] = useState({ productId: '', qtyGeralMes: '', qtyProdutoMes: '', producaoReceita: '' });
    const [errors, setErrors] = useState({});

    // Delete confirmation
    const [confirmDelete, setConfirmDelete] = useState(null);

    // Inline ingredient form per recipe
    const [ingredientForm, setIngredientForm] = useState({}); // recipeId -> { rawMaterialId, quantidade, precoKg, qtyGeral, qtyProduto }
    const [editingIngredient, setEditingIngredient] = useState(null); // ingredient object being edited

    const refresh = useCallback(async () => {
        const [r, p, rm] = await Promise.all([getRecipes(), getProducts(), getRawMaterials()]);
        setRecipes(r);
        setProducts(p);
        setRawMaterials(rm);
        // Preload all ingredients for card totals
        const ingMap = {};
        await Promise.all(r.map(async (rec) => {
            ingMap[rec.id] = await getRecipeIngredients(rec.id);
        }));
        setAllIngredients(ingMap);
    }, []);

    useEffect(() => { refresh(); }, [refresh]);

    // Filter products with category = 'Produção'
    const productionProducts = products.filter(p => p.category === 'Produção');

    // ── Recipe Modal ─────────────────────────────────────────

    function openNewRecipe() {
        setEditingRecipe(null);
        setForm({ productId: '', qtyGeralMes: '', qtyProdutoMes: '', producaoReceita: '' });
        setErrors({});
        setShowModal(true);
    }

    function openEditRecipe(recipe) {
        setEditingRecipe(recipe);
        setForm({
            productId: recipe.productId,
            qtyGeralMes: recipe.qtyGeralMes || '',
            qtyProdutoMes: recipe.qtyProdutoMes || '',
            producaoReceita: recipe.producaoReceita || '',
        });
        setErrors({});
        setShowModal(true);
    }

    async function handleSaveRecipe(e) {
        e.preventDefault();
        const errs = {};
        if (!form.productId) errs.productId = 'Selecione um produto';
        if (Object.keys(errs).length) { setErrors(errs); return; }

        const data = {
            productId: form.productId,
            qtyGeralMes: Number(form.qtyGeralMes) || 0,
            qtyProdutoMes: Number(form.qtyProdutoMes) || 0,
            producaoReceita: Number(form.producaoReceita) || 0,
        };
        if (editingRecipe) data.id = editingRecipe.id;

        await saveRecipe(data);
        setShowModal(false);
        refresh();
    }

    // ── Delete Recipe ────────────────────────────────────────

    async function handleDeleteRecipe() {
        if (!confirmDelete) return;
        await deleteRecipe(confirmDelete.id);
        setConfirmDelete(null);
        setExpanded(prev => { const n = { ...prev }; delete n[confirmDelete.id]; return n; });
        refresh();
    }

    // ── Expand / Collapse ────────────────────────────────────

    async function toggleExpand(recipeId) {
        if (expanded[recipeId]) {
            setExpanded(prev => { const n = { ...prev }; delete n[recipeId]; return n; });
            return;
        }
        setLoading(prev => ({ ...prev, [recipeId]: true }));
        const ingredients = await getRecipeIngredients(recipeId);
        setExpanded(prev => ({ ...prev, [recipeId]: ingredients }));
        setAllIngredients(prev => ({ ...prev, [recipeId]: ingredients }));
        setLoading(prev => ({ ...prev, [recipeId]: false }));
    }

    // ── Ingredient CRUD ──────────────────────────────────────

    function getIngForm(recipeId) {
        return ingredientForm[recipeId] || { rawMaterialId: '', quantidade: '', precoKg: '', qtyGeral: '', qtyProduto: '' };
    }

    function setIngField(recipeId, field, value) {
        setIngredientForm(prev => ({
            ...prev,
            [recipeId]: { ...getIngForm(recipeId), [field]: value },
        }));
    }

    function startEditIngredient(ing) {
        setEditingIngredient(ing);
        setIngredientForm(prev => ({
            ...prev,
            [ing.recipeId]: {
                rawMaterialId: ing.rawMaterialId,
                quantidade: ing.quantidade || '',
                precoKg: ing.precoKg || '',
                qtyGeral: ing.qtyGeral || '',
                qtyProduto: ing.qtyProduto || '',
            },
        }));
    }

    function cancelEditIngredient(recipeId) {
        setEditingIngredient(null);
        setIngredientForm(prev => { const n = { ...prev }; delete n[recipeId]; return n; });
    }

    async function handleSaveIngredient(recipeId) {
        const f = getIngForm(recipeId);
        if (!f.rawMaterialId) return;

        const data = {
            rawMaterialId: f.rawMaterialId,
            quantidade: Number(f.quantidade) || 0,
            precoKg: Number(f.precoKg) || 0,
            qtyGeral: Number(f.qtyGeral) || 0,
            qtyProduto: Number(f.qtyProduto) || 0,
        };

        if (editingIngredient && editingIngredient.recipeId === recipeId) {
            await updateRecipeIngredient(editingIngredient.id, data);
            setEditingIngredient(null);
        } else {
            await saveRecipeIngredient(recipeId, data);
        }

        // Refresh ingredients for this recipe
        const ingredients = await getRecipeIngredients(recipeId);
        setExpanded(prev => ({ ...prev, [recipeId]: ingredients }));
        setAllIngredients(prev => ({ ...prev, [recipeId]: ingredients }));
        setIngredientForm(prev => { const n = { ...prev }; delete n[recipeId]; return n; });
    }

    async function handleDeleteIngredient(recipeId, ingredientId) {
        await deleteRecipeIngredient(ingredientId);
        const ingredients = await getRecipeIngredients(recipeId);
        setExpanded(prev => ({ ...prev, [recipeId]: ingredients }));
        setAllIngredients(prev => ({ ...prev, [recipeId]: ingredients }));
    }

    // ── Render ────────────────────────────────────────────────

    return (
        <div className="page-container">
            <div className="page-header">
                <div className="page-header-left">
                    <h2>Receitas</h2>
                    <p>Gerencie as receitas e seus ingredientes</p>
                </div>
                <button className="btn btn-primary" onClick={openNewRecipe}>
                    + Nova Receita
                </button>
            </div>

            {recipes.length === 0 ? (
                <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '40px', opacity: 0.3, marginBottom: '12px' }}>--</div>
                    <h4 style={{ color: 'var(--text-primary)', marginBottom: '6px' }}>Nenhuma receita cadastrada</h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Clique em "Nova Receita" para começar.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {recipes.map(recipe => (
                        <div key={recipe.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            {/* Card Header */}
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '18px 24px', borderBottom: expanded[recipe.id] ? '1px solid var(--border-color)' : 'none',
                            }}>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                                        {recipe.productName || 'Produto removido'}
                                    </h4>
                                    <div style={{ display: 'flex', gap: '24px', marginTop: '6px', fontSize: '13px', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                                        <span>Qtd Produção/mês Geral: <strong style={{ color: 'var(--text-primary)' }}>{recipe.qtyGeralMes}</strong></span>
                                        <span>Qtd Produção/mês Produto: <strong style={{ color: 'var(--text-primary)' }}>{recipe.qtyProdutoMes}</strong></span>
                                        <span>Produção por receita: <strong style={{ color: 'var(--text-primary)' }}>{recipe.producaoReceita}</strong></span>
                                        <span>Total Receita (R$): <strong style={{ color: '#059669' }}>R$ {(allIngredients[recipe.id] || []).reduce((s, i) => s + (Number(i.quantidade) || 0) * (Number(i.precoKg) || 0), 0).toFixed(2)}</strong></span>
                                        <span>Crédito ICMS (R$): <strong style={{ color: '#2563eb' }}>R$ {(allIngredients[recipe.id] || []).reduce((s, i) => { const t = (Number(i.quantidade) || 0) * (Number(i.precoKg) || 0); const rm = rawMaterials.find(r => r.id === i.rawMaterialId); return s + ((Number(rm?.compraIcms) || 0) * t) / 100; }, 0).toFixed(2)}</strong></span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <button
                                        className="btn-icon"
                                        title="Expandir receita"
                                        onClick={() => toggleExpand(recipe.id)}
                                        style={{ fontSize: '18px', transition: 'transform 0.2s', transform: expanded[recipe.id] ? 'rotate(180deg)' : 'rotate(0)' }}
                                    >
                                        ▼
                                    </button>
                                    <button className="btn-icon" title="Editar receita" onClick={() => openEditRecipe(recipe)}>
                                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button className="btn-icon" title="Excluir receita" onClick={() => setConfirmDelete(recipe)} style={{ color: 'var(--accent-danger)' }}>
                                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Expanded: Ingredients */}
                            {loading[recipe.id] && (
                                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>Carregando...</div>
                            )}
                            {expanded[recipe.id] && !loading[recipe.id] && (
                                <div style={{ padding: '16px 24px 20px' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                                                <th style={thStyle}>Matéria Prima</th>
                                                <th style={thStyle}>Quantidade M.P.</th>
                                                <th style={thStyle}>R$/kg</th>
                                                <th style={thStyle}>Total (R$)</th>
                                                <th style={thStyle}>KG</th>
                                                <th style={thStyle}>%</th>
                                                <th style={thStyle}>Créd. ICMS(%)</th>
                                                <th style={thStyle}>Créd. ICMS(R$)</th>
                                                <th style={{ ...thStyle, width: '90px' }}>Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(() => {
                                                const ings = expanded[recipe.id];
                                                const producao = Number(recipe.producaoReceita) || 1;
                                                const totalKgReceita = ings.reduce((s, i) => s + ((Number(i.quantidade) || 0) / producao), 0);
                                                return ings.map(ing => {
                                                    const totalRS = (Number(ing.quantidade) || 0) * (Number(ing.precoKg) || 0);
                                                    const kg = (Number(ing.quantidade) || 0) / producao;
                                                    const pct = totalKgReceita > 0 ? (kg * 100) / totalKgReceita : 0;
                                                    const rm = rawMaterials.find(r => r.id === ing.rawMaterialId);
                                                    const icmsPct = Number(rm?.compraIcms) || 0;
                                                    const icmsRS = (icmsPct * totalRS) / 100;
                                                    return editingIngredient?.id === ing.id ? (
                                                        <tr key={ing.id} style={{ background: '#fefce8' }}>
                                                            <td style={tdStyle}>
                                                                <select className="form-select" style={{ fontSize: '13px' }} value={getIngForm(recipe.id).rawMaterialId} onChange={e => setIngField(recipe.id, 'rawMaterialId', e.target.value)}>
                                                                    <option value="">Selecione...</option>
                                                                    {rawMaterials.map(rm => <option key={rm.id} value={rm.id}>{rm.name}</option>)}
                                                                </select>
                                                            </td>
                                                            <td style={tdStyle}><input className="form-input" style={inpStyle} type="number" value={getIngForm(recipe.id).quantidade} onChange={e => setIngField(recipe.id, 'quantidade', e.target.value)} /></td>
                                                            <td style={tdStyle}><input className="form-input" style={inpStyle} type="number" step="0.01" value={getIngForm(recipe.id).precoKg} onChange={e => setIngField(recipe.id, 'precoKg', e.target.value)} /></td>
                                                            <td style={tdStyleNum}>R$ {totalRS.toFixed(2)}</td>
                                                            <td style={tdStyleNum}>{kg.toFixed(4)}</td>
                                                            <td style={tdStyleNum}>{pct.toFixed(2)}%</td>
                                                            <td style={tdStyleNum}>{icmsPct.toFixed(2)}%</td>
                                                            <td style={tdStyleNum}>R$ {icmsRS.toFixed(2)}</td>
                                                            <td style={tdStyle}>
                                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                                    <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={() => handleSaveIngredient(recipe.id)}>Salvar</button>
                                                                    <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => cancelEditIngredient(recipe.id)}>X</button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        <tr key={ing.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                                            <td style={tdStyle}>{ing.rawMaterialName || '—'}</td>
                                                            <td style={tdStyleNum}>{ing.quantidade}</td>
                                                            <td style={tdStyleNum}>{Number(ing.precoKg).toFixed(2)}</td>
                                                            <td style={tdStyleNum}>R$ {totalRS.toFixed(2)}</td>
                                                            <td style={tdStyleNum}>{kg.toFixed(4)}</td>
                                                            <td style={tdStyleNum}>{pct.toFixed(2)}%</td>
                                                            <td style={tdStyleNum}>{icmsPct.toFixed(2)}%</td>
                                                            <td style={tdStyleNum}>R$ {icmsRS.toFixed(2)}</td>
                                                            <td style={tdStyle}>
                                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                                    <button className="btn-icon" title="Editar" onClick={() => startEditIngredient(ing)}>
                                                                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                                    </button>
                                                                    <button className="btn-icon" title="Excluir" style={{ color: 'var(--accent-danger)' }} onClick={() => handleDeleteIngredient(recipe.id, ing.id)}>
                                                                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                });
                                            })()}
                                            {/* Add ingredient row */}
                                            {!editingIngredient && (
                                                <tr style={{ background: '#f8fafc' }}>
                                                    <td style={tdStyle}>
                                                        <select className="form-select" style={{ fontSize: '13px' }} value={getIngForm(recipe.id).rawMaterialId} onChange={e => setIngField(recipe.id, 'rawMaterialId', e.target.value)}>
                                                            <option value="">Selecione matéria prima...</option>
                                                            {rawMaterials.map(rm => <option key={rm.id} value={rm.id}>{rm.name}</option>)}
                                                        </select>
                                                    </td>
                                                    <td style={tdStyle}><input className="form-input" style={inpStyle} type="number" placeholder="0" value={getIngForm(recipe.id).quantidade} onChange={e => setIngField(recipe.id, 'quantidade', e.target.value)} /></td>
                                                    <td style={tdStyle}><input className="form-input" style={inpStyle} type="number" step="0.01" placeholder="0.00" value={getIngForm(recipe.id).precoKg} onChange={e => setIngField(recipe.id, 'precoKg', e.target.value)} /></td>
                                                    <td style={tdStyleNum}></td>
                                                    <td style={tdStyleNum}></td>
                                                    <td style={tdStyleNum}></td>
                                                    <td style={tdStyleNum}></td>
                                                    <td style={tdStyleNum}></td>
                                                    <td style={tdStyle}>
                                                        <button
                                                            className="btn btn-primary"
                                                            style={{ padding: '4px 12px', fontSize: '12px' }}
                                                            onClick={() => handleSaveIngredient(recipe.id)}
                                                            disabled={!getIngForm(recipe.id).rawMaterialId}
                                                        >
                                                            + Adicionar
                                                        </button>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                        <tfoot>
                                            {(() => {
                                                const ings = expanded[recipe.id];
                                                const producao = Number(recipe.producaoReceita) || 1;
                                                const totalRS = ings.reduce((s, i) => s + (Number(i.quantidade) || 0) * (Number(i.precoKg) || 0), 0);
                                                const totalKG = ings.reduce((s, i) => s + (Number(i.quantidade) || 0) / producao, 0);
                                                const totalIcmsRS = ings.reduce((s, i) => {
                                                    const t = (Number(i.quantidade) || 0) * (Number(i.precoKg) || 0);
                                                    const rm = rawMaterials.find(r => r.id === i.rawMaterialId);
                                                    return s + ((Number(rm?.compraIcms) || 0) * t) / 100;
                                                }, 0);
                                                return (
                                                    <tr style={{ borderTop: '2px solid var(--border-color)', fontWeight: 700 }}>
                                                        <td style={tdStyle}>Total</td>
                                                        <td style={tdStyleNum}></td>
                                                        <td style={tdStyleNum}></td>
                                                        <td style={{ ...tdStyleNum, color: '#059669' }}>R$ {totalRS.toFixed(2)}</td>
                                                        <td style={{ ...tdStyleNum, color: 'var(--text-primary)' }}>{totalKG.toFixed(4)}</td>
                                                        <td style={tdStyleNum}>100.00%</td>
                                                        <td style={tdStyleNum}></td>
                                                        <td style={{ ...tdStyleNum, color: '#059669' }}>R$ {totalIcmsRS.toFixed(2)}</td>
                                                        <td style={tdStyle}></td>
                                                    </tr>
                                                );
                                            })()}
                                        </tfoot>
                                    </table>
                                    {expanded[recipe.id].length === 0 && (
                                        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px', marginTop: '12px' }}>
                                            Nenhum ingrediente. Use a linha acima para adicionar matérias primas.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* ── New / Edit Recipe Modal ────────────────────────── */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ marginTop: '5vh', alignSelf: 'flex-start' }}>
                        <div className="modal-header">
                            <h3>{editingRecipe ? 'Editar Receita' : 'Nova Receita'}</h3>
                            <button className="btn-icon" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSaveRecipe}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Produto <span className="required">*</span></label>
                                    <select
                                        className={`form-select ${errors.productId ? 'error' : ''}`}
                                        value={form.productId}
                                        onChange={e => setForm(prev => ({ ...prev, productId: e.target.value }))}
                                    >
                                        <option value="">Selecione um produto...</option>
                                        {productionProducts.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                    {errors.productId && <span style={{ color: 'var(--accent-danger)', fontSize: '12px' }}>{errors.productId}</span>}
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Quantidade Produção/mês Geral</label>
                                        <input
                                            className="form-input"
                                            type="number"
                                            placeholder="0"
                                            value={form.qtyGeralMes}
                                            onChange={e => setForm(prev => ({ ...prev, qtyGeralMes: e.target.value }))}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Quantidade Produção/mês Produto</label>
                                        <input
                                            className="form-input"
                                            type="number"
                                            placeholder="0"
                                            value={form.qtyProdutoMes}
                                            onChange={e => setForm(prev => ({ ...prev, qtyProdutoMes: e.target.value }))}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Produção por receita</label>
                                    <input
                                        className="form-input"
                                        type="number"
                                        placeholder="0"
                                        value={form.producaoReceita}
                                        onChange={e => setForm(prev => ({ ...prev, producaoReceita: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                                <button type="submit" className="btn btn-primary">{editingRecipe ? 'Salvar Alterações' : 'Criar Receita'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Delete Confirmation Modal ──────────────────────── */}
            {confirmDelete && (
                <div className="modal-overlay">
                    <div className="modal confirm-dialog" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Confirmar Exclusão</h3>
                            <button className="btn-icon" onClick={() => setConfirmDelete(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <p>Tem certeza que deseja excluir a receita de <strong>{confirmDelete.productName}</strong>?</p>
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Todos os ingredientes desta receita também serão removidos.</p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Cancelar</button>
                            <button className="btn" style={{ background: 'var(--accent-danger)', color: '#fff' }} onClick={handleDeleteRecipe}>Excluir</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Style helpers ────────────────────────────────────────────

const thStyle = {
    padding: '10px 12px',
    textAlign: 'center',
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
};

const tdStyle = {
    padding: '8px 12px',
    fontSize: '13px',
    color: 'var(--text-primary)',
    verticalAlign: 'middle',
    textAlign: 'center',
};

const tdStyleNum = {
    ...tdStyle,
    textAlign: 'center',
    fontWeight: 500,
};

const inpStyle = {
    fontSize: '13px',
    padding: '6px 10px',
    textAlign: 'center',
};
