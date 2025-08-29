import { promises as fs } from "node:fs";
import path from "node:path";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";

if (ffmpegStatic) {
	ffmpeg.setFfmpegPath(ffmpegStatic);
}

class VideoService {
	private storageRoot = path.resolve(process.cwd(), "storage");
	async processToHLS(
		tempFilePath: string,
		relativeOutputPath: string,
	): Promise<string> {
		const outputDir = path.join(this.storageRoot, relativeOutputPath);
		await fs.mkdir(outputDir, { recursive: true });

		const qualities = [
			// --- Mobile e Baixa Resolução ---
			{
				resolution: "426x240",
				videoBitrate: 400,
				audioBitrate: "64k",
				name: "240p",
			},
			{
				resolution: "640x360",
				videoBitrate: 800,
				audioBitrate: "96k",
				name: "360p",
			},
			{
				resolution: "854x480",
				videoBitrate: 1400,
				audioBitrate: "128k",
				name: "480p",
			},
			// --- Alta Definição (HD) ---
			{
				resolution: "1280x720",
				videoBitrate: 2500,
				audioBitrate: "128k",
				name: "720p",
			},
			{
				resolution: "1920x1080",
				videoBitrate: 5000,
				audioBitrate: "192k",
				name: "1080p",
			},
			// --- Ultra Alta Definição (QHD & 4K) ---
			{
				resolution: "2560x1440",
				videoBitrate: 9000,
				audioBitrate: "192k",
				name: "1440p",
			},
			{
				resolution: "3840x2160",
				videoBitrate: 20000,
				audioBitrate: "256k",
				name: "2160p", // 4K
			},
		];

		try {
			const masterPlaylistPath = await this._executeFfmpegProcessing(
				tempFilePath,
				outputDir,
				relativeOutputPath,
				qualities,
			);
			return masterPlaylistPath;
		} catch (error) {
			console.error("Falha na orquestração do processamento de vídeo.", error);
			if (await fs.stat(tempFilePath).catch(() => false)) {
				await fs.unlink(tempFilePath);
			}
			throw error;
		}
	}
	private _executeFfmpegProcessing(
		tempFilePath: string,
		outputDir: string,
		relativeOutputPath: string,
		qualities: {
			resolution: string;
			videoBitrate: number;
			audioBitrate: string;
			name: string;
		}[],
	): Promise<string> {
		return new Promise((resolve, reject) => {
			const command = ffmpeg(tempFilePath);
			let masterPlaylistContent = "#EXTM3U\n#EXT-X-VERSION:3\n";

			for (const quality of qualities) {
				const playlistPath = path.join(outputDir, `${quality.name}.m3u8`);
				const segmentPath = path.join(outputDir, `${quality.name}_%03d.ts`);
				command
					.addOutput(playlistPath)
					.videoCodec("libx264")
					.audioCodec("aac")
					.size(quality.resolution)
					.videoBitrate(quality.videoBitrate)
					.audioBitrate(quality.audioBitrate)
					.addOutputOptions([
						"-profile:v main",
						"-crf 20",
						"-g 48",
						"-keyint_min 48",
						"-sc_threshold 0",
						"-hls_time 4",
						"-hls_playlist_type vod",
						`-hls_segment_filename ${segmentPath}`,
					]);

				const bandwidth =
					quality.videoBitrate * 1000 + Number(quality.audioBitrate) * 1000;
				masterPlaylistContent += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${quality.resolution}\n${quality.name}.m3u8\n`;
			}

			// qualities.forEach((q) => {
			// 	const playlistPath = path.join(outputDir, `${q.name}.m3u8`);
			// 	const segmentPath = path.join(outputDir, `${q.name}_%03d.ts`);

			// 	command
			// 		.addOutput(playlistPath)
			// 		.videoCodec("libx264")
			// 		.audioCodec("aac")
			// 		.size(q.resolution)
			// 		.videoBitrate(q.videoBitrate)
			// 		.audioBitrate(q.audioBitrate)
			// 		.addOutputOptions([
			// 			"-profile:v main",
			// 			"-crf 20",
			// 			"-g 48",
			// 			"-keyint_min 48",
			// 			"-sc_threshold 0",
			// 			"-hls_time 4",
			// 			"-hls_playlist_type vod",
			// 			`-hls_segment_filename ${segmentPath}`,
			// 		]);

			// 	const bandwidth =
			// 		q.videoBitrate * 1000 + parseInt(q.audioBitrate, 10) * 1000;
			// 	masterPlaylistContent += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${q.resolution}\n${q.name}.m3u8\n`;
			// });

			command
				.on("progress", (progress) => {
					console.log(
						`[FFmpeg] Processando: ${Math.floor(progress.percent as number)}% done`,
					);
				})
				.on("end", async () => {
					console.log("[FFmpeg] Transcodificação finalizada com sucesso.");
					try {
						const masterPlaylistPath = path.join(outputDir, "master.m3u8");
						await fs.writeFile(masterPlaylistPath, masterPlaylistContent);
						await fs.unlink(tempFilePath); // Limpa o temporário no sucesso
						resolve(path.join(relativeOutputPath, "master.m3u8"));
					} catch (err) {
						reject(err);
					}
				})
				.on("error", async (err) => {
					console.error("[FFmpeg] Erro na transcodificação:", err.message);
					await fs.unlink(tempFilePath); // Limpa o temporário no erro
					reject(
						new Error(`Falha na transcodificação do vídeo: ${err.message}`),
					);
				});

			command.run();
		});
	}
}

export const videoService = new VideoService();
