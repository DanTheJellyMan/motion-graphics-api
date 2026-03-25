import BaseComponent, { Attribute } from "./BaseComponent.ts";

type DefaultAttributes = keyof typeof CustomSlider.defaultAttributes;

export default class CustomSlider extends BaseComponent {
    public static override defaultAttributes = Object.freeze({

    });
    public static override observedAttributes: Readonly<DefaultAttributes[]> = Object.freeze(Object.keys(CustomSlider.defaultAttributes)) as DefaultAttributes[];
    protected override attributeTesters: Readonly<Record<DefaultAttributes, (value: Attribute) => boolean>> = {

    };

    public override connectedCallback(): void {

    }

    public override disconnectedCallback(): void {
        
    }

    public override attributeChangedCallback(name: string, oldValue: Attribute, newValue: Attribute): boolean | null {
        const isValid = super.attributeChangedCallback(name, oldValue, newValue);
        if (isValid !== true) return isValid;

        return true;
    }
}

customElements.define("custom-slider", CustomSlider);