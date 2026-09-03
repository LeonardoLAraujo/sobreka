import {LitElement, html, css, nothing, PropertyValues, TemplateResult, CSSResult} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {unsafeSVG} from 'lit/directives/unsafe-svg.js';
import './app-modal';
import './ui-icon';

export interface ProfileSaveDetail {
    name: string;
    avatarPhoto: string | null;
}

@customElement('edit-profile-modal')
export default class EditProfileModal extends LitElement{

    @property({type: Boolean}) open = false;
    @property({type: String}) name = '';
    @property({type: String}) avatarSvg: string | null = null;

    @state() private draftName = '';
    @state() private draftAvatar: string | null = null;
    @state() private avatarLoading = false;
    @state() private pickerOpen = false;
    @state() private avatarOptions: string[] = [];

    static override get styles(): CSSResult{
        return css`
            .body {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 16px;
            }

            .avatar-wrap {
                position: relative;
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
                padding: 0;
                cursor: pointer;
                font-family: inherit;
            }

            .avatar:hover {
                border-color: rgba(200, 16, 46, 0.55);
            }

            .avatar svg {
                display: block;
                width: 100%;
                height: 100%;
            }

            .shuffle-btn {
                position: absolute;
                right: -2px;
                bottom: -2px;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #C8102E;
                color: #fff;
                border: 3px solid #23262B;
                border-radius: 999px;
                cursor: pointer;
                padding: 0;
            }

            .shuffle-btn:hover {
                background: #E8354F;
            }

            .shuffle-btn:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }

            .shuffle-btn ui-icon.spin {
                animation: spin 0.8s linear infinite;
            }

            @keyframes spin {
                to {
                    transform: rotate(360deg);
                }
            }

            .picker {
                width: 100%;
                background: #1B1E22;
                border: 1px solid #33383F;
                border-radius: 14px;
                padding: 12px;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }

            .picker-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 8px;
            }

            .picker-option {
                width: 100%;
                aspect-ratio: 1;
                border-radius: 999px;
                background: #C8102E;
                border: 2px solid #33383F;
                padding: 0;
                cursor: pointer;
                overflow: hidden;
            }

            .picker-option:hover {
                border-color: rgba(200, 16, 46, 0.55);
            }

            .picker-option.active {
                border-color: #E8354F;
            }

            .picker-option svg {
                display: block;
                width: 100%;
                height: 100%;
            }

            .picker-refresh {
                align-self: center;
                display: flex;
                align-items: center;
                gap: 6px;
                background: none;
                border: none;
                color: #E8354F;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                font-family: inherit;
                padding: 4px;
            }

            .picker-refresh:hover {
                color: #E8354F;
            }

            .picker-refresh:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }

            .picker-refresh ui-icon.spin {
                animation: spin 0.8s linear infinite;
            }

            .field {
                width: 100%;
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

            .actions {
                display: flex;
                gap: 12px;
                width: 100%;
                margin-top: 4px;
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

            .save:hover {
                background: #E8354F;
            }

            h3 {
                margin: 0;
                font-size: 16px;
                font-weight: 700;
                color: #fff;
            }
        `;
    }

    protected override updated(changed: PropertyValues): void{
        if (changed.has('open') && this.open) {
            this.draftName = this.name;
            this.draftAvatar = this.avatarSvg;
            this.pickerOpen = false;
            this.avatarOptions = [];
        }
    }

    private get initials(): string{
        const trimmed = this.draftName.trim();
        if (!trimmed) {
            return '?';
        }
        return trimmed
            .split(/\s+/)
            .slice(0, 2)
            .map(part => part[0]?.toUpperCase() ?? '')
            .join('');
    }

    private togglePicker(): void{
        this.pickerOpen = !this.pickerOpen;
        if (this.pickerOpen && this.avatarOptions.length === 0) {
            void this.loadAvatarOptions();
        }
    }

    private async loadAvatarOptions(): Promise<void>{
        this.avatarLoading = true;
        try {
            const requests = Array.from({length: 8}, () => {
                const seed = Math.random().toString(36).slice(2);
                return fetch(`https://api.dicebear.com/10.x/sprouts/svg?seed=${seed}`).then(response => response.text());
            });
            this.avatarOptions = await Promise.all(requests);
        } catch {
            // mantém as opções anteriores se a busca falhar
        } finally {
            this.avatarLoading = false;
        }
    }

    private selectAvatar(svg: string): void{
        this.draftAvatar = svg;
        this.pickerOpen = false;
    }

    private close(): void{
        this.dispatchEvent(new CustomEvent('close', {bubbles: true, composed: true}));
    }

    private submit(event: Event): void{
        event.preventDefault();
        this.dispatchEvent(new CustomEvent<ProfileSaveDetail>('save', {
            detail: {name: this.draftName.trim(), avatarPhoto: this.draftAvatar},
            bubbles: true,
            composed: true,
        }));
    }

    protected override render(): TemplateResult{
        return html`
            <app-modal ?open=${this.open} @close=${() => this.close()}>
                <h3 slot="title">Editar Perfil</h3>
                <form class="body" @submit=${(event: Event) => this.submit(event)}>
                    <div class="avatar-wrap">
                        <button
                            class="avatar"
                            type="button"
                            title="Escolher outra foto"
                            @click=${() => this.togglePicker()}
                        >
                            ${this.draftAvatar ? unsafeSVG(this.draftAvatar) : this.initials}
                        </button>
                        <button
                            class="shuffle-btn"
                            type="button"
                            title="Escolher outra foto"
                            @click=${() => this.togglePicker()}
                        >
                            <ui-icon name="edit" size="14"></ui-icon>
                        </button>
                    </div>
                    ${this.pickerOpen ? html`
                        <div class="picker">
                            ${this.avatarLoading ? html`
                                <button class="picker-refresh" type="button" disabled>
                                    <ui-icon class="spin" name="refresh" size="13"></ui-icon>
                                    Carregando opções...
                                </button>
                            ` : html`
                                <div class="picker-grid">
                                    ${this.avatarOptions.map(svg => html`
                                        <button
                                            class="picker-option ${svg === this.draftAvatar ? 'active' : ''}"
                                            type="button"
                                            @click=${() => this.selectAvatar(svg)}
                                        >
                                            ${unsafeSVG(svg)}
                                        </button>
                                    `)}
                                </div>
                                <button class="picker-refresh" type="button" @click=${() => this.loadAvatarOptions()}>
                                    <ui-icon name="refresh" size="13"></ui-icon>
                                    Ver mais opções
                                </button>
                            `}
                        </div>
                    ` : nothing}
                    <div class="field">
                        <label for="edit-profile-name">Nome</label>
                        <input
                            id="edit-profile-name"
                            type="text"
                            required
                            autocomplete="off"
                            placeholder="Como podemos te chamar?"
                            .value=${this.draftName}
                            @input=${(event: Event) => (this.draftName = (event.target as HTMLInputElement).value)}
                        >
                    </div>
                    <div class="actions">
                        <button class="cancel" type="button" @click=${() => this.close()}>Cancelar</button>
                        <button class="save" type="submit">Salvar</button>
                    </div>
                </form>
            </app-modal>
        `;
    }

}

declare global{
    interface HTMLElementTagNameMap{
        'edit-profile-modal': EditProfileModal
    }
}
