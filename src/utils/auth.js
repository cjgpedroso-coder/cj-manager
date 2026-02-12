// ============================================================
// CJ - Auth Storage Layer (with Approval Flow)
// ============================================================

const USERS_KEY = 'cj_users';
const SESSION_KEY = 'cj_session';
const PENDING_QUEUE_KEY = 'cj_pending_queue'; // IDs of users awaiting approval
const LOGIN_ATTEMPTS_KEY = 'cj_login_attempts'; // Failed attempt tracking

// Default dev user - seeded on first load
const DEFAULT_USER = {
    id: 'dev_admin',
    username: 'caio',
    password: 'dev1',
    role: 'CEO',
    status: 'active', // active | pending | inactive | bloqueado
    createdAt: '2026-01-01T00:00:00.000Z',
};

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function ensureDefaultUser() {
    const users = getUsers();
    const existing = users.find((u) => u.username === DEFAULT_USER.username);
    if (!existing) {
        users.push(DEFAULT_USER);
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    } else {
        // Always ensure caio has CEO role and active status
        if (existing.role !== 'CEO' || existing.status !== 'active') {
            existing.role = 'CEO';
            existing.status = 'active';
            localStorage.setItem(USERS_KEY, JSON.stringify(users));
        }
    }
}

// Initialize on module load
ensureDefaultUser();

// ── Users ────────────────────────────────────────────────────

export function getUsers() {
    const data = localStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : [];
}

/**
 * Register a new user. They start as 'pending' until approved by admin.
 */
export function registerUser({ username, password }) {
    const users = getUsers();

    if (users.find((u) => u.username.toLowerCase() === username.toLowerCase())) {
        return { success: false, error: 'Nome de usuário já existe' };
    }

    if (username.trim().length < 3) {
        return { success: false, error: 'Usuário deve ter pelo menos 3 caracteres' };
    }

    if (password.length < 3) {
        return { success: false, error: 'Senha deve ter pelo menos 3 caracteres' };
    }

    const user = {
        id: generateId(),
        username: username.trim().toLowerCase(),
        password,
        role: '', // set by admin during approval
        status: 'pending',
        createdAt: new Date().toISOString(),
    };

    users.push(user);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    // Add to pending queue so admin gets notified
    addToPendingQueue(user.id);

    return { success: true, user };
}

/**
 * Login. Returns error if user doesn't exist, wrong password, still pending, blocked, or on cooldown.
 */
export function loginUser(username, password) {
    const users = getUsers();
    const normalUsername = username.toLowerCase();
    const user = users.find(
        (u) => u.username.toLowerCase() === normalUsername
    );

    if (!user) {
        return { success: false, error: 'Usuário ou senha incorretos' };
    }

    // Check if user is permanently blocked
    if (user.status === 'bloqueado') {
        return { success: false, error: 'bloqueado', username: user.username };
    }

    // Check if user is on cooldown
    const attempts = getLoginAttempts(normalUsername);
    if (attempts.cooldownUntil && Date.now() < attempts.cooldownUntil) {
        const remaining = Math.ceil((attempts.cooldownUntil - Date.now()) / 1000);
        return { success: false, error: 'cooldown', remaining, username: user.username };
    }

    if (user.password !== password) {
        // Track failed attempt
        const newCount = (attempts.count || 0) + 1;

        if (newCount >= 6) {
            // Permanently block the user
            const idx = users.findIndex((u) => u.id === user.id);
            if (idx !== -1) {
                users[idx].status = 'bloqueado';
                localStorage.setItem(USERS_KEY, JSON.stringify(users));
            }
            clearLoginAttempts(normalUsername);
            return { success: false, error: 'bloqueado', username: user.username };
        }

        if (newCount >= 3 && newCount < 6) {
            // Start 30-second cooldown
            setLoginAttempts(normalUsername, newCount, Date.now() + 30000);
            return { success: false, error: 'cooldown', remaining: 30, username: user.username };
        }

        // Normal wrong password (< 3 attempts)
        setLoginAttempts(normalUsername, newCount, null);
        return { success: false, error: `Usuário ou senha incorretos (tentativa ${newCount}/3)` };
    }

    if (user.status === 'pending') {
        return { success: false, error: 'pending', username: user.username };
    }

    if (user.status === 'inactive') {
        return { success: false, error: 'Sua conta está desativada. Contate o responsável.' };
    }

    // Success – reset attempts
    clearLoginAttempts(normalUsername);

    const session = {
        userId: user.id,
        username: user.username,
        name: user.username,
        role: user.role,
        loginAt: new Date().toISOString(),
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return { success: true, session };
}

// ── Login Attempt Tracking ─────────────────────────────────────

function getAllAttempts() {
    const data = localStorage.getItem(LOGIN_ATTEMPTS_KEY);
    return data ? JSON.parse(data) : {};
}

export function getLoginAttempts(username) {
    const all = getAllAttempts();
    return all[username.toLowerCase()] || { count: 0, cooldownUntil: null };
}

function setLoginAttempts(username, count, cooldownUntil) {
    const all = getAllAttempts();
    all[username.toLowerCase()] = { count, cooldownUntil };
    localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(all));
}

function clearLoginAttempts(username) {
    const all = getAllAttempts();
    delete all[username.toLowerCase()];
    localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(all));
}

export function getSession() {
    const data = localStorage.getItem(SESSION_KEY);
    if (!data) return null;
    const session = JSON.parse(data);
    // Always sync role from user data in case it was updated
    const users = getUsers();
    const user = users.find((u) => u.id === session.userId);
    if (user) {
        session.role = user.role;
    }
    return session;
}

export function logout() {
    localStorage.removeItem(SESSION_KEY);
}

// ── Pending Queue (for admin notifications) ──────────────────

function addToPendingQueue(userId) {
    const queue = getPendingQueue();
    if (!queue.includes(userId)) {
        queue.push(userId);
        localStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(queue));
    }
}

export function getPendingQueue() {
    const data = localStorage.getItem(PENDING_QUEUE_KEY);
    return data ? JSON.parse(data) : [];
}

export function getPendingUsers() {
    const queue = getPendingQueue();
    const users = getUsers();
    return queue
        .map((id) => users.find((u) => u.id === id))
        .filter((u) => u && u.status === 'pending');
}

/**
 * Approve a pending user: set role and status to active, remove from queue.
 */
export function approveUser(userId, role) {
    const users = getUsers();
    const index = users.findIndex((u) => u.id === userId);
    if (index === -1) return false;

    users[index].status = 'active';
    users[index].role = role;
    users[index].approvedAt = new Date().toISOString();
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    // Remove from pending queue
    const queue = getPendingQueue().filter((id) => id !== userId);
    localStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(queue));

    return true;
}
