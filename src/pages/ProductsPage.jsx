import { useState, useCallback, useEffect } from 'react';
import { getProducts, saveProduct, deleteProduct, getRawMaterials, saveRawMaterial, deleteRawMaterial } from '../utils/storage';
import ProductModal from '../components/ProductModal';
import RawMaterialModal from '../components/RawMaterialModal';
import ConfirmDialog from '../components/ConfirmDialog';

export default function ProductsPage() {
    const [tab, setTab] = useState('produtos'); // 'produtos' | 'materias'
    const [products, setProducts] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editProduct, setEditProduct] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    // Raw material modal
    const [showMaterialModal, setShowMaterialModal] = useState(false);
    const [editMaterial, setEditMaterial] = useState(null);
    const [deleteMaterialTarget, setDeleteMaterialTarget] = useState(null);

    const refreshProducts = useCallback(async () => {
        setProducts(await getProducts());
    }, []);

    const refreshMaterials = useCallback(async () => {
        setMaterials(await getRawMaterials());
    }, []);

    useEffect(() => {
        refreshProducts();
        refreshMaterials();
    }, [refreshProducts, refreshMaterials]);

    // ── Products ─────────────────────────────────────────────
    const filteredProducts = products.filter((p) => {
        const q = search.toLowerCase();
        return (
            p.name?.toLowerCase().includes(q) ||
            p.category?.toLowerCase().includes(q) ||
            p.embalagem?.toLowerCase().includes(q) ||
            p.gramatura?.toLowerCase().includes(q)
        );
    });

    async function handleSave(data) {
        await saveProduct(data);
        await refreshProducts();
        setShowModal(false);
        setEditProduct(null);
    }

    function handleEdit(product) {
        setEditProduct(product);
        setShowModal(true);
    }

    async function handleDeleteConfirm() {
        if (deleteTarget) {
            await deleteProduct(deleteTarget.id);
            await refreshProducts();
            setDeleteTarget(null);
        }
    }

    // ── Raw Materials ────────────────────────────────────────
    const filteredMaterials = materials.filter((m) => {
        const q = search.toLowerCase();
        return (
            m.name?.toLowerCase().includes(q) ||
            m.embalagem?.toLowerCase().includes(q) ||
            m.gramatura?.toLowerCase().includes(q)
        );
    });

    function openMaterialModal(material = null) {
        setEditMaterial(material || null);
        setShowMaterialModal(true);
    }

    async function handleMaterialSave(data) {
        await saveRawMaterial(data);
        await refreshMaterials();
        setShowMaterialModal(false);
        setEditMaterial(null);
    }

    async function handleDeleteMaterialConfirm() {
        if (deleteMaterialTarget) {
            await deleteRawMaterial(deleteMaterialTarget.id);
            await refreshMaterials();
            setDeleteMaterialTarget(null);
        }
    }

    const toggleStyle = (active) => ({
        flex: 1,
        padding: '8px 16px',
        border: 'none',
        borderRadius: '8px',
        fontWeight: 600,
        fontSize: '13px',
        cursor: 'pointer',
        transition: 'all 200ms ease',
        background: active ? '#059669' : 'transparent',
        color: active ? '#fff' : '#6b7280',
    });

    return (
        <div className="page-container">
            <div className="card" style={{ padding: '24px 28px' }}>
                {/* Toggle Switch */}
                <div style={{
                    display: 'flex',
                    background: '#f3f4f6',
                    borderRadius: '10px',
                    padding: '3px',
                    marginBottom: '20px',
                    maxWidth: '340px',
                }}>
                    <button
                        style={toggleStyle(tab === 'produtos')}
                        onClick={() => { setTab('produtos'); setSearch(''); }}
                    >
                        Produtos
                    </button>
                    <button
                        style={toggleStyle(tab === 'materias')}
                        onClick={() => { setTab('materias'); setSearch(''); }}
                    >
                        Matérias Primas
                    </button>
                </div>

                {/* ═══ PRODUTOS TAB ═══ */}
                {tab === 'produtos' && (
                    <>
                        <div className="page-header" style={{ marginBottom: 0 }}>
                            <div className="page-header-left">
                                <h2>Produtos</h2>
                                <p>Gerencie o catálogo de produtos do seu estoque</p>
                            </div>
                            <button className="btn btn-primary" onClick={() => { setEditProduct(null); setShowModal(true); }}>
                                ＋ Novo Produto
                            </button>
                        </div>

                        <div className="filter-bar">
                            <div className="search-bar" style={{ flex: 0.5 }}>
                                <span className="search-icon">Q</span>
                                <input
                                    className="form-input"
                                    placeholder="Buscar por Nome, Categoria, Embalagem e Gramatura..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                                {filteredProducts.length} produto{filteredProducts.length !== 1 ? 's' : ''} encontrado{filteredProducts.length !== 1 ? 's' : ''}
                            </span>
                        </div>

                        {filteredProducts.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon">--</div>
                                <h4>{products.length === 0 ? 'Nenhum produto cadastrado' : 'Nenhum resultado'}</h4>
                                <p>
                                    {products.length === 0
                                        ? 'Comece cadastrando seu primeiro produto clicando no botão acima.'
                                        : 'Tente ajustar os termos da busca.'}
                                </p>
                            </div>
                        ) : (
                            <div className="table-wrapper" style={{ maxHeight: '620px', overflowY: 'auto' }}>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Produto</th>
                                            <th>Categoria</th>
                                            <th>Embalagem</th>
                                            <th>Gramatura</th>
                                            <th>Estoque</th>
                                            <th>Status</th>
                                            <th style={{ width: '100px' }}>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredProducts.map((p) => {
                                            const saldo = Number(p.saldo ?? p.currentStock) || 0;
                                            const isLow = p.minStock && saldo <= Number(p.minStock);
                                            return (
                                                <tr key={p.id}>
                                                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{p.name}</td>
                                                    <td>{p.category || '—'}</td>
                                                    <td>{p.embalagem || '—'}</td>
                                                    <td>{p.gramatura || '—'}</td>
                                                    <td style={{ fontWeight: 600 }}>{saldo}</td>
                                                    <td>
                                                        {saldo === 0 ? (
                                                            <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.10)', color: '#dc2626' }}>Sem estoque</span>
                                                        ) : isLow ? (
                                                            <span className="badge" style={{ background: 'rgba(234, 179, 8, 0.12)', color: '#ca8a04' }}>Baixo</span>
                                                        ) : (
                                                            <span className="badge badge-ok">OK</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                                            <button className="btn-icon" onClick={() => handleEdit(p)} title="Editar" style={{ fontSize: '16px', color: '#2563eb' }}>
                                                                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ verticalAlign: 'middle' }}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                className="btn-icon danger"
                                                                onClick={() => setDeleteTarget(p)}
                                                                title="Excluir"
                                                                style={{ fontSize: '16px', color: '#dc2626' }}
                                                            >
                                                                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ verticalAlign: 'middle' }}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}

                {/* ═══ MATÉRIAS PRIMAS TAB ═══ */}
                {tab === 'materias' && (
                    <>
                        <div className="page-header" style={{ marginBottom: 0 }}>
                            <div className="page-header-left">
                                <h2>Matérias Primas</h2>
                                <p>Gerencie as matérias primas do estoque</p>
                            </div>
                            <button className="btn btn-primary" onClick={() => openMaterialModal()}>
                                ＋ Nova Matéria Prima
                            </button>
                        </div>

                        <div className="filter-bar">
                            <div className="search-bar" style={{ flex: 0.5 }}>
                                <span className="search-icon">Q</span>
                                <input
                                    className="form-input"
                                    placeholder="Buscar por Nome, Embalagem ou Gramatura..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                                {filteredMaterials.length} matéria{filteredMaterials.length !== 1 ? 's' : ''} prima{filteredMaterials.length !== 1 ? 's' : ''} encontrada{filteredMaterials.length !== 1 ? 's' : ''}
                            </span>
                        </div>

                        {filteredMaterials.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon">--</div>
                                <h4>{materials.length === 0 ? 'Nenhuma matéria prima cadastrada' : 'Nenhum resultado'}</h4>
                                <p>
                                    {materials.length === 0
                                        ? 'Comece cadastrando sua primeira matéria prima clicando no botão acima.'
                                        : 'Tente ajustar os termos da busca.'}
                                </p>
                            </div>
                        ) : (
                            <div className="table-wrapper" style={{ maxHeight: '620px', overflowY: 'auto' }}>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Matéria Prima</th>
                                            <th>Embalagem</th>
                                            <th>Gramatura</th>
                                            <th>Estoque</th>
                                            <th>Status</th>
                                            <th style={{ width: '100px' }}>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredMaterials.map((m) => {
                                            const stock = Number(m.currentStock) || 0;
                                            const isLow = m.minStock && stock <= Number(m.minStock);
                                            return (
                                                <tr key={m.id}>
                                                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{m.name}</td>
                                                    <td>{m.embalagem || '—'}</td>
                                                    <td>{m.gramatura || '—'}</td>
                                                    <td style={{ fontWeight: 600 }}>{stock}</td>
                                                    <td>
                                                        {stock === 0 ? (
                                                            <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.10)', color: '#dc2626' }}>Sem estoque</span>
                                                        ) : isLow ? (
                                                            <span className="badge" style={{ background: 'rgba(234, 179, 8, 0.12)', color: '#ca8a04' }}>Baixo</span>
                                                        ) : (
                                                            <span className="badge badge-ok">OK</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                                            <button className="btn-icon" onClick={() => openMaterialModal(m)} title="Editar" style={{ fontSize: '16px', color: '#2563eb' }}>
                                                                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ verticalAlign: 'middle' }}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                className="btn-icon danger"
                                                                onClick={() => setDeleteMaterialTarget(m)}
                                                                title="Excluir"
                                                                style={{ fontSize: '16px', color: '#dc2626' }}
                                                            >
                                                                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ verticalAlign: 'middle' }}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Product Modal */}
            {showModal && (
                <ProductModal
                    product={editProduct}
                    onSave={handleSave}
                    onClose={() => { setShowModal(false); setEditProduct(null); }}
                />
            )}

            {/* Delete Product Confirmation */}
            {deleteTarget && (
                <ConfirmDialog
                    title="Excluir Produto"
                    message={`Tem certeza que deseja excluir "${deleteTarget.name}"? Esta ação não pode ser desfeita.`}
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setDeleteTarget(null)}
                />
            )}

            {/* ═══ RAW MATERIAL MODAL ═══ */}
            {showMaterialModal && (
                <RawMaterialModal
                    material={editMaterial}
                    onSave={handleMaterialSave}
                    onClose={() => { setShowMaterialModal(false); setEditMaterial(null); }}
                />
            )}

            {/* Delete Material Confirmation */}
            {deleteMaterialTarget && (
                <ConfirmDialog
                    title="Excluir Matéria Prima"
                    message={`Tem certeza que deseja excluir "${deleteMaterialTarget.name}"? Esta ação não pode ser desfeita.`}
                    onConfirm={handleDeleteMaterialConfirm}
                    onCancel={() => setDeleteMaterialTarget(null)}
                />
            )}
        </div>
    );
}
