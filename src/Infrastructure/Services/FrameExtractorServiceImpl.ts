import { NotificationServiceInterface } from "../../Core/Interfaces/Services/NotificationServiceInterface";
import { MessageStatusEntity } from "../../Core/Entity/MessageStatusEntity";
import { MessageErrorEntity } from "../../Core/Entity/MessageErrorEntity";
import { VideoEntity } from "../../Core/Entity/VideoEntity";
import { MessageVideoData } from "../../Core/Entity/MessageVideoData";
import * as fsPromises from "fs/promises";
import * as path from "path";
import ffmpeg from "fluent-ffmpeg";
import { FrameExtractorServiceInterface } from "../../Core/Interfaces/Services/FrameExtractorServiceInterface";

export class FrameExtractorServiceImpl
  implements FrameExtractorServiceInterface
{
  async extractFrames(
    videoPath: string,
    config: MessageVideoData["config"],
    video: VideoEntity,
    notificationRepo: NotificationServiceInterface
  ): Promise<void> {
    const outputDir = "/tmp/frames";
    await fsPromises.mkdir(outputDir, { recursive: true });
    const outputPattern = path.join(
      outputDir,
      `frame-%04d.${config.outputFormat}`
    );
    const notifiedPercentages = new Set<number>([0]);

    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .outputOptions([
          `-vf fps=1/${config.interval}`,
          `-s ${config.resolution}`,
        ])
        .output(outputPattern)
        .on("progress", (progress) => {
          const currentPercent =
            progress.percent !== undefined
              ? Math.min(progress.percent, 99)
              : 10;
          const milestone = Math.floor(currentPercent / 20) * 20;
          if (!notifiedPercentages.has(milestone) && milestone > 0) {
            notifiedPercentages.add(milestone);
            const processingStatus = MessageStatusEntity.create(
              video.getId(),
              video.getUsuarioId(),
              "PROCESSING",
              milestone
            );
            notificationRepo
              .informarStatus(processingStatus)
              .catch((err) =>
                console.error("Erro ao notificar progresso:", err)
              );
          }
        })
        .on("end", () => {
          console.log("Frames extraídos com sucesso.");
          resolve();
        })
        .on("error", (err) => {
          console.error("Erro ao extrair frames:", err);
          const status = err.message.includes("killed with signal")
            ? "INTERRUPTED"
            : "ERROR";
          const errorStatus = MessageErrorEntity.create(
            video.getId(),
            video.getUsuarioId(),
            status,
            err.message
          );
          notificationRepo
            .informarStatus(errorStatus)
            .catch((notifyErr) =>
              console.error("Erro ao notificar falha:", notifyErr)
            )
            .finally(() => reject(err));
        })
        .run();
    });
  }
}
