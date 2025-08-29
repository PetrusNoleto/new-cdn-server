import { promises as fs } from "node:fs";
import path from "node:path";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";

// Configura o caminho para o executável do FFmpeg
if (ffmpegStatic) {
    ffmpeg.setFfmpegPath(ffmpegStatic);
}

class RemoveBackGroundImageService {
    public async removeBackground(
        inputPath: string,
        outputPath: string,
        colorToRemove: string,
        similarity: number = 0.3,
        blend: number = 0.2,
    ): Promise<void> {
        // Valida o formato da cor de entrada
        if (!/^#[0-9a-fA-F]{6}$/.test(colorToRemove)) {
            throw new Error(
                "Formato de cor inválido. Use o formato hexadecimal #RRGGBB.",
            );
        }

        // Garante que o diretório de saída exista
        const outputDir = path.dirname(outputPath);
        await fs.mkdir(outputDir, { recursive: true });

        // Converte a cor hexadecimal para o formato que o FFmpeg espera (0xRRGGBB)
        const ffmpegColor = colorToRemove.replace("#", "0x");

        return new Promise<void>((resolve, reject) => {
            console.log(`Iniciando remoção de fundo para: ${inputPath}`);

            ffmpeg(inputPath)
                // Aplica o filtro 'colorkey'
                // Formato: colorkey=color:similarity:blend
                .videoFilter(
                    `colorkey=${ffmpegColor}:${similarity}:${blend}`,
                )
                // Adiciona uma opção para garantir que o formato de pixel suporte transparência (alpha channel)
                .outputOptions("-pix_fmt yuva420p")
                .save(outputPath) // Salva o arquivo de saída
                .on("end", () => {
                    console.log(
                        `Fundo removido com sucesso. Imagem salva em: ${outputPath}`,
                    );
                    resolve();
                })
                .on("error", (err: Error) => {
                    console.error(
                        "Erro ao remover o fundo da imagem:",
                        err.message,
                    );
                    reject(
                        new Error(
                            `Falha no processamento do FFmpeg: ${err.message}`,
                        ),
                    );
                });
        });
    }
}

export const removeBackGroundImageService = new RemoveBackGroundImageService();