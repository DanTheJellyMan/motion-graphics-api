import Graphic from "/lib/Graphic.js";
import GraphicNode from "/lib/GraphicNode.js";

const ctx = document.querySelector("#preview-container > canvas").getContext("2d");
const designer = document.querySelector("#graphic-designer");
const GRAPHIC_WIDTH = 200;
const GRAPHIC_HEIGHT = 200;

const graphic = new Graphic(GRAPHIC_WIDTH, GRAPHIC_HEIGHT, Infinity, 2);
graphic.setGifFps(30);
graphic.setGifEncoderSettings(Infinity, 10, true, 1, "#0f0");
graphic.setSvgViewBox(`0 0 ${GRAPHIC_WIDTH} ${GRAPHIC_HEIGHT}`);

const parentNode = new GraphicNode("svg");
parentNode.addKeyframe({
    t: 0,
    attribs: {
        "width": GRAPHIC_WIDTH,
        "height": GRAPHIC_HEIGHT
    }
});
const node = new GraphicNode("path");
node.addKeyframe({
    t: 0,
    attribs: {
        "d": "M0,0 L200,200 L0,200 Z",
        "fill": "hotpink",
        "stroke": "lime",
        "stroke-width": "5"
    }
});
node.addKeyframe({
    t: 0.5,
    attribs: {
        "d": "M100,0 L50,150 L50,100Z",
        "fill": "hotpink",
        "stroke": "purple",
        "stroke-width": "8"
    }
});
node.addKeyframe({
    t: 1,
    attribs: {
        "d": "M100,100 L200,200 L100,200Z",
        "fill": "orange",
        "stroke": "red",
        "stroke-width": "0"
    }
});

parentNode.appendChild(node);
graphic.addNode(parentNode);

const startT = performance.now();
graphic.render("SVG").then((blob) => {
    console.log(blob);
    const url = URL.createObjectURL(blob);
    console.log(`render time: ${performance.now() - startT}`);
    window.open(url);
});

// graphic.render("GIF", async (_, blob) => {
//     const url = URL.createObjectURL(blob);
//     const img = new Image();
//     img.src = url;
//     await img.decode();
//     const { width: canvWidth, height: canvHeight } = ctx.canvas;
//     const aspectRatio = img.width / img.height;
//     ctx.clearRect(0, 0, canvWidth, canvHeight);
//     ctx.drawImage(
//         img,
//         0,
//         0,
//         (canvWidth * (aspectRatio > 1)) + ((canvHeight * aspectRatio * (aspectRatio <= 1))),
//         (canvHeight * (aspectRatio >= 1)) + (canvWidth * (1/aspectRatio) * (aspectRatio > 1))
//     );
//     URL.revokeObjectURL(url);
// })
// .then((blob) => {
//     console.log(blob);
//     const gifUrl = URL.createObjectURL(blob);
//     if (window.confirm("Download rendered GIF?")) {
//         const a = document.createElement("a");
//         a.href = gifUrl;
//         a.download = "render.gif";
//         a.click();
//     } else {
//         window.open(gifUrl);
//     }
//     URL.revokeObjectURL(gifUrl);
// });