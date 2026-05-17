const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_ROOT = path.resolve(__dirname, "..", "frontend");
const GAME_ROOT = path.resolve(__dirname, "game");
const gameState = {
  inventory: {
    wood: 0,
    meat: 0,
    stone: 0
  },
  updatedAt: new Date().toISOString()
};

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8"
};

function sendJson(response, statusCode, data) {
  response.writeHead(statusCode, { "Content-Type": MIME_TYPES[".json"] });
  response.end(JSON.stringify(data, null, 2));
}

function readJsonBody(request, response, callback) {
  let body = "";

  request.on("data", (chunk) => {
    body += chunk;
    if (body.length > 10000) {
      request.destroy();
    }
  });

  request.on("end", () => {
    try {
      callback(body ? JSON.parse(body) : {});
    } catch (error) {
      sendJson(response, 400, { error: "Invalid JSON body" });
    }
  });
}

function sendFile(response, filePath) {
  fs.readFile(filePath, (error, content) => {
    if (error) {
      sendJson(response, 404, { error: "File not found" });
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    response.writeHead(200, {
      "Content-Type": MIME_TYPES[extension] || "application/octet-stream"
    });
    response.end(content);
  });
}

function getStaticPath(requestPath) {
  const routePath = requestPath === "/" ? "/index.html" : requestPath;
  const filePath = path.resolve(PUBLIC_ROOT, `.${routePath}`);

  if (!filePath.startsWith(PUBLIC_ROOT)) {
    return null;
  }

  return filePath;
}

function getGameModulePath(requestPath) {
  if (!requestPath.startsWith("/game/") && !requestPath.startsWith("/backend/game/")) {
    return null;
  }

  const modulePath = requestPath.startsWith("/backend/game/")
    ? requestPath.slice("/backend/game/".length)
    : requestPath.slice("/game/".length);
  const filePath = path.resolve(GAME_ROOT, modulePath);

  if (!filePath.startsWith(GAME_ROOT) || path.extname(filePath) !== ".js") {
    return null;
  }

  return filePath;
}

function normalizeInventory(inventory) {
  return {
    wood: Math.max(0, Number(inventory?.wood) || 0),
    meat: Math.max(0, Number(inventory?.meat) || 0),
    stone: Math.max(0, Number(inventory?.stone) || 0)
  };
}

function handleApi(request, requestPath, response) {
  if (requestPath === "/api/health") {
    sendJson(response, 200, { status: "ok" });
    return true;
  }

  if (requestPath === "/api/game-info") {
    sendJson(response, 200, {
      name: "SurvivorCraft",
      versions: {
        main: "/"
      }
    });
    return true;
  }

  if (requestPath === "/api/game-state" && request.method === "GET") {
    sendJson(response, 200, gameState);
    return true;
  }

  if (requestPath === "/api/game-state" && request.method === "POST") {
    readJsonBody(request, response, (body) => {
      gameState.inventory = normalizeInventory(body.inventory);
      gameState.updatedAt = new Date().toISOString();
      sendJson(response, 200, gameState);
    });
    return true;
  }

  return false;
}

const server = http.createServer((request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);
  const requestPath = decodeURIComponent(requestUrl.pathname);

  if (requestPath === "/3d-version" || requestPath === "/3d-version/index.html") {
    response.writeHead(301, { Location: "/" });
    response.end();
    return;
  }

  if (handleApi(request, requestPath, response)) {
    return;
  }

  const gameModulePath = getGameModulePath(requestPath);
  if (gameModulePath) {
    sendFile(response, gameModulePath);
    return;
  }

  const filePath = getStaticPath(requestPath);
  if (!filePath) {
    sendJson(response, 403, { error: "Forbidden" });
    return;
  }

  sendFile(response, filePath);
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use.`);
    console.error("Stop the process using that port, or start this server with another port:");
    console.error("  $env:PORT=3001; npm start");
    process.exit(1);
  }

  throw error;
});

server.listen(PORT, () => {
  console.log(`SurvivorCraft backend running at http://localhost:${PORT}`);
});
