import GraphicNode from "/lib/GraphicNode.js";

export default class Graphic {
    #nodes = []; // Nodes are drawn in the order of this array (last item = on top/highest order)
    #gifEncoder;
    #renderCtx;
    #duration = 1; // In seconds
    #fps = 30;

    /* General properties */
    #width;
    #height;
    #repeatCount;

    constructor() {
        this.setGifEncoderSettings();
    }

    setGifEncoderSettings(width = 800, height = 600, repeatCount = Infinity, quality = 10, hasTransparency = true, workers = 2, background = "#fff", dither = false) {
        this.#width = width;
        this.#height = height;
        this.#repeatCount = repeatCount;

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
            background: background, transparent: hasTransparency ? "#000" : null,
            debug: true // for testing
        });

        this.#renderCtx = new OffscreenCanvas(width, height).getContext("2d");
    }

    setDuration(seconds) {
        this.#duration = seconds;
    }

    setFps(fps) {
        this.#fps = fps;
    }

    addNode(graphicNode, index = this.#nodes.length) {
        this.#nodes.splice(index, 0, graphicNode);
    }
    removeNode(index) {
        this.#nodes.splice(index, 1);
    }

    /**
     * @param {string} renderMode 
     * @param {Function} frameRenderedCallback Runs after each render of a frame, or whenever encoder.addFrame() is called. Can be used to do things such as changing draw order between renders. Passed parameters (note: "frameIndex" is 0-indexed): (frameIndex: number, frameBlob: Blob) => {...}
     * @param {Function} finishedCallback 
     * @returns {Promise<Blob|SVGElement>}
     */
    render(renderMode, frameRenderedCallback = ()=>{}, finishedCallback = ()=>{}) {
        return new Promise((resolve, reject) => {
            const handleGifRender = async () => {
                const encoder = this.#gifEncoder;
                const renderCtx = this.#renderCtx;
                const renderCanvas = renderCtx.canvas;
                const frameCount = this.#fps * this.#duration;
                const delay = (this.#duration * 1000) / frameCount;
                
                for (let i=0; i<frameCount; i++) {
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
                    frameRenderedCallback(i, frameBlob);
                }

                encoder.on("finished", (blob) => {
                    finishedCallback(blob);
                    resolve(blob);
                });
                encoder.render();
            }

            const handleSvgRender = async () => {

            }

            switch (renderMode) {
                case "GIF":
                    handleGifRender();
                    break;
                case "SVG":
                    handleSvgRender();
                    break;
            }
        });
    }
}