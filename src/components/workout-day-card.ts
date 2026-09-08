import {LitElement, html, css, nothing, TemplateResult, CSSResult} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import type {WorkoutDay} from '../models/progress';
import {formatDateBR} from '../models/dateFormat';
import './exercise-item';
import './ui-icon';

export interface DayActionDetail {
    dayId: string;
}

@customElement('workout-day-card')
export default class WorkoutDayCard extends LitElement{

    @property({type: Object}) day!: WorkoutDay;
    @property({type: Boolean}) readonly = false;

    @state() private expanded = false;

    static override get styles(): CSSResult{
        return css`
            :host {
                display: block;
                align-self: start;
            }

            .card {
                background: #23262B;
                border: 1px solid rgba(51, 56, 63, 0.8);
                border-radius: 16px;
                padding: 16px;
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                height: 100%;
                box-sizing: border-box;
                cursor: pointer;
            }

            @media (min-width: 480px) {
                .card {
                    padding: 20px;
                }
            }

            .top {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 16px;
                gap: 8px;
            }

            .badge-row {
                display: flex;
                align-items: center;
                gap: 8px;
                flex-wrap: wrap;
            }

            .badge {
                background: rgba(200, 16, 46, 0.1);
                color: #E8354F;
                border: 1px solid rgba(200, 16, 46, 0.2);
                font-size: 12px;
                font-weight: 600;
                padding: 4px 10px;
                border-radius: 8px;
            }

            .date {
                display: inline-flex;
                align-items: center;
                gap: 4px;
                font-size: 12px;
                color: #8A9099;
            }

            h3 {
                margin: 6px 0 0;
                font-size: 18px;
                font-weight: 700;
                color: #fff;
            }

            .top-actions {
                display: flex;
                align-items: center;
                gap: 2px;
                flex-shrink: 0;
            }

            .top-actions button {
                background: none;
                border: none;
                color: #8A9099;
                padding: 8px;
                border-radius: 8px;
                cursor: pointer;
                display: flex;
            }

            .top-actions button:hover {
                background: #33383F;
                color: #ECEAE3;
            }

            .top-actions button.delete:hover {
                color: #f87171;
            }

            .toggle-icon {
                display: flex;
                transition: transform 0.15s ease;
            }

            .toggle-icon.expanded {
                transform: rotate(90deg);
            }

            .exercises {
                display: flex;
                flex-direction: column;
                gap: 10px;
                margin-bottom: 16px;
            }

            .empty {
                text-align: center;
                padding: 24px 0;
                font-size: 12px;
                font-style: italic;
                color: #6E757E;
                margin: 0;
            }

            .summary {
                font-size: 12px;
                color: #6E757E;
                margin: 0 0 4px;
            }

            .add-exercise {
                width: 100%;
                background: rgba(51, 56, 63, 0.6);
                border: 1px solid rgba(51, 65, 85, 0.6);
                color: #ECEAE3;
                padding: 10px 0;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                font-family: inherit;
            }

            .add-exercise:hover {
                background: #33383F;
            }
        `;
    }

    private emit(name: string): void{
        this.dispatchEvent(new CustomEvent<DayActionDetail>(name, {
            detail: {dayId: this.day.id},
            bubbles: true,
            composed: true,
        }));
    }

    private handleCardClick(event: MouseEvent): void{
        const target = event.target as HTMLElement;
        if (target.closest('.top-actions') || target.closest('.add-exercise') || target.tagName === 'EXERCISE-ITEM') {
            return;
        }
        this.emit('view-day');
    }

    protected override render(): TemplateResult{
        const day = this.day;
        const exerciseKeys = Object.keys(day.exercises);
        return html`
            <div class="card" @click=${(event: MouseEvent) => this.handleCardClick(event)}>
                <div>
                    <div class="top">
                        <div>
                            <div class="badge-row">
                                <span class="badge">${day.day}</span>
                                <span class="date"><ui-icon name="calendar" size="12"></ui-icon>${formatDateBR(day.date)}</span>
                            </div>
                            <h3>${day['training-focus']}</h3>
                        </div>
                        <div class="top-actions">
                            <button
                                type="button"
                                title=${this.expanded ? 'Recolher' : 'Expandir'}
                                @click=${() => (this.expanded = !this.expanded)}
                            >
                                <ui-icon class="toggle-icon ${this.expanded ? 'expanded' : ''}" name="chevron-right" size="13"></ui-icon>
                            </button>
                            ${this.readonly ? nothing : html`
                                <button type="button" title="Editar Treino" @click=${() => this.emit('edit-day')}>
                                    <ui-icon name="edit" size="13"></ui-icon>
                                </button>
                                <button class="delete" type="button" title="Excluir Treino" @click=${() => this.emit('delete-day')}>
                                    <ui-icon name="trash" size="13"></ui-icon>
                                </button>
                            `}
                        </div>
                    </div>
                    ${this.expanded ? html`
                        <div class="exercises">
                            ${exerciseKeys.length > 0 ? exerciseKeys.map(key => html`
                                <exercise-item
                                    .exercise=${day.exercises[key]}
                                    .exerciseKey=${key}
                                    .dayId=${day.id}
                                    ?readonly=${this.readonly}
                                ></exercise-item>
                            `) : html`<p class="empty">Nenhum exercício adicionado neste dia.</p>`}
                        </div>
                    ` : html`
                        <p class="summary">${exerciseKeys.length} exercício${exerciseKeys.length === 1 ? '' : 's'} cadastrado${exerciseKeys.length === 1 ? '' : 's'}</p>
                    `}
                </div>
                ${this.expanded && !this.readonly ? html`
                    <button class="add-exercise" type="button" @click=${() => this.emit('add-exercise')}>
                        <ui-icon name="plus" size="14"></ui-icon>
                        <span>Adicionar Exercício</span>
                    </button>
                ` : nothing}
            </div>
        `;
    }

}

declare global{
    interface HTMLElementTagNameMap{
        'workout-day-card': WorkoutDayCard
    }
}
