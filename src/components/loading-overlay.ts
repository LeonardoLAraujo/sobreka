import {LitElement, html, css, TemplateResult, CSSResult} from 'lit';
import {customElement, property} from 'lit/decorators.js';

@customElement('loading-overlay')
export default class LoadingOverlay extends LitElement{

    @property({type: Boolean, reflect: true}) open = false;

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
                z-index: 100;
                background: rgba(27, 30, 34, 0.55);
                backdrop-filter: blur(2px);
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .spinner {
                width: 40px;
                height: 40px;
                border-radius: 999px;
                border: 3px solid rgba(148, 163, 184, 0.25);
                border-top-color: #E8354F;
                animation: spin 0.7s linear infinite;
            }

            @keyframes spin {
                to {
                    transform: rotate(360deg);
                }
            }
        `;
    }

    protected override render(): TemplateResult{
        return html`
            <div class="backdrop" role="status" aria-live="polite" aria-label="Carregando">
                <div class="spinner"></div>
            </div>
        `;
    }

}

declare global{
    interface HTMLElementTagNameMap{
        'loading-overlay': LoadingOverlay
    }
}
