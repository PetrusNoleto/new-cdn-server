import z from "zod";


export const UploadImageParamsSchema = z.object({
    removeBackground:z.string().default("false").optional(),
    webhookUrl:z.url().default("https://seuservico/webhook").optional(),
})