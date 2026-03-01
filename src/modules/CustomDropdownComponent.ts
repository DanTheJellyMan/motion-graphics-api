import BaseComponent, { Attribute } from "./BaseComponent.ts";

type DefaultAttributes = keyof typeof CustomDropdown.defaultAttributes;

export default class CustomDropdown extends BaseComponent {
    // Include 2 options for either:
    // value = element display text (dropdown directly over main element)
    // or not (dropdown will be lower than it, and not include display text in dropdown options).
    // Look at GIMP for reference.
    public static override defaultAttributes = Object.freeze({
        
    });
    public static override observedAttributes: Readonly<DefaultAttributes[]> = Object.keys(CustomDropdown.defaultAttributes) as DefaultAttributes[];
    protected override attributeTesters: Readonly<Record<DefaultAttributes, (value: Attribute) => boolean>> = {

    };

    public override connectedCallback(): void {
        super.connectedCallback();
        this.tabIndex = 0;
    }

    public override disconnectedCallback(): void {
        
    }

    public override attributeChangedCallback(name: string, oldValue: Attribute, newValue: Attribute): boolean | null {
        const isValid = super.attributeChangedCallback(name, oldValue, newValue);
        if (isValid !== true) return isValid;

        return true;
    }
}

customElements.define("custom-dropdown", CustomDropdown);