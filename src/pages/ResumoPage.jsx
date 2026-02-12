import { useState, useCallback, useMemo, useEffect } from 'react';
import {
    getProducts,
    getMovements,
    getRawMaterials,
    getRawMaterialMovements,
} from '../utils/storage';

export default function ResumoPage() {
    const [tab, setTab] = useState('produtos'); // 'produtos' | 'materias'
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });

    const [products, setProducts] = useState([]);
    const [movements, setMovements] = useState([]);
    const [rawMaterials, setRawMaterials] = useState([]);
    const [rawMovements, setRawMovements] = useState([]);
    const [search, setSearch] = useState('');

    const refresh = useCallback(async () => {
        setProducts(await getProducts());
        setMovements(await getMovements());
        setRawMaterials(await getRawMaterials());
        setRawMovements(await getRawMaterialMovements());
    }, []);

    useEffect(() => { refresh(); }, [refresh]);

    // Parse month into year & month
    const [year, month] = selectedMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    // Month name for display
    const monthLabel = new Date(year, month - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    // ── Produtos pivot ───────────────────────────────────────
    const productColumns = ['entrada', 'saida', 'retorno', 'trocas', 'saldo'];
    const productColumnLabels = { entrada: 'Ent', saida: 'Saí', retorno: 'Ret', trocas: 'Trc', saldo: 'Saldo' };

    const productPivot = useMemo(() => {
        const prefix = selectedMonth;
        const filtered = movements.filter((m) => m.date && m.date.startsWith(prefix));

        // Show ALL products, sorted by name
        const activeProducts = [...products].sort((a, b) => (a.name || '').localeCompare(b.name || ''));

        // Calculate carry-over saldo from all movements BEFORE the selected month
        const carryOver = {};
        activeProducts.forEach((p) => (carryOver[p.id] = 0));
        movements.forEach((m) => {
            if (m.date && m.date < prefix && carryOver[m.productId] !== undefined) {
                carryOver[m.productId] += (Number(m.entrada) || 0) + (Number(m.retorno) || 0)
                    - (Number(m.saida) || 0) - (Number(m.trocas) || 0);
            }
        });

        // Build pivot with daily values
        const pivot = {};
        for (let d = 1; d <= daysInMonth; d++) {
            pivot[d] = {};
            for (const p of activeProducts) {
                pivot[d][p.id] = { entrada: 0, saida: 0, retorno: 0, trocas: 0, saldo: 0 };
            }
        }

        filtered.forEach((m) => {
            const day = parseInt(m.date.split('-')[2], 10);
            if (pivot[day] && pivot[day][m.productId]) {
                const ent = Number(m.entrada) || 0;
                const sai = Number(m.saida) || 0;
                const ret = Number(m.retorno) || 0;
                const trc = Number(m.trocas) || 0;
                pivot[day][m.productId].entrada += ent;
                pivot[day][m.productId].saida += sai;
                pivot[day][m.productId].retorno += ret;
                pivot[day][m.productId].trocas += trc;
            }
        });

        // Make saldo cumulative: carry-over + running total
        for (const p of activeProducts) {
            let running = carryOver[p.id] || 0;
            for (let d = 1; d <= daysInMonth; d++) {
                const cell = pivot[d][p.id];
                running += cell.entrada + cell.retorno - cell.saida - cell.trocas;
                cell.saldo = running;
            }
        }

        return { activeProducts, pivot };
    }, [movements, products, selectedMonth, daysInMonth]);

    // ── Matérias Primas pivot ────────────────────────────────
    const materialColumns = ['entrada', 'saida', 'saldo'];
    const materialColumnLabels = { entrada: 'Ent', saida: 'Saí', saldo: 'Saldo' };

    const materialPivot = useMemo(() => {
        const prefix = selectedMonth;
        const filtered = rawMovements.filter((m) => m.date && m.date.startsWith(prefix));

        // Show ALL raw materials, sorted by name
        const activeMaterials = [...rawMaterials].sort((a, b) => (a.name || '').localeCompare(b.name || ''));

        // Calculate carry-over saldo from all movements BEFORE the selected month
        const carryOver = {};
        activeMaterials.forEach((m) => (carryOver[m.id] = 0));
        rawMovements.forEach((m) => {
            if (m.date && m.date < prefix && carryOver[m.rawMaterialId] !== undefined) {
                carryOver[m.rawMaterialId] += (Number(m.entrada) || 0) - (Number(m.saida) || 0);
            }
        });

        const pivot = {};
        for (let d = 1; d <= daysInMonth; d++) {
            pivot[d] = {};
            for (const m of activeMaterials) {
                pivot[d][m.id] = { entrada: 0, saida: 0, saldo: 0 };
            }
        }

        filtered.forEach((m) => {
            const day = parseInt(m.date.split('-')[2], 10);
            if (pivot[day] && pivot[day][m.rawMaterialId]) {
                const ent = Number(m.entrada) || 0;
                const sai = Number(m.saida) || 0;
                pivot[day][m.rawMaterialId].entrada += ent;
                pivot[day][m.rawMaterialId].saida += sai;
            }
        });

        // Make saldo cumulative: carry-over + running total
        for (const m of activeMaterials) {
            let running = carryOver[m.id] || 0;
            for (let d = 1; d <= daysInMonth; d++) {
                const cell = pivot[d][m.id];
                running += cell.entrada - cell.saida;
                cell.saldo = running;
            }
        }

        return { activeMaterials, pivot };
    }, [rawMovements, rawMaterials, selectedMonth, daysInMonth]);

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

    // Cell color helper
    function cellColor(col, val) {
        if (col === 'entrada' || col === 'retorno') return '#059669';
        if (col === 'saida') return '#dc2626';
        if (col === 'trocas') return '#d97706';
        if (col === 'saldo') return val < 0 ? '#dc2626' : val > 0 ? '#2563eb' : '#6b7280';
        return 'var(--text-primary)';
    }

    const isProductsTab = tab === 'produtos';
    const columns = isProductsTab ? productColumns : materialColumns;
    const columnLabels = isProductsTab ? productColumnLabels : materialColumnLabels;
    const allItems = isProductsTab ? productPivot.activeProducts : materialPivot.activeMaterials;
    const items = search
        ? allItems.filter((i) => (i.name || '').toLowerCase().includes(search.toLowerCase()))
        : allItems;
    const pivot = isProductsTab ? productPivot.pivot : materialPivot.pivot;

    return (
        <div className="page-container">
            <div className="page-header">
                <div className="page-header-left">
                    <h2>Resumo</h2>
                    <p>Visão consolidada de movimentações por dia</p>
                </div>
            </div>

            {/* Controls Card */}
            <div className="card" style={{ padding: '20px 24px' }}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Toggle Switch */}
                    <div style={{
                        display: 'flex',
                        background: '#f3f4f6',
                        borderRadius: '10px',
                        padding: '3px',
                        maxWidth: '340px',
                        flex: 1,
                        minWidth: '260px',
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
                            Matérias Primas
                        </button>
                    </div>

                    {/* Month picker */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label style={{ fontWeight: 500, fontSize: '14px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                            Mês:
                        </label>
                        <input
                            className="form-input"
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            style={{ minWidth: '180px' }}
                        />
                    </div>
                </div>

                <h4 style={{ margin: '16px 0 0 0', fontSize: '17px', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                    {monthLabel} — {isProductsTab ? 'Produtos' : 'Matérias Primas'}
                </h4>
            </div>

            {/* Search + Pivot Table */}
            <div className="card" style={{ marginTop: '12px', padding: '0' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
                    <input
                        className="form-input"
                        type="text"
                        placeholder={isProductsTab ? 'Buscar por nome do produto...' : 'Buscar por nome da matéria prima...'}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ width: '40%', border: '1.5px solid #999' }}
                    />
                </div>
                {items.length === 0 ? (
                    <div className="empty-state" style={{ padding: '40px 20px' }}>
                        <div className="empty-state-icon">--</div>
                        <h4>Nenhuma movimentação encontrada</h4>
                        <p>Não há movimentações de {isProductsTab ? 'produtos' : 'matérias primas'} para {monthLabel}.</p>
                    </div>
                ) : (
                    <div style={{ maxHeight: '620px', overflow: 'auto' }}>
                        <table style={{ borderCollapse: 'collapse', width: 'max-content' }}>
                            <thead>
                                {/* Row 1: Item names spanning their columns */}
                                <tr>
                                    <th
                                        rowSpan={2}
                                        style={{
                                            position: 'sticky',
                                            left: 0,
                                            top: 0,
                                            zIndex: 12,
                                            background: '#f8fafc',
                                            borderRight: '2px solid #e2e8f0',
                                            borderBottom: '2px solid #e2e8f0',
                                            padding: '10px 16px',
                                            minWidth: '60px',
                                            textAlign: 'center',
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            color: 'var(--text-secondary)',
                                        }}
                                    >
                                        Dia
                                    </th>
                                    {items.map((item, idx) => (
                                        <th
                                            key={item.id}
                                            colSpan={columns.length}
                                            style={{
                                                position: 'sticky',
                                                top: 0,
                                                zIndex: 10,
                                                background: idx % 2 === 0 ? '#f0fdf4' : '#f0f9ff',
                                                borderBottom: '1px solid #e2e8f0',
                                                borderRight: '2px solid #e2e8f0',
                                                padding: '10px 8px',
                                                textAlign: 'center',
                                                fontSize: '12px',
                                                fontWeight: 600,
                                                color: 'var(--text-primary)',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {item.name}
                                        </th>
                                    ))}
                                </tr>
                                {/* Row 2: Column sub-headers (Ent, Saí, Ret, Trc) */}
                                <tr>
                                    {items.map((item, idx) =>
                                        columns.map((col) => (
                                            <th
                                                key={`${item.id}-${col}`}
                                                style={{
                                                    position: 'sticky',
                                                    top: '39px',
                                                    zIndex: 10,
                                                    background: idx % 2 === 0 ? '#f0fdf4' : '#f0f9ff',
                                                    borderBottom: '2px solid #e2e8f0',
                                                    borderRight: col === columns[columns.length - 1] ? '2px solid #e2e8f0' : '1px solid #e5e7eb',
                                                    padding: '6px 10px',
                                                    textAlign: 'center',
                                                    fontSize: '11px',
                                                    fontWeight: 600,
                                                    color: cellColor(col, 0),
                                                    minWidth: '50px',
                                                }}
                                            >
                                                {columnLabels[col]}
                                            </th>
                                        ))
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {days.map((day) => (
                                    <tr key={day}>
                                        <td
                                            style={{
                                                position: 'sticky',
                                                left: 0,
                                                zIndex: 5,
                                                background: '#fff',
                                                borderRight: '2px solid #e2e8f0',
                                                padding: '8px 16px',
                                                textAlign: 'center',
                                                fontWeight: 600,
                                                fontSize: '13px',
                                                color: 'var(--text-primary)',
                                            }}
                                        >
                                            {String(day).padStart(2, '0')}
                                        </td>
                                        {items.map((item, idx) =>
                                            columns.map((col) => {
                                                const val = pivot[day]?.[item.id]?.[col] || 0;
                                                return (
                                                    <td
                                                        key={`${item.id}-${col}-${day}`}
                                                        style={{
                                                            padding: '8px 10px',
                                                            textAlign: 'center',
                                                            fontSize: '13px',
                                                            fontWeight: val !== 0 ? 600 : 400,
                                                            color: val !== 0 ? cellColor(col, val) : '#d1d5db',
                                                            borderRight: col === columns[columns.length - 1] ? '2px solid #e2e8f0' : '1px solid #f3f4f6',
                                                            background: idx % 2 === 0 ? '#fff' : '#fafbfc',
                                                        }}
                                                    >
                                                        {val}
                                                    </td>
                                                );
                                            })
                                        )}
                                    </tr>
                                ))}
                                {/* Totals row */}
                                <tr style={{ borderTop: '2px solid #e2e8f0' }}>
                                    <td
                                        style={{
                                            position: 'sticky',
                                            left: 0,
                                            zIndex: 5,
                                            background: '#f8fafc',
                                            borderRight: '2px solid #e2e8f0',
                                            padding: '10px 16px',
                                            textAlign: 'center',
                                            fontWeight: 700,
                                            fontSize: '13px',
                                            color: 'var(--text-primary)',
                                        }}
                                    >
                                        Total
                                    </td>
                                    {items.map((item, idx) =>
                                        columns.map((col) => {
                                            const total = col === 'saldo'
                                                ? (pivot[daysInMonth]?.[item.id]?.saldo || 0)
                                                : days.reduce((sum, day) => sum + (pivot[day]?.[item.id]?.[col] || 0), 0);
                                            return (
                                                <td
                                                    key={`total-${item.id}-${col}`}
                                                    style={{
                                                        padding: '10px 10px',
                                                        textAlign: 'center',
                                                        fontSize: '13px',
                                                        fontWeight: 700,
                                                        color: total !== 0 ? cellColor(col, total) : '#d1d5db',
                                                        borderRight: col === columns[columns.length - 1] ? '2px solid #e2e8f0' : '1px solid #f3f4f6',
                                                        background: idx % 2 === 0 ? '#f0fdf4' : '#f0f9ff',
                                                    }}
                                                >
                                                    {total}
                                                </td>
                                            );
                                        })
                                    )}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
