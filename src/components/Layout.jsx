import { useState, useEffect, useCallback } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getPendingUsers } from '../utils/auth';
import ApprovalModal from './ApprovalModal';

// Icons
const InicioIcon = () => (
    <svg className="nav-svg-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
);
const GeradorPrecoIcon = () => (
    <svg className="nav-svg-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
);
const RegrasTribIcon = () => (
    <svg className="nav-svg-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);
const ProducaoIcon = () => (
    <svg className="nav-svg-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
);
const PrecoIcon = () => (
    <svg className="nav-svg-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
const TabelasPrecosIcon = () => (
    <svg className="nav-svg-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);
const EstoqueIcon = () => (
    <svg className="nav-svg-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
    </svg>
);
const ProdutosIcon = () => (
    <svg className="nav-svg-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
);
const MovimentacoesIcon = () => (
    <svg className="nav-svg-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
    </svg>
);
const UsuariosIcon = () => (
    <svg className="nav-svg-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
);
const LogisticoIcon = () => (
    <svg className="nav-svg-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 17a2 2 0 100-4 2 2 0 000 4zm10 0a2 2 0 100-4 2 2 0 000 4zM6 17H3V8a1 1 0 011-1h9v10m0-10h3l3 4v6h-3" />
    </svg>
);
const RomaneioIcon = () => (
    <svg className="nav-svg-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
);
const PedidosIcon = () => (
    <svg className="nav-svg-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
);
const DevIcon = () => (
    <svg className="nav-svg-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
);
const DatabaseIcon = () => (
    <svg className="nav-svg-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
    </svg>
);
const ChevronIcon = ({ open }) => (
    <svg
        className="nav-svg-icon cj-chevron"
        style={{ transform: open ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 200ms ease', width: 16, height: 16 }}
        fill="none" stroke="currentColor" viewBox="0 0 24 24"
    >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
);

export default function Layout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [geradorOpen, setGeradorOpen] = useState(false);
    const [estoqueOpen, setEstoqueOpen] = useState(false);
    const [logisticoOpen, setLogisticoOpen] = useState(false);
    const [devOpen, setDevOpen] = useState(false);
    const [animateItems, setAnimateItems] = useState(false);
    const { session, isAdmin, logout } = useAuth();
    const [pendingUsers, setPendingUsers] = useState([]);
    const location = useLocation();

    const roleLabels = {
        DEV: 'DEV',
        administrador: 'Administrador',
        estoque: 'Estoque',
        logistico: 'Logístico',
    };

    const role = session?.role;
    const canGerador = role === 'DEV' || role === 'administrador';
    const canEstoque = role === 'DEV' || role === 'estoque';
    const canLogistico = role === 'DEV' || role === 'logistico';
    const canDev = role === 'DEV';

    // Auto-expand modules if on a child route
    useEffect(() => {
        if (location.pathname.startsWith('/produtos') || location.pathname.startsWith('/movimentacoes') || location.pathname.startsWith('/producao-estoque') || location.pathname.startsWith('/resumo')) {
            setEstoqueOpen(true);
        }
        if (location.pathname.startsWith('/receitas') || location.pathname.startsWith('/regras-tributarias') || location.pathname.startsWith('/custos') || location.pathname.startsWith('/preco') || location.pathname.startsWith('/tabelas-precos')) {
            setGeradorOpen(true);
        }
        if (location.pathname.startsWith('/romaneio') || location.pathname.startsWith('/pedidos')) {
            setLogisticoOpen(true);
        }
        if (location.pathname.startsWith('/dev/')) {
            setDevOpen(true);
        }
    }, [location.pathname]);

    // Staggered animation when sidebar opens
    useEffect(() => {
        if (sidebarOpen) {
            setAnimateItems(false);
            const timer = setTimeout(() => setAnimateItems(true), 50);
            return () => clearTimeout(timer);
        } else {
            setAnimateItems(false);
        }
    }, [sidebarOpen]);

    // Poll for pending users (admin only)
    const checkPending = useCallback(async () => {
        if (isAdmin) {
            const pending = await getPendingUsers();
            if (pending.length > 0) setPendingUsers(pending);
        }
    }, [isAdmin]);

    useEffect(() => {
        checkPending();
        const interval = setInterval(checkPending, 2000);
        return () => clearInterval(interval);
    }, [checkPending]);

    function handleApprovalDone() {
        setPendingUsers([]);
    }

    // Get current page title
    function getPageTitle() {
        if (location.pathname === '/') return 'Início';
        if (location.pathname.startsWith('/receitas')) return 'Receitas';
        if (location.pathname.startsWith('/regras-tributarias')) return 'Regras Tributárias';
        if (location.pathname.startsWith('/producao-estoque')) return 'Produção';
        if (location.pathname.startsWith('/resumo')) return 'Resumo';
        if (location.pathname.startsWith('/custos')) return 'Custos';
        if (location.pathname.startsWith('/preco')) return 'Preço';
        if (location.pathname.startsWith('/tabelas-precos')) return 'Tabelas de Preço';
        if (location.pathname.startsWith('/produtos')) return 'Produtos';
        if (location.pathname.startsWith('/movimentacoes')) return 'Movimentações';
        if (location.pathname.startsWith('/romaneio')) return 'Romaneio';
        if (location.pathname.startsWith('/pedidos')) return 'Pedidos';
        if (location.pathname.startsWith('/admin/usuarios')) return 'Usuários';
        if (location.pathname.startsWith('/dev/database')) return 'Banco de Dados';
        return 'Creme Jundiaí Manager';
    }

    // Animation delay counter
    let animIdx = 0;
    function nextAnim() {
        return animateItems
            ? { animation: `slideInLeft 0.3s ease-out ${animIdx++ * 0.05}s both` }
            : { opacity: 0, animation: 'none' };
    }

    return (
        <>
            {/* ═══ HEADER ═══ */}
            <header className="cj-header">
                <div className="cj-header-inner">
                    <div className="cj-header-left">
                        <button
                            className="cj-hamburger"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            aria-label="Menu"
                        >
                            {sidebarOpen ? (
                                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            )}
                        </button>

                        <div className="cj-header-logo">
                            <img src="/logo.jfif" alt="Creme Jundiaí" className="cj-header-logo-img" />
                            <h1 className="cj-header-title">Creme Jundiaí Manager</h1>
                        </div>
                    </div>

                    <div className="cj-header-right">
                        <button
                            className="cj-header-action"
                            onClick={() => window.location.reload()}
                            title="Atualizar"
                        >
                            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>

                        <div className="cj-header-user-pill">
                            <div className="cj-header-avatar">
                                {(session?.username || 'U').charAt(0).toUpperCase()}
                            </div>
                            <span className="cj-header-username">{session?.username}</span>
                        </div>

                        <button
                            className="cj-header-action cj-header-logout"
                            onClick={logout}
                            title="Sair"
                        >
                            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </button>
                    </div>
                </div>
            </header>

            {/* ═══ OVERLAY ═══ */}
            <div
                className={`cj-overlay ${sidebarOpen ? 'open' : ''}`}
                onClick={() => setSidebarOpen(false)}
            />

            {/* ═══ SIDEBAR MENU ═══ */}
            <aside className={`cj-sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="cj-sidebar-scroll">

                    <nav className="cj-sidebar-nav">
                        {/* Início */}
                        <NavLink
                            to="/"
                            end
                            onClick={() => setSidebarOpen(false)}
                            className="cj-menu-item"
                            style={nextAnim()}
                        >
                            <span className="cj-menu-icon"><InicioIcon /></span>
                            <span className="cj-menu-label">Início</span>
                        </NavLink>

                        {/* Admin: Usuarios */}
                        {isAdmin && (
                            <NavLink
                                to="/admin/usuarios"
                                onClick={() => setSidebarOpen(false)}
                                className="cj-menu-item"
                                style={nextAnim()}
                            >
                                <span className="cj-menu-icon"><UsuariosIcon /></span>
                                <span className="cj-menu-label">Usuários</span>
                            </NavLink>
                        )}

                        {/* Gerador de Preço (collapsible) */}
                        {canGerador && (
                            <>
                                <button
                                    className={`cj-menu-item cj-menu-parent ${geradorOpen ? 'expanded' : ''}`}
                                    onClick={() => setGeradorOpen(!geradorOpen)}
                                    style={nextAnim()}
                                >
                                    <span className="cj-menu-icon"><GeradorPrecoIcon /></span>
                                    <span className="cj-menu-label">Gerador de Preço</span>
                                    <ChevronIcon open={geradorOpen} />
                                </button>

                                <div className={`cj-submenu ${geradorOpen ? 'open' : ''}`}>
                                    <NavLink
                                        to="/receitas"
                                        onClick={() => setSidebarOpen(false)}
                                        className="cj-menu-item cj-submenu-item"
                                        style={geradorOpen ? { opacity: 1 } : { opacity: 0, animation: 'none' }}
                                    >
                                        <span className="cj-menu-icon"><ProducaoIcon /></span>
                                        <span className="cj-menu-label">Receitas</span>
                                    </NavLink>
                                    <NavLink
                                        to="/regras-tributarias"
                                        onClick={() => setSidebarOpen(false)}
                                        className="cj-menu-item cj-submenu-item"
                                        style={geradorOpen ? { opacity: 1 } : { opacity: 0, animation: 'none' }}
                                    >
                                        <span className="cj-menu-icon"><RegrasTribIcon /></span>
                                        <span className="cj-menu-label">Regras Tributárias</span>
                                    </NavLink>
                                    <NavLink
                                        to="/custos"
                                        onClick={() => setSidebarOpen(false)}
                                        className="cj-menu-item cj-submenu-item"
                                        style={geradorOpen ? { opacity: 1 } : { opacity: 0, animation: 'none' }}
                                    >
                                        <span className="cj-menu-icon"><PrecoIcon /></span>
                                        <span className="cj-menu-label">Custos</span>
                                    </NavLink>
                                    <NavLink
                                        to="/preco"
                                        onClick={() => setSidebarOpen(false)}
                                        className="cj-menu-item cj-submenu-item"
                                        style={geradorOpen ? { opacity: 1 } : { opacity: 0, animation: 'none' }}
                                    >
                                        <span className="cj-menu-icon"><PrecoIcon /></span>
                                        <span className="cj-menu-label">Preço</span>
                                    </NavLink>
                                    <NavLink
                                        to="/tabelas-precos"
                                        onClick={() => setSidebarOpen(false)}
                                        className="cj-menu-item cj-submenu-item"
                                        style={geradorOpen ? { opacity: 1 } : { opacity: 0, animation: 'none' }}
                                    >
                                        <span className="cj-menu-icon"><TabelasPrecosIcon /></span>
                                        <span className="cj-menu-label">Tabelas de Preço</span>
                                    </NavLink>
                                </div>
                            </>
                        )}

                        {/* Estoque (collapsible) */}
                        {canEstoque && (
                            <>
                                <button
                                    className={`cj-menu-item cj-menu-parent ${estoqueOpen ? 'expanded' : ''}`}
                                    onClick={() => setEstoqueOpen(!estoqueOpen)}
                                    style={nextAnim()}
                                >
                                    <span className="cj-menu-icon"><EstoqueIcon /></span>
                                    <span className="cj-menu-label">Estoque</span>
                                    <ChevronIcon open={estoqueOpen} />
                                </button>

                                <div className={`cj-submenu ${estoqueOpen ? 'open' : ''}`}>
                                    <NavLink
                                        to="/produtos"
                                        onClick={() => setSidebarOpen(false)}
                                        className="cj-menu-item cj-submenu-item"
                                        style={estoqueOpen ? { opacity: 1 } : { opacity: 0, animation: 'none' }}
                                    >
                                        <span className="cj-menu-icon"><ProdutosIcon /></span>
                                        <span className="cj-menu-label">Produtos</span>
                                    </NavLink>
                                    <NavLink
                                        to="/movimentacoes"
                                        onClick={() => setSidebarOpen(false)}
                                        className="cj-menu-item cj-submenu-item"
                                        style={estoqueOpen ? { opacity: 1 } : { opacity: 0, animation: 'none' }}
                                    >
                                        <span className="cj-menu-icon"><MovimentacoesIcon /></span>
                                        <span className="cj-menu-label">Movimentações</span>
                                    </NavLink>
                                    <NavLink
                                        to="/producao-estoque"
                                        onClick={() => setSidebarOpen(false)}
                                        className="cj-menu-item cj-submenu-item"
                                        style={estoqueOpen ? { opacity: 1 } : { opacity: 0, animation: 'none' }}
                                    >
                                        <span className="cj-menu-icon"><ProducaoIcon /></span>
                                        <span className="cj-menu-label">Produção</span>
                                    </NavLink>
                                    <NavLink
                                        to="/resumo"
                                        onClick={() => setSidebarOpen(false)}
                                        className="cj-menu-item cj-submenu-item"
                                        style={estoqueOpen ? { opacity: 1 } : { opacity: 0, animation: 'none' }}
                                    >
                                        <span className="cj-menu-icon"><TabelasPrecosIcon /></span>
                                        <span className="cj-menu-label">Resumo</span>
                                    </NavLink>
                                </div>
                            </>
                        )}

                        {/* Logístico (collapsible) */}
                        {canLogistico && (
                            <>
                                <button
                                    className={`cj-menu-item cj-menu-parent ${logisticoOpen ? 'expanded' : ''}`}
                                    onClick={() => setLogisticoOpen(!logisticoOpen)}
                                    style={nextAnim()}
                                >
                                    <span className="cj-menu-icon"><LogisticoIcon /></span>
                                    <span className="cj-menu-label">Logístico</span>
                                    <ChevronIcon open={logisticoOpen} />
                                </button>

                                <div className={`cj-submenu ${logisticoOpen ? 'open' : ''}`}>
                                    <NavLink
                                        to="/romaneio"
                                        onClick={() => setSidebarOpen(false)}
                                        className="cj-menu-item cj-submenu-item"
                                        style={logisticoOpen ? { opacity: 1 } : { opacity: 0, animation: 'none' }}
                                    >
                                        <span className="cj-menu-icon"><RomaneioIcon /></span>
                                        <span className="cj-menu-label">Romaneio</span>
                                    </NavLink>
                                    <NavLink
                                        to="/pedidos"
                                        onClick={() => setSidebarOpen(false)}
                                        className="cj-menu-item cj-submenu-item"
                                        style={logisticoOpen ? { opacity: 1 } : { opacity: 0, animation: 'none' }}
                                    >
                                        <span className="cj-menu-icon"><PedidosIcon /></span>
                                        <span className="cj-menu-label">Pedidos</span>
                                    </NavLink>
                                </div>
                            </>
                        )}

                        {/* Desenvolvedor (collapsible, DEV only) */}
                        {canDev && (
                            <>
                                <button
                                    className={`cj-menu-item cj-menu-parent ${devOpen ? 'expanded' : ''}`}
                                    onClick={() => setDevOpen(!devOpen)}
                                    style={nextAnim()}
                                >
                                    <span className="cj-menu-icon"><DevIcon /></span>
                                    <span className="cj-menu-label">Desenvolvedor</span>
                                    <ChevronIcon open={devOpen} />
                                </button>

                                <div className={`cj-submenu ${devOpen ? 'open' : ''}`}>
                                    <NavLink
                                        to="/dev/database"
                                        onClick={() => setSidebarOpen(false)}
                                        className="cj-menu-item cj-submenu-item"
                                        style={devOpen ? { opacity: 1 } : { opacity: 0, animation: 'none' }}
                                    >
                                        <span className="cj-menu-icon"><DatabaseIcon /></span>
                                        <span className="cj-menu-label">Banco de Dados</span>
                                    </NavLink>
                                </div>
                            </>
                        )}

                    </nav>
                </div>

                <div className="cj-sidebar-bottom">
                    <div className="cj-sidebar-divider" />


                    <div className="cj-sidebar-user-section">
                        <div className="cj-sidebar-user-card">
                            <div className="cj-sidebar-avatar">
                                {(session?.username || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div className="cj-sidebar-user-details">
                                <span className="cj-sidebar-user-name">{session?.username}</span>
                                <span className="cj-sidebar-user-role">
                                    {roleLabels[session?.role] || session?.role}
                                </span>
                            </div>
                            <button
                                className="cj-logout-icon-btn"
                                onClick={() => { logout(); setSidebarOpen(false); }}
                                title="Sair"
                            >
                                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className="cj-sidebar-footer-text">
                        • Creme Jundiaí Manager v1.0
                    </div>
                </div>
            </aside>

            {/* ═══ MAIN CONTENT ═══ */}
            <main className="cj-main">
                <Outlet />
            </main>

            {/* Admin Approval Modal */}
            {pendingUsers.length > 0 && (
                <ApprovalModal
                    pendingUsers={pendingUsers}
                    onApproved={handleApprovalDone}
                />
            )}
        </>
    );
}
