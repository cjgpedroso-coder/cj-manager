import { useState } from 'react';
import { approveUser } from '../utils/auth';

const ACCESS_LEVELS = [
    { value: 'estoque', label: 'Estoque' },
    { value: 'logistico', label: 'Logístico' },
    { value: 'administrador', label: 'Administrador' },
    { value: 'CEO', label: 'CEO' },
];

export default function ApprovalModal({ pendingUsers, onApproved }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedRole, setSelectedRole] = useState('');
    const [roleError, setRoleError] = useState('');

    if (!pendingUsers || pendingUsers.length === 0) return null;

    const user = pendingUsers[currentIndex];
    if (!user) return null;

    function handleConfirm() {
        if (!selectedRole) {
            setRoleError('Selecione o nível de acesso para continuar');
            return;
        }

        approveUser(user.id, selectedRole);

        // Move to next pending user or close
        if (currentIndex < pendingUsers.length - 1) {
            setCurrentIndex((prev) => prev + 1);
            setSelectedRole('');
            setRoleError('');
        } else {
            onApproved();
        }
    }

    return (
        <div className="modal-overlay">
            <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
                <div className="modal-header">
                    <h3>Nova Solicitacao de Cadastro</h3>
                </div>

                <div className="modal-body">
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '4px' }}>
                        Um novo usuário solicitou acesso ao sistema:
                    </p>

                    <div className="approval-user-card">
                        <div className="approval-user-avatar">
                            {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="approval-user-details">
                            <div className="approval-field">
                                <span className="approval-label">Usuário</span>
                                <span className="approval-value">{user.username}</span>
                            </div>
                            <div className="approval-field">
                                <span className="approval-label">Senha</span>
                                <span className="approval-value">{user.password}</span>
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Nível de Acesso <span className="required">*</span></label>
                        <select
                            className={`form-select ${roleError ? 'error' : ''}`}
                            value={selectedRole}
                            onChange={(e) => {
                                setSelectedRole(e.target.value);
                                if (roleError) setRoleError('');
                            }}
                        >
                            <option value="">Selecione o nível de acesso...</option>
                            {ACCESS_LEVELS.map((level) => (
                                <option key={level.value} value={level.value}>
                                    {level.label}
                                </option>
                            ))}
                        </select>
                        {roleError && (
                            <span style={{ color: 'var(--accent-danger)', fontSize: '12px' }}>{roleError}</span>
                        )}
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn btn-primary" onClick={handleConfirm}>
                        Confirmar Usuario
                    </button>
                </div>
            </div>
        </div>
    );
}
