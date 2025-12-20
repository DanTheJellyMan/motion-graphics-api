import Graphic from "/lib/Graphic.js";
import GraphicNode from "/lib/GraphicNode.js";

const ctx = document.querySelector("#preview-container > canvas").getContext("2d");

const graphic = new Graphic(10, 200, 200, Infinity, 30);
const node = new GraphicNode(200, 200, 100);
const nodeSvg = node.getSvg();
const path = document.createElementNS(GraphicNode.svgNS, "path");
path.setAttribute("d", "M0 0 L200 200 L0 200 Z");
path.setAttribute("fill", "hotpink");
path.setAttribute("stroke", "lime");
path.setAttribute("stroke-width", "5");
nodeSvg.appendChild(path);

const node2 = new GraphicNode(200, 200, 500);
const node2Svg = node2.getSvg();
const path2 = document.createElementNS(GraphicNode.svgNS, "path");
path2.setAttribute("d", "M50 0 L250 200 L50 200 Z");
path2.setAttribute("fill", "hotpink");
path2.setAttribute("stroke", "lime");
path2.setAttribute("stroke-width", "20");
node2Svg.appendChild(path2);

graphic.addNode(node);
graphic.addNode(node2);
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

// setInterval(() => {
//     const { width, height } = ctx.canvas;
//     const lineWidth = 10;
//     const lineHeight = 20;
//     const gap = 10;
//     let x = (lineWidth/2) * Math.sin(Math.sqrt((performance.now()/10) * Math.sqrt(performance.now()))) - (width/4);

//     ctx.clearRect(0, 0, width, height);
//     ctx.fillStyle = "orange";
//     while (x < width) {
//         ctx.fillRect(
//             x,
//             height/2 - (lineHeight/2),
//             lineWidth,
//             lineHeight
//         );
//         x += lineWidth + gap;
//     }
// }, 1000 / 165);