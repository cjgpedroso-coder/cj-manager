import { useState, useCallback } from 'react';
import { getProducts, saveProduct, deleteProduct } from '../utils/storage';
import ProductModal from '../components/ProductModal';
import ConfirmDialog from '../components/ConfirmDialog';

export default function ProductsPage() {
    const [products, setProducts] = useState(() => getProducts());
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editProduct, setEditProduct] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const refresh = useCallback(() => setProducts(getProducts()), []);

    const filtered = products.filter((p) => {
        const q = search.toLowerCase();
        return (
            p.name?.toLowerCase().includes(q) ||
            p.sku?.toLowerCase().includes(q) ||
            p.category?.toLowerCase().includes(q)
        );
    });

    function handleSave(data) {
        saveProduct(data);
        refresh();
        setShowModal(false);
        setEditProduct(null);
    }

    function handleEdit(product) {
        setEditProduct(product);
        setShowModal(true);
    }

    function handleDeleteConfirm() {
        if (deleteTarget) {
            deleteProduct(deleteTarget.id);
            refresh();
            setDeleteTarget(null);
        }
    }

    function formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value || 0);
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <div className="page-header-left">
                    <h2>Produtos</h2>
                    <p>Gerencie o catálogo de produtos do seu estoque</p>
                </div>
                <button className="btn btn-primary" onClick={() => { setEditProduct(null); setShowModal(true); }}>
                    ＋ Novo Produto
                </button>
            </div>

            {/* Filter / Search */}
            <div className="filter-bar">
                <div className="search-bar">
                    <span className="search-icon">Q</span>
                    <input
                        className="form-input"
                        placeholder="Buscar por nome, SKU ou categoria..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                    {filtered.length} produto{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Table or Empty */}
            {filtered.length === 0 ? (
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-state-icon">--</div>
                        <h4>{products.length === 0 ? 'Nenhum produto cadastrado' : 'Nenhum resultado'}</h4>
                        <p>
                            {products.length === 0
                                ? 'Comece cadastrando seu primeiro produto clicando no botão acima.'
                                : 'Tente ajustar os termos da busca.'}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Produto</th>
                                <th>SKU</th>
                                <th>Categoria</th>
                                <th>Unidade</th>
                                <th>Estoque</th>
                                <th>Custo</th>
                                <th>Venda</th>
                                <th>Status</th>
                                <th style={{ width: '100px' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((p) => {
                                const isLow = p.minStock && Number(p.currentStock) <= Number(p.minStock);
                                return (
                                    <tr key={p.id}>
                                        <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{p.name}</td>
                                        <td>{p.sku || '—'}</td>
                                        <td>{p.category || '—'}</td>
                                        <td>{p.unit || 'un'}</td>
                                        <td style={{ fontWeight: 600 }}>{p.currentStock ?? 0}</td>
                                        <td className="currency">{formatCurrency(p.costPrice)}</td>
                                        <td className="currency">{formatCurrency(p.salePrice)}</td>
                                        <td>
                                            {isLow ? (
                                                <span className="badge badge-low">! Baixo</span>
                                            ) : (
                                                <span className="badge badge-ok">OK</span>
                                            )}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                <button className="btn-icon" onClick={() => handleEdit(p)} title="Editar">
                                                    Editar
                                                </button>
                                                <button
                                                    className="btn-icon danger"
                                                    onClick={() => setDeleteTarget(p)}
                                                    title="Excluir"
                                                >
                                                    Excluir
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

            {/* Product Modal */}
            {showModal && (
                <ProductModal
                    product={editProduct}
                    onSave={handleSave}
                    onClose={() => { setShowModal(false); setEditProduct(null); }}
                />
            )}

            {/* Delete Confirmation */}
            {deleteTarget && (
                <ConfirmDialog
                    title="Excluir Produto"
                    message={`Tem certeza que deseja excluir "${deleteTarget.name}"? Esta ação não pode ser desfeita.`}
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setDeleteTarget(null)}
                />
            )}
        </div>
    );
}
