export default class GraphicNode {
    /*
        NOTE: absolutely NO animations inside svg (e.g., <animate>).
        This is because of the GIF output rendering.
    */
    static #svgNS = "http://www.w3.org/2000/svg";
    #svg = document.createElementNS(GraphicNode.#svgNS, "svg");
    #keyframes = [];

    constructor(width = 800, height = 600) {
        const svg = this.#svg;
        svg.setAttribute("width", width);
        svg.setAttribute("height", height);
        svg.setAttribute("viewbox", `0 0 ${width} ${height}`);
    }

    addKeyframe(keyframe) {
        if (!GraphicNode.verifyKeyframe(keyframe)) return false;
        
        const keyframes = this.#keyframes;
        let keyframeAdded = false;
        for (let i=0; i<keyframes.length; i++) {
            const { t } = keyframes[i];
            if (keyframe.t < t) continue;

            keyframes.splice(Math.max(0, i-1), 0, keyframe);
            keyframeAdded = true;
            break;
        }

        if (!keyframeAdded) keyframes.push(keyframe);
        return true;
    }
    removeKeyframe(index = this.#keyframes.length-1) {
        this.#keyframes.splice(index, 1);
    }

    getSvg() {
        return this.#svg;
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

    static createKeyframe() {
        const keyframe = {
            
        };
        return keyframe;
    }
    static verifyKeyframe(keyframe) {
        if (!keyframe || typeof keyframe !== "object" || keyframe.constructor !== Object) {
            return false;
        }
        if (!("t" in keyframe) || typeof keyframe.t !== "number" || keyframe.t < 0 || keyframe.t > 1) {
            return false;
        }
        return true;
    }

    static get svgNS() {
        return this.#svgNS;
    }
}