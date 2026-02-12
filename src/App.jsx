import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import MovementsPage from './pages/MovementsPage';
import ProducaoEstoquePage from './pages/ProducaoEstoquePage';
import ResumoPage from './pages/ResumoPage';
import RomaneioPage from './pages/RomaneioPage';
import PedidosPage from './pages/PedidosPage';
import RegrasTributariasPage from './pages/RegrasTributariasPage';
import ProducaoPage from './pages/ProducaoPage';
import PrecoPage from './pages/PrecoPage';
import TabelasPrecosPage from './pages/TabelasPrecosPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminUsersPage from './pages/AdminUsersPage';
import DatabasePage from './pages/DatabasePage';

function ProtectedRoute({ children }) {
    const { isAuthenticated } = useAuth();
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return children;
}

function RoleRoute({ children, roles }) {
    const { session } = useAuth();
    if (!roles.includes(session?.role)) return <Navigate to="/" replace />;
    return children;
}

function PublicRoute({ children }) {
    const { isAuthenticated } = useAuth();
    if (isAuthenticated) return <Navigate to="/" replace />;
    return children;
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    {/* Public routes */}
                    <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
                    <Route path="/cadastro" element={<PublicRoute><RegisterPage /></PublicRoute>} />

                    {/* Protected routes */}
                    <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                        <Route path="/" element={<HomePage />} />

                        {/* Gerador de Preço — CEO, administrador */}
                        <Route path="/regras-tributarias" element={<RoleRoute roles={['DEV', 'administrador']}><RegrasTributariasPage /></RoleRoute>} />
                        <Route path="/producao" element={<RoleRoute roles={['DEV', 'administrador']}><ProducaoPage /></RoleRoute>} />
                        <Route path="/preco" element={<RoleRoute roles={['DEV', 'administrador']}><PrecoPage /></RoleRoute>} />
                        <Route path="/tabelas-precos" element={<RoleRoute roles={['DEV', 'administrador']}><TabelasPrecosPage /></RoleRoute>} />

                        {/* Estoque — CEO, estoque */}
                        <Route path="/produtos" element={<RoleRoute roles={['DEV', 'estoque']}><ProductsPage /></RoleRoute>} />
                        <Route path="/movimentacoes" element={<RoleRoute roles={['DEV', 'estoque']}><MovementsPage /></RoleRoute>} />
                        <Route path="/producao-estoque" element={<RoleRoute roles={['DEV', 'estoque']}><ProducaoEstoquePage /></RoleRoute>} />
                        <Route path="/resumo" element={<RoleRoute roles={['DEV', 'estoque']}><ResumoPage /></RoleRoute>} />

                        {/* Logístico — CEO, logistico */}
                        <Route path="/romaneio" element={<RoleRoute roles={['DEV', 'logistico']}><RomaneioPage /></RoleRoute>} />
                        <Route path="/pedidos" element={<RoleRoute roles={['DEV', 'logistico']}><PedidosPage /></RoleRoute>} />

                        {/* Admin — CEO */}
                        <Route path="/admin/usuarios" element={<RoleRoute roles={['DEV']}><AdminUsersPage /></RoleRoute>} />

                        {/* Desenvolvedor — DEV only */}
                        <Route path="/dev/database" element={<RoleRoute roles={['DEV']}><DatabasePage /></RoleRoute>} />
                    </Route>

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}
