import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { getPatternByNameInputSchema, McpPatternDataSchema, setRhythmMeasureNotesInputSchema } from "./schema.js";
import type { McpMeasureData, McpPatternData, SetRhythmDto } from "./schema.js";
import WebSocket from "ws"
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

export const InitializeMcpServer = async (
    connections: Map<string, WebSocket>,
    sessionData: Map<string, McpPatternData[]>
) => {
    const mcpServer = new McpServer({
        name: "jamster",
        version: "1.0.0"
    })

    mcpServer.registerTool(
        "setRhythmMeasureNotes",
        {
            description: "Set the notes for each measure of a specified rhythm within a specified pattern",
            inputSchema: setRhythmMeasureNotesInputSchema,
        },
        async (inputs) => {
            const dto: SetRhythmDto = {
                patternName: inputs.patternName,
                rhythm: {
                    index: inputs.rhythmIndex,
                    notesPerMeasure: inputs.notesPerMeasure,
                    measures: inputs.measures
                }
            }

            const connection = connections.get(inputs.base.appSessionId);

            if (!connection) {
                return {
                    isError: true,
                    content: [
                        {
                            type: "text",
                            text: `No connection found for AppSessionId: ${inputs.base.appSessionId}`
                        }
                    ]
                }
            }

            connection.send(JSON.stringify(dto));

            return {
                content: [
                    {
                        type: "text",
                        text: `Rhythm set in AppSessionId: ${inputs.base.appSessionId}`
                    }
                ]
            }
        }
    )

    mcpServer.registerTool(
        "getPatternByName",
        {
            description: "Get a specified pattern",
            inputSchema: getPatternByNameInputSchema,
            outputSchema: McpPatternDataSchema
        },
        async (inputs) => {
            const session = sessionData.get(inputs.base.appSessionId);

            if (!session) {
                return {
                    isError: true,
                    content: [
                        {
                            type: "text",
                            text: `No data found for AppSessionId: ${inputs.base.appSessionId}`
                        }
                    ]
                }
            }

            const pattern = session.find(pattern => pattern.patternName === inputs.patternName);

            if (!pattern) {
                return {
                    isError: true,
                    content: [
                        {
                            type: "text",
                            text: `No pattern found with name: ${inputs.patternName}`
                        }
                    ]
                }
            }

            return {
                structuredContent: pattern,
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(pattern)
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
