import z from "zod/v4";

export const baseInputSchema = z.object({
    appSessionId: z.string().describe("uuid identifying the users client-app-instance")
})

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
    measures: z.array(McpMeasureDataSchema)
})

export const McpPatternDataSchema = z.object({
    patternName: z.string().describe("Name of the pattern"),
    rhythms: z.array(McpRhythmDataSchema)
})

export const setRhythmMeasureNotesInputSchema = {
    base: baseInputSchema,
    patternName: z.string().describe("Name of the pattern which owns the rhythm"),
    rhythmIndex: z.number().describe("Index of the rhythm"),
    measures: McpMeasureDataSchema
}

export const getPatternByNameInputSchema = {
    base: baseInputSchema,
    patternName: z.string().describe("Name of the pattern to get")
}

export type McpNoteData = z.infer<typeof McpNoteDataSchema>;
export type McpMeasureData = z.infer<typeof McpMeasureDataSchema>;
export type McpRhythmData = z.infer<typeof McpRhythmDataSchema>;
export type McpPatternData = z.infer<typeof McpPatternDataSchema>;