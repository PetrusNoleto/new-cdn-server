import path from "node:path";
import { promises as fs } from "node:fs";
import sharp from "sharp";
import { serverAddress } from "../config/server.config";
class StorageService {
	private storageRoot = path.resolve(process.cwd(), "storage");
	private async _processAndSaveImage(
		base64: string,
		relativePath: string,
		fileName: string,
	) {
		const validateBase64 = base64.match(/^data:image\/(\w+);base64,/);
		if (!validateBase64) {
			throw new Error("Formato Base64 inválido ou não suportado");
		}
		const outputFileName = `${fileName}`;
		const fullPath = path.join(this.storageRoot, relativePath, outputFileName);
		const dir = path.dirname(fullPath);
		await fs.mkdir(dir, { recursive: true });

		const buffer = Buffer.from(
			base64.replace(/^data:image\/\w+;base64,/, ""),
			"base64",
		);
		await sharp(buffer).webp({ quality: 100 }).toFile(`${fullPath}.webp`);
		await sharp(buffer).png({ quality: 100 }).toFile(`${fullPath}.png`);
		await sharp(buffer).jpeg({ quality: 100 }).toFile(`${fullPath}.jpeg`);
		const returnObj = (
			{
				location:`/storage/${relativePath}/`,
				urls:{
					webp:`${serverAddress}/static/${relativePath}/${outputFileName}.webp`,
					png:`${serverAddress}/static/${relativePath}/${outputFileName}.png`,
					jpeg:`${serverAddress}/static/${relativePath}/${outputFileName}.jpeg`
				}
			}
		)
		return returnObj;
	}
	async saveImage(base64: string, pathName: string, fileName: string) {
		try {
			const save = await this._processAndSaveImage(
				base64,
				pathName,
				fileName,
			);
			return {
				message: `Imagem salva com sucesso em ${save.location}`,
				data: save,
				error: null,
			};
		} catch (error) {
			return {
				message:
					error instanceof Error ? error.message : "Erro ao salvar imagem",
				data: null,
				error,
			};
		}
	}
	async updateImage(base64: string, pathName: string, fileName: string) {
		return this.saveImage(base64, pathName, fileName);
	}

	async deleteImage(pathName: string, fileName: string) {
		try {
			const fullPath = path.join(
				this.storageRoot,
				pathName,
			);
			await fs.access(fullPath);
			const removePng = await fs.unlink(`${fullPath}/${fileName}.png`);
			const removeWebp =  await fs.unlink(`${fullPath}/${fileName}.webp`);
			const removeJpg =  await fs.unlink(`${fullPath}/${fileName}.jpeg`);
			console.log("Imagem deletada com sucesso")
			return {
				message: "Imagem deletada com sucesso",
				data: null,
				error: null,
			};
		} catch (error) {
			return { message: "Imagem não encontrada", data: null, error };
		}
	}
}

export const storageService = new StorageService();
