import { useState, useEffect, useCallback } from 'react';
import { getProducts, getCosts, getRecipes, getRecipeIngredients, getRawMaterials } from '../utils/storage';

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
    const [regimeTributario, setRegimeTributario] = useState('Simples Nacional');
    const [operacao, setOperacao] = useState('Dentro do estado');

    // ── Form card ────────────────────────────────────────────
    const [tabela, setTabela] = useState('Volume');
    const [margemTipo, setMargemTipo] = useState('R$');
    const [margemValor, setMargemValor] = useState('');
    const [freteTipo, setFreteTipo] = useState('R$');
    const [freteValor, setFreteValor] = useState('');
    const [comissaoTipo, setComissaoTipo] = useState('R$');
    const [comissaoValor, setComissaoValor] = useState('');

    // ── Taxes ────────────────────────────────────────────────
    const [taxes, setTaxes] = useState({}); // { vendaIcms: 0, vendaPis: 0, ... }

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

        setTaxes(newTaxes);
    }, [selectedProduct, regimeTributario, operacao]);

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
                                    style={{ width: '100%' }}
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
                                    <option value="Minimo">Mínimo</option>
                                    <option value="Medio">Médio</option>
                                    <option value="Maximo">Máximo</option>
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
                                    const rateio = totalVendas > 0 ? ((Number(selectedProduct.vendasMes) || 0) * 100) / totalVendas : 0;
                                    const custoGeralAbsorvido = (totalCustoGeral * rateio) / 100;

                                    const isProd = selectedProduct?.category === 'Produção';
                                    const recipe = isProd ? recipes.find(r => r.productId === selectedProduct.id) : null;
                                    const qtyProdutoMes = Number(recipe?.qtyProdutoMes) || 0;
                                    const qtyGeralMes = Number(recipe?.qtyGeralMes) || 0;
                                    const proporcaoProd = qtyGeralMes > 0 ? (qtyProdutoMes * 100) / qtyGeralMes : 0;
                                    const custoOpAbsorvido = isProd ? (totalCustoOperacional * proporcaoProd) / 100 : 0;

                                    const rows = [];
                                    if (isProd) {
                                        rows.push({ label: 'Custos Operacionais', value: custoOpAbsorvido });
                                    }
                                    rows.push({ label: 'Custos Gerais', value: custoGeralAbsorvido });
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
                                                            <th style={{ ...thRight, textAlign: 'right' }}>Valor Absorvido (R$)</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {rows.map(r => (
                                                            <tr key={r.label} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                                <td style={tdRight}>{r.label}</td>
                                                                <td style={{ ...tdRight, textAlign: 'right', fontFamily: 'monospace' }}>R$ {r.value.toFixed(2)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                            <div style={{ marginTop: '0', borderTop: '2px solid var(--border-color)', padding: '8px 10px', display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                                                <span style={{ fontSize: '13px' }}>Total</span>
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
                                    const creditoIcmsUnit = totalIcmsRS / producao;
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
                                                <div style={{ flex: 1, background: '#f0fdf4', borderRadius: '8px', padding: '14px 16px', textAlign: 'center', border: '1px solid #bbf7d0' }}>
                                                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Crédito ICMS</div>
                                                    <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'monospace', color: '#059669' }}>R$ {creditoIcmsUnit.toFixed(2)}</div>
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
                                    const icmsCompra = Number(selectedProduct.compraIcms) || 0;
                                    const creditoIcms = (precoCompra * icmsCompra) / 100;
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
                                                <div style={{ flex: 1, background: 'var(--bg-secondary)', borderRadius: '8px', padding: '14px 16px', textAlign: 'center' }}>
                                                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>ICMS de Compra</div>
                                                    <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-primary)' }}>{icmsCompra.toFixed(2)}%</div>
                                                </div>
                                                <div style={{ flex: 1, background: '#f0fdf4', borderRadius: '8px', padding: '14px 16px', textAlign: 'center', border: '1px solid #bbf7d0' }}>
                                                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Crédito de ICMS</div>
                                                    <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'monospace', color: '#059669' }}>R$ {creditoIcms.toFixed(2)}</div>
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
                                        const creditoIcms = (precoCompra * icmsCompra) / 100;
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
                                            custoReal = (totalRS / producao) - (totalIcmsRS / producao);
                                        }
                                    }

                                    // ── Rateio % ──
                                    const totalVendas = products.reduce((s, p) => s + (Number(p.vendasMes) || 0), 0);
                                    const rateioPct = totalVendas > 0 ? ((Number(selectedProduct.vendasMes) || 0) * 100) / totalVendas : 0;

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

                                    // ── Custo Final = Custo Real + valores fixos em R$ ──
                                    const custoFinal = custoReal + margemRS + freteRS + comissaoRS;

                                    // ── Markup: Preço = CustoFinal / (1 - impostos% - rateio% - margem% - frete% - comissão%) ──
                                    const totalTaxPct = visibleTaxes.reduce((s, t) => s + (Number(taxes[t.key]) || 0), 0);
                                    const totalDivisor = rateioPct + totalTaxPct + margemPct + fretePct + comissaoPct;
                                    const precoFinal = totalDivisor < 100 ? custoFinal / (1 - totalDivisor / 100) : custoFinal;
                                    const rateioRS_calc = (precoFinal * rateioPct) / 100;
                                    const totalImpostosRS = (precoFinal * totalTaxPct) / 100;
                                    const margemRS_calc = margemTipo === '%' ? (precoFinal * margemPct) / 100 : margemRS;
                                    const freteRS_calc = freteTipo === '%' ? (precoFinal * fretePct) / 100 : freteRS;
                                    const comissaoRS_calc = comissaoTipo === '%' ? (precoFinal * comissaoPct) / 100 : comissaoRS;

                                    // ── Custo Final rows ──
                                    const cfRows = [
                                        { label: 'Custo Real', value: custoReal },
                                    ];
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
                                    // Custos Absorv.
                                    fpRows.push({ label: `Custos Absorv. (${rateioPct.toFixed(2)}%)`, value: rateioRS_calc });
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

                                    return (
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
                                    );
                                })()}

                            </div>
                        )}
                    </div>
                </div>
            </div>
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
