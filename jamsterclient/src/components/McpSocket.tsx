import { useEffect, useRef } from "react";
import { useJamsterContext } from "../Context";
import type { PatternData } from "../types";
import { useWebSocket } from "react-use-websocket/dist/lib/use-websocket";
import { wssUrl } from "../utils";
import type { McpPatternData } from "../../../jamstermcp/src/schema"

interface McpSocketProps {
    patterns: PatternData[];
}

const McpSocket = (props: McpSocketProps) => {
    const { appSessionId } = useJamsterContext();
    const dialogRef = useRef<HTMLDialogElement>(null);
    const { sendJsonMessage, getWebSocket } = useWebSocket(wssUrl, { queryParams: { appSessionId } });
    const ws = getWebSocket()

    const handleToggle = () => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        if (dialog.open) {
            dialog.close();
        } else {
            dialog.showModal();
        }
    }

    useEffect(() => {
        const data: McpPatternData[] = props.patterns.map((pattern) => ({
            patternName: pattern.name,
            rhythms: pattern.rhythms.map((rhythm) => ({
                index: rhythm.index,
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