import z from "zod/v4";

export const McpMeasureDataSchema = z.object({
    index: z.number().describe("Index of the measure"),
    notes: z.string().describe("Notation for the measure. The length should match notesPerMeasure of parent rhythm. Characters are singular notes which can be either '-' or a number between 0-9 representing velocity.")
})

export const McpRhythmDataSchema = z.object({
    name: z.string().describe("Name of the rhythm"),
    notesPerMeasure: z.number().describe("4, 8, 16, 32 or 64"),
    sampleFilename: z.string().describe("Filename of sample used for this rhythm"),
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

export const CreatePatternDtoSchema = z.object({
    patternName: z.string().describe("Name of the pattern"),
    numberOfMeasures: z.number().describe("Number of measures for every rhythm"),
    rhythms: z.array(McpRhythmDataSchema)
})

export const McpSocketMessageSchema = z.discriminatedUnion("type", [
    z.object({
        type: z.literal("setRhythm"),
        payload: SetRhythmDtoSchema
    }),
    z.object({
        type: z.literal("createPattern"),
        payload: CreatePatternDtoSchema
    })
])

export type McpMeasureData = z.infer<typeof McpMeasureDataSchema>;
export type McpRhythmData = z.infer<typeof McpRhythmDataSchema>;
export type McpPatternData = z.infer<typeof McpPatternDataSchema>;

export type SetRhythmDto = z.infer<typeof SetRhythmDtoSchema>;
export type CreatePatternDto = z.infer<typeof CreatePatternDtoSchema>;

export type McpSocketMessage = z.infer<typeof McpSocketMessageSchema>;

export type AppSessionData = {
    patternData: McpPatternData[],
    sampleFilenames: string[]
}