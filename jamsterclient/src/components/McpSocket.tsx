import { useEffect, useRef } from "react";
import { useJamsterContext } from "../Context";
import type { PatternData } from "../types";
import { useWebSocket } from "react-use-websocket/dist/lib/use-websocket";
import { getNotePosition64, mcpUrl, wssUrl } from "../utils";
import type { McpPatternData, SetRhythmDto } from "../../../jamstermcp/src/schema"

interface McpSocketProps {
    patterns: PatternData[];
    onPatternChange: (pattern: PatternData) => void;
}

const McpSocket = (props: McpSocketProps) => {
    const { appSessionId } = useJamsterContext();
    const dialogRef = useRef<HTMLDialogElement>(null);
    const { sendJsonMessage, getWebSocket } = useWebSocket(wssUrl, { queryParams: { appSessionId } });
    const ws = getWebSocket()

    const handleSocketMessage = (event: MessageEvent) => {
        const dto = JSON.parse(event.data) as SetRhythmDto;

        const pattern = props.patterns.find((pattern) => pattern.name === dto.patternName);
        if (!pattern) return;

        props.onPatternChange({
            ...pattern,
            rhythms: pattern.rhythms.map((rhythm) => {
                if (rhythm.index !== dto.rhythm.index) return rhythm;

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

    const { sendJsonMessage } = useWebSocket(wssUrl, {
        queryParams: { appSessionId },
        onMessage: handleSocketMessage,
        onOpen: () => setIsSocketOpen(true),
        onClose: () => setIsSocketOpen(false),
        onError: () => setIsSocketError(true)
    });

    useEffect(() => {
        const data: McpPatternData[] = props.patterns.map((pattern) => ({
            patternName: pattern.name,
            rhythms: pattern.rhythms.map((rhythm) => ({
                index: rhythm.index,
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

    return (
        <div className="mcp pattern-mcp">
            <button className="btn" onClick={handleToggle}>MCP</button>
            <dialog ref={dialogRef}>
                <label>AppSessionId</label>
                <input
                    type="text"
                    disabled={true}
                    value={appSessionId}
                />
            </dialog>
        </div>
    )
}

export default McpSocket;