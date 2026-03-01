import BaseComponent, { Attribute } from "./BaseComponent.ts";

type DefaultAttributes = keyof typeof CustomButton.defaultAttributes;

export default class CustomButton extends BaseComponent {
    // Include description popup on hover, optionally, like in GIMP
    public static override defaultAttributes = {

    };
    public static override observedAttributes: Readonly<DefaultAttributes[]> = Object.freeze(Object.keys(CustomButton.defaultAttributes)) as DefaultAttributes[];
    protected override attributeTesters: Readonly<Record<DefaultAttributes, (value: Attribute) => boolean>> = {

    };

    public override connectedCallback(): void {
        super.connectedCallback();
    }

    public override disconnectedCallback(): void {
        
    }

    public override attributeChangedCallback(name: string, oldValue: string, newValue: string): boolean | null {
        const isValid = super.attributeChangedCallback(name, oldValue, newValue);
        if (isValid !== true) return isValid;

        return true;
    }
}

customElements.define("custom-button", CustomButton);