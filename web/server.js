const fs = require("fs");
const path = require("path");
const http = require("http");
const PORT = 3000;
const server = http.createServer((req, res) => {
    let encoding = "utf8";
    let statusCode = 200;
    let content = "";
    let reqUrl = req.url.substring(0, 2) === "./" ? req.url.substring(2) : req.url;
    reqUrl = reqUrl.charAt(0) === "/" ? reqUrl.substring(1) : reqUrl;
    if (reqUrl === "") reqUrl = "index.html";
    const resourceArr = reqUrl.split("/");
    const resourceName = resourceArr[resourceArr.length-1];
    let fileExtension = "";
    for (let i=resourceName.length-1; i>=0; i--) {
        if (resourceName.charAt(i) !== ".") continue;
        fileExtension = resourceName.substring(i+1);
        break;
    }
    const resourceDir = path.resolve(
        (resourceArr[0] === "lib") ?
        (__filename, "../") :
        (__dirname, "./public")
    );

    try {
        content = fs.readFileSync(
            path.join(resourceDir, ...resourceArr),
            { encoding }
        );
    } catch (err) {
        if (fileExtension !== "ico" && resourceArr[0] !== "src") {
            console.error(err);
        }
        content = "Not Found";
        statusCode = 404;
    }

    res.writeHead(statusCode, {
        "Content-Type": determineContentType(fileExtension)
    });
    res.end(content);
});

server.listen(PORT, () => console.log(`Listening on port ${PORT}...`));

function determineContentType(fileExtension) {
    switch (fileExtension) {
        case "html":
            return "text/html";
        case "css":
            return "text/css";
        case "js":
            return "text/javascript";
        case "ico":
            return "image/x-icon";
        default:
            return "";
    }
}