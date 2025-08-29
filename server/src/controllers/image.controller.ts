import { FastifyReply, FastifyRequest } from "fastify";
import { storageService } from "../services/StorageService";
import { randomUUID } from "node:crypto";
import ImageFactory from "../factories/ImageFactory";
import ImageRepository from "../repositories/imageRepository";
import { Multipart, MultipartFile } from '@fastify/multipart';

class ImageController {
    public async upload(request: FastifyRequest, reply: FastifyReply){
		
        const {removeBackground,webhookUrl} = request.query as {removeBackground?:string,webhookUrl?:string}
        const images = request.body as { [key: string]: MultipartFile | MultipartFile[] };
        const partsList: Multipart[] = Object.values(images).flat();
        // const upload = await request.file();
		if (partsList.length === 0) {
			return reply.status(400).send({ message: "Nenhum arquivo enviado." });
		}
        const savedImages = []
        for(const image of partsList){
          const newId = randomUUID()
          if (!image.mimetype.startsWith("image/")) {
			return reply.status(400).send({
				message: "Tipo de arquivo inválido. Apenas imagens são permitidas.",
			});
		 }
         if(image.type === "file"){
            const buffer = await image.toBuffer();
            const extension = image.mimetype.split("/")[1]
		    const base64 = `data:${image.mimetype};base64,${buffer.toString("base64")}`;
            const saveOnDisk = await storageService.saveImage(
            base64,
            `images/uploads`,
            `${newId}.${extension}`,
            extension    
        )
            if (saveOnDisk.error !== null) {
                savedImages.push({
                    image:newId,
                    saved:false,
                    deleted:false
                 })
            }
            const saveInDatabase = await new ImageFactory({
                id:newId,
                removeBackground:removeBackground && removeBackground === "true" ? true : false,
                webhookUrl,
                location:saveOnDisk.data?.location,
                url:saveOnDisk.data?.url
            }).execute()
            if(saveInDatabase === "image not saved"){
                const deleteImage = await storageService.deleteImage(`images/uploads`,newId)
                 savedImages.push({
                    image:newId,
                    saved:deleteImage.message !== "Imagem deletada com sucesso" ? true : false,
                    deleted:deleteImage.message === "Imagem deletada com sucesso" ? true : false
                 })
            }else{
                 savedImages.push({
                    image:newId,
                    saved:true,
                    deleted:false
                 })
            }
           
         }  
        }
        return reply.status(201).send(savedImages); 
		// try {
		// 	// const buffer = await upload.toBuffer();
		// 	// const base64 = `data:${upload.mimetype};base64,${buffer.toString("base64")}`;
		// 	// const saveOnDisk = await storageService.saveImage(
        //     //     base64,
        //     //     `images/uploads`,
        //     //     newId)
        //     // if (saveOnDisk.error !== null) {
        //     //     return reply.status(400).send({ message: "Erro ao salvar o arquivo." });
        //     // }
        //     // const saveInDatabase = await new ImageFactory({
        //     //     id:newId,
        //     //     removeBackground:removeBackground && removeBackground === "true" ? true : false,
        //     //     webhookUrl,
        //     //     location:saveOnDisk.data?.location,
        //     //     urls:saveOnDisk.data?.urls
        //     // }).execute()
        //     // if(saveInDatabase === "image not saved"){
        //     //     const deleteImage = await storageService.deleteImage(`images/uploads`,newId)

        //     //     return reply.status(400).send({ message: "Erro ao salvar o arquivo.",data:deleteImage});
        //     // }
        // //    return reply.status(201).send(saveInDatabase); 
		// } catch (error) {
		// 	console.error("Erro no upload de avatar:", error);
		// 	return reply
		// 		.status(500)
		// 		.send({ message: "Erro interno ao processar o arquivo." });
		// }
    }
    public async find(request: FastifyRequest, reply: FastifyReply){
        const {id} = request.params as {id:string}
        try{
            const getImage = await new ImageRepository().find(id)
            if(!getImage){
                return reply.status(404).send({message:"image not found",data:null})
            }
            return reply.status(200).send({message:"image found",data:getImage})
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