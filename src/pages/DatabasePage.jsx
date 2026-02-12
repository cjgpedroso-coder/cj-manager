import { useState, useEffect, useCallback, useRef } from 'react';

const API = 'http://localhost:3001/api/dev';

// Friendly labels for each table
const TABLE_LABELS = {
    embalagens: 'Estoque / Produtos',
    gramaturas: 'Estoque / Produtos',
    products: 'Estoque / Produtos',
    movements: 'Estoque / Movimentações',
    raw_materials: 'Estoque / Matérias Primas',
    raw_material_movements: 'Estoque / Mov. Matérias Primas',
    users: 'Administração / Usuários',
    login_attempts: 'Administração / Login',
    pending_queue: 'Administração / Aprovações',
};

export default function DatabasePage() {
    const [tables, setTables] = useState([]);
    const [selectedTable, setSelectedTable] = useState('');
    const [columns, setColumns] = useState([]);
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');

    // Table dropdown
    const [tableDropdownOpen, setTableDropdownOpen] = useState(false);
    const [tableSearch, setTableSearch] = useState('');
    const dropdownRef = useRef(null);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editRow, setEditRow] = useState(null);
    const [formData, setFormData] = useState({});
    const [formError, setFormError] = useState('');

    // Delete confirm
    const [deleteTarget, setDeleteTarget] = useState(null);

    // Close dropdown on click outside
    useEffect(() => {
        function handleClickOutside(e) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setTableDropdownOpen(false);
                setTableSearch('');
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchTables = useCallback(async () => {
        const res = await fetch(`${API}/tables`);
        const data = await res.json();
        setTables(data);
    }, []);

    const fetchTable = useCallback(async (name) => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/tables/${name}`);
            const data = await res.json();
            setColumns(data.columns || []);
            setRows(data.rows || []);
        } catch {
            setColumns([]);
            setRows([]);
        }
        setLoading(false);
    }, []);

    useEffect(() => { fetchTables(); }, [fetchTables]);

    useEffect(() => {
        if (selectedTable) fetchTable(selectedTable);
        else { setColumns([]); setRows([]); }
    }, [selectedTable, fetchTable]);

    // Filter tables in dropdown search
    const filteredTables = tables.filter((t) => {
        if (!tableSearch) return true;
        const q = tableSearch.toLowerCase();
        const label = TABLE_LABELS[t.name] || '';
        return t.name.toLowerCase().includes(q) || label.toLowerCase().includes(q);
    });

    // Search filter for rows
    const filteredRows = rows.filter((row) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return Object.values(row).some((v) =>
            String(v ?? '').toLowerCase().includes(q)
        );
    });

    // ── Primary key helper ───────────────────────────────────
    function getPkColumn() {
        const pk = columns.find((c) => c.pk === 1);
        return pk ? pk.name : null;
    }

    // ── Modal helpers ────────────────────────────────────────
    function openAddModal() {
        const initial = {};
        columns.forEach((c) => { initial[c.name] = c.dflt_value ?? ''; });
        setEditRow(null);
        setFormData(initial);
        setFormError('');
        setShowModal(true);
    }

    function openEditModal(row) {
        setEditRow(row);
        setFormData({ ...row });
        setFormError('');
        setShowModal(true);
    }

    function handleFormChange(colName, value) {
        setFormData((prev) => ({ ...prev, [colName]: value }));
        if (formError) setFormError('');
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        const pkCol = getPkColumn();

        try {
            if (editRow) {
                const pkValue = editRow[pkCol];
                await fetch(`${API}/tables/${selectedTable}/${encodeURIComponent(pkValue)}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData),
                });
            } else {
                const cleanData = {};
                Object.entries(formData).forEach(([k, v]) => {
                    if (v !== '' && v !== null && v !== undefined) cleanData[k] = v;
                });
                await fetch(`${API}/tables/${selectedTable}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(cleanData),
                });
            }
            await fetchTable(selectedTable);
            await fetchTables();
            setShowModal(false);
        } catch (err) {
            setFormError(err.message || 'Erro ao salvar');
        }
    }

    async function handleDeleteConfirm() {
        if (!deleteTarget) return;
        const pkCol = getPkColumn();
        const pkValue = deleteTarget[pkCol];
        try {
            await fetch(`${API}/tables/${selectedTable}/${encodeURIComponent(pkValue)}`, {
                method: 'DELETE',
            });
            await fetchTable(selectedTable);
            await fetchTables();
        } catch { /* ignore */ }
        setDeleteTarget(null);
    }

    function displayValue(val) {
        if (val === null || val === undefined) return <span style={{ opacity: 0.35, fontStyle: 'italic' }}>NULL</span>;
        const s = String(val);
        if (s.length > 60) return s.slice(0, 57) + '...';
        return s;
    }

    function typeColor(type) {
        if (!type) return '#6b7280';
        const t = type.toUpperCase();
        if (t.includes('INT')) return '#2563eb';
        if (t.includes('TEXT') || t.includes('VARCHAR')) return '#059669';
        if (t.includes('REAL') || t.includes('FLOAT') || t.includes('DOUBLE')) return '#d97706';
        return '#6b7280';
    }

    function selectTable(name) {
        setSelectedTable(name);
        setSearch('');
        setTableDropdownOpen(false);
        setTableSearch('');
    }

    return (
        <div className="page" style={{ maxWidth: 1200, margin: '0 auto' }}>
            {/* Header */}
            <div className="page-header">
                <div className="page-header-left">
                    <h2>🗄️ Banco de Dados</h2>
                    <p>Visualize e gerencie todos os dados do sistema</p>
                </div>
            </div>

            {/* Table Selector Dropdown */}
            <div style={{ marginBottom: '20px', position: 'relative', maxWidth: '460px' }} ref={dropdownRef}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
                    Tabela Selecionada
                </label>
                <button
                    type="button"
                    className="form-select"
                    onClick={() => setTableDropdownOpen(!tableDropdownOpen)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        cursor: 'pointer',
                        textAlign: 'left',
                        padding: '10px 14px',
                        fontSize: '14px',
                    }}
                >
                    <span style={{ opacity: selectedTable ? 1 : 0.5 }}>
                        {selectedTable ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{selectedTable}</span>
                                {TABLE_LABELS[selectedTable] && (
                                    <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 400 }}>— {TABLE_LABELS[selectedTable]}</span>
                                )}
                            </span>
                        ) : (
                            'Selecione uma tabela...'
                        )}
                    </span>
                    <span style={{ fontSize: '10px', marginLeft: 'auto', paddingLeft: '8px', color: '#9ca3af' }}>▼</span>
                </button>

                {tableDropdownOpen && (
                    <div style={{
                        position: 'absolute',
                        top: 'calc(100% + 4px)',
                        left: 0,
                        right: 0,
                        background: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '10px',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
                        zIndex: 100,
                        overflow: 'hidden',
                    }}>
                        {/* Search bar inside dropdown */}
                        <div style={{ padding: '8px 10px', borderBottom: '1px solid #f3f4f6' }}>
                            <input
                                className="form-input"
                                placeholder="Buscar tabela..."
                                value={tableSearch}
                                onChange={(e) => setTableSearch(e.target.value)}
                                autoFocus
                                style={{ fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '6px' }}
                            />
                        </div>

                        {/* Table list */}
                        <div style={{ maxHeight: '280px', overflowY: 'auto', padding: '4px' }}>
                            {filteredTables.length === 0 ? (
                                <div style={{ padding: '16px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
                                    Nenhuma tabela encontrada
                                </div>
                            ) : (
                                filteredTables.map((t) => (
                                    <button
                                        key={t.name}
                                        onClick={() => selectTable(t.name)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            width: '100%',
                                            padding: '9px 12px',
                                            borderRadius: '6px',
                                            border: 'none',
                                            background: selectedTable === t.name ? 'rgba(5, 150, 105, 0.10)' : 'transparent',
                                            cursor: 'pointer',
                                            fontSize: '13px',
                                            textAlign: 'left',
                                            transition: 'background 150ms ease',
                                        }}
                                        onMouseEnter={(e) => { if (selectedTable !== t.name) e.currentTarget.style.background = '#f9fafb'; }}
                                        onMouseLeave={(e) => { if (selectedTable !== t.name) e.currentTarget.style.background = 'transparent'; }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                            <span style={{
                                                fontFamily: 'monospace',
                                                fontWeight: selectedTable === t.name ? 600 : 500,
                                                color: selectedTable === t.name ? '#059669' : 'var(--text-primary)',
                                                whiteSpace: 'nowrap',
                                            }}>
                                                {t.name}
                                            </span>
                                            {TABLE_LABELS[t.name] && (
                                                <span style={{
                                                    fontSize: '11px',
                                                    color: '#9ca3af',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                }}>
                                                    — {TABLE_LABELS[t.name]}
                                                </span>
                                            )}
                                        </div>
                                        <span style={{
                                            background: selectedTable === t.name ? '#059669' : '#e5e7eb',
                                            color: selectedTable === t.name ? '#fff' : '#6b7280',
                                            padding: '1px 8px',
                                            borderRadius: '10px',
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            flexShrink: 0,
                                        }}>
                                            {t.rowCount}
                                        </span>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Data Table */}
            {selectedTable && (
                <div className="card" style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, fontFamily: 'monospace' }}>
                                {selectedTable}
                            </h3>
                            {TABLE_LABELS[selectedTable] && (
                                <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                                    {TABLE_LABELS[selectedTable]}
                                </span>
                            )}
                            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                                · {filteredRows.length} registro{filteredRows.length !== 1 ? 's' : ''}
                            </span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <div className="search-bar" style={{ maxWidth: '240px' }}>
                                <span className="search-icon">Q</span>
                                <input
                                    className="form-input"
                                    placeholder="Buscar..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    style={{ fontSize: '13px' }}
                                />
                            </div>
                            <button className="btn btn-primary" onClick={openAddModal} style={{ whiteSpace: 'nowrap', fontSize: '13px' }}>
                                ＋ Novo Registro
                            </button>
                            <button
                                className="btn btn-secondary"
                                onClick={() => fetchTable(selectedTable)}
                                style={{ padding: '8px 12px', fontSize: '13px' }}
                                title="Atualizar"
                            >
                                ↻
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                            Carregando...
                        </div>
                    ) : filteredRows.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">--</div>
                            <h4>{rows.length === 0 ? 'Tabela vazia' : 'Nenhum resultado'}</h4>
                            <p>{rows.length === 0 ? 'Clique em "+ Novo Registro" para adicionar dados.' : 'Tente ajustar a busca.'}</p>
                        </div>
                    ) : (
                        <div className="table-wrapper" style={{ maxHeight: '520px', overflowY: 'auto', overflowX: 'auto' }}>
                            <table style={{ fontSize: '13px' }}>
                                <thead>
                                    <tr>
                                        {columns.map((c) => (
                                            <th key={c.name} style={{ whiteSpace: 'nowrap', fontFamily: 'monospace', fontSize: '12px' }}>
                                                {c.pk === 1 && <span style={{ color: '#d97706', marginRight: '4px' }}>🔑</span>}
                                                {c.name}
                                            </th>
                                        ))}
                                        <th style={{ width: '80px' }}>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRows.map((row, idx) => (
                                        <tr key={idx}>
                                            {columns.map((c) => (
                                                <td key={c.name} style={{ fontFamily: 'monospace', fontSize: '12px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {displayValue(row[c.name])}
                                                </td>
                                            ))}
                                            <td>
                                                <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                                    <button
                                                        className="btn-icon"
                                                        onClick={() => openEditModal(row)}
                                                        title="Editar"
                                                        style={{ color: '#2563eb', fontSize: '14px' }}
                                                    >
                                                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                    </button>
                                                    <button
                                                        className="btn-icon danger"
                                                        onClick={() => setDeleteTarget(row)}
                                                        title="Excluir"
                                                        style={{ color: '#dc2626', fontSize: '14px' }}
                                                    >
                                                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {!selectedTable && (
                <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>🗄️</div>
                    <h3 style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Selecione uma tabela</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Escolha uma tabela no dropdown acima para visualizar seus dados.</p>
                </div>
            )}

            {/* ═══ ADD / EDIT MODAL ═══ */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
                        <div className="modal-header">
                            <h3>{editRow ? 'Editar Registro' : 'Novo Registro'}</h3>
                            <button className="btn-icon" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleFormSubmit}>
                            <div className="modal-body" style={{ gap: '14px', maxHeight: '60vh', overflow: 'auto' }}>
                                {columns.map((c) => {
                                    const isPk = c.pk === 1;
                                    return (
                                        <div className="form-group" key={c.name}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span style={{ fontFamily: 'monospace', fontSize: '13px' }}>{c.name}</span>
                                                <span style={{ color: typeColor(c.type), fontFamily: 'monospace', fontSize: '11px' }}>
                                                    {c.type || 'ANY'}
                                                </span>
                                                {isPk && <span style={{ color: '#d97706', fontSize: '10px' }}>🔑 PK</span>}
                                                {c.notnull === 1 && <span style={{ color: '#dc2626', fontSize: '10px' }}>*</span>}
                                            </label>
                                            <input
                                                className="form-input"
                                                value={formData[c.name] ?? ''}
                                                onChange={(e) => handleFormChange(c.name, e.target.value)}
                                                placeholder={c.dflt_value ? `Default: ${c.dflt_value}` : `${c.type || 'valor'}...`}
                                                disabled={isPk && !!editRow}
                                                style={{
                                                    fontFamily: 'monospace',
                                                    fontSize: '13px',
                                                    opacity: (isPk && editRow) ? 0.5 : 1,
                                                }}
                                            />
                                        </div>
                                    );
                                })}
                                {formError && (
                                    <div className="auth-error" style={{ marginTop: 4 }}>
                                        <span>!</span> {formError}
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editRow ? 'Salvar' : 'Inserir'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ═══ DELETE CONFIRM ═══ */}
            {deleteTarget && (
                <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
                    <div className="modal confirm-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
                        <div className="modal-header">
                            <h3>Excluir Registro</h3>
                            <button className="btn-icon" onClick={() => setDeleteTarget(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <p>Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.</p>
                            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px', marginTop: '8px', fontFamily: 'monospace', fontSize: '12px', maxHeight: '120px', overflowY: 'auto' }}>
                                {columns.slice(0, 4).map((c) => (
                                    <div key={c.name}>
                                        <strong>{c.name}:</strong> {String(deleteTarget[c.name] ?? 'NULL')}
                                    </div>
                                ))}
                                {columns.length > 4 && <div style={{ opacity: 0.5 }}>... +{columns.length - 4} campos</div>}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>
                                Cancelar
                            </button>
                            <button className="btn" style={{ background: '#dc2626', color: '#fff' }} onClick={handleDeleteConfirm}>
                                Excluir
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
