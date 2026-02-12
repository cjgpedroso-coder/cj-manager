export default function ConfirmDialog({ title, message, onConfirm, onCancel }) {
    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal confirm-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="modal-body">
                    <div className="confirm-icon">X</div>
                    <h3 style={{ fontSize: '18px', fontWeight: 700 }}>{title || 'Confirmar Exclusão'}</h3>
                    <p>{message || 'Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.'}</p>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onCancel}>
                        Cancelar
                    </button>
                    <button className="btn btn-danger" onClick={onConfirm}>
                        Excluir
                    </button>
                </div>
            </div>
        </div>
    );
}
