import { useState } from 'react';

export default function PedidosPage() {
    return (
        <div className="page" style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div className="page-header">
                <h2>Pedidos</h2>
                <p className="page-subtitle">Gerencie os pedidos do sistema</p>
            </div>

            <div className="card">
                <div className="empty-state">
                    <div className="empty-state-icon">📦</div>
                    <h4>Nenhum pedido cadastrado</h4>
                    <p>Os pedidos aparecerão aqui.</p>
                </div>
            </div>
        </div>
    );
}
