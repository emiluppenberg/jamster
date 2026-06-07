import { useEffect, useRef, useState } from "react";
import { useJamsterContext } from "../Context";
import type { PatternData } from "../types";
import { useWebSocket } from "react-use-websocket/dist/lib/use-websocket";
import { createRhythm, getNotePosition64, mcpUrl, wssUrl } from "../utils";
import { McpSocketMessageSchema } from "@jamster/shared"
import type { CreatePatternDto, McpPatternData, SetRhythmDto } from "@jamster/shared"

interface McpSocketProps {
    patterns: PatternData[];
    onPatternChange: (pattern: PatternData) => void;
    onPatternAdded: (pattern: PatternData) => void;
}

const McpSocket = (props: McpSocketProps) => {
    const { audioContext, analyserNode, appSessionId } = useJamsterContext();
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [isSocketOpen, setIsSocketOpen] = useState(false);
    const [isSocketError, setIsSocketError] = useState(false);
    const status = isSocketError
        ? { className: "is-error", text: "Could not connect to MCP" }
        : isSocketOpen
            ? { className: "is-connected", text: "Connected via WebSocket" }
            : { className: "is-closed", text: "MCP connection closed" };

    const handleSetRhythm = (dto: SetRhythmDto) => {
        const pattern = props.patterns.find((pattern) => pattern.name === dto.patternName);
        if (!pattern) return;

        props.onPatternChange({
            ...pattern,
            rhythms: pattern.rhythms.map((rhythm) => {
                if (rhythm.name !== dto.rhythm.name) return rhythm;

                return {
                    ...rhythm,
                    notesPerMeasure: dto.rhythm.notesPerMeasure,
                    measures: dto.rhythm.measures.map((measure) => ({
                        ...measure,
                        notes: measure.notes.map((note) => ({
                            ...note,
                            position64: getNotePosition64(note.index, dto.rhythm.notesPerMeasure),
                        })),
                    })),
                };
            }),
        });
    };

    const handleCreatePattern = (dto: CreatePatternDto) => {
        props.onPatternAdded({
            index: props.patterns.length,
            name: dto.patternName,
            numberOfMeasures: dto.numberOfMeasures,
            rhythms: dto.rhythms.map((rhythm, index) => {
                const gainNode = audioContext.createGain();
                gainNode.gain.value = 0;
                gainNode.connect(analyserNode);

                return {
                    index: index,
                    name: rhythm.name,
                    notesPerMeasure: rhythm.notesPerMeasure,
                    gainNode: gainNode,
                    sample: undefined,
                    sampleFilename: "",
                    measures: rhythm.measures.map((measure) => ({
                        ...measure,
                        notes: measure.notes.map((note) => ({
                            ...note,
                            position64: getNotePosition64(note.index, rhythm.notesPerMeasure),
                        })),
                    }))
                }
            })
        })
    }

    const handleSocketMessage = (event: MessageEvent) => {
        const parsed = McpSocketMessageSchema.safeParse(JSON.parse(event.data));
        if (!parsed.success) return;

        switch (parsed.data.type) {
            case "setRhythm":
                handleSetRhythm(parsed.data.payload);
                break;
            case "createPattern":
                handleCreatePattern(parsed.data.payload);
                break;
        }
    };

    const { sendJsonMessage } = useWebSocket(wssUrl, {
        queryParams: { appSessionId },
        onMessage: handleSocketMessage,
        onOpen: () => {
            setIsSocketOpen(true);
            setIsSocketError(false);
        },
        onClose: () => setIsSocketOpen(false),
        onError: () => setIsSocketError(true)
    });

    useEffect(() => {
        const data: McpPatternData[] = props.patterns.map((pattern) => ({
            patternName: pattern.name,
            rhythms: pattern.rhythms.map((rhythm) => ({
                name: rhythm.name,
                notesPerMeasure: rhythm.notesPerMeasure,
                measures: rhythm.measures.map((measure) => ({
                    index: measure.index,
                    notes: measure.notes.map((note) => ({
                        index: note.index,
                        value: note.value
                    }))
                }))
            }))
        }));

        sendJsonMessage(data);
    }, [props.patterns])

    const handleToggle = () => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        if (dialog.open) {
            dialog.close();
        } else {
            dialog.showModal();
        }
    }

    const handleClose = () => {
        dialogRef.current?.close();
    }

    return (
        <div className="mcp">
            <button className="btn" onClick={handleToggle}>MCP</button>
            <dialog className="mcp-dialog" ref={dialogRef}>
                <div className="dialog-header">
                    <div>
                        <h2 className="dialog-eyebrow">Connection</h2>
                    </div>
                    <button className="btn dialog-close" type="button" onClick={handleClose}>
                        X
                    </button>
                </div>
                <div className={`mcp-dialog-status ${status.className}`}>
                    <span className="mcp-dialog-status-dot"></span>
                    <span>{status.text}</span>
                </div>
                <div className="mcp-dialog-fields">
                    <label htmlFor="mcp-app-session-id">AppSessionId</label>
                    <input
                        id="mcp-app-session-id"
                        type="text"
                        readOnly={true}
                        value={appSessionId}
                    />
                    <label htmlFor="mcp-url">MCP Url</label>
                    <input
                        id="mcp-url"
                        type="text"
                        readOnly={true}
                        value={mcpUrl}
                    />
                </div>
                <p className="dialog-hint">Provide AppSessionId with your prompt.</p>
            </dialog>
        </div>
    )
}

export default McpSocket;
