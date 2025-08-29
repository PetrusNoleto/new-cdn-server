import { databaseConnection } from "../config/server.config";

export interface createImageProps{
    type?:string
    location?:string
    urls?:string
    processed?:boolean
    removeBackground?:boolean
    webhookUrl?:string
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
            return await databaseConnection.images.findMany({
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