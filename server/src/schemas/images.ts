import z from "zod";


export const UploadImageParamsSchema = z.object({
    removeBackGround:z.string().default("false").optional(),
    webhookUrl:z.url().default("https://seuservico/webhook").optional(),
})