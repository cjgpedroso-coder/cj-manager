import { useState, useCallback, useMemo, useEffect } from 'react';
import {
    getRawMaterials,
    getRawMaterialMovements,
    saveRawMaterialMovement,
    updateRawMaterialMovement,
    deleteRawMaterialMovement,
} from '../utils/storage';
import ConfirmDialog from '../components/ConfirmDialog';

export default function ProducaoEstoquePage() {
    const [movements, setMovements] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editMovement, setEditMovement] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    // Filters
    const [filterMaterial, setFilterMaterial] = useState('');
    const [filterDate, setFilterDate] = useState('');

    // Modal form
    const today = new Date().toISOString().slice(0, 10);
    const [form, setForm] = useState({ date: today, rawMaterialId: '', entrada: '', saida: '' });
    const [formErrors, setFormErrors] = useState({});

    const refresh = useCallback(async () => {
        setMovements(await getRawMaterialMovements());
        setMaterials(await getRawMaterials());
    }, []);

    useEffect(() => { refresh(); }, [refresh]);

    const materialMap = useMemo(() => {
        const map = {};
        materials.forEach((m) => (map[m.id] = m));
        return map;
    }, [materials]);

    const filtered = useMemo(() => {
        return movements
            .filter((m) => {
                if (filterMaterial && m.rawMaterialId !== filterMaterial) return false;
                if (filterDate && m.date !== filterDate) return false;
                return true;
            })
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }, [movements, filterMaterial, filterDate]);

    // Stats
    const stats = useMemo(() => {
        const list = movements.filter((m) => {
            if (filterDate && m.date !== filterDate) return false;
            if (filterMaterial && m.rawMaterialId !== filterMaterial) return false;
            return true;
        });
        return {
            total: list.length,
            totalEntradas: list.reduce((s, m) => s + (Number(m.entrada) || 0), 0),
            totalSaidas: list.reduce((s, m) => s + (Number(m.saida) || 0), 0),
        };
    }, [movements, filterDate, filterMaterial]);

    const stockInfo = useMemo(() => {
        if (filterMaterial && materialMap[filterMaterial]) {
            return {
                value: Number(materialMap[filterMaterial].currentStock) || 0,
                label: materialMap[filterMaterial].name,
            };
        }
        const total = materials.reduce((s, m) => s + (Number(m.currentStock) || 0), 0);
        return { value: total, label: 'Todas as matérias primas' };
    }, [filterMaterial, materialMap, materials]);

    // Modal handlers
    function openModal(movement = null) {
        if (movement) {
            setEditMovement(movement);
            setForm({
                date: movement.date || today,
                rawMaterialId: movement.rawMaterialId || '',
                entrada: movement.entrada ?? '',
                saida: movement.saida ?? '',
            });
        } else {
            setEditMovement(null);
            setForm({ date: today, rawMaterialId: '', entrada: '', saida: '' });
        }
        setFormErrors({});
        setShowModal(true);
    }

    function handleFormChange(e) {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }

    function validate() {
        const errors = {};
        if (!form.date) errors.date = 'Data é obrigatória';
        if (!form.rawMaterialId) errors.rawMaterialId = 'Selecione uma matéria prima';
        if (!form.entrada && !form.saida) errors.entrada = 'Informe entrada ou saída';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!validate()) return;

        const data = {
            date: form.date,
            rawMaterialId: form.rawMaterialId,
            entrada: Number(form.entrada) || 0,
            saida: Number(form.saida) || 0,
        };

        if (editMovement) {
            await updateRawMaterialMovement(editMovement.id, data);
        } else {
            await saveRawMaterialMovement(data);
        }

        await refresh();
        setShowModal(false);
        setEditMovement(null);
    }

    async function handleDeleteConfirm() {
        if (deleteTarget) {
            await deleteRawMaterialMovement(deleteTarget.id);
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

    return (
        <div className="page-container">
            <div className="page-header">
                <div className="page-header-left">
                    <h2>Produção</h2>
                    <p>Controle de entrada e saída de matérias primas</p>
                </div>
                <button className="btn btn-primary" onClick={() => openModal()}>
                    ＋ Nova Movimentação
                </button>
            </div>

            {/* Filters + Stats Card */}
            <div className="card" style={{ padding: '20px 24px' }}>
                {/* Filters */}
                <div className="filter-bar" style={{ margin: 0, marginBottom: '20px' }}>
                    <select
                        className="form-select"
                        value={filterMaterial}
                        onChange={(e) => setFilterMaterial(e.target.value)}
                        style={{ minWidth: '200px' }}
                    >
                        <option value="">Todas as matérias primas</option>
                        {materials.map((m) => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                    </select>

                    <input
                        className="form-input"
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        style={{ minWidth: '160px' }}
                    />

                    {(filterMaterial || filterDate) && (
                        <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => { setFilterMaterial(''); setFilterDate(''); }}
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
                    {filterMaterial && materialMap[filterMaterial]
                        ? materialMap[filterMaterial].name
                        : 'Todas as matérias primas'}
                </h4>

                {/* Stats Grid */}
                <div className="stats-grid" style={{ margin: 0, gridTemplateColumns: 'repeat(4, 1fr)' }}>
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
                            <p>Entradas</p>
                        </div>
                    </div>
                    <div className="stat-card red">
                        <div className="stat-icon red">S</div>
                        <div className="stat-info">
                            <h3>{stats.totalSaidas.toLocaleString('pt-BR')}</h3>
                            <p>Saídas</p>
                        </div>
                    </div>
                    <div className="stat-card purple">
                        <div className="stat-icon purple">$</div>
                        <div className="stat-info">
                            <h3>{stockInfo.value.toLocaleString('pt-BR')}</h3>
                            <p>Estoque Atual</p>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{stockInfo.label}</span>
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
                                ? 'Clique em "Nova Movimentação" para registrar.'
                                : 'Tente ajustar os filtros.'}
                        </p>
                    </div>
                </div>
            ) : (
                <div style={{ marginTop: '12px' }}>
                    <div className="table-wrapper" style={{ maxHeight: '620px', overflowY: 'auto' }}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Matéria Prima</th>
                                    <th>Entrada</th>
                                    <th>Saída</th>
                                    <th style={{ width: '90px' }}>Ação</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((m) => {
                                    const mat = materialMap[m.rawMaterialId];
                                    return (
                                        <tr key={m.id}>
                                            <td style={{ fontWeight: 500 }}>{formatDate(m.date)}</td>
                                            <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                                                {mat?.name || 'Matéria removida'}
                                            </td>
                                            <td style={{ fontWeight: 600, color: '#059669' }}>{m.entrada || 0}</td>
                                            <td style={{ fontWeight: 600, color: '#dc2626' }}>{m.saida || 0}</td>
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

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
                        <div className="modal-header">
                            <h3>{editMovement ? 'Editar Movimentação' : 'Nova Movimentação'}</h3>
                            <button className="btn-icon" onClick={() => { setShowModal(false); setEditMovement(null); }}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                {/* Data */}
                                <div className="form-group">
                                    <label>Data <span className="required">*</span></label>
                                    <input
                                        className={`form-input ${formErrors.date ? 'error' : ''}`}
                                        type="date"
                                        name="date"
                                        value={form.date}
                                        onChange={handleFormChange}
                                    />
                                </div>

                                {/* Matéria Prima */}
                                <div className="form-group">
                                    <label>Matéria Prima <span className="required">*</span></label>
                                    <select
                                        className={`form-select ${formErrors.rawMaterialId ? 'error' : ''}`}
                                        name="rawMaterialId"
                                        value={form.rawMaterialId}
                                        onChange={handleFormChange}
                                    >
                                        <option value="">Selecione...</option>
                                        {materials.map((m) => (
                                            <option key={m.id} value={m.id}>
                                                {m.name}{m.gramatura ? ` — ${m.gramatura}` : ''}
                                            </option>
                                        ))}
                                    </select>
                                    {formErrors.rawMaterialId && (
                                        <span style={{ color: 'var(--accent-danger)', fontSize: '12px' }}>
                                            {formErrors.rawMaterialId}
                                        </span>
                                    )}
                                </div>

                                {/* Quantidades */}
                                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div className="form-group">
                                        <label>Entrada</label>
                                        <input
                                            className={`form-input ${formErrors.entrada ? 'error' : ''}`}
                                            name="entrada"
                                            value={form.entrada}
                                            onChange={handleFormChange}
                                            placeholder="0"
                                            type="number"
                                            min="0"
                                        />
                                        {formErrors.entrada && (
                                            <span style={{ color: 'var(--accent-danger)', fontSize: '12px' }}>
                                                {formErrors.entrada}
                                            </span>
                                        )}
                                    </div>
                                    <div className="form-group">
                                        <label>Saída</label>
                                        <input
                                            className="form-input"
                                            name="saida"
                                            value={form.saida}
                                            onChange={handleFormChange}
                                            placeholder="0"
                                            type="number"
                                            min="0"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); setEditMovement(null); }}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editMovement ? 'Salvar Alterações' : 'Registrar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
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
