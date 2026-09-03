import {LitElement, html, css, nothing, PropertyValues, TemplateResult, CSSResult} from 'lit';
import {customElement, property, query, state} from 'lit/decorators.js';
import {getErrorMessage, loginUser, registerUser, translateAuthError} from '../models/auth';
import {navigateTo} from '../models/navigation';
import '../components/ui-icon';
import '../components/brand-logo';

export type AuthMode = 'login' | 'signup';

@customElement('auth-page')
export default class AuthPage extends LitElement{

    @property({type: String}) mode: AuthMode = 'login';

    @state() private error = '';
    @state() private submitting = false;

    @query('#login-email') private loginEmailInput?: HTMLInputElement;
    @query('#login-password') private loginPasswordInput?: HTMLInputElement;
    @query('#signup-name') private signupNameInput?: HTMLInputElement;
    @query('#signup-email') private signupEmailInput?: HTMLInputElement;
    @query('#signup-password') private signupPasswordInput?: HTMLInputElement;
    @query('#signup-confirm') private signupConfirmInput?: HTMLInputElement;

    static override get styles(): CSSResult{
        return css`
            *,
            *::before,
            *::after {
                box-sizing: border-box;
            }

            :host {
                display: flex;
                flex-direction: column;
                min-height: 100%;
                background: #1B1E22;
                color: #ECEAE3;
            }

            .nav {
                padding: 14px 16px;
                border-bottom: 1px solid #33383F;
                display: flex;
                justify-content: center;
            }

            .brand {
                display: flex;
                align-items: center;
                gap: 10px;
                color: #fff;
                text-decoration: none;
            }


            main {
                flex: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 32px 16px;
            }

            .card {
                width: 100%;
                max-width: 24rem;
                background: rgba(27, 30, 34, 0.6);
                border: 1px solid #33383F;
                border-radius: 16px;
                padding: 24px;
                box-sizing: border-box;
            }

            .tabs {
                display: flex;
                gap: 4px;
                background: #1B1E22;
                border: 1px solid #33383F;
                border-radius: 12px;
                padding: 4px;
                margin-bottom: 20px;
            }

            .tab {
                flex: 1;
                text-align: center;
                text-decoration: none;
                color: #8A9099;
                font-size: 13px;
                font-weight: 600;
                padding: 9px 10px;
                border-radius: 8px;
            }

            .tab:hover {
                color: #ECEAE3;
            }

            .tab.active {
                background: #C8102E;
                color: #fff;
            }

            form {
                display: flex;
                flex-direction: column;
                gap: 14px;
            }

            form h2 {
                margin: 0;
                font-size: 18px;
                font-weight: 800;
                color: #fff;
            }

            .subtitle {
                margin: -6px 0 4px;
                font-size: 12px;
                color: #6E757E;
            }

            .error {
                margin: 0;
                padding: 10px 12px;
                background: rgba(239, 68, 68, 0.1);
                border: 1px solid rgba(239, 68, 68, 0.3);
                color: #f87171;
                font-size: 12px;
                border-radius: 10px;
            }

            label {
                display: block;
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.02em;
                color: #8A9099;
                margin-bottom: 4px;
            }

            input {
                width: 100%;
                background: #1B1E22;
                border: 1px solid #33383F;
                border-radius: 12px;
                padding: 10px 12px;
                color: #ECEAE3;
                font: inherit;
                box-sizing: border-box;
            }

            input:focus {
                outline: none;
                border-color: #E8354F;
            }

            .submit {
                margin-top: 6px;
                background: #C8102E;
                color: #fff;
                border: none;
                border-radius: 12px;
                padding: 12px 0;
                font-size: 14px;
                font-weight: 700;
                cursor: pointer;
                font-family: inherit;
            }

            .submit:hover {
                background: #E8354F;
            }

            .submit:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }
        `;
    }

    protected override updated(changed: PropertyValues): void{
        if (changed.has('mode')) {
            this.error = '';
            this.submitting = false;
        }
    }

    private async handleLogin(event: Event): Promise<void>{
        event.preventDefault();
        this.error = '';
        const email = this.loginEmailInput!.value.trim().toLowerCase();
        const password = this.loginPasswordInput!.value;

        if (!email || !password) {
            this.error = 'Preencha e-mail e senha.';
            return;
        }

        this.submitting = true;
        try {
            await loginUser(email, password);
            navigateTo('/menu');
        } catch (err) {
            this.error = translateAuthError(getErrorMessage(err));
        } finally {
            this.submitting = false;
        }
    }

    private async handleSignup(event: Event): Promise<void>{
        event.preventDefault();
        this.error = '';
        const name = this.signupNameInput!.value.trim();
        const email = this.signupEmailInput!.value.trim().toLowerCase();
        const password = this.signupPasswordInput!.value;
        const confirm = this.signupConfirmInput!.value;

        if (!name || !email || !password || !confirm) {
            this.error = 'Preencha todos os campos.';
            return;
        }
        if (password.length < 6) {
            this.error = 'A senha precisa ter pelo menos 6 caracteres.';
            return;
        }
        if (password !== confirm) {
            this.error = 'As senhas não coincidem.';
            return;
        }

        this.submitting = true;
        try {
            await registerUser(name, email, password);
            navigateTo('/menu');
        } catch (err) {
            this.error = translateAuthError(getErrorMessage(err));
        } finally {
            this.submitting = false;
        }
    }

    private renderLogin(): TemplateResult{
        return html`
            <form @submit=${(event: Event) => this.handleLogin(event)}>
                <h2>Entrar na sua conta</h2>
                <p class="subtitle">Bem-vindo de volta! Informe seus dados pra continuar.</p>
                ${this.error ? html`<p class="error">${this.error}</p>` : nothing}
                <div>
                    <label for="login-email">E-mail</label>
                    <input id="login-email" type="email" required placeholder="voce@email.com" autocomplete="email">
                </div>
                <div>
                    <label for="login-password">Senha</label>
                    <input id="login-password" type="password" required placeholder="••••••••" autocomplete="current-password">
                </div>
                <button class="submit" type="submit" ?disabled=${this.submitting}>
                    ${this.submitting ? 'Entrando...' : 'Entrar'}
                </button>
            </form>
        `;
    }

    private renderSignup(): TemplateResult{
        return html`
            <form @submit=${(event: Event) => this.handleSignup(event)}>
                <h2>Criar sua conta</h2>
                <p class="subtitle">Leva menos de um minuto pra começar a registrar seus treinos.</p>
                ${this.error ? html`<p class="error">${this.error}</p>` : nothing}
                <div>
                    <label for="signup-name">Nome</label>
                    <input id="signup-name" type="text" required placeholder="Como podemos te chamar?" autocomplete="name">
                </div>
                <div>
                    <label for="signup-email">E-mail</label>
                    <input id="signup-email" type="email" required placeholder="voce@email.com" autocomplete="email">
                </div>
                <div>
                    <label for="signup-password">Senha</label>
                    <input id="signup-password" type="password" required placeholder="Mínimo 6 caracteres" autocomplete="new-password">
                </div>
                <div>
                    <label for="signup-confirm">Confirmar Senha</label>
                    <input id="signup-confirm" type="password" required placeholder="Repita a senha" autocomplete="new-password">
                </div>
                <button class="submit" type="submit" ?disabled=${this.submitting}>
                    ${this.submitting ? 'Criando...' : 'Criar Conta Grátis'}
                </button>
            </form>
        `;
    }

    protected override render(): TemplateResult{
        return html`
            <header class="nav">
                <a class="brand" href="/">
                    <brand-logo height="26"></brand-logo>
                </a>
            </header>

            <main>
                <div class="card">
                    <div class="tabs">
                        <a class="tab ${this.mode === 'login' ? 'active' : ''}" href="/entrar">Entrar</a>
                        <a class="tab ${this.mode === 'signup' ? 'active' : ''}" href="/cadastro">Criar Conta</a>
                    </div>
                    ${this.mode === 'login' ? this.renderLogin() : this.renderSignup()}
                </div>
            </main>
        `;
    }

}

declare global{
    interface HTMLElementTagNameMap{
        'auth-page': AuthPage
    }
}
