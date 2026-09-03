import {LitElement, html, css, PropertyValues, TemplateResult, CSSResult} from 'lit';
import {customElement, property, query} from 'lit/decorators.js';
import './app-modal';
import './ui-icon';

@customElement('json-modal')
export default class JsonModal extends LitElement{

    @property({type: Boolean}) open = false;
    @property({type: String}) jsonText = '';

    @query('#json-textarea') private textarea!: HTMLTextAreaElement;

    static override get styles(): CSSResult{
        return css`
            textarea {
                width: 100%;
                height: 18rem;
                background: #1B1E22;
                border: 1px solid #33383F;
                border-radius: 12px;
                padding: 12px;
                color: #ECEAE3;
                font-family: 'Courier New', monospace;
                font-size: 12px;
                resize: none;
                box-sizing: border-box;
            }

            textarea:focus {
                outline: none;
                border-color: #E8354F;
            }

            p {
                margin: 2px 0 0;
                font-size: 12px;
                color: #6E757E;
            }

            h3 {
                margin: 0;
                font-size: 16px;
                font-weight: 700;
                color: #fff;
            }

            .footer {
                margin-top: 16px;
                padding-top: 16px;
                border-top: 1px solid #33383F;
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 12px;
                flex-wrap: wrap;
            }

            .footer-right {
                display: flex;
                gap: 12px;
            }

            button {
                border: none;
                border-radius: 12px;
                padding: 8px 16px;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
                font-family: inherit;
            }

            .copy {
                background: #33383F;
                color: #ECEAE3;
                display: flex;
                align-items: center;
                gap: 6px;
            }

            .copy:hover {
                background: #4E555D;
            }

            .cancel {
                background: #33383F;
                color: #ECEAE3;
            }

            .cancel:hover {
                background: #4E555D;
            }
        `;
    }

    protected override updated(changed: PropertyValues): void{
        if (changed.has('open') && this.open) {
            this.textarea.value = this.jsonText;
        }
    }

    private close(): void{
        this.dispatchEvent(new CustomEvent('close', {bubbles: true, composed: true}));
    }

    private copy(): void{
        this.textarea.select();
        navigator.clipboard.writeText(this.textarea.value).catch(() => undefined);
        this.dispatchEvent(new CustomEvent('copied', {bubbles: true, composed: true}));
    }

    protected override render(): TemplateResult{
        return html`
            <app-modal ?open=${this.open} size="xl" @close=${() => this.close()}>
                <div slot="title">
                    <h3>Visualizar JSON</h3>
                    <p>Estrutura de dados de todos os treinos do mês selecionado</p>
                </div>
                <textarea id="json-textarea" spellcheck="false" readonly></textarea>
                <div class="footer">
                    <button type="button" class="copy" @click=${() => this.copy()}>
                        <ui-icon name="copy" size="14"></ui-icon>
                        <span>Copiar JSON</span>
                    </button>
                    <div class="footer-right">
                        <button type="button" class="cancel" @click=${() => this.close()}>Fechar</button>
                    </div>
                </div>
            </app-modal>
        `;
    }

}

declare global{
    interface HTMLElementTagNameMap{
        'json-modal': JsonModal
    }
}
