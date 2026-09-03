import {LitElement, html, css, nothing, TemplateResult, CSSResult} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import type {WorkoutDay} from '../models/progress';
import {formatDateBR} from '../models/dateFormat';
import './app-modal';
import './exercise-item';
import './ui-icon';

@customElement('workout-detail-modal')
export default class WorkoutDetailModal extends LitElement{

    @property({type: Boolean}) open = false;
    @property({type: Object}) day: WorkoutDay | null = null;

    static override get styles(): CSSResult{
        return css`
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

            .exercises {
                display: flex;
                flex-direction: column;
                gap: 10px;
                margin-top: 16px;
                max-height: 60vh;
                overflow-y: auto;
                padding-right: 2px;
            }

            .empty {
                text-align: center;
                padding: 24px 0;
                font-size: 12px;
                font-style: italic;
                color: #6E757E;
                margin: 16px 0 0;
            }
        `;
    }

    private close(): void{
        this.dispatchEvent(new CustomEvent('close', {bubbles: true, composed: true}));
    }

    protected override render(): TemplateResult{
        const day = this.day;
        const exerciseKeys = day ? Object.keys(day.exercises) : [];
        return html`
            <app-modal ?open=${this.open} size="lg" @close=${() => this.close()}>
                ${day ? html`
                    <div slot="title">
                        <div class="badge-row">
                            <span class="badge">${day.day}</span>
                            <span class="date"><ui-icon name="calendar" size="12"></ui-icon>${formatDateBR(day.date)}</span>
                        </div>
                        <h3>${day['training-focus']}</h3>
                    </div>
                    ${exerciseKeys.length > 0 ? html`
                        <div class="exercises">
                            ${exerciseKeys.map(key => html`
                                <exercise-item
                                    .exercise=${day.exercises[key]}
                                    .exerciseKey=${key}
                                    .dayId=${day.id}
                                    readonly
                                ></exercise-item>
                            `)}
                        </div>
                    ` : html`<p class="empty">Nenhum exercício adicionado neste dia.</p>`}
                ` : nothing}
            </app-modal>
        `;
    }

}

declare global{
    interface HTMLElementTagNameMap{
        'workout-detail-modal': WorkoutDetailModal
    }
}
