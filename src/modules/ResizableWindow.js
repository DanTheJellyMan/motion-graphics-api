export default class ResizableWindow extends HTMLElement {
    static #defaultAttributes = {
        "resize": "none",
        "split": "50%",
        "min-split": "25%",
        "max-split": "75%",
        "resizable-area-length": "10"
    }
    static #attributeTesters = {
        resize: (value) => {
            const values = ["none", "horizontal", "vertical"];
            return values.includes(value);
        },
        split: (value) => {
            return (
                CSS.supports("grid-template-rows", value) &&
                CSS.supports("grid-template-columns", value)
            );
        },
        get "min-split"() {
            return this.split;
        },
        get "max-split"() {
            return this.split;
        },
        "resizable-area-length": (value) => {
            return !isNaN(parseFloat(value));
        }
    }
    static observedAttributes = Object.keys(this.#defaultAttributes);

    #mousedown = false;

    /* NOTE: maximum children per window: 2
        (if trying to add more, add additional ResizableWindows inside one of the 2 windows with the same "resize" attribute for a similar effect)
    */ 

    constructor() {
        super();
    }

    static determineGridTemplateType(resizeAttribute) {
        switch(resizeAttribute) {
            case "vertical":
                return "grid-template-rows";
            case "horizontal":
                return "grid-template-columns";
            default:
                return "none";
        }
    }

    connectedCallback() {
        // Setting default attributes
        for (const [attributeName, attributeValue] of Object.entries(ResizableWindow.#defaultAttributes)) {
            if (this.getAttribute(attributeName) !== null) continue;
            this.setAttribute(attributeName, attributeValue);
        }

        // Correcting invalid attribute values
        for (const attributeName of this.getAttributeNames()) {
            if (!(attributeName in ResizableWindow.#defaultAttributes)) continue;

            const attributeValue = this.getAttribute(attributeName);
            if (ResizableWindow.#attributeTesters[attributeName](attributeValue)) continue;
            this.setAttribute(attributeName, ResizableWindow.#defaultAttributes[attributeName]);
        }

        // Setting default CSS styles
        this.style.setProperty("display", "grid", "important");

        // Setting event listeners
        this.addEventListener("pointermove", this.#handleMousemove);
        this.addEventListener("pointerdown", this.#handleMousedown);
        document.addEventListener("pointerup", this.#handleMouseup.bind(this));
    }

    canMouseResize(x, y) {
        if (this.children.length < 2) return false;
        const lastRect = this.children[1].getBoundingClientRect();
        const resizableAreaLength = parseFloat(this.getAttribute("resizable-area-length"));

        const resize = this.getAttribute("resize");
        switch(resize) {
            case "horizontal":
                if (lastRect.left - resizableAreaLength <= x &&
                    lastRect.left + resizableAreaLength >= x
                ) return true;
                break;
            case "vertical":
                if (lastRect.top - resizableAreaLength <= y &&
                    lastRect.top + resizableAreaLength >= y
                ) return true;
                break;
        }
        return false;
    }

    #handleMousemove(e) {
        if (this.children.length < 2) return;
        const { clientX, clientY } = e;
        const mousedown = this.#mousedown;
        if (!this.canMouseResize(clientX, clientY) && !mousedown) {
            this.style.setProperty("cursor", "default", null);
            return;
        }
        
        const resize = this.getAttribute("resize");
        switch(resize) {
            case "horizontal":
                this.style.setProperty("cursor", "ew-resize", "important");
                break;
            case "vertical":
                this.style.setProperty("cursor", "ns-resize", "important");
                break;
        }
        if (!mousedown) return;

        const parentRect = this.getBoundingClientRect();
        let t;
        switch(resize) {
            case "horizontal":
                t = (clientX - parentRect.left) / parentRect.right;
                break;
            case "vertical":
                t = (clientY - parentRect.top) / parentRect.bottom;
                break;
        }
        this.setAttribute("split", `${t*100}%`);
    }

    #handleMousedown(e) {
        if (!this.canMouseResize(e.clientX, e.clientY)) return;
        this.#mousedown = true;
    }
    #handleMouseup(e) {
        this.#mousedown = false;
    }

    disconnectedCallback() {

    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (!ResizableWindow.#attributeTesters[name](newValue)) {
            return this.setAttribute(name, oldValue);
        }
        
        const setGridTemplate = (minSplit, maxSplit, resize) => {
            minSplit ??= this.getAttribute("min-split");
            maxSplit ??= this.getAttribute("max-split");
            resize ??= this.getAttribute("resize");

            const gridTemplateType = ResizableWindow.determineGridTemplateType(resize);
            if (gridTemplateType === "none") return;
            this.style.setProperty(
                gridTemplateType,
                `clamp(${minSplit}, var(--split), ${maxSplit}) 1fr`,
                "important"
            );
        }

        switch(name) {
            case "split":
                this.style.setProperty("--split", newValue);
                break;
            case "resize":
                this.style.setProperty("grid-template-rows", null, null);
                this.style.setProperty("grid-template-columns", null, null);
                setGridTemplate(null, null, newValue);
                break;
            case "min-split":
                setGridTemplate(newValue);
                break;
            case "max-split":
                setGridTemplate(null, newValue);
                break;
        }
    }
}

customElements.define("resizable-window", ResizableWindow);

function delay(refreshCount, callback) {
    let finalCallback = callback.bind(callback);
    for (let i=0; i<refreshCount; i++) {
        let tempCb = finalCallback.bind(callback);
        finalCallback = () => requestAnimationFrame(tempCb);
    }
    finalCallback.call(callback);
}