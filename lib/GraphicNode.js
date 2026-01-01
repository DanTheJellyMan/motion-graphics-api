import * as D3 from "/lib/d3/d3-interpolate/index.js";

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
    getKeyframes() {
        return this.#keyframes;
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
        // TODO: check for any recursive-ness before setting
        this.#parent = graphicNode;
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
        t = Math.min(Math.max(0, t), 1);
        pathInterpQuality = Math.max(1, pathInterpQuality);
        const element = document.createElementNS(GraphicNode.#svgNS, this.#elementName);

        const interpolatedAttribs = {};
        if (this.#keyframes.length === 0) {}
        else if (this.#keyframes.length === 1 || t === 0) {
            Object.assign(interpolatedAttribs, this.#keyframes[0].attribs);
        } else if (t === 1) {
            Object.assign(interpolatedAttribs, this.#keyframes[this.#keyframes.length-1].attribs);
        } else if (this.#keyframes.length > 1) {
            let startKeyframe;
            let endKeyframe;

            for (let i=1; i<this.#keyframes.length; i++) {
                if (t >= this.#keyframes[i].t) continue;
                startKeyframe = this.#keyframes[i-1];
                endKeyframe = this.#keyframes[i];
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
                        interpolator = flubber.interpolate(v, endKeyframe.attribs[n], {
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
}