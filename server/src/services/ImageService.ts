import path from "node:path";
import fs from "node:fs";
import sharp from "sharp";
import { serverAddress, storagePath } from "../config/server.config";
class ImageService {
	private base64: string;
	private pathName: string;
	private fileName: string;
	constructor(base64: string, pathName: string, fileName: string) {
		this.base64 = base64;
		this.pathName = pathName;
		this.fileName = fileName;
	}
	private validateBase64() {
		return this.base64.match(/^data:image\/(\w+);base64,/);
	}
	private removeBase64Prefix() {
		return this.base64.replace(/^data:image\/\w+;base64,/, "");
	}
	private async createBase64Buffer() {
		return Buffer.from(this.removeBase64Prefix(), "base64");
	}
	private async converToPng() {
		const getBuffer = await this.createBase64Buffer();
		return sharp(getBuffer).png();
	}
	private getFilePath() {
		return path.join(
			__dirname,
			`../../../${storagePath}`,
			`${this.pathName}`,
			`${this.fileName}.png`,
		);
	}
	private async verfifyPathExists(): Promise<boolean> {
		const pathFile = this.getFilePath();
		const dir = path.dirname(pathFile);
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}
		return true;
	}
	public async save() {
		const validateBase64 = this.validateBase64();
		const validatePath = this.verfifyPathExists();
		if (!validateBase64) {
			return "image base64 is invalid";
		}
		if (!validatePath) {
			return "Image Folder is invalid";
		}
		const getImageConverted = this.converToPng();
		if (!getImageConverted) {
			return "Error To Convert Image";
		}
		const saveImage = (await getImageConverted).toFile(this.getFilePath());
		if (!saveImage) {
			return "image not saved";
		}
		return `${serverAddress}/static/${this.pathName}/${this.fileName}.png`;
	}
}
export default ImageService;
