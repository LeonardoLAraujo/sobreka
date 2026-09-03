import {LitElement, html, css, nothing, TemplateResult, CSSResult} from 'lit';
import {customElement, query, queryAll, state} from 'lit/decorators.js';
import {createEmptySplit, WEEKDAY_LABELS, WEEKDAY_ORDER, type SplitCard, type SplitExercise, type Weekday, type WeeklySplit} from '../models/split';
import {getSessionUserId} from '../models/auth';
import {deleteTraining, fetchWeeklySplit, moveTraining, saveTraining} from '../models/trainings';
import AcadMain from '../acad-main';
import '../components/ui-icon';
import '../components/app-modal';
import '../components/toast-notification';
import '../components/confirm-modal';
import type ToastNotification from '../components/toast-notification';

@customElement('weekly-split')
export default class WeeklySplitPage extends LitElement{

    @state() private userId: number | null = null;
    @state() private loading = true;
    @state() private split: WeeklySplit = createEmptySplit();
    @state() private modalOpen = false;
    @state() private targetDay: Weekday | null = null;
    @state() private isNewCard = false;
    @state() private editingCardId: number | null = null;
    @state() private draftTitle = '';
    @state() private draftItems: SplitExercise[] = [];
    @state() private draftItemName = '';
    @state() private draftItemDescription = '';
    @state() private saving = false;
    @state() private draggingDay: Weekday | null = null;
    @state() private draggingCardId: number | null = null;
    @state() private hoverDay: Weekday | null = null;
    @state() private confirmModalOpen = false;
    @state() private confirmDay: Weekday | null = null;
    @state() private confirmCardId: number | null = null;

    @query('.drag-ghost') private ghostEl?: HTMLDivElement;
    @query('#split-title') private titleInput?: HTMLInputElement;
    @query('#split-item-input') private itemInput?: HTMLInputElement;
    @query('toast-notification') private toast!: ToastNotification;
    @queryAll('.day-column') private dayColumns!: NodeListOf<HTMLElement>;

    private dragOffsetX = 0;
    private dragOffsetY = 0;
    private dragWidth = 0;

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
                max-width: 1080px;
                margin: 0 auto;
            }

            @media (min-width: 1280px) {
                .header-inner {
                    max-width: 1440px;
                }
            }

            .header-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                flex-wrap: wrap;
            }

            .create-btn {
                flex-shrink: 0;
                display: flex;
                align-items: center;
                gap: 6px;
                background: #C8102E;
                color: #fff;
                border: none;
                border-radius: 10px;
                padding: 9px 14px;
                font-size: 12px;
                font-weight: 700;
                font-family: inherit;
                cursor: pointer;
            }

            .create-btn:hover:not(:disabled) {
                background: #E8354F;
            }

            .create-btn:disabled {
                opacity: 0.4;
                cursor: not-allowed;
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
                max-width: 1080px;
                width: 100%;
                margin: 0 auto;
                padding: 16px 12px;
            }

            @media (min-width: 640px) {
                main {
                    padding: 24px 16px;
                }
            }

            @media (min-width: 1280px) {
                main {
                    max-width: 1440px;
                }
            }

            .board {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }

            .day-column {
                display: flex;
                align-items: flex-start;
                gap: 10px;
                min-width: 0;
            }

            .day-header {
                flex: 0 0 56px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 11px;
                font-weight: 700;
                letter-spacing: 0.04em;
                text-transform: uppercase;
                color: #8A9099;
                background: rgba(27, 30, 34, 0.6);
                border: 1px solid #33383F;
                border-radius: 10px;
                padding: 10px 4px;
                text-align: center;
                align-self: stretch;
            }

            .day-slot {
                flex: 1;
                min-width: 0;
                display: flex;
                flex-direction: column;
                gap: 8px;
                border-radius: 14px;
                transition: background-color 0.15s ease, border-color 0.15s ease;
                border: 1px dashed transparent;
                min-height: 76px;
            }

            .day-slot.rest {
                flex: 0 0 56px;
                min-height: 56px;
            }

            .day-slot.drop-target {
                border-color: rgba(200, 16, 46, 0.6);
                background: rgba(200, 16, 46, 0.08);
            }

            .add-card {
                width: 100%;
                height: 100%;
                min-height: 56px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 4px;
                background: rgba(27, 30, 34, 0.4);
                border: 1px dashed #33383F;
                border-radius: 14px;
                color: #6E757E;
                font-family: inherit;
                padding: 6px;
                text-align: center;
                cursor: pointer;
            }

            .add-card:hover {
                border-color: #4E555D;
                color: #ECEAE3;
            }

            .add-more-btn {
                width: 100%;
                flex-shrink: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                background: rgba(27, 30, 34, 0.4);
                border: 1px dashed #33383F;
                border-radius: 12px;
                color: #6E757E;
                font-family: inherit;
                font-size: 11px;
                font-weight: 600;
                padding: 8px;
                cursor: pointer;
            }

            .add-more-btn:hover {
                color: #ECEAE3;
                border-color: #4E555D;
                background: #23262B;
            }

            .add-card ui-icon {
                margin-bottom: 2px;
            }

            .add-card .rest-label {
                display: none;
            }

            .rest-label {
                font-size: 13px;
                font-weight: 700;
                color: #ECEAE3;
            }

            @media (min-width: 768px) {
                .board {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    gap: 12px;
                }

                .day-column {
                    flex-direction: column;
                    align-items: stretch;
                }

                .day-header {
                    flex: 0 0 auto;
                    padding: 8px;
                }

                .day-slot {
                    min-height: 130px;
                }

                .day-slot.rest {
                    flex: 1;
                    width: auto;
                    min-height: 130px;
                }

                .add-card {
                    min-height: 130px;
                    padding: 12px;
                }

                .add-card .rest-label {
                    display: block;
                }
            }

            @media (min-width: 1280px) {
                .board {
                    gap: 16px;
                }

                .day-header {
                    font-size: 13px;
                    padding: 10px;
                }

                .day-slot {
                    min-height: 220px;
                }

                .day-slot.rest {
                    min-height: 220px;
                }

                .add-card {
                    min-height: 220px;
                    padding: 16px;
                    gap: 6px;
                }

                .card {
                    padding: 16px;
                }

                .card-icon {
                    width: 28px;
                    height: 28px;
                }

                .card-head h3 {
                    font-size: 15px;
                }

                .card-count {
                    font-size: 11px;
                }

                .card-items li {
                    font-size: 12px;
                }

                .card-items .item-description {
                    font-size: 11px;
                }

                .rest-label {
                    font-size: 14px;
                }
            }

            .card {
                width: 100%;
                flex-shrink: 0;
                display: flex;
                flex-direction: column;
                gap: 10px;
                background: linear-gradient(180deg, rgba(35, 38, 43, 0.85), rgba(27, 30, 34, 0.7));
                border: 1px solid #33383F;
                border-radius: 16px;
                padding: 14px;
                cursor: grab;
                touch-action: none;
                user-select: none;
                box-sizing: border-box;
                transition: border-color 0.15s ease, box-shadow 0.15s ease;
            }

            .card:hover {
                border-color: rgba(200, 16, 46, 0.4);
                box-shadow: 0 8px 20px -12px rgba(0, 0, 0, 0.6);
            }

            .card.dragging {
                opacity: 0.3;
            }

            .card-head {
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                gap: 8px;
            }

            .card-title-row {
                display: flex;
                align-items: center;
                gap: 8px;
                min-width: 0;
                flex: 1;
            }

            .card-icon {
                flex-shrink: 0;
                width: 24px;
                height: 24px;
                border-radius: 8px;
                background: rgba(200, 16, 46, 0.15);
                color: #E8354F;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .card-title-col {
                min-width: 0;
                flex: 1;
            }

            .card-head h3 {
                margin: 0;
                font-size: 13px;
                font-weight: 700;
                color: #fff;
                letter-spacing: -0.01em;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .card-count {
                margin: 1px 0 0;
                font-size: 10px;
                font-weight: 600;
                color: #6E757E;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .card-actions {
                display: flex;
                gap: 2px;
                flex-shrink: 0;
            }

            .card-action {
                display: flex;
                align-items: center;
                justify-content: center;
                background: none;
                border: 1px solid transparent;
                color: #6E757E;
                width: 26px;
                height: 26px;
                border-radius: 8px;
                cursor: pointer;
            }

            .card-action:hover {
                color: #ECEAE3;
                background: #33383F;
                border-color: #4E555D;
            }

            .card-action.danger:hover {
                color: #f87171;
                background: rgba(239, 68, 68, 0.1);
                border-color: rgba(239, 68, 68, 0.3);
            }

            .card-items {
                margin: 0;
                padding: 0;
                list-style: none;
                display: flex;
                flex-direction: column;
                gap: 6px;
                overflow-y: auto;
            }

            .card-items li {
                display: flex;
                align-items: flex-start;
                gap: 8px;
                font-size: 11px;
                color: #ECEAE3;
                background: rgba(27, 30, 34, 0.5);
                border: 1px solid rgba(51, 56, 63, 0.7);
                border-radius: 9px;
                padding: 7px 9px;
            }

            .card-items li::before {
                content: '';
                width: 5px;
                height: 5px;
                margin-top: 5px;
                border-radius: 999px;
                background: #E8354F;
                flex-shrink: 0;
            }

            .item-text-col {
                display: flex;
                flex-direction: column;
                min-width: 0;
            }

            .item-name {
                font-weight: 600;
                color: #ECEAE3;
                overflow-wrap: break-word;
            }

            .card-items .item-description {
                font-size: 10px;
                color: #6E757E;
                margin-top: 1px;
                overflow-wrap: break-word;
            }

            .card-empty {
                margin: 0;
                font-size: 11px;
                font-style: italic;
                color: #475569;
            }

            .drag-ghost {
                position: fixed;
                top: 0;
                left: 0;
                z-index: 60;
                pointer-events: none;
                opacity: 0.95;
                transform: rotate(-2deg);
                box-shadow: 0 20px 35px -10px rgba(0, 0, 0, 0.6);
            }

            .drag-ghost[hidden] {
                display: none;
            }

            .hint {
                margin: 0 0 14px;
                font-size: 12px;
                color: #6E757E;
            }

            .hint a {
                color: #E8354F;
                font-weight: 600;
            }

            form {
                display: flex;
                flex-direction: column;
                gap: 14px;
            }

            label {
                display: block;
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.02em;
                color: #8A9099;
                margin-bottom: 6px;
            }

            input,
            textarea,
            select {
                width: 100%;
                background: #1B1E22;
                border: 1px solid #33383F;
                border-radius: 12px;
                padding: 10px 12px;
                color: #ECEAE3;
                font: inherit;
                box-sizing: border-box;
                resize: vertical;
            }

            input:focus,
            textarea:focus,
            select:focus {
                outline: none;
                border-color: #E8354F;
            }

            .field-hint {
                margin: 4px 0 0;
                font-size: 11px;
                color: #6E757E;
            }

            .item-description-input {
                margin-top: 8px;
            }

            .item-add-btn {
                width: 100%;
                margin-top: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                background: #C8102E;
                color: #fff;
                border: none;
                border-radius: 12px;
                padding: 9px 0;
                font-size: 12px;
                font-weight: 600;
                font-family: inherit;
                cursor: pointer;
            }

            .item-add-btn:hover {
                background: #E8354F;
            }

            .item-list {
                margin: 10px 0 0;
                padding: 0;
                list-style: none;
                display: flex;
                flex-direction: column;
                gap: 6px;
            }

            .item-list li {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 8px;
                background: #1B1E22;
                border: 1px solid #33383F;
                border-radius: 10px;
                padding: 8px 10px;
                font-size: 13px;
                color: #ECEAE3;
            }

            .item-list-text {
                display: flex;
                flex-direction: column;
                min-width: 0;
            }

            .item-list .item-description {
                font-size: 11px;
                color: #6E757E;
                margin-top: 1px;
            }

            .item-remove {
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
                background: none;
                border: none;
                color: #6E757E;
                padding: 2px;
                border-radius: 6px;
                cursor: pointer;
            }

            .item-remove:hover {
                color: #f87171;
                background: rgba(239, 68, 68, 0.08);
            }

            .actions {
                display: flex;
                gap: 12px;
            }

            .actions button {
                flex: 1;
                border-radius: 12px;
                padding: 10px 0;
                font-size: 13px;
                font-weight: 600;
                border: none;
                cursor: pointer;
                font-family: inherit;
            }

            .cancel {
                background: #33383F;
                color: #ECEAE3;
            }

            .cancel:hover {
                background: #4E555D;
            }

            .save {
                background: #C8102E;
                color: #fff;
            }

            .save:hover:not(:disabled) {
                background: #E8354F;
            }

            .save:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }

            h2 {
                margin: 0;
                font-size: 16px;
                font-weight: 700;
                color: #fff;
            }
        `;
    }

    protected override firstUpdated(): void{
        void this.loadSplit();
    }

    private async loadSplit(): Promise<void>{
        const userId = getSessionUserId();
        this.userId = userId;
        if (userId === null) {
            this.loading = false;
            return;
        }
        this.loading = true;
        AcadMain.instance?.showLoading();
        try {
            this.split = await fetchWeeklySplit(userId);
        } catch {
            this.toast?.show('Não foi possível carregar sua divisão semanal.', 'erro');
        } finally {
            this.loading = false;
            AcadMain.instance?.hideLoading();
        }
    }

    private openCreateModal(day: Weekday = 'seg'): void{
        this.targetDay = day;
        this.isNewCard = true;
        this.editingCardId = null;
        this.draftTitle = '';
        this.draftItems = [];
        this.draftItemName = '';
        this.draftItemDescription = '';
        this.modalOpen = true;
        requestAnimationFrame(() => this.titleInput?.focus());
    }

    private openEditModal(day: Weekday, card: SplitCard): void{
        this.targetDay = day;
        this.isNewCard = false;
        this.editingCardId = card.id;
        this.draftTitle = card.title;
        this.draftItems = card.items;
        this.draftItemName = '';
        this.draftItemDescription = '';
        this.modalOpen = true;
        requestAnimationFrame(() => this.titleInput?.focus());
    }

    private closeModal(): void{
        this.modalOpen = false;
        this.targetDay = null;
        this.isNewCard = false;
        this.editingCardId = null;
    }

    private addDraftItem(): void{
        const name = this.draftItemName.trim();
        if (!name) {
            return;
        }
        const description = this.draftItemDescription.trim();
        this.draftItems = [...this.draftItems, {name, description: description || undefined}];
        this.draftItemName = '';
        this.draftItemDescription = '';
        this.itemInput?.focus();
    }

    private removeDraftItem(index: number): void{
        this.draftItems = this.draftItems.filter((_, itemIndex) => itemIndex !== index);
    }

    private handleItemInputKeydown(event: KeyboardEvent): void{
        if (event.key === 'Enter') {
            event.preventDefault();
            this.addDraftItem();
        }
    }

    private async saveCard(event: Event): Promise<void>{
        event.preventDefault();
        const day = this.targetDay;
        const title = this.draftTitle.trim();
        if (!day || !title || this.userId === null) {
            return;
        }
        this.saving = true;
        AcadMain.instance?.showLoading();
        try {
            const card = await saveTraining(this.userId, {
                trainingId: this.isNewCard ? null : this.editingCardId,
                title,
                weekday: day,
                items: this.draftItems,
            });
            this.split = {
                ...this.split,
                [day]: this.isNewCard
                    ? [...this.split[day], card]
                    : this.split[day].map(existing => existing.id === card.id ? card : existing),
            };
            this.closeModal();
        } catch {
            this.toast?.show('Não foi possível salvar o treino. Tente novamente.', 'erro');
        } finally {
            this.saving = false;
            AcadMain.instance?.hideLoading();
        }
    }

    private requestRemoveCard(day: Weekday, cardId: number): void{
        this.confirmDay = day;
        this.confirmCardId = cardId;
        this.confirmModalOpen = true;
    }

    private closeConfirmModal(): void{
        this.confirmModalOpen = false;
        this.confirmDay = null;
        this.confirmCardId = null;
    }

    private confirmRemoveCard(): void{
        const day = this.confirmDay;
        const cardId = this.confirmCardId;
        this.closeConfirmModal();
        if (day && cardId !== null) {
            void this.removeCard(day, cardId);
        }
    }

    private async removeCard(day: Weekday, cardId: number): Promise<void>{
        if (this.userId === null) {
            return;
        }
        const previous = this.split;
        this.split = {...this.split, [day]: this.split[day].filter(card => card.id !== cardId)};
        AcadMain.instance?.showLoading();
        try {
            await deleteTraining(this.userId, cardId);
        } catch {
            this.split = previous;
            this.toast?.show('Não foi possível remover o treino.', 'erro');
        } finally {
            AcadMain.instance?.hideLoading();
        }
    }

    private async duplicateCard(day: Weekday, card: SplitCard): Promise<void>{
        if (this.userId === null) {
            return;
        }
        AcadMain.instance?.showLoading();
        try {
            const duplicated = await saveTraining(this.userId, {
                trainingId: null,
                title: `${card.title} (cópia)`,
                weekday: day,
                items: card.items.map(item => ({name: item.name, description: item.description})),
            });
            this.split = {...this.split, [day]: [...this.split[day], duplicated]};
            this.toast?.show('Treino duplicado.', 'sucesso');
        } catch {
            this.toast?.show('Não foi possível duplicar o treino.', 'erro');
        } finally {
            AcadMain.instance?.hideLoading();
        }
    }

    private findColumnAt(x: number, y: number): Weekday | null{
        for (const column of this.dayColumns) {
            const rect = column.getBoundingClientRect();
            if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
                return column.dataset.weekday as Weekday;
            }
        }
        return null;
    }

    private positionGhost(clientX: number, clientY: number): void{
        if (!this.ghostEl) {
            return;
        }
        this.ghostEl.style.left = `${clientX - this.dragOffsetX}px`;
        this.ghostEl.style.top = `${clientY - this.dragOffsetY}px`;
        this.ghostEl.style.width = `${this.dragWidth}px`;
    }

    private startDrag(event: PointerEvent, day: Weekday, cardId: number): void{
        if ((event.target as HTMLElement).closest('.card-action')) {
            return;
        }
        const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
        this.dragOffsetX = event.clientX - rect.left;
        this.dragOffsetY = event.clientY - rect.top;
        this.dragWidth = rect.width;
        this.draggingDay = day;
        this.draggingCardId = cardId;
        this.positionGhost(event.clientX, event.clientY);
        window.addEventListener('pointermove', this.onPointerMove);
        window.addEventListener('pointerup', this.onPointerUp);
    }

    private onPointerMove = (event: PointerEvent): void => {
        if (this.draggingDay === null) {
            return;
        }
        this.positionGhost(event.clientX, event.clientY);
        this.hoverDay = this.findColumnAt(event.clientX, event.clientY);
    };

    private onPointerUp = (): void => {
        window.removeEventListener('pointermove', this.onPointerMove);
        window.removeEventListener('pointerup', this.onPointerUp);
        const fromDay = this.draggingDay;
        const cardId = this.draggingCardId;
        const toDay = this.hoverDay;
        this.draggingDay = null;
        this.draggingCardId = null;
        this.hoverDay = null;
        if (fromDay && cardId !== null && toDay && fromDay !== toDay) {
            void this.moveCardToDay(fromDay, toDay, cardId);
        }
    };

    private async moveCardToDay(fromDay: Weekday, toDay: Weekday, cardId: number): Promise<void>{
        if (this.userId === null) {
            return;
        }
        const previous = this.split;
        const card = previous[fromDay].find(existing => existing.id === cardId);
        if (!card) {
            return;
        }
        this.split = {
            ...previous,
            [fromDay]: previous[fromDay].filter(existing => existing.id !== cardId),
            [toDay]: [...previous[toDay], card],
        };
        AcadMain.instance?.showLoading();
        try {
            await moveTraining(this.userId, cardId, toDay);
        } catch {
            this.split = previous;
            this.toast?.show('Não foi possível mover o treino.', 'erro');
        } finally {
            AcadMain.instance?.hideLoading();
        }
    }

    private renderDaySlot(day: Weekday): TemplateResult{
        const cards = this.split[day];
        if (cards.length === 0) {
            return html`
                <button class="add-card" type="button" title="Adicionar treino" @click=${() => this.openCreateModal(day)}>
                    <ui-icon name="moon" size="18"></ui-icon>
                    <span class="rest-label">Descanso</span>
                </button>
            `;
        }
        return html`
            ${cards.map(card => this.renderCard(day, card))}
            <button class="add-more-btn" type="button" title="Adicionar outro treino" @click=${() => this.openCreateModal(day)}>
                <ui-icon name="plus" size="12"></ui-icon>
                <span>Adicionar treino</span>
            </button>
        `;
    }

    private renderCard(day: Weekday, card: SplitCard): TemplateResult{
        return html`
            <div
                class="card ${this.draggingDay === day && this.draggingCardId === card.id ? 'dragging' : ''}"
                @pointerdown=${(event: PointerEvent) => this.startDrag(event, day, card.id)}
            >
                <div class="card-head">
                    <div class="card-title-row">
                        <span class="card-icon"><ui-icon name="dumbbell" size="13"></ui-icon></span>
                        <div class="card-title-col">
                            <h3 title=${card.title}>${card.title}</h3>
                            <p class="card-count">${card.items.length} exercício${card.items.length === 1 ? '' : 's'}</p>
                        </div>
                    </div>
                    <div class="card-actions">
                        <button class="card-action" type="button" title="Editar" @click=${() => this.openEditModal(day, card)}>
                            <ui-icon name="edit" size="13"></ui-icon>
                        </button>
                        <button class="card-action" type="button" title="Duplicar" @click=${() => this.duplicateCard(day, card)}>
                            <ui-icon name="copy" size="13"></ui-icon>
                        </button>
                        <button class="card-action danger" type="button" title="Remover" @click=${() => this.requestRemoveCard(day, card.id)}>
                            <ui-icon name="trash" size="13"></ui-icon>
                        </button>
                    </div>
                </div>
                ${card.items.length ? html`
                    <ul class="card-items">
                        ${card.items.map(item => html`
                            <li>
                                <div class="item-text-col">
                                    <span class="item-name">${item.name}</span>
                                    ${item.description ? html`<span class="item-description">${item.description}</span>` : nothing}
                                </div>
                            </li>
                        `)}
                    </ul>
                ` : html`<p class="card-empty">Nenhum exercício cadastrado</p>`}
            </div>
        `;
    }

    protected override render(): TemplateResult{
        const draggingCard = this.draggingDay && this.draggingCardId !== null
            ? this.split[this.draggingDay].find(card => card.id === this.draggingCardId) ?? null
            : null;
        return html`
            <header>
                <div class="header-inner">
                    <div class="header-row">
                        <div>
                            <h1>Divisão Semanal</h1>
                            <p>Organize seu treino por dia da semana</p>
                        </div>
                        <button
                            class="create-btn"
                            type="button"
                            ?disabled=${this.userId === null}
                            title="Criar treino"
                            @click=${() => this.openCreateModal()}
                        >
                            <ui-icon name="plus" size="14"></ui-icon>
                            Criar treino
                        </button>
                    </div>
                </div>
            </header>

            <main>
                ${this.userId === null ? html`
                    <p class="hint">Faça <a href="/entrar">login</a> para gerenciar sua divisão semanal.</p>
                ` : this.loading ? html`
                    <p class="hint">Carregando sua divisão semanal...</p>
                ` : html`
                    <p class="hint">Toque em um card e arraste para outro dia para movê-lo. Cada dia aceita mais de um treino.</p>
                    <div class="board">
                        ${WEEKDAY_ORDER.map(day => html`
                            <div class="day-column" data-weekday=${day}>
                                <div class="day-header">${WEEKDAY_LABELS[day]}</div>
                                <div class="day-slot ${this.split[day].length === 0 ? 'rest' : ''} ${this.hoverDay === day && this.draggingDay !== day ? 'drop-target' : ''}">
                                    ${this.renderDaySlot(day)}
                                </div>
                            </div>
                        `)}
                    </div>
                `}
            </main>

            <div class="drag-ghost" ?hidden=${!draggingCard}>
                ${draggingCard ? html`
                    <div class="card">
                        <div class="card-head">
                            <div class="card-title-row">
                                <span class="card-icon"><ui-icon name="dumbbell" size="13"></ui-icon></span>
                                <div class="card-title-col">
                                    <h3>${draggingCard.title}</h3>
                                    <p class="card-count">${draggingCard.items.length} exercício${draggingCard.items.length === 1 ? '' : 's'}</p>
                                </div>
                            </div>
                        </div>
                        ${draggingCard.items.length ? html`
                            <ul class="card-items">
                                ${draggingCard.items.map(item => html`
                                    <li>
                                        <div class="item-text-col">
                                            <span class="item-name">${item.name}</span>
                                            ${item.description ? html`<span class="item-description">${item.description}</span>` : nothing}
                                        </div>
                                    </li>
                                `)}
                            </ul>
                        ` : nothing}
                    </div>
                ` : nothing}
            </div>

            <app-modal ?open=${this.modalOpen} @close=${() => this.closeModal()}>
                <h2 slot="title">${this.isNewCard ? 'Novo treino' : `Treino de ${this.targetDay ? WEEKDAY_LABELS[this.targetDay] : ''}`}</h2>
                <form @submit=${(event: Event) => this.saveCard(event)}>
                    ${this.isNewCard ? html`
                        <div>
                            <label for="split-day">Dia da semana</label>
                            <select
                                id="split-day"
                                .value=${this.targetDay ?? ''}
                                @change=${(event: Event) => (this.targetDay = (event.target as HTMLSelectElement).value as Weekday)}
                            >
                                ${WEEKDAY_ORDER.map(day => html`<option value=${day}>${WEEKDAY_LABELS[day]}</option>`)}
                            </select>
                        </div>
                    ` : nothing}
                    <div>
                        <label for="split-title">Nome do treino</label>
                        <input
                            id="split-title"
                            type="text"
                            required
                            autocomplete="off"
                            placeholder="Ex: Perna/Abs"
                            .value=${this.draftTitle}
                            @input=${(event: Event) => (this.draftTitle = (event.target as HTMLInputElement).value)}
                        >
                    </div>
                    <div>
                        <label for="split-item-input">Exercícios</label>
                        <input
                            id="split-item-input"
                            type="text"
                            autocomplete="off"
                            placeholder="Ex: Agachamento"
                            .value=${this.draftItemName}
                            @input=${(event: Event) => (this.draftItemName = (event.target as HTMLInputElement).value)}
                            @keydown=${(event: KeyboardEvent) => this.handleItemInputKeydown(event)}
                        >
                        <input
                            id="split-item-description"
                            type="text"
                            class="item-description-input"
                            autocomplete="off"
                            placeholder="Descrição (opcional)"
                            .value=${this.draftItemDescription}
                            @input=${(event: Event) => (this.draftItemDescription = (event.target as HTMLInputElement).value)}
                            @keydown=${(event: KeyboardEvent) => this.handleItemInputKeydown(event)}
                        >
                        <button class="item-add-btn" type="button" @click=${() => this.addDraftItem()}>
                            <ui-icon name="plus" size="14"></ui-icon>
                            Adicionar exercício
                        </button>
                        ${this.draftItems.length ? html`
                            <ul class="item-list">
                                ${this.draftItems.map((item, index) => html`
                                    <li>
                                        <span class="item-list-text">
                                            <span class="item-name">${item.name}</span>
                                            ${item.description ? html`<span class="item-description">${item.description}</span>` : nothing}
                                        </span>
                                        <button class="item-remove" type="button" title="Remover" @click=${() => this.removeDraftItem(index)}>
                                            <ui-icon name="close" size="12"></ui-icon>
                                        </button>
                                    </li>
                                `)}
                            </ul>
                        ` : html`
                            <p class="field-hint">Adicione os exercícios um por um (opcional)</p>
                        `}
                    </div>
                    <div class="actions">
                        <button class="cancel" type="button" @click=${() => this.closeModal()}>Cancelar</button>
                        <button class="save" type="submit" ?disabled=${this.saving}>${this.saving ? 'Salvando...' : 'Salvar'}</button>
                    </div>
                </form>
            </app-modal>

            <confirm-modal
                .open=${this.confirmModalOpen}
                titleText="Excluir treino?"
                message="Isso vai remover o treino e seus exercícios cadastrados nesse dia."
                @close=${() => this.closeConfirmModal()}
                @confirm=${() => this.confirmRemoveCard()}
            ></confirm-modal>

            <toast-notification></toast-notification>
        `;
    }

}

declare global{
    interface HTMLElementTagNameMap{
        'weekly-split': WeeklySplitPage
    }
}
