import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { type McpSocketMessage, type SetRhythmDto, McpPatternDataSchema, CreatePatternDtoSchema, SetRhythmDtoSchema, CreatePatternDto, AppSessionData } from "@jamster/shared";
import WebSocket from "ws"
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import z from "zod";

export const InitializeMcpServer = async (
    connections: Map<string, WebSocket>,
    sessionData: Map<string, AppSessionData>
) => {
    const mcpServer = new McpServer({
        name: "jamster",
        version: "1.0.0"
    })

    mcpServer.registerTool(
        "setRhythm",
        {
            description: "Set the notes for each measure of a specified rhythm within a specified pattern",
            inputSchema: {
                appSessionId: z.string().describe("uuid identifying the users client-app-instance"),
                dto: SetRhythmDtoSchema
            },
        },
        async (inputs) => {
            const dto: SetRhythmDto = {
                patternName: inputs.dto.patternName,
                rhythm: {
                    name: inputs.dto.rhythm.name,
                    notesPerMeasure: inputs.dto.rhythm.notesPerMeasure,
                    sampleFilename: inputs.dto.rhythm.sampleFilename,
                    measures: inputs.dto.rhythm.measures
                }
            }

            const connection = connections.get(inputs.appSessionId);

            if (!connection) {
                return {
                    isError: true,
                    content: [
                        {
                            type: "text",
                            text: `No connection found for AppSessionId: ${inputs.appSessionId}`
                        }
                    ]
                }
            }

            const message: McpSocketMessage = {
                type: "setRhythm",
                payload: dto
            }

            connection.send(JSON.stringify(message));

            return {
                content: [
                    {
                        type: "text",
                        text: `Rhythm set in AppSessionId: ${inputs.appSessionId}`
                    }
                ]
            }
        }
    )

    mcpServer.registerTool(
        "createPattern",
        {
            description: "Create a new pattern",
            inputSchema: {
                appSessionId: z.string().describe("uuid identifying the users client-app-instance"),
                dto: CreatePatternDtoSchema
            }
        },
        async (inputs) => {
            const dto: CreatePatternDto = {
                patternName: inputs.dto.patternName,
                numberOfMeasures: inputs.dto.numberOfMeasures,
                rhythms: inputs.dto.rhythms.map(rhythm => ({
                    name: rhythm.name,
                    notesPerMeasure: rhythm.notesPerMeasure,
                    sampleFilename: rhythm.sampleFilename,
                    measures: rhythm.measures
                }))
            }

            const connection = connections.get(inputs.appSessionId);

            if (!connection) {
                return {
                    isError: true,
                    content: [
                        {
                            type: "text",
                            text: `No connection found for AppSessionId: ${inputs.appSessionId}`
                        }
                    ]
                }
            }

            const message: McpSocketMessage = {
                type: "createPattern",
                payload: dto
            }

            connection.send(JSON.stringify(message));

            return {
                content: [
                    {
                        type: "text",
                        text: `Created pattern ${inputs.dto.patternName} in AppSessionId: ${inputs.appSessionId}`
                    }
                ]
            }
        }
    )

    mcpServer.registerTool(
        "getAppSessionData",
        {
            description: "Get current patterns and available sampleFilenames for a specified AppSessionId",
            inputSchema: {
                appSessionId: z.string().describe("uuid identifying the users client-app-instance")
            },
            outputSchema: {
                patternData: z.array(McpPatternDataSchema),
                sampleFilenames: z.array(z.string())
            }
        },
        async (inputs) => {
            const appSessionData = sessionData.get(inputs.appSessionId);

            if (!appSessionData) {
                return {
                    isError: true,
                    content: [
                        {
                            type: "text",
                            text: `No data found for AppSessionId: ${inputs.appSessionId}`
                        }
                    ]
                }
            }

            return {
                structuredContent: appSessionData,
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(appSessionData)
                    }
                ]
            }
        }
    )

    const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableJsonResponse: true
    });

    await mcpServer.connect(transport as Transport);

    return transport;
}
