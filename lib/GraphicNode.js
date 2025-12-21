export default class GraphicNode {
    static #svgNS = "http://www.w3.org/2000/svg";
    
    /**
     * @type {string} An SVG element name (but not always "svg")
     */
    #elementName;

    /**
     * @type {string}
     */
    #id;

    /**
     * @type {string} Similar to the "className" property of regular HTMLElements
     */
    #className;

    /**
     * @type {Object[]} contains all attributes for "element" along with timing ("t")
     */
    #keyframes = [];
    
    /**
     * @type {GraphicNode[]}
     */
    #children = [];

    /**
     * @type {GraphicNode | null}
     */
    #parent = null;

    constructor(elementName = "svg", id = "", className = "") {
        this.#elementName = elementName;
        this.#id = id;
        this.#className = className;
    }

    // Note: both appendChild() and removeChild() only work on immediate children of this GraphicNode.
    // If trying to access a deeper node, use querySelector, get its parent, and then use these methods.
    appendChild(graphicNode, index = this.#children.length) {
        // TODO: ensure no recursive-ness in children
        this.#children.splice(index, 0, graphicNode);
    }
    removeChild(graphicNode) {
        const index = this.#children.indexOf(graphicNode);
        this.removeChildIndex(index);
    }
    removeChildIndex(index) {
        this.#children.splice(index, 1);
    }

    /**
     * @param {string} selector 
     * @param {boolean} all When true, behaves like Document.querySelectorAll() instead of querySelector()
     * @returns {GraphicNode[] | GraphicNode | null}
     */
    querySelector(selector, all = false) {
        let { elementName, id, classNames } = GraphicNode.parseSelector(selector);
        const className = classNames.join(" ");
        const results = [];

        for (let i=0; i<this.#children.length; i++) {
            const child = this.#children[i];
            let validElementName = true;
            let validId = true;
            let validClassName = true;

            if (elementName !== "" && elementName !== child.getElementName()) {
                validElementName = false;
            }
            if (id !== "" && id !== child.getId()) {
                validId = false;
            }
            if (className !== "" && className !== child.getClassName()) {
                validClassName = false;
            }
            if (validElementName && validId && validClassName) {
                results.push(child);
                if (!all) break;
            }

            const query = child.querySelector(selector, all).flat(Infinity);
            if (query.constructor === Array) {
                results.push(...query);
            } else if (query) {
                results.push(query);
            }

            if (!all && results.length > 0) break;
        }

        if (all === false) {
            if (results.length === 0) return null;
            return results[0];
        }
        return results;
    }

    addKeyframe(keyframe) {
        const keyframes = this.#keyframes;
        let keyframeAdded = false;
        
        // Order keyframe according to "t"
        for (let i=0; i<keyframes.length; i++) {
            const { t } = keyframes[i];
            if (keyframe.t < t) continue;
            if (keyframe.t === t) {
                console.warn(`Keyframe at index ${i} shares t-value ${t} with new keyframe. Ignoring addKeyframe() command`);
                return false;
            }

            keyframes.splice(Math.max(0, i-1), 0, keyframe);
            keyframeAdded = true;
            break;
        }

        if (!keyframeAdded) keyframes.push(keyframe);
        return true;
    }

    setElementName(elementName) {
        this.#elementName = elementName;
    }
    getElementName() {
        return this.#elementName;
    }

    setId(id) {
        this.#id = id;
    }
    getId() {
        return this.#id;
    }

    setClassName(className) {
        this.#className = className;
    }
    getClassName() {
        return this.#className;
    }

    #setParent(graphicNode) {

    }

    generateElement() {
        const element = document.createElementNS(GraphicNode.#svgNS, this.#elementName);
        for (const [n, v] of Object.entries(this.#keyframes[0].attribs)) {
            element.setAttribute(n, v);
        }

        for (let i=0; i<this.#children.length; i++) {
            element.appendChild(
                this.#children[i].generateElement()
            );
        }

        return element;
    }
    static createSvgImage(svg, loadListener = null) {
        const svgStr = new XMLSerializer().serializeToString(svg);
        const svgBlob = new Blob([svgStr], {
            type: "image/svg+xml;charset=utf-8"
        });
        const url = URL.createObjectURL(svgBlob);
        const img = new Image();
        if (loadListener && loadListener instanceof Function) {
            img.addEventListener("load", loadListener, { once: true });
        }
        img.src = url;
        return img;
    }

    /* STANDARD SELECTOR FORMAT:
        element#id.class1.class_2.class-3
    */
    static parseSelector(selector) {
        selector = selector.trim();
        let elementName = "";
        let id = "";
        const classNames = [];

        let elementNameFound = false;
        switch (selector[0]) {
            case "#": case ".":
                elementNameFound = true;
                break;
        }
        let idFound = false;
        let iteratingOverClasses = false;

        for (let i=0; i<selector.length; i++) {
            const char = selector[i];
            switch (char) {
                case ".":
                    elementNameFound = true;
                    idFound = true;
                    iteratingOverClasses = true;
                    classNames.push("");
                    continue;
                case "#":
                    elementNameFound = true;
                default:
                    if (!elementNameFound) {
                        elementName += char;
                    } else if (!idFound) {
                        id += char;
                    } else {
                        if (iteratingOverClasses) {
                            classNames[classNames.length-1] += char;
                        } else {
                            id += char;
                        }
                    }
                    break;
            }
        }

        return { elementName, id, classNames };
    }

    static get svgNS() {
        return this.#svgNS;
    }
}