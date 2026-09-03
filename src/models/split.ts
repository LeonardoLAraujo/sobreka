export type Weekday = 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom';

export interface SplitExercise {
    id?: number;
    name: string;
    description?: string;
}

export interface SplitCard {
    id: number;
    title: string;
    items: SplitExercise[];
}

export type WeeklySplit = Record<Weekday, SplitCard | null>;

export const WEEKDAY_ORDER: Weekday[] = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];

export const WEEKDAY_LABELS: Record<Weekday, string> = {
    seg: 'Seg',
    ter: 'Ter',
    qua: 'Qua',
    qui: 'Qui',
    sex: 'Sex',
    sab: 'Sáb',
    dom: 'Dom',
};

export function createEmptySplit(): WeeklySplit{
    return {seg: null, ter: null, qua: null, qui: null, sex: null, sab: null, dom: null};
}
