import z from "zod/v4";

export const McpNoteDataSchema = z.object({
    index: z.number().describe("Index of the note"),
    value: z.string().max(1).describe("A number between 1-9 will play the rhythm sample with a corresponding velocity. 0 will mute previous notes. An empty string will not interrupt previous notes or play a new one.")
})

export const McpMeasureDataSchema = z.object({
    index: z.number().describe("Index of the measure"),
    notes: z.array(McpNoteDataSchema)
})

export const McpRhythmDataSchema = z.object({
    index: z.number().describe("Index of the rhythm"),
    notesPerMeasure: z.number().describe("4, 8, 16, 32 or 64"),
    measures: z.array(McpMeasureDataSchema)
})

export const McpPatternDataSchema = z.object({
    patternName: z.string().describe("Name of the pattern"),
    rhythms: z.array(McpRhythmDataSchema)
})

export const SetRhythmDtoSchema = z.object({
    patternName: z.string(),
    rhythm: McpRhythmDataSchema
})

export const McpSocketMessageSchema = z.discriminatedUnion("type", [
    z.object({
        type: z.literal("setRhythmMeasureNotes"),
        payload: SetRhythmDtoSchema
    })
])

export type McpNoteData = z.infer<typeof McpNoteDataSchema>;
export type McpMeasureData = z.infer<typeof McpMeasureDataSchema>;
export type McpRhythmData = z.infer<typeof McpRhythmDataSchema>;
export type McpPatternData = z.infer<typeof McpPatternDataSchema>;
export type SetRhythmDto = z.infer<typeof SetRhythmDtoSchema>;
export type McpSocketMessage = z.infer<typeof McpSocketMessageSchema>;
