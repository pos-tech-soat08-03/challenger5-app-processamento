import { NotificationServiceInterface } from "../../Core/Interfaces/Services/NotificationServiceInterface";
import { MessageStatusEntity } from "../../Core/Entity/MessageStatusEntity";
import { MessageErrorEntity } from "../../Core/Entity/MessageErrorEntity";
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
    videoData: MessageVideoData,
    notificationService: NotificationServiceInterface
  ): Promise<void> {
    const framesDir = path.join(path.dirname(videoPath), "frames");
    await fsPromises.mkdir(framesDir, { recursive: true });
    const outputPattern = path.join(
      framesDir,
      `frame-%04d.${videoData.config.outputFormat}`
    );
    const notifiedPercentages = new Set<number>([0]);

    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .outputOptions([
          `-vf fps=${videoData.config.interval}`,
          `-s ${videoData.config.resolution}`,
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
              videoData.video.idVideo,
              videoData.user.idUsuario,
              "PROCESSING",
              milestone
            );
            notificationService
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
            videoData.video.idVideo,
            videoData.user.idUsuario,
            status,
            err.message
          );
          notificationService
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
