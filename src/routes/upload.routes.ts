import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import uploadController from "../controllers/upload.controller";

export async function uploadRoutes(api: FastifyInstance) {
	api.withTypeProvider<ZodTypeProvider>().post("/image", {
		schema: {
			tags: ["Uploads"],
			summary: "update image",
			consumes: ["multipart/form-data"],
			description: "update image",
		},
		handler: uploadController.image,
	});
	api.withTypeProvider<ZodTypeProvider>().post("/video", {
		schema: {
			tags: ["Uploads"],
			summary: "upload video",
			consumes: ["multipart/form-data"],
			description: "upload video",
		},
		handler: uploadController.video,
	});
}
