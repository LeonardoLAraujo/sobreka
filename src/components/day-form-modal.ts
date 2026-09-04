import {LitElement, html, css, nothing, PropertyValues, TemplateResult, CSSResult} from 'lit';
import {customElement, property, query, state} from 'lit/decorators.js';
import type {WorkoutDay} from '../models/progress';
import {getSessionUserId} from '../models/auth';
import {fetchWeeklySplit} from '../models/trainings';
import AcadMain from '../acad-main';
import './app-modal';

const DIAS_SEMANA_POR_INDICE = [
    'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
    'Quinta-feira', 'Sexta-feira', 'Sábado',
];

function getWeekdayName(dateStr: string): string{
    if (!dateStr) {
        return '';
    }
    const [year, month, day] = dateStr.split('-').map(Number);
    return DIAS_SEMANA_POR_INDICE[new Date(year, month - 1, day).getDay()];
}

function todayLocalDateString(): string{
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${now.getFullYear()}-${month}-${day}`;
}

export interface DayFormSaveDetail {
    id: string | null;
    day: string;
    date: string;
    trainingId: number;
    trainingFocus: string;
}

@customElement('day-form-modal')
export default class DayFormModal extends LitElement{

    @property({type: Boolean}) open = false;
    @property({type: Object}) editingDay: WorkoutDay | null = null;

    @state() private computedDay = '';
    @state() private trainingId: number | null = null;
    @state() private trainingOptions: {id: number; title: string}[] = [];

    @query('#date-input') private dateInput!: HTMLInputElement;

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

            select,
            input {
                width: 100%;
                background: #1B1E22;
                border: 1px solid #33383F;
                border-radius: 12px;
                padding: 10px 12px;
                color: #ECEAE3;
                font: inherit;
                box-sizing: border-box;
            }

            select:focus,
            input:focus {
                outline: none;
                border-color: #E8354F;
            }

            .computed-day {
                margin: 6px 0 0;
                font-size: 12px;
                font-weight: 600;
                color: #E8354F;
            }

            .field-hint {
                margin: 0;
                font-size: 12px;
                color: #8A9099;
                line-height: 1.5;
            }

            .field-hint a {
                color: #E8354F;
                font-weight: 600;
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

            .save:hover:not(:disabled) {
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
        const editing = this.editingDay;
        this.dateInput.value = editing?.date ?? todayLocalDateString();
        this.trainingId = editing?.trainingId ?? null;
        this.updateComputedDay();
        void this.loadTrainingOptions();
    }

    private async loadTrainingOptions(): Promise<void>{
        const userId = getSessionUserId();
        if (userId === null) {
            this.trainingOptions = [];
            return;
        }
        AcadMain.instance?.showLoading();
        try {
            const split = await fetchWeeklySplit(userId);
            const seenNames = new Set<string>();
            const options: {id: number; title: string}[] = [];
            for (const cards of Object.values(split)) {
                for (const card of cards) {
                    const title = card.title.replace(/\s*\(cópia\)\s*$/i, '').trim();
                    const key = title.toLowerCase();
                    if (seenNames.has(key)) {
                        continue;
                    }
                    seenNames.add(key);
                    options.push({id: card.id, title});
                }
            }
            this.trainingOptions = options.sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));
        } catch {
            this.trainingOptions = [];
        } finally {
            AcadMain.instance?.hideLoading();
        }
    }

    private updateComputedDay(): void{
        this.computedDay = getWeekdayName(this.dateInput.value);
    }

    private close(): void{
        this.dispatchEvent(new CustomEvent('close', {bubbles: true, composed: true}));
    }

    private submit(event: Event): void{
        event.preventDefault();
        if (this.trainingId === null) {
            return;
        }
        const trainingFocus = this.trainingOptions.find(option => option.id === this.trainingId)?.title ?? '';
        this.dispatchEvent(new CustomEvent<DayFormSaveDetail>('save', {
            detail: {
                id: this.editingDay?.id ?? null,
                day: this.computedDay,
                date: this.dateInput.value,
                trainingId: this.trainingId,
                trainingFocus,
            },
            bubbles: true,
            composed: true,
        }));
    }

    protected override render(): TemplateResult{
        const editing = this.editingDay;
        return html`
            <app-modal ?open=${this.open} @close=${() => this.close()}>
                <h3 slot="title">${editing ? 'Editar Treino' : 'Adicionar Novo Treino / Dia'}</h3>
                <form @submit=${(event: Event) => this.submit(event)}>
                    <div>
                        <label for="date-input">Data</label>
                        <input id="date-input" type="date" required autocomplete="off" @input=${() => this.updateComputedDay()}>
                        ${this.computedDay ? html`<p class="computed-day">${this.computedDay}</p>` : nothing}
                    </div>
                    <div>
                        <label for="focus-field">Nome do Treino</label>
                        ${this.trainingOptions.length > 0 ? html`
                            <select
                                id="focus-field"
                                required
                                .value=${this.trainingId !== null ? String(this.trainingId) : ''}
                                @change=${(event: Event) => (this.trainingId = Number((event.target as HTMLSelectElement).value))}
                            >
                                <option value="" disabled ?selected=${this.trainingId === null}>Selecione um treino</option>
                                ${this.trainingOptions.map(option => html`
                                    <option value=${option.id} ?selected=${option.id === this.trainingId}>${option.title}</option>
                                `)}
                            </select>
                        ` : html`
                            <p class="field-hint">
                                Nenhum treino cadastrado ainda. Crie um na
                                <a href="/divisao-semanal">Divisão Semanal</a> primeiro.
                            </p>
                        `}
                    </div>
                    <div class="actions">
                        <button type="button" class="cancel" @click=${() => this.close()}>Cancelar</button>
                        <button type="submit" class="save" ?disabled=${this.trainingOptions.length === 0}>Salvar</button>
                    </div>
                </form>
            </app-modal>
        `;
    }

}

declare global{
    interface HTMLElementTagNameMap{
        'day-form-modal': DayFormModal
    }
}
