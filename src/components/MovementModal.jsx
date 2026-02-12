import { useState } from 'react';
import { getProducts } from '../utils/storage';

export default function MovementModal({ onSave, onClose }) {
    const [products] = useState(() => getProducts());

    const today = new Date().toISOString().slice(0, 10);

    const [form, setForm] = useState({
        productId: '',
        type: 'entrada',
        quantity: '',
        date: today,
        observation: '',
    });

    const [errors, setErrors] = useState({});

    function handleChange(e) {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    }

    function validate() {
        const newErrors = {};
        if (!form.productId) newErrors.productId = 'Selecione um produto';
        if (!form.quantity || Number(form.quantity) <= 0) newErrors.quantity = 'Quantidade inválida';
        if (!form.date) newErrors.date = 'Data é obrigatória';

        // Check for insufficient stock on exit
        if (form.type === 'saida' && form.productId) {
            const product = products.find((p) => p.id === form.productId);
            if (product && Number(form.quantity) > Number(product.currentStock || 0)) {
                newErrors.quantity = `Estoque insuficiente (disponível: ${product.currentStock || 0})`;
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    function handleSubmit(e) {
        e.preventDefault();
        if (!validate()) return;
        onSave({ ...form, quantity: Number(form.quantity) });
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Nova Movimentação</h3>
                    <button className="btn-icon" onClick={onClose}>✕</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
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
                                        {p.name} {p.sku ? `(${p.sku})` : ''} — Estoque: {p.currentStock || 0}
                                    </option>
                                ))}
                            </select>
                            {errors.productId && (
                                <span style={{ color: 'var(--accent-danger)', fontSize: '12px' }}>
                                    {errors.productId}
                                </span>
                            )}
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Tipo <span className="required">*</span></label>
                                <select className="form-select" name="type" value={form.type} onChange={handleChange}>
                                    <option value="entrada">Entrada</option>
                                    <option value="saida">Saida</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Quantidade <span className="required">*</span></label>
                                <input
                                    className={`form-input ${errors.quantity ? 'error' : ''}`}
                                    name="quantity"
                                    value={form.quantity}
                                    onChange={handleChange}
                                    placeholder="0"
                                    type="number"
                                    min="1"
                                />
                                {errors.quantity && (
                                    <span style={{ color: 'var(--accent-danger)', fontSize: '12px' }}>
                                        {errors.quantity}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Data <span className="required">*</span></label>
                            <input
                                className={`form-input ${errors.date ? 'error' : ''}`}
                                name="date"
                                value={form.date}
                                onChange={handleChange}
                                type="date"
                            />
                        </div>

                        <div className="form-group">
                            <label>Observação</label>
                            <textarea
                                className="form-textarea"
                                name="observation"
                                value={form.observation}
                                onChange={handleChange}
                                placeholder="Informações adicionais sobre esta movimentação..."
                                rows={3}
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn btn-primary">
                            Registrar Movimentação
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
