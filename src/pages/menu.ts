import {LitElement, html, css, nothing, TemplateResult, CSSResult} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {driver, type DriveStep} from 'driver.js';
import 'driver.js/dist/driver.css';
import type {MonthlyWorkouts} from '../models/progress';
import {getSessionUserId} from '../models/auth';
import {fetchTrainingProgress} from '../models/trainingProgress';
import {isFirstAccess, completeOnboarding} from '../models/onboarding';
import {getDailyQuote} from '../models/dailyQuote';
import AcadMain from '../acad-main';
import '../components/ui-icon';

interface TourStepCopy {
    title: string;
    description: string;
}

const TOUR_ITEM_COPY: TourStepCopy[] = [
    {
        title: 'Progressão de Carga',
        description: 'Registre as séries e a carga do treino do dia em poucos toques.',
    },
    {
        title: 'Divisão Semanal',
        description: 'Organize quais treinos fazer em cada dia da semana.',
    },
    {
        title: 'Histórico de Treinos',
        description: 'Consulte todos os treinos já registrados, organizados por data.',
    },
    {
        title: 'Perfil',
        description: 'Veja suas estatísticas gerais e edite seus dados.',
    },
];

interface MenuItem {
    id: string;
    label: string;
    description: string;
    href?: string;
}

interface ActivityStats {
    currentStreak: number;
    bestStreak: number;
    totalDays: number;
}

const EMPTY_ACTIVITY: ActivityStats = {currentStreak: 0, bestStreak: 0, totalDays: 0};

const MENU_ITEMS: MenuItem[] = [
    {
        id: 'load-progression',
        label: 'Progressão de Carga',
        description: 'Acompanhe as séries e cargas do treino do dia',
        href: '/progressao-de-carga',
    },
    {
        id: 'weekly-split',
        label: 'Divisão Semanal',
        description: 'Organize seu treino por dia da semana',
        href: '/divisao-semanal',
    },
    {
        id: 'history',
        label: 'Histórico de Treinos',
        description: 'Veja todos os treinos já registrados',
        href: '/historico',
    },
    {
        id: 'profile',
        label: 'Perfil',
        description: 'Suas estatísticas e configurações',
        href: '/perfil',
    },
];

function todayLocalDateString(): string{
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${now.getFullYear()}-${month}-${day}`;
}

function addDays(dateStr: string, delta: number): string{
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + delta);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function computeActivity(monthly: MonthlyWorkouts): ActivityStats{
    const dates = new Set<string>();
    for (const days of Object.values(monthly)) {
        for (const day of days) {
            dates.add(day.date);
        }
    }
    if (dates.size === 0) {
        return EMPTY_ACTIVITY;
    }

    const sorted = [...dates].sort();
    let bestStreak = 0;
    let run = 0;
    let prev: string | null = null;
    for (const date of sorted) {
        run = prev && addDays(prev, 1) === date ? run + 1 : 1;
        bestStreak = Math.max(bestStreak, run);
        prev = date;
    }

    const today = todayLocalDateString();
    const yesterday = addDays(today, -1);
    let cursor = dates.has(today) ? today : (dates.has(yesterday) ? yesterday : null);
    let currentStreak = 0;
    while (cursor && dates.has(cursor)) {
        currentStreak += 1;
        cursor = addDays(cursor, -1);
    }

    return {currentStreak, bestStreak, totalDays: dates.size};
}

@customElement('menu-page')
export default class MenuPage extends LitElement{

    @state() private activity: ActivityStats = EMPTY_ACTIVITY;
    @state() private loading = true;
    @state() private hasSession = false;

    private dailyQuote = getDailyQuote();

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
                background: #1B1E22;
                color: #ECEAE3;
                padding: 16px;
            }

            @media (min-width: 640px) {
                :host {
                    padding: 24px;
                }
            }

            .container {
                max-width: 720px;
                margin: 0 auto;
            }

            header {
                margin-bottom: 20px;
            }

            h1 {
                font-size: 22px;
                font-weight: 700;
                margin: 0;
            }

            .subtitle {
                font-size: 13px;
                color: #6E757E;
                margin: 4px 0 0;
            }

            .quote-card {
                background: rgba(27, 30, 34, 0.6);
                border: 1px solid #33383F;
                border-left: 3px solid #C8102E;
                border-radius: 12px;
                padding: 14px 16px;
                margin-bottom: 20px;
            }

            .quote-text {
                margin: 0;
                font-size: 13px;
                font-style: italic;
                line-height: 1.55;
                color: #ECEAE3;
            }

            .quote-author {
                margin: 6px 0 0;
                font-size: 11px;
                font-weight: 600;
                color: #6E757E;
            }

            .streak-card {
                position: relative;
                overflow: hidden;
                background: linear-gradient(135deg, rgba(200, 16, 46, 0.16), rgba(27, 30, 34, 0.6));
                border: 1px solid rgba(200, 16, 46, 0.3);
                border-radius: 16px;
                padding: 18px 20px;
                margin-bottom: 20px;
                display: flex;
                align-items: center;
                gap: 16px;
                flex-wrap: wrap;
            }

            .streak-flame {
                flex-shrink: 0;
                width: 52px;
                height: 52px;
                border-radius: 999px;
                background: rgba(200, 16, 46, 0.18);
                color: #E8354F;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .streak-main {
                display: flex;
                flex-direction: column;
                min-width: 0;
            }

            .streak-count {
                display: flex;
                align-items: baseline;
                gap: 6px;
            }

            .streak-number {
                font-size: 32px;
                font-weight: 800;
                line-height: 1;
                color: #fff;
            }

            .streak-unit {
                font-size: 13px;
                font-weight: 600;
                color: #8A9099;
            }

            .streak-label {
                margin-top: 2px;
                font-size: 12px;
                color: #8A9099;
            }

            .streak-stats {
                display: flex;
                gap: 16px;
                margin-left: auto;
                flex-wrap: wrap;
            }

            .streak-stat {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 12px;
                color: #ECEAE3;
            }

            .streak-stat ui-icon {
                color: #8A9099;
                flex-shrink: 0;
            }

            .streak-stat b {
                color: #fff;
            }

            .streak-empty {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                width: 100%;
            }

            .streak-empty-text p {
                margin: 0;
                font-size: 13px;
                color: #ECEAE3;
            }

            .streak-empty-text span {
                display: block;
                margin-top: 2px;
                font-size: 12px;
                color: #8A9099;
            }

            .streak-cta {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                background: #C8102E;
                color: #fff;
                text-decoration: none;
                font-size: 12px;
                font-weight: 700;
                padding: 9px 14px;
                border-radius: 10px;
                flex-shrink: 0;
                white-space: nowrap;
            }

            .streak-cta:hover {
                background: #E8354F;
            }

            .list {
                display: grid;
                gap: 12px;
            }

            .item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                width: 100%;
                background: rgba(27, 30, 34, 0.6);
                border: 1px solid #33383F;
                border-radius: 12px;
                padding: 16px;
                text-align: left;
                cursor: pointer;
                font: inherit;
                color: inherit;
            }

            a.item {
                text-decoration: none;
            }

            .item:hover:not(:disabled) {
                border-color: #4E555D;
            }

            .item:disabled {
                cursor: not-allowed;
                opacity: 0.5;
            }

            .item-text {
                min-width: 0;
                flex: 1;
            }

            .item-label {
                font-size: 15px;
                font-weight: 600;
                color: #fff;
                overflow-wrap: break-word;
            }

            .item-description {
                font-size: 12px;
                color: #6E757E;
                margin-top: 2px;
                overflow-wrap: break-word;
            }

            .arrow {
                color: #E8354F;
                font-size: 18px;
                flex-shrink: 0;
            }
        `;
    }

    protected override firstUpdated(): void{
        const activityLoaded = this.loadActivity();
        void this.maybeStartOnboarding(activityLoaded);
    }

    private async maybeStartOnboarding(activityLoaded: Promise<void>): Promise<void>{
        const userId = getSessionUserId();
        if (userId === null) {
            return;
        }

        let isFirst: boolean;
        try {
            isFirst = await isFirstAccess(userId);
        } catch {
            return;
        }
        if (!isFirst) {
            return;
        }

        await activityLoaded;
        await this.updateComplete;
        this.startOnboardingTour();

        try {
            await completeOnboarding(userId);
        } catch {
            // Se falhar, o tour simplesmente aparecerá de novo no próximo acesso.
        }
    }

    private startOnboardingTour(): void{
        const root = this.shadowRoot;
        if (!root) {
            return;
        }

        const steps: DriveStep[] = [
            {
                popover: {
                    title: 'Bem-vindo(a) ao Sobreka!',
                    description: 'Vamos te mostrar rapidinho como registrar e acompanhar sua evolução na academia.',
                },
            },
        ];

        const streakCard = root.querySelector<HTMLElement>('.streak-card');
        if (streakCard) {
            steps.push({
                element: streakCard,
                popover: {
                    title: 'Sua sequência de treinos',
                    description: 'Aqui você acompanha há quantos dias seguidos treina e o seu recorde.',
                    side: 'bottom',
                    align: 'start',
                },
            });
        }

        const items = [...root.querySelectorAll<HTMLElement>('.item')];
        items.forEach((item, index) => {
            const copy = TOUR_ITEM_COPY[index];
            if (!copy) {
                return;
            }
            steps.push({
                element: item,
                popover: {
                    title: copy.title,
                    description: copy.description,
                    side: 'bottom',
                    align: 'start',
                },
            });
        });

        driver({
            showProgress: true,
            nextBtnText: 'Próximo',
            prevBtnText: 'Voltar',
            doneBtnText: 'Concluir',
            popoverClass: 'sobreka-tour-popover',
            overlayColor: '#1B1E22',
            overlayOpacity: 0.75,
            stageRadius: 12,
            steps,
        }).drive();
    }

    private async loadActivity(): Promise<void>{
        const userId = getSessionUserId();
        this.hasSession = userId !== null;
        if (userId === null) {
            this.loading = false;
            return;
        }
        AcadMain.instance?.showLoading();
        try {
            const monthly = await fetchTrainingProgress(userId);
            this.activity = computeActivity(monthly);
        } catch {
            this.activity = EMPTY_ACTIVITY;
        } finally {
            this.loading = false;
            AcadMain.instance?.hideLoading();
        }
    }

    private renderStreakCard(): TemplateResult | typeof nothing{
        if (!this.hasSession || this.loading) {
            return nothing;
        }
        if (this.activity.totalDays === 0) {
            return html`
                <div class="streak-card">
                    <div class="streak-flame"><ui-icon name="flame" size="24"></ui-icon></div>
                    <div class="streak-empty">
                        <div class="streak-empty-text">
                            <p>Você ainda não tem treinos registrados.</p>
                            <span>Comece hoje e inicie sua sequência.</span>
                        </div>
                        <a class="streak-cta" href="/progressao-de-carga">
                            Começar
                            <ui-icon name="arrow-right" size="14"></ui-icon>
                        </a>
                    </div>
                </div>
            `;
        }
        const {currentStreak, bestStreak, totalDays} = this.activity;
        return html`
            <div class="streak-card">
                <div class="streak-flame"><ui-icon name="flame" size="24"></ui-icon></div>
                <div class="streak-main">
                    <div class="streak-count">
                        <span class="streak-number">${currentStreak}</span>
                        <span class="streak-unit">dia${currentStreak === 1 ? '' : 's'} seguido${currentStreak === 1 ? '' : 's'}</span>
                    </div>
                    <p class="streak-label">${currentStreak > 0 ? 'Continue treinando pra manter a sequência!' : 'Treine hoje pra começar uma nova sequência.'}</p>
                </div>
                <div class="streak-stats">
                    <span class="streak-stat"><ui-icon name="trophy" size="14"></ui-icon>Recorde: <b>${bestStreak}</b></span>
                    <span class="streak-stat"><ui-icon name="calendar" size="14"></ui-icon>Total ativo: <b>${totalDays}</b></span>
                </div>
            </div>
        `;
    }

    protected override render(): TemplateResult{
        return html`
            <div class="container">
                <header>
                    <h1>Academia Musculação</h1>
                    <p class="subtitle">Selecione uma opção para continuar</p>
                </header>
                <div class="quote-card">
                    <p class="quote-text">"${this.dailyQuote.quote}"</p>
                    <p class="quote-author">— ${this.dailyQuote.character}, ${this.dailyQuote.game}</p>
                </div>
                ${this.renderStreakCard()}
                <div class="list">
                    ${MENU_ITEMS.map(item => item.href ? html`
                        <a class="item" href=${item.href}>
                            <div class="item-text">
                                <div class="item-label">${item.label}</div>
                                <div class="item-description">${item.description}</div>
                            </div>
                            <span class="arrow">→</span>
                        </a>
                    ` : html`
                        <button class="item" type="button" disabled>
                            <div class="item-text">
                                <div class="item-label">${item.label}</div>
                                <div class="item-description">${item.description}</div>
                            </div>
                        </button>
                    `)}
                </div>
            </div>
        `;
    }

}

declare global{
    interface HTMLElementTagNameMap{
        'menu-page': MenuPage
    }
}
