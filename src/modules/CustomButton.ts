import WebComponentBase from "./WebComponentBase.ts";

const DEFAULT_ATTRIBUTES = {

}

export default class CustomButton extends WebComponentBase {
    protected override defaultAttributes = DEFAULT_ATTRIBUTES;
    protected override attributeTesters = {};
    public static override observedAttributes = Object.keys(DEFAULT_ATTRIBUTES);

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

customElements.define("custom-button", CustomButton);