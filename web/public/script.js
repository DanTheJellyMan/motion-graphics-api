import Graphic from "/lib/Graphic.js";
import GraphicNode from "/lib/GraphicNode.js";

const ctx = document.querySelector("#preview-container > canvas").getContext("2d");
const designer = document.querySelector("#graphic-designer");

const graphic = new Graphic(10, 200, 200, Infinity, 30);
const parentNode = new GraphicNode("svg");
parentNode.addKeyframe({
    t: 0,
    attribs: {
        width: 200,
        height: 200
    }
});
const node = new GraphicNode("path");
node.addKeyframe({
    t: 0,
    attribs: {
        "d": "M0 0 L200 200 L0 200 Z",
        "fill": "hotpink",
        "stroke": "lime",
        "stroke-width": "5"
    }
});
parentNode.appendChild(node);

document.body.appendChild(parentNode.generateElement());
// graphic.addNode(node);

// graphic.render("GIF").then((blob) => {
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