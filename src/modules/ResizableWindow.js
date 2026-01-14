export default class ResizableWindow extends HTMLElement {
    static #defaultAttributes = {
        "resize": "none",
        "split": "50%",
        "min-split": "25%",
        "max-split": "75%",
        "resizable-area-length": "2"
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

    // TODO: maybe add a function that automatically creates child ResizableWindows if more than 2 children are detected
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
        this.draggable = false;
        this.tabIndex = "-1";

        // Setting default CSS styles
        const nodeName = "RESIZABLE-WINDOW";
        const allChildrenAreWindows = Array.from(this.children).every((child) => child.nodeName === nodeName);
        this.style.setProperty(
            "display",
            "grid",
            (this.children.length === 2 && allChildrenAreWindows) ? "important" : ""
        );

        // Setting event listeners
        this.addEventListener("pointermove", this.#handleMousemove, {
            passive: true,
            capture: true
        });
        this.addEventListener("pointerdown", this.#handleMousedown);
        document.addEventListener("pointerup", this.#handleMouseup.bind(this));
    }

    #handleMousemove(e) {
        const { clientX, clientY } = e;
        const mousedown = this.#mousedown;
        let topmostAncestor = this.getTopmostAncestor();
        if (this.canMouseResize(clientX, clientY) || mousedown);
        else
            return topmostAncestor.style.setProperty("cursor", "default", "important");
        
        const resize = this.getAttribute("resize");
        let cursorType = "default";
        switch(resize) {
            case "horizontal":
                cursorType = "ew-resize";
                e.stopPropagation();
                break;
            case "vertical":
                cursorType = "ns-resize";
                e.stopPropagation();
                break;
        }
        topmostAncestor.style.setProperty("cursor", cursorType, "important");
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
    canMouseResize(x, y) {
        if (this.children.length < 2) return false;

        // The 1st child is taken for odd-children counts, or 2nd for even
        const rect = this.children[(this.children.length+1)%2].getBoundingClientRect();
        const resizableAreaLength = parseFloat(this.getAttribute("resizable-area-length"));

        const resize = this.getAttribute("resize");
        switch(resize) {
            case "horizontal":
                if (rect.left - resizableAreaLength <= x &&
                    rect.left + resizableAreaLength >= x
                ) return true;
                break;
            case "vertical":
                if (rect.top - resizableAreaLength <= y &&
                    rect.top + resizableAreaLength >= y
                ) return true;
                break;
        }
        return false;
    }
    hasDeeperHoveredElements(x, y) {
        const isHovered = (element) => {
            const rect = element.getBoundingClientRect();
            const inHorizontally = x >= rect.left && x <= rect.right;
            const inVertically = y >= rect.top && y <= rect.bottom;
            return inHorizontally && inVertically;
        }

        const descendants = this.querySelectorAll("resizable-window");
        for (let i=0; i<descendants.length; i++) {
            if (isHovered(descendants[i])) {
                return true;
            }
        }
        return false;
    }

    getSiblings(mustBeSameType = false) {
        const name = this.nodeName;
        const siblings = [];

        let temp = this.previousElementSibling;
        while (temp !== null) {
            if (!mustBeSameType || temp.nodeName === name) {
                siblings.push(temp);
            }
            temp = temp.previousElementSibling;
        }

        temp = this.nextElementSibling;
        while (temp !== null) {
            if (!mustBeSameType || temp.nodeName === name) {
                siblings.push(temp);
            }
            temp = temp.nextElementSibling;
        }

        return siblings;
    }

    getTopmostAncestor() {
        const targetName = "RESIZABLE-WINDOW";
        let ancestor = this;
        while (ancestor && ancestor.parentElement.nodeName === targetName) {
            ancestor = ancestor.parentElement;
        }
        return ancestor;
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
            if (!ResizableWindow.#attributeTesters[name](oldValue)) {
                return this.setAttribute(name, ResizableWindow.#defaultAttributes[name]);
            }
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

        const setChildrenBorderWidths = (resize, resizableAreaLength) => {
            resize ??= this.getAttribute("resize");
            resizableAreaLength ??= this.getAttribute("resizable-area-length");
            if (this.children.length === 0 || !resize || !resizableAreaLength) return;
            resizableAreaLength /= 2;

            const [c1, c2] = this.children;
            switch(resize) {
                case "vertical":
                    c1.style.setProperty("border-bottom-width", `${resizableAreaLength}px`, "important");
                    c2.style.setProperty("border-top-width", `${resizableAreaLength}px`, "important");

                    c1.style.setProperty("border-right-width", 0, "");
                    c2.style.setProperty("border-left-width", 0, "");
                    break;
                case "horizontal":
                    c1.style.setProperty("border-right-width", `${resizableAreaLength}px`, "important");
                    c2.style.setProperty("border-left-width", `${resizableAreaLength}px`, "important");

                    c1.style.setProperty("border-bottom-width", 0, "important");
                    c2.style.setProperty("border-top-width", 0, "important");
                    break;
            }
        }

        switch(name) {
            case "split":
                this.style.setProperty("--split", newValue, "important");
                break;
            case "resize":
                this.style.setProperty("grid-template-rows", "", "important");
                this.style.setProperty("grid-template-columns", "", "important");
                setGridTemplate(null, null, newValue);
                setChildrenBorderWidths(newValue, null);
                break;
            case "min-split":
                setGridTemplate(newValue);
                break;
            case "max-split":
                setGridTemplate(null, newValue);
                break;
            case "resizable-area-length":
                this.style.setProperty("--resizable-area-length", `${newValue}px`, "");
                setChildrenBorderWidths(null, newValue);
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