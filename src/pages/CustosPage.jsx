import { useState } from 'react';

export default function CustosPage() {
    return (
        <div className="page-container">
            <div className="card" style={{ padding: '24px 28px' }}>
                <div className="page-header" style={{ marginBottom: '16px', padding: 0 }}>
                    <div className="page-header-left">
                        <h2>💰 Custos</h2>
                        <p>Análise e gestão de custos de produção</p>
                    </div>
                </div>

                <div className="empty-state">
                    <div className="empty-state-icon">💰</div>
                    <h4>Página de Custos</h4>
                    <p>Em desenvolvimento...</p>
                </div>
            </div>
        </div>
    );
}
