import {LitElement, html, css, TemplateResult, CSSResult} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import './ui-icon';

@customElement('app-modal')
export default class AppModal extends LitElement{

    @property({type: Boolean, reflect: true}) open = false;
    @property({type: String, reflect: true}) size: 'md' | 'lg' | 'xl' = 'md';

    static override get styles(): CSSResult{
        return css`
            :host {
                display: none;
            }

            :host([open]) {
                display: block;
            }

            .backdrop {
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.7);
                backdrop-filter: blur(4px);
                z-index: 50;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 16px;
            }

            .panel {
                background: #23262B;
                border: 1px solid #33383F;
                border-radius: 16px;
                max-width: 28rem;
                width: 100%;
                padding: 18px;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                max-height: 90vh;
                overflow-y: auto;
                box-sizing: border-box;
            }

            @media (min-width: 480px) {
                .panel {
                    padding: 24px;
                }
            }

            :host([size='lg']) .panel {
                max-width: 32rem;
            }

            :host([size='xl']) .panel {
                max-width: 42rem;
            }

            .head {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 20px;
                gap: 12px;
            }

            .close {
                background: none;
                border: none;
                color: #8A9099;
                cursor: pointer;
                padding: 6px;
                margin: -6px -6px 0 0;
                display: flex;
                flex-shrink: 0;
            }

            .close:hover {
                color: #ECEAE3;
            }
        `;
    }

    private close(): void{
        this.dispatchEvent(new CustomEvent('close', {bubbles: true, composed: true}));
    }

    protected override render(): TemplateResult{
        return html`
            <div class="backdrop" @click=${(event: Event) => { if (event.target === event.currentTarget) this.close(); }}>
                <div class="panel">
                    <div class="head">
                        <slot name="title"></slot>
                        <button class="close" type="button" @click=${() => this.close()} aria-label="Fechar">
                            <ui-icon name="close" size="18"></ui-icon>
                        </button>
                    </div>
                    <slot></slot>
                </div>
            </div>
        `;
    }

}

declare global{
    interface HTMLElementTagNameMap{
        'app-modal': AppModal
    }
}
