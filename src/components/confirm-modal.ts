import {LitElement, html, css, TemplateResult, CSSResult} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import './app-modal';
import './ui-icon';

@customElement('confirm-modal')
export default class ConfirmModal extends LitElement{

    @property({type: Boolean}) open = false;
    @property({type: String}) titleText = 'Excluir item?';
    @property({type: String}) message = 'Esta ação não poderá ser desfeita.';
    @property({type: String}) confirmLabel = 'Excluir';

    static override get styles(): CSSResult{
        return css`
            .body {
                text-align: center;
            }

            .icon {
                width: 56px;
                height: 56px;
                border-radius: 999px;
                background: rgba(239, 68, 68, 0.1);
                color: #ef4444;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 16px;
            }

            h3 {
                margin: 0 0 8px;
                font-size: 16px;
                font-weight: 700;
                color: #fff;
            }

            p {
                margin: 0 0 20px;
                font-size: 13px;
                color: #8A9099;
            }

            .actions {
                display: flex;
                gap: 12px;
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

            .confirm {
                background: #dc2626;
                color: #fff;
            }

            .confirm:hover {
                background: #ef4444;
            }
        `;
    }

    private close(): void{
        this.dispatchEvent(new CustomEvent('close', {bubbles: true, composed: true}));
    }

    private confirm(): void{
        this.dispatchEvent(new CustomEvent('confirm', {bubbles: true, composed: true}));
    }

    protected override render(): TemplateResult{
        return html`
            <app-modal ?open=${this.open} @close=${() => this.close()}>
                <div class="body">
                    <div class="icon">
                        <ui-icon name="alert-triangle" size="24"></ui-icon>
                    </div>
                    <h3>${this.titleText}</h3>
                    <p>${this.message}</p>
                    <div class="actions">
                        <button type="button" class="cancel" @click=${() => this.close()}>Cancelar</button>
                        <button type="button" class="confirm" @click=${() => this.confirm()}>${this.confirmLabel}</button>
                    </div>
                </div>
            </app-modal>
        `;
    }

}

declare global{
    interface HTMLElementTagNameMap{
        'confirm-modal': ConfirmModal
    }
}
