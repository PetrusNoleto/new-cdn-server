import { fastifyMultipart } from "@fastify/multipart";
import path from "node:path";
import fastifyCors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import fastifySwagger from "@fastify/swagger";
import ScalarApiReference from "@scalar/fastify-api-reference";
import fastify from "fastify";
import {
	jsonSchemaTransform,
	serializerCompiler,
	validatorCompiler,
	type ZodTypeProvider,
} from "fastify-type-provider-zod";
import {
	bodyLimit,
	serverAddress,
	storagePath,
} from "./config/server.config";
import { uploadRoutes } from "./routes/upload.routes";
const serverAddressUrl = serverAddress;
const server = fastify({
	logger: true,
			bodyLimit: bodyLimit,
}
).withTypeProvider<ZodTypeProvider>();
server.setValidatorCompiler(validatorCompiler);
server.setSerializerCompiler(serializerCompiler);
server.register(fastifyMultipart, {
	limits: {
		fileSize: 10 * 1024 * 1024, // Limite de 10MB por arquivo
	},
});
server.register(fastifyCors, {
	origin: "*",
	methods: ["GET", "POST", "PUT", "DELETE"],
	credentials: true,
});

server.register(fastifyStatic, {
	root: path.join(__dirname, `../${storagePath}`),
	prefix: "/static/",
});

server.register(fastifySwagger, {
	openapi: {
		info: {
			title: "CDN Server",
			version: "1.0.0",
			description: "API para salvar arquivos",
		},
	},
	transform: jsonSchemaTransform,
});

server.register(ScalarApiReference, {
	routePrefix: "/api/docs",
	configuration: {
		theme: "purple",
	},
});

server.register(uploadRoutes,{
	prefix:"/uploads/v1"
})

export default async function StartServer(host: string, port: number) {
	try {
		server.listen({ host, port }, () => {
			console.log(`server iniciado em ${serverAddressUrl}`);
		});
	} catch (error) {
		console.error(error);
		return null;
	}
}
