import { databaseConnection } from "../config/server.config";

export interface createImageProps{
    id?:string
    type:string | null
    location:string | null
    url:string | null
    processed:boolean | null
    removeBackground:boolean | null
    webhookUrl:string | null
}

class ImageRepository {
    public async create(data:createImageProps){
        try{
            return await databaseConnection.images.create({
                data
            })
        }catch(error){
            return null
        }
    }
    public async find(id:string){
        try{
            return await databaseConnection.images.findUnique({
                where:{
                    id
                }
            })
        }catch(error){
            return null
        }
    }
}
export default ImageRepository