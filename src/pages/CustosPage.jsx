import { useState, useCallback, useEffect } from 'react';
import { getProducts, getCosts, saveCost, deleteCost, updateVendasMes, updateProducaoMes } from '../utils/storage';

const COST_TYPES = ['Operacional', 'Direto', 'Caixa', 'Veiculo'];

export default function CustosPage() {
    const [costs, setCosts] = useState([]);
    const [products, setProducts] = useState([]);
    const [expanded, setExpanded] = useState({});

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingCost, setEditingCost] = useState(null);
    const [form, setForm] = useState({
        name: '', type: 'Operacional', mes1: '', mes2: '', mes3: '', valorMedio: '',
        nomeVeiculo: '', placa: '', kmPorLitro: '', kmRodadoMes: '', seguroMes: '', ipvaLicenciamento: '', manutencaoAnual: '', valorLitro: '',
    });

    // Delete confirmation
    const [confirmDelete, setConfirmDelete] = useState(null);

    // Inline vendasMes editing
    const [editingVendas, setEditingVendas] = useState(null); // { id }
    const [vendasValue, setVendasValue] = useState('');

    // Inline producaoMes editing
    const [editingProducao, setEditingProducao] = useState(null); // { id }
    const [producaoValue, setProducaoValue] = useState('');

    const refresh = useCallback(async () => {
        const [c, p] = await Promise.all([getCosts(), getProducts()]);
        setCosts(c);
        setProducts(p);
    }, []);

    useEffect(() => { refresh(); }, [refresh]);

    // ── Auto-calc valor médio ────────────────────────────────
    function calcMedio(m1, m2, m3) {
        const a = Number(m1) || 0, b = Number(m2) || 0, c = Number(m3) || 0;
        if (a === 0 && b === 0 && c === 0) return '';
        return ((a + b + c) / 3).toFixed(2);
    }

    const vehicleFields = ['kmPorLitro', 'kmRodadoMes', 'valorLitro', 'seguroMes', 'ipvaLicenciamento', 'manutencaoAnual'];

    function calcVeiculoMedio(f) {
        const consumo = (Number(f.kmRodadoMes) || 0) / (Number(f.kmPorLitro) || 1);
        const combustivel = consumo * (Number(f.valorLitro) || 0);
        return combustivel + (Number(f.seguroMes) || 0) + (Number(f.ipvaLicenciamento) || 0) + ((Number(f.manutencaoAnual) || 0) / 12);
    }

    function setField(field, value) {
        setForm(prev => {
            const next = { ...prev, [field]: value };
            // Auto-calc for non-vehicle: average of 3 months
            if (next.type !== 'Veiculo' && ['mes1', 'mes2', 'mes3'].includes(field)) {
                const auto = calcMedio(next.mes1, next.mes2, next.mes3);
                if (auto) next.valorMedio = auto;
            }
            // Auto-calc for vehicle fields
            if (next.type === 'Veiculo' && (vehicleFields.includes(field) || field === 'type')) {
                next.valorMedio = calcVeiculoMedio(next).toFixed(2);
            }
            // When switching to Veiculo, recalc immediately
            if (field === 'type' && value === 'Veiculo') {
                next.valorMedio = calcVeiculoMedio(next).toFixed(2);
            }
            return next;
        });
    }

    // ── Cost Modal ───────────────────────────────────────────
    function openNewCost() {
        setEditingCost(null);
        setForm({ name: '', type: 'Operacional', mes1: '', mes2: '', mes3: '', valorMedio: '', nomeVeiculo: '', placa: '', kmPorLitro: '', kmRodadoMes: '', seguroMes: '', ipvaLicenciamento: '', manutencaoAnual: '', valorLitro: '' });
        setShowModal(true);
    }

    function openEditCost(cost) {
        setEditingCost(cost);
        setForm({
            name: cost.name || '',
            type: cost.type || 'Operacional',
            mes1: cost.mes1 || '',
            mes2: cost.mes2 || '',
            mes3: cost.mes3 || '',
            valorMedio: cost.valorMedio || '',
            nomeVeiculo: cost.nomeVeiculo || '',
            placa: cost.placa || '',
            kmPorLitro: cost.kmPorLitro || '',
            kmRodadoMes: cost.kmRodadoMes || '',
            seguroMes: cost.seguroMes || '',
            ipvaLicenciamento: cost.ipvaLicenciamento || '',
            manutencaoAnual: cost.manutencaoAnual || '',
            valorLitro: cost.valorLitro || '',
        });
        setShowModal(true);
    }

    async function handleSaveCost(e) {
        e.preventDefault();
        if (!form.name.trim()) return;
        try {
            const data = {
                ...form,
                mes1: Number(form.mes1) || 0,
                mes2: Number(form.mes2) || 0,
                mes3: Number(form.mes3) || 0,
                valorMedio: Number(form.valorMedio) || 0,
                kmPorLitro: Number(form.kmPorLitro) || 0,
                kmRodadoMes: Number(form.kmRodadoMes) || 0,
                seguroMes: Number(form.seguroMes) || 0,
                ipvaLicenciamento: Number(form.ipvaLicenciamento) || 0,
                manutencaoAnual: Number(form.manutencaoAnual) || 0,
                valorLitro: Number(form.valorLitro) || 0,
            };
            if (editingCost) data.id = editingCost.id;
            await saveCost(data);
            setShowModal(false);
            refresh();
        } catch (err) {
            console.error('Erro ao salvar custo:', err);
        }
    }

    async function handleDeleteCost() {
        if (!confirmDelete) return;
        await deleteCost(confirmDelete.id);
        setConfirmDelete(null);
        refresh();
    }

    // ── VendasMes inline editing ─────────────────────────────
    function startEditVendas(product) {
        setEditingVendas({ id: product.id });
        setVendasValue(String(product.vendasMes || 0).replace('.', ','));
    }

    async function saveVendas() {
        if (!editingVendas) return;
        await updateVendasMes(editingVendas.id, parseFloat(vendasValue.replace(',', '.')) || 0);
        setEditingVendas(null);
        setVendasValue('');
        refresh();
    }

    // ── ProducaoMes inline editing ───────────────────────────
    function startEditProducao(product) {
        setEditingProducao({ id: product.id });
        setProducaoValue(String(product.producaoMes || 0).replace('.', ','));
    }

    async function saveProducao() {
        if (!editingProducao) return;
        const id = editingProducao.id;
        const val = parseFloat(producaoValue.replace(',', '.')) || 0;
        setEditingProducao(null);
        setProducaoValue('');
        try {
            await updateProducaoMes(id, val);
        } catch (err) {
            console.error('Erro ao salvar producaoMes:', err);
        }
        refresh();
    }

    // ── Rateio calculations ─────────────────────────────────
    const totalVendas = products.reduce((s, p) => s + (Number(p.vendasMes) || 0), 0);
    const totalCustoMedio = costs.reduce((s, c) => s + (Number(c.valorMedio) || 0), 0);
    const totalCustoOperacional = costs.filter(c => c.type === 'Operacional').reduce((s, c) => s + (Number(c.valorMedio) || 0), 0);
    const totalCustoMedioSemOp = totalCustoMedio - totalCustoOperacional;

    function getRateio(product) {
        if (totalVendas === 0) return 0;
        return ((Number(product.vendasMes) || 0) * 100) / totalVendas;
    }

    // Sum of rateio% for Tercerizado products
    const rateioTercerizado = products
        .filter(p => p.category === 'Tercerizado')
        .reduce((s, p) => s + getRateio(p), 0);
    // Sum of rateio% for normal (non-Tercerizado) products
    const rateioNormal = 100 - rateioTercerizado;

    function getParcelaCustos(product) {
        const rateio = getRateio(product);
        if (rateio === 0) return 0;

        if (product.category === 'Tercerizado') {
            // Tercerizado: only non-Operacional costs
            return (totalCustoMedioSemOp * rateio) / 100;
        } else {
            // Normal: full costs + redistributed Operacional leftover from Tercerizado
            let parcela = (totalCustoMedio * rateio) / 100;
            // Add the Operacional portion that Tercerizado didn't absorb, distributed proportionally among normal products
            if (rateioNormal > 0 && rateioTercerizado > 0) {
                const leftover = (totalCustoOperacional * rateioTercerizado) / 100;
                parcela += leftover * (rateio / rateioNormal);
            }
            return parcela;
        }
    }

    // ── RENDER ────────────────────────────────────────────────
    return (
        <div className="page-container">
            <div className="page-header" style={{ marginBottom: '16px' }}>
                <div className="page-header-left">
                    <h2>💰 Custos</h2>
                    <p>Gestão de custos e rateio por produto</p>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '20px', alignItems: 'stretch' }}>
                {/* ══════════ LEFT SIDE - 30% ══════════ */}
                <div style={{ width: '30%', minWidth: '280px', flexShrink: 0, position: 'relative' }}>
                    <div className="card" style={{ position: 'absolute', inset: 0, padding: '20px 20px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Custos Cadastrados</h3>
                            <button className="btn btn-primary" style={{ fontSize: '12px', padding: '6px 14px' }} onClick={openNewCost}>
                                + Novo Custo
                            </button>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            {costs.length === 0 ? (
                                <div style={{ padding: '40px 16px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '32px', opacity: 0.3, marginBottom: '8px' }}>💰</div>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Nenhum custo cadastrado.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {costs.map(cost => (
                                        <div key={cost.id} style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                                            {/* Card Header (collapsed) */}
                                            <div style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                padding: '14px 16px',
                                                borderBottom: expanded[cost.id] ? '1px solid var(--border-color)' : 'none',
                                            }}>
                                                <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => setExpanded(p => ({ ...p, [cost.id]: !p[cost.id] }))}>
                                                    <h4 style={{ fontSize: '14px', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
                                                        {cost.name}
                                                    </h4>
                                                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                                        Valor médio: <strong style={{ color: '#059669' }}>R$ {Number(cost.valorMedio || 0).toFixed(2)}</strong>
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                                    <button
                                                        className="btn-icon"
                                                        onClick={() => setExpanded(p => ({ ...p, [cost.id]: !p[cost.id] }))}
                                                        style={{ fontSize: '14px', transition: 'transform 0.2s', transform: expanded[cost.id] ? 'rotate(180deg)' : 'rotate(0)' }}
                                                    >▼</button>
                                                    <button className="btn-icon" title="Editar" onClick={() => openEditCost(cost)}>
                                                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                    </button>
                                                    <button className="btn-icon" title="Excluir" onClick={() => setConfirmDelete(cost)} style={{ color: 'var(--accent-danger)' }}>
                                                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Expanded details */}
                                            {expanded[cost.id] && (
                                                <div style={{ padding: '12px 16px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px' }}>
                                                        <span>Tipo: <strong style={{ color: 'var(--text-primary)' }}>{cost.type}</strong></span>
                                                        <span>Valor Médio: <strong style={{ color: '#059669' }}>R$ {Number(cost.valorMedio || 0).toFixed(2)}</strong></span>
                                                        {cost.type !== 'Veiculo' && (<>
                                                            <span>1° Mês: <strong style={{ color: 'var(--text-primary)' }}>R$ {Number(cost.mes1 || 0).toFixed(2)}</strong></span>
                                                            <span>2° Mês: <strong style={{ color: 'var(--text-primary)' }}>R$ {Number(cost.mes2 || 0).toFixed(2)}</strong></span>
                                                            <span>3° Mês: <strong style={{ color: 'var(--text-primary)' }}>R$ {Number(cost.mes3 || 0).toFixed(2)}</strong></span>
                                                        </>)}
                                                    </div>

                                                    {cost.type === 'Veiculo' && (
                                                        <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed var(--border-color)' }}>
                                                            <div style={{ fontSize: '12px', fontWeight: 600, color: '#2563eb', marginBottom: '6px' }}>🚗 Dados do Veículo</div>
                                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' }}>
                                                                <span>Nome: <strong style={{ color: 'var(--text-primary)' }}>{cost.nomeVeiculo || '—'}</strong></span>
                                                                <span>Placa: <strong style={{ color: 'var(--text-primary)' }}>{cost.placa || '—'}</strong></span>
                                                                <span>KM/L: <strong style={{ color: 'var(--text-primary)' }}>{cost.kmPorLitro || 0}</strong></span>
                                                                <span>KM rodado/mês: <strong style={{ color: 'var(--text-primary)' }}>{cost.kmRodadoMes || 0}</strong></span>
                                                                <span>Valor Litro: <strong style={{ color: 'var(--text-primary)' }}>R$ {Number(cost.valorLitro || 0).toFixed(2)}</strong></span>
                                                                <span>Seguro/Mês: <strong style={{ color: 'var(--text-primary)' }}>R$ {Number(cost.seguroMes || 0).toFixed(2)}</strong></span>
                                                                <span>IPVA/Licenc.: <strong style={{ color: 'var(--text-primary)' }}>R$ {Number(cost.ipvaLicenciamento || 0).toFixed(2)}</strong></span>
                                                                <span>Manutenção Anual: <strong style={{ color: 'var(--text-primary)' }}>R$ {Number(cost.manutencaoAnual || 0).toFixed(2)}</strong></span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Summary */}
                        {costs.length > 0 && (
                            <div style={{ marginTop: '12px', padding: '14px 16px', background: 'rgba(5, 150, 105, 0.06)', borderRadius: '10px', border: '1px solid rgba(5, 150, 105, 0.15)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600 }}>
                                    <span>Total Custos (Valor Médio)</span>
                                    <span style={{ color: '#059669' }}>R$ {totalCustoMedio.toFixed(2)}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ══════════ RIGHT SIDE - 70% ══════════ */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="card" style={{ padding: '20px 24px' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 4px', color: 'var(--text-primary)' }}>Rateio por Produto</h3>
                        <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '14px' }}>
                            💡 Clique em "Vendas p/mês" para editar. Rateio e Parcela Custos são calculados automaticamente.
                        </p>

                        {products.length === 0 ? (
                            <div style={{ padding: '40px 16px', textAlign: 'center' }}>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Nenhum produto cadastrado.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                                {/* ── Table 1: Custos Operacionais (Produção only) ── */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#2563eb', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        Custos Operacionais
                                    </div>
                                    <div className="table-wrapper" style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '580px' }}>
                                        <table style={{ fontSize: '13px', width: '100%' }}>
                                            <thead>
                                                <tr>
                                                    <th style={{ position: 'sticky', top: 0, zIndex: 2, background: '#f9fafb', whiteSpace: 'nowrap' }}>Produto</th>
                                                    <th style={{ position: 'sticky', top: 0, zIndex: 2, background: '#dbeafe', textAlign: 'right', whiteSpace: 'nowrap' }}>Produção/mês</th>
                                                    <th style={{ position: 'sticky', top: 0, zIndex: 2, background: '#d1fae5', textAlign: 'right', whiteSpace: 'nowrap' }}>Rateio(%)</th>
                                                    <th style={{ position: 'sticky', top: 0, zIndex: 2, background: '#fef3c7', textAlign: 'right', whiteSpace: 'nowrap' }}>Parcela Custos(R$)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(() => {
                                                    const prodProducts = products.filter(p => p.category === 'Produção');
                                                    const totalProducao = prodProducts.reduce((s, p) => s + (Number(p.producaoMes) || 0), 0);
                                                    return prodProducts.map(p => {
                                                        const prodP = Number(p.producaoMes) || 0;
                                                        const rateioProd = totalProducao > 0 ? (prodP * 100) / totalProducao : 0;
                                                        const parcelaOp = totalCustoOperacional > 0 ? (totalCustoOperacional * rateioProd) / 100 : 0;
                                                        const isEditingP = editingProducao?.id === p.id;

                                                        return (
                                                            <tr key={p.id}>
                                                                <td style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>{p.name}</td>
                                                                <td style={{ textAlign: 'right', padding: '6px 8px', background: 'rgba(37, 99, 235, 0.04)' }}>
                                                                    {isEditingP ? (
                                                                        <input
                                                                            autoFocus
                                                                            className="form-input"
                                                                            type="text"
                                                                            inputMode="decimal"
                                                                            value={producaoValue}
                                                                            onChange={e => setProducaoValue(e.target.value.replace(/[^0-9,.-]/g, ''))}
                                                                            onBlur={saveProducao}
                                                                            onKeyDown={e => { if (e.key === 'Enter') saveProducao(); if (e.key === 'Escape') setEditingProducao(null); }}
                                                                            style={{ width: '80px', padding: '3px 6px', fontSize: '12px', fontFamily: 'monospace', textAlign: 'right' }}
                                                                        />
                                                                    ) : (
                                                                        <span
                                                                            onClick={() => startEditProducao(p)}
                                                                            style={{
                                                                                cursor: 'pointer', padding: '3px 6px', borderRadius: '4px',
                                                                                fontFamily: 'monospace', fontSize: '12px',
                                                                                color: prodP === 0 ? '#dc2626' : 'inherit',
                                                                            }}
                                                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(37, 99, 235, 0.08)'}
                                                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                                            title="Clique para editar"
                                                                        >
                                                                            {prodP.toFixed(0)}
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td style={{ textAlign: 'right', padding: '6px 8px', fontFamily: 'monospace', fontSize: '12px', background: 'rgba(5, 150, 105, 0.04)' }}>
                                                                    {rateioProd.toFixed(2)}%
                                                                </td>
                                                                <td style={{
                                                                    textAlign: 'right', padding: '6px 8px',
                                                                    fontFamily: 'monospace', fontSize: '12px', fontWeight: 600,
                                                                    background: 'rgba(217, 119, 6, 0.04)',
                                                                    color: parcelaOp > 0 ? '#059669' : '#9ca3af',
                                                                }}>
                                                                    R$ {parcelaOp.toFixed(2)}
                                                                </td>
                                                            </tr>
                                                        );
                                                    });
                                                })()}
                                            </tbody>
                                            <tfoot>
                                                {(() => {
                                                    const prodProducts = products.filter(p => p.category === 'Produção');
                                                    const totalProducao = prodProducts.reduce((s, p) => s + (Number(p.producaoMes) || 0), 0);
                                                    return (
                                                        <tr style={{ fontWeight: 700 }}>
                                                            <td style={{ position: 'sticky', bottom: 0, background: '#f9fafb', borderTop: '2px solid var(--border-color)', zIndex: 2 }}>Total</td>
                                                            <td style={{ position: 'sticky', bottom: 0, background: '#f9fafb', borderTop: '2px solid var(--border-color)', zIndex: 2, textAlign: 'right', fontFamily: 'monospace', padding: '8px' }}>
                                                                {totalProducao.toFixed(0)}
                                                            </td>
                                                            <td style={{ position: 'sticky', bottom: 0, background: '#f9fafb', borderTop: '2px solid var(--border-color)', zIndex: 2, textAlign: 'right', fontFamily: 'monospace', padding: '8px' }}>
                                                                100.00%
                                                            </td>
                                                            <td style={{ position: 'sticky', bottom: 0, background: '#f9fafb', borderTop: '2px solid var(--border-color)', zIndex: 2, textAlign: 'right', fontFamily: 'monospace', padding: '8px', color: '#059669' }}>
                                                                R$ {totalCustoOperacional.toFixed(2)}
                                                            </td>
                                                        </tr>
                                                    );
                                                })()}
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>

                                {/* ── Table 2: Custos Gerais (All products, non-Operacional costs) ── */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#059669', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        Custos Gerais
                                    </div>
                                    <div className="table-wrapper" style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '580px' }}>
                                        <table style={{ fontSize: '13px', width: '100%' }}>
                                            <thead>
                                                <tr>
                                                    <th style={{ position: 'sticky', top: 0, zIndex: 2, background: '#f9fafb', whiteSpace: 'nowrap' }}>Produto</th>
                                                    <th style={{ position: 'sticky', top: 0, zIndex: 2, background: '#dbeafe', textAlign: 'right', whiteSpace: 'nowrap' }}>Vendas p/mês</th>
                                                    <th style={{ position: 'sticky', top: 0, zIndex: 2, background: '#d1fae5', textAlign: 'right', whiteSpace: 'nowrap' }}>Rateio(%)</th>
                                                    <th style={{ position: 'sticky', top: 0, zIndex: 2, background: '#fef3c7', textAlign: 'right', whiteSpace: 'nowrap' }}>Parcela Custos(R$)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {products.map(p => {
                                                    const rateio = getRateio(p);
                                                    const parcelaGeral = totalCustoMedioSemOp > 0 ? (totalCustoMedioSemOp * rateio) / 100 : 0;
                                                    const isEditingV = editingVendas?.id === p.id;

                                                    return (
                                                        <tr key={p.id}>
                                                            <td style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>{p.name}</td>
                                                            <td style={{ textAlign: 'right', padding: '6px 8px', background: 'rgba(37, 99, 235, 0.04)' }}>
                                                                {isEditingV ? (
                                                                    <input
                                                                        autoFocus
                                                                        className="form-input"
                                                                        type="text"
                                                                        inputMode="decimal"
                                                                        value={vendasValue}
                                                                        onChange={e => setVendasValue(e.target.value.replace(/[^0-9,.-]/g, ''))}
                                                                        onBlur={saveVendas}
                                                                        onKeyDown={e => { if (e.key === 'Enter') saveVendas(); if (e.key === 'Escape') setEditingVendas(null); }}
                                                                        style={{ width: '80px', padding: '3px 6px', fontSize: '12px', fontFamily: 'monospace', textAlign: 'right' }}
                                                                    />
                                                                ) : (
                                                                    <span
                                                                        onClick={() => startEditVendas(p)}
                                                                        style={{
                                                                            cursor: 'pointer', padding: '3px 6px', borderRadius: '4px',
                                                                            fontFamily: 'monospace', fontSize: '12px',
                                                                            color: (Number(p.vendasMes) || 0) === 0 ? '#dc2626' : 'inherit',
                                                                        }}
                                                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(37, 99, 235, 0.08)'}
                                                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                                        title="Clique para editar"
                                                                    >
                                                                        {(Number(p.vendasMes) || 0).toFixed(0)}
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td style={{ textAlign: 'right', padding: '6px 8px', fontFamily: 'monospace', fontSize: '12px', background: 'rgba(5, 150, 105, 0.04)' }}>
                                                                {rateio.toFixed(2)}%
                                                            </td>
                                                            <td style={{
                                                                textAlign: 'right', padding: '6px 8px',
                                                                fontFamily: 'monospace', fontSize: '12px', fontWeight: 600,
                                                                background: 'rgba(217, 119, 6, 0.04)',
                                                                color: parcelaGeral > 0 ? '#059669' : '#9ca3af',
                                                            }}>
                                                                R$ {parcelaGeral.toFixed(2)}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                            <tfoot>
                                                <tr style={{ fontWeight: 700 }}>
                                                    <td style={{ position: 'sticky', bottom: 0, background: '#f9fafb', borderTop: '2px solid var(--border-color)', zIndex: 2 }}>Total</td>
                                                    <td style={{ position: 'sticky', bottom: 0, background: '#f9fafb', borderTop: '2px solid var(--border-color)', zIndex: 2, textAlign: 'right', fontFamily: 'monospace', padding: '8px' }}>{totalVendas.toFixed(0)}</td>
                                                    <td style={{ position: 'sticky', bottom: 0, background: '#f9fafb', borderTop: '2px solid var(--border-color)', zIndex: 2, textAlign: 'right', fontFamily: 'monospace', padding: '8px' }}>100.00%</td>
                                                    <td style={{ position: 'sticky', bottom: 0, background: '#f9fafb', borderTop: '2px solid var(--border-color)', zIndex: 2, textAlign: 'right', fontFamily: 'monospace', padding: '8px', color: '#059669' }}>
                                                        R$ {products.reduce((s, p) => s + (totalCustoMedioSemOp * getRateio(p)) / 100, 0).toFixed(2)}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>

                            </div>
                        )}
                    </div>
                </div>
            </div >

            {/* ══════════ NEW / EDIT COST MODAL ══════════ */}
            {
                showModal && (
                    <div className="modal-overlay">
                        <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px', marginTop: '5vh', alignSelf: 'flex-start' }}>
                            <div className="modal-header">
                                <h3>{editingCost ? 'Editar Custo' : 'Novo Custo'}</h3>
                                <button className="btn-icon" onClick={() => setShowModal(false)}>✕</button>
                            </div>
                            <form onSubmit={handleSaveCost}>
                                <div className="modal-body">
                                    <div className="form-row">
                                        <div className="form-group" style={{ flex: 2 }}>
                                            <label>Nome <span className="required">*</span></label>
                                            <input className="form-input" value={form.name} onChange={e => setField('name', e.target.value)} placeholder="Nome do custo" required />
                                        </div>
                                        <div className="form-group" style={{ flex: 1 }}>
                                            <label>Tipo</label>
                                            <select className="form-select" value={form.type} onChange={e => setField('type', e.target.value)}>
                                                {COST_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    {/* 1°/2°/3° Mês — hidden when Veiculo */}
                                    {form.type !== 'Veiculo' && (
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label>1° Mês (R$)</label>
                                                <input className="form-input" type="number" step="0.01" value={form.mes1} onChange={e => setField('mes1', e.target.value)} placeholder="0.00" />
                                            </div>
                                            <div className="form-group">
                                                <label>2° Mês (R$)</label>
                                                <input className="form-input" type="number" step="0.01" value={form.mes2} onChange={e => setField('mes2', e.target.value)} placeholder="0.00" />
                                            </div>
                                            <div className="form-group">
                                                <label>3° Mês (R$)</label>
                                                <input className="form-input" type="number" step="0.01" value={form.mes3} onChange={e => setField('mes3', e.target.value)} placeholder="0.00" />
                                            </div>
                                        </div>
                                    )}

                                    {/* Vehicle-specific fields — between Tipo and Valor Médio */}
                                    {form.type === 'Veiculo' && (
                                        <div style={{ marginTop: '12px', padding: '14px', border: '1px dashed #2563eb', borderRadius: '10px', background: 'rgba(37, 99, 235, 0.03)' }}>
                                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#2563eb', marginBottom: '10px' }}>🚗 Dados do Veículo</div>
                                            <div className="form-row">
                                                <div className="form-group">
                                                    <label>Nome do Veículo</label>
                                                    <input className="form-input" value={form.nomeVeiculo} onChange={e => setField('nomeVeiculo', e.target.value)} placeholder="Ex: Fiorino" />
                                                </div>
                                                <div className="form-group">
                                                    <label>Placa</label>
                                                    <input className="form-input" value={form.placa} onChange={e => setField('placa', e.target.value)} placeholder="ABC-1234" />
                                                </div>
                                            </div>
                                            <div className="form-row">
                                                <div className="form-group">
                                                    <label>KM/L</label>
                                                    <input className="form-input" type="number" step="0.1" value={form.kmPorLitro} onChange={e => setField('kmPorLitro', e.target.value)} placeholder="0" />
                                                </div>
                                                <div className="form-group">
                                                    <label>KM rodado/Mês</label>
                                                    <input className="form-input" type="number" value={form.kmRodadoMes} onChange={e => setField('kmRodadoMes', e.target.value)} placeholder="0" />
                                                </div>
                                                <div className="form-group">
                                                    <label>Valor do Litro (R$)</label>
                                                    <input className="form-input" type="number" step="0.01" value={form.valorLitro} onChange={e => setField('valorLitro', e.target.value)} placeholder="0.00" />
                                                </div>
                                            </div>
                                            <div className="form-row">
                                                <div className="form-group">
                                                    <label>Seguro/Mês (R$)</label>
                                                    <input className="form-input" type="number" step="0.01" value={form.seguroMes} onChange={e => setField('seguroMes', e.target.value)} placeholder="0.00" />
                                                </div>
                                                <div className="form-group">
                                                    <label>IPVA e Licenciamento (R$)</label>
                                                    <input className="form-input" type="number" step="0.01" value={form.ipvaLicenciamento} onChange={e => setField('ipvaLicenciamento', e.target.value)} placeholder="0.00" />
                                                </div>
                                            </div>
                                            <div className="form-group">
                                                <label>Manutenção Anual - Previsão (R$)</label>
                                                <input className="form-input" type="number" step="0.01" value={form.manutencaoAnual} onChange={e => setField('manutencaoAnual', e.target.value)} placeholder="0.00" />
                                            </div>
                                        </div>
                                    )}

                                    <div className="form-group">
                                        <label>Valor Médio (R$)</label>
                                        <input className="form-input" type="number" step="0.01" value={form.valorMedio} onChange={e => setField('valorMedio', e.target.value)} placeholder="Calculado automaticamente ou preencha manualmente" />
                                        {form.type !== 'Veiculo' && <span style={{ fontSize: '11px', color: '#9ca3af' }}>Se preenchido os 3 meses, o valor médio é calculado automaticamente.</span>}
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                                    <button type="submit" className="btn btn-primary">{editingCost ? 'Salvar Alterações' : 'Criar Custo'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* ══════════ DELETE CONFIRMATION MODAL ══════════ */}
            {
                confirmDelete && (
                    <div className="modal-overlay">
                        <div className="modal confirm-dialog" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>Confirmar Exclusão</h3>
                                <button className="btn-icon" onClick={() => setConfirmDelete(null)}>✕</button>
                            </div>
                            <div className="modal-body">
                                <p>Tem certeza que deseja excluir o custo <strong>{confirmDelete.name}</strong>?</p>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Cancelar</button>
                                <button className="btn" style={{ background: 'var(--accent-danger)', color: '#fff' }} onClick={handleDeleteCost}>Excluir</button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
