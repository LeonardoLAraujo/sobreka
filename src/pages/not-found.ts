import {LitElement, html, css, TemplateResult, CSSResult} from 'lit';
import {customElement} from 'lit/decorators.js';
import {getSessionUserId} from '../models/auth';
import sobrekaMarkUrl from '../images/sobreka-marca-mono-escura.svg?url';
import sobreka404Img from '../images/sobreka-404-clara.png?url';

@customElement('not-found-page')
export default class NotFoundPage extends LitElement{

    static override get styles(): CSSResult{
        return css`
            :host {
                display: flex;
                flex-direction: column;
                min-height: 100%;
                background: #ECEAE3;
                color: #23262B;
            }

            header {
                padding: 34px 40px;
            }

            header img {
                height: 26px;
                width: auto;
                display: block;
            }

            main {
                flex: 1;
                display: flex;
                align-items: center;
                padding: 8px 40px 96px;
            }

            .col {
                width: 100%;
                max-width: 600px;
                margin-left: min(9vw, 110px);
            }

            .art {
                width: 100%;
                max-width: 520px;
                height: auto;
                display: block;
                margin-bottom: 44px;
            }

            h1 {
                font-size: clamp(28px, 4.6vw, 40px);
                font-weight: 600;
                letter-spacing: -0.025em;
                line-height: 1.1;
                margin: 0 0 14px;
            }

            p {
                margin: 0 0 34px;
                max-width: 44ch;
                color: #4E555D;
                font-size: 18px;
            }

            .acoes {
                display: flex;
                align-items: center;
                gap: 26px;
                flex-wrap: wrap;
            }

            .btn {
                background: #C8102E;
                color: #fff;
                text-decoration: none;
                font-weight: 600;
                font-size: 16px;
                padding: 14px 26px;
                border-radius: 8px;
                display: inline-block;
            }

            .btn:hover {
                background: #A50D26;
            }

            .link {
                color: #23262B;
                text-decoration: none;
                font-weight: 500;
                font-size: 16px;
                border-bottom: 2px solid #C6CBD1;
                padding-bottom: 2px;
            }

            .link:hover {
                border-bottom-color: #23262B;
            }

            @media (max-width: 640px) {
                header {
                    padding: 26px 22px;
                }

                header img {
                    height: 22px;
                }

                main {
                    padding: 0 22px 72px;
                }

                .col {
                    margin-left: 0;
                }

                .art {
                    max-width: 340px;
                    margin-bottom: 34px;
                }
            }
        `;
    }

    protected override render(): TemplateResult{
        const loggedIn = getSessionUserId() !== null;
        return html`
            <header>
                <a href="/"><img src=${sobrekaMarkUrl} alt="Sobreka"></a>
            </header>
            <main>
                <div class="col">
                    <img class="art" src=${sobreka404Img} alt="Barra olímpica com as duas luvas vazias, sem nenhuma anilha">
                    <h1>Essa página não existe</h1>
                    <p>O link pode estar errado ou a página saiu do ar. ${loggedIn ? 'Seus treinos continuam salvos.' : ''}</p>
                    <div class="acoes">
                        ${loggedIn ? html`
                            <a class="btn" href="/">Voltar para meus treinos</a>
                            <a class="link" href="/historico">Ver meu histórico</a>
                        ` : html`
                            <a class="btn" href="/">Voltar</a>
                        `}
                    </div>
                </div>
            </main>
        `;
    }

}

declare global{
    interface HTMLElementTagNameMap{
        'not-found-page': NotFoundPage
    }
}
