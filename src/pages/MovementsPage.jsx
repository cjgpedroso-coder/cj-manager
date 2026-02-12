import { useState, useCallback, useMemo } from 'react';
import { getMovements, getProducts, saveMovement, deleteMovement } from '../utils/storage';
import MovementModal from '../components/MovementModal';
import ConfirmDialog from '../components/ConfirmDialog';

export default function MovementsPage() {
    const [movements, setMovements] = useState(() => getMovements());
    const [products, setProducts] = useState(() => getProducts());
    const [showModal, setShowModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);

    // Filters
    const [filterType, setFilterType] = useState('');
    const [filterProduct, setFilterProduct] = useState('');
    const [filterDate, setFilterDate] = useState('');

    const refresh = useCallback(() => {
        setMovements(getMovements());
        setProducts(getProducts());
    }, []);

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
                return true;
            })
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }, [movements, filterType, filterProduct, filterDate]);

    function handleSave(data) {
        saveMovement(data);
        refresh();
        setShowModal(false);
    }

    function handleDeleteConfirm() {
        if (deleteTarget) {
            deleteMovement(deleteTarget.id);
            refresh();
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

    // Stats
    const stats = useMemo(() => {
        const today = new Date().toISOString().slice(0, 10);
        const todayMovements = movements.filter((m) => m.date === today);
        const totalEntradas = movements.filter((m) => m.type === 'entrada').reduce((s, m) => s + Number(m.quantity), 0);
        const totalSaidas = movements.filter((m) => m.type === 'saida').reduce((s, m) => s + Number(m.quantity), 0);
        return {
            total: movements.length,
            today: todayMovements.length,
            totalEntradas,
            totalSaidas,
        };
    }, [movements]);

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

            {/* Stats */}
            <div className="stats-grid">
                <div className="stat-card purple">
                    <div className="stat-icon purple">M</div>
                    <div className="stat-info">
                        <h3>{stats.total}</h3>
                        <p>Total de movimentações</p>
                    </div>
                </div>
                <div className="stat-card cyan">
                    <div className="stat-icon cyan">D</div>
                    <div className="stat-info">
                        <h3>{stats.today}</h3>
                        <p>Movimentações hoje</p>
                    </div>
                </div>
                <div className="stat-card green">
                    <div className="stat-icon green">E</div>
                    <div className="stat-info">
                        <h3>{stats.totalEntradas.toLocaleString('pt-BR')}</h3>
                        <p>Total de entradas</p>
                    </div>
                </div>
                <div className="stat-card red">
                    <div className="stat-icon red">S</div>
                    <div className="stat-info">
                        <h3>{stats.totalSaidas.toLocaleString('pt-BR')}</h3>
                        <p>Total de saídas</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="filter-bar">
                <select
                    className="form-select"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    style={{ minWidth: '160px' }}
                >
                    <option value="">Todos os tipos</option>
                    <option value="entrada">Entradas</option>
                    <option value="saida">Saidas</option>
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

                <span style={{ color: 'var(--text-muted)', fontSize: '13px', marginLeft: 'auto' }}>
                    {filtered.length} registro{filtered.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Table or Empty */}
            {filtered.length === 0 ? (
                <div className="card">
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
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Produto</th>
                                <th>Tipo</th>
                                <th>Quantidade</th>
                                <th>Observação</th>
                                <th>Registrado em</th>
                                <th style={{ width: '60px' }}>Ação</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((m) => (
                                <tr key={m.id}>
                                    <td style={{ fontWeight: 500 }}>{formatDate(m.date)}</td>
                                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                                        {productMap[m.productId]?.name || 'Produto removido'}
                                    </td>
                                    <td>
                                        <span className={`badge badge-${m.type}`}>
                                            {m.type === 'entrada' ? 'Entrada' : 'Saida'}
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: 600 }}>{m.quantity}</td>
                                    <td style={{ maxWidth: '200px' }} className="text-truncate">
                                        {m.observation || '—'}
                                    </td>
                                    <td style={{ fontSize: '13px' }}>{formatDateTime(m.createdAt)}</td>
                                    <td>
                                        <button
                                            className="btn-icon danger"
                                            onClick={() => setDeleteTarget(m)}
                                            title="Excluir"
                                        >
                                            Excluir
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Movement Modal */}
            {showModal && (
                <MovementModal
                    onSave={handleSave}
                    onClose={() => setShowModal(false)}
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
