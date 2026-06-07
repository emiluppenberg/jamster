import z from "zod/v4";
import { McpMeasureDataSchema } from "@jamster/shared";

export const baseInputSchema = z.object({
    appSessionId: z.string().describe("uuid identifying the users client-app-instance")
})

export const setRhythmMeasureNotesInputSchema = {
    base: baseInputSchema,
    patternName: z.string().describe("Name of the pattern which owns the rhythm"),
    rhythmIndex: z.number().describe("Index of the rhythm"),
    notesPerMeasure: z.number().describe("4, 8, 16, 32 or 64"),
    measures: z.array(McpMeasureDataSchema)
}

export const getPatternByNameInputSchema = {
    base: baseInputSchema,
    patternName: z.string().describe("Name of the pattern to get")
}
