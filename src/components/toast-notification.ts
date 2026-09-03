import {LitElement, html, css, TemplateResult, CSSResult} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import './ui-icon';

export type ToastType = 'sucesso' | 'erro';

@customElement('toast-notification')
export default class ToastNotification extends LitElement{

    @state() private message = '';
    @state() private type: ToastType = 'sucesso';
    @state() private visible = false;

    private hideTimeout?: ReturnType<typeof setTimeout>;

    static override get styles(): CSSResult{
        return css`
            :host {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 60;
                pointer-events: none;
            }

            .toast {
                display: flex;
                align-items: center;
                gap: 12px;
                background: #23262B;
                border: 1px solid #4E555D;
                color: #fff;
                padding: 12px 16px;
                border-radius: 12px;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                font-size: 13px;
                font-weight: 500;
                transform: translateY(6rem);
                opacity: 0;
                transition: transform 0.3s, opacity 0.3s;
            }

            .toast.visible {
                transform: translateY(0);
                opacity: 1;
            }

            .toast.sucesso ui-icon {
                color: #E8354F;
            }

            .toast.erro ui-icon {
                color: #ef4444;
            }
        `;
    }

    show(message: string, type: ToastType = 'sucesso'): void{
        this.message = message;
        this.type = type;
        this.visible = true;
        clearTimeout(this.hideTimeout);
        this.hideTimeout = setTimeout(() => {
            this.visible = false;
        }, 3000);
    }

    protected override render(): TemplateResult{
        return html`
            <div class="toast ${this.type} ${this.visible ? 'visible' : ''}">
                <ui-icon name=${this.type === 'sucesso' ? 'check-circle' : 'alert-triangle'} size="18"></ui-icon>
                <span>${this.message}</span>
            </div>
        `;
    }

}

declare global{
    interface HTMLElementTagNameMap{
        'toast-notification': ToastNotification
    }
}
