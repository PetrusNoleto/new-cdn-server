import ImageRepository from "../repositories/imageRepository"

export interface ImageModelType{
  id:string
  type:string | null
  location:string | null
  urls:string | null
  processed:boolean | null
  removeBackground:boolean | null
  backgroundRemovedIn:Date | null
  backgroundRemovedUrl:string | null
  webhookUrl:string | null
  createdAt:Date 
  updated:Date | null
}

class Image {
  private repository:ImageRepository
  private id:string
  private type:string | null
  private location:string | null
  private urls:string | null
  private processed:boolean | null
  private removeBackground:boolean | null
  private backgroundRemovedIn:Date | null
  private backgroundRemovedUrl:string | null
  private webhookUrl:string | null
  private createdAt:Date 
  private updated:Date | null
  constructor(image:ImageModelType){
    this.repository = new ImageRepository()   
    this.id = image.id
    this.type = image.type
    this.location = image.location
    this.urls = image.urls
    this.processed = image.processed
    this.removeBackground = image.removeBackground
    this.backgroundRemovedIn = image.backgroundRemovedIn
    this.backgroundRemovedUrl = image.backgroundRemovedUrl
    this.webhookUrl = image.webhookUrl
    this.createdAt = image.createdAt
    this.updated = image.updated
  }  
}
export default Image