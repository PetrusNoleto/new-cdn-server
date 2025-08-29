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
  constructor(image:ImageModelType){
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