import {LitElement, html, css, svg, TemplateResult, CSSResult} from 'lit';
import {customElement, property} from 'lit/decorators.js';

export type IconName =
    | 'chevron-left'
    | 'chevron-right'
    | 'plus'
    | 'edit'
    | 'trash'
    | 'chart'
    | 'code'
    | 'close'
    | 'calendar'
    | 'dumbbell'
    | 'alert-triangle'
    | 'check-circle'
    | 'copy'
    | 'note'
    | 'layers'
    | 'repeat'
    | 'timer'
    | 'refresh'
    | 'menu'
    | 'mail'
    | 'logout'
    | 'moon'
    | 'flame'
    | 'trophy'
    | 'arrow-right';

@customElement('ui-icon')
export default class UiIcon extends LitElement{

    @property({type: String}) name: IconName = 'plus';
    @property({type: Number}) size = 16;

    static override get styles(): CSSResult{
        return css`
            :host {
                display: inline-flex;
                line-height: 0;
            }

            svg {
                display: block;
            }
        `;
    }

    private renderPaths(): TemplateResult{
        switch (this.name) {
            case 'chevron-left':
                return svg`<path d="M15 18l-6-6 6-6" />`;
            case 'chevron-right':
                return svg`<path d="M9 18l6-6-6-6" />`;
            case 'plus':
                return svg`<path d="M12 5v14M5 12h14" />`;
            case 'edit':
                return svg`<path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />`;
            case 'trash':
                return svg`<path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" />`;
            case 'chart':
                return svg`<path d="M3 3v18h18" /><path d="M18 9l-5 5-4-4-4 4" />`;
            case 'code':
                return svg`<path d="M8 4L2 12l6 8" /><path d="M16 4l6 8-6 8" />`;
            case 'close':
                return svg`<path d="M18 6 6 18" /><path d="M6 6l12 12" />`;
            case 'calendar':
                return svg`<rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />`;
            case 'dumbbell':
                return svg`<path d="M6 7v10M18 7v10" /><path d="M2 10v4M22 10v4" /><path d="M6 12h12" />`;
            case 'alert-triangle':
                return svg`<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" /><path d="M12 9v4M12 17h.01" />`;
            case 'check-circle':
                return svg`<circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" />`;
            case 'copy':
                return svg`<rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" />`;
            case 'note':
                return svg`<path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2Z" />`;
            case 'layers':
                return svg`<path d="M12 2 2 7l10 5 10-5-10-5Z" /><path d="m2 17 10 5 10-5" /><path d="m2 12 10 5 10-5" />`;
            case 'repeat':
                return svg`<path d="m17 2 4 4-4 4" /><path d="M3 11v-1a4 4 0 0 1 4-4h14" /><path d="m7 22-4-4 4-4" /><path d="M21 13v1a4 4 0 0 1-4 4H3" />`;
            case 'timer':
                return svg`<path d="M10 2h4" /><path d="M12 14v-4" /><circle cx="12" cy="14" r="8" />`;
            case 'refresh':
                return svg`<path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M3 21v-5h5" />`;
            case 'menu':
                return svg`<path d="M4 6h16M4 12h16M4 18h16" />`;
            case 'mail':
                return svg`<rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 6-10 7L2 6" />`;
            case 'logout':
                return svg`<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" />`;
            case 'moon':
                return svg`<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />`;
            case 'flame':
                return svg`<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />`;
            case 'trophy':
                return svg`<path d="M8 21h8" /><path d="M12 17v4" /><path d="M7 4h10v6a5 5 0 0 1-10 0Z" /><path d="M17 5h2a2 2 0 0 1 0 4h-2M7 5H5a2 2 0 0 0 0 4h2" />`;
            case 'arrow-right':
                return svg`<path d="M5 12h14" /><path d="m13 6 6 6-6 6" />`;
            default:
                return svg``;
        }
    }

    protected override render(): TemplateResult{
        return html`
            <svg
                width=${this.size}
                height=${this.size}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                ${this.renderPaths()}
            </svg>
        `;
    }

}

declare global{
    interface HTMLElementTagNameMap{
        'ui-icon': UiIcon
    }
}
