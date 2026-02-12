import { useState, useEffect, useCallback } from 'react';
import { getProducts, getRawMaterials } from '../utils/storage';

const API = 'http://localhost:3001/api';

const TAX_FIELDS = [
    { key: 'compraPreco', group: 'compra', label: 'Preço(R$)', prefix: 'R$' },
    { key: 'compraIcms', group: 'compra', label: 'ICMS(%)', suffix: '%' },
    { key: 'vendaIcms', group: 'venda', label: 'ICMS(%)', suffix: '%' },
    { key: 'vendaPis', group: 'venda', label: 'PIS(%)', suffix: '%' },
    { key: 'vendaCofins', group: 'venda', label: 'COFINS(%)', suffix: '%' },
    { key: 'vendaIr', group: 'venda', label: 'IR(%)', suffix: '%' },
    { key: 'vendaCs', group: 'venda', label: 'CS(%)', suffix: '%' },
    { key: 'vendaIbs', group: 'venda', label: 'IBS(%)', suffix: '%' },
    { key: 'vendaCbs', group: 'venda', label: 'CBS(%)', suffix: '%' },
];

export default function RegrasTributariasPage() {
    const [tab, setTab] = useState('produtos');
    const [products, setProducts] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [search, setSearch] = useState('');
    const [editingCell, setEditingCell] = useState(null); // { id, field }
    const [editValue, setEditValue] = useState('');
    const [saving, setSaving] = useState(false);

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

    const items = tab === 'produtos' ? products : materials;
    const tableName = tab === 'produtos' ? 'products' : 'raw_materials';

    const filteredItems = items.filter((item) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            item.name?.toLowerCase().includes(q) ||
            item.category?.toLowerCase().includes(q)
        );
    });

    // ── Inline editing ──────────────────────────────────────
    function startEdit(id, field, currentValue) {
        setEditingCell({ id, field });
        setEditValue(String(currentValue || 0).replace('.', ','));
    }

    async function saveEdit() {
        if (!editingCell) return;
        setSaving(true);

        const item = items.find((i) => i.id === editingCell.id);
        if (!item) { setSaving(false); return; }

        const taxData = {};
        TAX_FIELDS.forEach((f) => {
            taxData[f.key] = f.key === editingCell.field
                ? (parseFloat(editValue.replace(',', '.')) || 0)
                : (Number(item[f.key]) || 0);
        });

        try {
            await fetch(`${API}/tax/${tableName}/${editingCell.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taxData),
            });
            if (tab === 'produtos') await refreshProducts();
            else await refreshMaterials();
        } catch { /* ignore */ }

        setEditingCell(null);
        setEditValue('');
        setSaving(false);
    }

    function cancelEdit() {
        setEditingCell(null);
        setEditValue('');
    }

    function handleKeyDown(e) {
        if (e.key === 'Enter') saveEdit();
        if (e.key === 'Escape') cancelEdit();
    }

    // ── Toggle style ────────────────────────────────────────
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

    // ── Cell renderer ───────────────────────────────────────
    function renderCell(item, field) {
        // Produção products: Compra columns are disabled
        const isProducao = item.category === 'Produção' || (tab === 'materias' && false);
        if (isProducao && field.group === 'compra') {
            return (
                <span style={{
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    color: '#9ca3af',
                    padding: '3px 6px',
                }}>
                    —
                </span>
            );
        }

        const isEditing = editingCell?.id === item.id && editingCell?.field === field.key;
        const val = Number(item[field.key]) || 0;

        if (isEditing) {
            return (
                <input
                    autoFocus
                    className="form-input"
                    type="text"
                    inputMode="decimal"
                    value={editValue}
                    onChange={(e) => {
                        const v = e.target.value.replace(/[^0-9,.-]/g, '');
                        setEditValue(v);
                    }}
                    onBlur={saveEdit}
                    onKeyDown={handleKeyDown}
                    disabled={saving}
                    style={{
                        width: '80px',
                        padding: '4px 6px',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        textAlign: 'right',
                    }}
                />
            );
        }

        const display = field.prefix
            ? `${field.prefix} ${val.toFixed(2)}`
            : `${val.toFixed(2)}${field.suffix || ''}`;

        return (
            <span
                onClick={() => startEdit(item.id, field.key, val)}
                style={{
                    cursor: 'pointer',
                    padding: '3px 6px',
                    borderRadius: '4px',
                    transition: 'background 150ms',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    color: val === 0 ? '#dc2626' : 'inherit',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(5, 150, 105, 0.08)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                title="Clique para editar"
            >
                {display}
            </span>
        );
    }

    return (
        <div className="page-container">
            <div className="card" style={{ padding: '24px 28px' }}>
                {/* Header */}
                <div className="page-header" style={{ marginBottom: '16px', padding: 0 }}>
                    <div className="page-header-left">
                        <h2>📋 Regras Tributárias</h2>
                        <p>Configuração de regras e alíquotas tributárias por produto</p>
                    </div>
                </div>

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
                        Matéria Prima
                    </button>
                </div>

                {/* Search */}
                <div style={{ marginBottom: '16px', maxWidth: '320px' }}>
                    <input
                        className="form-input"
                        placeholder={`Buscar ${tab === 'produtos' ? 'produto' : 'matéria prima'}...`}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ fontSize: '13px' }}
                    />
                </div>

                {/* Info */}
                <div style={{ marginBottom: '12px', fontSize: '12px', color: '#9ca3af' }}>
                    💡 Clique em qualquer valor para editar. Pressione <strong>Enter</strong> para salvar ou <strong>Esc</strong> para cancelar.
                </div>

                {/* Table */}
                {filteredItems.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">📋</div>
                        <h4>Nenhum {tab === 'produtos' ? 'produto' : 'matéria prima'} encontrado</h4>
                        <p>{search ? 'Tente ajustar a busca.' : `Cadastre ${tab === 'produtos' ? 'produtos' : 'matérias primas'} na página de Estoque.`}</p>
                    </div>
                ) : (
                    <div className="table-wrapper" style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '480px' }}>
                        <table style={{ fontSize: '13px', minWidth: tab === 'materias' ? '400px' : '900px', width: tab === 'materias' ? 'auto' : '100%' }}>
                            <thead>
                                {/* Row 1: Main groups */}
                                <tr>
                                    <th
                                        colSpan={2}
                                        style={{
                                            textAlign: 'center',
                                            background: '#d1fae5',
                                            borderBottom: '2px solid #059669',
                                            position: 'sticky',
                                            top: 0,
                                            zIndex: 2,
                                            fontSize: '13px',
                                            fontWeight: 700,
                                            color: '#059669',
                                        }}
                                    >
                                        {tab === 'produtos' ? 'Produto' : 'Matéria Prima'}
                                    </th>
                                    <th
                                        colSpan={2}
                                        style={{
                                            textAlign: 'center',
                                            background: '#dbeafe',
                                            borderBottom: '2px solid #2563eb',
                                            position: 'sticky',
                                            top: 0,
                                            zIndex: 2,
                                            fontSize: '13px',
                                            fontWeight: 700,
                                            color: '#2563eb',
                                        }}
                                    >
                                        Compra
                                    </th>
                                    {tab === 'produtos' && (
                                        <th
                                            colSpan={7}
                                            style={{
                                                textAlign: 'center',
                                                background: '#fef3c7',
                                                borderBottom: '2px solid #d97706',
                                                position: 'sticky',
                                                top: 0,
                                                zIndex: 2,
                                                fontSize: '13px',
                                                fontWeight: 700,
                                                color: '#d97706',
                                            }}
                                        >
                                            Venda
                                        </th>
                                    )}
                                </tr>

                                {/* Row 2: Sub-headers */}
                                <tr>
                                    <th style={{ whiteSpace: 'nowrap', fontSize: '12px', position: 'sticky', top: '38px', zIndex: 2, background: '#d1fae5' }}>Nome</th>
                                    <th style={{ whiteSpace: 'nowrap', fontSize: '12px', position: 'sticky', top: '38px', zIndex: 2, background: '#d1fae5' }}>Categoria</th>
                                    {TAX_FIELDS.filter(f => tab === 'produtos' || f.group !== 'venda').map((f) => (
                                        <th
                                            key={f.key}
                                            style={{
                                                whiteSpace: 'nowrap',
                                                fontSize: '11px',
                                                textAlign: 'right',
                                                fontWeight: 600,
                                                color: f.group === 'compra' ? '#2563eb' : '#d97706',
                                                position: 'sticky',
                                                top: '38px',
                                                zIndex: 2,
                                                background: f.group === 'compra' ? '#dbeafe' : '#fef3c7',
                                            }}
                                        >
                                            {f.key === 'compraPreco' && tab === 'materias' ? 'Preço(R$/Kg)' : f.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredItems.map((item) => (
                                    <tr key={item.id}>
                                        <td style={{ fontWeight: 500, whiteSpace: 'nowrap', background: 'rgba(5, 150, 105, 0.06)' }}>{item.name}</td>
                                        <td style={{ color: '#6b7280', fontSize: '12px', whiteSpace: 'nowrap', background: 'rgba(5, 150, 105, 0.06)' }}>
                                            {tab === 'produtos' ? (item.category || '—') : 'Matéria Prima'}
                                        </td>
                                        {TAX_FIELDS.filter(f => tab === 'produtos' || f.group !== 'venda').map((f) => {
                                            const isProducao = item.category === 'Produção' && f.group === 'compra';
                                            return (
                                                <td key={f.key} style={{
                                                    textAlign: 'right',
                                                    padding: '6px 8px',
                                                    background: isProducao ? '#f3f4f6' : (f.group === 'compra' ? 'rgba(37, 99, 235, 0.06)' : 'rgba(217, 119, 6, 0.06)'),
                                                }}>
                                                    {renderCell(item, f)}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
