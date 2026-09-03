import {LitElement, html, css, nothing, TemplateResult, CSSResult} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import type {Exercise} from '../models/progress';
import './ui-icon';

export interface ExerciseActionDetail {
    dayId: string;
    exerciseKey: string;
}

@customElement('exercise-item')
export default class ExerciseItem extends LitElement{

    @property({type: Object}) exercise!: Exercise;
    @property({type: String}) exerciseKey = '';
    @property({type: String}) dayId = '';
    @property({type: Boolean}) readonly = false;

    static override get styles(): CSSResult{
        return css`
            :host {
                display: block;
            }

            .card {
                background: rgba(27, 30, 34, 0.6);
                border: 1px solid rgba(51, 56, 63, 0.6);
                border-radius: 12px;
                padding: 14px;
            }

            .card:hover {
                border-color: #4E555D;
            }

            .head {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: 8px;
            }

            h4 {
                margin: 0;
                color: #fff;
                font-size: 14px;
                font-weight: 600;
            }

            .meta {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                gap: 4px 12px;
                margin-top: 4px;
                font-size: 12px;
                color: #8A9099;
            }

            .meta span {
                display: inline-flex;
                align-items: center;
                gap: 4px;
            }

            .description {
                width: 100%;
                margin-top: 4px;
                font-size: 12px;
                font-style: italic;
                color: #6E757E;
            }

            .actions {
                display: flex;
                align-items: center;
                gap: 2px;
                flex-shrink: 0;
            }

            .actions button {
                background: none;
                border: none;
                color: #8A9099;
                padding: 8px;
                border-radius: 8px;
                cursor: pointer;
                display: flex;
            }

            .actions button:hover {
                background: #33383F;
                color: #ECEAE3;
            }

            .actions button.history:hover {
                color: #E8354F;
            }

            .actions button.delete:hover {
                color: #f87171;
            }

            .series {
                display: flex;
                flex-wrap: wrap;
                gap: 4px;
                margin-top: 10px;
            }

            .chip {
                background: #23262B;
                border: 1px solid #33383F;
                color: #ECEAE3;
                padding: 3px 8px;
                border-radius: 6px;
                font-size: 11px;
                font-weight: 600;
            }
        `;
    }

    private emit(name: string): void{
        this.dispatchEvent(new CustomEvent<ExerciseActionDetail>(name, {
            detail: {dayId: this.dayId, exerciseKey: this.exerciseKey},
            bubbles: true,
            composed: true,
        }));
    }

    protected override render(): TemplateResult{
        const exercise = this.exercise;
        return html`
            <div class="card">
                <div class="head">
                    <div>
                        <h4>${exercise.name}</h4>
                        <div class="meta">
                            <span><ui-icon name="layers" size="12"></ui-icon>${exercise.sets} séries</span>
                            <span><ui-icon name="repeat" size="12"></ui-icon>${exercise.repitions}</span>
                            <span><ui-icon name="timer" size="12"></ui-icon>Descanso: ${exercise.rest}</span>
                            ${exercise.description ? html`
                                <span class="description">
                                    <ui-icon name="note" size="12"></ui-icon> ${exercise.description}
                                </span>
                            ` : nothing}
                        </div>
                    </div>
                    ${this.readonly ? nothing : html`
                        <div class="actions">
                            <button class="history" type="button" title="Histórico" @click=${() => this.emit('view-history')}>
                                <ui-icon name="chart" size="13"></ui-icon>
                            </button>
                            <button type="button" title="Editar" @click=${() => this.emit('edit-exercise')}>
                                <ui-icon name="edit" size="13"></ui-icon>
                            </button>
                            <button class="delete" type="button" title="Excluir" @click=${() => this.emit('delete-exercise')}>
                                <ui-icon name="trash" size="13"></ui-icon>
                            </button>
                        </div>
                    `}
                </div>
                <div class="series">
                    ${exercise.series.map(item => html`<span class="chip">${item}</span>`)}
                </div>
            </div>
        `;
    }

}

declare global{
    interface HTMLElementTagNameMap{
        'exercise-item': ExerciseItem
    }
}
