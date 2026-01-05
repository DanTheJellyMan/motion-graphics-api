import GraphicNode from "/lib/GraphicNode.js";

export default class Graphic {
    #nodes = []; // Nodes are drawn in the order of this array (last item = on top/highest order)

    /* General properties */
    #width;
    #height;
    #repeatCount;
    #duration; // In seconds

    /* GIF-specific */
    #renderCtx;
    #gifEncoder;
    #fps = 30;

    /* SVG-specific */
    #viewBox = "";
    #preserveAspectRatio = "";

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

        this.#renderCtx = new OffscreenCanvas(width, height).getContext("2d");
    }
    setGifFps(fps) {
        if (fps > 60) {
            this.#fps = 60;
            return console.warn("Max GIF FPS: 60");
        }
        if (fps > 30) {
            console.warn("WARNING: FPS counts above 30 may not play back at the full FPS. Be cautious of potential slowdowns in playback speed post-render");
        }
        this.#fps = fps;
    }

    setSvgViewBox(viewBox) {
        this.#viewBox = viewBox;
    }
    setSvgPreserveAspectRatio(preserveAspectRatio) {
        this.#preserveAspectRatio = preserveAspectRatio;
    }

    /**
     * @param {string} renderMode 
     * @param {(frameIndex: number, frameBlob: Blob) => {}} frameAddedCallback Runs after every GIF renderer encoder.addFrame() call
     * @param {Function} finishedCallback 
     * @returns {Promise<Blob>} Even though SVG "rendering" happens fully synchronously, a promise is still returned for simplicity of usage
     */
    render(renderMode, frameAddedCallback = ()=>{}, finishedCallback = ()=>{}) {
        return new Promise((resolve, reject) => {
            const handleGifRender = async () => {
                const encoder = this.#gifEncoder;
                const renderCtx = this.#renderCtx;
                const renderCanvas = renderCtx.canvas;
                const frameCount = this.#fps * this.#duration;
                const delay = (this.#duration * 1000) / (frameCount+1);
                
                for (let i=0; i<=frameCount; i++) {
                    renderCtx.clearRect(0, 0, renderCanvas.width, renderCanvas.height);
                    for (const node of this.#nodes) {
                        const svg = node.generateElement(i / frameCount, 1);
                        const img = GraphicNode.createSvgImage(svg);
                        await img.decode();
                        renderCtx.drawImage(img, 0, 0);
                    }

                    const frameBlob = await renderCanvas.convertToBlob();
                    const url = URL.createObjectURL(frameBlob);
                    const canvImg = new Image();
                    canvImg.src = url;
                    await canvImg.decode();
                    encoder.addFrame(canvImg, { delay, copy: true });
                    URL.revokeObjectURL(url);
                    frameAddedCallback(i, frameBlob);
                }

                encoder.on("finished", (blob) => {
                    finishedCallback(blob);
                    resolve(blob);
                });
                encoder.render();
            }

            const handleSvgRender = () => {
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
                resolve(svgBlob);
            }

            switch (renderMode) {
                case "GIF":
                    handleGifRender();
                    break;
                case "SVG":
                    handleSvgRender();
                    break;
                default:
                    reject(`${renderMode} - invalid render mode`);
                    break;
            }
        });
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