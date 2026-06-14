import * as http from "node:http"
import { InitializeWebSocketServer } from "./websocket-server.js";
import { InitializeMcpServer } from "./mcp.js";

export const serverPort = Number.parseInt(process.env.PORT ?? "3000", 10);
const serverHost = "0.0.0.0";

const server = http.createServer();
server.listen(serverPort, serverHost, () => {
    console.log(`MCP server listening on ${serverHost}:${serverPort}`);
})

const { sessionData, connections } = InitializeWebSocketServer(server);

server.on("request", async (request, response) => {
    if (request.url?.startsWith("/mcp")) {
        const mcpTransport = await InitializeMcpServer(connections, sessionData);
        await mcpTransport.handleRequest(request, response);
        return;
    }
})

