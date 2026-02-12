import { useState, useEffect, useCallback } from 'react';
import { getUsers, updateUser, deleteUser } from '../utils/auth';
import { useAuth } from '../context/AuthContext';
import ConfirmDialog from '../components/ConfirmDialog';

export default function AdminUsersPage() {
    const { session } = useAuth();
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [editingUser, setEditingUser] = useState(null);
    const [editForm, setEditForm] = useState({ username: '', password: '', role: '', status: '' });
    const [deleteTarget, setDeleteTarget] = useState(null);

    const roleLabels = {
        DEV: 'DEV',
        administrador: 'Administrador',
        estoque: 'Estoque',
        logistico: 'Logístico',
    };

    const roleOptions = ['DEV', 'administrador', 'estoque', 'logistico'];

    const loadUsers = useCallback(async () => {
        setUsers(await getUsers());
    }, []);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    const filtered = users.filter((u) => {
        const matchSearch = u.username.toLowerCase().includes(search.toLowerCase());
        const matchRole = !filterRole || u.role === filterRole;
        const matchStatus = !filterStatus || u.status === filterStatus;
        return matchSearch && matchRole && matchStatus;
    });

    function openEditModal(user) {
        setEditingUser(user);
        setEditForm({
            username: user.username,
            password: user.password,
            role: user.role || 'estoque',
            status: user.status || 'active',
        });
    }

    function handleEditChange(e) {
        const { name, value } = e.target;
        setEditForm((prev) => ({ ...prev, [name]: value }));
    }

    async function saveEdit() {
        if (!editingUser) return;
        await updateUser(editingUser.id, {
            username: editForm.username.trim().toLowerCase(),
            password: editForm.password,
            role: editForm.role,
            status: editForm.status,
        });
        setEditingUser(null);
        await loadUsers();
    }

    async function handleDelete() {
        if (!deleteTarget) return;
        if (deleteTarget.id === session?.userId) return;
        await deleteUser(deleteTarget.id);
        setDeleteTarget(null);
        await loadUsers();
    }

    function formatDate(iso) {
        if (!iso) return '--';
        return new Date(iso).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    }

    const stats = {
        total: users.length,
        active: users.filter((u) => u.status === 'active').length,
        pending: users.filter((u) => u.status === 'pending').length,
        inactive: users.filter((u) => u.status === 'inactive').length,
        bloqueado: users.filter((u) => u.status === 'bloqueado').length,
    };

    const isCurrentUser = (user) => user.id === session?.userId;

    return (
        <div className="page" style={{ maxWidth: 1100, margin: '0 auto' }}>
            {/* Header */}
            <div className="page-header">
                <h2>Administrar Usuários</h2>
                <p className="page-subtitle">Gerencie todos os usuários do sistema</p>
            </div>

            {/* Stats */}
            <div className="stats-grid">
                <div className="stat-card purple">
                    <div className="stat-icon purple">T</div>
                    <div className="stat-info">
                        <h3>{stats.total}</h3>
                        <p>Total de usuários</p>
                    </div>
                </div>
                <div className="stat-card green">
                    <div className="stat-icon green">A</div>
                    <div className="stat-info">
                        <h3>{stats.active}</h3>
                        <p>Ativos</p>
                    </div>
                </div>
                <div className="stat-card cyan">
                    <div className="stat-icon cyan">P</div>
                    <div className="stat-info">
                        <h3>{stats.pending}</h3>
                        <p>Pendentes</p>
                    </div>
                </div>
                <div className="stat-card" style={{ borderLeft: '3px solid #dc2626' }}>
                    <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.10)', color: '#dc2626' }}>B</div>
                    <div className="stat-info">
                        <h3>{stats.bloqueado}</h3>
                        <p>Bloqueados</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="filter-bar">
                <div className="search-bar">
                    <span className="search-icon">Q</span>
                    <input
                        className="form-input"
                        placeholder="Buscar por nome de usuário..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <select
                    className="form-select"
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    style={{ minWidth: '140px' }}
                >
                    <option value="">Todos os cargos</option>
                    {roleOptions.map((r) => (
                        <option key={r} value={r}>{roleLabels[r]}</option>
                    ))}
                </select>
                <select
                    className="form-select"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    style={{ minWidth: '130px' }}
                >
                    <option value="">Todos os status</option>
                    <option value="active">Ativo</option>
                    <option value="pending">Pendente</option>
                    <option value="inactive">Inativo</option>
                    <option value="bloqueado">Bloqueado</option>
                </select>
            </div>

            {/* Table */}
            {filtered.length === 0 ? (
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-state-icon">--</div>
                        <h4>Nenhum usuário encontrado</h4>
                        <p>Tente ajustar os filtros de busca.</p>
                    </div>
                </div>
            ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Usuário</th>
                                    <th>Cargo</th>
                                    <th>Status</th>
                                    <th>Criado em</th>
                                    <th style={{ width: 60, textAlign: 'center' }}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((user) => (
                                    <tr key={user.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div
                                                    style={{
                                                        width: 32,
                                                        height: 32,
                                                        borderRadius: '50%',
                                                        background: 'linear-gradient(135deg, #059669, #0d9488)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: '#fff',
                                                        fontWeight: 700,
                                                        fontSize: '13px',
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    {user.username.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: '14px' }}>
                                                        {user.username}
                                                        {isCurrentUser(user) && (
                                                            <span style={{
                                                                fontSize: '10px',
                                                                marginLeft: '6px',
                                                                padding: '1px 6px',
                                                                borderRadius: '4px',
                                                                background: 'rgba(5, 150, 105, 0.12)',
                                                                color: '#059669',
                                                            }}>
                                                                você
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                                fontSize: '12px',
                                                fontWeight: 600,
                                                background: user.role === 'DEV'
                                                    ? 'rgba(234,179,8,0.12)'
                                                    : 'rgba(5, 150, 105, 0.08)',
                                                color: user.role === 'DEV'
                                                    ? '#eab308'
                                                    : '#059669',
                                            }}>
                                                {roleLabels[user.role] || user.role || '--'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge badge-${user.status === 'active' ? 'ok' : user.status === 'pending' ? 'low' : user.status === 'bloqueado' ? 'critical' : 'inactive'}`}>
                                                {user.status === 'active' ? 'Ativo' : user.status === 'pending' ? 'Pendente' : user.status === 'bloqueado' ? 'Bloqueado' : 'Inativo'}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                                            {formatDate(user.createdAt)}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <button
                                                className="btn-icon"
                                                onClick={() => openEditModal(user)}
                                                title="Editar usuário"
                                                style={{ fontSize: '16px' }}
                                            >
                                                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ verticalAlign: 'middle' }}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {editingUser && (
                <div className="modal-overlay" onClick={() => setEditingUser(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
                        <div className="modal-header">
                            <h3>Editar Usuário</h3>
                            <button className="btn-icon" onClick={() => setEditingUser(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            {/* User avatar header */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                marginBottom: '20px',
                                padding: '12px',
                                background: 'rgba(5, 150, 105, 0.04)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid rgba(5, 150, 105, 0.10)',
                            }}>
                                <div style={{
                                    width: 42,
                                    height: 42,
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #059669, #0d9488)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#fff',
                                    fontWeight: 700,
                                    fontSize: '16px',
                                    flexShrink: 0,
                                }}>
                                    {editForm.username.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-primary)' }}>
                                        {editingUser.username}
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                        Criado em {formatDate(editingUser.createdAt)}
                                    </div>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Usuário</label>
                                <input
                                    className="form-input"
                                    name="username"
                                    value={editForm.username}
                                    onChange={handleEditChange}
                                    placeholder="Nome de usuário"
                                />
                            </div>

                            <div className="form-group">
                                <label>Senha</label>
                                <input
                                    className="form-input"
                                    name="password"
                                    value={editForm.password}
                                    onChange={handleEditChange}
                                    placeholder="Senha do usuário"
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Cargo</label>
                                    <select
                                        className="form-select"
                                        name="role"
                                        value={editForm.role}
                                        onChange={handleEditChange}
                                    >
                                        {roleOptions.map((r) => (
                                            <option key={r} value={r}>{roleLabels[r]}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Status</label>
                                    <select
                                        className="form-select"
                                        name="status"
                                        value={editForm.status}
                                        onChange={handleEditChange}
                                    >
                                        <option value="active">Ativo</option>
                                        <option value="pending">Pendente</option>
                                        <option value="inactive">Inativo</option>
                                        <option value="bloqueado">Bloqueado</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            {!isCurrentUser(editingUser) && (
                                <button
                                    className="btn btn-danger"
                                    onClick={() => {
                                        setDeleteTarget(editingUser);
                                        setEditingUser(null);
                                    }}
                                    style={{ marginRight: 'auto' }}
                                >
                                    Excluir
                                </button>
                            )}
                            <button className="btn btn-secondary" onClick={() => setEditingUser(null)}>Cancelar</button>
                            <button className="btn btn-primary" onClick={saveEdit}>Salvar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirm */}
            {deleteTarget && (
                <ConfirmDialog
                    title="Excluir Usuário"
                    message={`Tem certeza que deseja excluir o usuário "${deleteTarget.username}"? Esta ação não pode ser desfeita.`}
                    onConfirm={handleDelete}
                    onCancel={() => setDeleteTarget(null)}
                />
            )}
        </div>
    );
}
