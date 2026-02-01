import WebComponentBase from "./WebComponentBase.ts";

const DEFAULT_ATTRIBUTES = {
    "resize": "none",
    "split": "50%",
    "min-split": "25%",
    "max-split": "75%",
    "resizable-area-length": "2"
}

export default class ResizableWindow extends WebComponentBase {
    public static override observedAttributes = Object.keys(DEFAULT_ATTRIBUTES);
    protected override defaultAttributes = DEFAULT_ATTRIBUTES;
    protected override attributeTesters = {
        "resize": (value: string) => {
            const values = ["none", "horizontal", "vertical"];
            return values.includes(value);
        },
        "split": (value: string) => {
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
        "resizable-area-length": (value: string) => {
            return !isNaN(parseFloat(value));
        }
    }

    private mousedown = false;

    /* NOTE: maximum children per window: 2
        (if trying to add more, add additional ResizableWindows inside one of the 2 windows with the same "resize" attribute for a similar effect)
    */

    public static determineGridTemplateType(resizeAttribute: string) {
        switch(resizeAttribute) {
            case "vertical":
                return "grid-template-rows";
            case "horizontal":
                return "grid-template-columns";
            default:
                return "none";
        }
    }
    
    public override connectedCallback(): void {
        while (this.children.length > 2) {
            const cLen = this.children.length;
            const ch1 = this.children[cLen-2];
            const ch2 = this.children[cLen-1];
            
            const parent = ch1.cloneNode(false);
            parent.appendChild(ch1.cloneNode(true));
            parent.appendChild(ch2.cloneNode(true));
            this.appendChild(parent);
            ch1.remove();
            ch2.remove();
        }

        // Setting default attributes
        for (const [attributeName, attributeValue] of Object.entries(this.defaultAttributes)) {
            if (this.getAttribute(attributeName) !== null) continue;
            this.setAttribute(attributeName, attributeValue);
        }
        
        // Correcting invalid attribute values
        type DefaultAttribute = keyof typeof this.defaultAttributes;
        const attributeNames = this.getAttributeNames();
        for (let i=0; i<attributeNames.length; i++) {
            const attributeName: DefaultAttribute = attributeNames[i] as DefaultAttribute;
            if (!(attributeName in this.defaultAttributes)) continue;

            const attributeValue = this.getAttribute(attributeName)!;
            if (this.attributeTesters[attributeName](attributeValue)) continue;
            this.setAttribute(attributeName, this.defaultAttributes[attributeName]);
        }
        this.draggable = false;
        this.tabIndex = -1;

        // Setting default CSS styles
        const nodeName = "RESIZABLE-WINDOW";
        const allChildrenAreWindows = Array.from(this.children).every((child) => child.nodeName === nodeName);
        this.style.setProperty(
            "display",
            "grid",
            (this.children.length === 2 && allChildrenAreWindows) ? "important" : ""
        );

        // Setting event listeners
        this.addEventListener("pointermove", this.handleMousemove, {
            passive: true,
            capture: true
        });
        this.addEventListener("pointerdown", this.handleMousedown);
        document.addEventListener("pointerup", this.handleMouseup.bind(this));
    }

    private handleMousemove(e: PointerEvent): void {
        const { pageX: x, pageY: y } = e;
        const mousedown = this.mousedown;
        let topmostAncestor = this.getTopmostAncestor();
        if (!this.canMouseResize(x, y) && !mousedown) {
            if (!this.hasDeeperHoveredElements(x, y)) {
                topmostAncestor.style.setProperty("cursor", "default", "important");
                e.stopPropagation();
            }
            return;
        }
        
        const resize = this.getAttribute("resize");
        const rect = this.getBoundingClientRect();
        let cursorType = "default";
        let t = NaN;
        switch(resize) {
            case "horizontal":
                cursorType = "ew-resize";
                t = (x - rect.left) / rect.width;
                e.stopPropagation();
                break;
            case "vertical":
                cursorType = "ns-resize";
                t = (y - rect.top) / rect.height;
                e.stopPropagation();
                break;
        }
        
        topmostAncestor.style.setProperty("cursor", cursorType, "important");
        // console.log(`MOUSE: (${x}, ${y})\tRECT: ${JSON.stringify(rect)} \t${t}`);
        if (mousedown) {
            this.setAttribute("split", `${t*100}%`);
        }
    }
    public canMouseResize(x: number, y: number): boolean {
        const windowChildren = Array.from(this.children).filter((child) => child.nodeName === this.nodeName);
        if (windowChildren.length < 2) return false;

        const rect = windowChildren[windowChildren.length-1].getBoundingClientRect();
        const resizableAreaLength = parseFloat(this.getAttribute("resizable-area-length")!);
        let rectSide: number, axisValue: number;
        
        if (this.getAttribute("resize") === "horizontal") {
            rectSide = rect.left;
            axisValue = x;
        } else {
            rectSide = rect.top;
            axisValue = y;
        }

        const result = (
            rectSide - resizableAreaLength <= axisValue &&
            rectSide + resizableAreaLength >= axisValue
        );
        return result;
    }
    public hasDeeperHoveredElements(x: number, y: number): boolean {
        const isHovered = (element: Element) => {
            const rect = element.getBoundingClientRect();
            const inHorizontally = x >= rect.left && x <= rect.right;
            const inVertically = y >= rect.top && y <= rect.bottom;
            return inHorizontally && inVertically;
        }

        const descendants: NodeListOf<ResizableWindow> = this.querySelectorAll("resizable-window");
        for (let i=0; i<descendants.length; i++) {
            if (descendants[i].mousedown || isHovered(descendants[i])) {
                return true;
            }
        }
        return false;
    }

    public getSiblings(mustBeSameType = false): HTMLElement[] {
        const name = this.nodeName;
        const siblings: HTMLElement[] = [];

        let temp: HTMLElement | null = this.previousElementSibling as HTMLElement;
        while (temp !== null) {
            if (!mustBeSameType || temp.nodeName === name) {
                siblings.push(temp);
            }
            temp = temp.previousElementSibling as HTMLElement;
        }

        temp = this.nextElementSibling as HTMLElement;
        while (temp !== null) {
            if (!mustBeSameType || temp.nodeName === name) {
                siblings.push(temp);
            }
            temp = temp.nextElementSibling as HTMLElement;
        }

        return siblings;
    }

    public getTopmostAncestor(): HTMLElement {
        const targetName = "RESIZABLE-WINDOW";
        let ancestor: HTMLElement = this;
        while (ancestor && ancestor.parentElement && ancestor.parentElement.nodeName === targetName) {
            ancestor = ancestor.parentElement;
        }
        return ancestor;
    }

    private handleMousedown(e: PointerEvent) {
        if (!this.canMouseResize(e.pageX, e.pageY)) return;
        this.mousedown = true;
    }
    private handleMouseup(e: PointerEvent) {
        this.mousedown = false;
    }

    public override disconnectedCallback() {

    }

    public override attributeChangedCallback(name: string, oldValue: string, newValue: string): boolean | null {
        type Attribute = string | null;
        const isValid = super.attributeChangedCallback(name, oldValue, newValue);
        if (isValid === null || isValid === false) return null;

        const setGridTemplate = (minSplit: Attribute = null, maxSplit: Attribute = null, resize: Attribute = null) => {
            minSplit ??= this.getAttribute("min-split");
            maxSplit ??= this.getAttribute("max-split");
            resize ??= this.getAttribute("resize");

            const gridTemplateType = ResizableWindow.determineGridTemplateType(resize!);
            if (gridTemplateType === "none") return;
            this.style.setProperty(
                gridTemplateType,
                `clamp(${minSplit}, var(--split), ${maxSplit}) 1fr`,
                "important"
            );
        }

        const setChildrenBorderWidths = (resize: Attribute = null, resizableAreaLength: Attribute = null) => {
            resize ??= this.getAttribute("resize") as string;
            resizableAreaLength ??= this.getAttribute("resizable-area-length") as string;
            if (this.children.length === 0 || !resize || !resizableAreaLength) return;
            const length: number = parseFloat(resizableAreaLength) / 2;

            const c1 = this.children[0] as HTMLElement;
            const c2 = this.children[1] as HTMLElement;
            switch(resize) {
                case "vertical":
                    c1.style.setProperty("border-bottom-width", `${length}px`, "important");
                    c2.style.setProperty("border-top-width", `${length}px`, "important");

                    c1.style.setProperty("border-right-width", "0", "");
                    c2.style.setProperty("border-left-width", "0", "");
                    break;
                case "horizontal":
                    c1.style.setProperty("border-right-width", `${length}px`, "important");
                    c2.style.setProperty("border-left-width", `${length}px`, "important");

                    c1.style.setProperty("border-bottom-width", "0", "important");
                    c2.style.setProperty("border-top-width", "0", "important");
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
        return true;
    }
}

customElements.define("resizable-window", ResizableWindow);

function stopwatch(): () => number {
    const startT = performance.now();
    return () => performance.now() - startT;
}

function delay(refreshCount: number, callback: Function) {
    let finalCallback = callback.bind(callback);
    for (let i=0; i<refreshCount; i++) {
        let tempCb = finalCallback.bind(callback);
        finalCallback = () => requestAnimationFrame(tempCb);
    }
    finalCallback.call(callback);
}