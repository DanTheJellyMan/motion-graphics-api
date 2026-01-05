import { CanvasSource, QUALITY_VERY_HIGH, Mp4OutputFormat, BufferTarget, Output } from "mediabunny";
import GraphicNode from "./GraphicNode.js";

export default class Graphic {
    #nodes = []; // Nodes are drawn in the order of this array (last item = on top/highest order)

    /* General properties (meaning: applying to more than 1 render mode) */
    #width;
    #height;
    #repeatCount;
    #duration; // In seconds

    #renderCtx = new OffscreenCanvas(0,0).getContext("2d");
    #fps = 30;

    /* GIF-specific */
    #gifEncoder;

    /* SVG-specific */
    #viewBox = "";
    #preserveAspectRatio = "";

    /* VIDEO-specific */
    #videoEncoderConfig = null;

    constructor(width, height, repeatCount, duration) {
        this.#width = width;
        this.#height = height;
        this.#repeatCount = repeatCount;
        this.#duration = duration;
        this.setGifEncoderSettings();
    }

    addNode(graphicNode, index = this.#nodes.length) {
        this.#nodes.splice(index, 0, graphicNode);
    }
    removeNode(index) {
        this.#nodes.splice(index, 1);
    }

    setWidth(width) {
        this.#width = width;
    }
    getWidth() {
        return this.#width;
    }

    setHeight(height) {
        this.#height = height;
    }
    getHeight() {
        return this.#height;
    }

    setRepeatCount(repeatCount) {
        this.#repeatCount = repeatCount;
    }
    getRepeatCount() {
        return this.#repeatCount;
    }

    setDuration(seconds) {
        this.#duration = seconds;
    }
    getDuration() {
        return this.#duration;
    }

    setFps(fps) {
        if (fps > 60) {
            this.#fps = 60;
            return console.warn("Max GIF FPS: 60");
        }
        if (fps > 30) {
            console.warn("WARNING: FPS counts above 30 may not play back at the full FPS. Be cautious of potential slowdowns in playback speed post-render");
        }
        this.#fps = fps;
    }
    getFps() {
        return this.#fps;
    }

    /**
     * @param {number} quality Pixel sample interval. Lower is better.
     * @param {boolean} hasTransparency If true, "transparent" parameter is set to #0f0
     * @param {number} workers Amount of worker threads spawned for rendering
     * @param {string} background Hex color of background. Overriden if "hasTransparency" is set to true
     * @param {false|string} dither When not false, this can enable a dithering method (refer to gif.js for all options)
     */
    setGifEncoderSettings(quality = 10, hasTransparency = true, workers = 2, background = "#fff", dither = false) {
        const width = this.#width;
        const height = this.#height;
        const repeatCount = this.#repeatCount;

        let repeat;
        switch (repeatCount) {
            case NaN:
            case 0:
                repeat = -1;
                break;
            case Infinity:
                repeat = 0;
                break;
            default:
                repeat = repeatCount;
                break;
        }

        this.#gifEncoder = new GIF({
            width, height, repeat,
            quality, dither, workers, workerScript: "/lib/gif-js/gif.worker.js",
            background: background, transparent: hasTransparency ? "#0f0" : null,
            debug: false // for testing
        });
    }

    setSvgViewBox(viewBox) {
        this.#viewBox = viewBox;
    }
    setSvgPreserveAspectRatio(preserveAspectRatio) {
        this.#preserveAspectRatio = preserveAspectRatio;
    }

    /**
     * @param {VideoEncoderConfig} config 
     * @returns {Promise<VideoEncoderConfig>} Resolves with a copy of the given config
     * @throws {TypeError|VideoEncoderConfig} Rejects if the provided config is invalid (TypeError returned), or if the config is unsupported by the encoder (VideoEncoderConfig returned)
     */
    setVideoEncoderConfig(userConfig) {
        return new Promise((resolve, reject) => {
            VideoEncoder.isConfigSupported(userConfig)
            .then(({ supported, config }) => {
                if (!supported) {
                    return reject(config);
                }
                this.#videoEncoderConfig = config;
                resolve(config);
            })
            .catch((err) => {
                reject(err);
            });
        });
    }

    /**
     * @param {string} renderMode Available options: 'GIF', 'SVG', 'VIDEO'
     * @param {(blob: Blob) => {}} finishedCallback 
     * @returns {Promise<Blob|null>} Even though SVG "rendering" happens fully synchronously, a promise is still returned for simplicity of usage
     */
    render(renderMode, finishedCallback = ()=>{}) {
        const { canvas } = this.#renderCtx;
        canvas.width = this.#width;
        canvas.height = this.#height;
        
        const invalidModeFunction = async () => null;
        let renderFunction;
        switch (renderMode) {
            case "GIF":
                renderFunction = this.#handleGifRender;
                break;
            case "SVG":
                renderFunction = this.#handleSvgRender;
                break;
            case "VIDEO":
                renderFunction = this.#handleVideoRender;
                break;
            default:
                console.error(`${renderMode} - invalid render mode`);
                renderFunction = invalidModeFunction;
        }
        renderFunction = renderFunction.bind(this);
        return renderFunction(finishedCallback);
    }

    async #handleGifRender(finishedCallback) {
        const encoder = this.#gifEncoder;
        const renderCtx = this.#renderCtx;
        const renderCanvas = renderCtx.canvas;
        const frameCount = this.#fps * this.#duration;
        const delay = (this.#duration * 1000) / (frameCount+1);
        
        for (let i=0; i<=frameCount; i++) {
            const t = i / frameCount;
            await this.drawFrame(t, renderCtx);

            const frameBlob = await renderCanvas.convertToBlob();
            const url = URL.createObjectURL(frameBlob);
            const canvImg = new Image();
            canvImg.src = url;
            await canvImg.decode();
            encoder.addFrame(canvImg, { delay, copy: true });
            URL.revokeObjectURL(url);
        }

        const finishedPromise = new Promise((resolve) => {
            encoder.on("finished", (blob) => {
                finishedCallback(blob);
                resolve(blob);
            });
            encoder.render();
        });
        return await finishedPromise;
    }

    async #handleSvgRender(finishedCallback) {
        const { svgNS } = GraphicNode;
        const normalizeGraphicNode = (node) => {
            const keyframes = node.getFormattedKeyframes();
            const setAttribKeyframes = (attribName, attribValue) => {
                for (let i=0; i<keyframes.length; i++) {
                    keyframes[i].attribs[attribName] = attribValue;
                }
            }

            switch (keyframes[0].attribs.xmlns) {
                case "": case undefined:
                    setAttribKeyframes("xmlns", svgNS);
            }
            setAttribKeyframes("width", this.#width);
            setAttribKeyframes("height", this.#height);

            let viewBox = (this.#viewBox !== "") ?
                this.#viewBox :
                `0 0 ${this.#width} ${this.#height}`;
            setAttribKeyframes("viewBox", viewBox);

            if (this.#preserveAspectRatio !== "") {
                setAttribKeyframes("preserveAspectRatio", this.#preserveAspectRatio);
            }

            const containerKeyframes = node.getKeyframes();
            containerKeyframes.length = 0;
            containerKeyframes.push(...keyframes);
        }

        // Note: cloning is done because of normalizeContainerNode(),
        // which sets the formatted keyframes as the node's real keyframes
        let containerNode;
        if (this.#nodes.length === 1 && this.#nodes[0].getElementName() === "svg") {
            containerNode = this.#nodes[0].clone();
        } else {
            containerNode = new GraphicNode("svg");
            this.#nodes.forEach((node) => containerNode.appendChild(node.clone()));
        }
        normalizeGraphicNode(containerNode);

        const containerNodeElement = this.createGraphicNodeElement(containerNode);
        const svgBlob = new Blob([containerNodeElement.outerHTML], {
            type: "image/svg+xml;charset=utf-8"
        });
        finishedCallback(svgBlob);
        return svgBlob;
    }

    async #handleVideoRender() {
        const renderCtx = this.#renderCtx;
        const frameCount = this.#fps * this.#duration;

        const output = new Output({
            format: new Mp4OutputFormat({ fastStart: "in-memory" }),
            target: new BufferTarget()
        });
        const videoSource = new CanvasSource(renderCtx.canvas);
        output.addVideoTrack

        for (let i=0; i<frameCount; i++) {
            const t = i / frameCount;
            await this.drawFrame(t, renderCtx);
            
        }

        resolve(null);
    }

    async drawFrame(t, ctx = this.#renderCtx) {
        const { width, height } = ctx.canvas;
        ctx.clearRect(0, 0, width, height);
        for (const node of this.#nodes) {
            const svg = node.generateElement(t, 1);
            const img = GraphicNode.createSvgImage(svg);
            await img.decode();
            ctx.drawImage(img, 0, 0, width, height);
        }
    }

    /**
     * Creates an SVG element from a GraphicNode with proper animation elements added (not the same as GraphicNode.generateElement()).
     * @param {GraphicNode} graphicNode 
     * @returns {HTMLElement}
     */
    createGraphicNodeElement(graphicNode) {
        const { svgNS } = GraphicNode;
        const createElement = (node) => {
            const element = document.createElementNS(svgNS, node.getElementName());
            const id = node.getId();
            if (id !== "") element.id = id;
            const className = node.getClassName();
            if (className !== "") element.classList.add(...className.split(" "));
            element.textContent = node.getTextContent();

            const keyframes = node.getFormattedKeyframes();
            if (keyframes.length === 1) {
                for (const [n, v] of Object.entries(keyframes[0].attribs)) {
                    element.setAttribute(n, v);
                }
            } else if (keyframes.length > 1) {
                const dur = `${this.#duration}s`;
                const repeatCount = this.#repeatCount === Infinity ? "indefinite" : this.#repeatCount;
                const keyTimes = keyframes.map((keyframe) => keyframe.t).join("; ");
                
                for (const [attributeName, attributeValue] of Object.entries(keyframes[0].attribs)) {
                    let propValues = [];
                    for (let i=0; i<keyframes.length; i++) {
                        propValues.push(keyframes[i].attribs[attributeName]);
                    }
                    element.setAttribute(attributeName, attributeValue);
                    if (allArrayItemsEqual(propValues)) {
                        continue;
                    }

                    const animateElement = document.createElementNS(svgNS, "animate");
                    animateElement.setAttribute("attributeName", attributeName);
                    animateElement.setAttribute("values", propValues.join("; "));
                    animateElement.setAttribute("dur", dur);
                    animateElement.setAttribute("repeatCount", repeatCount);
                    animateElement.setAttribute("keyTimes", keyTimes);
                    element.appendChild(animateElement);
                }
            }
            return element;
        }

        const nodeElement = createElement(graphicNode);
        const stack = [[graphicNode, nodeElement]];

        while (stack.length > 0) {
            const [node, element] = stack.pop();

            for (const childNode of node.getChildren()) {
                const childElement = createElement(childNode);
                element.appendChild(childElement);
                stack.push([childNode, childElement]);
            }
        }

        return nodeElement;

        function allArrayItemsEqual(arr) {
            let prev = arr[0];
            for (let i=1; i<arr.length; i++) {
                if (prev !== arr[i]) return false;
                prev = arr[i];
            }
            return true;
        }
    }
}