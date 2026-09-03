import {supabase} from '../lib/supabase';
import {getSessionToken} from './auth';
import type {Exercise, MonthlyWorkouts, WorkoutDay} from './progress';

const DIAS_SEMANA_POR_INDICE = [
    'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
    'Quinta-feira', 'Sexta-feira', 'Sábado',
];

function weekdayLabel(dateStr: string): string{
    const [year, month, day] = dateStr.split('-').map(Number);
    return DIAS_SEMANA_POR_INDICE[new Date(year, month - 1, day).getDay()];
}

function toUtcTimestamp(dateStr: string): string{
    return new Date(`${dateStr}T00:00:00.000Z`).toISOString();
}

interface TrainingProgressRow {
    training_progress_id: number;
    training_progress_created_at: string;
    training_id: number;
    nome_treino: string | null;
    exercice_progress_id: number | null;
    exercice_id: number | null;
    nome_exercicio: string | null;
    padrao_repeticao: string | null;
    tempo_descanso: string | null;
    carga_base: number | null;
    ex_descricao: string | null;
    series_id: number | null;
    numero_serie: number | null;
    repeticao: number | null;
    carga: number | null;
}

export async function fetchTrainingProgress(userId: number): Promise<MonthlyWorkouts>{
    const {data, error} = await supabase.rpc('get_training_progress', {p_user_id: userId, p_session_token: getSessionToken()});
    if (error) {
        throw error;
    }

    const days = new Map<number, WorkoutDay>();
    const exercises = new Map<number, Exercise>();

    for (const row of (data ?? []) as TrainingProgressRow[]) {
        const dateStr = row.training_progress_created_at.slice(0, 10);
        let day = days.get(row.training_progress_id);
        if (!day) {
            day = {
                id: String(row.training_progress_id),
                day: weekdayLabel(dateStr),
                date: dateStr,
                'training-focus': row.nome_treino ?? '',
                trainingId: row.training_id,
                exercises: {},
            };
            days.set(row.training_progress_id, day);
        }

        if (row.exercice_progress_id !== null) {
            let exercise = exercises.get(row.exercice_progress_id);
            if (!exercise) {
                exercise = {
                    name: row.nome_exercicio ?? '',
                    sets: 0,
                    repitions: row.padrao_repeticao ? `${row.padrao_repeticao} reps` : '',
                    rest: row.tempo_descanso ?? '',
                    description: row.ex_descricao ?? '',
                    exerciceId: row.exercice_id,
                    series: [],
                    historico: [],
                };
                exercises.set(row.exercice_progress_id, exercise);
                day.exercises[String(row.exercice_progress_id)] = exercise;
            }
            if (row.series_id !== null) {
                exercise.series.push(`Série ${row.numero_serie}: ${row.repeticao} reps com ${row.carga}kg`);
                exercise.sets = exercise.series.length;
            }
        }
    }

    const monthly: MonthlyWorkouts = {};
    for (const day of days.values()) {
        const key = day.date.slice(0, 7);
        (monthly[key] ??= []).push(day);
    }
    return monthly;
}

export async function saveTrainingProgress(
    userId: number,
    params: {id: number | null; trainingId: number; date: string},
): Promise<number>{
    const {data, error} = await supabase.rpc('save_training_progress', {
        p_user_id: userId,
        p_id: params.id,
        p_training_id: params.trainingId,
        p_created_at: toUtcTimestamp(params.date),
        p_session_token: getSessionToken(),
    });
    if (error) {
        throw error;
    }
    return data as number;
}

export async function deleteTrainingProgress(userId: number, id: number): Promise<void>{
    const {error} = await supabase.rpc('delete_training_progress', {p_user_id: userId, p_id: id, p_session_token: getSessionToken()});
    if (error) {
        throw error;
    }
}

export async function saveExerciceProgress(
    userId: number,
    params: {
        id: number | null;
        trainingsProgressId: number;
        exerciceId: number;
        padraoRepeticao: string;
        tempoDescanso: string;
        cargaBase: number;
        descricao: string;
        series: {reps: number; carga: number}[];
    },
): Promise<number>{
    const {data, error} = await supabase.rpc('save_exercice_progress', {
        p_user_id: userId,
        p_id: params.id,
        p_trainings_progress_id: params.trainingsProgressId,
        p_exercice_id: params.exerciceId,
        p_padrao_repeticao: params.padraoRepeticao,
        p_tempo_descanso: params.tempoDescanso,
        p_carga_base: params.cargaBase,
        p_descricao: params.descricao,
        p_session_token: getSessionToken(),
    });
    if (error) {
        throw error;
    }

    const exerciceProgressId = data as number;
    const {error: seriesError} = await supabase.rpc('set_exercice_progress_series', {
        p_user_id: userId,
        p_exercice_progress_id: exerciceProgressId,
        p_repeticoes: params.series.map(row => row.reps),
        p_cargas: params.series.map(row => row.carga),
        p_session_token: getSessionToken(),
    });
    if (seriesError) {
        throw seriesError;
    }

    return exerciceProgressId;
}

export async function deleteExerciceProgress(userId: number, id: number): Promise<void>{
    const {error} = await supabase.rpc('delete_exercice_progress', {p_user_id: userId, p_id: id, p_session_token: getSessionToken()});
    if (error) {
        throw error;
    }
}
