import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import imageController from "../controllers/image.controller";
import {  UploadImageParamsSchema } from "../schemas/images";
export async function imageRoutes(api: FastifyInstance) {
	api.withTypeProvider<ZodTypeProvider>().post("/", {
		schema: {
			tags: ["Imagens"],
			summary: "upload image",
			consumes: ["multipart/form-data"],
			querystring:UploadImageParamsSchema,
			description: "upload image",
		},
		handler: imageController.upload,
	});
    api.withTypeProvider<ZodTypeProvider>().get("/:id", {
		schema: {
			tags: ["Imagens"],
			summary: "retiviere image data",
			description: "retiviere image data",
		},
		handler: imageController.find,
	});
}
