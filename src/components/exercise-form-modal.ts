import {LitElement, html, css, PropertyValues, TemplateResult, CSSResult} from 'lit';
import {customElement, property, query, state} from 'lit/decorators.js';
import type {Exercise} from '../models/progress';
import {getSessionUserId} from '../models/auth';
import {fetchWeeklySplit} from '../models/trainings';
import AcadMain from '../acad-main';
import './app-modal';
import './ui-icon';

interface SeriesRow {
    reps: number;
    carga: number;
}

export interface ExerciseFormSaveDetail {
    dayId: string;
    exerciseKey: string | null;
    exerciceId: number;
    name: string;
    sets: number;
    repitions: string;
    rest: string;
    description: string;
    series: string[];
    seriesRows: {reps: number; carga: number}[];
    cargasNumericas: number[];
}

const SERIES_PATTERN = /(\d+)\s*reps\s*com\s*([\d.]+)\s*kg/i;
const DEFAULT_CARGA = 50;

function stripRepsSuffix(value: string): string{
    return value.replace(/\s*reps\s*$/i, '').trim();
}

function parseSeries(series: string[]): SeriesRow[]{
    return series.map(entry => {
        const match = entry.match(SERIES_PATTERN);
        return {
            reps: match ? Number(match[1]) : 10,
            carga: match ? Number(match[2]) : DEFAULT_CARGA,
        };
    });
}

@customElement('exercise-form-modal')
export default class ExerciseFormModal extends LitElement{

    @property({type: Boolean}) open = false;
    @property({type: Object}) editingExercise: Exercise | null = null;
    @property({type: String}) editingKey: string | null = null;
    @property({type: String}) dayId: string | null = null;
    @property({type: Number}) trainingId: number | null = null;

    @state() private seriesRows: SeriesRow[] = [];
    @state() private exerciseOptions: {id: number; name: string}[] = [];
    @state() private exerciceId: number | null = null;

    @query('#ex-repitions') private repitionsInput!: HTMLInputElement;
    @query('#ex-rest') private restInput!: HTMLInputElement;
    @query('#ex-carga-base') private cargaBaseInput!: HTMLInputElement;
    @query('#ex-description') private descriptionInput!: HTMLTextAreaElement;

    static override get styles(): CSSResult{
        return css`
            form {
                display: flex;
                flex-direction: column;
                gap: 16px;
            }

            label {
                display: block;
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.02em;
                color: #8A9099;
                margin-bottom: 4px;
            }

            input,
            textarea,
            select {
                width: 100%;
                background: #1B1E22;
                border: 1px solid #33383F;
                border-radius: 12px;
                padding: 10px 12px;
                color: #ECEAE3;
                font: inherit;
                box-sizing: border-box;
            }

            input:focus,
            textarea:focus,
            select:focus {
                outline: none;
                border-color: #E8354F;
            }

            textarea {
                resize: vertical;
                min-height: 60px;
            }

            .field-hint {
                margin: 6px 0 0;
                font-size: 11px;
                color: #6E757E;
            }

            .field-hint a {
                color: #E8354F;
                font-weight: 600;
            }

            .row {
                display: grid;
                grid-template-columns: 1fr;
                gap: 12px;
            }

            @media (min-width: 480px) {
                .row {
                    grid-template-columns: 1fr 1fr;
                }
            }

            .series-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 8px;
                margin-bottom: 8px;
            }

            .series-header label {
                margin-bottom: 0;
            }

            .series-count {
                font-size: 11px;
                font-weight: 600;
                color: #6E757E;
            }

            .series-list {
                display: flex;
                flex-direction: column;
                gap: 8px;
                max-height: 200px;
                overflow-y: auto;
                padding-right: 4px;
            }

            .empty-series {
                text-align: center;
                padding: 16px 0;
                font-size: 12px;
                font-style: italic;
                color: #6E757E;
            }

            .series-row {
                display: grid;
                grid-template-columns: 40px 1fr 1fr 28px;
                align-items: center;
                gap: 6px;
                background: #1B1E22;
                border: 1px solid #33383F;
                border-radius: 12px;
                padding: 8px;
            }

            @media (min-width: 480px) {
                .series-row {
                    grid-template-columns: 64px 1fr 1fr 28px;
                    gap: 8px;
                    padding: 8px 10px;
                }
            }

            .series-row span {
                font-size: 11px;
                font-weight: 600;
                color: #ECEAE3;
                line-height: 1.2;
            }

            @media (min-width: 480px) {
                .series-row span {
                    font-size: 12px;
                }
            }

            .field-inline {
                display: flex;
                align-items: center;
                gap: 6px;
            }

            .field-inline input {
                text-align: center;
                padding: 6px 8px;
            }

            .field-inline small {
                font-size: 10px;
                color: #6E757E;
            }

            .reps-field {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .reps-field input {
                flex: 1;
            }

            .reps-field span {
                flex-shrink: 0;
                font-size: 13px;
                color: #6E757E;
            }

            .remove-row {
                display: flex;
                align-items: center;
                justify-content: center;
                background: none;
                border: none;
                color: #8A9099;
                padding: 6px;
                border-radius: 8px;
                cursor: pointer;
            }

            .remove-row:hover {
                background: rgba(239, 68, 68, 0.1);
                color: #f87171;
            }

            .add-row {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                width: 100%;
                margin-top: 8px;
                background: rgba(200, 16, 46, 0.1);
                border: 1px dashed rgba(200, 16, 46, 0.4);
                color: #E8354F;
                padding: 8px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                font-family: inherit;
            }

            .add-row:hover {
                background: rgba(200, 16, 46, 0.18);
            }

            .actions {
                display: flex;
                gap: 12px;
                padding-top: 8px;
            }

            .actions button {
                flex: 1;
                border-radius: 12px;
                padding: 10px 0;
                font-size: 13px;
                font-weight: 600;
                border: none;
                cursor: pointer;
                font-family: inherit;
            }

            .cancel {
                background: #33383F;
                color: #ECEAE3;
            }

            .cancel:hover {
                background: #4E555D;
            }

            .save {
                background: #C8102E;
                color: #fff;
            }

            .save:hover {
                background: #E8354F;
            }

            .save:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            h3 {
                margin: 0;
                font-size: 16px;
                font-weight: 700;
                color: #fff;
            }
        `;
    }

    protected override updated(changed: PropertyValues): void{
        if (changed.has('open') && this.open) {
            this.resetForm();
        }
    }

    private resetForm(): void{
        const editing = this.editingExercise;
        this.exerciceId = editing?.exerciceId ?? null;
        this.repitionsInput.value = editing ? stripRepsSuffix(editing.repitions) : '8-10';
        this.restInput.value = editing?.rest ?? '90s';
        this.descriptionInput.value = editing?.description ?? '';
        this.cargaBaseInput.value = String(DEFAULT_CARGA);
        this.seriesRows = editing?.series
            ? parseSeries(editing.series)
            : this.buildDefaultRows(1, DEFAULT_CARGA);
        void this.loadExerciseOptions();
    }

    private async loadExerciseOptions(): Promise<void>{
        const userId = getSessionUserId();
        if (userId === null || this.trainingId === null) {
            this.exerciseOptions = [];
            return;
        }
        AcadMain.instance?.showLoading();
        try {
            const split = await fetchWeeklySplit(userId);
            const card = Object.values(split).flat().find(entry => entry.id === this.trainingId);
            const options: {id: number; name: string}[] = [];
            for (const item of card?.items ?? []) {
                if (item.id) {
                    options.push({id: item.id, name: item.name});
                }
            }
            this.exerciseOptions = options.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
        } catch {
            this.exerciseOptions = [];
        } finally {
            AcadMain.instance?.hideLoading();
        }
    }

    private buildDefaultRows(count: number, carga: number): SeriesRow[]{
        return Array.from({length: count}, () => ({reps: 10, carga}));
    }

    private addSeriesRow(): void{
        const cargaBase = Number(this.cargaBaseInput.value) || DEFAULT_CARGA;
        const last = this.seriesRows[this.seriesRows.length - 1];
        this.seriesRows = [...this.seriesRows, {reps: last?.reps ?? 10, carga: last?.carga ?? cargaBase}];
    }

    private removeSeriesRow(index: number): void{
        this.seriesRows = this.seriesRows.filter((_, i) => i !== index);
    }

    private handleCargaBaseChange(): void{
        const carga = Number(this.cargaBaseInput.value) || 0;
        this.seriesRows = this.seriesRows.map(row => ({...row, carga}));
    }

    private updateRow(index: number, field: keyof SeriesRow, value: number): void{
        this.seriesRows = this.seriesRows.map((row, i) => i === index ? {...row, [field]: value} : row);
    }

    private close(): void{
        this.dispatchEvent(new CustomEvent('close', {bubbles: true, composed: true}));
    }

    private submit(event: Event): void{
        event.preventDefault();
        if (!this.dayId || this.exerciceId === null || this.seriesRows.length === 0) {
            return;
        }
        const name = this.exerciseOptions.find(option => option.id === this.exerciceId)?.name ?? '';
        const series = this.seriesRows.map((row, i) => `Série ${i + 1}: ${row.reps} reps com ${row.carga}kg`);
        const cargasNumericas = this.seriesRows.map(row => row.carga);
        const detail: ExerciseFormSaveDetail = {
            dayId: this.dayId,
            exerciseKey: this.editingKey,
            exerciceId: this.exerciceId,
            name,
            sets: this.seriesRows.length,
            repitions: `${this.repitionsInput.value.trim()} reps`,
            rest: this.restInput.value,
            description: this.descriptionInput.value,
            series,
            seriesRows: this.seriesRows.map(row => ({reps: row.reps, carga: row.carga})),
            cargasNumericas,
        };
        this.dispatchEvent(new CustomEvent<ExerciseFormSaveDetail>('save', {detail, bubbles: true, composed: true}));
    }

    protected override render(): TemplateResult{
        return html`
            <app-modal ?open=${this.open} size="lg" @close=${() => this.close()}>
                <h3 slot="title">${this.editingKey ? 'Editar Exercício' : 'Adicionar Exercício'}</h3>
                <form @submit=${(event: Event) => this.submit(event)}>
                    <div>
                        <label for="ex-name">Nome do Exercício</label>
                        ${this.exerciseOptions.length > 0 ? html`
                            <select
                                id="ex-name"
                                required
                                .value=${this.exerciceId !== null ? String(this.exerciceId) : ''}
                                @change=${(event: Event) => (this.exerciceId = Number((event.target as HTMLSelectElement).value))}
                            >
                                <option value="" disabled ?selected=${this.exerciceId === null}>Selecione um exercício</option>
                                ${this.exerciseOptions.map(option => html`
                                    <option value=${option.id} ?selected=${option.id === this.exerciceId}>${option.name}</option>
                                `)}
                            </select>
                        ` : html`
                            <p class="field-hint">
                                Nenhum exercício cadastrado para este treino. Cadastre em
                                <a href="/divisao-semanal">Divisão Semanal</a> primeiro.
                            </p>
                        `}
                    </div>
                    <div>
                        <label for="ex-repitions">Padrão de Repetições</label>
                        <div class="reps-field">
                            <input id="ex-repitions" type="text" required autocomplete="off" placeholder="Ex: 8-10">
                            <span>reps</span>
                        </div>
                    </div>
                    <div>
                        <div class="series-header">
                            <label>Séries (Reps e Carga)</label>
                            <span class="series-count">${this.seriesRows.length} série${this.seriesRows.length === 1 ? '' : 's'}</span>
                        </div>
                        <div class="series-list">
                            ${this.seriesRows.length === 0 ? html`
                                <p class="empty-series">Nenhuma série adicionada ainda.</p>
                            ` : this.seriesRows.map((row, index) => html`
                                <div class="series-row">
                                    <span>Série ${index + 1}:</span>
                                    <div class="field-inline">
                                        <input
                                            type="number" min="1" autocomplete="off" .value=${String(row.reps)}
                                            @input=${(event: Event) => this.updateRow(index, 'reps', Number((event.target as HTMLInputElement).value))}
                                        >
                                        <small>reps</small>
                                    </div>
                                    <div class="field-inline">
                                        <input
                                            type="number" step="0.5" min="0" autocomplete="off" .value=${String(row.carga)}
                                            @input=${(event: Event) => this.updateRow(index, 'carga', Number((event.target as HTMLInputElement).value))}
                                        >
                                        <small>kg</small>
                                    </div>
                                    <button
                                        class="remove-row" type="button" title="Remover série"
                                        @click=${() => this.removeSeriesRow(index)}
                                    >
                                        <ui-icon name="trash" size="14"></ui-icon>
                                    </button>
                                </div>
                            `)}
                        </div>
                        <button class="add-row" type="button" @click=${() => this.addSeriesRow()}>
                            <ui-icon name="plus" size="14"></ui-icon>
                            <span>Adicionar Série</span>
                        </button>
                    </div>
                    <div class="row">
                        <div>
                            <label for="ex-rest">Tempo de Descanso</label>
                            <input id="ex-rest" type="text" required autocomplete="off" placeholder="Ex: 90s">
                        </div>
                        <div>
                            <label for="ex-carga-base">Carga Base / Principal (kg)</label>
                            <input id="ex-carga-base" type="number" step="0.5" min="0" required autocomplete="off" @input=${() => this.handleCargaBaseChange()}>
                        </div>
                    </div>
                    <div>
                        <label for="ex-description">Descrição / Observações</label>
                        <textarea id="ex-description" rows="2" placeholder="Ex: Agachamento com barra, mantendo a postura correta..."></textarea>
                    </div>
                    <div class="actions">
                        <button type="button" class="cancel" @click=${() => this.close()}>Cancelar</button>
                        <button type="submit" class="save" ?disabled=${this.seriesRows.length === 0 || this.exerciseOptions.length === 0}>Salvar</button>
                    </div>
                </form>
            </app-modal>
        `;
    }

}

declare global{
    interface HTMLElementTagNameMap{
        'exercise-form-modal': ExerciseFormModal
    }
}
