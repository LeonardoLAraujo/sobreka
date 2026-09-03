import {LitElement, html, css, TemplateResult, CSSResult} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {MONTH_NAMES} from '../models/constants';
import './ui-icon';

@customElement('workout-header')
export default class WorkoutHeader extends LitElement{

    @property({type: Number}) month = 0;
    @property({type: Number}) year = new Date().getFullYear();

    static override get styles(): CSSResult{
        return css`
            :host {
                display: block;
                background: #23262B;
                border-bottom: 1px solid #33383F;
            }

            .bar {
                max-width: 960px;
                margin: 0 auto;
                padding: 12px 16px;
                display: flex;
                flex-direction: column;
                align-items: stretch;
                gap: 12px;
                box-sizing: border-box;
            }

            .month-selector {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 8px;
                background: #1B1E22;
                border: 1px solid #33383F;
                border-radius: 12px;
                padding: 6px 12px;
                width: 100%;
                box-sizing: border-box;
            }

            .month-selector button {
                background: none;
                border: none;
                color: #8A9099;
                cursor: pointer;
                padding: 6px;
                display: flex;
            }

            .month-selector button:hover {
                color: #fff;
            }

            .month-label {
                flex: 1;
                font-size: 12px;
                font-weight: 700;
                color: #ECEAE3;
                text-align: center;
            }

            .actions {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .actions button {
                flex: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                border-radius: 12px;
                padding: 10px 12px;
                font-size: 12px;
                font-weight: 600;
                border: none;
                cursor: pointer;
                font-family: inherit;
            }

            .json-btn {
                background: #33383F;
                color: #ECEAE3;
                border: 1px solid #4E555D;
            }

            .json-btn:hover {
                background: #4E555D;
            }

            .add-btn {
                background: #C8102E;
                color: #fff;
                box-shadow: 0 4px 6px -1px rgba(200, 16, 46, 0.2);
            }

            .add-btn:hover {
                background: #E8354F;
            }

            @media (min-width: 640px) {
                .bar {
                    flex-direction: row;
                    flex-wrap: wrap;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px;
                }

                .month-selector {
                    width: auto;
                }

                .month-label {
                    flex: initial;
                    min-width: 130px;
                }

                .actions button {
                    flex: initial;
                    padding: 9px 16px;
                    font-size: 13px;
                }
            }
        `;
    }

    private emit(name: string): void{
        this.dispatchEvent(new CustomEvent(name, {bubbles: true, composed: true}));
    }

    protected override render(): TemplateResult{
        return html`
            <div class="bar">
                <div class="month-selector">
                    <button type="button" @click=${() => this.emit('prev-month')} aria-label="Mês anterior">
                        <ui-icon name="chevron-left" size="14"></ui-icon>
                    </button>
                    <div class="month-label">${MONTH_NAMES[this.month]} / ${this.year}</div>
                    <button type="button" @click=${() => this.emit('next-month')} aria-label="Próximo mês">
                        <ui-icon name="chevron-right" size="14"></ui-icon>
                    </button>
                </div>
                <div class="actions">
                    <!-- <button class="json-btn" type="button" @click=${() => this.emit('open-json')}>
                        <ui-icon name="code" size="14"></ui-icon>
                        <span>JSON</span>
                    </button> -->
                    <button class="add-btn" type="button" @click=${() => this.emit('add-day')}>
                        <ui-icon name="plus" size="14"></ui-icon>
                        <span>Novo Dia / Treino</span>
                    </button>
                </div>
            </div>
        `;
    }

}

declare global{
    interface HTMLElementTagNameMap{
        'workout-header': WorkoutHeader
    }
}
