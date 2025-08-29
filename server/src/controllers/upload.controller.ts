import { FastifyReply, FastifyRequest } from "fastify";
import { storageService } from "../services/StorageService";
import { randomUUID } from "node:crypto";
import { pipeline } from "node:stream";
import fs,{ createWriteStream } from "node:fs";
import { promisify } from "node:util";
import { extname, resolve } from "node:path";
import { serverAddress } from "../config/server.config";
import ImageFactory from "../factories/ImageFactory";
const pump = promisify(pipeline);
class UploadController {
    public async image(request: FastifyRequest, reply: FastifyReply){
		const newId = randomUUID()
        const upload = await request.file();
		if (!upload) {
			return reply.status(400).send({ message: "Nenhum arquivo enviado." });
		}
		if (!upload.mimetype.startsWith("image/")) {
			return reply.status(400).send({
				message: "Tipo de arquivo inválido. Apenas imagens são permitidas.",
			});
		}
		try {
			const buffer = await upload.toBuffer();
			const base64 = `data:${upload.mimetype};base64,${buffer.toString("base64")}`;
			const saveOnDisk = await storageService.saveImage(
                base64,
                `images/uploads`,
                newId)
            if (saveOnDisk.error !== null) {
                return reply.status(400).send({ message: "Erro ao salvar o arquivo." });
            }
            const saveInDatabase = await new ImageFactory({
                id:newId,
                location:saveOnDisk.data?.location,
                urls:saveOnDisk.data?.urls
            }).execute()
            if(saveInDatabase === "image not saved"){
                const deleteImage = await storageService.deleteImage(`images/uploads`,newId)

                return reply.status(400).send({ message: "Erro ao salvar o arquivo.",data:deleteImage});
            }
           return reply.status(201).send(saveInDatabase); 
		} catch (error) {
			console.error("Erro no upload de avatar:", error);
			return reply
				.status(500)
				.send({ message: "Erro interno ao processar o arquivo." });
		}
    }
    public async video(request: FastifyRequest, reply: FastifyReply){
    const upload = await request.file();
    if (!upload) {
        return reply.status(400).send({ message: "Nenhum arquivo enviado." });
    }
    if (!upload.mimetype.startsWith("video/")) {
        return reply.status(400).send({
            message: "Tipo de arquivo inválido. Apenas vídeos são permitidos.",
        });
    }
    try {
            const fileExtension = extname(upload.filename);
            const newName = randomUUID()
            const createFile = fs.mkdirSync(`storage/videos/${newName}`,{
                recursive:true
            })
            if(!createFile){
                return reply.status(400).send({
                    message: "Arquivo não criado.",
                });
            }

            const newFilename = `${newName}${fileExtension}`; 
           
            const uploadPath = resolve(process.cwd(), `storage/videos/${newName}`); 
            const writeStream = createWriteStream(`${uploadPath}/${newFilename}`);
            await pump(upload.file, writeStream);
            return reply.status(201).send({
                message: "Upload de vídeo realizado com sucesso!",
                filename: `${serverAddress}/static/videos/${newName}/${newFilename}`,
            });
        } catch (error) {
            console.error("Erro no upload de vídeo:", error);
            return reply
                .status(500)
                .send({ message: "Erro interno ao processar o arquivo." });
        }
    }
}
export const uploadController = new UploadController()
export default uploadController