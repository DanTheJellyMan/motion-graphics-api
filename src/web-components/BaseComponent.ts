type DefaultAttributes = keyof typeof BaseComponent.defaultAttributes;
export type Attribute = string | null;

export default abstract class BaseComponent extends HTMLElement {
    public static defaultAttributes: Readonly<Record<string, string>>;
    public static observedAttributes: Readonly<DefaultAttributes[]>;
    protected abstract attributeTesters: Readonly<Record<DefaultAttributes, (value: Attribute) => boolean>>;
    private clazz: typeof BaseComponent = this.constructor as typeof BaseComponent;

    /**
     * Handles settings default attributes values, and correcting invalid values
     */
    public connectedCallback(): void {
        const { clazz } = this;
        this.draggable = false;

        for (const [attributeName, attributeValue] of Object.entries(clazz.defaultAttributes)) {
            if (this.getAttribute(attributeName) !== null) continue;
            this.setAttribute(attributeName, attributeValue!);
        }
        
        type DefaultAttribute = keyof typeof clazz.defaultAttributes;
        const attributeNames = this.getAttributeNames();
        for (let i=0; i<attributeNames.length; i++) {
            const attributeName: DefaultAttribute = attributeNames[i];
            if (!(attributeName in clazz.defaultAttributes)) continue;

            const attributeValue = this.getAttribute(attributeName);
            if (this.attributeTesters[attributeName](attributeValue)) continue;
            this.setAttribute(attributeName, clazz.defaultAttributes[attributeName]!);
        }
    }
    public abstract disconnectedCallback(): void;

    /**
     * Checks if new attribute value is valid. If not, returns false and reverts attribute change to either the old or default value
     * @param name If this does not have a tester, nothing is done and null is returned
     * @param oldValue 
     * @param newValue 
     * @returns 
     */
    public attributeChangedCallback(name: string, oldValue: Attribute, newValue: Attribute): boolean | null {
        const { clazz } = this;
        const tester = this.attributeTesters[name];
        if (tester === undefined) return null;
        if (newValue !== null && tester(newValue)) return true;

        if (oldValue !== null && tester(oldValue)) {
            this.setAttribute(name, oldValue);
        } else {
            this.setAttribute(name, clazz.defaultAttributes[name]!);
        }
        return false;
    }
}