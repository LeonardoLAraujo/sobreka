import {LitElement, html, css, nothing, TemplateResult, CSSResult} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {Router} from '@lit-labs/router';
import {getSessionUserId} from './models/auth';
import {navigateTo} from './models/navigation';
import {hasDownloadedApp, markAppDownloaded, isRunningStandalone} from './models/pwaInstall';
import './components/ui-icon';
import './components/brand-logo';
import './components/loading-overlay';
import './components/install-app-modal';
import './pages/landing';
import './pages/auth';
import './pages/menu';
import './pages/load-progression';
import './pages/workout-history';
import './pages/weekly-split';
import './pages/profile';
import './pages/not-found';

interface NavItem {
    href: string;
    label: string;
}

const NAV_ITEMS: NavItem[] = [
    {href: '/menu', label: 'Início'},
    {href: '/progressao-de-carga', label: 'Progressão de Carga'},
    {href: '/divisao-semanal', label: 'Divisão Semanal'},
    {href: '/historico', label: 'Histórico de Treinos'},
    {href: '/perfil', label: 'Perfil'},
];

const PUBLIC_PATHS = ['/', '/entrar', '/cadastro'];

const ROUTE_PATHS = [
    ...PUBLIC_PATHS,
    '/menu',
    '/progressao-de-carga',
    '/divisao-semanal',
    '/historico',
    '/perfil',
];

@customElement('acad-main')
export default class AcadMain extends LitElement{

    static override get styles(): CSSResult{
        return css`
            *,
            *::before,
            *::after {
                box-sizing: border-box;
            }

            :host {
                display: block;
                min-height: 100%;
            }

            .topbar {
                background: #23262B;
                border-bottom: 1px solid #33383F;
            }

            .topbar-row {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                padding: 10px 16px;
            }

            .brand {
                order: 1;
                display: flex;
                align-items: center;
                gap: 10px;
                color: #fff;
                text-decoration: none;
                flex-shrink: 0;
            }

            .menu-toggle {
                order: 2;
                display: flex;
                align-items: center;
                justify-content: center;
                background: none;
                border: none;
                color: #8A9099;
                padding: 8px;
                margin: -8px;
                border-radius: 8px;
                cursor: pointer;
                flex-shrink: 0;
            }

            .menu-toggle:hover {
                color: #ECEAE3;
                background: #33383F;
            }

            .nav-links {
                order: 3;
                flex-basis: 100%;
                display: none;
                flex-direction: column;
                gap: 4px;
                padding-top: 8px;
                margin-top: 4px;
                border-top: 1px solid #33383F;
            }

            .nav-links.open {
                display: flex;
            }

            .nav-link {
                display: inline-flex;
                align-items: center;
                color: #8A9099;
                font-size: 13px;
                font-weight: 600;
                text-decoration: none;
                padding: 10px 12px;
                border-radius: 8px;
                white-space: nowrap;
            }

            .nav-link:hover {
                color: #ECEAE3;
                background: #33383F;
            }

            .nav-link.active {
                color: #E8354F;
                background: rgba(200, 16, 46, 0.1);
            }

            @media (min-width: 640px) {
                .menu-toggle {
                    display: none;
                }

                .nav-links {
                    display: flex !important;
                    order: 2;
                    flex-basis: auto;
                    flex-direction: row;
                    align-items: center;
                    gap: 4px;
                    padding-top: 0;
                    margin-top: 0;
                    border-top: none;
                }
            }
        `;
    }

    static instance: AcadMain;

    @state() private mobileMenuOpen = false;
    @state() private loadingCount = 0;
    @state() private showInstallModal = false;

    private router = new Router(this, [
        {path: '/', render: () => html`<landing-page></landing-page>`},
        {path: '/entrar', render: () => html`<auth-page mode="login"></auth-page>`},
        {path: '/cadastro', render: () => html`<auth-page mode="signup"></auth-page>`},
        {path: '/menu', render: () => html`<menu-page></menu-page>`},
        {path: '/progressao-de-carga', render: () => html`<load-progression></load-progression>`},
        {path: '/divisao-semanal', render: () => html`<weekly-split></weekly-split>`},
        {path: '/historico', render: () => html`<workout-history></workout-history>`},
        {path: '/perfil', render: () => html`<profile-page></profile-page>`},
    ], {fallback: {render: () => html`<not-found-page></not-found-page>`}});

    protected override firstUpdated(): void {
        AcadMain.instance = this;
        void this.checkInstallPrompt();
    }

    private async checkInstallPrompt(): Promise<void>{
        const userId = getSessionUserId();
        if (userId === null) {
            return;
        }

        if (isRunningStandalone()) {
            void markAppDownloaded(userId).catch(() => {});
            return;
        }

        try {
            const downloaded = await hasDownloadedApp(userId);
            if (!downloaded) {
                this.showInstallModal = true;
                await this.updateComplete;
                await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
            }
        } catch {
            // se a checagem falhar, simplesmente não mostra o popup dessa vez
        }
    }

    private dismissInstallModal(): void{
        this.showInstallModal = false;
    }

    private async handleAppInstalled(): Promise<void>{
        this.showInstallModal = false;
        const userId = getSessionUserId();
        if (userId === null) {
            return;
        }
        try {
            await markAppDownloaded(userId);
        } catch {
            // melhor esforço: se falhar, o popup só aparece de novo no próximo acesso
        }
    }

    protected override willUpdate(): void{
        const path = window.location.pathname;
        const loggedIn = getSessionUserId() !== null;

        if (loggedIn && PUBLIC_PATHS.includes(path)) {
            navigateTo('/menu');
            return;
        }

        if (!loggedIn && ROUTE_PATHS.includes(path) && !PUBLIC_PATHS.includes(path)) {
            navigateTo('/entrar');
        }
    }

    showLoading(): void{
        this.loadingCount += 1;
    }

    hideLoading(): void{
        this.loadingCount = Math.max(0, this.loadingCount - 1);
    }

    protected override render(): TemplateResult{
        const path = window.location.pathname;
        return html`
            ${ROUTE_PATHS.includes(path) && !PUBLIC_PATHS.includes(path) ? html`
                <nav class="topbar">
                    <div class="topbar-row">
                        <a class="brand" href="/menu" @click=${() => (this.mobileMenuOpen = false)}>
                            <brand-logo height="28"></brand-logo>
                        </a>
                        <button
                            class="menu-toggle"
                            type="button"
                            aria-label="Abrir menu"
                            @click=${() => (this.mobileMenuOpen = !this.mobileMenuOpen)}
                        >
                            <ui-icon name=${this.mobileMenuOpen ? 'close' : 'menu'} size="20"></ui-icon>
                        </button>
                        <div class="nav-links ${this.mobileMenuOpen ? 'open' : ''}">
                            ${NAV_ITEMS.map(item => html`
                                <a
                                    class="nav-link ${path === item.href ? 'active' : ''}"
                                    href=${item.href}
                                    @click=${() => (this.mobileMenuOpen = false)}
                                >${item.label}</a>
                            `)}
                        </div>
                    </div>
                </nav>
            ` : nothing}
            ${this.router.outlet()}
            <loading-overlay ?open=${this.loadingCount > 0}></loading-overlay>
            <install-app-modal
                ?open=${this.showInstallModal}
                @dismiss=${() => this.dismissInstallModal()}
                @installed=${() => this.handleAppInstalled()}
            ></install-app-modal>
        `;
    }

}

declare global{
    interface HTMLElementTagNameMap{
        'acad-main': AcadMain
    }
}
