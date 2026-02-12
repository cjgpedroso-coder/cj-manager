import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getSession, loginUser, logout as doLogout, registerUser } from '../utils/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [session, setSession] = useState(() => getSession());

    // Keep session in sync with localStorage (role updates, etc.)
    useEffect(() => {
        const fresh = getSession();
        if (fresh && session) {
            if (fresh.role !== session.role) {
                setSession(fresh);
            }
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Auto-logout when browser window/tab is closed
    useEffect(() => {
        const handleUnload = () => {
            doLogout();
        };
        window.addEventListener('beforeunload', handleUnload);
        return () => window.removeEventListener('beforeunload', handleUnload);
    }, []);

    const login = useCallback((username, password) => {
        const result = loginUser(username, password);
        if (result.success) {
            // Re-read from getSession to ensure role is synced
            setSession(getSession());
        }
        return result;
    }, []);

    const register = useCallback((data) => {
        return registerUser(data);
    }, []);

    const logout = useCallback(() => {
        doLogout();
        setSession(null);
    }, []);

    const isAdmin = session?.role === 'CEO';

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
