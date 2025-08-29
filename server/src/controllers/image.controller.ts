import { FastifyReply, FastifyRequest } from "fastify";
import { storageService } from "../services/StorageService";
import { randomUUID } from "node:crypto";
import ImageFactory from "../factories/ImageFactory";
import ImageRepository from "../repositories/imageRepository";
class ImageController {
    public async upload(request: FastifyRequest, reply: FastifyReply){
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
    public async find(request: FastifyRequest, reply: FastifyReply){
        const {id} = request.params as {id:string}
        try{
            const getImage = await new ImageRepository().find(id)
            if(!getImage){
                return reply.status(404).send({message:"image not found",data:null})
            }
            const {urls,createdAt,updated,...rest} = getImage
            const newReturnImage = {
                ...rest,
                urls:urls ? JSON.parse(urls) : null,
                createdAt,
                updated
            }
            return reply.status(200).send({message:"image found",data:newReturnImage})
        }catch(error){
            console.error(error)
            return reply.status(500).send({message:"internal server error",data:null})
        }
    }
    public async listToRemoveBackground(request: FastifyRequest, reply: FastifyReply){

    }
    public async listProcessed(request: FastifyRequest, reply: FastifyReply){

    }
}
export const imageController = new ImageController()
export default imageController