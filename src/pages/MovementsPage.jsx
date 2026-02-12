import { useState, useCallback, useMemo, useEffect } from 'react';
import { getMovements, getProducts, saveMovement, deleteMovement, updateMovement } from '../utils/storage';
import MovementModal from '../components/MovementModal';
import ConfirmDialog from '../components/ConfirmDialog';

export default function MovementsPage() {
    const [movements, setMovements] = useState([]);
    const [products, setProducts] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editMovement, setEditMovement] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    // Filters
    const [filterType, setFilterType] = useState('');
    const [filterProduct, setFilterProduct] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [searchVendedor, setSearchVendedor] = useState('');

    const refresh = useCallback(async () => {
        setMovements(await getMovements());
        setProducts(await getProducts());
    }, []);

    useEffect(() => { refresh(); }, [refresh]);

    const productMap = useMemo(() => {
        const map = {};
        products.forEach((p) => (map[p.id] = p));
        return map;
    }, [products]);

    const filtered = useMemo(() => {
        return movements
            .filter((m) => {
                if (filterType && m.type !== filterType) return false;
                if (filterProduct && m.productId !== filterProduct) return false;
                if (filterDate && m.date !== filterDate) return false;
                if (searchVendedor && !(m.vendedor || '').toLowerCase().includes(searchVendedor.toLowerCase())) return false;
                return true;
            })
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }, [movements, filterType, filterProduct, filterDate]);

    async function handleSave(data) {
        if (editMovement) {
            await updateMovement(editMovement.id, data);
            setEditMovement(null);
        } else {
            await saveMovement(data);
        }
        await refresh();
        setShowModal(false);
    }

    function handleEdit(m) {
        setEditMovement(m);
        setShowModal(true);
    }

    async function handleDeleteConfirm() {
        if (deleteTarget) {
            await deleteMovement(deleteTarget.id);
            await refresh();
            setDeleteTarget(null);
        }
    }

    function formatDate(dateStr) {
        if (!dateStr) return '—';
        const parts = dateStr.split('-');
        if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
        return dateStr;
    }

    function formatDateTime(dateStr) {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    // Stats — filtered by date and product (ignore Tipos filter)
    const stats = useMemo(() => {
        const byDateAndProduct = movements.filter((m) => {
            if (filterDate && m.date !== filterDate) return false;
            if (filterProduct && m.productId !== filterProduct) return false;
            return true;
        });
        const totalEntradas = byDateAndProduct.reduce((s, m) => s + (Number(m.entrada) || 0), 0);
        const totalSaidas = byDateAndProduct.reduce((s, m) => s + (Number(m.saida) || 0), 0);
        const totalRetorno = byDateAndProduct.reduce((s, m) => s + (Number(m.retorno) || 0), 0);
        const totalTrocas = byDateAndProduct.reduce((s, m) => s + (Number(m.trocas) || 0), 0);
        return {
            total: byDateAndProduct.length,
            totalEntradas,
            totalSaidas,
            totalRetorno,
            totalTrocas,
        };
    }, [movements, filterDate, filterProduct]);

    // Saldo Atual — from products, based on product filter
    const saldoInfo = useMemo(() => {
        if (filterProduct && productMap[filterProduct]) {
            return {
                value: Number(productMap[filterProduct].saldo) || 0,
                label: productMap[filterProduct].name,
            };
        }
        const total = products.reduce((s, p) => s + (Number(p.saldo) || 0), 0);
        return { value: total, label: 'Total de produtos' };
    }, [filterProduct, productMap, products]);

    return (
        <div className="page-container">
            <div className="page-header">
                <div className="page-header-left">
                    <h2>Movimentações</h2>
                    <p>Registre entradas e saídas de estoque</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    ＋ Nova Movimentação
                </button>
            </div>
            {/* Filters + Stats Card */}
            <div className="card" style={{ padding: '20px 24px' }}>
                {/* Filters */}
                <div className="filter-bar" style={{ margin: 0, marginBottom: '20px' }}>
                    <select
                        className="form-select"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        style={{ minWidth: '160px' }}
                    >
                        <option value="">Todos os tipos</option>
                        <option value="entrada">Entradas</option>
                        <option value="saida">Saídas</option>
                        <option value="retorno">Retornos</option>
                        <option value="trocas">Trocas</option>
                    </select>

                    <select
                        className="form-select"
                        value={filterProduct}
                        onChange={(e) => setFilterProduct(e.target.value)}
                        style={{ minWidth: '200px' }}
                    >
                        <option value="">Todos os produtos</option>
                        {products.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>

                    <input
                        className="form-input"
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        style={{ minWidth: '160px' }}
                    />

                    {(filterType || filterProduct || filterDate) && (
                        <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => { setFilterType(''); setFilterProduct(''); setFilterDate(''); }}
                        >
                            ✕ Limpar filtros
                        </button>
                    )}
                </div>

                {/* Stats Title */}
                <h4 style={{ margin: '0 0 16px 0', fontSize: '17px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {filterDate
                        ? new Date(filterDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
                        : 'Todas as datas'}
                    {' — '}
                    {filterProduct && productMap[filterProduct]
                        ? productMap[filterProduct].name
                        : 'Todos os produtos'}
                </h4>

                {/* Stats Grid */}
                <div className="stats-grid" style={{ margin: 0, gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    <div className="stat-card cyan">
                        <div className="stat-icon cyan">M</div>
                        <div className="stat-info">
                            <h3>{stats.total}</h3>
                            <p>Movimentações</p>
                        </div>
                    </div>
                    <div className="stat-card green">
                        <div className="stat-icon green">E</div>
                        <div className="stat-info">
                            <h3>{stats.totalEntradas.toLocaleString('pt-BR')}</h3>
                            <p>Entrada</p>
                        </div>
                    </div>
                    <div className="stat-card red">
                        <div className="stat-icon red">S</div>
                        <div className="stat-info">
                            <h3>{stats.totalSaidas.toLocaleString('pt-BR')}</h3>
                            <p>Saída</p>
                        </div>
                    </div>
                    <div className="stat-card green">
                        <div className="stat-icon green">R</div>
                        <div className="stat-info">
                            <h3>{stats.totalRetorno.toLocaleString('pt-BR')}</h3>
                            <p>Retorno</p>
                        </div>
                    </div>
                    <div className="stat-card red">
                        <div className="stat-icon red">T</div>
                        <div className="stat-info">
                            <h3>{stats.totalTrocas.toLocaleString('pt-BR')}</h3>
                            <p>Trocas</p>
                        </div>
                    </div>
                    <div className="stat-card cyan">
                        <div className="stat-icon cyan">$</div>
                        <div className="stat-info">
                            <h3>{saldoInfo.value.toLocaleString('pt-BR')}</h3>
                            <p>Saldo Atual</p>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{saldoInfo.label}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table or Empty */}
            {filtered.length === 0 ? (
                <div className="card" style={{ marginTop: '12px' }}>
                    <div className="empty-state">
                        <div className="empty-state-icon">--</div>
                        <h4>{movements.length === 0 ? 'Nenhuma movimentação registrada' : 'Nenhum resultado'}</h4>
                        <p>
                            {movements.length === 0
                                ? 'Registre a primeira movimentação de estoque clicando no botão acima.'
                                : 'Tente ajustar os filtros aplicados.'}
                        </p>
                    </div>
                </div>
            ) : (
                <div style={{ marginTop: '12px' }}>
                    <div className="card" style={{ padding: '16px 20px', marginBottom: '12px' }}>
                        <input
                            className="form-input"
                            type="text"
                            placeholder="Buscar por Caixa/Produção..."
                            value={searchVendedor}
                            onChange={(e) => setSearchVendedor(e.target.value)}
                            style={{ width: '40%', border: '1.5px solid #999' }}
                        />
                    </div>
                    <div className="table-wrapper" style={{ maxHeight: '620px', overflowY: 'auto' }}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Caixa/Produção</th>
                                    <th>Produto</th>
                                    <th>Entrada</th>
                                    <th>Saída</th>
                                    <th>Retorno</th>
                                    <th>Troca</th>
                                    <th style={{ width: '90px' }}>Ação</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((m) => {
                                    const product = productMap[m.productId];
                                    return (
                                        <tr key={m.id}>
                                            <td style={{ fontWeight: 500 }}>{formatDate(m.date)}</td>
                                            <td>{m.vendedor || '—'}</td>
                                            <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                                                {product?.name || 'Produto removido'}
                                            </td>
                                            <td style={{ fontWeight: 600, color: '#059669' }}>{m.entrada || 0}</td>
                                            <td style={{ fontWeight: 600, color: '#dc2626' }}>{m.saida || 0}</td>
                                            <td style={{ fontWeight: 600, color: '#2563eb' }}>{m.retorno || 0}</td>
                                            <td style={{ fontWeight: 600, color: '#d97706' }}>{m.trocas || 0}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                    <button
                                                        className="btn-icon danger"
                                                        onClick={() => setDeleteTarget(m)}
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
                    <span style={{ display: 'block', textAlign: 'right', color: 'var(--text-muted)', fontSize: '13px', padding: '8px 4px 0' }}>
                        {filtered.length} registro{filtered.length !== 1 ? 's' : ''}
                    </span>
                </div>
            )}

            {/* Movement Modal */}
            {showModal && (
                <MovementModal
                    key={editMovement ? editMovement.id : 'new'}
                    movement={editMovement}
                    onSave={handleSave}
                    onClose={() => { setShowModal(false); setEditMovement(null); }}
                />
            )}

            {/* Delete Confirmation */}
            {deleteTarget && (
                <ConfirmDialog
                    title="Excluir Movimentação"
                    message="Tem certeza que deseja excluir esta movimentação? O estoque será revertido automaticamente."
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setDeleteTarget(null)}
                />
            )}
        </div>
    );
}
