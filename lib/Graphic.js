import GraphicNode from "/lib/GraphicNode.js";

export default class Graphic {
    #nodes = [];
    #rendererCtx = null;
    #gifEncoder = null;
    #fps;

    /* General properties */
    #width;
    #height;
    #repeatCount;

    /* GIF properties */
    #quality;
    #workerCount;

    /* SVG properties */

    constructor(fps = 30, width = 800, height = 600, repeatCount = Infinity, quality = 10, workerCount = 2, transparency = true) {
        this.#fps = fps;
        this.#width = width;
        this.#height = height;
        this.#repeatCount = repeatCount;
        this.#quality = quality;
        this.#workerCount = workerCount;
        this.initGifEncoder();
    }

    initGifEncoder(transparency = true) {
        let repeatCount;
        switch (this.#repeatCount) {
            case 0:
                repeatCount = -1;
                break;
            case Infinity:
                repeatCount = 0;
                break;
            default:
                repeatCount = this.#repeatCount;
                break;
        }

        this.#gifEncoder = new GIF({
            repeat: repeatCount,
            quality: this.#quality,
            workers: this.#workerCount,
            transparent: transparency ? "#000" : null,
            workerScript: "/lib/gif-js/gif.worker.js",
            width: this.#width,
            height: this.#height,
            debug: true // for testing
        });
        this.#rendererCtx = new OffscreenCanvas(this.#width, this.#height)
        .getContext("2d", { alpha: true });
    }

    render(renderMode, callback = ()=>{}) {
        return new Promise((resolve, reject) => {
            const handleGifRender = async () => {
                const encoder = this.#gifEncoder;
                for (const node of this.#nodes) {
                    const delay = node.getDelay();
                    const copy = true;
                    const svg = node.getSvg();
                    const img = GraphicNode.createSvgImage(svg);
                    await img.decode();
                    encoder.addFrame(img, { delay, copy });
                }
                encoder.on("finished", (blob) => {
                    callback(blob);
                    resolve(blob);
                });
                encoder.render();
                console.log(encoder);
            }

            const handleSvgRender = () => {

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

    addNode(graphicNode, index = this.#nodes.length) {
        this.#nodes.splice(index, 0, graphicNode);
    }
    removeNode(index) {
        this.#nodes.splice(index, 1);
    }
}