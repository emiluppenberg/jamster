import { Server } from "node:http";
import WebSocket, { WebSocketServer } from "ws";
import type { McpAppSessionData } from "@beatdoc/shared"

const appSessionIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const allowedOrigins = [process.env.ALLOWED_ORIGIN, process.env.ALLOWED_ORIGIN_DEV].filter((origin): origin is string => Boolean(origin));

export const InitializeWebSocketServer = (server: Server) => {
    const wss = new WebSocketServer({ noServer: true });
    const connections = new Map<string, WebSocket>();
    const sessionData = new Map<string, McpAppSessionData>();

    server.on("upgrade", (request, socket, head) => {
        if (!request.headers.origin || !allowedOrigins.includes(request.headers.origin)) {
            socket.destroy();
            return;
        }

        wss.handleUpgrade(request, socket, head, (connection) => {
            wss.emit("connection", connection, request);
        });
    });

    const handleMessage = (connection: WebSocket, appSessionId: string, message: WebSocket.RawData) => {
        try {
            const appSessionData = JSON.parse(message.toString()) as McpAppSessionData;
            sessionData.set(appSessionId, appSessionData);
        } catch {
            connection.close(1007, "Invalid JSON");
        }
    }

    const handleCloseConnection = (appSessionId: string) => {
        connections.delete(appSessionId);
    }

    wss.on("connection", (connection, request) => {
        const parsedUrl = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
        const appSessionId = parsedUrl.searchParams.get("appSessionId");

        if (!appSessionId || !appSessionIdPattern.test(appSessionId)) {
            connection.close(1008, "Invalid appSessionId");
            return;
        }

        connections.set(appSessionId, connection);

        connection.on("close", () => handleCloseConnection(appSessionId))
        connection.on("message", (message) => handleMessage(connection, appSessionId, message))
    })

    return { connections, sessionData };
}
