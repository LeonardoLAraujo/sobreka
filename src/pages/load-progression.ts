import {LitElement, html, css, TemplateResult, CSSResult} from 'lit';
import {customElement, query, state} from 'lit/decorators.js';
import type {ExerciseHistoryEntry, MonthlyWorkouts, WorkoutDay} from '../models/progress';
import {MONTH_NAMES} from '../models/constants';
import {getSessionUserId} from '../models/auth';
import {deleteExerciceProgress, deleteTrainingProgress, fetchTrainingProgress, saveExerciceProgress, saveTrainingProgress} from '../models/trainingProgress';
import AcadMain from '../acad-main';
import '../components/workout-header';
import '../components/workout-day-card';
import '../components/workout-detail-modal';
import '../components/day-form-modal';
import '../components/exercise-form-modal';
import '../components/history-modal';
import '../components/json-modal';
import '../components/confirm-modal';
import '../components/toast-notification';
import '../components/ui-icon';
import type {DayActionDetail} from '../components/workout-day-card';
import type {ExerciseActionDetail} from '../components/exercise-item';
import type {DayFormSaveDetail} from '../components/day-form-modal';
import type {ExerciseFormSaveDetail} from '../components/exercise-form-modal';
import type ToastNotification from '../components/toast-notification';


@customElement('load-progression')
export default class LoadProgression extends LitElement{

    @state() private userId: number | null = null;
    @state() private loading = true;
    @state() private monthlyData: MonthlyWorkouts = {};
    @state() private year = new Date().getFullYear();
    @state() private month = new Date().getMonth();

    @state() private dayModalOpen = false;
    @state() private editingDay: WorkoutDay | null = null;

    @state() private detailModalOpen = false;
    @state() private detailDay: WorkoutDay | null = null;

    @state() private exerciseModalOpen = false;
    @state() private editingExerciseDayId: string | null = null;
    @state() private editingExerciseKey: string | null = null;
    @state() private editingExercise: import('../models/progress').Exercise | null = null;

    @state() private historyModalOpen = false;
    @state() private historyExerciseName = '';
    @state() private historySubtitle = '';
    @state() private historyEntries: ExerciseHistoryEntry[] = [];

    @state() private jsonModalOpen = false;

    @state() private confirmModalOpen = false;
    @state() private confirmTitle = '';
    @state() private confirmMessage = '';
    private confirmAction: (() => void) | null = null;

    @query('toast-notification') private toast!: ToastNotification;

    static override get styles(): CSSResult{
        return css`
            :host {
                display: flex;
                flex-direction: column;
                min-height: 100%;
                background: #1B1E22;
                color: #ECEAE3;
            }

            main {
                flex: 1;
                max-width: 960px;
                width: 100%;
                margin: 0 auto;
                padding: 16px 12px;
                box-sizing: border-box;
            }

            .grid {
                display: grid;
                grid-template-columns: 1fr;
                gap: 16px;
            }

            @media (min-width: 640px) {
                main {
                    padding: 24px 16px;
                }

                .grid {
                    gap: 24px;
                }
            }

            @media (min-width: 768px) {
                .grid {
                    grid-template-columns: 1fr 1fr;
                }
            }

            .empty-state {
                text-align: center;
                padding: 40px 20px;
                background: rgba(35, 38, 43, 0.5);
                border: 1px solid rgba(51, 56, 63, 0.8);
                border-radius: 16px;
                box-sizing: border-box;
            }

            @media (min-width: 480px) {
                .empty-state {
                    padding: 64px 32px;
                }
            }

            .empty-icon {
                width: 64px;
                height: 64px;
                border-radius: 999px;
                background: #33383F;
                color: #6E757E;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 16px;
            }

            .empty-state h3 {
                margin: 0;
                font-size: 16px;
                font-weight: 600;
                color: #ECEAE3;
            }

            .empty-state p {
                max-width: 22rem;
                margin: 4px auto 24px;
                font-size: 13px;
                color: #6E757E;
            }

            .empty-state p a {
                color: #E8354F;
                font-weight: 600;
            }

            .empty-state button {
                background: #C8102E;
                color: #fff;
                border: none;
                border-radius: 12px;
                padding: 10px 20px;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
                font-family: inherit;
            }

            .empty-state button:hover {
                background: #E8354F;
            }
        `;
    }

    protected override firstUpdated(): void{
        void this.loadData();
    }

    private monthKey(): string{
        return `${this.year}-${String(this.month + 1).padStart(2, '0')}`;
    }

    private get currentDays(): WorkoutDay[]{
        return [...(this.monthlyData[this.monthKey()] ?? [])].sort((a, b) => b.date.localeCompare(a.date));
    }

    private async loadData(): Promise<void>{
        const userId = getSessionUserId();
        this.userId = userId;
        if (userId === null) {
            this.loading = false;
            return;
        }
        this.loading = true;
        AcadMain.instance?.showLoading();
        try {
            this.monthlyData = await fetchTrainingProgress(userId);
        } catch {
            this.toast?.show('Não foi possível carregar seus treinos.', 'erro');
        } finally {
            this.loading = false;
            AcadMain.instance?.hideLoading();
        }
    }

    private prevMonth(): void{
        this.month -= 1;
        if (this.month < 0) {
            this.month = 11;
            this.year -= 1;
        }
    }

    private nextMonth(): void{
        this.month += 1;
        if (this.month > 11) {
            this.month = 0;
            this.year += 1;
        }
    }

    private openAddDay(): void{
        this.editingDay = null;
        this.dayModalOpen = true;
    }

    private openEditDay(event: CustomEvent<DayActionDetail>): void{
        this.editingDay = this.currentDays.find(d => d.id === event.detail.dayId) ?? null;
        this.dayModalOpen = true;
    }

    private openDayDetail(event: CustomEvent<DayActionDetail>): void{
        this.detailDay = this.currentDays.find(d => d.id === event.detail.dayId) ?? null;
        this.detailModalOpen = true;
    }

    private async saveDay(event: CustomEvent<DayFormSaveDetail>): Promise<void>{
        const {id, date, trainingId} = event.detail;
        if (this.userId === null) {
            return;
        }
        AcadMain.instance?.showLoading();
        try {
            await saveTrainingProgress(this.userId, {
                id: id ? Number(id) : null,
                trainingId,
                date,
            });
            await this.loadData();
            this.dayModalOpen = false;
            this.toast.show(id ? 'Treino atualizado com sucesso!' : 'Treino criado com sucesso!');
        } catch {
            this.toast.show('Não foi possível salvar o treino. Tente novamente.', 'erro');
        } finally {
            AcadMain.instance?.hideLoading();
        }
    }

    private requestDeleteDay(event: CustomEvent<DayActionDetail>): void{
        const {dayId} = event.detail;
        this.confirmTitle = 'Excluir Treino?';
        this.confirmMessage = 'Isso apagará o dia e todos os exercícios associados neste mês.';
        this.confirmAction = () => void this.deleteDay(dayId);
        this.confirmModalOpen = true;
    }

    private async deleteDay(dayId: string): Promise<void>{
        if (this.userId === null) {
            return;
        }
        AcadMain.instance?.showLoading();
        try {
            await deleteTrainingProgress(this.userId, Number(dayId));
            await this.loadData();
            this.toast.show('Treino excluído.');
        } catch {
            this.toast.show('Não foi possível excluir o treino.', 'erro');
        } finally {
            AcadMain.instance?.hideLoading();
        }
    }

    private openAddExercise(event: CustomEvent<DayActionDetail>): void{
        this.editingExerciseDayId = event.detail.dayId;
        this.editingExerciseKey = null;
        this.editingExercise = null;
        this.exerciseModalOpen = true;
    }

    private get editingExerciseTrainingId(): number | null{
        const day = this.currentDays.find(d => d.id === this.editingExerciseDayId);
        return day?.trainingId ?? null;
    }

    private openEditExercise(event: CustomEvent<ExerciseActionDetail>): void{
        const {dayId, exerciseKey} = event.detail;
        const day = this.currentDays.find(d => d.id === dayId);
        this.editingExerciseDayId = dayId;
        this.editingExerciseKey = exerciseKey;
        this.editingExercise = day?.exercises[exerciseKey] ?? null;
        this.exerciseModalOpen = true;
    }

    private async saveExercise(event: CustomEvent<ExerciseFormSaveDetail>): Promise<void>{
        const {dayId, exerciseKey, exerciceId, repitions, rest, description, seriesRows} = event.detail;
        if (this.userId === null) {
            return;
        }
        AcadMain.instance?.showLoading();
        try {
            const cargaBase = seriesRows[0]?.carga ?? 0;
            await saveExerciceProgress(this.userId, {
                id: exerciseKey ? Number(exerciseKey) : null,
                trainingsProgressId: Number(dayId),
                exerciceId,
                padraoRepeticao: repitions.replace(/\s*reps\s*$/i, '').trim(),
                tempoDescanso: rest,
                cargaBase,
                descricao: description,
                series: seriesRows,
            });
            await this.loadData();
            this.exerciseModalOpen = false;
            this.toast.show('Exercício salvo com sucesso!');
        } catch {
            this.toast.show('Não foi possível salvar o exercício. Tente novamente.', 'erro');
        } finally {
            AcadMain.instance?.hideLoading();
        }
    }

    private requestDeleteExercise(event: CustomEvent<ExerciseActionDetail>): void{
        const {dayId, exerciseKey} = event.detail;
        this.confirmTitle = 'Excluir Exercício?';
        this.confirmMessage = 'O exercício e todo o seu histórico serão removidos.';
        this.confirmAction = () => void this.deleteExercise(dayId, exerciseKey);
        this.confirmModalOpen = true;
    }

    private async deleteExercise(_dayId: string, exerciseKey: string): Promise<void>{
        if (this.userId === null) {
            return;
        }
        AcadMain.instance?.showLoading();
        try {
            await deleteExerciceProgress(this.userId, Number(exerciseKey));
            await this.loadData();
            this.toast.show('Exercício removido.');
        } catch {
            this.toast.show('Não foi possível remover o exercício.', 'erro');
        } finally {
            AcadMain.instance?.hideLoading();
        }
    }

    private openHistory(event: CustomEvent<ExerciseActionDetail>): void{
        const {dayId, exerciseKey} = event.detail;
        const day = this.currentDays.find(d => d.id === dayId);
        const exercise = day?.exercises[exerciseKey];
        if (!day || !exercise) {
            return;
        }
        this.historyExerciseName = exercise.name;
        this.historySubtitle = `Evolução de carga - ${day.day} (${MONTH_NAMES[this.month]})`;
        this.historyEntries = exercise.historico ?? [];
        this.historyModalOpen = true;
    }

    private get jsonText(): string{
        return JSON.stringify(this.currentDays, null, 4);
    }

    private closeConfirmModal(): void{
        this.confirmModalOpen = false;
        this.confirmAction = null;
    }

    private confirmDeletion(): void{
        this.confirmAction?.();
        this.closeConfirmModal();
    }

    protected override render(): TemplateResult{
        const days = this.currentDays;
        return html`
            <workout-header
                .month=${this.month}
                .year=${this.year}
                @prev-month=${() => this.prevMonth()}
                @next-month=${() => this.nextMonth()}
                @open-json=${() => (this.jsonModalOpen = true)}
                @add-day=${() => this.openAddDay()}
            ></workout-header>

            <main>
                ${this.userId === null ? html`
                    <div class="empty-state">
                        <div class="empty-icon"><ui-icon name="calendar" size="24"></ui-icon></div>
                        <h3>Faça login para continuar</h3>
                        <p>Entre na sua conta para ver e registrar seus treinos.</p>
                        <a href="/entrar"><button type="button">Entrar</button></a>
                    </div>
                ` : this.loading ? html`
                    <div class="empty-state">
                        <div class="empty-icon"><ui-icon name="calendar" size="24"></ui-icon></div>
                        <h3>Carregando seus treinos...</h3>
                    </div>
                ` : days.length === 0 ? html`
                    <div class="empty-state">
                        <div class="empty-icon"><ui-icon name="calendar" size="24"></ui-icon></div>
                        <h3>Nenhum treino cadastrado neste mês</h3>
                        <p>Comece adicionando os dias da semana e os treinos correspondentes para este mês.</p>
                        <button type="button" @click=${() => this.openAddDay()}>Criar Treino no Mês</button>
                    </div>
                ` : html`
                    <div class="grid">
                        ${days.map(day => html`
                            <workout-day-card
                                .day=${day}
                                @edit-day=${(event: CustomEvent<DayActionDetail>) => this.openEditDay(event)}
                                @delete-day=${(event: CustomEvent<DayActionDetail>) => this.requestDeleteDay(event)}
                                @add-exercise=${(event: CustomEvent<DayActionDetail>) => this.openAddExercise(event)}
                                @edit-exercise=${(event: CustomEvent<ExerciseActionDetail>) => this.openEditExercise(event)}
                                @delete-exercise=${(event: CustomEvent<ExerciseActionDetail>) => this.requestDeleteExercise(event)}
                                @view-history=${(event: CustomEvent<ExerciseActionDetail>) => this.openHistory(event)}
                                @view-day=${(event: CustomEvent<DayActionDetail>) => this.openDayDetail(event)}
                            ></workout-day-card>
                        `)}
                    </div>
                `}
            </main>

            <workout-detail-modal
                .open=${this.detailModalOpen}
                .day=${this.detailDay}
                @close=${() => (this.detailModalOpen = false)}
            ></workout-detail-modal>

            <day-form-modal
                .open=${this.dayModalOpen}
                .editingDay=${this.editingDay}
                @close=${() => (this.dayModalOpen = false)}
                @save=${(event: CustomEvent<DayFormSaveDetail>) => this.saveDay(event)}
            ></day-form-modal>

            <exercise-form-modal
                .open=${this.exerciseModalOpen}
                .editingExercise=${this.editingExercise}
                .editingKey=${this.editingExerciseKey}
                .dayId=${this.editingExerciseDayId}
                .trainingId=${this.editingExerciseTrainingId}
                @close=${() => (this.exerciseModalOpen = false)}
                @save=${(event: CustomEvent<ExerciseFormSaveDetail>) => this.saveExercise(event)}
            ></exercise-form-modal>

            <history-modal
                .open=${this.historyModalOpen}
                .exerciseName=${this.historyExerciseName}
                .subtitle=${this.historySubtitle}
                .history=${this.historyEntries}
                @close=${() => (this.historyModalOpen = false)}
            ></history-modal>

            <json-modal
                .open=${this.jsonModalOpen}
                .jsonText=${this.jsonText}
                @close=${() => (this.jsonModalOpen = false)}
            ></json-modal>

            <confirm-modal
                .open=${this.confirmModalOpen}
                .titleText=${this.confirmTitle}
                .message=${this.confirmMessage}
                @close=${() => this.closeConfirmModal()}
                @confirm=${() => this.confirmDeletion()}
            ></confirm-modal>

            <toast-notification></toast-notification>
        `;
    }

}

declare global{
    interface HTMLElementTagNameMap{
        'load-progression': LoadProgression
    }
}
