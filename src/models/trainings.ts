import {supabase} from '../lib/supabase';
import {getSessionToken} from './auth';
import {createEmptySplit, type SplitCard, type SplitExercise, type Weekday, type WeeklySplit} from './split';

interface WeeklySplitRow {
    training_id: number;
    nome_treino: string | null;
    descricao: string | null;
    dia_semana: string | null;
    exercice_id: number | null;
    nome_exercicio: string | null;
    exercicio_descricao: string | null;
}

export async function fetchWeeklySplit(userId: number): Promise<WeeklySplit>{
    const {data, error} = await supabase.rpc('get_weekly_split', {p_user_id: userId, p_session_token: getSessionToken()});
    if (error) {
        throw error;
    }

    const split = createEmptySplit();
    const cardsById = new Map<number, SplitCard>();

    for (const row of (data ?? []) as WeeklySplitRow[]) {
        const weekday = row.dia_semana as Weekday | null;
        if (!weekday) {
            continue;
        }

        let card = cardsById.get(row.training_id);
        if (!card) {
            card = {id: row.training_id, title: row.nome_treino ?? '', items: []};
            cardsById.set(row.training_id, card);
            split[weekday].push(card);
        }

        if (row.exercice_id !== null) {
            card.items.push({
                id: row.exercice_id,
                name: row.nome_exercicio ?? '',
                description: row.exercicio_descricao ?? undefined,
            });
        }
    }

    return split;
}

export async function saveTraining(
    userId: number,
    params: {trainingId: number | null; title: string; weekday: Weekday; items: SplitExercise[]},
): Promise<SplitCard>{
    const {data: trainingId, error: trainingError} = await supabase.rpc('save_training', {
        p_user_id: userId,
        p_training_id: params.trainingId,
        p_nome_treino: params.title,
        p_descricao: null,
        p_dia_semana: params.weekday,
        p_session_token: getSessionToken(),
    });
    if (trainingError) {
        throw trainingError;
    }

    const exerciceIds: number[] = [];
    const savedItems: SplitExercise[] = [];
    for (const item of params.items) {
        const {data: exerciceId, error: exerciceError} = await supabase.rpc('save_exercice', {
            p_user_id: userId,
            p_exercice_id: item.id ?? null,
            p_nome_exercicio: item.name,
            p_descricao: item.description ?? null,
            p_session_token: getSessionToken(),
        });
        if (exerciceError) {
            throw exerciceError;
        }
        exerciceIds.push(exerciceId as number);
        savedItems.push({...item, id: exerciceId as number});
    }

    const {error: linkError} = await supabase.rpc('set_training_exercices', {
        p_user_id: userId,
        p_training_id: trainingId,
        p_exercice_ids: exerciceIds,
        p_session_token: getSessionToken(),
    });
    if (linkError) {
        throw linkError;
    }

    return {id: trainingId as number, title: params.title, items: savedItems};
}

export async function deleteTraining(userId: number, trainingId: number): Promise<void>{
    const {error} = await supabase.rpc('delete_training', {p_user_id: userId, p_training_id: trainingId, p_session_token: getSessionToken()});
    if (error) {
        throw error;
    }
}

export async function moveTraining(userId: number, trainingId: number, weekday: Weekday): Promise<void>{
    const {error} = await supabase.rpc('move_training', {p_user_id: userId, p_training_id: trainingId, p_dia_semana: weekday, p_session_token: getSessionToken()});
    if (error) {
        throw error;
    }
}
