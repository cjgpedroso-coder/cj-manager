import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const allModules = [
    {
        id: 'gerador',
        title: 'Gerador de Preço',
        description: 'Configure regras tributárias, gerencie produção e gere preços dos produtos.',
        icon: '🧮',
        color: '#059669',
        gradient: 'linear-gradient(135deg, #059669, #10b981)',
        path: '/regras-tributarias',
        items: ['Regras Tributárias', 'Produção', 'Preço', 'Tabelas de Preço'],
        roles: ['DEV', 'administrador'],
    },
    {
        id: 'estoque',
        title: 'Estoque',
        description: 'Controle produtos cadastrados e acompanhe movimentações de entrada e saída.',
        icon: '📦',
        color: '#2563eb',
        gradient: 'linear-gradient(135deg, #2563eb, #3b82f6)',
        path: '/produtos',
        items: ['Produtos', 'Movimentações'],
        roles: ['DEV', 'estoque'],
    },
    {
        id: 'logistico',
        title: 'Logístico',
        description: 'Gerencie romaneios de entrega e acompanhe pedidos em andamento.',
        icon: '🚛',
        color: '#d97706',
        gradient: 'linear-gradient(135deg, #d97706, #f59e0b)',
        path: '/romaneio',
        items: ['Romaneio', 'Pedidos'],
        roles: ['DEV', 'logistico'],
    },
    {
        id: 'usuarios',
        title: 'Usuários',
        description: 'Gerencie contas de usuários, aprove cadastros e defina níveis de acesso.',
        icon: '👥',
        color: '#7c3aed',
        gradient: 'linear-gradient(135deg, #7c3aed, #8b5cf6)',
        path: '/admin/usuarios',
        items: ['Gerenciar Usuários', 'Aprovações'],
        roles: ['DEV'],
    },
];

export default function HomePage() {
    const navigate = useNavigate();
    const { session } = useAuth();

    const role = session?.role;
    const visibleModules = allModules.filter((mod) => mod.roles.includes(role));

    return (
        <div className="home-page">
            <div className="home-welcome">
                <h2>Olá, <span className="home-username">{session?.username}</span> 👋</h2>
                <p>Selecione um módulo para começar</p>
            </div>

            <div className="home-modules-grid">
                {visibleModules.map((mod) => (
                    <button
                        key={mod.id}
                        className="home-module-card"
                        onClick={() => navigate(mod.path)}
                    >
                        <div className="home-module-header">
                            <div className="home-module-icon" style={{ background: mod.gradient }}>
                                {mod.icon}
                            </div>
                            <h3>{mod.title}</h3>
                        </div>
                        <p className="home-module-desc">{mod.description}</p>
                        <div className="home-module-items">
                            {mod.items.map((item) => (
                                <span key={item} className="home-module-tag" style={{ color: mod.color, background: `${mod.color}10` }}>
                                    {item}
                                </span>
                            ))}
                        </div>
                        <div className="home-module-arrow" style={{ color: mod.color }}>
                            Acessar →
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
