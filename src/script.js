import Graphic from "./modules/Graphic.js";
import GraphicNode from "./modules/GraphicNode.js";

const ctx = document.querySelector("#preview-container > canvas").getContext("2d");
const designer = document.querySelector("#graphic-designer");
const GRAPHIC_WIDTH = 1000;
const GRAPHIC_HEIGHT = 1000;
const GRAPHIC_BG_COLOR = "hsl(300,0%,30%)";

const graphic = new Graphic(GRAPHIC_WIDTH, GRAPHIC_HEIGHT, Infinity, 1.5);
graphic.setFps(45);
graphic.setGifEncoderSettings(10, false, navigator.hardwareConcurrency, GRAPHIC_BG_COLOR);
graphic.setSvgViewBox(`0 0 ${GRAPHIC_WIDTH} ${GRAPHIC_HEIGHT}`);

const parentNode = new GraphicNode("svg");
parentNode.addKeyframe({
    t: 0,
    attribs: {
        "width": GRAPHIC_WIDTH,
        "height": GRAPHIC_HEIGHT
    }
});

const node = new GraphicNode("rect");
node.addKeyframe({
    t: 0,
    attribs: {
        "x": 0,
        "y": 0,
        "width": GRAPHIC_WIDTH,
        "height": GRAPHIC_HEIGHT,
        "fill": GRAPHIC_BG_COLOR,
        "stroke": "orangered",
        "stroke-width": "8%",
        "stroke-linecap": "round",
        "stroke-dasharray": "1% 20%",
        "stroke-dashoffset": "0%"
    }
});
node.addKeyframe({
    t: 1,
    attribs: {
        "x": 0,
        "y": 0,
        "width": GRAPHIC_WIDTH,
        "height": GRAPHIC_HEIGHT,
        "fill": GRAPHIC_BG_COLOR,
        "stroke": "orangered",
        "stroke-width": "8%",
        "stroke-linecap": "round",
        "stroke-dasharray": "1% 20%",
        "stroke-dashoffset": "21%",
        "border-radius": "5rem"
    }
});

const node2 = new GraphicNode("text");
node2.addKeyframe({
    t: 0,
    attribs: {
        "font-size": `${GRAPHIC_HEIGHT*(1/3)}px`,
        "fill": "hsl(0,100%,50%)",
    }
});
node2.addKeyframe({
    t: 1/3,
    attribs: {
        "font-size": `${GRAPHIC_HEIGHT*(1/3)}px`,
        "fill": "hsl(120,100%,50%)",
    }
});
node2.addKeyframe({
    t: 2/3,
    attribs: {
        "font-size": `${GRAPHIC_HEIGHT*(1/3)}px`,
        "fill": "hsl(240,100%,50%)",
    }
});
node2.addKeyframe({
    t: 1,
    attribs: {
        "font-size": `${GRAPHIC_HEIGHT*(1/3)}px`,
        "fill": "hsl(360,100%,50%)",
    }
});
const text1 = new GraphicNode("tspan");
text1.setTextContent("so");
text1.addKeyframe({
    t: 0,
    attribs: {
        "x": GRAPHIC_WIDTH*0.25,
        "y": GRAPHIC_HEIGHT*(1/3),
        "dy": `7%`
    }
});
const text2 = new GraphicNode("tspan");
text2.setTextContent("cool");
text2.addKeyframe({
    t: 0,
    attribs: {
        "x": GRAPHIC_WIDTH*0.25,
        "y": GRAPHIC_HEIGHT*(1/3),
        "dy": `${GRAPHIC_HEIGHT*(1/3)}px`
    }
})
node2.appendChild(text1);
node2.appendChild(text2);

parentNode.appendChild(node);
parentNode.appendChild(node2);
graphic.addNode(parentNode);

const startT = performance.now();

// graphic.render("SVG").then(handleRenderFinish);
// graphic.render("GIF").then(handleRenderFinish);

function handleRenderFinish(blob) {
    console.log(`Render Time: ${(performance.now() - startT)/1000} seconds`);
    console.log(blob);
    const confirmMessage = `Download rendered graphic? (${getFilesizeFromBlob(blob)})\nType: ${blob.type}`;
    const url = URL.createObjectURL(blob);
    if (window.confirm(confirmMessage)) {
        const a = document.createElement("a");
        a.href = url;
        a.download = `rendered_graphic (${new Date().toLocaleString()}).${getExtFromBlob(blob)}`;
        a.click();
    } else {
        window.open(url);
    }
    URL.revokeObjectURL(url);
}

function getFilesizeFromBlob(blob) {
    const units = ["KB", "MB", "GB", "TB"];
    let unit = "B";
    let { size } = blob;
    let nextUnitI = 0;
    let temp;

    while ((temp = size / 1000) >= 1) {
        size = temp;
        unit = units[Math.min(nextUnitI, units.length-1)];
        nextUnitI++;
    }

    return `${size.toFixed(1)} ${unit}`;
}

function getExtFromBlob(blob) {
    const regex = /^[A-Z]$/i;
    const { type } = blob;
    const startI = type.indexOf("/")+1;
    let endI = type.length;
    for (let i=startI; i<type.length; i++) {
        if (regex.test(type[i])) continue;
        endI = i;
        break;
    }
    return type.substring(startI, endI);
}