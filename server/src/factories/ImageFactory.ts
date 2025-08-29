import type { Images } from "../../generated/prisma";
import ImageRepository from "../repositories/imageRepository";

export interface factoryImageProps{
    id?:string
    type?:string
    location?:string
    urls?:ImagesUrlsProps
    processed?:boolean
    removeBackground?:boolean
    webhookUrl?:string
}
export interface factoryImageReturnProps{
    id?:string
    type:string | null
    location:string | null
    urls:string | null
    processed:boolean | null
    removeBackground:boolean | null
    webhookUrl:string | null
}

export interface ImagesUrlsProps{
    png?:string
    jpeg?:string
    webp?:string
}

class ImageFactory {
    private id?:string
    private repository:ImageRepository
    private type?:string
    private location?:string
    private processed?:boolean
    private urls?:ImagesUrlsProps
    private removeBackground?:boolean
    private webhookUrl?:string
    constructor(data:factoryImageProps){
        this.repository = new ImageRepository()  
        this.id = data.id
        this.type = data.type
        this.location = data.location
        this.urls = data.urls
        this.processed = data.processed
        this.removeBackground =data.removeBackground
        this.webhookUrl = data.webhookUrl
    }
    public async execute():Promise<"image not saved" | Images>{
        const factoryUrlsObject ={
            png:(this.urls && this.urls.png) ?? null,
            jpeg:(this.urls && this.urls.jpeg) ?? null,
            webp:(this.urls && this.urls.webp) ?? null
        }
        const factoryObject:factoryImageReturnProps = {
            id:this.id ?? undefined,
            type:this.type ?? null,
            urls:JSON.stringify(factoryUrlsObject) ?? null,
            location:this.location ?? null,
            processed:this.processed ?? null,
            removeBackground:this.removeBackground ?? null,
            webhookUrl:this.webhookUrl ?? null
        }
        const saveInDatabase = await this.repository.create(factoryObject)
        if(!saveInDatabase){
            return "image not saved"
        }
        return saveInDatabase
    }
}
export default ImageFactory