import { useState, useEffect } from 'react';
import { getProducts } from '../utils/storage';

export default function MovementModal({ onSave, onClose, movement }) {
    const [products, setProducts] = useState([]);

    useEffect(() => {
        getProducts().then(setProducts);
    }, []);

    const today = new Date().toISOString().slice(0, 10);
    const isEdit = !!movement;

    const [form, setForm] = useState({
        date: movement?.date || today,
        vendedor: movement?.vendedor || '',
        productId: movement?.productId || '',
        entrada: movement?.entrada ?? '',
        saida: movement?.saida ?? '',
        retorno: movement?.retorno ?? '',
        trocas: movement?.trocas ?? '',
    });

    const [errors, setErrors] = useState({});

    function handleChange(e) {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    }

    function validate() {
        const newErrors = {};
        if (!form.date) newErrors.date = 'Data é obrigatória';
        if (!form.vendedor.trim()) newErrors.vendedor = 'Informe o vendedor';
        if (!form.productId) newErrors.productId = 'Selecione um produto';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    function handleSubmit(e) {
        e.preventDefault();
        if (!validate()) return;
        onSave({
            ...form,
            entrada: Number(form.entrada) || 0,
            saida: Number(form.saida) || 0,
            retorno: Number(form.retorno) || 0,
            trocas: Number(form.trocas) || 0,
        });
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{isEdit ? 'Editar Movimentação' : 'Nova Movimentação'}</h3>
                    <button className="btn-icon" onClick={onClose}>✕</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {/* Data */}
                        <div className="form-group">
                            <label>Data <span className="required">*</span></label>
                            <input
                                className={`form-input ${errors.date ? 'error' : ''}`}
                                name="date"
                                value={form.date}
                                onChange={handleChange}
                                type="date"
                            />
                            {errors.date && (
                                <span style={{ color: 'var(--accent-danger)', fontSize: '12px' }}>
                                    {errors.date}
                                </span>
                            )}
                        </div>

                        {/* Vendedor */}
                        <div className="form-group">
                            <label>Vendedor <span className="required">*</span></label>
                            <input
                                className={`form-input ${errors.vendedor ? 'error' : ''}`}
                                name="vendedor"
                                value={form.vendedor}
                                onChange={handleChange}
                                placeholder="Nome do vendedor"
                            />
                            {errors.vendedor && (
                                <span style={{ color: 'var(--accent-danger)', fontSize: '12px' }}>
                                    {errors.vendedor}
                                </span>
                            )}
                        </div>

                        {/* Produto */}
                        <div className="form-group">
                            <label>Produto <span className="required">*</span></label>
                            <select
                                className={`form-select ${errors.productId ? 'error' : ''}`}
                                name="productId"
                                value={form.productId}
                                onChange={handleChange}
                            >
                                <option value="">Selecione um produto...</option>
                                {products.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name}{p.embalagem ? ` — ${p.embalagem}` : ''}
                                    </option>
                                ))}
                            </select>
                            {errors.productId && (
                                <span style={{ color: 'var(--accent-danger)', fontSize: '12px' }}>
                                    {errors.productId}
                                </span>
                            )}
                        </div>

                        {/* Quantidades por tipo */}
                        <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
                            <div className="form-group">
                                <label>Entrada</label>
                                <input
                                    className="form-input"
                                    name="entrada"
                                    value={form.entrada}
                                    onChange={handleChange}
                                    placeholder="0"
                                    type="number"
                                    min="0"
                                />
                            </div>
                            <div className="form-group">
                                <label>Saída</label>
                                <input
                                    className="form-input"
                                    name="saida"
                                    value={form.saida}
                                    onChange={handleChange}
                                    placeholder="0"
                                    type="number"
                                    min="0"
                                />
                            </div>
                        </div>
                        <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
                            <div className="form-group">
                                <label>Retorno</label>
                                <input
                                    className="form-input"
                                    name="retorno"
                                    value={form.retorno}
                                    onChange={handleChange}
                                    placeholder="0"
                                    type="number"
                                    min="0"
                                />
                            </div>
                            <div className="form-group">
                                <label>Trocas</label>
                                <input
                                    className="form-input"
                                    name="trocas"
                                    value={form.trocas}
                                    onChange={handleChange}
                                    placeholder="0"
                                    type="number"
                                    min="0"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn btn-primary">
                            {isEdit ? 'Salvar Alterações' : 'Registrar Movimentação'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
