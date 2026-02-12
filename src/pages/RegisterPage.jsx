import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function RegisterPage() {
    const { register } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({ username: '', password: '', confirmPassword: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    function handleChange(e) {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        if (error) setError('');
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (!form.username.trim() || !form.password) {
            setError('Preencha todos os campos obrigatórios');
            return;
        }

        if (form.password !== form.confirmPassword) {
            setError('As senhas não coincidem');
            return;
        }

        setLoading(true);
        await new Promise((r) => setTimeout(r, 400));
        const result = await register({
            username: form.username.trim(),
            password: form.password,
        });

        if (result.success) {
            setLoading(false);
            setShowSuccess(true);
        } else {
            setError(result.error);
            setLoading(false);
        }
    }

    function handleSuccessClose() {
        setShowSuccess(false);
        navigate('/login', { replace: true });
    }

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-header">
                        <div className="auth-logo">
                            <div className="sidebar-logo-icon" style={{ width: 52, height: 52, fontSize: 24 }}>
                                CJ
                            </div>
                        </div>
                        <h1>Criar Conta</h1>
                        <p>Cadastre-se para acessar o sistema</p>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label>Usuário <span className="required">*</span></label>
                            <input
                                className="form-input"
                                name="username"
                                value={form.username}
                                onChange={handleChange}
                                placeholder="Mínimo 3 caracteres"
                                autoComplete="username"
                                autoFocus
                            />
                        </div>

                        <div className="form-group">
                            <label>Senha <span className="required">*</span></label>
                            <input
                                className="form-input"
                                name="password"
                                type="password"
                                value={form.password}
                                onChange={handleChange}
                                placeholder="Mínimo 3 caracteres"
                                autoComplete="new-password"
                            />
                        </div>

                        <div className="form-group">
                            <label>Confirmar Senha <span className="required">*</span></label>
                            <input
                                className="form-input"
                                name="confirmPassword"
                                type="password"
                                value={form.confirmPassword}
                                onChange={handleChange}
                                placeholder="Repita a senha"
                                autoComplete="new-password"
                            />
                        </div>

                        {error && (
                            <div className="auth-error">
                                <span>!</span> {error}
                            </div>
                        )}

                        <button type="submit" className="btn btn-primary auth-btn" disabled={loading}>
                            {loading ? 'Enviando...' : 'Solicitar Cadastro'}
                        </button>
                    </form>

                    <div className="auth-footer">
                        <p>
                            Já tem conta?{' '}
                            <Link to="/login" className="auth-link">
                                Fazer login
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

            {/* Success Modal */}
            {showSuccess && (
                <div className="modal-overlay" onClick={handleSuccessClose}>
                    <div className="modal confirm-dialog" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-body">
                            <div className="confirm-icon" style={{ background: 'rgba(5, 150, 105, 0.10)' }}>OK</div>
                            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Cadastro Enviado!</h3>
                            <p>Sua solicitação foi enviada para o responsável para aprovação. Você será notificado quando seu acesso for liberado.</p>
                        </div>
                        <div className="modal-footer" style={{ justifyContent: 'center' }}>
                            <button className="btn btn-primary" onClick={handleSuccessClose}>
                                Entendi
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
