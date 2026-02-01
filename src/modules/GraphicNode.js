import * as Flubber from "flubber";
import * as D3 from "d3";

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
     * @type {string} Mainly for text elements
     */
    #textContent = "";

    // NOTE: every keyframe must have the same attributes inside
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
        switch(selector[0]) {
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

    clone() {
        const createNodeClone = (graphicNode) => {
            const clone = new GraphicNode(graphicNode.#elementName, graphicNode.#id, graphicNode.#className);
            clone.#textContent = graphicNode.#textContent;
            clone.#keyframes = structuredClone(graphicNode.#keyframes);
            return clone;
        }

        const clone = createNodeClone(this);
        const stack = [[this, clone]];

        while (stack.length > 0) {
            const [original, cloned] = stack.pop();

            for (const child of original.#children) {
                const childClone = createNodeClone(child);
                cloned.appendChild(childClone);
                stack.push([child, childClone]);
            }
        }

        return clone;
    }

    // Note: both appendChild() and removeChild() only work on immediate children of this GraphicNode.
    // If trying to access a deeper node, use querySelector, get its parent, and then use these methods.
    appendChild(graphicNode, index = this.#children.length) {
        // TODO: ensure no recursive-ness in children
        this.#children.splice(index, 0, graphicNode);
        graphicNode.#setParent(this);
    }
    removeChild(graphicNode) {
        const index = this.#children.indexOf(graphicNode);
        this.removeChildIndex(index);
    }
    removeChildIndex(index) {
        const removedNode = this.#children.splice(index, 1)[0];
        removedNode.#setParent(null);
    }
    getChildren() {
        return this.#children;
    }

    /**
     * @param {string} selector 
     * @param {boolean} all When true, behaves like Document.querySelectorAll() instead of querySelector()
     * @returns {GraphicNode[] | GraphicNode | null}
     */
    querySelector(selector, all = false) {
        if (selector === null || selector === undefined) {
            console.error("No query selector was provided");
            return null;
        }
        let { elementName, id, classNames } = GraphicNode.parseSelector(selector);
        const className = classNames.join(" ");
        const results = [];

        // TODO (low priority): make this function iterative, instead of recursive
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
            if ((validElementName && validId && validClassName) || selector === "*") {
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

    /**
     * @param {Object} keyframe 
     * @returns {boolean} Whether or not the keyframe was successfully added
     */
    addKeyframe(keyframe) {
        const keyframes = this.#keyframes;
        let keyframeAdded = false;
        
        // Order keyframe according to "t"
        for (let i=0; i<keyframes.length; i++) {
            if (keyframe.t === keyframes[i].t) {
                console.warn(`Keyframe at index ${i} shares t-value ${keyframes[i].t} with new keyframe. Ignoring addKeyframe() command`);
                return false;
            }
            if (keyframe.t > keyframes[i].t) continue;

            keyframes.splice(i, 0, keyframe);
            keyframeAdded = true;
            break;
        }

        if (!keyframeAdded) keyframes.push(keyframe);
        return true;
    }
    getKeyframes(clone = false) {
        if (clone) return structuredClone(this.#keyframes);
        return this.#keyframes;
    }
    /**
     * Returns a cloned version of this.#keyframes, but with keyframes for t=0 and t=1, if they do not already exist
     * @returns {Object}
     */
    getFormattedKeyframes() {
        const keyframes = structuredClone(this.#keyframes);
        if (keyframes.length === 0) {
            keyframes.push({ t: 0, attribs: {} });
        }
        if (keyframes[0].t !== 0) {
            const clone = structuredClone(keyframes[0]);
            clone.t = 0;
            keyframes.unshift(clone);
        }
        if (keyframes[keyframes.length-1].t !== 1) {
            const clone = structuredClone(keyframes[keyframes.length-1]);
            clone.t = 1;
            keyframes.push(clone);
        }
        return keyframes;
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

    setTextContent(text) {
        this.#textContent = text;
    }
    getTextContent() {
        return this.#textContent;
    }

    #setParent(graphicNode) {
        // TODO: check for any recursive-ness before setting

        this.#parent = graphicNode;
        return true;
    }
    getParent() {
        return this.#parent;
    }

    /**
     * Create an SVG of this graphic node with the interpolated values at a specified time
     * @param {number} t 0 - 1
     * @param {number} pathInterpQuality Range (high to low quality): [1, ∞)
     * @returns {SVGElement}
     */
    generateElement(t = 0, pathInterpQuality = 10) {
        // TODO (low priority): make this function iterative, instead of recursive
        t = Math.min(Math.max(0, t), 1);
        pathInterpQuality = Math.max(1, pathInterpQuality);
        const element = document.createElementNS(GraphicNode.#svgNS, this.#elementName);
        element.id = this.#id;
        element.classList.add(
            ...this.#className.split(".")
            .filter((char) => char !== "")
        );
        element.textContent = this.#textContent;

        const keyframes = this.getFormattedKeyframes();
        const interpolatedAttribs = {};
        if (keyframes.length === 0) {}
        else if (keyframes.length === 1 || t === 0) {
            Object.assign(interpolatedAttribs, keyframes[0].attribs);
        } else if (t === 1) {
            Object.assign(interpolatedAttribs, keyframes[keyframes.length-1].attribs);
        } else if (keyframes.length > 1) {
            let startKeyframe;
            let endKeyframe;

            for (let i=1; i<keyframes.length; i++) {
                if (t >= keyframes[i].t) continue;
                startKeyframe = keyframes[i-1];
                endKeyframe = keyframes[i];
                break;
            }

            // Only attributes that are in both keyframes will be set in element
            const startAttribs = Object.entries(startKeyframe.attribs);
            for (let i=0; i<startAttribs.length; i++) {
                const [n] = startAttribs[i];
                if (!(n in endKeyframe.attribs)) {
                    startAttribs.splice(i, 1);
                    i--;
                }
            }

            const tRange = endKeyframe.t - startKeyframe.t;
            const newT = (t - startKeyframe.t) / tRange;
            for (const [n, v] of startAttribs) {
                let value, interpolator;
                switch (n) {
                    case "d":
                    case "path":
                        interpolator = Flubber.interpolate(v, endKeyframe.attribs[n], {
                            maxSegmentLength: pathInterpQuality
                        });
                        break;
                    default:
                        interpolator = D3.interpolate(v, endKeyframe.attribs[n]);
                }
                value = interpolator(newT);
                interpolatedAttribs[n] = value;
            }
        }

        for (const [n, v] of Object.entries(interpolatedAttribs)) {
            element.setAttribute(n, v);
        }

        for (let i=0; i<this.#children.length; i++) {
            element.appendChild(
                this.#children[i].generateElement(t, pathInterpQuality)
            );
        }

        return element;
    }

    static fromSerialized(serializedString) {
        const deserialize = (obj) => {
            const graphicNode = new GraphicNode(obj.elementName, obj.id, obj.className);
            graphicNode.setTextContent(obj.textContent);
            for (let i=0; i<obj.keyframes.length; i++) {
                graphicNode.addKeyframe(obj.keyframes[i]);
            }
            return graphicNode;
        }
        serializedString = JSON.parse(serializedString);
        const graphicNode = deserialize(serializedString);
        const stack = [[serializedString, graphicNode]];

        while (stack.length > 0) {
            const [serialized, node] = stack.pop();

            for (let i=0; i<serialized.children.length; i++) {
                const childSerialized = serialized.children[i];
                const childNode = deserialize(childSerialized);
                node.appendChild(childNode);
                stack.push([childSerialized, childNode]);
            }
        }

        return graphicNode;
    }
    serializeToString() {
        const serialize = (graphicNode) => {
            return {
                elementName: graphicNode.#elementName,
                id: graphicNode.#id,
                className: graphicNode.#className,
                textContent: graphicNode.#textContent,
                keyframes: graphicNode.#keyframes,
                children: []
            }
        }
        const stack = [[this, serialize(this)]];
        const json = stack[0][1];

        while (stack.length > 0) {
            const [graphicNode, serializedNode] = stack.pop();

            for (let i=0; i<graphicNode.#children.length; i++) {
                const node = graphicNode.#children[i];
                const serializedChild = serialize(node);
                serializedNode.children.push(serializedChild);
                stack.push([node, serializedChild]);
            }
        }

        return JSON.stringify(json);
    }
}