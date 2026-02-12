import { useState } from 'react';

export default function ProductModal({ product, onSave, onClose }) {
    const isEditing = !!product?.id;

    const [form, setForm] = useState({
        name: product?.name || '',
        sku: product?.sku || '',
        category: product?.category || '',
        unit: product?.unit || 'un',
        currentStock: product?.currentStock ?? '',
        costPrice: product?.costPrice ?? '',
        salePrice: product?.salePrice ?? '',
        minStock: product?.minStock ?? '',
    });

    const [errors, setErrors] = useState({});

    function handleChange(e) {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    }

    function validate() {
        const newErrors = {};
        if (!form.name.trim()) newErrors.name = 'Nome é obrigatório';
        if (form.currentStock !== '' && isNaN(Number(form.currentStock)))
            newErrors.currentStock = 'Deve ser um número';
        if (form.costPrice !== '' && isNaN(Number(form.costPrice)))
            newErrors.costPrice = 'Deve ser um número';
        if (form.salePrice !== '' && isNaN(Number(form.salePrice)))
            newErrors.salePrice = 'Deve ser um número';
        if (form.minStock !== '' && isNaN(Number(form.minStock)))
            newErrors.minStock = 'Deve ser um número';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    function handleSubmit(e) {
        e.preventDefault();
        if (!validate()) return;

        const data = {
            ...form,
            currentStock: form.currentStock !== '' ? Number(form.currentStock) : 0,
            costPrice: form.costPrice !== '' ? Number(form.costPrice) : 0,
            salePrice: form.salePrice !== '' ? Number(form.salePrice) : 0,
            minStock: form.minStock !== '' ? Number(form.minStock) : 0,
        };

        if (isEditing) data.id = product.id;
        onSave(data);
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{isEditing ? 'Editar Produto' : 'Novo Produto'}</h3>
                    <button className="btn-icon" onClick={onClose}>✕</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label>Nome do Produto <span className="required">*</span></label>
                            <input
                                className={`form-input ${errors.name ? 'error' : ''}`}
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                placeholder="Ex: Parafuso Phillips 6mm"
                                autoFocus
                            />
                            {errors.name && <span style={{ color: 'var(--accent-danger)', fontSize: '12px' }}>{errors.name}</span>}
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>SKU / Código</label>
                                <input
                                    className="form-input"
                                    name="sku"
                                    value={form.sku}
                                    onChange={handleChange}
                                    placeholder="Ex: PRF-6MM-001"
                                />
                            </div>
                            <div className="form-group">
                                <label>Categoria</label>
                                <input
                                    className="form-input"
                                    name="category"
                                    value={form.category}
                                    onChange={handleChange}
                                    placeholder="Ex: Fixação"
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Unidade de Medida</label>
                                <select className="form-select" name="unit" value={form.unit} onChange={handleChange}>
                                    <option value="un">Unidade (un)</option>
                                    <option value="kg">Quilograma (kg)</option>
                                    <option value="g">Grama (g)</option>
                                    <option value="l">Litro (l)</option>
                                    <option value="ml">Mililitro (ml)</option>
                                    <option value="m">Metro (m)</option>
                                    <option value="cm">Centímetro (cm)</option>
                                    <option value="cx">Caixa (cx)</option>
                                    <option value="pct">Pacote (pct)</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Estoque Inicial</label>
                                <input
                                    className={`form-input ${errors.currentStock ? 'error' : ''}`}
                                    name="currentStock"
                                    value={form.currentStock}
                                    onChange={handleChange}
                                    placeholder="0"
                                    type="number"
                                    min="0"
                                />
                                {errors.currentStock && <span style={{ color: 'var(--accent-danger)', fontSize: '12px' }}>{errors.currentStock}</span>}
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Preço de Custo (R$)</label>
                                <input
                                    className={`form-input ${errors.costPrice ? 'error' : ''}`}
                                    name="costPrice"
                                    value={form.costPrice}
                                    onChange={handleChange}
                                    placeholder="0,00"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                />
                            </div>
                            <div className="form-group">
                                <label>Preço de Venda (R$)</label>
                                <input
                                    className={`form-input ${errors.salePrice ? 'error' : ''}`}
                                    name="salePrice"
                                    value={form.salePrice}
                                    onChange={handleChange}
                                    placeholder="0,00"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Estoque Mínimo</label>
                            <input
                                className={`form-input ${errors.minStock ? 'error' : ''}`}
                                name="minStock"
                                value={form.minStock}
                                onChange={handleChange}
                                placeholder="10"
                                type="number"
                                min="0"
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn btn-primary">
                            {isEditing ? 'Salvar Alterações' : 'Cadastrar Produto'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
