import * as http from "node:http"
import { InitializeWebSocketServer } from "./websocket-server.js";
import { InitializeMcpServer } from "./mcp.js";

export const serverPort = 8000;

const server = http.createServer();
server.listen(serverPort)

const { sessionData, connections } = InitializeWebSocketServer(server);

server.on("request", async (request, response) => {
    if (request.url?.includes("kill")) {
        process.exit();
    }

    if (request.url?.startsWith("/mcp")) {
        const mcpTransport = await InitializeMcpServer(connections, sessionData);
        await mcpTransport.handleRequest(request, response);
        return;
    }

    let sessions = "";
    for (const kvp of Array.from(sessionData.entries())) {
        sessions += `AppSessionId: ${kvp[0]}\n`;
    }

    response.writeHead(200, { "Content-Type": "text/plain" });
    response.end(sessions);
})
