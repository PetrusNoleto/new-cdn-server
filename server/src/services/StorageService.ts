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
				webp:`${serverAddress}/static/${relativePath}/${outputFileName}.webp`,
				png:`${serverAddress}/static/${relativePath}/${outputFileName}.png`,
				jpeg:`${serverAddress}/static/${relativePath}/${outputFileName}.jpeg`
			}
		)
		return {
			relativePath: `/${relativePath}/${outputFileName}`,
			publicUrl: `${serverAddress}/static/${relativePath}/${outputFileName}`,
			files:returnObj
		};
	}
	async saveImage(base64: string, pathName: string, fileName: string) {
		try {
			const { files, relativePath } = await this._processAndSaveImage(
				base64,
				pathName,
				fileName,
			);
			return {
				message: `Imagem salva com sucesso em /storage${relativePath}`,
				data: files,
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
				`${fileName}.webp`,
			);
			await fs.access(fullPath);
			await fs.unlink(fullPath);
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
