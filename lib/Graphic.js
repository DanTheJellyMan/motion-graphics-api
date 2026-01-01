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
    setHeight(height) {
        this.#height = height;
    }
    setRepeatCount(repeatCount) {
        this.#repeatCount = repeatCount;
    }
    setDuration(seconds) {
        this.#duration = seconds;
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
            debug: true // for testing
        });

        this.#renderCtx = new OffscreenCanvas(width, height).getContext("2d");
    }
    setGifFps(fps) {
        if (fps > 60) {
            this.#fps = 60;
            return console.warn("Max GIF FPS: 60");
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
     * @param {Function} frameAddedCallback Runs after every encoder.addFrame() call. Can be used to do things, such as changing draw order. Passed parameters (note: "frameIndex" is 0-indexed): (frameIndex: number, frameBlob: Blob) => {...}
     * @param {Function} finishedCallback 
     * @returns {Promise<Blob>}
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

            const handleSvgRender = async () => {
                // Description: create each graphicNode's svg element in hierarchical order.
                // Make sure to handle animations via their keyframes appropriately.
                const { svgNS } = GraphicNode;

                const createGraphicNodeElement = (graphicNode) => {
                    const element = document.createElementNS(svgNS, graphicNode.getElementName());
                    const id = graphicNode.getId();
                    if (id !== "") element.id = id;
                    const className = graphicNode.getClassName();
                    if (className !== "") element.classList.add(...className.split(" "));

                    const keyframes = graphicNode.getKeyframes();
                    const dur = `${this.#duration}s`;
                    const repeatCount = this.#repeatCount === Infinity ? "indefinite" : this.#repeatCount;
                    const keyTimes = keyframes.map((keyframe) => keyframe.t).join("; ");
                    
                    // TODO: add handling for 0 and 1 length keyframe lists
                    const sKeyframe = keyframes[0];
                    for (const attributeName of Object.keys(sKeyframe.attribs)) {
                        let propValues = [];
                        for (let i=0; i<keyframes.length; i++) {
                            propValues.push(keyframes[i].attribs[attributeName]);
                        }
                        const animateElement = document.createElementNS(svgNS, "animate");
                        animateElement.setAttribute("attributeName", attributeName);
                        animateElement.setAttribute("values", propValues.join("; "));
                        animateElement.setAttribute("dur", dur);
                        animateElement.setAttribute("repeatCount", repeatCount);
                        animateElement.setAttribute("keyTimes", keyTimes);
                        element.appendChild(animateElement);
                    }

                    return element;
                }

                // TODO: add children in order using createGraphicNodeElement() recursively/iteratively
                let svgContainer;
                if (this.#nodes.length === 1 && this.#nodes[0] instanceof SVGSVGElement) {
                    svgContainer = this.#nodes[0];
                } else {
                    svgContainer = document.createElementNS(svgNS, "svg");
                }
                svgContainer.setAttribute("xmlns", "http://www.w3.org/2000/svg");
                svgContainer.setAttribute("width", this.#width);
                svgContainer.setAttribute("height", this.#height);
                if (this.#viewBox === "") {
                    svgContainer.setAttribute("viewBox", `0 0 ${this.#width} ${this.#height}`);
                } else {
                    svgContainer.setAttribute("viewBox", this.#viewBox);
                }
                if (this.#preserveAspectRatio !== "") {
                    svgContainer.setAttribute("preserveAspectRatio", this.#preserveAspectRatio);
                }

                const svgElement = createGraphicNodeElement(this.#nodes[0].getChildren()[0]);
                svgContainer.appendChild(svgElement);

                const svgBlob = new Blob([svgContainer.outerHTML], {
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
}