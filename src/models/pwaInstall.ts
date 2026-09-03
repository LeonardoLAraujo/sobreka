import {supabase} from '../lib/supabase';
import {getSessionToken} from './auth';

export interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{outcome: 'accepted' | 'dismissed'}>;
}

export const INSTALL_PROMPT_CHANGED_EVENT = 'pwa-install-prompt-changed';

let deferredPrompt: BeforeInstallPromptEvent | null = null;

window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    window.dispatchEvent(new Event(INSTALL_PROMPT_CHANGED_EVENT));
});

window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    window.dispatchEvent(new Event(INSTALL_PROMPT_CHANGED_EVENT));
});

export function getDeferredInstallPrompt(): BeforeInstallPromptEvent | null{
    return deferredPrompt;
}

export function clearDeferredInstallPrompt(): void{
    deferredPrompt = null;
    window.dispatchEvent(new Event(INSTALL_PROMPT_CHANGED_EVENT));
}

export function isRunningStandalone(): boolean{
    const nav = navigator as Navigator & {standalone?: boolean};
    return window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true;
}

export function isIOS(): boolean{
    return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

interface DownloadAppRow {
    download_app: boolean;
}

function firstRow(data: DownloadAppRow[] | DownloadAppRow | null): DownloadAppRow | null{
    if (!data) {
        return null;
    }
    return Array.isArray(data) ? (data[0] ?? null) : data;
}

export async function hasDownloadedApp(userId: number): Promise<boolean>{
    const {data, error} = await supabase.rpc('get_user_download_app_status', {p_id: userId, p_session_token: getSessionToken()});
    if (error) {
        throw error;
    }
    return firstRow(data)?.download_app ?? false;
}

export async function markAppDownloaded(userId: number): Promise<void>{
    const {error} = await supabase.rpc('set_user_download_app', {p_id: userId, p_session_token: getSessionToken(), p_value: true});
    if (error) {
        throw error;
    }
}
