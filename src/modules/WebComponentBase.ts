export type AttributeTester = Record<string, (value: string) => boolean>;

export default abstract class WebComponentBase extends HTMLElement {
    protected abstract attributeTesters: AttributeTester;
    protected abstract defaultAttributes: Record<keyof AttributeTester, string>;
    public static observedAttributes: (keyof AttributeTester)[];

    public abstract connectedCallback(): void;
    public abstract disconnectedCallback(): void;

    /**
     * Checks if new attribute value is valid. If not, returns false and reverts attribute change to either the old or default value
     * @param name If this does not have a tester, nothing is done and null is returned
     * @param oldValue 
     * @param newValue 
     * @returns 
     */
    public attributeChangedCallback(name: string, oldValue: string, newValue: string): boolean | null {
        const tester = this.attributeTesters[name];
        if (tester === undefined) return null;
        if (tester(newValue)) return true;

        if (tester(oldValue)) {
            this.setAttribute(name, oldValue);
        } else {
            this.setAttribute(name, this.defaultAttributes[name]);
        }
        return false;
    }
}