import type { Images } from "../../generated/prisma";
import ImageRepository from "../repositories/imageRepository";

export interface factoryImageProps{
    id?:string
    type?:string
    location?:string
    url?:string
    processed?:boolean
    removeBackground?:boolean
    webhookUrl?:string
}
export interface factoryImageReturnProps{
    id?:string
    type:string | null
    location:string | null
    url:string | null
    processed:boolean | null
    removeBackground:boolean | null
    webhookUrl:string | null
}

export interface ImagesUrlsProps{
    "100%"?:string
    "50%"?:string
    "25%"?:string
}

class ImageFactory {
    private id?:string
    private repository:ImageRepository
    private type?:string
    private location?:string
    private processed?:boolean
    private url?:string
    private removeBackground?:boolean
    private webhookUrl?:string
    constructor(data:factoryImageProps){
        this.repository = new ImageRepository()  
        this.id = data.id
        this.type = data.type
        this.location = data.location
        this.url = data.url
        this.processed = data.processed
        this.removeBackground =data.removeBackground
        this.webhookUrl = data.webhookUrl
    }
    public async execute():Promise<"image not saved" | Images>{
        // const factoryUrlsObject ={
        //     "100%":(this.urls && this.urls."100%") ?? null,
        //     "50%":(this.urls && this.urls."50%") ?? null,
        //     "25%":(this.urls && this.urls."25%") ?? null
        // }
        const factoryObject:factoryImageReturnProps = {
            id:this.id ?? undefined,
            type:this.type ?? null,
            url:this.url ?? null,
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