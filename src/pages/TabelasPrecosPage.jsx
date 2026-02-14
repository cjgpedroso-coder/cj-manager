import { useState, useEffect, useCallback } from 'react';
import { getPriceTableEntries, deletePriceTableEntry, clearPriceTableEntries } from '../utils/storage';

const TABELA_TIPOS = ['Comum', 'Retirada', 'Porta'];
const TABELAS = ['Volume', 'Mínimo', 'Médio', 'Máximo'];
const EMITENTES = ['S/NF', 'RMC', 'ROMICA'];

export default function TabelasPrecosPage() {
    const [entries, setEntries] = useState([]);
    const [tabelaTipo, setTabelaTipo] = useState('Comum');
    const [selectedTabelas, setSelectedTabelas] = useState({ Volume: true, 'Mínimo': true, 'Médio': true, 'Máximo': true });

    const refresh = useCallback(async () => {
        const data = await getPriceTableEntries();
        setEntries(data);
    }, []);

    useEffect(() => { refresh(); }, [refresh]);

    const toggleTabela = (t) => {
        setSelectedTabelas(prev => ({ ...prev, [t]: !prev[t] }));
    };

    // Filter entries for current tabelaTipo
    const filtered = entries.filter(e => e.tabelaTipo === tabelaTipo);

    // Get active tabela columns
    const activeTabelas = TABELAS.filter(t => selectedTabelas[t]);

    // Unique product rows: name + badge combo (preserve insertion order)
    const productRows = [];
    const seenKeys = new Set();
    filtered.forEach(e => {
        const key = `${e.productName}|||${e.regimeBadge}`;
        if (!seenKeys.has(key)) {
            seenKeys.add(key);
            productRows.push({ name: e.productName, badge: e.regimeBadge || '' });
        }
    });

    // Build lookup: "name|||badge" → { tabela → { emitente → entry } }
    const lookup = {};
    filtered.forEach(e => {
        const key = `${e.productName}|||${e.regimeBadge}`;
        if (!lookup[key]) lookup[key] = {};
        if (!lookup[key][e.tabela]) lookup[key][e.tabela] = {};
        lookup[key][e.tabela][e.emitente] = e;
    });

    const handleDeleteRow = async (name, badge) => {
        const toDelete = filtered.filter(e => e.productName === name && e.regimeBadge === badge);
        for (const e of toDelete) {
            await deletePriceTableEntry(e.id);
        }
        refresh();
    };

    const toggleBtnStyle = (active) => ({
        padding: '8px 18px', fontSize: '13px', fontWeight: 600,
        border: 'none', cursor: 'pointer',
        background: active ? 'var(--accent-primary)' : 'transparent',
        color: active ? 'white' : 'var(--text-secondary)',
        transition: 'all 0.2s',
    });

    const thStyle = {
        padding: '8px 10px', fontSize: '11px', fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.5px',
        color: 'var(--text-secondary)', textAlign: 'center',
        borderBottom: '2px solid var(--border-color)',
    };

    const tdStyle = {
        padding: '8px 10px', fontSize: '13px',
        fontFamily: 'monospace', textAlign: 'center',
        borderBottom: '1px solid var(--border-color)',
        color: 'var(--text-primary)',
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div className="page-header-left">
                    <h2>Tabelas de Preço</h2>
                    <p>Consulte e gerencie as tabelas de preço geradas</p>
                </div>
                {filtered.length > 0 && (
                    <button
                        onClick={async () => { await clearPriceTableEntries(); refresh(); }}
                        style={{
                            padding: '8px 16px', fontSize: '12px', fontWeight: 600,
                            border: '1px solid #ef4444', borderRadius: '8px', cursor: 'pointer',
                            background: 'transparent', color: '#ef4444',
                        }}
                    >
                        Limpar Tabela
                    </button>
                )}
            </div>

            {/* Level 1: Tabela Tipo toggle */}
            <div className="card" style={{ padding: '16px 20px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tipo:</span>
                    <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                        {TABELA_TIPOS.map(t => (
                            <button key={t} onClick={() => setTabelaTipo(t)} style={toggleBtnStyle(tabelaTipo === t)}>
                                Tabela {t}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Level 2: Multi-select tabelas (only for Comum) */}
                {tabelaTipo === 'Comum' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '14px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Colunas:</span>
                        <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                            {TABELAS.map(t => (
                                <button key={t} onClick={() => toggleTabela(t)} style={toggleBtnStyle(selectedTabelas[t])}>
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Price Table */}
            {tabelaTipo !== 'Comum' ? (
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-state-icon">🚧</div>
                        <h4>Em desenvolvimento</h4>
                        <p>Tabela {tabelaTipo} será implementada em breve.</p>
                    </div>
                </div>
            ) : productRows.length === 0 ? (
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-state-icon">📊</div>
                        <h4>Nenhum preço inserido</h4>
                        <p>Vá para a página Preço, configure um produto e clique em "Inserir Tabela".</p>
                    </div>
                </div>
            ) : (
                <div className="card" style={{ padding: '0', overflow: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: `${200 + activeTabelas.length * 300}px` }}>
                        <thead>
                            <tr>
                                <th rowSpan={2} style={{ ...thStyle, textAlign: 'left', minWidth: '200px', borderRight: '2px solid var(--border-color)', position: 'sticky', left: 0, background: 'var(--bg-primary)', zIndex: 2 }}>
                                    Produto
                                </th>
                                {activeTabelas.map(t => (
                                    <th key={t} colSpan={3} style={{ ...thStyle, fontSize: '12px', borderLeft: '2px solid var(--border-color)' }}>
                                        {t}
                                    </th>
                                ))}
                                <th rowSpan={2} style={{ ...thStyle, width: '50px', borderLeft: '2px solid var(--border-color)' }}></th>
                            </tr>
                            <tr>
                                {activeTabelas.map(t => (
                                    EMITENTES.map(em => (
                                        <th key={`${t}-${em}`} style={{
                                            ...thStyle, fontSize: '10px',
                                            borderLeft: em === 'S/NF' ? '2px solid var(--border-color)' : '1px solid var(--border-color)',
                                            background: em === 'ROMICA' ? 'rgba(37, 99, 235, 0.05)' : em === 'RMC' ? 'rgba(249, 115, 22, 0.05)' : 'rgba(107, 114, 128, 0.05)',
                                        }}>
                                            {em}
                                        </th>
                                    ))
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {productRows.map(({ name, badge }) => {
                                const rowKey = `${name}|||${badge}`;
                                return (
                                    <tr key={rowKey} style={{ transition: 'background 0.15s' }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                                        onMouseLeave={e => e.currentTarget.style.background = ''}
                                    >
                                        <td style={{
                                            ...tdStyle, textAlign: 'left', fontFamily: 'inherit', fontWeight: 600,
                                            borderRight: '2px solid var(--border-color)',
                                            position: 'sticky', left: 0, background: 'var(--bg-primary)', zIndex: 1,
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{
                                                    display: 'inline-block', padding: '2px 8px', fontSize: '10px', fontWeight: 700,
                                                    borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.3px',
                                                    background: badge === 'Simples' ? '#dcfce7' : '#dbeafe',
                                                    color: badge === 'Simples' ? '#166534' : '#1e40af',
                                                    border: badge === 'Simples' ? '1px solid #bbf7d0' : '1px solid #bfdbfe',
                                                }}>
                                                    {badge}
                                                </span>
                                                {name}
                                            </div>
                                        </td>
                                        {activeTabelas.map(t => (
                                            EMITENTES.map(em => {
                                                const entry = lookup[rowKey]?.[t]?.[em];
                                                return (
                                                    <td key={`${t}-${em}`} style={{
                                                        ...tdStyle,
                                                        borderLeft: em === 'S/NF' ? '2px solid var(--border-color)' : '1px solid var(--border-color)',
                                                        color: entry ? 'var(--text-primary)' : 'var(--text-secondary)',
                                                        fontWeight: entry ? 600 : 400,
                                                    }}>
                                                        {entry ? `R$ ${Number(entry.precoFinal).toFixed(2)}` : '—'}
                                                    </td>
                                                );
                                            })
                                        ))}
                                        <td style={{ ...tdStyle, borderLeft: '2px solid var(--border-color)' }}>
                                            <button
                                                onClick={() => handleDeleteRow(name, badge)}
                                                title="Remover produto"
                                                style={{
                                                    background: 'none', border: 'none', cursor: 'pointer',
                                                    color: '#ef4444', fontSize: '14px', padding: '4px',
                                                }}
                                            >
                                                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
