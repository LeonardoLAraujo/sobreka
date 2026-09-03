import {LitElement, html, css, nothing, TemplateResult, CSSResult} from 'lit';
import {customElement, query, state} from 'lit/decorators.js';
import {unsafeSVG} from 'lit/directives/unsafe-svg.js';
import type {MonthlyWorkouts} from '../models/progress';
import {clearSession, getCachedProfile, getSessionUserId, setCachedProfile} from '../models/auth';
import type {UserRecord} from '../models/auth';
import {getUserById, updateUserProfile} from '../models/userProfile';
import {fetchTrainingProgress} from '../models/trainingProgress';
import {navigateTo} from '../models/navigation';
import {formatDateBR} from '../models/dateFormat';
import '../components/ui-icon';
import '../components/toast-notification';
import type ToastNotification from '../components/toast-notification';
import '../components/edit-profile-modal';
import type {ProfileSaveDetail} from '../components/edit-profile-modal';
import '../components/confirm-modal';

interface ProfileStats {
    totalTreinos: number;
    totalExercicios: number;
    mesesAtivos: number;
    primeiroTreino: string | null;
    ultimoTreino: string | null;
}

const EMPTY_STATS: ProfileStats = {
    totalTreinos: 0,
    totalExercicios: 0,
    mesesAtivos: 0,
    primeiroTreino: null,
    ultimoTreino: null,
};

@customElement('profile-page')
export default class ProfilePage extends LitElement{

    @state() private name = '';
    @state() private stats: ProfileStats = EMPTY_STATS;
    @state() private avatarSvg: string | null = null;
    @state() private sessionEmail: string | null = null;
    @state() private userId: number | null = null;
    @state() private profileModalOpen = false;
    @state() private logoutConfirmOpen = false;

    @query('toast-notification') private toast!: ToastNotification;

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

            header {
                background: #23262B;
                border-bottom: 1px solid #33383F;
                padding: 16px;
            }

            .header-inner {
                max-width: 720px;
                margin: 0 auto;
            }

            header h1 {
                margin: 0;
                font-size: 18px;
                font-weight: 700;
                color: #fff;
            }

            header p {
                margin: 2px 0 0;
                font-size: 11px;
                color: #8A9099;
            }

            @media (min-width: 640px) {
                header h1 {
                    font-size: 20px;
                }

                header p {
                    font-size: 12px;
                }
            }

            main {
                flex: 1;
                max-width: 720px;
                width: 100%;
                margin: 0 auto;
                padding: 16px 12px;
                display: flex;
                flex-direction: column;
                gap: 16px;
            }

            @media (min-width: 640px) {
                main {
                    padding: 24px 16px;
                }
            }

            .card {
                background: rgba(27, 30, 34, 0.6);
                border: 1px solid #33383F;
                border-radius: 16px;
                padding: 20px;
            }

            .hero-card {
                position: relative;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                align-items: center;
                text-align: center;
                gap: 4px;
                padding: 28px 20px 24px;
            }

            .hero-card::before {
                content: '';
                position: absolute;
                top: -70px;
                left: 50%;
                transform: translateX(-50%);
                width: 240px;
                height: 240px;
                border-radius: 999px;
                background: #C8102E;
                filter: blur(80px);
                opacity: 0.2;
                pointer-events: none;
            }

            .avatar-wrap {
                position: relative;
                z-index: 1;
                margin-bottom: 14px;
                flex-shrink: 0;
            }

            .avatar {
                width: 88px;
                height: 88px;
                border-radius: 999px;
                background: #C8102E;
                color: #fff;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 28px;
                font-weight: 700;
                overflow: hidden;
                border: 3px solid rgba(200, 16, 46, 0.25);
                box-shadow: 0 12px 28px -10px rgba(200, 16, 46, 0.55);
            }

            .avatar svg {
                display: block;
                width: 100%;
                height: 100%;
            }

            .hero-info {
                position: relative;
                z-index: 1;
                width: 100%;
                max-width: 22rem;
            }

            .hero-info label {
                display: block;
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.02em;
                color: #8A9099;
                margin-bottom: 6px;
            }

            .name-row {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
            }

            .name-display {
                margin: 0;
                font-size: 18px;
                font-weight: 700;
                color: #fff;
            }

            .name-display.placeholder {
                color: #6E757E;
                font-weight: 500;
            }

            .edit-btn {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                flex-shrink: 0;
                background: none;
                border: 1px solid #33383F;
                color: #8A9099;
                padding: 6px 12px;
                font-size: 12px;
                font-weight: 600;
                border-radius: 10px;
                cursor: pointer;
                font-family: inherit;
            }

            .edit-btn:hover {
                color: #E8354F;
                border-color: rgba(200, 16, 46, 0.4);
                background: rgba(200, 16, 46, 0.08);
            }

            .hero-email {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                margin: 10px 0 0;
                font-size: 12px;
                color: #6E757E;
            }

            .card-title {
                margin: 0 0 12px;
                font-size: 14px;
                font-weight: 700;
                color: #fff;
            }

            .stats-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
            }

            @media (min-width: 480px) {
                .stats-grid {
                    grid-template-columns: repeat(4, 1fr);
                }
            }

            .stat-tile {
                background: #1B1E22;
                border: 1px solid #33383F;
                border-radius: 12px;
                padding: 14px;
                text-align: center;
            }

            .stat-tile ui-icon {
                color: #E8354F;
                margin-bottom: 8px;
            }

            .stat-value {
                font-size: 22px;
                font-weight: 700;
                color: #E8354F;
            }

            .stat-label {
                margin-top: 4px;
                font-size: 11px;
                color: #6E757E;
            }

            .range {
                margin: 12px 0 0;
                font-size: 12px;
                color: #8A9099;
                text-align: center;
            }

            .session-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                flex-wrap: wrap;
            }

            .session-email {
                display: flex;
                align-items: center;
                gap: 8px;
                margin: 0;
                font-size: 13px;
                color: #ECEAE3;
            }

            .session-email ui-icon {
                color: #6E757E;
                flex-shrink: 0;
            }

            .logout-btn {
                display: flex;
                align-items: center;
                gap: 6px;
                background: none;
                border: 1px solid #33383F;
                color: #8A9099;
                padding: 8px 14px;
                border-radius: 10px;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                font-family: inherit;
            }

            .logout-btn:hover {
                color: #f87171;
                border-color: rgba(239, 68, 68, 0.4);
                background: rgba(239, 68, 68, 0.08);
            }

            @media (min-width: 640px) {
                .hero-card {
                    flex-direction: row;
                    align-items: center;
                    text-align: left;
                    gap: 20px;
                    padding: 28px 28px;
                }

                .hero-card::before {
                    left: 80px;
                    transform: none;
                }

                .avatar-wrap {
                    margin-bottom: 0;
                }

                .hero-info {
                    max-width: none;
                }

                .hero-info label {
                    text-align: left;
                }

                .name-row {
                    justify-content: flex-start;
                }

                .hero-email {
                    justify-content: flex-start;
                }
            }
        `;
    }

    protected override firstUpdated(): void{
        void this.loadStats();
        void this.initProfile();
    }

    private async initProfile(): Promise<void>{
        const id = getSessionUserId();
        if (id === null) {
            return;
        }

        const cached = getCachedProfile();
        if (cached && cached.id === id) {
            this.applyProfile(cached);
            if (!cached.avatar_photo) {
                await this.loadAvatar();
            }
            return;
        }

        try {
            const profile = await getUserById(id);
            if (!profile) {
                clearSession();
                return;
            }
            this.applyProfile(profile);
            setCachedProfile(profile);
            if (!profile.avatar_photo) {
                await this.loadAvatar();
            }
        } catch (err) {
            console.error('Falha ao carregar perfil:', err);
        }
    }

    private applyProfile(profile: UserRecord): void{
        this.userId = profile.id;
        this.sessionEmail = profile.email;
        this.name = profile.name ?? '';
        this.avatarSvg = profile.avatar_photo;
    }

    private requestLogout(): void{
        this.logoutConfirmOpen = true;
    }

    private confirmLogout(): void{
        this.logoutConfirmOpen = false;
        clearSession();
        navigateTo('/');
    }

    private async loadStats(): Promise<void>{
        const userId = getSessionUserId();
        if (userId === null) {
            return;
        }
        let monthly: MonthlyWorkouts = {};
        try {
            monthly = await fetchTrainingProgress(userId);
        } catch {
            monthly = {};
        }
        const allDays = Object.values(monthly).flat();
        const dates = allDays.map(day => day.date).sort();
        this.stats = {
            totalTreinos: allDays.length,
            totalExercicios: allDays.reduce((sum, day) => sum + Object.keys(day.exercises).length, 0),
            mesesAtivos: Object.keys(monthly).filter(key => (monthly[key] ?? []).length > 0).length,
            primeiroTreino: dates[0] ?? null,
            ultimoTreino: dates[dates.length - 1] ?? null,
        };
    }

    private async getImageProfile(): Promise<string>{
        const request = await fetch('https://api.dicebear.com/10.x/sprouts/svg');
        const response = await request.text();

        return response;
    }

    private async loadAvatar(): Promise<void>{
        try {
            const svg = await this.getImageProfile();
            this.avatarSvg = svg;
            if (this.userId !== null) {
                const updated = await updateUserProfile(this.userId, {avatar_photo: svg});
                if (updated) {
                    setCachedProfile(updated);
                }
            }
        } catch {
            this.avatarSvg = null;
        }
    }

    private async handleProfileSave(event: CustomEvent<ProfileSaveDetail>): Promise<void>{
        const {name, avatarPhoto} = event.detail;
        try {
            if (this.userId !== null) {
                const updated = await updateUserProfile(this.userId, {name, avatar_photo: avatarPhoto ?? undefined});
                if (updated) {
                    setCachedProfile(updated);
                }
            }
            this.name = name;
            if (avatarPhoto) {
                this.avatarSvg = avatarPhoto;
            }
            this.profileModalOpen = false;
            this.toast.show('Perfil atualizado!');
        } catch {
            this.toast.show('Não foi possível salvar. Tente novamente.', 'erro');
        }
    }

    private get initials(): string{
        const trimmed = this.name.trim();
        if (!trimmed) {
            return '?';
        }
        return trimmed
            .split(/\s+/)
            .slice(0, 2)
            .map(part => part[0]?.toUpperCase() ?? '')
            .join('');
    }

    private get averagePerTreino(): number{
        if (this.stats.totalTreinos === 0) {
            return 0;
        }
        return Math.round((this.stats.totalExercicios / this.stats.totalTreinos) * 10) / 10;
    }

    protected override render(): TemplateResult{
        return html`
            <header>
                <div class="header-inner">
                    <h1>Perfil</h1>
                    <p>Suas informações e estatísticas de treino</p>
                </div>
            </header>

            <main>
                <div class="card hero-card">
                    <div class="avatar-wrap">
                        <div class="avatar">${this.avatarSvg ? unsafeSVG(this.avatarSvg) : this.initials}</div>
                    </div>
                    <div class="hero-info">
                        <div class="name-row">
                            <h2 class="name-display ${this.name ? '' : 'placeholder'}">
                                ${this.name || 'Adicione seu nome'}
                            </h2>
                            <button class="edit-btn" type="button" title="Editar perfil" @click=${() => (this.profileModalOpen = true)}>
                                <ui-icon name="edit" size="13"></ui-icon>
                                Editar Perfil
                            </button>
                        </div>
                        ${this.sessionEmail ? html`
                            <p class="hero-email"><ui-icon name="mail" size="13"></ui-icon>${this.sessionEmail}</p>
                        ` : nothing}
                    </div>
                </div>

                <div class="card">
                    <h2 class="card-title">Estatísticas</h2>
                    <div class="stats-grid">
                        <div class="stat-tile">
                            <ui-icon name="dumbbell" size="16"></ui-icon>
                            <div class="stat-value">${this.stats.totalTreinos}</div>
                            <div class="stat-label">Treinos</div>
                        </div>
                        <div class="stat-tile">
                            <ui-icon name="layers" size="16"></ui-icon>
                            <div class="stat-value">${this.stats.totalExercicios}</div>
                            <div class="stat-label">Exercícios</div>
                        </div>
                        <div class="stat-tile">
                            <ui-icon name="calendar" size="16"></ui-icon>
                            <div class="stat-value">${this.stats.mesesAtivos}</div>
                            <div class="stat-label">Meses ativos</div>
                        </div>
                        <div class="stat-tile">
                            <ui-icon name="chart" size="16"></ui-icon>
                            <div class="stat-value">${this.averagePerTreino}</div>
                            <div class="stat-label">Exerc. / treino</div>
                        </div>
                    </div>
                    ${this.stats.primeiroTreino ? html`
                        <p class="range">Entrou no dia ${formatDateBR(this.stats.primeiroTreino)}</p>
                    ` : nothing}
                </div>

                ${this.sessionEmail ? html`
                    <div class="card session-row">
                        <p class="session-email"><ui-icon name="mail" size="14"></ui-icon>${this.sessionEmail}</p>
                        <button class="logout-btn" type="button" @click=${() => this.requestLogout()}>
                            <ui-icon name="logout" size="13"></ui-icon>
                            Sair da conta
                        </button>
                    </div>
                ` : nothing}
            </main>

            <edit-profile-modal
                .open=${this.profileModalOpen}
                .name=${this.name}
                .avatarSvg=${this.avatarSvg}
                @save=${(event: CustomEvent<ProfileSaveDetail>) => this.handleProfileSave(event)}
                @close=${() => (this.profileModalOpen = false)}
            ></edit-profile-modal>

            <confirm-modal
                .open=${this.logoutConfirmOpen}
                titleText="Sair da conta?"
                message="Você vai precisar entrar novamente para acessar seus treinos."
                confirmLabel="Sair"
                @close=${() => (this.logoutConfirmOpen = false)}
                @confirm=${() => this.confirmLogout()}
            ></confirm-modal>

            <toast-notification></toast-notification>
        `;
    }

}

declare global{
    interface HTMLElementTagNameMap{
        'profile-page': ProfilePage
    }
}
