import { useEffect, useRef, useState } from "react";
import { useJamsterContext } from "../Context";
import type { PatternData, TimelineRowData } from "../types";
import { useWebSocket } from "react-use-websocket/dist/lib/use-websocket";
import { getNotePosition64, mcpUrl, wssUrl } from "../utils";
import { McpSocketMessageSchema } from "@beatdoc/shared"
import type { McpAppSessionData, CreatePatternDto, McpPatternData, SetRhythmDto, McpSampleData } from "@beatdoc/shared"

interface McpSocketProps {
    patterns: PatternData[];
    timelineRows: TimelineRowData[];
    onPatternChange: (pattern: PatternData) => void;
    onPatternAdded: (pattern: PatternData) => void;
    onTimelineRowsChange: (timelineRows: TimelineRowData[]) => void;
}

const McpSocket = (props: McpSocketProps) => {
    const { audioContext, analyserNode, appSessionId, storedSamples } = useJamsterContext();
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
        const numberOfMeasures = dto.rhythm.measures.length;
        if (!pattern) return;

        props.onPatternChange({
            ...pattern,
            numberOfMeasures: numberOfMeasures,
            rhythms: pattern.rhythms.map((rhythm, rhythmIndex) => {
                if (rhythm.name !== dto.rhythm.name) return rhythm;

                const storedSample = storedSamples.find(sample => sample.sampleFilename === dto.rhythm.sampleFilename)

                return {
                    ...rhythm,
                    sample: storedSample?.audioBuffer,
                    sampleFilename: dto.rhythm.sampleFilename,
                    index: rhythmIndex,
                    notesPerMeasure: dto.rhythm.notesPerMeasure,
                    measures: dto.rhythm.measures.map((measure, measureIndex) => ({
                        index: measureIndex,
                        notes: Array.from(measure.notes, (note, index) => ({
                            index: index,
                            position64: getNotePosition64(index, dto.rhythm.notesPerMeasure),
                            value: note,
                        })),
                    })),
                };
            }),
        });
    };

    const handleCreatePattern = async (dto: CreatePatternDto) => {
        const nextIndexPattern = Math.max(0, ...props.patterns.map(pattern => pattern.index)) + 1

        props.onPatternAdded({
            index: nextIndexPattern,
            name: dto.patternName,
            numberOfMeasures: dto.numberOfMeasures,
            rhythms: await Promise.all(dto.rhythms.map(async (rhythm, rhythmIndex) => {
                const gainNode = audioContext.createGain();
                gainNode.gain.value = 0;
                gainNode.connect(analyserNode);

                const storedSample = storedSamples.find(sample => sample.sampleFilename === rhythm.sampleFilename);

                return {
                    index: rhythmIndex,
                    name: rhythm.name,
                    notesPerMeasure: rhythm.notesPerMeasure,
                    gainNode: gainNode,
                    sampleFilename: rhythm.sampleFilename,
                    sample: storedSample?.audioBuffer,
                    measures: rhythm.measures.map((measure, measureIndex) => ({
                        index: measureIndex,
                        notes: Array.from(measure.notes, (note, index) => ({
                            index: index,
                            position64: getNotePosition64(index, rhythm.notesPerMeasure),
                            value: note
                        })),
                    }))
                }
            }))
        })

        const nextIndexTimelineRow = Math.max(0, ...props.timelineRows.map(row => row.index)) + 1;
        const slotsLength = Math.max(0, ...props.timelineRows.map(row => row.slots.length));

        props.onTimelineRowsChange([...props.timelineRows, {
            index: nextIndexTimelineRow,
            slots: Array.from({ length: slotsLength }, () => nextIndexPattern)
        }])
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
        const patternData: McpPatternData[] = props.patterns.map((pattern) => ({
            patternName: pattern.name,
            rhythms: pattern.rhythms.map((rhythm) => ({
                name: rhythm.name,
                notesPerMeasure: rhythm.notesPerMeasure,
                sampleFilename: rhythm.sampleFilename,
                measures: rhythm.measures.map((measure) => ({
                    notes: measure.notes.map((note) => note.value).join("")
                }))
            }))
        }));

        const sampleData: McpSampleData[] = storedSamples.map(sample => ({
            description: sample.mcpDescription,
            filename: sample.sampleFilename
        }));

        const appSessionData: McpAppSessionData = {
            patternData: patternData,
            sampleData: sampleData
        }

        sendJsonMessage(appSessionData);
    }, [props.patterns, storedSamples])

    const handleToggle = () => {
        console.log(props.patterns, props.timelineRows)
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
                        <h2 className="dialog-eyebrow">MCP</h2>
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
                <p className="dialog-hint">
                    Example - "Create a 2 measure funk beat using available samples in appsessionid XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
                </p>
            </dialog>
        </div>
    )
}

export default McpSocket;
