import * as http from "node:http"
import { InitializeWebSocketServer } from "./websocket-server.js";
import { InitializeMcpServer } from "./mcp.js";

export const serverPort = 3000;

const server = http.createServer();
server.listen(serverPort)

const { sessionData, connections } = InitializeWebSocketServer(server);

server.on("request", async (request, response) => {
    if (request.url?.startsWith("/mcp")) {
        const mcpTransport = await InitializeMcpServer(connections, sessionData);
        await mcpTransport.handleRequest(request, response);
        return;
    }
})

