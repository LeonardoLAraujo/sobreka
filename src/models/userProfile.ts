import {supabase} from '../lib/supabase';
import {getSessionToken, type UserRecord} from './auth';

function firstRow(data: UserRecord[] | UserRecord | null): UserRecord | null{
    if (!data) {
        return null;
    }
    return Array.isArray(data) ? (data[0] ?? null) : data;
}

export async function getUserById(id: number): Promise<UserRecord | null>{
    const {data, error} = await supabase.rpc('get_user_by_id', {p_id: id, p_session_token: getSessionToken()});
    if (error) {
        throw error;
    }
    return firstRow(data);
}

export async function updateUserProfile(id: number, fields: {name?: string; avatar_photo?: string}): Promise<UserRecord | null>{
    const {data, error} = await supabase.rpc('update_user_profile', {
        p_id: id,
        p_name: fields.name ?? null,
        p_avatar_photo: fields.avatar_photo ?? null,
        p_session_token: getSessionToken(),
    });
    if (error) {
        throw error;
    }
    return firstRow(data);
}
