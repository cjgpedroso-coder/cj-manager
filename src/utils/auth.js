// ============================================================
// CJ - Auth Layer (API-based, session stays in localStorage)
// ============================================================

const API = '/api';
const SESSION_KEY = 'cj_session';

// ── Users ────────────────────────────────────────────────────

export async function getUsers() {
    const res = await fetch(`${API}/users`);
    return res.json();
}

export async function registerUser({ username, password }) {
    const res = await fetch(`${API}/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });
    return res.json();
}

export async function loginUser(username, password) {
    const res = await fetch(`${API}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });
    const result = await res.json();

    if (result.success) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(result.session));
    }

    return result;
}

// ── Session (stays in localStorage – per browser) ────────────

export function getSession() {
    const data = localStorage.getItem(SESSION_KEY);
    return data ? JSON.parse(data) : null;
}

export async function syncSessionRole() {
    const session = getSession();
    if (!session) return null;
    try {
        const res = await fetch(`${API}/users/${session.userId}/role`);
        const data = await res.json();
        if (data.role && data.role !== session.role) {
            session.role = data.role;
            localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        }
    } catch (e) { /* ignore */ }
    return session;
}

export function logout() {
    localStorage.removeItem(SESSION_KEY);
}

// ── Pending Users ────────────────────────────────────────────

export async function getPendingUsers() {
    const res = await fetch(`${API}/users/pending`);
    return res.json();
}

export async function approveUser(userId, role) {
    const res = await fetch(`${API}/users/${userId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
    });
    return res.json();
}

// ── Admin user management ────────────────────────────────────

export async function updateUser(userId, data) {
    const res = await fetch(`${API}/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return res.json();
}

export async function deleteUser(userId) {
    const res = await fetch(`${API}/users/${userId}`, {
        method: 'DELETE',
    });
    return res.json();
}
