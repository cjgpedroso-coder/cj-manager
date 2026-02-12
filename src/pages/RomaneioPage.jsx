import { useState } from 'react';

export default function RomaneioPage() {
    return (
        <div className="page" style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div className="page-header">
                <h2>Romaneio</h2>
                <p className="page-subtitle">Gerencie os romaneios de entrega</p>
            </div>

            <div className="card">
                <div className="empty-state">
                    <div className="empty-state-icon">📋</div>
                    <h4>Nenhum romaneio cadastrado</h4>
                    <p>Os romaneios de entrega aparecerão aqui.</p>
                </div>
            </div>
        </div>
    );
}
