export interface ExerciseHistoryEntry {
    data: string;
    carga: number;
    seriesDet: string[];
}

export interface Exercise {
    name: string;
    sets: number;
    repitions: string;
    rest: string;
    description: string;
    series: string[];
    exerciceId?: number | null;
    historico?: ExerciseHistoryEntry[];
}

export type ExercisesMap = Record<string, Exercise>;

export interface WorkoutDay {
    id: string;
    day: string;
    date: string;
    'training-focus': string;
    trainingId?: number | null;
    exercises: ExercisesMap;
}

export type MonthlyWorkouts = Record<string, WorkoutDay[]>;
