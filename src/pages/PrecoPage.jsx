import { useState, useEffect, useCallback } from 'react';
import { getProducts, getCosts, getRecipes, getRecipeIngredients, getRawMaterials, savePriceTableEntry } from '../utils/storage';

// Tax fields from Regras Tributárias (venda group)
const TAX_KEYS = [
    { key: 'vendaIcms', label: 'ICMS' },
    { key: 'vendaPis', label: 'PIS' },
    { key: 'vendaCofins', label: 'COFINS' },
    { key: 'vendaIr', label: 'IR' },
    { key: 'vendaCs', label: 'CS' },
    { key: 'vendaIbs', label: 'IBS' },
    { key: 'vendaCbs', label: 'CBS' },
];

export default function PrecoPage() {
    const [products, setProducts] = useState([]);
    const [costs, setCosts] = useState([]);
    const [recipes, setRecipes] = useState([]);
    const [recipeIngredients, setRecipeIngredients] = useState({}); // recipeId -> ingredients[]
    const [rawMaterials, setRawMaterials] = useState([]);

    // ── Top card selections ──────────────────────────────────
    const [data, setData] = useState(new Date().toISOString().slice(0, 10));
    const [selectedProductId, setSelectedProductId] = useState('');
    const [regimeTributario, setRegimeTributario] = useState('Lucro Presumido');
    const [operacao, setOperacao] = useState('Dentro do estado');
    const [emitente, setEmitente] = useState('ROMICA');

    // Force Simples Nacional when RMC is selected
    useEffect(() => {
        if (emitente === 'RMC') setRegimeTributario('Simples Nacional');
    }, [emitente]);

    // ── Form card ────────────────────────────────────────────
    const [tabela, setTabela] = useState('Volume');
    const [margemTipo, setMargemTipo] = useState('%');
    const [margemValor, setMargemValor] = useState('');
    const [freteTipo, setFreteTipo] = useState('%');
    const [freteValor, setFreteValor] = useState('');
    const [comissaoTipo, setComissaoTipo] = useState('%');
    const [comissaoValor, setComissaoValor] = useState('');

    // ── Taxes ────────────────────────────────────────────────
    const [taxes, setTaxes] = useState({}); // { vendaIcms: 0, vendaPis: 0, ... }

    // ── Confirmation card ─────────────────────────────────────
    const [useFriendlyName, setUseFriendlyName] = useState(false);
    const [friendlyName, setFriendlyName] = useState('');
    const [useManualPrice, setUseManualPrice] = useState(false);
    const [manualPrice, setManualPrice] = useState('');
    const [insertFeedback, setInsertFeedback] = useState('');
    const [showInsertModal, setShowInsertModal] = useState(false);
    const [insertModalData, setInsertModalData] = useState(null);

    const refresh = useCallback(async () => {
        const [p, c, r, rm] = await Promise.all([getProducts(), getCosts(), getRecipes(), getRawMaterials()]);
        setProducts(p);
        setCosts(c);
        setRecipes(r);
        setRawMaterials(rm);
        // Preload all recipe ingredients
        const ingMap = {};
        await Promise.all(r.map(async (rec) => {
            ingMap[rec.id] = await getRecipeIngredients(rec.id);
        }));
        setRecipeIngredients(ingMap);
    }, []);

    useEffect(() => { refresh(); }, [refresh]);

    // Selected product object
    const selectedProduct = products.find(p => p.id === selectedProductId);

    // ── Recalculate taxes when product/regime/operacao changes ─
    useEffect(() => {
        if (!selectedProduct) { setTaxes({}); return; }

        const newTaxes = {};

        if (regimeTributario === 'Sem Nfe') {
            // All taxes = 0
            TAX_KEYS.forEach(t => { newTaxes[t.key] = 0; });
        } else if (regimeTributario === 'Simples Nacional') {
            // Bring taxes > 0 from product, but force ICMS = 18
            TAX_KEYS.forEach(t => {
                const val = Number(selectedProduct[t.key]) || 0;
                if (t.key === 'vendaIcms') {
                    newTaxes[t.key] = 18;
                } else {
                    newTaxes[t.key] = val > 0 ? val : 0;
                }
            });
        } else {
            // Lucro Presumido — bring taxes > 0 from product
            TAX_KEYS.forEach(t => {
                const val = Number(selectedProduct[t.key]) || 0;
                newTaxes[t.key] = val > 0 ? val : 0;
            });
        }

        // If "Fora do estado" → keep names but let user edit (values reset to 0 for manual input)
        if (operacao === 'Fora do estado') {
            TAX_KEYS.forEach(t => { newTaxes[t.key] = 0; });
        }

        // If emitente = RMC → ICMS = 4%, all others = 0
        if (emitente === 'RMC') {
            TAX_KEYS.forEach(t => {
                newTaxes[t.key] = t.key === 'vendaIcms' ? 4 : 0;
            });
        }

        setTaxes(newTaxes);
    }, [selectedProduct, regimeTributario, operacao, emitente]);

    // Only show taxes that are > 0 OR when "Fora do estado" (show all for manual input)
    const visibleTaxes = TAX_KEYS.filter(t => {
        if (operacao === 'Fora do estado') return true;
        if (regimeTributario === 'Sem Nfe') return false;
        // Show all that the product has > 0 or that were set by regime logic
        const productVal = Number(selectedProduct?.[t.key]) || 0;
        if (regimeTributario === 'Simples Nacional' && t.key === 'vendaIcms') return true;
        return productVal > 0;
    });

    function handleTaxChange(key, value) {
        setTaxes(prev => ({ ...prev, [key]: Number(value) || 0 }));
    }

    // ── RENDER ────────────────────────────────────────────────
    return (
        <div className="page-container">
            <div className="page-header" style={{ marginBottom: '16px' }}>
                <div className="page-header-left">
                    <h2>Gerador de Preço</h2>
                    <p>Configure e gere preços para seus produtos</p>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                {/* ══════════ LEFT SIDE - 50% ══════════ */}
                <div style={{ width: '50%', minWidth: '380px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    {/* ── Selection Card ── */}
                    <div className="card" style={{ padding: '20px 24px' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Configuração
                        </h4>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                            {/* Emitente - Toggle */}
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={labelStyle}>Emitente</label>
                                <div style={{
                                    display: 'flex', borderRadius: '8px', overflow: 'hidden',
                                    border: '1px solid var(--border-color)',
                                }}>
                                    <button
                                        type="button"
                                        onClick={() => setEmitente('ROMICA')}
                                        style={toggleBtnStyle(emitente === 'ROMICA')}
                                    >
                                        ROMICA
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEmitente('RMC')}
                                        style={toggleBtnStyle(emitente === 'RMC')}
                                    >
                                        RMC
                                    </button>
                                </div>
                            </div>

                            {/* Data */}
                            <div>
                                <label style={labelStyle}>Data</label>
                                <input
                                    className="form-input"
                                    type="date"
                                    value={data}
                                    onChange={e => setData(e.target.value)}
                                    style={{ width: '100%' }}
                                />
                            </div>

                            {/* Produto */}
                            <div>
                                <label style={labelStyle}>Produto</label>
                                <select
                                    className="form-select"
                                    value={selectedProductId}
                                    onChange={e => setSelectedProductId(e.target.value)}
                                    style={{ width: '100%' }}
                                >
                                    <option value="">Selecione um produto...</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Regime Tributário */}
                            <div>
                                <label style={labelStyle}>Regime Tributário</label>
                                <select
                                    className="form-select"
                                    value={regimeTributario}
                                    onChange={e => setRegimeTributario(e.target.value)}
                                    disabled={emitente === 'RMC'}
                                    style={{ width: '100%', opacity: emitente === 'RMC' ? 0.5 : 1, cursor: emitente === 'RMC' ? 'not-allowed' : 'pointer' }}
                                >
                                    <option value="Simples Nacional">Simples Nacional</option>
                                    <option value="Lucro Presumido">Lucro Presumido</option>
                                    <option value="Sem Nfe">Sem Nfe</option>
                                </select>
                            </div>

                            {/* Operação - Toggle */}
                            <div>
                                <label style={labelStyle}>Operação</label>
                                <div style={{
                                    display: 'flex', borderRadius: '8px', overflow: 'hidden',
                                    border: '1px solid var(--border-color)',
                                }}>
                                    <button
                                        type="button"
                                        onClick={() => setOperacao('Dentro do estado')}
                                        style={toggleBtnStyle(operacao === 'Dentro do estado')}
                                    >
                                        Dentro do estado
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setOperacao('Fora do estado')}
                                        style={toggleBtnStyle(operacao === 'Fora do estado')}
                                    >
                                        Fora do estado
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Form Card ── */}
                    <div className="card" style={{ padding: '20px 24px' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Parâmetros de Preço
                        </h4>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {/* Tabela */}
                            <div>
                                <label style={labelStyle}>Tabela</label>
                                <select
                                    className="form-select"
                                    value={tabela}
                                    onChange={e => setTabela(e.target.value)}
                                    style={{ width: '100%' }}
                                >
                                    <option value="Volume">Volume</option>
                                    <option value="Mínimo">Mínimo</option>
                                    <option value="Médio">Médio</option>
                                    <option value="Máximo">Máximo</option>
                                </select>
                            </div>

                            {/* Margem */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                <div>
                                    <label style={labelStyle}>Margem</label>
                                    <div style={{
                                        display: 'flex', borderRadius: '8px', overflow: 'hidden',
                                        border: '1px solid var(--border-color)',
                                    }}>
                                        <button type="button" onClick={() => setMargemTipo('R$')} style={toggleBtnStyle(margemTipo === 'R$')}>R$</button>
                                        <button type="button" onClick={() => setMargemTipo('%')} style={toggleBtnStyle(margemTipo === '%')}>%</button>
                                    </div>
                                </div>
                                <div>
                                    <label style={labelStyle}>
                                        Margem de Lucro {margemTipo === 'R$' ? '(R$)' : '(%)'}
                                    </label>
                                    <input
                                        className="form-input"
                                        type="number"
                                        step="0.01"
                                        placeholder={margemTipo === 'R$' ? '0.00' : '0.00'}
                                        value={margemValor}
                                        onChange={e => setMargemValor(e.target.value)}
                                        style={{ width: '100%' }}
                                    />
                                </div>
                            </div>

                            {/* Frete */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                <div>
                                    <label style={labelStyle}>Frete</label>
                                    <div style={{
                                        display: 'flex', borderRadius: '8px', overflow: 'hidden',
                                        border: '1px solid var(--border-color)',
                                    }}>
                                        <button type="button" onClick={() => setFreteTipo('R$')} style={toggleBtnStyle(freteTipo === 'R$')}>R$</button>
                                        <button type="button" onClick={() => setFreteTipo('%')} style={toggleBtnStyle(freteTipo === '%')}>%</button>
                                    </div>
                                </div>
                                <div>
                                    <label style={labelStyle}>
                                        Frete Valor {freteTipo === 'R$' ? '(R$)' : '(%)'}
                                    </label>
                                    <input
                                        className="form-input"
                                        type="number"
                                        step="0.01"
                                        placeholder={freteTipo === 'R$' ? '0.00' : '0.00'}
                                        value={freteValor}
                                        onChange={e => setFreteValor(e.target.value)}
                                        style={{ width: '100%' }}
                                    />
                                </div>
                            </div>

                            {/* Comissão */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                <div>
                                    <label style={labelStyle}>Comissão</label>
                                    <div style={{
                                        display: 'flex', borderRadius: '8px', overflow: 'hidden',
                                        border: '1px solid var(--border-color)',
                                    }}>
                                        <button type="button" onClick={() => setComissaoTipo('R$')} style={toggleBtnStyle(comissaoTipo === 'R$')}>R$</button>
                                        <button type="button" onClick={() => setComissaoTipo('%')} style={toggleBtnStyle(comissaoTipo === '%')}>%</button>
                                    </div>
                                </div>
                                <div>
                                    <label style={labelStyle}>
                                        Comissão Valor {comissaoTipo === 'R$' ? '(R$)' : '(%)'}
                                    </label>
                                    <input
                                        className="form-input"
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={comissaoValor}
                                        onChange={e => setComissaoValor(e.target.value)}
                                        style={{ width: '100%' }}
                                    />
                                </div>
                            </div>

                            {/* ── Impostos ── */}
                            {selectedProduct && visibleTaxes.length > 0 && (
                                <div style={{ marginTop: '4px' }}>
                                    <label style={{ ...labelStyle, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        Impostos
                                        {operacao === 'Fora do estado' && (
                                            <span style={{
                                                fontSize: '11px', background: '#fef3c7', color: '#92400e',
                                                padding: '2px 8px', borderRadius: '4px', fontWeight: 500,
                                            }}>
                                                Preenchimento manual
                                            </span>
                                        )}
                                    </label>
                                    <div style={{
                                        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                                        gap: '10px',
                                    }}>
                                        {visibleTaxes.map(t => (
                                            <div key={t.key}>
                                                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                                                    {t.label} (%)
                                                </label>
                                                <input
                                                    className="form-input"
                                                    type="number"
                                                    step="0.01"
                                                    value={operacao === 'Fora do estado' ? (taxes[t.key] || '') : (taxes[t.key] ?? 0)}
                                                    placeholder={operacao === 'Fora do estado' ? String(Number(selectedProduct?.[t.key]) || 0) : '0'}
                                                    onChange={e => handleTaxChange(t.key, e.target.value)}
                                                    disabled={operacao !== 'Fora do estado'}
                                                    style={{
                                                        width: '100%',
                                                        textAlign: 'center',
                                                        fontFamily: 'monospace',
                                                        fontSize: '13px',
                                                        background: operacao !== 'Fora do estado' ? 'var(--bg-secondary)' : 'white',
                                                    }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Sem produto selecionado */}
                            {!selectedProduct && (
                                <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px', fontStyle: 'italic' }}>
                                    Selecione um produto para visualizar os impostos
                                </div>
                            )}

                            {/* Regime Sem Nfe info */}
                            {selectedProduct && regimeTributario === 'Sem Nfe' && operacao === 'Dentro do estado' && (
                                <div style={{
                                    padding: '10px 14px', borderRadius: '8px',
                                    background: '#f0fdf4', border: '1px solid #bbf7d0',
                                    fontSize: '13px', color: '#166534',
                                }}>
                                    ✅ Regime "Sem Nfe" — Todos os impostos estão zerados.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ══════════ RIGHT SIDE - 50% ══════════ */}
                <div style={{ flex: 1, minWidth: '380px', maxHeight: '80vh', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '24px 16px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
                        {!selectedProduct ? (
                            <div style={{ padding: '24px 4px', textAlign: 'center' }}>
                                <div style={{ fontSize: '40px', opacity: 0.3, marginBottom: '12px' }}>📦</div>
                                <h4 style={{ color: 'var(--text-primary)', marginBottom: '6px' }}>Selecione um Produto</h4>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Escolha um produto ao lado para visualizar os custos e gerar o preço.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                                {/* Cost tables row */}
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'stretch' }}>

                                    {/* ── Custos Operacionais ── */}
                                    {(() => {
                                        const operacionais = costs.filter(c => c.type === 'Operacional');
                                        const totalOp = operacionais.reduce((s, c) => s + (Number(c.valorMedio) || 0), 0);
                                        const isTercerizado = selectedProduct?.category === 'Tercerizado';
                                        return (
                                            <div className={isTercerizado ? '' : 'card'} style={{
                                                padding: '16px 18px', flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column',
                                                ...(isTercerizado ? {
                                                    opacity: 0.45, filter: 'grayscale(100%)', pointerEvents: 'none',
                                                    background: 'var(--bg-secondary)', borderRadius: '12px',
                                                    border: '1px dashed var(--border-color)',
                                                } : {}),
                                            }}>
                                                <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                    Custos Operacionais
                                                </h4>
                                                {operacionais.length === 0 ? (
                                                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px', fontStyle: 'italic' }}>Nenhum custo operacional cadastrado.</p>
                                                ) : (
                                                    <div style={{ overflowX: 'auto', flex: 1 }}>
                                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                            <thead>
                                                                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                                                                    <th style={thRight}>Nome</th>
                                                                    <th style={{ ...thRight, textAlign: 'right' }}>Valor Médio (R$)</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {operacionais.map(c => (
                                                                    <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                                        <td style={tdRight}>{c.name}</td>
                                                                        <td style={{ ...tdRight, textAlign: 'right', fontFamily: 'monospace' }}>R$ {(Number(c.valorMedio) || 0).toFixed(2)}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                                <div style={{ marginTop: 'auto', borderTop: '2px solid var(--border-color)', padding: '8px 10px', display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                                                    <span style={{ fontSize: '13px' }}>Total</span>
                                                    <span style={{ fontFamily: 'monospace', fontSize: '13px', color: isTercerizado ? '#9ca3af' : '#059669', textDecoration: isTercerizado ? 'line-through' : 'none' }}>R$ {totalOp.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* ── Custos Gerais ── */}
                                    {(() => {
                                        const gerais = costs.filter(c => c.type !== 'Operacional');
                                        const totalGerais = gerais.reduce((s, c) => s + (Number(c.valorMedio) || 0), 0);
                                        return (
                                            <div className="card" style={{ padding: '16px 18px', flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                                                <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                    Custos Gerais
                                                </h4>
                                                {gerais.length === 0 ? (
                                                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px', fontStyle: 'italic' }}>Nenhum custo geral cadastrado.</p>
                                                ) : (
                                                    <div style={{ overflowX: 'auto', flex: 1 }}>
                                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                            <thead>
                                                                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                                                                    <th style={thRight}>Nome</th>
                                                                    <th style={{ ...thRight, textAlign: 'right' }}>Valor Médio (R$)</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {gerais.map(c => (
                                                                    <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                                        <td style={tdRight}>{c.name}</td>
                                                                        <td style={{ ...tdRight, textAlign: 'right', fontFamily: 'monospace' }}>R$ {(Number(c.valorMedio) || 0).toFixed(2)}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                                <div style={{ marginTop: 'auto', borderTop: '2px solid var(--border-color)', padding: '8px 10px', display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                                                    <span style={{ fontSize: '13px' }}>Total</span>
                                                    <span style={{ fontFamily: 'monospace', fontSize: '13px', color: '#059669' }}>R$ {totalGerais.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                </div>

                                {/* ── Custos Absorvidos ── */}
                                {(() => {
                                    const totalCustoOperacional = costs.filter(c => c.type === 'Operacional').reduce((s, c) => s + (Number(c.valorMedio) || 0), 0);
                                    const totalCustoGeral = costs.filter(c => c.type !== 'Operacional').reduce((s, c) => s + (Number(c.valorMedio) || 0), 0);
                                    const totalVendas = products.reduce((s, p) => s + (Number(p.vendasMes) || 0), 0);
                                    const vendasMesProd = Number(selectedProduct.vendasMes) || 0;

                                    // Geral: rateio based on vendasMes share among ALL products
                                    const rateioGeral = totalVendas > 0 ? (vendasMesProd * 100) / totalVendas : 0;
                                    const custoGeralAbsorvido = (totalCustoGeral * rateioGeral) / 100;

                                    // Operacional: rateio based on producaoMes share among Produção products
                                    const isProd = selectedProduct?.category === 'Produção';
                                    let rateioOp = 0;
                                    let custoOpAbsorvido = 0;
                                    if (isProd) {
                                        const prodProducts = products.filter(p => p.category === 'Produção');
                                        const totalProducao = prodProducts.reduce((s, p) => s + (Number(p.producaoMes) || 0), 0);
                                        rateioOp = totalProducao > 0 ? ((Number(selectedProduct.producaoMes) || 0) * 100) / totalProducao : 0;
                                        custoOpAbsorvido = (totalCustoOperacional * rateioOp) / 100;
                                    }

                                    const rows = [];
                                    if (isProd) {
                                        rows.push({ label: 'Custos Operacionais', rateio: rateioOp, value: custoOpAbsorvido });
                                    }
                                    rows.push({ label: 'Custos Gerais', rateio: rateioGeral, value: custoGeralAbsorvido });
                                    const totalAbsorvido = rows.reduce((s, r) => s + r.value, 0);

                                    return (
                                        <div className="card" style={{ padding: '16px 18px' }}>
                                            <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                Custos Absorvidos
                                            </h4>
                                            <div style={{ overflowX: 'auto' }}>
                                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                    <thead>
                                                        <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                                                            <th style={thRight}>Tipo</th>
                                                            <th style={{ ...thRight, textAlign: 'right' }}>Rateio (%)</th>
                                                            <th style={{ ...thRight, textAlign: 'right' }}>Parcela (R$/mês)</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {rows.map(r => (
                                                            <tr key={r.label} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                                <td style={tdRight}>{r.label}</td>
                                                                <td style={{ ...tdRight, textAlign: 'right', fontFamily: 'monospace' }}>{r.rateio.toFixed(2)}%</td>
                                                                <td style={{ ...tdRight, textAlign: 'right', fontFamily: 'monospace' }}>R$ {r.value.toFixed(2)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                            <div style={{ marginTop: '0', borderTop: '2px solid var(--border-color)', padding: '8px 10px', display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                                                <span style={{ fontSize: '13px' }}>Total Absorvido</span>
                                                <span style={{ fontFamily: 'monospace', fontSize: '13px', color: '#059669' }}>R$ {totalAbsorvido.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* ── Custos da Receita (only for Produção) ── */}
                                {selectedProduct?.category === 'Produção' && (() => {
                                    const recipe = recipes.find(r => r.productId === selectedProduct.id);
                                    if (!recipe) return (
                                        <div className="card" style={{ padding: '20px 24px' }}>
                                            <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                Custos da Receita
                                            </h4>
                                            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', fontStyle: 'italic' }}>Nenhuma receita cadastrada para este produto.</p>
                                        </div>
                                    );
                                    const ings = recipeIngredients[recipe.id] || [];
                                    const producao = Number(recipe.producaoReceita) || 1;
                                    const totalRS = ings.reduce((s, i) => s + (Number(i.quantidade) || 0) * (Number(i.precoKg) || 0), 0);
                                    const totalIcmsRS = ings.reduce((s, i) => {
                                        const t = (Number(i.quantidade) || 0) * (Number(i.precoKg) || 0);
                                        const rm = rawMaterials.find(r => r.id === i.rawMaterialId);
                                        return s + ((Number(rm?.compraIcms) || 0) * t) / 100;
                                    }, 0);
                                    const custoUnidade = totalRS / producao;
                                    const creditoIcmsUnit = emitente === 'RMC' ? 0 : totalIcmsRS / producao;
                                    const custoReal = custoUnidade - creditoIcmsUnit;
                                    return (
                                        <div className="card" style={{ padding: '16px 18px' }}>
                                            <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                Custos da Receita
                                            </h4>
                                            {ings.length === 0 ? (
                                                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', fontStyle: 'italic' }}>Nenhum ingrediente cadastrado na receita.</p>
                                            ) : (
                                                <div style={{ overflowX: 'auto' }}>
                                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                        <thead>
                                                            <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                                                                <th style={thRight}>Matéria Prima</th>
                                                                <th style={{ ...thRight, textAlign: 'center' }}>Qtd. M.P.</th>
                                                                <th style={{ ...thRight, textAlign: 'center' }}>R$/kg</th>
                                                                <th style={{ ...thRight, textAlign: 'right' }}>Total (R$)</th>
                                                                <th style={{ ...thRight, textAlign: 'center' }}>Créd. ICMS(%)</th>
                                                                <th style={{ ...thRight, textAlign: 'right' }}>Créd. ICMS(R$)</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {ings.map(ing => {
                                                                const ingTotal = (Number(ing.quantidade) || 0) * (Number(ing.precoKg) || 0);
                                                                const rm = rawMaterials.find(r => r.id === ing.rawMaterialId);
                                                                const icmsPct = Number(rm?.compraIcms) || 0;
                                                                const icmsRS = (icmsPct * ingTotal) / 100;
                                                                return (
                                                                    <tr key={ing.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                                        <td style={tdRight}>{ing.rawMaterialName || '—'}</td>
                                                                        <td style={{ ...tdRight, textAlign: 'center', fontFamily: 'monospace' }}>{ing.quantidade}</td>
                                                                        <td style={{ ...tdRight, textAlign: 'center', fontFamily: 'monospace' }}>{Number(ing.precoKg).toFixed(2)}</td>
                                                                        <td style={{ ...tdRight, textAlign: 'right', fontFamily: 'monospace' }}>R$ {ingTotal.toFixed(2)}</td>
                                                                        <td style={{ ...tdRight, textAlign: 'center', fontFamily: 'monospace' }}>{icmsPct.toFixed(2)}%</td>
                                                                        <td style={{ ...tdRight, textAlign: 'right', fontFamily: 'monospace' }}>R$ {icmsRS.toFixed(2)}</td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                        <tfoot>
                                                            <tr style={{ borderTop: '2px solid var(--border-color)', fontWeight: 700 }}>
                                                                <td style={tdRight}>Total</td>
                                                                <td></td>
                                                                <td></td>
                                                                <td style={{ ...tdRight, textAlign: 'right', fontFamily: 'monospace', color: '#059669' }}>R$ {totalRS.toFixed(2)}</td>
                                                                <td></td>
                                                                <td style={{ ...tdRight, textAlign: 'right', fontFamily: 'monospace', color: '#059669' }}>R$ {totalIcmsRS.toFixed(2)}</td>
                                                            </tr>
                                                        </tfoot>
                                                    </table>
                                                </div>
                                            )}
                                            <div style={{ display: 'flex', gap: '24px', marginTop: '16px' }}>
                                                <div style={{ flex: 1, background: 'var(--bg-secondary)', borderRadius: '8px', padding: '14px 16px', textAlign: 'center' }}>
                                                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Custo Unidade</div>
                                                    <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-primary)' }}>R$ {custoUnidade.toFixed(2)}</div>
                                                </div>
                                                <div style={{
                                                    flex: 1, borderRadius: '8px', padding: '14px 16px', textAlign: 'center',
                                                    background: emitente === 'RMC' ? 'var(--bg-secondary)' : '#f0fdf4',
                                                    border: emitente === 'RMC' ? '1px dashed var(--border-color)' : '1px solid #bbf7d0',
                                                    opacity: emitente === 'RMC' ? 0.4 : 1,
                                                }}>
                                                    <div style={{ fontSize: '11px', fontWeight: 600, color: emitente === 'RMC' ? 'var(--text-secondary)' : '#166534', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Crédito ICMS</div>
                                                    <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'monospace', color: emitente === 'RMC' ? 'var(--text-secondary)' : '#059669' }}>R$ {creditoIcmsUnit.toFixed(2)}</div>
                                                </div>
                                                <div style={{ flex: 1, background: '#eff6ff', borderRadius: '8px', padding: '14px 16px', textAlign: 'center', border: '1px solid #bfdbfe' }}>
                                                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Custo Real</div>
                                                    <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'monospace', color: '#2563eb' }}>R$ {custoReal.toFixed(2)}</div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* ── Detalhes da Compra (only for Tercerizado) ── */}
                                {selectedProduct?.category === 'Tercerizado' && (() => {
                                    const precoCompra = Number(selectedProduct.compraPreco) || 0;
                                    const icmsCompra = emitente === 'RMC' ? 0 : (Number(selectedProduct.compraIcms) || 0);
                                    const creditoIcms = emitente === 'RMC' ? 0 : (precoCompra * icmsCompra) / 100;
                                    return (
                                        <div className="card" style={{ padding: '16px 18px' }}>
                                            <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                Custos da Compra
                                            </h4>
                                            <div style={{ display: 'flex', gap: '24px' }}>
                                                <div style={{ flex: 1, background: 'var(--bg-secondary)', borderRadius: '8px', padding: '14px 16px', textAlign: 'center' }}>
                                                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Preço de Compra</div>
                                                    <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-primary)' }}>R$ {precoCompra.toFixed(2)}</div>
                                                </div>
                                                <div style={{
                                                    flex: 1, borderRadius: '8px', padding: '14px 16px', textAlign: 'center',
                                                    background: emitente === 'RMC' ? 'var(--bg-secondary)' : 'var(--bg-secondary)',
                                                    border: emitente === 'RMC' ? '1px dashed var(--border-color)' : 'none',
                                                    opacity: emitente === 'RMC' ? 0.4 : 1,
                                                }}>
                                                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>ICMS de Compra</div>
                                                    <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'monospace', color: emitente === 'RMC' ? 'var(--text-secondary)' : 'var(--text-primary)' }}>{icmsCompra.toFixed(2)}%</div>
                                                </div>
                                                <div style={{
                                                    flex: 1, borderRadius: '8px', padding: '14px 16px', textAlign: 'center',
                                                    background: emitente === 'RMC' ? 'var(--bg-secondary)' : '#f0fdf4',
                                                    border: emitente === 'RMC' ? '1px dashed var(--border-color)' : '1px solid #bbf7d0',
                                                    opacity: emitente === 'RMC' ? 0.4 : 1,
                                                }}>
                                                    <div style={{ fontSize: '11px', fontWeight: 600, color: emitente === 'RMC' ? 'var(--text-secondary)' : '#166534', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Crédito de ICMS</div>
                                                    <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'monospace', color: emitente === 'RMC' ? 'var(--text-secondary)' : '#059669' }}>R$ {creditoIcms.toFixed(2)}</div>
                                                </div>
                                                <div style={{ flex: 1, background: '#eff6ff', borderRadius: '8px', padding: '14px 16px', textAlign: 'center', border: '1px solid #bfdbfe' }}>
                                                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Custo Real</div>
                                                    <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'monospace', color: '#2563eb' }}>R$ {(precoCompra - creditoIcms).toFixed(2)}</div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* ── Custo Final + Formação de Preço (side by side) ── */}
                                {(() => {
                                    // ── Compute Custo Real ──
                                    const isTercerizado = selectedProduct?.category === 'Tercerizado';
                                    let custoReal = 0;
                                    if (isTercerizado) {
                                        const precoCompra = Number(selectedProduct.compraPreco) || 0;
                                        const icmsCompra = Number(selectedProduct.compraIcms) || 0;
                                        const creditoIcms = emitente === 'RMC' ? 0 : (precoCompra * icmsCompra) / 100;
                                        custoReal = precoCompra - creditoIcms;
                                    } else {
                                        const recipe = recipes.find(r => r.productId === selectedProduct.id);
                                        if (recipe) {
                                            const ings = recipeIngredients[recipe.id] || [];
                                            const producao = Number(recipe.producaoReceita) || 1;
                                            const totalRS = ings.reduce((s, i) => s + (Number(i.quantidade) || 0) * (Number(i.precoKg) || 0), 0);
                                            const totalIcmsRS = ings.reduce((s, i) => {
                                                const t = (Number(i.quantidade) || 0) * (Number(i.precoKg) || 0);
                                                const rm = rawMaterials.find(r => r.id === i.rawMaterialId);
                                                return s + ((Number(rm?.compraIcms) || 0) * t) / 100;
                                            }, 0);
                                            const creditIcmsAdj = emitente === 'RMC' ? 0 : (totalIcmsRS / producao);
                                            custoReal = (totalRS / producao) - creditIcmsAdj;
                                        }
                                    }

                                    // ── Custos Operacionais Absorvidos (R$/unidade) ──
                                    const vendasMesProd = Number(selectedProduct.vendasMes) || 0;
                                    const totalCustoOp = costs.filter(c => c.type === 'Operacional').reduce((s, c) => s + (Number(c.valorMedio) || 0), 0);
                                    const totalCustoGeral = costs.filter(c => c.type !== 'Operacional').reduce((s, c) => s + (Number(c.valorMedio) || 0), 0);

                                    let rateioOpPct = 0;
                                    let custoAbsorvOpUnit = 0;
                                    if (selectedProduct.category === 'Produção') {
                                        const prodProducts = products.filter(p => p.category === 'Produção');
                                        const totalProducao = prodProducts.reduce((s, p) => s + (Number(p.producaoMes) || 0), 0);
                                        rateioOpPct = totalProducao > 0 ? ((Number(selectedProduct.producaoMes) || 0) * 100) / totalProducao : 0;
                                        const parcelaOp = totalCustoOp * rateioOpPct / 100;
                                        custoAbsorvOpUnit = vendasMesProd > 0 ? parcelaOp / vendasMesProd : 0;
                                    }

                                    // ── Custos Gerais Absorvidos (R$/unidade) ──
                                    const totalVendas = products.reduce((s, p) => s + (Number(p.vendasMes) || 0), 0);
                                    const rateioGeralPct = totalVendas > 0 ? (vendasMesProd * 100) / totalVendas : 0;
                                    const parcelaGeral = totalCustoGeral * rateioGeralPct / 100;
                                    const custoAbsorvGeralUnit = vendasMesProd > 0 ? parcelaGeral / vendasMesProd : 0;

                                    // ── Margem ──
                                    const margemNum = Number(margemValor) || 0;
                                    const margemPct = margemTipo === '%' ? margemNum : 0;
                                    const margemRS = margemTipo === 'R$' ? margemNum : 0;

                                    // ── Frete ──
                                    const freteNum = Number(freteValor) || 0;
                                    const fretePct = freteTipo === '%' ? freteNum : 0;
                                    const freteRS = freteTipo === 'R$' ? freteNum : 0;

                                    // ── Comissão ──
                                    const comissaoNum = Number(comissaoValor) || 0;
                                    const comissaoPct = comissaoTipo === '%' ? comissaoNum : 0;
                                    const comissaoRS = comissaoTipo === 'R$' ? comissaoNum : 0;

                                    // ── Custo Final = Custo Real + Absorções R$/unit + extras R$ ──
                                    const custoFinal = custoReal + custoAbsorvOpUnit + custoAbsorvGeralUnit + margemRS + freteRS + comissaoRS;

                                    // ── Markup: Preço = CustoFinal / (1 - impostos% - margem% - frete% - comissão%) ──
                                    const totalTaxPct = visibleTaxes.reduce((s, t) => s + (Number(taxes[t.key]) || 0), 0);
                                    const totalDivisor = totalTaxPct + margemPct + fretePct + comissaoPct;
                                    const precoFinal = totalDivisor < 100 ? custoFinal / (1 - totalDivisor / 100) : custoFinal;
                                    const totalImpostosRS = (precoFinal * totalTaxPct) / 100;
                                    const margemRS_calc = margemTipo === '%' ? (precoFinal * margemPct) / 100 : margemRS;
                                    const freteRS_calc = freteTipo === '%' ? (precoFinal * fretePct) / 100 : freteRS;
                                    const comissaoRS_calc = comissaoTipo === '%' ? (precoFinal * comissaoPct) / 100 : comissaoRS;

                                    // ── Custo Final rows ──
                                    const cfRows = [
                                        { label: 'Custo Real', value: custoReal },
                                    ];
                                    if (custoAbsorvOpUnit > 0) {
                                        cfRows.push({ label: <>Custos Absorvidos<br />Operacionais ({rateioOpPct.toFixed(2)}%)</>, value: custoAbsorvOpUnit });
                                    }
                                    if (custoAbsorvGeralUnit > 0) {
                                        cfRows.push({ label: <>Custos Absorvidos<br />Gerais ({rateioGeralPct.toFixed(2)}%)</>, value: custoAbsorvGeralUnit });
                                    }
                                    // R$ values go here (they add to Custo Final)
                                    if (margemTipo === 'R$' && margemRS > 0) {
                                        cfRows.push({ label: `Margem (R$${margemNum.toFixed(2)})`, value: margemRS });
                                    }
                                    if (freteTipo === 'R$' && freteRS > 0) {
                                        cfRows.push({ label: `Frete (R$${freteNum.toFixed(2)})`, value: freteRS });
                                    }
                                    if (comissaoTipo === 'R$' && comissaoRS > 0) {
                                        cfRows.push({ label: `Comissão (R$${comissaoNum.toFixed(2)})`, value: comissaoRS });
                                    }

                                    // ── Formação de Preço rows (ordered) ──
                                    const fpRows = [
                                        { label: 'Custo Final', value: custoFinal },
                                    ];
                                    // Impostos: ICMS, PIS, COFINS, IR, CS, IBS, CBS
                                    visibleTaxes.forEach(t => {
                                        const pct = Number(taxes[t.key]) || 0;
                                        if (pct > 0) {
                                            fpRows.push({ label: `${t.label} (${pct.toFixed(2)}%)`, value: (precoFinal * pct) / 100 });
                                        }
                                    });
                                    // % values go here (they're in the markup divisor)
                                    if (margemTipo === '%' && margemPct > 0) {
                                        fpRows.push({ label: `Margem (${margemPct.toFixed(2)}%)`, value: margemRS_calc });
                                    }
                                    if (freteTipo === '%' && fretePct > 0) {
                                        fpRows.push({ label: `Frete (${fretePct.toFixed(2)}%)`, value: freteRS_calc });
                                    }
                                    if (comissaoTipo === '%' && comissaoPct > 0) {
                                        fpRows.push({ label: `Comissão (${comissaoPct.toFixed(2)}%)`, value: comissaoRS_calc });
                                    }

                                    // ── Pie chart data ──
                                    const pieData = [];
                                    pieData.push({ label: 'Custo Final', value: custoFinal, color: '#059669' });
                                    if (totalImpostosRS > 0) pieData.push({ label: 'Impostos', value: totalImpostosRS, color: '#ef4444' });
                                    if (freteRS_calc > 0) pieData.push({ label: 'Frete', value: freteRS_calc, color: '#f59e0b' });
                                    if (comissaoRS_calc > 0) pieData.push({ label: 'Comissão', value: comissaoRS_calc, color: '#8b5cf6' });
                                    if (margemRS_calc > 0) pieData.push({ label: 'Margem', value: margemRS_calc, color: '#3b82f6' });
                                    const pieTotal = pieData.reduce((s, d) => s + d.value, 0);

                                    // Build SVG pie slices
                                    const piePaths = [];
                                    let cumAngle = -Math.PI / 2;
                                    const cx = 90, cy = 90, r = 80;
                                    pieData.forEach((d, i) => {
                                        const pct = pieTotal > 0 ? d.value / pieTotal : 0;
                                        if (pct <= 0) return;
                                        const angle = pct * 2 * Math.PI;
                                        const largeArc = angle > Math.PI ? 1 : 0;
                                        const x1 = cx + r * Math.cos(cumAngle);
                                        const y1 = cy + r * Math.sin(cumAngle);
                                        const x2 = cx + r * Math.cos(cumAngle + angle);
                                        const y2 = cy + r * Math.sin(cumAngle + angle);
                                        if (pct >= 0.9999) {
                                            piePaths.push(<circle key={i} cx={cx} cy={cy} r={r} fill={d.color} />);
                                        } else {
                                            piePaths.push(<path key={i} d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} Z`} fill={d.color} />);
                                        }
                                        cumAngle += angle;
                                    });

                                    const displayPrice = useManualPrice ? (parseFloat(manualPrice.replace(',', '.')) || 0) : precoFinal;

                                    return (
                                        <>
                                            <div style={{ display: 'flex', gap: '16px', alignItems: 'stretch' }}>
                                                {/* Custo Final card */}
                                                <div className="card" style={{ padding: '16px 18px', flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                                                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                        Custo Final
                                                    </h4>
                                                    <div style={{ overflowX: 'auto', flex: 1 }}>
                                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                            <thead>
                                                                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                                                                    <th style={thRight}>Componente</th>
                                                                    <th style={{ ...thRight, textAlign: 'right' }}>Valor (R$)</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {cfRows.map(r => (
                                                                    <tr key={r.label} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                                        <td style={tdRight}>{r.label}</td>
                                                                        <td style={{ ...tdRight, textAlign: 'right', fontFamily: 'monospace' }}>R$ {r.value.toFixed(2)}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                    <div style={{ marginTop: 'auto', borderTop: '2px solid var(--border-color)', padding: '8px 10px', display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                                                        <span style={{ fontSize: '13px' }}>Custo Final</span>
                                                        <span style={{ fontFamily: 'monospace', fontSize: '13px', color: '#059669' }}>R$ {custoFinal.toFixed(2)}</span>
                                                    </div>
                                                </div>

                                                {/* Formação de Preço card */}
                                                <div className="card" style={{ padding: '16px 18px', flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                                                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                        Formação de Preço
                                                    </h4>
                                                    <div style={{ overflowX: 'auto', flex: 1 }}>
                                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                            <thead>
                                                                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                                                                    <th style={thRight}>Componente</th>
                                                                    <th style={{ ...thRight, textAlign: 'right' }}>Valor (R$)</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {fpRows.map(r => (
                                                                    <tr key={r.label} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                                        <td style={tdRight}>{r.label}</td>
                                                                        <td style={{ ...tdRight, textAlign: 'right', fontFamily: 'monospace' }}>R$ {r.value.toFixed(2)}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                    <div style={{ marginTop: 'auto', borderTop: '2px solid var(--border-color)', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, borderTop: '1px solid var(--border-color)', paddingTop: '6px' }}>
                                                            <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>Preço de Venda</span>
                                                            <span style={{ fontFamily: 'monospace', fontSize: '15px', color: '#2563eb' }}>R$ {precoFinal.toFixed(2)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* ── Pie Chart + Confirmation row ── */}
                                            <div style={{ display: 'flex', gap: '16px', alignItems: 'stretch' }}>

                                                {/* Pie Chart card */}
                                                <div className="card" style={{ padding: '16px 18px', flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                                                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                        Composição do Preço
                                                    </h4>
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', flex: 1 }}>
                                                        <svg width="100%" height="220" viewBox="0 0 180 180" style={{ maxWidth: '280px' }}>
                                                            {piePaths}
                                                            <circle cx={cx} cy={cy} r="40" fill="white" />
                                                            <text x={cx} y={cy - 6} textAnchor="middle" style={{ fontSize: '11px', fontWeight: 700, fill: 'var(--text-secondary)' }}>PREÇO</text>
                                                            <text x={cx} y={cy + 12} textAnchor="middle" style={{ fontSize: '13px', fontWeight: 700, fill: 'var(--text-primary)', fontFamily: 'monospace' }}>R$ {precoFinal.toFixed(2)}</text>
                                                        </svg>
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 20px', justifyContent: 'center' }}>
                                                            {pieData.map(d => (
                                                                <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                    <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: d.color, flexShrink: 0 }} />
                                                                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{d.label}</span>
                                                                    <span style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-primary)', fontWeight: 600 }}>
                                                                        R$ {d.value.toFixed(2)}
                                                                    </span>
                                                                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                                                        ({pieTotal > 0 ? ((d.value / pieTotal) * 100).toFixed(1) : '0'}%)
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Confirmation card */}
                                                <div className="card" style={{ padding: '16px 18px', flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                        Confirmação
                                                    </h4>

                                                    {/* Line 1: Friendly name toggle */}
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                                        <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>Deseja inserir um nome amigável para inserir na tabela?</span>
                                                        <div style={{ display: 'flex', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                                                            <button
                                                                onClick={() => setUseFriendlyName(false)}
                                                                style={{
                                                                    padding: '5px 14px', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer',
                                                                    background: !useFriendlyName ? 'var(--accent-primary)' : 'transparent',
                                                                    color: !useFriendlyName ? 'white' : 'var(--text-secondary)',
                                                                    transition: 'all 0.2s',
                                                                }}
                                                            >Não</button>
                                                            <button
                                                                onClick={() => setUseFriendlyName(true)}
                                                                style={{
                                                                    padding: '5px 14px', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer',
                                                                    background: useFriendlyName ? 'var(--accent-primary)' : 'transparent',
                                                                    color: useFriendlyName ? 'white' : 'var(--text-secondary)',
                                                                    transition: 'all 0.2s',
                                                                }}
                                                            >Sim</button>
                                                        </div>
                                                        {useFriendlyName && (
                                                            <input
                                                                type="text"
                                                                placeholder="Nome amigável..."
                                                                value={friendlyName}
                                                                onChange={e => setFriendlyName(e.target.value)}
                                                                style={{
                                                                    flex: 1, minWidth: '160px', padding: '7px 12px', fontSize: '13px',
                                                                    border: '1px solid var(--border-color)', borderRadius: '6px',
                                                                    background: 'var(--bg-primary)', color: 'var(--text-primary)',
                                                                    outline: 'none',
                                                                }}
                                                            />
                                                        )}
                                                    </div>

                                                    {/* Line 2: Toggle + Suggested price + Final price */}
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                                                        {/* Toggle bar spanning full width */}
                                                        <div style={{ display: 'flex', borderRadius: '8px 8px 0 0', overflow: 'hidden', border: '1px solid var(--border-color)', borderBottom: 'none' }}>
                                                            <button
                                                                onClick={() => setUseManualPrice(false)}
                                                                style={{
                                                                    flex: 1, padding: '8px 16px', fontSize: '12px', fontWeight: 700, border: 'none', cursor: 'pointer',
                                                                    background: !useManualPrice ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                                                                    color: !useManualPrice ? 'white' : 'var(--text-secondary)',
                                                                    transition: 'all 0.2s', letterSpacing: '0.3px',
                                                                }}
                                                            >Preço Sugerido</button>
                                                            <button
                                                                onClick={() => setUseManualPrice(true)}
                                                                style={{
                                                                    flex: 1, padding: '8px 16px', fontSize: '12px', fontWeight: 700, border: 'none', cursor: 'pointer',
                                                                    background: useManualPrice ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                                                                    color: useManualPrice ? 'white' : 'var(--text-secondary)',
                                                                    transition: 'all 0.2s', letterSpacing: '0.3px',
                                                                }}
                                                            >Preço Manual</button>
                                                        </div>

                                                        {/* Cards row */}
                                                        <div style={{ display: 'flex', gap: '0' }}>
                                                            {/* Preço Sugerido */}
                                                            <div style={{
                                                                flex: 1, background: '#eff6ff', padding: '14px 16px',
                                                                textAlign: 'center', borderLeft: '1px solid #bfdbfe', borderBottom: '1px solid #bfdbfe',
                                                                borderRadius: '0 0 0 8px',
                                                            }}>
                                                                <div style={{ fontSize: '11px', fontWeight: 600, color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                                                                    Preço de Venda Sugerido
                                                                </div>
                                                                <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'monospace', color: '#2563eb' }}>
                                                                    R$ {precoFinal.toFixed(2)}
                                                                </div>
                                                            </div>

                                                            {/* Preço Final */}
                                                            <div style={{
                                                                flex: 1, padding: '14px 16px',
                                                                textAlign: 'center',
                                                                background: useManualPrice ? 'var(--bg-primary)' : 'var(--bg-secondary)',
                                                                borderRight: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)',
                                                                borderRadius: '0 0 8px 0',
                                                                display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '6px',
                                                            }}>
                                                                <div style={{ fontSize: '11px', fontWeight: 600, color: useManualPrice ? 'var(--accent-primary)' : 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                                    Preço Final
                                                                </div>
                                                                {useManualPrice ? (
                                                                    <input
                                                                        type="text"
                                                                        placeholder="0,00"
                                                                        value={manualPrice}
                                                                        onChange={e => setManualPrice(e.target.value)}
                                                                        style={{
                                                                            width: '100%', textAlign: 'center', padding: '6px 10px',
                                                                            fontSize: '20px', fontWeight: 700, fontFamily: 'monospace',
                                                                            border: '1px solid var(--border-color)', borderRadius: '6px',
                                                                            background: 'var(--bg-primary)', color: 'var(--accent-primary)',
                                                                            outline: 'none',
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'monospace', color: '#6b7280' }}>
                                                                        R$ {precoFinal.toFixed(2)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Line 3: Action buttons */}
                                                    <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
                                                        <button
                                                            style={{
                                                                flex: 1, padding: '10px 16px', fontSize: '13px', fontWeight: 700,
                                                                border: 'none', borderRadius: '8px', cursor: 'pointer',
                                                                background: 'var(--accent-primary)', color: 'white',
                                                                transition: 'all 0.2s',
                                                            }}
                                                        >
                                                            ✓ Confirmar
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                if (!selectedProduct) return;
                                                                const productName = useFriendlyName && friendlyName.trim() ? friendlyName.trim() : selectedProduct.name;
                                                                // Badge: RMC always Normal, ROMICA+SN = Simples, otherwise Normal
                                                                let regimeBadge = 'Normal';
                                                                if (emitente === 'ROMICA' && regimeTributario === 'Simples Nacional') {
                                                                    regimeBadge = 'Simples';
                                                                }
                                                                const emitenteVal = regimeTributario === 'Sem Nfe' ? 'S/NF' : emitente;
                                                                const displayPrice = useManualPrice ? (parseFloat(manualPrice.replace(',', '.')) || 0) : precoFinal;
                                                                setInsertModalData({ productName, regimeBadge, emitenteVal, tabela, regimeTributario, displayPrice });
                                                                setShowInsertModal(true);
                                                            }}
                                                            style={{
                                                                flex: 1, padding: '10px 16px', fontSize: '13px', fontWeight: 700,
                                                                border: '2px solid var(--accent-primary)', borderRadius: '8px', cursor: 'pointer',
                                                                background: 'transparent', color: 'var(--accent-primary)',
                                                                transition: 'all 0.2s',
                                                            }}
                                                        >
                                                            Inserir Tabela
                                                        </button>
                                                    </div>
                                                </div>

                                            </div>
                                        </>
                                    );
                                })()}

                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Insert Confirmation Modal ── */}
            {showInsertModal && insertModalData && (() => {
                const { productName, regimeBadge, emitenteVal, tabela: tabelaVal, regimeTributario: regimeVal, displayPrice } = insertModalData;
                return (
                    <div style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
                    }} onClick={() => setShowInsertModal(false)}>
                        <div style={{
                            background: 'var(--bg-primary)', borderRadius: '16px', padding: '28px 32px',
                            width: '420px', maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                        }} onClick={e => e.stopPropagation()}>
                            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '20px', textAlign: 'center' }}>
                                Confirmar Inserção na Tabela
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                                {[
                                    { label: 'Produto', value: `${productName} (${regimeBadge})` },
                                    { label: 'Tabela', value: tabelaVal },
                                    { label: 'Emitente', value: emitenteVal },
                                    { label: 'Regime Tributário', value: regimeVal },
                                    { label: 'Preço Final', value: `R$ ${displayPrice.toFixed(2)}`, highlight: true },
                                ].map(item => (
                                    <div key={item.label} style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: '10px 14px', borderRadius: '8px',
                                        background: item.highlight ? '#eff6ff' : 'var(--bg-secondary)',
                                        border: item.highlight ? '1px solid #bfdbfe' : '1px solid var(--border-color)',
                                    }}>
                                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{item.label}</span>
                                        <span style={{
                                            fontSize: item.highlight ? '16px' : '13px',
                                            fontWeight: 700, fontFamily: 'monospace',
                                            color: item.highlight ? '#2563eb' : 'var(--text-primary)',
                                        }}>{item.value}</span>
                                    </div>
                                ))}
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button onClick={() => setShowInsertModal(false)} style={{
                                    flex: 1, padding: '10px', fontSize: '13px', fontWeight: 700,
                                    border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer',
                                    background: 'transparent', color: 'var(--text-secondary)',
                                }}>Cancelar</button>
                                <button onClick={async () => {
                                    await savePriceTableEntry({
                                        productName, regimeBadge, tabelaTipo: 'Comum',
                                        tabela: tabelaVal, emitente: emitenteVal, precoFinal: displayPrice,
                                    });
                                    setShowInsertModal(false);
                                    setInsertModalData(null);
                                    setInsertFeedback(`"${productName} (${regimeBadge})" inserido na tabela ${tabelaVal} / ${emitenteVal}`);
                                    setTimeout(() => setInsertFeedback(''), 5000);
                                }} style={{
                                    flex: 1, padding: '10px', fontSize: '13px', fontWeight: 700,
                                    border: 'none', borderRadius: '8px', cursor: 'pointer',
                                    background: 'var(--accent-primary)', color: 'white',
                                }}>✓ Confirmar</button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* ── Success Toast ── */}
            {insertFeedback && (
                <div style={{
                    position: 'fixed', top: '24px', left: '50%', transform: 'translateX(-50%)',
                    zIndex: 10000, background: '#059669', color: 'white',
                    padding: '14px 28px', borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(5, 150, 105, 0.4)',
                    fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px',
                }}>
                    <span style={{ fontSize: '18px' }}>✓</span>
                    {insertFeedback}
                </div>
            )}
        </div >
    );
}

// ── Style helpers ────────────────────────────────────────────

const labelStyle = {
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    marginBottom: '6px',
    display: 'block',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
};

function toggleBtnStyle(active) {
    return {
        flex: 1,
        padding: '8px 12px',
        fontSize: '12px',
        fontWeight: 600,
        border: 'none',
        cursor: 'pointer',
        transition: 'all 0.2s',
        background: active ? 'var(--accent-primary)' : 'transparent',
        color: active ? 'white' : 'var(--text-secondary)',
    };
}

const thRight = {
    padding: '8px 10px',
    textAlign: 'left',
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
};

const tdRight = {
    padding: '8px 10px',
    fontSize: '13px',
    color: 'var(--text-primary)',
};
