import {supabase} from '../lib/supabase';
import {getSessionToken} from './auth';

interface OnboardingStatusRow {
    is_first: boolean;
}

function firstRow(data: OnboardingStatusRow[] | OnboardingStatusRow | null): OnboardingStatusRow | null{
    if (!data) {
        return null;
    }
    return Array.isArray(data) ? (data[0] ?? null) : data;
}

export async function isFirstAccess(userId: number): Promise<boolean>{
    const {data, error} = await supabase.rpc('get_user_onboarding_status', {p_id: userId, p_session_token: getSessionToken()});
    if (error) {
        throw error;
    }
    return firstRow(data)?.is_first ?? false;
}

export async function completeOnboarding(userId: number): Promise<void>{
    const {error} = await supabase.rpc('complete_user_onboarding', {p_id: userId, p_session_token: getSessionToken()});
    if (error) {
        throw error;
    }
}
