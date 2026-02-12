import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [pendingUser, setPendingUser] = useState(null);
    const [blockedUser, setBlockedUser] = useState(null);
    const [cooldown, setCooldown] = useState(0);
    const cooldownRef = useRef(null);

    // Countdown timer
    useEffect(() => {
        if (cooldown > 0) {
            cooldownRef.current = setInterval(() => {
                setCooldown((prev) => {
                    if (prev <= 1) {
                        clearInterval(cooldownRef.current);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(cooldownRef.current);
        }
    }, [cooldown > 0]); // eslint-disable-line react-hooks/exhaustive-deps

    function handleChange(e) {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        if (error) setError('');
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (cooldown > 0) return;
        if (!form.username.trim() || !form.password) {
            setError('Preencha todos os campos');
            return;
        }

        setLoading(true);
        // Small delay for UX feel
        await new Promise((r) => setTimeout(r, 400));
        const result = await login(form.username.trim(), form.password);
        if (result.success) {
            navigate('/', { replace: true });
        } else if (result.error === 'pending') {
            setPendingUser(result.username);
            setLoading(false);
        } else if (result.error === 'bloqueado') {
            setBlockedUser(result.username);
            setLoading(false);
        } else if (result.error === 'cooldown') {
            setCooldown(result.remaining);
            setError(`Login bloqueado temporariamente`);
            setLoading(false);
        } else {
            setError(result.error);
            setLoading(false);
        }
    }

    const isLocked = cooldown > 0;

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-header">
                        <div className="auth-logo">
                            <img src="/logo.jfif" alt="Creme Jundiaí" style={{ width: 64, height: 64, borderRadius: 16, objectFit: 'cover', boxShadow: '0 4px 12px rgba(5, 150, 105, 0.2)' }} />
                        </div>
                        <h1>Creme Jundiaí Manager</h1>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label>Usuário</label>
                            <input
                                className="form-input"
                                name="username"
                                value={form.username}
                                onChange={handleChange}
                                placeholder="Digite seu usuário"
                                autoFocus
                                autoComplete="username"
                                disabled={isLocked}
                            />
                        </div>

                        <div className="form-group">
                            <label>Senha</label>
                            <input
                                className="form-input"
                                name="password"
                                type="password"
                                value={form.password}
                                onChange={handleChange}
                                placeholder="Digite sua senha"
                                autoComplete="current-password"
                                disabled={isLocked}
                            />
                        </div>

                        {error && (
                            <div className="auth-error">
                                <span>!</span> {error}
                            </div>
                        )}

                        {isLocked && (
                            <div style={{
                                textAlign: 'center',
                                padding: '12px 16px',
                                borderRadius: 'var(--radius-md)',
                                background: 'rgba(239, 68, 68, 0.06)',
                                border: '1px solid rgba(239, 68, 68, 0.15)',
                                color: '#dc2626',
                                fontSize: '14px',
                                fontWeight: 600,
                            }}>
                                ⏳ Tente novamente em <span style={{ fontSize: '18px', fontWeight: 800 }}>{cooldown}s</span>
                            </div>
                        )}

                        <button type="submit" className="btn btn-primary auth-btn" disabled={loading || isLocked}>
                            {loading ? 'Entrando...' : isLocked ? `Aguarde ${cooldown}s` : 'Entrar'}
                        </button>
                    </form>

                    <div className="auth-footer">
                        <p>
                            Não tem conta?{' '}
                            <Link to="/cadastro" className="auth-link">
                                Criar conta
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

            {/* Pending User Modal */}
            {pendingUser && (
                <div className="modal-overlay" onClick={() => setPendingUser(null)}>
                    <div className="modal confirm-dialog" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-body">
                            <div className="confirm-icon" style={{ background: 'rgba(245, 158, 11, 0.10)' }}>⏳</div>
                            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Aguardando Aprovação</h3>
                            <p>
                                Desculpe <strong>{pendingUser}</strong>, mas seu usuário ainda não foi aprovado.
                                Aguarde a aprovação do responsável para acessar o sistema.
                            </p>
                        </div>
                        <div className="modal-footer" style={{ justifyContent: 'center' }}>
                            <button className="btn btn-primary" onClick={() => setPendingUser(null)}>
                                Entendi
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Blocked User Modal */}
            {blockedUser && (
                <div className="modal-overlay" onClick={() => setBlockedUser(null)}>
                    <div className="modal confirm-dialog" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-body">
                            <div className="confirm-icon" style={{ background: 'rgba(239, 68, 68, 0.10)' }}>🔒</div>
                            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Conta Bloqueada</h3>
                            <p>
                                <strong>{blockedUser}</strong>, sua conta foi bloqueada por excesso de tentativas incorretas.
                                O responsável deve liberar seu acesso para que você possa entrar novamente.
                            </p>
                        </div>
                        <div className="modal-footer" style={{ justifyContent: 'center' }}>
                            <button className="btn btn-primary" onClick={() => setBlockedUser(null)}>
                                Entendi
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
