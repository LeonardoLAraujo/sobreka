import {LitElement, html, css, nothing, TemplateResult, CSSResult} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {getDeferredInstallPrompt, clearDeferredInstallPrompt, isIOS, INSTALL_PROMPT_CHANGED_EVENT} from '../models/pwaInstall';
import sobrekaIconUrl from '../images/sobreka-icone.svg?url';
import './app-modal';

@customElement('install-app-modal')
export default class InstallAppModal extends LitElement{

    @property({type: Boolean}) open = false;

    @state() private installing = false;

    private onPromptChanged = (): void => {
        this.requestUpdate();
    };

    override connectedCallback(): void{
        super.connectedCallback();
        window.addEventListener(INSTALL_PROMPT_CHANGED_EVENT, this.onPromptChanged);
    }

    override disconnectedCallback(): void{
        window.removeEventListener(INSTALL_PROMPT_CHANGED_EVENT, this.onPromptChanged);
        super.disconnectedCallback();
    }

    static override get styles(): CSSResult{
        return css`
            :host {
                display: contents;
            }

            .head {
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .head img {
                width: 44px;
                height: 44px;
                border-radius: 12px;
                flex-shrink: 0;
            }

            h3 {
                margin: 0;
                font-size: 17px;
                font-weight: 700;
                color: #fff;
            }

            p {
                margin: 16px 0 0;
                font-size: 13px;
                line-height: 1.6;
                color: #8A9099;
            }

            .steps {
                margin: 14px 0 0;
                padding-left: 18px;
                font-size: 13px;
                line-height: 1.7;
                color: #8A9099;
            }

            .actions {
                display: flex;
                justify-content: flex-end;
                gap: 10px;
                margin-top: 22px;
            }

            button {
                border-radius: 10px;
                font-size: 13px;
                font-weight: 700;
                padding: 10px 16px;
                cursor: pointer;
                font-family: inherit;
                border: none;
            }

            .dismiss {
                background: transparent;
                border: 1px solid #4E555D;
                color: #ECEAE3;
            }

            .dismiss:hover {
                background: #33383F;
                border-color: #6E757E;
            }

            .install {
                background: #C8102E;
                color: #fff;
            }

            .install:hover {
                background: #E8354F;
            }

            .install:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }
        `;
    }

    private close(): void{
        this.dispatchEvent(new CustomEvent('dismiss', {bubbles: true, composed: true}));
    }

    private async install(): Promise<void>{
        const prompt = getDeferredInstallPrompt();
        if (!prompt) {
            return;
        }
        this.installing = true;
        try {
            await prompt.prompt();
            const {outcome} = await prompt.userChoice;
            clearDeferredInstallPrompt();
            if (outcome === 'accepted') {
                this.dispatchEvent(new CustomEvent('installed', {bubbles: true, composed: true}));
            } else {
                this.close();
            }
        } finally {
            this.installing = false;
        }
    }

    protected override render(): TemplateResult{
        const prompt = getDeferredInstallPrompt();
        return html`
            <app-modal ?open=${this.open} @close=${() => this.close()}>
                <div slot="title" class="head">
                    <img src=${sobrekaIconUrl} alt="">
                    <h3>Instale o Sobreka</h3>
                </div>
                <p>Adicione o Sobreka à tela inicial do seu celular pra abrir mais rápido, em tela cheia, sem precisar do navegador.</p>
                ${!prompt && isIOS() ? html`
                    <ol class="steps">
                        <li>Toque no ícone de compartilhar do Safari</li>
                        <li>Escolha "Adicionar à Tela de Início"</li>
                    </ol>
                ` : nothing}
                ${!prompt && !isIOS() ? html`
                    <p>Procure por "Instalar app" ou "Adicionar à tela inicial" no menu do seu navegador.</p>
                ` : nothing}
                <div class="actions">
                    <button class="dismiss" type="button" @click=${() => this.close()}>Agora não</button>
                    ${prompt ? html`
                        <button class="install" type="button" ?disabled=${this.installing} @click=${() => this.install()}>
                            ${this.installing ? 'Instalando...' : 'Instalar agora'}
                        </button>
                    ` : nothing}
                </div>
            </app-modal>
        `;
    }

}

declare global{
    interface HTMLElementTagNameMap{
        'install-app-modal': InstallAppModal
    }
}
