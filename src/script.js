import Graphic from "./modules/Graphic.js";
import GraphicNode from "./modules/GraphicNode.js";

initDropdowns();
// const { projectData, graphic } = loadProject(JSON.parse(String.raw`
//     {"graphic":{"nodes":["{\"elementName\":\"svg\",\"id\":\"\",\"className\":\"\",\"textContent\":\"\",\"keyframes\":[{\"t\":0,\"attribs\":{\"width\":1000,\"height\":1000}}],\"children\":[{\"elementName\":\"rect\",\"id\":\"\",\"className\":\"\",\"textContent\":\"\",\"keyframes\":[{\"t\":0,\"attribs\":{\"x\":0,\"y\":0,\"width\":1000,\"height\":1000,\"fill\":\"hsl(300,0%,30%)\",\"stroke\":\"white\",\"stroke-width\":\"4%\",\"stroke-linecap\":\"round\",\"stroke-dasharray\":\"4% 17%\",\"stroke-dashoffset\":\"0%\"}},{\"t\":1,\"attribs\":{\"x\":0,\"y\":0,\"width\":1000,\"height\":1000,\"fill\":\"hsl(300,0%,30%)\",\"stroke\":\"white\",\"stroke-width\":\"4%\",\"stroke-linecap\":\"round\",\"stroke-dasharray\":\"4% 17%\",\"stroke-dashoffset\":\"21%\"}}],\"children\":[]},{\"elementName\":\"text\",\"id\":\"\",\"className\":\"\",\"textContent\":\"\",\"keyframes\":[{\"t\":0,\"attribs\":{\"font-size\":\"333.3333333333333px\",\"fill\":\"hsl(0,100%,50%)\"}},{\"t\":0.3333333333333333,\"attribs\":{\"font-size\":\"333.3333333333333px\",\"fill\":\"hsl(120,100%,50%)\"}},{\"t\":0.6666666666666666,\"attribs\":{\"font-size\":\"333.3333333333333px\",\"fill\":\"hsl(240,100%,50%)\"}},{\"t\":1,\"attribs\":{\"font-size\":\"333.3333333333333px\",\"fill\":\"hsl(360,100%,50%)\"}}],\"children\":[{\"elementName\":\"tspan\",\"id\":\"\",\"className\":\"\",\"textContent\":\"so\",\"keyframes\":[{\"t\":0,\"attribs\":{\"x\":250,\"y\":333.3333333333333,\"dy\":\"7%\"}}],\"children\":[]},{\"elementName\":\"tspan\",\"id\":\"\",\"className\":\"\",\"textContent\":\"cool\",\"keyframes\":[{\"t\":0,\"attribs\":{\"x\":250,\"y\":333.3333333333333,\"dy\":\"333.3333333333333px\"}}],\"children\":[]}]}]}"],"width":1000,"height":1000,"repeatCount":null,"duration":2,"fps":15,"viewBox":"0 0 1000 1000","preserveAspectRatio":"","videoEncoderConfig":null}}
// `));

/* PROJECT FORMAT:
    {
        // REQUIRED
        graphic: {
            // REQUIRED
            nodes: SerializedGraphicNode[],
            width: number,
            height: number,
            repeatCount: number,
            duration: number,

            // NOT REQUIRED
            fps: number,
            viewBox: string
            preserveAspectRatio: string,
            videoEncoderConfig: Object
        },

        // NOT REQUIRED
        ui: {
            html: string
        }
    }
*/
/* TODO: verification checks for properties in the load and create functions (wherever exists() is called) */
function loadProject(projectData) {
    if (!projectData) {
        projectData = createProject();
    }
    const { graphic: options } = projectData;
    const graphic = new Graphic(options.width, options.height, options.repeatCount, options.duration);
    if (exists(options, "fps")) {
        graphic.setFps(options.fps);
    }
    if (exists(options, "viewBox")) {
        graphic.setSvgViewBox(options.viewBox);
    }
    if (exists(options, "preserveAspectRatio")) {
        graphic.setSvgPreserveAspectRatio(options.preserveAspectRatio);
    }
    if (exists(options, "videoEncoderConfig") && options.videoEncoderConfig) {
        graphic.setVideoEncoderConfig(options.videoEncoderConfig);
    }

    for (const serializedNode of options.nodes) {
        const graphicNode = GraphicNode.fromSerialized(serializedNode);
        graphic.addNode(graphicNode);
    }

    if (exists(projectData, "ui")) {
        const { ui } = projectData;
        if (exists(ui, "html")) {
            document.body.innerHTML = ui.html;
        }
    }

    return { projectData, graphic };
}
function createProject(params = {}) {
    if (!exists(params, "graphic")) {
        params.graphic = {};
    }
    const g = params.graphic;
    if (!exists(g, "nodes")) {
        g.nodes = [];
    }
    if (!exists(g, "width")) {
        g.width = 800;
    }
    if (!exists(g, "height")) {
        g.height = 600;
    }
    if (!exists(g, "repeatCount")) {
        g.repeatCount = Infinity;
    }
    if (!exists(g, "duration")) {
        g.duration = 1;
    }

    // Do validation for non-required graphic options
    // ...

    if (exists(params, "ui")) {
        const { ui } = params;
        if (exists(ui, "html") && false) {
            delete ui.html;
        }
    }

    return params;
}
function exists(obj, propName) {
    return (
        propName in obj &&
        obj[propName] !== undefined
    );
}

function initDropdowns() {
    const dropdownContainers = document.querySelectorAll("body > *:has(.dropdown)");
    dropdownContainers.forEach((dropdownContainer) => {
        const dropdowns = dropdownContainer.querySelectorAll(".dropdown");
        let selectingDropdown = false;

        dropdowns.forEach((dropdown) => {
            dropdown.setAttribute("tabindex", "0");

            dropdown.addEventListener("click", (e) => {
                if (e.target.nodeName !== "P") return;
                shrinkDropdowns();
                selectingDropdown = flipBoolean(selectingDropdown);
                if (selectingDropdown) dropdown.classList.add("expanded");
            });

            dropdown.addEventListener("mouseenter", (e) => {
                if (!selectingDropdown) return;
                shrinkDropdowns();
                dropdown.classList.add("expanded");
            });

            dropdown.querySelectorAll("ul > li").forEach((ul) => {
                ul.setAttribute("tabindex", "0");
            });
        });

        document.addEventListener("click", (e) => {
            if (dropdownContainer.contains(e.target)) return;
            selectingDropdown = false;
            shrinkDropdowns();
        });

        function shrinkDropdowns() {
            dropdowns.forEach((dropdown) => {
                dropdown.classList.remove("expanded");
            });
        }
    });
}

const GRAPHIC_WIDTH = 1000;
const GRAPHIC_HEIGHT = 1000;
const GRAPHIC_BG_COLOR = "hsl(300,0%,30%)";

const graphic = new Graphic(GRAPHIC_WIDTH, GRAPHIC_HEIGHT, Infinity, 2);
graphic.setFps(15);
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
        "stroke": "white",
        "stroke-width": "4%",
        "stroke-linecap": "round",
        "stroke-dasharray": "4% 17%",
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
        "stroke": "white",
        "stroke-width": "4%",
        "stroke-linecap": "round",
        "stroke-dasharray": "4% 17%",
        "stroke-dashoffset": "21%"
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
// console.log(JSON.stringify(graphic.exportProjectData(false), null, 4));

const startT = performance.now();
graphic.render("SVG").then(handleRenderFinish);
// graphic.render("GIF").then(handleRenderFinish);
// graphic.render("VIDEO", null, async (bitmap, i) => {
//     ctx.transferFromImageBitmap(bitmap);
//     console.log(`${i+1} / ${graphic.getFps() * graphic.getDuration()}`);
// }).then(handleRenderFinish);

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

function base64EncodeImage(img) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const base64 = canvas.toDataURL();
    canvas.remove();
    return base64;
}

function flipBoolean(boolean) {
    return Boolean(Math.abs(Number(boolean)-1));
}