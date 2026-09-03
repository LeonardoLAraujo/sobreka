import {LitElement, html, css, TemplateResult, CSSResult} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import '../components/ui-icon';
import '../components/brand-logo';
import type {IconName} from '../components/ui-icon';

interface FeatureCard {
    icon: IconName;
    title: string;
    description: string;
}

const FEATURES: FeatureCard[] = [
    {
        icon: 'dumbbell',
        title: 'Progressão de Carga',
        description: 'Registre séries, repetições e carga de cada exercício em segundos, direto do celular.',
    },
    {
        icon: 'chart',
        title: 'Gráfico de Evolução',
        description: 'Veja sua carga média evoluir treino a treino num gráfico, sem precisar montar planilha.',
    },
    {
        icon: 'calendar',
        title: 'Histórico Organizado',
        description: 'Todos os treinos organizados por mês e data, prontos pra consultar quando precisar.',
    },
    {
        icon: 'check-circle',
        title: 'Seguro e Grátis',
        description: 'Seus dados ficam salvos com segurança em nosso banco de dados, protegidos e em conformidade com a LGPD. Sem anúncios.',
    },
];

type PreviewTabId = 'carga' | 'historico' | 'perfil';

interface PreviewTabDef {
    id: PreviewTabId;
    label: string;
}

const PREVIEW_TABS: PreviewTabDef[] = [
    {id: 'carga', label: 'Progressão de Carga'},
    {id: 'historico', label: 'Histórico'},
    {id: 'perfil', label: 'Perfil'},
];

@customElement('landing-page')
export default class LandingPage extends LitElement{

    @state() private activeTab: PreviewTabId = 'carga';

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
                overflow-x: hidden;
            }

            @keyframes fade-up {
                from {
                    opacity: 0;
                    transform: translateY(12px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .nav {
                border-bottom: 1px solid #33383F;
            }

            .nav-inner {
                max-width: 1080px;
                margin: 0 auto;
                padding: 14px 16px;
                display: flex;
                align-items: center;
                justify-content: space-between;
            }

            .brand {
                display: flex;
                align-items: center;
                gap: 10px;
                color: #fff;
                text-decoration: none;
            }

            .enter-link {
                color: #8A9099;
                text-decoration: none;
                font-size: 13px;
                font-weight: 600;
                padding: 8px 14px;
                border-radius: 8px;
                border: 1px solid #33383F;
            }

            .enter-link:hover {
                color: #ECEAE3;
                border-color: #4E555D;
            }

            .hero {
                position: relative;
                padding: 48px 16px 32px;
                overflow: hidden;
            }

            .hero::before,
            .hero::after {
                content: '';
                position: absolute;
                width: 360px;
                height: 360px;
                border-radius: 999px;
                filter: blur(90px);
                opacity: 0.22;
                z-index: 0;
            }

            .hero::before {
                background: #C8102E;
                top: -120px;
                left: -120px;
            }

            .hero::after {
                background: #E8354F;
                bottom: -160px;
                right: -120px;
            }

            .hero-inner {
                position: relative;
                z-index: 1;
                max-width: 1080px;
                margin: 0 auto;
                display: flex;
                flex-direction: column;
                gap: 32px;
                align-items: center;
                text-align: center;
            }

            .badge {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                background: rgba(200, 16, 46, 0.1);
                border: 1px solid rgba(200, 16, 46, 0.25);
                color: #E8354F;
                font-size: 12px;
                font-weight: 600;
                padding: 6px 14px;
                border-radius: 999px;
                animation: fade-up 0.5s ease both;
            }

            .hero-copy h1 {
                margin: 16px 0 0;
                font-size: 30px;
                font-weight: 800;
                letter-spacing: -0.02em;
                line-height: 1.15;
                animation: fade-up 0.5s ease 0.05s both;
            }

            .hero-copy p {
                margin: 16px auto 0;
                max-width: 34rem;
                font-size: 15px;
                line-height: 1.6;
                color: #8A9099;
                animation: fade-up 0.5s ease 0.1s both;
            }

            .cta-row {
                display: flex;
                flex-direction: column;
                gap: 12px;
                margin: 24px auto 0;
                width: 100%;
                max-width: 20rem;
                animation: fade-up 0.5s ease 0.15s both;
            }

            .btn {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                padding: 13px 20px;
                border-radius: 12px;
                font-size: 14px;
                font-weight: 700;
                text-decoration: none;
                cursor: pointer;
                border: none;
                font-family: inherit;
            }

            .btn-primary {
                background: #C8102E;
                color: #fff;
                box-shadow: 0 10px 20px -8px rgba(200, 16, 46, 0.5);
            }

            .btn-primary:hover {
                background: #E8354F;
            }

            .btn-ghost {
                background: transparent;
                color: #ECEAE3;
                border: 1px solid #4E555D;
            }

            .btn-ghost:hover {
                border-color: #6E757E;
                background: #33383F;
            }

            .device {
                width: 100%;
                max-width: 22rem;
                background: #23262B;
                border: 1px solid #33383F;
                border-radius: 20px;
                box-shadow: 0 30px 60px -20px rgba(0, 0, 0, 0.6);
                overflow: hidden;
                transform: rotate(-1.5deg);
                animation: fade-up 0.6s ease 0.2s both;
            }

            .device-bar {
                display: flex;
                gap: 6px;
                padding: 12px 14px;
                border-bottom: 1px solid #33383F;
            }

            .device-dot {
                width: 8px;
                height: 8px;
                border-radius: 999px;
                background: #4E555D;
            }

            .device-body {
                padding: 16px;
            }

            .mock-card {
                background: rgba(27, 30, 34, 0.6);
                border: 1px solid #33383F;
                border-radius: 14px;
                padding: 14px;
                text-align: left;
            }

            .mock-badge-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 8px;
            }

            .mock-badge {
                background: rgba(200, 16, 46, 0.1);
                color: #E8354F;
                border: 1px solid rgba(200, 16, 46, 0.2);
                font-size: 10px;
                font-weight: 700;
                padding: 3px 8px;
                border-radius: 8px;
            }

            .mock-date {
                font-size: 11px;
                color: #6E757E;
            }

            .mock-card h4 {
                margin: 8px 0 0;
                font-size: 15px;
                font-weight: 700;
                color: #fff;
            }

            .mock-exercise {
                margin-top: 12px;
                background: #1B1E22;
                border: 1px solid #33383F;
                border-radius: 12px;
                padding: 10px;
            }

            .mock-exercise-head {
                display: flex;
                align-items: center;
                justify-content: space-between;
                color: #ECEAE3;
                font-size: 13px;
                font-weight: 600;
            }

            .mock-exercise-head ui-icon {
                color: #E8354F;
            }

            .mock-chart {
                display: block;
                width: 100%;
                height: 40px;
                margin-top: 8px;
            }

            .mock-chart polyline {
                fill: none;
                stroke: #E8354F;
                stroke-width: 2.5;
                stroke-linecap: round;
                stroke-linejoin: round;
            }

            .mock-chips {
                display: flex;
                flex-wrap: wrap;
                gap: 4px;
                margin-top: 8px;
            }

            .mock-chips span {
                background: #23262B;
                border: 1px solid #33383F;
                color: #ECEAE3;
                font-size: 10px;
                font-weight: 600;
                padding: 3px 7px;
                border-radius: 6px;
            }

            section {
                max-width: 1080px;
                margin: 0 auto;
                padding: 48px 16px;
            }

            .section-title {
                text-align: center;
                font-size: 22px;
                font-weight: 800;
                letter-spacing: -0.01em;
                margin: 0 0 8px;
            }

            .section-subtitle {
                text-align: center;
                font-size: 14px;
                color: #6E757E;
                margin: 0 auto 32px;
                max-width: 30rem;
            }

            .feature-grid {
                display: grid;
                grid-template-columns: 1fr;
                gap: 16px;
            }

            .feature-card {
                background: rgba(27, 30, 34, 0.6);
                border: 1px solid #33383F;
                border-radius: 16px;
                padding: 20px;
                transition: transform 0.2s ease, border-color 0.2s ease;
            }

            .feature-card:hover {
                transform: translateY(-4px);
                border-color: #4E555D;
            }

            .feature-icon {
                width: 40px;
                height: 40px;
                border-radius: 12px;
                background: rgba(200, 16, 46, 0.1);
                color: #E8354F;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 14px;
            }

            .feature-card h3 {
                margin: 0 0 6px;
                font-size: 15px;
                font-weight: 700;
                color: #fff;
            }

            .feature-card p {
                margin: 0;
                font-size: 13px;
                line-height: 1.55;
                color: #8A9099;
            }

            .tabs {
                display: flex;
                gap: 4px;
                background: #23262B;
                border: 1px solid #33383F;
                border-radius: 12px;
                padding: 4px;
                margin: 0 auto 20px;
                max-width: 30rem;
                overflow-x: auto;
            }

            .tab {
                flex: 1;
                background: none;
                border: none;
                color: #8A9099;
                font-size: 12px;
                font-weight: 600;
                padding: 9px 10px;
                border-radius: 8px;
                cursor: pointer;
                font-family: inherit;
                white-space: nowrap;
            }

            .tab:hover {
                color: #ECEAE3;
            }

            .tab.active {
                background: #C8102E;
                color: #fff;
            }

            .preview-panel {
                max-width: 30rem;
                margin: 0 auto;
                background: #23262B;
                border: 1px solid #33383F;
                border-radius: 16px;
                padding: 20px;
            }

            .preview-day {
                background: rgba(27, 30, 34, 0.6);
                border: 1px solid #33383F;
                border-radius: 12px;
                padding: 14px;
            }

            .preview-day + .preview-day {
                margin-top: 10px;
            }

            .preview-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 8px;
            }

            .preview-title {
                font-size: 14px;
                font-weight: 700;
                color: #fff;
                margin: 6px 0 0;
            }

            .preview-sub {
                font-size: 12px;
                color: #6E757E;
                margin-top: 2px;
            }

            .preview-avatar {
                width: 48px;
                height: 48px;
                border-radius: 999px;
                background: #C8102E;
                color: #fff;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                font-weight: 700;
                flex-shrink: 0;
            }

            .preview-stats {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
                margin-top: 16px;
            }

            .preview-stat {
                background: rgba(27, 30, 34, 0.6);
                border: 1px solid #33383F;
                border-radius: 12px;
                padding: 12px;
                text-align: center;
            }

            .preview-stat strong {
                display: block;
                font-size: 18px;
                color: #E8354F;
            }

            .preview-stat span {
                font-size: 11px;
                color: #6E757E;
            }

            .final-cta {
                text-align: center;
                background: linear-gradient(135deg, rgba(200, 16, 46, 0.12), rgba(27, 30, 34, 0));
                border-top: 1px solid #33383F;
                border-bottom: 1px solid #33383F;
            }

            .final-cta h2 {
                font-size: 22px;
                font-weight: 800;
                margin: 0 0 8px;
            }

            .final-cta p {
                color: #8A9099;
                font-size: 14px;
                margin: 0 0 24px;
            }

            .final-cta .btn {
                display: inline-flex;
                width: auto;
            }

            .footer {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 8px;
                padding: 24px 16px 32px;
                font-size: 12px;
                color: #6E757E;
            }

            .footer a {
                color: #8A9099;
                text-decoration: none;
            }

            .footer a:hover {
                color: #ECEAE3;
            }

            @media (min-width: 640px) {
                .hero {
                    padding: 72px 24px 48px;
                }

                .hero-copy h1 {
                    font-size: 40px;
                }

                .hero-copy p {
                    font-size: 16px;
                }

                .cta-row {
                    flex-direction: row;
                    max-width: none;
                    justify-content: center;
                }

                .feature-grid {
                    grid-template-columns: repeat(2, 1fr);
                }
            }

            @media (min-width: 1024px) {
                .hero-inner {
                    flex-direction: row;
                    text-align: left;
                    align-items: center;
                    justify-content: space-between;
                    gap: 48px;
                }

                .hero-copy {
                    flex: 1;
                }

                .badge,
                .hero-copy p,
                .cta-row {
                    margin-left: 0;
                    margin-right: 0;
                }

                .cta-row {
                    justify-content: flex-start;
                }

                .device {
                    flex-shrink: 0;
                }

                .feature-grid {
                    grid-template-columns: repeat(4, 1fr);
                }
            }
        `;
    }

    private renderPreview(): TemplateResult{
        if (this.activeTab === 'historico') {
            return html`
                <div class="preview-day">
                    <div class="preview-row">
                        <span class="mock-badge">Segunda-feira</span>
                        <span class="mock-date">31/08/2026</span>
                    </div>
                    <p class="preview-title">Perna, Peito e Ombro</p>
                    <p class="preview-sub">1 exercício</p>
                </div>
                <div class="preview-day">
                    <div class="preview-row">
                        <span class="mock-badge">Quarta-feira</span>
                        <span class="mock-date">26/08/2026</span>
                    </div>
                    <p class="preview-title">Costas e Bíceps</p>
                    <p class="preview-sub">3 exercícios</p>
                </div>
            `;
        }
        if (this.activeTab === 'perfil') {
            return html`
                <div class="preview-row">
                    <div class="preview-avatar">VC</div>
                    <div>
                        <p class="preview-title">Você</p>
                        <p class="preview-sub">Seu progresso, num só lugar</p>
                    </div>
                </div>
                <div class="preview-stats">
                    <div class="preview-stat"><strong>12</strong><span>Treinos</span></div>
                    <div class="preview-stat"><strong>34</strong><span>Exercícios</span></div>
                    <div class="preview-stat"><strong>3</strong><span>Meses ativos</span></div>
                    <div class="preview-stat"><strong>2.8</strong><span>Exerc. / treino</span></div>
                </div>
            `;
        }
        return html`
            <div class="preview-day">
                <div class="preview-row">
                    <span class="mock-badge">Segunda-feira</span>
                    <span class="mock-date">31/08/2026</span>
                </div>
                <p class="preview-title">Agachamento</p>
                <p class="preview-sub">4 séries · 8-10 reps</p>
                <div class="mock-chips">
                    <span>50kg</span><span>55kg</span><span>60kg</span><span>65kg</span>
                </div>
            </div>
        `;
    }

    protected override render(): TemplateResult{
        return html`
            <header class="nav">
                <div class="nav-inner">
                    <a class="brand" href="/">
                        <brand-logo height="26"></brand-logo>
                    </a>
                    <a class="enter-link" href="/entrar">Entrar</a>
                </div>
            </header>

            <section class="hero">
                <div class="hero-inner">
                    <div class="hero-copy">
                        <span class="badge">
                            <ui-icon name="check-circle" size="14"></ui-icon>
                            Grátis · Sem anúncios · Dados protegidos e em conformidade com a LGPD
                        </span>
                        <h1>Sua evolução na academia, registrada de verdade</h1>
                        <p>
                            Chega de anotar carga em papel ou perder o fio da meada. Registre cada série do
                            treino, veja sua carga evoluir num gráfico e nunca mais esqueça o que treinou.
                        </p>
                        <div class="cta-row">
                            <a class="btn btn-primary" href="/cadastro">
                                <ui-icon name="plus" size="16"></ui-icon>
                                Criar Conta Grátis
                            </a>
                            <a class="btn btn-ghost" href="/entrar">Já tenho conta</a>
                        </div>
                    </div>
                    <div class="device" aria-hidden="true">
                        <div class="device-bar">
                            <span class="device-dot"></span>
                            <span class="device-dot"></span>
                            <span class="device-dot"></span>
                        </div>
                        <div class="device-body">
                            <div class="mock-card">
                                <div class="mock-badge-row">
                                    <span class="mock-badge">Segunda-feira</span>
                                    <span class="mock-date">31/08/2026</span>
                                </div>
                                <h4>Perna, Peito e Ombro</h4>
                                <div class="mock-exercise">
                                    <div class="mock-exercise-head">
                                        <span>Agachamento</span>
                                        <ui-icon name="chart" size="14"></ui-icon>
                                    </div>
                                    <svg class="mock-chart" viewBox="0 0 200 60" preserveAspectRatio="none">
                                        <polyline points="0,50 40,42 80,38 120,24 160,16 200,8"></polyline>
                                    </svg>
                                    <div class="mock-chips">
                                        <span>50kg</span><span>55kg</span><span>60kg</span><span>65kg</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section class="features">
                <h2 class="section-title">Por que usar o Sobreka?</h2>
                <p class="section-subtitle">Tudo que você precisa pra parar de esquecer sua carga e começar a evoluir de verdade.</p>
                <div class="feature-grid">
                    ${FEATURES.map(feature => html`
                        <div class="feature-card">
                            <div class="feature-icon"><ui-icon name=${feature.icon} size="20"></ui-icon></div>
                            <h3>${feature.title}</h3>
                            <p>${feature.description}</p>
                        </div>
                    `)}
                </div>
            </section>

            <section class="preview-section">
                <h2 class="section-title">Veja como funciona</h2>
                <p class="section-subtitle">Clique nas abas e conheça as telas principais do app.</p>
                <div class="tabs">
                    ${PREVIEW_TABS.map(tab => html`
                        <button
                            class="tab ${this.activeTab === tab.id ? 'active' : ''}"
                            type="button"
                            @click=${() => (this.activeTab = tab.id)}
                        >${tab.label}</button>
                    `)}
                </div>
                <div class="preview-panel">${this.renderPreview()}</div>
            </section>

            <section class="final-cta">
                <h2>Pronto pra registrar seu próximo treino?</h2>
                <p>Leva menos de um minuto pra começar.</p>
                <a class="btn btn-primary" href="/cadastro">
                    <ui-icon name="plus" size="16"></ui-icon>
                    Criar Conta Grátis
                </a>
            </section>

            <footer class="footer">
                <span>Sobreka — sobrecarga progressiva, sem enrolação.</span>
                <a href="/entrar">Já tenho conta, entrar</a>
            </footer>
        `;
    }

}

declare global{
    interface HTMLElementTagNameMap{
        'landing-page': LandingPage
    }
}
