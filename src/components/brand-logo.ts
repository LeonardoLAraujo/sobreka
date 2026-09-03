import {LitElement, html, css, TemplateResult, CSSResult} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import sobrekaMarkUrl from '../images/sobreka-marca-clara.svg?url';

@customElement('brand-logo')
export default class BrandLogo extends LitElement{

    @property({type: Number}) height = 28;

    static override get styles(): CSSResult{
        return css`
            :host {
                display: inline-flex;
                line-height: 0;
                flex-shrink: 0;
            }

            img {
                display: block;
                width: auto;
            }
        `;
    }

    protected override render(): TemplateResult{
        return html`
            <img src=${sobrekaMarkUrl} height=${this.height} alt="Sobreka">
        `;
    }

}

declare global{
    interface HTMLElementTagNameMap{
        'brand-logo': BrandLogo
    }
}
