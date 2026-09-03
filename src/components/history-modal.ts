import {LitElement, html, css, TemplateResult, CSSResult} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import type {ExerciseHistoryEntry} from '../models/progress';
import './app-modal';
import './ui-icon';

@customElement('history-modal')
export default class HistoryModal extends LitElement{

    @property({type: Boolean}) open = false;
    @property({type: String}) exerciseName = '';
    @property({type: String}) subtitle = '';
    @property({type: Array}) history: ExerciseHistoryEntry[] = [];

    static override get styles(): CSSResult{
        return css`
            .list {
                display: flex;
                flex-direction: column;
                gap: 12px;
                max-height: 280px;
                overflow-y: auto;
                padding-right: 4px;
            }

            .entry {
                background: #1B1E22;
                border: 1px solid #33383F;
                border-radius: 12px;
                padding: 12px;
            }

            .entry-head {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 8px;
            }

            .date {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 12px;
                color: #8A9099;
            }

            .average {
                font-size: 12px;
                font-weight: 700;
                color: #E8354F;
                white-space: nowrap;
            }

            .series-chips {
                display: flex;
                flex-wrap: wrap;
                gap: 4px;
                margin-top: 8px;
            }

            .chip {
                background: #23262B;
                border: 1px solid #33383F;
                color: #ECEAE3;
                padding: 3px 8px;
                border-radius: 6px;
                font-size: 10px;
            }

            .empty {
                text-align: center;
                padding: 16px 0;
                font-size: 12px;
                color: #6E757E;
                font-style: italic;
                margin: 0;
            }

            .footer {
                margin-top: 20px;
                padding-top: 16px;
                border-top: 1px solid #33383F;
                display: flex;
                justify-content: flex-end;
            }

            .footer button {
                background: #33383F;
                color: #ECEAE3;
                border: none;
                border-radius: 12px;
                padding: 8px 16px;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
                font-family: inherit;
            }

            .footer button:hover {
                background: #4E555D;
            }

            h3 {
                margin: 0;
                font-size: 16px;
                font-weight: 700;
                color: #fff;
            }

            p {
                margin: 2px 0 0;
                font-size: 12px;
                color: #6E757E;
            }
        `;
    }

    private close(): void{
        this.dispatchEvent(new CustomEvent('close', {bubbles: true, composed: true}));
    }

    protected override render(): TemplateResult{
        const entries = [...this.history].reverse();
        return html`
            <app-modal ?open=${this.open} @close=${() => this.close()}>
                <div slot="title">
                    <h3>${this.exerciseName}</h3>
                    <p>${this.subtitle}</p>
                </div>
                ${entries.length > 0 ? html`
                    <div class="list">
                        ${entries.map(entry => html`
                            <div class="entry">
                                <div class="entry-head">
                                    <span class="date"><ui-icon name="calendar" size="12"></ui-icon>${entry.data}</span>
                                    <span class="average">Média: ${entry.carga} kg</span>
                                </div>
                                <div class="series-chips">
                                    ${entry.seriesDet.map(item => html`<span class="chip">${item}</span>`)}
                                </div>
                            </div>
                        `)}
                    </div>
                ` : html`<p class="empty">Nenhum histórico registrado.</p>`}
                <div class="footer">
                    <button type="button" @click=${() => this.close()}>Fechar</button>
                </div>
            </app-modal>
        `;
    }

}

declare global{
    interface HTMLElementTagNameMap{
        'history-modal': HistoryModal
    }
}
