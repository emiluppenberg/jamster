import { Server } from "node:http";
import WebSocket, { WebSocketServer } from "ws";
import type { McpPatternData } from "@jamster/shared"

export const clientPort = 5173;

export const InitializeWebSocketServer = (server: Server) => {
    const wss = new WebSocketServer({ server });
    const connections = new Map<string, WebSocket>();
    const sessionData = new Map<string, McpPatternData[]>();

    const handleMessage = (appSessionId: string, message: WebSocket.RawData) => {
        const patterns = JSON.parse(message.toString()) as McpPatternData[];
        sessionData.set(appSessionId, patterns);
    }

    const handleCloseConnection = (appSessionId: string) => {
        console.log(`Closing connection to ${appSessionId}`)
        connections.delete(appSessionId);
    }

    wss.on("connection", (connection, request) => {
        const parsedUrl = new URL(request.url ?? "", `http://localhost:${clientPort}`);
        const appSessionId = parsedUrl.searchParams.get("appSessionId");

        if (!appSessionId) return;

        connections.set(appSessionId, connection);
        console.log(appSessionId);
        connection.on("close", () => handleCloseConnection(appSessionId))
        connection.on("message", (message) => handleMessage(appSessionId, message))
    })

    return { connections, sessionData };
}
