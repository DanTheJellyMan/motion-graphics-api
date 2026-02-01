import WebComponentBase from "./WebComponentBase.ts";

const DEFAULT_ATTRIBUTES = {
    "type": "button", // button, slider, dropdown (both "generic" toolbar and tool option styles)
    "title": "",
    "imgSrc": "",
    "enableSubtitle": "false", // Enables text displaying a value
    "enableSlider": "true"
}

export default class CustomInput extends WebComponentBase {
    public static override observedAttributes = Object.keys(DEFAULT_ATTRIBUTES);
    protected override defaultAttributes = DEFAULT_ATTRIBUTES;
    protected override attributeTesters = {};

    public override connectedCallback(): void {
        
    }

    public override disconnectedCallback(): void {
        
    }

    public override attributeChangedCallback(name: string, oldValue: string, newValue: string): boolean | null {
        const isValid = super.attributeChangedCallback(name, oldValue, newValue);
        if (isValid === null || isValid === false) return null;
        
        return true;
    }
}

customElements.define("custom-button", CustomInput);