import ImageRepository from "../repositories/imageRepository"

export interface ImageModelType{
  id:string
  type?:string
  location?:string
  urls?:string
  processed?:boolean
  removeBackground?:boolean
  backgroundRemovedIn?:Date
  backgroundRemovedUrl?:string
  webhookUrl?:string
  createdAt:Date 
  updated?:Date
}

class Image {
  private repository:ImageRepository
  private id:string
  private type?:string
  private location?:string
  private urls?:string
  private processed?:boolean
  private removeBackground?:boolean
  private backgroundRemovedIn?:Date
  private backgroundRemovedUrl?:string
  private webhookUrl?:string
  private createdAt:Date 
  private updated?:Date
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