import { useState, useRef, useEffect } from 'react';
import { getEmbalagens, saveEmbalagem, deleteEmbalagem, getGramaturas, saveGramatura, deleteGramatura } from '../utils/storage';

function generateSKU() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let sku = 'CJ-';
    for (let i = 0; i < 6; i++) {
        sku += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return sku;
}

export default function ProductModal({ product, onSave, onClose }) {
    const isEditing = !!product?.id;

    const [form, setForm] = useState({
        name: product?.name || '',
        category: product?.category || '',
        embalagem: product?.embalagem || '',
        gramatura: product?.gramatura || '',
        currentStock: product?.currentStock ?? '',
        minStock: product?.minStock ?? '',
    });

    const [errors, setErrors] = useState({});
    const [embalagens, setEmbalagens] = useState([]);
    const [addingEmbalagem, setAddingEmbalagem] = useState(false);
    const [newEmbalagem, setNewEmbalagem] = useState('');
    const [embDropdownOpen, setEmbDropdownOpen] = useState(false);
    const embDropdownRef = useRef(null);

    const [gramaturas, setGramaturas] = useState([]);
    const [addingGramatura, setAddingGramatura] = useState(false);
    const [newGramatura, setNewGramatura] = useState('');
    const [gramDropdownOpen, setGramDropdownOpen] = useState(false);
    const gramDropdownRef = useRef(null);

    // Load embalagens and gramaturas from API
    useEffect(() => {
        getEmbalagens().then(setEmbalagens);
        getGramaturas().then(setGramaturas);
    }, []);

    // Close dropdowns on click outside
    useEffect(() => {
        function handleClickOutside(e) {
            if (embDropdownRef.current && !embDropdownRef.current.contains(e.target)) {
                setEmbDropdownOpen(false);
            }
            if (gramDropdownRef.current && !gramDropdownRef.current.contains(e.target)) {
                setGramDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    function handleChange(e) {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    }

    function handleSelectEmbalagem(emb) {
        setForm((prev) => ({ ...prev, embalagem: emb }));
        setEmbDropdownOpen(false);
    }

    async function handleDeleteEmbalagem(emb, e) {
        e.stopPropagation();
        const updated = await deleteEmbalagem(emb);
        setEmbalagens(updated);
        if (form.embalagem === emb) {
            setForm((prev) => ({ ...prev, embalagem: '' }));
        }
    }

    async function handleAddEmbalagem() {
        const trimmed = newEmbalagem.trim();
        if (!trimmed) return;
        const updated = await saveEmbalagem(trimmed);
        setEmbalagens(updated);
        setForm((prev) => ({ ...prev, embalagem: trimmed }));
        setNewEmbalagem('');
        setAddingEmbalagem(false);
        setEmbDropdownOpen(false);
    }

    function handleCancelAdd() {
        setNewEmbalagem('');
        setAddingEmbalagem(false);
    }

    function handleSelectGramatura(g) {
        setForm((prev) => ({ ...prev, gramatura: g }));
        setGramDropdownOpen(false);
    }

    async function handleDeleteGramatura(g, e) {
        e.stopPropagation();
        const updated = await deleteGramatura(g);
        setGramaturas(updated);
        if (form.gramatura === g) {
            setForm((prev) => ({ ...prev, gramatura: '' }));
        }
    }

    async function handleAddGramatura() {
        const trimmed = newGramatura.trim();
        if (!trimmed) return;
        const updated = await saveGramatura(trimmed);
        setGramaturas(updated);
        setForm((prev) => ({ ...prev, gramatura: trimmed }));
        setNewGramatura('');
        setAddingGramatura(false);
        setGramDropdownOpen(false);
    }

    function handleCancelAddGramatura() {
        setNewGramatura('');
        setAddingGramatura(false);
    }

    function validate() {
        const newErrors = {};
        if (!form.name.trim()) newErrors.name = 'Nome é obrigatório';
        if (!form.category) newErrors.category = 'Categoria é obrigatória';
        if (form.currentStock !== '' && isNaN(Number(form.currentStock)))
            newErrors.currentStock = 'Deve ser um número';
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
            minStock: form.minStock !== '' ? Number(form.minStock) : 0,
        };

        if (!isEditing) {
            data.sku = generateSKU();
        } else {
            data.id = product.id;
            data.sku = product.sku;
        }

        onSave(data);
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 620, minHeight: 520 }}>
                <div className="modal-header">
                    <h3>{isEditing ? 'Editar Produto' : 'Novo Produto'}</h3>
                    <button className="btn-icon" onClick={onClose}>✕</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body" style={{ gap: '20px' }}>
                        {/* Row 1: Nome */}
                        <div className="form-group">
                            <label>Nome do Produto <span className="required">*</span></label>
                            <input
                                className={`form-input ${errors.name ? 'error' : ''}`}
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                placeholder="Ex: Sorvete de Chocolate 1L"
                                autoFocus
                            />
                            {errors.name && <span style={{ color: 'var(--accent-danger)', fontSize: '12px' }}>{errors.name}</span>}
                        </div>

                        {/* Row 2: Categoria + Embalagem */}
                        <div className="form-row">
                            <div className="form-group">
                                <label>Categoria <span className="required">*</span></label>
                                <select
                                    className={`form-select ${errors.category ? 'error' : ''}`}
                                    name="category"
                                    value={form.category}
                                    onChange={handleChange}
                                >
                                    <option value="">Selecione...</option>
                                    <option value="Produção">Produção</option>
                                    <option value="Tercerizado">Tercerizado</option>
                                </select>
                                {errors.category && <span style={{ color: 'var(--accent-danger)', fontSize: '12px' }}>{errors.category}</span>}
                            </div>
                            <div className="form-group">
                                <label>Embalagem</label>
                                {addingEmbalagem ? (
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        <input
                                            className="form-input"
                                            value={newEmbalagem}
                                            onChange={(e) => setNewEmbalagem(e.target.value)}
                                            placeholder="Ex: Pote 1L"
                                            autoFocus
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') { e.preventDefault(); handleAddEmbalagem(); }
                                                if (e.key === 'Escape') handleCancelAdd();
                                            }}
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-primary"
                                            onClick={handleAddEmbalagem}
                                            style={{ padding: '6px 12px', fontSize: '13px', whiteSpace: 'nowrap' }}
                                        >
                                            OK
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={handleCancelAdd}
                                            style={{ padding: '6px 10px', fontSize: '13px' }}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ) : (
                                    <div className="emb-dropdown" ref={embDropdownRef}>
                                        <button
                                            type="button"
                                            className="form-select emb-dropdown-trigger"
                                            onClick={() => setEmbDropdownOpen(!embDropdownOpen)}
                                        >
                                            <span style={{ opacity: form.embalagem ? 1 : 0.5 }}>
                                                {form.embalagem || 'Selecione...'}
                                            </span>
                                            <span style={{ fontSize: '10px', marginLeft: 'auto' }}>▼</span>
                                        </button>
                                        {embDropdownOpen && (
                                            <div className="emb-dropdown-menu">
                                                <div
                                                    className="emb-dropdown-item"
                                                    onClick={() => handleSelectEmbalagem('')}
                                                >
                                                    <span style={{ opacity: 0.5 }}>Nenhuma</span>
                                                </div>
                                                {embalagens.map((emb) => (
                                                    <div
                                                        key={emb}
                                                        className={`emb-dropdown-item ${form.embalagem === emb ? 'selected' : ''}`}
                                                        onClick={() => handleSelectEmbalagem(emb)}
                                                    >
                                                        <span>{emb}</span>
                                                        <button
                                                            type="button"
                                                            className="emb-delete-btn"
                                                            onClick={(e) => handleDeleteEmbalagem(emb, e)}
                                                            title="Excluir embalagem"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                ))}
                                                <div
                                                    className="emb-dropdown-item emb-dropdown-add"
                                                    onClick={() => { setAddingEmbalagem(true); setEmbDropdownOpen(false); }}
                                                >
                                                    + Adicionar
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Row 3: Gramatura */}
                        <div className="form-group">
                            <label>Gramatura</label>
                            {addingGramatura ? (
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <input
                                        className="form-input"
                                        value={newGramatura}
                                        onChange={(e) => setNewGramatura(e.target.value)}
                                        placeholder="Ex: 1kg, 500g, 2L"
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') { e.preventDefault(); handleAddGramatura(); }
                                            if (e.key === 'Escape') handleCancelAddGramatura();
                                        }}
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={handleAddGramatura}
                                        style={{ padding: '6px 12px', fontSize: '13px', whiteSpace: 'nowrap' }}
                                    >
                                        OK
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={handleCancelAddGramatura}
                                        style={{ padding: '6px 10px', fontSize: '13px' }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ) : (
                                <div className="emb-dropdown" ref={gramDropdownRef}>
                                    <button
                                        type="button"
                                        className="form-select emb-dropdown-trigger"
                                        onClick={() => setGramDropdownOpen(!gramDropdownOpen)}
                                    >
                                        <span style={{ opacity: form.gramatura ? 1 : 0.5 }}>
                                            {form.gramatura || 'Selecione...'}
                                        </span>
                                        <span style={{ fontSize: '10px', marginLeft: 'auto' }}>▼</span>
                                    </button>
                                    {gramDropdownOpen && (
                                        <div className="emb-dropdown-menu">
                                            <div
                                                className="emb-dropdown-item"
                                                onClick={() => handleSelectGramatura('')}
                                            >
                                                <span style={{ opacity: 0.5 }}>Nenhuma</span>
                                            </div>
                                            {gramaturas.map((g) => (
                                                <div
                                                    key={g}
                                                    className={`emb-dropdown-item ${form.gramatura === g ? 'selected' : ''}`}
                                                    onClick={() => handleSelectGramatura(g)}
                                                >
                                                    <span>{g}</span>
                                                    <button
                                                        type="button"
                                                        className="emb-delete-btn"
                                                        onClick={(e) => handleDeleteGramatura(g, e)}
                                                        title="Excluir gramatura"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ))}
                                            <div
                                                className="emb-dropdown-item emb-dropdown-add"
                                                onClick={() => { setAddingGramatura(true); setGramDropdownOpen(false); }}
                                            >
                                                + Adicionar
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Row 4: Estoque Mínimo */}
                        <div className="form-row">
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
                                {errors.minStock && <span style={{ color: 'var(--accent-danger)', fontSize: '12px' }}>{errors.minStock}</span>}
                            </div>
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
