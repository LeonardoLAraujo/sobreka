import {supabase} from '../lib/supabase';

const SESSION_KEY = 'gym_session_user_id';
const SESSION_TOKEN_KEY = 'gym_session_token';
const PROFILE_CACHE_KEY = 'gym_user_profile_cache';

export interface UserRecord {
    id: number;
    name: string | null;
    email: string | null;
    avatar_photo: string | null;
}

interface AuthRow extends UserRecord {
    session_token: string;
}

const KNOWN_RPC_ERRORS: Record<string, string> = {
    email_already_registered: 'Já existe uma conta com esse e-mail.',
    invalid_credentials: 'E-mail ou senha incorretos.',
};

export function translateAuthError(message: string): string{
    return KNOWN_RPC_ERRORS[message] ?? message;
}

export function getErrorMessage(err: unknown): string{
    if (err instanceof Error) {
        return err.message;
    }
    if (typeof err === 'object' && err !== null && 'message' in err) {
        const message = (err as {message: unknown}).message;
        if (typeof message === 'string') {
            return message;
        }
    }
    return String(err);
}

function firstRow(data: AuthRow[] | AuthRow | null): AuthRow | null{
    if (!data) {
        return null;
    }
    return Array.isArray(data) ? (data[0] ?? null) : data;
}

function applySession(row: AuthRow): UserRecord{
    const {session_token, ...user} = row;
    setSessionUserId(user.id);
    setSessionToken(session_token);
    setCachedProfile(user);
    return user;
}

export async function registerUser(name: string, email: string, password: string): Promise<UserRecord>{
    const {data, error} = await supabase.rpc('register_user', {p_name: name, p_email: email, p_password: password});
    if (error) {
        throw error;
    }
    const row = firstRow(data);
    if (!row) {
        throw new Error('Não foi possível criar a conta.');
    }
    return applySession(row);
}

export async function loginUser(email: string, password: string): Promise<UserRecord>{
    const {data, error} = await supabase.rpc('login_user', {p_email: email, p_password: password});
    if (error) {
        throw error;
    }
    const row = firstRow(data);
    if (!row) {
        throw new Error('E-mail ou senha incorretos.');
    }
    return applySession(row);
}

export function getSessionUserId(): number | null{
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) {
        return null;
    }
    const id = Number(raw);
    return Number.isNaN(id) ? null : id;
}

function setSessionUserId(id: number): void{
    localStorage.setItem(SESSION_KEY, String(id));
}

export function getSessionToken(): string | null{
    return localStorage.getItem(SESSION_TOKEN_KEY);
}

function setSessionToken(token: string): void{
    localStorage.setItem(SESSION_TOKEN_KEY, token);
}

export function getCachedProfile(): UserRecord | null{
    const raw = localStorage.getItem(PROFILE_CACHE_KEY);
    if (!raw) {
        return null;
    }
    try {
        return JSON.parse(raw) as UserRecord;
    } catch {
        return null;
    }
}

export function setCachedProfile(user: UserRecord): void{
    localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(user));
}

export function clearSession(): void{
    const token = getSessionToken();
    if (token) {
        void (async () => {
            try {
                await supabase.rpc('logout_user', {p_session_token: token});
            } catch {
                // melhor esforço: a sessão expira sozinha de qualquer forma
            }
        })();
    }
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_TOKEN_KEY);
    localStorage.removeItem(PROFILE_CACHE_KEY);
}
