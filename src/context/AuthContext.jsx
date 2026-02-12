import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getSession, loginUser, logout as doLogout, registerUser, syncSessionRole } from '../utils/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [session, setSession] = useState(() => getSession());

    // Keep session in sync with DB (role updates, etc.)
    useEffect(() => {
        syncSessionRole().then((fresh) => {
            if (fresh && session && fresh.role !== session.role) {
                setSession(fresh);
            }
        });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Auto-logout when browser window/tab is closed
    useEffect(() => {
        const handleUnload = () => {
            doLogout();
        };
        window.addEventListener('beforeunload', handleUnload);
        return () => window.removeEventListener('beforeunload', handleUnload);
    }, []);

    const login = useCallback(async (username, password) => {
        const result = await loginUser(username, password);
        if (result.success) {
            setSession(getSession());
        }
        return result;
    }, []);

    const register = useCallback(async (data) => {
        return registerUser(data);
    }, []);

    const logout = useCallback(() => {
        doLogout();
        setSession(null);
    }, []);

    const isAdmin = session?.role === 'DEV';

    return (
        <AuthContext.Provider value={{ session, isAuthenticated: !!session, isAdmin, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
