import { useState, useMemo, useEffect } from 'react';
import { getProducts, getMovements } from '../utils/storage';

export default function DashboardPage() {
    const [products, setProducts] = useState([]);
    const [movements, setMovements] = useState([]);

    useEffect(() => {
        async function load() {
            setProducts(await getProducts());
            setMovements(await getMovements());
        }
        load();
    }, []);

    const stats = useMemo(() => {
        const totalProducts = products.length;

        const totalStockValue = products.reduce((sum, p) => {
            return sum + (Number(p.currentStock) || 0) * (Number(p.costPrice) || 0);
        }, 0);

        const lowStockProducts = products.filter(
            (p) => p.minStock && Number(p.currentStock) <= Number(p.minStock)
        );

        const totalItems = products.reduce((sum, p) => sum + (Number(p.currentStock) || 0), 0);

        return { totalProducts, totalStockValue, lowStockProducts, totalItems };
    }, [products]);

    const recentMovements = useMemo(() => {
        return [...movements]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 8)
            .map((m) => ({
                ...m,
                productName: products.find((p) => p.id === m.productId)?.name || 'Produto removido',
            }));
    }, [movements, products]);

    function formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    }

    function formatDate(dateStr) {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <div className="page-header-left">
                    <h2>Gerador de Preço</h2>
                    <p>Visão geral do seu estoque</p>
                </div>
            </div>

            {/* Stats */}
            <div className="stats-grid">
                <div className="stat-card purple">
                    <div className="stat-icon purple">P</div>
                    <div className="stat-info">
                        <h3>{stats.totalProducts}</h3>
                        <p>Produtos cadastrados</p>
                    </div>
                </div>

                <div className="stat-card cyan">
                    <div className="stat-icon cyan">C</div>
                    <div className="stat-info">
                        <h3>{stats.totalItems.toLocaleString('pt-BR')}</h3>
                        <p>Itens em estoque</p>
                    </div>
                </div>

                <div className="stat-card green">
                    <div className="stat-icon green">$</div>
                    <div className="stat-info">
                        <h3 className="currency">{formatCurrency(stats.totalStockValue)}</h3>
                        <p>Valor total em estoque</p>
                    </div>
                </div>

                <div className="stat-card orange">
                    <div className="stat-icon orange">!</div>
                    <div className="stat-info">
                        <h3>{stats.lowStockProducts.length}</h3>
                        <p>Abaixo do mínimo</p>
                    </div>
                </div>
            </div>

            <div className="dashboard-grid">
                {/* Recent Movements */}
                <div className="card">
                    <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
                        Últimas Movimentações
                    </h3>
                    {recentMovements.length === 0 ? (
                        <div className="empty-state" style={{ padding: '30px 10px' }}>
                            <div className="empty-state-icon">--</div>
                            <h4>Sem movimentações</h4>
                            <p>As movimentações recentes aparecerão aqui.</p>
                        </div>
                    ) : (
                        <div className="activity-list">
                            {recentMovements.map((m) => (
                                <div key={m.id} className="activity-item">
                                    <div className={`activity-dot ${m.type}`} />
                                    <div className="activity-info">
                                        <p>{m.productName}</p>
                                        <span>{formatDate(m.createdAt)}</span>
                                    </div>
                                    <span className={`activity-qty ${m.type}`}>
                                        {m.type === 'entrada' ? '+' : '-'}{m.quantity}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Low Stock Alerts */}
                <div className="card">
                    <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
                        Alertas de Estoque Baixo
                    </h3>
                    {stats.lowStockProducts.length === 0 ? (
                        <div className="empty-state" style={{ padding: '30px 10px' }}>
                            <div className="empty-state-icon">OK</div>
                            <h4>Tudo certo!</h4>
                            <p>Nenhum produto está abaixo do estoque mínimo.</p>
                        </div>
                    ) : (
                        <div className="table-wrapper" style={{ border: 'none' }}>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Produto</th>
                                        <th>Atual</th>
                                        <th>Mínimo</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.lowStockProducts.map((p) => (
                                        <tr key={p.id}>
                                            <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{p.name}</td>
                                            <td>{p.currentStock}</td>
                                            <td>{p.minStock}</td>
                                            <td>
                                                <span className="badge badge-low">! Baixo</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
